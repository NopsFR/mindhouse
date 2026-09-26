import type { AgentDefinition, Permission } from './types'
import type { MessageType } from '../communication/types'

export function hasPermission(agent: AgentDefinition, permission: Permission): boolean {
  return agent.permissions.includes(permission)
}

/** Enforced before a message is sent — not just descriptive text on the agent. */
export function canSendMessageType(agent: AgentDefinition, type: MessageType): boolean {
  switch (type) {
    case 'request':
    case 'question':
      return hasPermission(agent, 'agent:delegate')
    case 'report':
    case 'alert':
      return hasPermission(agent, 'agent:report')
    case 'response':
      return hasPermission(agent, 'agent:answer')
    default:
      return false
  }
}
