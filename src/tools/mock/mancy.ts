import { createMockTool } from './factory'

export const localNewsTool = createMockTool('local_news', 'Local News', 'Manchester and Greater Manchester news search.', 'Mock: Local News Feed', [
  {
    title: 'Redevelopment approved near Piccadilly',
    summary: 'Planning committee approved a mixed-use scheme adjacent to Piccadilly Gardens, citing housing targets.',
    tags: ['development', 'planning'],
  },
  {
    title: 'Northern Quarter footfall up on last quarter',
    summary: 'Local business association reports a rise in weekend footfall across the Northern Quarter.',
    tags: ['economy', 'local'],
  },
  {
    title: 'University research grant announced',
    summary: 'A Manchester university received funding for materials science research.',
    tags: ['education', 'research'],
  },
])

export const transportStatusTool = createMockTool('transport_status', 'Transport Status', 'Live Greater Manchester transport disruption lookup.', 'Mock: Transport Status Feed', [
  {
    title: 'Metrolink disruption on Altrincham line',
    summary: 'Signal fault reported between Altrincham and Sale, replacement buses running.',
    tags: ['transport', 'metrolink'],
    severity: 'medium',
  },
  {
    title: 'Planned closure: Oxford Road',
    summary: 'Oxford Road partially closed overnight for resurfacing works this week.',
    tags: ['transport', 'roadworks'],
    severity: 'low',
  },
  {
    title: 'Piccadilly station platform changes',
    summary: 'Temporary platform reassignments in effect due to engineering works.',
    tags: ['transport', 'rail'],
    severity: 'low',
  },
])

export const regionalWeatherTool = createMockTool('regional_weather', 'Regional Weather', 'Weather conditions and warnings for Greater Manchester.', 'Mock: Regional Weather Feed', [
  {
    title: 'Heavy rain warning issued',
    summary: 'A yellow weather warning for rain covers Greater Manchester into the evening.',
    tags: ['weather'],
    severity: 'medium',
  },
  {
    title: 'Mild conditions expected through the week',
    summary: 'Temperatures holding a few degrees above seasonal average.',
    tags: ['weather'],
    severity: 'low',
  },
])
