import { create } from 'zustand'
import type { AgentId, AgentRuntime, AgentState } from '../agents/types'
import { agentRegistry, specialistIds } from '../agents/registry'
import type { AgentMessage } from '../communication/types'
import { messageBus } from '../communication/messageBus'
import { emptyMemory, SHORT_TERM_LIMIT, LONG_TERM_LIMIT, type AgentMemoryState } from '../memory/types'
import type { AgentTask } from '../memory/types'
import { providersFor } from '../providers/registry'
import {
  confidenceFor,
  correlatedBriefingLine,
  decideCorrelationTarget,
  randomBetween,
  sleep,
  soloBriefingLine,
} from '../simulation/engine'
import { makeId } from './id'

export type View = 'intro' | 'facility' | AgentId

interface FacilityState {
  view: View
  runtimes: Record<AgentId, AgentRuntime>
  memories: Record<AgentId, AgentMemoryState>
  messages: AgentMessage[]
  simulationRunning: boolean

  enter: () => void
  goTo: (view: View) => void
  startSimulation: () => void
  stopSimulation: () => void
  triggerSpecialist: (id: AgentId) => void
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

  function addMemory(id: AgentId, tier: 'shortTerm' | 'longTerm', content: string, source: string) {
    const entry = { id: makeId('mem'), timestamp: Date.now(), content, source }
    const limit = tier === 'shortTerm' ? SHORT_TERM_LIMIT : LONG_TERM_LIMIT
    set((s) => {
      const current = s.memories[id]
      const next = [entry, ...current[tier]].slice(0, limit)
      return { memories: { ...s.memories, [id]: { ...current, [tier]: next } } }
    })
  }

  function addTask(id: AgentId, title: string, type: string): AgentTask {
    const task: AgentTask = {
      id: makeId('task'),
      agentId: id,
      type,
      title,
      status: 'active',
      priority: 'normal',
      createdAt: Date.now(),
      completedAt: null,
    }
    set((s) => ({ memories: { ...s.memories, [id]: { ...s.memories[id], tasks: [task, ...s.memories[id].tasks].slice(0, 12) } } }))
    return task
  }

  function completeTask(id: AgentId, taskId: string) {
    set((s) => ({
      memories: {
        ...s.memories,
        [id]: {
          ...s.memories[id],
          tasks: s.memories[id].tasks.map((t) => (t.id === taskId ? { ...t, status: 'done', completedAt: Date.now() } : t)),
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

  function dispatchMessage(message: AgentMessage) {
    set((s) => ({ messages: [message, ...s.messages].slice(0, 60) }))
    messageBus.publish(message)
    recordRelationship(message.from, message.to, message.content)
    recordRelationship(message.to, message.from, message.content)
  }

  async function runSpecialistCycle(id: AgentId) {
    const runtime = get().runtimes[id]
    if (runtime.state !== 'idle') return
    const definition = agentRegistry[id]
    const providers = providersFor(definition.providerNames)
    if (providers.length === 0) return

    const task = addTask(id, `Sweep: ${definition.responsibilities[0]}`, 'sweep')

    setAgentState(id, 'thinking', 'Reviewing incoming signals')
    await sleep(randomBetween(1400, 2200))

    const provider = providers[Math.floor(Math.random() * providers.length)]
    setAgentState(id, 'researching', `Checking ${provider.sourceLabel}`)
    const [item] = await provider.fetch()
    await sleep(randomBetween(1400, 2000))

    setAgentState(id, 'processing', 'Evaluating relevance')
    await sleep(randomBetween(1000, 1600))
    addMemory(id, 'shortTerm', `${item.title} — ${item.summary}`, provider.sourceLabel)

    setAgentState(id, 'communicating', 'Reporting to Jarvis')
    const confidence = confidenceFor(item)
    const message: AgentMessage = {
      id: makeId('msg'),
      from: id,
      to: 'jarvis',
      timestamp: Date.now(),
      type: 'finding',
      content: `${item.title} — ${item.summary}`,
      priority: item.severity === 'high' ? 'high' : 'normal',
      confidence,
      metadata: { tags: item.tags.join(','), provider: provider.name },
    }
    dispatchMessage(message)
    completeTask(id, task.id)
    await sleep(600)
    setAgentState(id, 'idle', null)

    jarvisQueue.push(message)
    void drainJarvisQueue()
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
    const fromDef = agentRegistry[message.from]
    setAgentState('jarvis', 'thinking', `Reviewing update from ${fromDef.name}`)
    await sleep(randomBetween(1000, 1500))

    setAgentState('jarvis', 'processing', 'Assessing cross-domain relevance')
    await sleep(randomBetween(1000, 1500))

    const tags = (message.metadata?.tags as string)?.split(',').filter(Boolean) ?? []
    const target = decideCorrelationTarget(message.from, { id: message.id, title: '', summary: '', timestamp: 0, tags })

    let briefingLine: string
    if (target && get().runtimes[target].state === 'idle') {
      const targetDef = agentRegistry[target]
      setAgentState('jarvis', 'communicating', `Requesting correlation from ${targetDef.name}`)
      const request: AgentMessage = {
        id: makeId('msg'),
        from: 'jarvis',
        to: target,
        timestamp: Date.now(),
        type: 'request',
        content: `Correlate: ${message.content}`,
        priority: 'normal',
      }
      dispatchMessage(request)
      await sleep(500)

      setAgentState(target, 'thinking', `Correlating with ${fromDef.name}'s report`)
      await sleep(randomBetween(1200, 1800))
      setAgentState(target, 'processing', 'Cross-referencing memory')
      await sleep(randomBetween(900, 1300))

      const relevant = Math.random() < 0.35
      const responseContent = relevant
        ? `Found related activity worth merging into the active picture.`
        : `No related activity in current memory — likely isolated.`
      const response: AgentMessage = {
        id: makeId('msg'),
        from: target,
        to: 'jarvis',
        timestamp: Date.now(),
        type: 'response',
        content: responseContent,
        priority: 'low',
        confidence: 0.6 + Math.random() * 0.3,
      }
      addMemory(target, 'shortTerm', `Correlation check for ${fromDef.name}: ${responseContent}`, 'jarvis')
      dispatchMessage(response)
      setAgentState(target, 'idle', null)

      setAgentState('jarvis', 'processing', 'Incorporating response')
      await sleep(randomBetween(700, 1100))
      briefingLine = correlatedBriefingLine(fromDef.name, targetDef.name, { id: message.id, title: message.content, summary: '', timestamp: 0, tags }, relevant)
    } else {
      briefingLine = soloBriefingLine(fromDef.name, { id: message.id, title: message.content, summary: '', timestamp: 0, tags })
    }

    addMemory('jarvis', 'longTerm', briefingLine, 'synthesis')
    setAgentState('jarvis', 'reporting', 'Updating facility briefing')
    await sleep(700)
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
    messages: [],
    simulationRunning: false,

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
  }
})
