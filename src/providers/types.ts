/**
 * Provider abstraction. Agents never talk to a specific API directly — they
 * consume `IntelligenceProvider`s. Today every provider in `mock/` is
 * synthetic and says so via `isMock: true`. A real provider (a live news
 * API, a CVE feed, NASA's API) implements the same interface with
 * `isMock: false` and can be swapped in without touching agent or
 * simulation code.
 */

export interface IntelligenceItem {
  id: string
  title: string
  summary: string
  timestamp: number
  tags: string[]
  severity?: 'low' | 'medium' | 'high'
}

export interface IntelligenceProvider {
  name: string
  /** Human-readable source, shown in the UI so mock data is never mistaken for live data. */
  sourceLabel: string
  isMock: boolean
  fetch(): Promise<IntelligenceItem[]>
}
