import { create } from 'zustand'
import type { AgentBrain, AgentId, AgentRuntime, AgentState } from '../agents/types'
import { agentRegistry, specialistIds } from '../agents/registry'
import { canSendMessageType } from '../agents/permissions'
import type { AgentMessage, MessageType } from '../communication/types'
import { messageBus } from '../communication/messageBus'
import { emptyMemory, SHORT_TERM_LIMIT, LONG_TERM_LIMIT, type AgentMemoryState, type TaskStatus } from '../memory/types'
import { toolsForAgent } from '../tools/registry'
import { resolveLLM } from '../llm/registry'
import { listOllamaModels } from '../llm/providers/ollama'
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
  messages: AgentMessage[]
  simulationRunning: boolean
  localModelStatus: LocalModelStatus

  enter: () => void
  goTo: (view: View) => void
  startSimulation: () => void
  stopSimulation: () => void
  triggerSpecialist: (id: AgentId) => void
  connectLocalModel: () => Promise<void>
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

  return {
    view: 'intro',
    runtimes: initialRuntimes(),
    memories: initialMemories(),
    brains: initialBrains(),
    messages: [],
    simulationRunning: false,
    localModelStatus: 'disconnected',

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
  }
})
