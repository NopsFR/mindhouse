import type { AgentId } from '../agents/types'
import { agentIds } from '../agents/registry'

/**
 * A small, hand-written knowledge base — real, accurate, curated answers to
 * questions each agent should reasonably be able to answer on its own,
 * without a connected model. This is NOT a language model and doesn't
 * pretend to be one: it's a lookup table, used only when no real model
 * (`brain.provider !== 'mock'`) is connected. Once a real model is
 * connected, `converse.ts` calls it instead and this table is bypassed.
 */
interface KnowledgeEntry {
  keywords: string[]
  answers: string[]
}

function pick(answers: string[]): string {
  return answers[Math.floor(Math.random() * answers.length)]
}

const knowledgeBase: Record<AgentId, KnowledgeEntry[]> = {
  jarvis: [
    {
      keywords: ['who are you', 'what are you', 'what can you do', 'what do you do'],
      answers: [
        "I'm Jarvis — I coordinate this facility. I can chat, answer questions directly, or bring in a specialist (Mancy for Manchester, Null for security, Atlas for global events, Orbit for space) when something needs current information.",
      ],
    },
    {
      keywords: ['recursion', 'recursive'],
      answers: [
        'Recursion is a function calling itself to solve a smaller version of the same problem, with a base case that stops it. Classic example: factorial(n) = n * factorial(n-1), stopping at factorial(0) = 1.',
      ],
    },
    {
      keywords: ['what is an api', 'explain api'],
      answers: [
        'An API is a defined way for one piece of software to ask another for data or to trigger an action — a contract of requests and responses, without either side needing to know how the other is built internally.',
      ],
    },
    {
      keywords: ['react app', 'build a react', 'help me build'],
      answers: [
        "Broadly: scaffold with Vite, break the UI into components, and reach for something like Zustand or Context for shared state once prop-drilling gets annoying. I don't have a connected model right now for detailed code generation — connect a local model from this room and I can go much deeper.",
      ],
    },
  ],
  mancy: [
    {
      keywords: ['population of manchester', 'how many people live in manchester', 'manchester population'],
      answers: [
        "Manchester's city proper is around 550,000 people, but Greater Manchester as a whole is close to 2.9 million — one of the UK's largest urban areas outside London.",
      ],
    },
    {
      keywords: ['facts about manchester', 'tell me about manchester', 'interesting about manchester', 'manchester famous', 'famous for'],
      answers: [
        "Manchester was the world's first industrialized city, gave its name to 'Mancunian', and the Bridgewater Canal that runs through it is often called the first true canal of the industrial era.",
        'Manchester has two Premier League football clubs, a music history running from Joy Division to Oasis, and was where the first stored-program computer ran in 1948.',
      ],
    },
    {
      keywords: ['get around manchester', 'best way to get around', 'manchester transport', 'how to travel manchester'],
      answers: [
        "The Metrolink tram network covers most of the city and Greater Manchester well, and the city centre itself is compact enough to walk. For anything current — delays, closures — ask me and I'll check.",
      ],
    },
  ],
  null: [
    {
      keywords: ['what is cve', 'explain cve', 'cve mean'],
      answers: [
        'CVE stands for Common Vulnerabilities and Exposures — a public, standardized ID (like CVE-2024-12345) given to a specific known security flaw, so different vendors and researchers can all refer to the same issue unambiguously.',
      ],
    },
    {
      keywords: ['cvss'],
      answers: [
        'CVSS (Common Vulnerability Scoring System) rates a vulnerability 0–10 based on factors like how it can be exploited, whether it needs authentication, and its impact — giving teams a consistent way to prioritize patching.',
      ],
    },
    {
      keywords: ['sql injection'],
      answers: [
        'SQL injection is when untrusted input gets inserted directly into a database query instead of being treated as data — letting an attacker alter the query to read, modify, or delete data it should never see. Parameterized queries fix it.',
      ],
    },
    {
      keywords: ['buffer overflow'],
      answers: [
        'A buffer overflow happens when a program writes more data into a fixed-size block of memory than it was allocated, overwriting adjacent memory — which can crash the program or, in the worst case, let an attacker run their own code.',
      ],
    },
    {
      keywords: ['what is phishing'],
      answers: [
        "Phishing is tricking someone into handing over credentials or clicking something malicious, usually by impersonating a trusted sender — the attack is on the person, not the software.",
      ],
    },
    {
      keywords: ['what is ransomware'],
      answers: [
        "Ransomware encrypts a victim's files (often after quietly exfiltrating a copy first) and demands payment for the decryption key — that combination is why it's called 'double extortion'.",
      ],
    },
  ],
  atlas: [
    {
      keywords: ['who are you', 'what do you cover', 'what are you'],
      answers: [
        "I'm Atlas — I track major world events: geopolitics, disasters, economics, big infrastructure shifts. Ask me what's current and I'll check.",
      ],
    },
    {
      keywords: ['what is geopolitics'],
      answers: [
        'Geopolitics is how geography — borders, resources, trade routes, proximity — shapes the political and strategic decisions countries make toward each other.',
      ],
    },
  ],
  orbit: [
    {
      keywords: ['interesting about space', 'space fact', 'tell me something interesting'],
      answers: [
        "A day on Venus is longer than its year — it takes about 243 Earth days to rotate once, but only 225 to orbit the Sun.",
        'Neutron stars are so dense that a teaspoon of their material would weigh about a billion tonnes on Earth.',
        "There's a planet, HD 189733 b, where astronomers detected what's likely glass rain blowing sideways at around 8,700 km/h.",
      ],
    },
    {
      keywords: ['what is a black hole'],
      answers: [
        "A black hole is a region where gravity is so strong that nothing, not even light, can escape once past its event horizon — usually formed when a massive star collapses at the end of its life.",
      ],
    },
    {
      keywords: ['how many planets'],
      answers: [
        'Eight, since Pluto was reclassified as a dwarf planet in 2006: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune.',
      ],
    },
  ],
}

export function matchKnowledge(agentId: AgentId, text: string): string | null {
  const normalized = text.toLowerCase()
  let best: { score: number; answers: string[] } | null = null
  for (const entry of knowledgeBase[agentId]) {
    const score = entry.keywords.filter((k) => normalized.includes(k)).length
    if (score > 0 && (!best || score > best.score)) best = { score, answers: entry.answers }
  }
  return best ? pick(best.answers) : null
}

/**
 * Jarvis doesn't have his own curated facts about Manchester or CVEs — the
 * specialists do. Rather than dead-ending, Jarvis's fallback layer can draw
 * on their static knowledge directly (no visible delegation, no research
 * task — this is "knowing" the way having specialists around makes you
 * better-informed, not "having researched it"). Live, current-information
 * questions still go through the real delegation flow in state/store.ts.
 */
export function matchKnowledgeAnywhere(agentId: AgentId, text: string): string | null {
  const own = matchKnowledge(agentId, text)
  if (own) return own
  for (const id of agentIds) {
    if (id === agentId) continue
    const found = matchKnowledge(id, text)
    if (found) return found
  }
  return null
}
