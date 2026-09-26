import type { IntelligenceItem, IntelligenceProvider } from '../types'

let itemCounter = 0

type ItemSeed = Omit<IntelligenceItem, 'id' | 'timestamp'>

/**
 * Builds a mock provider from a static pool of seed items. Every fetch()
 * returns a small random slice with a fresh timestamp, simulating a feed
 * that is "checked" rather than one that is actually polled over the network.
 */
export function createMockProvider(
  name: string,
  sourceLabel: string,
  pool: ItemSeed[],
): IntelligenceProvider {
  return {
    name,
    sourceLabel,
    isMock: true,
    async fetch(): Promise<IntelligenceItem[]> {
      const seed = pool[Math.floor(Math.random() * pool.length)]
      itemCounter += 1
      return [
        {
          ...seed,
          id: `${name}-${itemCounter}-${Date.now()}`,
          timestamp: Date.now(),
        },
      ]
    },
  }
}
