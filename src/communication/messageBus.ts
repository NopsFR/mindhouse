import type { AgentMessage } from './types'

type Listener = (message: AgentMessage) => void

/**
 * The facility's nervous system. A minimal pub/sub so any room or panel can
 * observe agent-to-agent traffic without coupling to the simulation engine
 * or the store directly.
 */
class MessageBus {
  private listeners = new Set<Listener>()

  publish(message: AgentMessage) {
    this.listeners.forEach((listener) => listener(message))
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }
}

export const messageBus = new MessageBus()
