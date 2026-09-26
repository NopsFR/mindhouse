import { createMockProvider } from './factory'

export const SpaceProvider = createMockProvider('orbit.space', 'Mock: Space Missions Feed', [
  {
    title: 'Orbital resupply mission reaches station',
    summary: 'Cargo vehicle completed docking after a routine two-day transit.',
    tags: ['spaceflight'],
  },
  {
    title: 'New launch window announced for lunar lander demo',
    summary: 'Mission planners confirm an updated window pending final systems review.',
    tags: ['spaceflight', 'moon'],
  },
  {
    title: 'Minor solar flare produces visible aurora at high latitudes',
    summary: 'A moderate flare triggered geomagnetic activity; no impact on satellite operations reported.',
    tags: ['space-weather'],
    severity: 'low',
  },
])

export const ScienceProvider = createMockProvider('orbit.science', 'Mock: Science Research Feed', [
  {
    title: 'Exoplanet atmosphere shows signs of water vapor',
    summary: 'Spectroscopic data from a space telescope suggests water vapor in a nearby exoplanet atmosphere.',
    tags: ['astronomy'],
  },
  {
    title: 'New deep-field survey doubles cataloged galaxies',
    summary: 'A wide-field imaging survey has roughly doubled the number of cataloged distant galaxies.',
    tags: ['astronomy'],
  },
  {
    title: 'Research team models a younger age for a known star cluster',
    summary: 'Revised stellar modeling suggests the cluster is several hundred million years younger than thought.',
    tags: ['astrophysics'],
  },
])
