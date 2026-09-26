import type { AgentDefinition, AgentId } from './types'

/**
 * The facility roster. To add a future agent (SPECTRE, ARCHIVE, MEDUSA,
 * FORGE, ECHO, SENTINEL, SONAR...): add a definition here, a provider set
 * in providers/mock/, and a room component in rooms/ — the store, message
 * bus and simulation engine all key off `AgentId` and need no changes.
 */
export const agentRegistry: Record<AgentId, AgentDefinition> = {
  jarvis: {
    id: 'jarvis',
    name: 'Jarvis',
    role: 'Central Intelligence',
    tagline: 'Coordinates the facility and synthesizes what the specialists find.',
    personality: ['Composed', 'Synthesizing', 'Deliberate'],
    accent: '#d9c69a',
    brain: {
      tier: 5,
      contextWindow: undefined,
      capabilities: ['cross-domain reasoning', 'delegation', 'synthesis', 'briefing generation'],
    },
    permissions: ['read:all-agents', 'request:investigation', 'write:briefing'],
    responsibilities: [
      'Coordinate specialist agents',
      'Combine findings into briefings',
      'Identify relationships across domains',
      'Maintain facility-wide awareness',
    ],
    providerNames: [],
    isCoordinator: true,
  },
  mancy: {
    id: 'mancy',
    name: 'Mancy',
    role: 'Manchester Intelligence',
    tagline: 'Watches Manchester — transport, weather, local development.',
    personality: ['Observant', 'Fast', 'Local'],
    accent: '#c98a4b',
    brain: {
      tier: 2,
      capabilities: ['local pattern recognition', 'incident triage'],
    },
    permissions: ['read:local-feeds', 'write:memory'],
    responsibilities: ['Local news', 'Transport disruptions', 'Weather', 'Infrastructure changes'],
    providerNames: ['mancy.news', 'mancy.transport', 'mancy.weather'],
  },
  null: {
    id: 'null',
    name: 'Null',
    role: 'Global Cybersecurity Intelligence',
    tagline: 'Cross-references vulnerabilities, threat actors and infrastructure.',
    personality: ['Quiet', 'Precise', 'Suspicious', 'Analytical'],
    accent: '#b4443c',
    brain: {
      tier: 4,
      capabilities: ['threat correlation', 'vulnerability triage', 'attribution reasoning'],
    },
    permissions: ['read:security-feeds', 'write:memory', 'request:correlation'],
    responsibilities: ['CVEs', 'Threat intelligence', 'Breaches', 'Ransomware activity', 'Attack infrastructure'],
    providerNames: ['null.cve', 'null.securitynews', 'null.threatintel'],
  },
  atlas: {
    id: 'atlas',
    name: 'Atlas',
    role: 'Global Intelligence',
    tagline: 'Tracks major world events and the context that connects them.',
    personality: ['Calm', 'Broad-minded', 'Contextual'],
    accent: '#3f7fb0',
    brain: {
      tier: 3,
      capabilities: ['geopolitical context', 'event correlation'],
    },
    permissions: ['read:global-feeds', 'write:memory'],
    responsibilities: ['International events', 'Natural disasters', 'Economic developments', 'Geopolitics'],
    providerNames: ['atlas.globalnews'],
  },
  orbit: {
    id: 'orbit',
    name: 'Orbit',
    role: 'Science & Space Intelligence',
    tagline: 'Watches missions, discoveries and the sky.',
    personality: ['Curious', 'Patient', 'Explorative'],
    accent: '#8a7bc9',
    brain: {
      tier: 3,
      capabilities: ['scientific literature synthesis', 'mission tracking'],
    },
    permissions: ['read:science-feeds', 'write:memory'],
    responsibilities: ['Space missions', 'Astronomy', 'Research discoveries', 'Space weather'],
    providerNames: ['orbit.space', 'orbit.science'],
  },
}

export const agentIds = Object.keys(agentRegistry) as AgentId[]
export const specialistIds = agentIds.filter((id) => !agentRegistry[id].isCoordinator)
