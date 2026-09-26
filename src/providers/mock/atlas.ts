import { createMockProvider } from './factory'

export const GlobalNewsProvider = createMockProvider('atlas.globalnews', 'Mock: Global Events Feed', [
  {
    title: 'Central bank signals pause on rate changes',
    summary: 'Policymakers cite easing inflation data as grounds for holding rates steady.',
    tags: ['economy', 'policy'],
  },
  {
    title: 'Magnitude 5.8 earthquake reported offshore',
    summary: 'No major damage reported; regional monitoring agencies tracking aftershocks.',
    tags: ['disaster', 'geoscience'],
    severity: 'medium',
  },
  {
    title: 'Two nations resume trade talks after year-long pause',
    summary: 'Officials describe the resumed talks as a step toward a broader framework agreement.',
    tags: ['geopolitics'],
  },
  {
    title: 'Major port completes automation upgrade',
    summary: 'A large container port reports higher throughput after a multi-year automation project.',
    tags: ['infrastructure', 'economy'],
  },
])
