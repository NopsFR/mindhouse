import type { IntelligenceProvider } from './types'
import { NewsProvider, TransportProvider, WeatherProvider } from './mock/mancy'
import { CVEProvider, SecurityNewsProvider, ThreatIntelProvider } from './mock/null'
import { GlobalNewsProvider } from './mock/atlas'
import { SpaceProvider, ScienceProvider } from './mock/orbit'

/**
 * Every provider currently wired into the facility, keyed by the name each
 * `AgentDefinition.providerNames` references. This is the ONLY place that
 * needs to change to swap a mock provider for a real one — agents and the
 * simulation engine only ever see the `IntelligenceProvider` interface.
 */
export const providerRegistry: Record<string, IntelligenceProvider> = {
  [NewsProvider.name]: NewsProvider,
  [TransportProvider.name]: TransportProvider,
  [WeatherProvider.name]: WeatherProvider,
  [CVEProvider.name]: CVEProvider,
  [SecurityNewsProvider.name]: SecurityNewsProvider,
  [ThreatIntelProvider.name]: ThreatIntelProvider,
  [GlobalNewsProvider.name]: GlobalNewsProvider,
  [SpaceProvider.name]: SpaceProvider,
  [ScienceProvider.name]: ScienceProvider,
}

export function providersFor(providerNames: string[]): IntelligenceProvider[] {
  return providerNames.map((name) => providerRegistry[name]).filter(Boolean)
}
