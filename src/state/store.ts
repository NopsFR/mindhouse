import { create } from 'zustand'
import type { AgentBrain, AgentId, AgentRuntime, AgentState } from '../agents/types'
import { agentRegistry, specialistIds } from '../agents/registry'
import { canSendMessageType } from '../agents/permissions'
import type { AgentMessage, MessageType } from '../communication/types'
import { messageBus } from '../communication/messageBus'
import { emptyMemory, SHORT_TERM_LIMIT, LONG_TERM_LIMIT, type AgentMemoryState, type TaskStatus } from '../memory/types'
import type { ChatMessage } from '../conversation/types'
import {
  classifyIntent,
  continuationReply,
  detectRelevantSpecialists,
  outOfDomainReply,
  pickChitchat,
  pickGreeting,
  topicClarification,
} from '../conversation/intents'
import { matchKnowledge, matchKnowledgeAnywhere } from '../conversation/knowledge'
import { buildSystemPrompt } from '../agents/prompt'
import { toolsForAgent } from '../tools/registry'
import { resolveLLM } from '../llm/registry'
import { listOllamaModels } from '../llm/providers/ollama'
import type { LLMMessage, ToolSpec } from '../llm/types'
import { checkDevToolsAvailable } from '../devtools/client'
import { toolsForLevel } from '../devtools/registry'
import type { AutonomyLevel, DevTool, ToolActivityRecord } from '../devtools/types'
import {
  buildBriefingPrompt,
  buildCorrelationPrompt,
  buildMemoryPrompt,
  confidenceFor,
  decideCorrelationTarget,
  randomBetween,
  sleep,
} from '../simulation/engine'
import { makeId } from './id'

export type View = 'intro' | 'facility' | AgentId
export type LocalModelStatus = 'disconnected' | 'connecting' | 'connected' | 'unavailable'

interface FacilityState {
  view: View
  runtimes: Record<AgentId, AgentRuntime>
  memories: Record<AgentId, AgentMemoryState>
  /** Mutable — the registry only supplies defaults. This is what actually changes when a real model connects. */
  brains: Record<AgentId, AgentBrain>
  /** What the user actually said to each agent, and what it said back — never the agent's internal memory. */
  conversations: Record<AgentId, ChatMessage[]>
  messages: AgentMessage[]
  simulationRunning: boolean
  localModelStatus: LocalModelStatus
  /** True only when the local-only Vite dev-tools plugin actually responded — never true on the deployed site. */
  devToolsAvailable: boolean
  workspaceRoot: string | null
  autonomyLevel: AutonomyLevel
  /** Real tool-call log per agent — every entry is an actual request/response, never fabricated. */
  toolActivity: Record<AgentId, ToolActivityRecord[]>

  enter: () => void
  goTo: (view: View) => void
  startSimulation: () => void
  stopSimulation: () => void
  triggerSpecialist: (id: AgentId) => void
  connectLocalModel: () => Promise<void>
  checkDevTools: () => Promise<void>
  setAutonomyLevel: (level: AutonomyLevel) => void
  sendChatMessage: (agentId: AgentId, text: string) => Promise<void>
}

function initialRuntimes(): Record<AgentId, AgentRuntime> {
  const runtimes = {} as Record<AgentId, AgentRuntime>
  for (const id of Object.keys(agentRegistry) as AgentId[]) {
    runtimes[id] = { id, state: 'idle', activity: null, currentTaskId: null, lastActivityAt: Date.now() }
  }
  return runtimes
}

function initialMemories(): Record<AgentId, AgentMemoryState> {
  const memories = {} as Record<AgentId, AgentMemoryState>
  for (const id of Object.keys(agentRegistry) as AgentId[]) {
    memories[id] = emptyMemory()
  }
  return memories
}

function initialBrains(): Record<AgentId, AgentBrain> {
  const brains = {} as Record<AgentId, AgentBrain>
  for (const id of Object.keys(agentRegistry) as AgentId[]) {
    brains[id] = { ...agentRegistry[id].brain }
  }
  return brains
}

function initialConversations(): Record<AgentId, ChatMessage[]> {
  const conversations = {} as Record<AgentId, ChatMessage[]>
  for (const id of Object.keys(agentRegistry) as AgentId[]) {
    conversations[id] = []
  }
  return conversations
}

function initialToolActivity(): Record<AgentId, ToolActivityRecord[]> {
  const activity = {} as Record<AgentId, ToolActivityRecord[]>
  for (const id of Object.keys(agentRegistry) as AgentId[]) {
    activity[id] = []
  }
  return activity
}

/**
 * Only reached once a question has already failed the knowledge base AND
 * doesn't match any specialist's domain — a genuinely unanswerable request
 * in heuristic mode. Still an invitation, not an error.
 */
function genericFallback(): string {
  return "I don't have real depth on that without a connected model — connect one from my room and I can actually help, or ask me something I've got solid info on."
}

/** Jarvis's fallback still points somewhere useful when a specialist's domain is relevant, instead of a flat dead end. */
function jarvisFallback(text: string): string {
  const specialist = detectRelevantSpecialists(text)[0]
  if (specialist) {
    return `I don't have detail on that without a connected model — ${specialist.name} might know more if you ask directly, or connect a local model from my room.`
  }
  return genericFallback()
}

let simulationTimer: ReturnType<typeof setTimeout> | null = null
let jarvisBusy = false
const jarvisQueue: AgentMessage[] = []

export const useFacilityStore = create<FacilityState>((set, get) => {
  function setRuntime(id: AgentId, patch: Partial<AgentRuntime>) {
    set((s) => ({
      runtimes: { ...s.runtimes, [id]: { ...s.runtimes[id], ...patch, lastActivityAt: Date.now() } },
    }))
  }

  function setAgentState(id: AgentId, state: AgentState, activity: string | null) {
    setRuntime(id, { state, activity })
  }

  function addMemory(id: AgentId, tier: 'shortTerm' | 'longTerm', content: string, source: string, isMock: boolean) {
    const entry = { id: makeId('mem'), timestamp: Date.now(), content, source, isMock }
    const limit = tier === 'shortTerm' ? SHORT_TERM_LIMIT : LONG_TERM_LIMIT
    set((s) => {
      const current = s.memories[id]
      const next = [entry, ...current[tier]].slice(0, limit)
      return { memories: { ...s.memories, [id]: { ...current, [tier]: next } } }
    })
  }

  function addTask(id: AgentId, title: string, toolId: string | null) {
    const task = {
      id: makeId('task'),
      agentId: id,
      toolId,
      title,
      status: 'queued' as TaskStatus,
      priority: 'normal' as const,
      createdAt: Date.now(),
      completedAt: null as number | null,
    }
    set((s) => ({ memories: { ...s.memories, [id]: { ...s.memories[id], tasks: [task, ...s.memories[id].tasks].slice(0, 12) } } }))
    return task
  }

  function setTaskStatus(id: AgentId, taskId: string, status: TaskStatus) {
    set((s) => ({
      memories: {
        ...s.memories,
        [id]: {
          ...s.memories[id],
          tasks: s.memories[id].tasks.map((t) =>
            t.id === taskId ? { ...t, status, completedAt: status === 'done' || status === 'failed' ? Date.now() : t.completedAt } : t,
          ),
        },
      },
    }))
  }

  function recordRelationship(a: AgentId, b: AgentId, summary: string) {
    set((s) => {
      const memA = s.memories[a]
      const relA = { with: b, interactionCount: (memA.relationships[b]?.interactionCount ?? 0) + 1, lastInteractionAt: Date.now(), lastSummary: summary }
      return { memories: { ...s.memories, [a]: { ...memA, relationships: { ...memA.relationships, [b]: relA } } } }
    })
  }

  /** The permission boundary for communication: an agent that lacks the right to send a message type never does. */
  function send(from: AgentId, to: AgentId, type: MessageType, content: string, opts: Partial<AgentMessage> = {}): AgentMessage | null {
    const definition = agentRegistry[from]
    if (!canSendMessageType(definition, type)) return null
    const message: AgentMessage = { id: makeId('msg'), from, to, type, content, priority: 'normal', timestamp: Date.now(), ...opts }
    set((s) => ({ messages: [message, ...s.messages].slice(0, 60) }))
    messageBus.publish(message)
    recordRelationship(from, to, content)
    recordRelationship(to, from, content)
    return message
  }

  function appendChat(agentId: AgentId, message: ChatMessage) {
    set((s) => ({ conversations: { ...s.conversations, [agentId]: [...s.conversations[agentId], message].slice(-40) } }))
  }

  function agentChatMessage(content: string, extra: Partial<ChatMessage> = {}): ChatMessage {
    return { id: makeId('chat'), role: 'agent', content, timestamp: Date.now(), ...extra }
  }

  /** Builds a real chat-completion request from persona + recent turns — never from intelligence memory. */
  function buildChatPrompt(agentId: AgentId, latestUserText: string, extraContext?: string): LLMMessage[] {
    const def = agentRegistry[agentId]
    const history = get().conversations[agentId].slice(-8)
    const messages: LLMMessage[] = [{ role: 'system', content: buildSystemPrompt(def, { hasTools: false }) }]
    for (const turn of history) {
      messages.push({ role: turn.role === 'user' ? 'user' : 'assistant', content: turn.content })
    }
    messages.push({ role: 'user', content: extraContext ? `${extraContext}\n\n${latestUserText}` : latestUserText })
    return messages
  }

  function pushToolActivity(agentId: AgentId, record: ToolActivityRecord) {
    set((s) => ({ toolActivity: { ...s.toolActivity, [agentId]: [record, ...s.toolActivity[agentId]].slice(0, 50) } }))
  }

  /**
   * The bridge between the tool-calling loop and the facility's existing intelligence/delegation
   * system. This is what replaces keyword-based forced delegation when a real model is connected:
   * the model itself decides whether to call `consult_specialist`, with what objective — it is a
   * genuine tool, not a pre-LLM routing gate. `check_current_info` gives every agent (including
   * specialists) the same self-serve access to their own current-information tools.
   */
  function buildBridgeTools(agentId: AgentId) {
    const def = agentRegistry[agentId]
    const tools: DevTool[] = []

    if (def.toolIds.length > 0) {
      tools.push({
        name: 'check_current_info',
        description: `Check your own current-information sources for something time-sensitive — covers: ${def.responsibilities.join(', ')}. Use this only when the answer genuinely depends on up-to-date information, not for things you already know.`,
        permission: 'read',
        parameters: { type: 'object', properties: {}, required: [] },
        async run() {
          const found = await researchForChat(agentId)
          if (!found) return { ok: false, output: 'No current information came back.' }
          return { ok: true, output: `${found.title} — ${found.summary} (source: ${found.sourceLabel})` }
        },
      })
    }

    if (def.isCoordinator) {
      tools.push({
        name: 'consult_specialist',
        description:
          'Ask a specialist colleague to check something using their own current-information tools. Specialists: mancy (Manchester/local), null (cybersecurity), atlas (global/world events), orbit (science/space). Use this only when their live information would genuinely improve your answer — not just because a message mentions their topic.',
        permission: 'read',
        parameters: {
          type: 'object',
          properties: {
            specialist: { type: 'string', description: 'One of: mancy, null, atlas, orbit' },
            objective: { type: 'string', description: 'What you want them to look into.' },
          },
          required: ['specialist'],
        },
        async run(args) {
          const id = String(args.specialist ?? '').toLowerCase() as AgentId
          if (!specialistIds.includes(id)) return { ok: false, output: `"${String(args.specialist)}" isn't a known specialist. Choose one of: ${specialistIds.join(', ')}.` }
          if (get().runtimes[id].state !== 'idle') return { ok: false, output: `${agentRegistry[id].name} is busy right now — try again shortly.` }
          setAgentState('jarvis', 'communicating', `Asking ${agentRegistry[id].name} to look into this`)
          send('jarvis', id, 'question', String(args.objective ?? 'General check-in'))
          const found = await researchForChat(id)
          if (!found) {
            setAgentState('jarvis', 'processing', null)
            return { ok: false, output: `${agentRegistry[id].name} didn't find anything current on that.` }
          }
          send(id, 'jarvis', 'response', `${found.title} — ${found.summary}`)
          setAgentState('jarvis', 'processing', 'Incorporating response')
          return { ok: true, output: `${agentRegistry[id].name} found: ${found.title} — ${found.summary} (source: ${found.sourceLabel})` }
        },
      })
    }

    return tools
  }

  /**
   * The real agent loop: plan -> select a tool -> execute it for real -> observe the actual result ->
   * reason -> repeat, until the model gives a final answer with no further tool calls, or the step
   * cap is hit. Tools are the bridge tools above (always available to a real model) plus the local
   * filesystem/terminal tools (only when the dev-tools server responded and autonomy > 0). Nothing
   * here is simulated — every tool call is a genuine request/response.
   */
  async function runAgentLoop(agentId: AgentId, userText: string): Promise<ChatMessage> {
    const def = agentRegistry[agentId]
    const brain = get().brains[agentId]
    const llm = resolveLLM(brain)
    const devTools = get().devToolsAvailable ? toolsForLevel(get().autonomyLevel) : []
    const tools = [...buildBridgeTools(agentId), ...devTools]
    const toolSpecs: ToolSpec[] = tools.map((t) => ({ name: t.name, description: t.description, parameters: t.parameters }))

    const history = get().conversations[agentId].slice(-8)
    const messages: LLMMessage[] = [{ role: 'system', content: buildSystemPrompt(def, { hasTools: toolSpecs.length > 0 }) }]
    for (const turn of history) messages.push({ role: turn.role === 'user' ? 'user' : 'assistant', content: turn.content })
    messages.push({ role: 'user', content: userText })

    let toolCallCount = 0
    for (let step = 0; step < 8; step++) {
      setAgentState(agentId, step === 0 ? 'thinking' : 'processing', step === 0 ? 'Planning' : 'Reasoning about the result')
      const response = await llm.generate({ messages, tools: toolSpecs })

      if (!response.toolCalls || response.toolCalls.length === 0) {
        setAgentState(agentId, 'idle', null)
        return agentChatMessage(response.content, {
          modelMeta: { providerId: response.providerId, model: response.model, latencyMs: response.latencyMs },
        })
      }

      messages.push({ role: 'assistant', content: response.content, toolCalls: response.toolCalls })

      for (const call of response.toolCalls) {
        toolCallCount++
        const tool = tools.find((t) => t.name === call.name)
        setAgentState(agentId, 'researching', `Using ${call.name}`)
        let output: string
        let ok: boolean
        if (!tool) {
          output = `Tool "${call.name}" isn't available at the current autonomy level.`
          ok = false
        } else {
          try {
            const result = await tool.run(call.arguments)
            output = result.output
            ok = result.ok
          } catch (err) {
            output = `Error: ${err instanceof Error ? err.message : String(err)}`
            ok = false
          }
        }
        pushToolActivity(agentId, { id: makeId('tool'), agentId, tool: call.name, args: call.arguments, ok, output, timestamp: Date.now() })
        messages.push({ role: 'tool', content: output, toolName: call.name })
      }
    }

    setAgentState(agentId, 'idle', null)
    return agentChatMessage(
      `I made ${toolCallCount} tool calls but didn't reach a final answer within my step limit — want me to keep going, or narrow the task?`,
    )
  }

  async function runSpecialistCycle(id: AgentId) {
    const runtime = get().runtimes[id]
    if (runtime.state !== 'idle') return
    const definition = agentRegistry[id]
    const tools = toolsForAgent(definition)
    if (tools.length === 0) return

    setAgentState(id, 'thinking', 'Selecting a task')
    await sleep(randomBetween(300, 600))

    const tool = tools[Math.floor(Math.random() * tools.length)]
    const task = addTask(id, `Run ${tool.name}`, tool.id)
    setTaskStatus(id, task.id, 'active')

    setAgentState(id, 'researching', `Calling ${tool.name}`)
    const result = await tool.execute()
    if (!result.ok || result.items.length === 0) {
      setTaskStatus(id, task.id, 'failed')
      setAgentState(id, 'idle', null)
      return
    }
    const item = result.items[0]

    setAgentState(id, 'processing', 'Synthesizing finding')
    const llm = resolveLLM(get().brains[id])
    const memoryResponse = await llm.generate({ messages: buildMemoryPrompt(definition, item) })
    addMemory(id, 'shortTerm', memoryResponse.content, result.sourceLabel, memoryResponse.isMock)
    setTaskStatus(id, task.id, 'done')

    setAgentState(id, 'communicating', 'Reporting to Jarvis')
    const messageType = item.severity === 'high' ? 'alert' : 'report'
    const message = send(id, 'jarvis', messageType, memoryResponse.content, {
      priority: item.severity === 'high' ? 'critical' : item.severity === 'medium' ? 'high' : 'normal',
      confidence: confidenceFor(item),
      metadata: { tags: item.tags.join(','), toolId: tool.id, isMock: result.isMock },
    })

    await sleep(400)
    setAgentState(id, 'idle', null)

    if (message) {
      jarvisQueue.push(message)
      void drainJarvisQueue()
    }
  }

  async function drainJarvisQueue() {
    if (jarvisBusy) return
    const message = jarvisQueue.shift()
    if (!message) return
    jarvisBusy = true
    await runJarvisCycle(message)
    jarvisBusy = false
    if (jarvisQueue.length > 0) void drainJarvisQueue()
  }

  async function runJarvisCycle(message: AgentMessage) {
    const jarvisDef = agentRegistry.jarvis
    const fromDef = agentRegistry[message.from]

    setAgentState('jarvis', 'thinking', `Reviewing report from ${fromDef.name}`)
    await sleep(randomBetween(300, 600))

    const tags = (message.metadata?.tags as string)?.split(',').filter(Boolean) ?? []
    const target = decideCorrelationTarget(message.from, { id: message.id, title: '', summary: '', timestamp: 0, tags })

    let correlation: { targetName: string; response: string } | null = null

    if (target && get().runtimes[target].state === 'idle') {
      const targetDef = agentRegistry[target]
      setAgentState('jarvis', 'communicating', `Asking ${targetDef.name} to correlate`)
      const request = send('jarvis', target, 'question', `Correlate: ${message.content}`)
      if (request) {
        setAgentState(target, 'thinking', `Correlating with ${fromDef.name}'s report`)
        await sleep(randomBetween(400, 700))
        setAgentState(target, 'processing', 'Checking memory')

        const targetLLM = resolveLLM(get().brains[target])
        // Only a genuine tool-derived finding counts as "what you're tracking" — never a previous correlation
        // check, or answers would nest inside each other, quoting the last quote forever.
        const ownRecent = get().memories[target].shortTerm.find((m) => m.source !== 'correlation')?.content ?? null
        const response = await targetLLM.generate({ messages: buildCorrelationPrompt(targetDef, fromDef.name, message.content, ownRecent) })
        addMemory(target, 'shortTerm', `Correlation check for ${fromDef.name}: ${response.content}`, 'correlation', response.isMock)
        send(target, 'jarvis', 'response', response.content, { confidence: 0.6 + Math.random() * 0.3 })
        setAgentState(target, 'idle', null)

        correlation = { targetName: targetDef.name, response: response.content }
        setAgentState('jarvis', 'processing', 'Incorporating response')
        await sleep(randomBetween(300, 500))
      }
    }

    const jarvisLLM = resolveLLM(get().brains.jarvis)
    const briefing = await jarvisLLM.generate({ messages: buildBriefingPrompt(jarvisDef, fromDef.name, message.content, correlation) })
    addMemory('jarvis', 'longTerm', briefing.content, 'synthesis', briefing.isMock)

    setAgentState('jarvis', 'reporting', 'Updating facility briefing')
    await sleep(500)
    setAgentState('jarvis', 'idle', null)
  }

  function scheduleNext() {
    simulationTimer = setTimeout(() => {
      const state = get()
      if (!state.simulationRunning) return
      const idleSpecialists = specialistIds.filter((id) => state.runtimes[id].state === 'idle')
      if (idleSpecialists.length > 0) {
        const pick = idleSpecialists[Math.floor(Math.random() * idleSpecialists.length)]
        void runSpecialistCycle(pick)
      }
      scheduleNext()
    }, randomBetween(9000, 16000))
  }

  /** A specialist researches something ON DEMAND for a direct chat question — same tools, triggered by conversation instead of the autonomous timer. */
  async function researchForChat(id: AgentId): Promise<{ title: string; summary: string; sourceLabel: string; isMock: boolean } | null> {
    const definition = agentRegistry[id]
    const tools = toolsForAgent(definition)
    if (tools.length === 0) return null
    const tool = tools[Math.floor(Math.random() * tools.length)]
    setAgentState(id, 'researching', `Checking ${tool.name}`)
    const result = await tool.execute()
    if (!result.ok || result.items.length === 0) {
      setAgentState(id, 'idle', null)
      return null
    }
    const item = result.items[0]
    setAgentState(id, 'processing', 'Summarizing')
    addMemory(id, 'shortTerm', `${item.title} — ${item.summary}`, result.sourceLabel, result.isMock)
    setAgentState(id, 'idle', null)
    return { title: item.title, summary: item.summary, sourceLabel: result.sourceLabel, isMock: result.isMock }
  }

  /** Jarvis delegates a user question to one or more specialists, visibly, then answers with the results — never with a memory dump. */
  async function delegateForChat(userText: string): Promise<ChatMessage> {
    const jarvisBrain = get().brains.jarvis
    const candidates = detectRelevantSpecialists(userText).filter((d) => get().runtimes[d.id].state === 'idle')

    if (candidates.length === 0) {
      return agentChatMessage(genericFallback())
    }

    const findings: { specialist: AgentId; name: string; title: string; summary: string; sourceLabel: string }[] = []

    // Sequential, not parallel: each specialist's room visibly goes through its own research cycle before the next starts.
    for (const specialist of candidates) {
      setAgentState('jarvis', 'communicating', `Asking ${specialist.name} to look into this`)
      send('jarvis', specialist.id, 'question', userText)
      await sleep(randomBetween(300, 500))

      const found = await researchForChat(specialist.id)
      if (found) {
        send(specialist.id, 'jarvis', 'response', `${found.title} — ${found.summary}`)
        findings.push({ specialist: specialist.id, name: specialist.name, ...found })
      }
    }

    setAgentState('jarvis', 'processing', 'Answering')
    const isReal = jarvisBrain.provider !== 'mock'
    let reply: string
    let modelMeta: ChatMessage['modelMeta']

    if (findings.length === 0) {
      reply = `I asked ${candidates.map((c) => c.name).join(' and ')}, but nothing current came back on that.`
    } else if (isReal) {
      const llm = resolveLLM(jarvisBrain)
      const findingsText = findings.map((f) => `${f.name} found: "${f.title}: ${f.summary}"`).join(' ')
      const messages = buildChatPrompt(
        'jarvis',
        userText,
        `${findingsText} Answer the user's question naturally in 1-4 sentences, mentioning who you checked with.`,
      )
      const response = await llm.generate({ messages })
      reply = response.content
      modelMeta = { providerId: response.providerId, model: response.model, latencyMs: response.latencyMs }
    } else {
      reply = findings.map((f) => `${f.name}: ${f.title} — ${f.summary}`).join(' ')
    }

    setAgentState('jarvis', 'idle', null)
    return agentChatMessage(reply, {
      modelMeta,
      delegatedTo: findings.length ? findings.map((f) => f.specialist) : undefined,
      sources: findings.length ? findings.map((f) => f.sourceLabel) : undefined,
    })
  }

  return {
    view: 'intro',
    runtimes: initialRuntimes(),
    memories: initialMemories(),
    brains: initialBrains(),
    conversations: initialConversations(),
    messages: [],
    simulationRunning: false,
    localModelStatus: 'disconnected',
    devToolsAvailable: false,
    workspaceRoot: null,
    autonomyLevel: 0,
    toolActivity: initialToolActivity(),

    enter: () => set({ view: 'facility' }),
    goTo: (view) => set({ view }),

    startSimulation: () => {
      if (get().simulationRunning) return
      set({ simulationRunning: true })
      scheduleNext()
      setTimeout(() => void runSpecialistCycle(specialistIds[Math.floor(Math.random() * specialistIds.length)]), 1200)
    },
    stopSimulation: () => {
      set({ simulationRunning: false })
      if (simulationTimer) clearTimeout(simulationTimer)
    },
    triggerSpecialist: (id) => void runSpecialistCycle(id),

    connectLocalModel: async () => {
      set({ localModelStatus: 'connecting' })
      try {
        const models = await listOllamaModels()
        if (models.length === 0) {
          set({ localModelStatus: 'unavailable' })
          return
        }
        const model = models[0]
        set((s) => ({
          brains: { ...s.brains, jarvis: { ...s.brains.jarvis, provider: 'local', model } },
          localModelStatus: 'connected',
        }))
      } catch {
        set({ localModelStatus: 'unavailable' })
      }
    },

    checkDevTools: async () => {
      const { available, workspaceRoot } = await checkDevToolsAvailable()
      set({ devToolsAvailable: available, workspaceRoot })
    },
    setAutonomyLevel: (level) => set({ autonomyLevel: level }),

    sendChatMessage: async (agentId, text) => {
      const trimmed = text.trim()
      if (!trimmed) return
      appendChat(agentId, { id: makeId('chat'), role: 'user', content: trimmed, timestamp: Date.now() })

      const brain = get().brains[agentId]
      const isReal = brain.provider !== 'mock'
      const intent = classifyIntent(trimmed)

      // Greetings/thanks are cheap and universally appropriate — answered the same way regardless of model state.
      if (intent === 'greeting') {
        appendChat(agentId, agentChatMessage(pickGreeting(agentId)))
        return
      }
      if (intent === 'thanks') {
        appendChat(agentId, agentChatMessage('Anytime.'))
        return
      }

      // A connected model is the conversation engine, full stop — no keyword-based forced delegation
      // gate in front of it. If it supports tool-calling, `consult_specialist` and `check_current_info`
      // (see buildBridgeTools) are just tools available to it; the MODEL decides whether to use them,
      // exactly like any other tool call. This is what "Jarvis decides delegation" actually means.
      if (isReal) {
        const llm = resolveLLM(brain)
        if (llm.supportsTools) {
          const reply = await runAgentLoop(agentId, trimmed)
          appendChat(agentId, reply)
          return
        }
        const response = await llm.generate({ messages: buildChatPrompt(agentId, trimmed) })
        appendChat(agentId, agentChatMessage(response.content, { modelMeta: { providerId: response.providerId, model: response.model, latencyMs: response.latencyMs } }))
        return
      }

      // ---- Everything below only runs with NO model connected — the heuristic fallback layer. ----
      // A bare topic or a follow-up is never treated as an unanswerable question — only a specific
      // request that matches nothing at all is. This is intentionally keyword-based: it is a
      // documented, honestly-labeled fallback, not a substitute for real reasoning.
      if (agentId === 'jarvis' && intent === 'research') {
        const reply = await delegateForChat(trimmed)
        appendChat('jarvis', reply)
        return
      }
      if (agentId !== 'jarvis' && intent === 'research') {
        setAgentState(agentId, 'thinking', 'Checking current sources')
        await sleep(randomBetween(300, 500))
        const found = await researchForChat(agentId)
        if (!found) {
          appendChat(agentId, agentChatMessage(`I couldn't find anything current on that right now.`))
          return
        }
        appendChat(agentId, agentChatMessage(`${found.title} — ${found.summary}`, { sources: [found.sourceLabel] }))
        return
      }
      if (intent === 'chitchat') {
        appendChat(agentId, agentChatMessage(pickChitchat()))
        return
      }
      if (intent === 'continuation') {
        appendChat(agentId, agentChatMessage(continuationReply(get().conversations[agentId].length > 1)))
        return
      }
      if (intent === 'topic') {
        if (agentId === 'jarvis') {
          const knowledge = matchKnowledgeAnywhere('jarvis', trimmed)
          if (knowledge) {
            appendChat('jarvis', agentChatMessage(knowledge))
            return
          }
          const specialist = detectRelevantSpecialists(trimmed)[0]
          appendChat(
            'jarvis',
            agentChatMessage(specialist ? topicClarification(specialist, trimmed) : `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)} — tell me a bit more about what you're after.`),
          )
          return
        }
        const ownKnowledge = matchKnowledge(agentId, trimmed)
        appendChat(agentId, agentChatMessage(ownKnowledge ?? topicClarification(agentRegistry[agentId], trimmed)))
        return
      }

      // intent === 'other': a real question or request.
      const knowledge = agentId === 'jarvis' ? matchKnowledgeAnywhere('jarvis', trimmed) : matchKnowledge(agentId, trimmed)
      if (knowledge) {
        appendChat(agentId, agentChatMessage(knowledge))
        return
      }
      appendChat(agentId, agentChatMessage(agentId === 'jarvis' ? jarvisFallback(trimmed) : outOfDomainReply(agentId, trimmed)))
    },
  }
})
