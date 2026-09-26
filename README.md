# MINDHOUSE

A cinematic, browser-based facility of autonomous AI agents — Jarvis (central intelligence)
coordinating four specialists: Mancy (Manchester), Null (cybersecurity), Atlas (global events),
and Orbit (science & space). Agents wake, research, report to Jarvis, and occasionally cross-correlate
with each other, entirely on a client-side simulation loop.

This is a portfolio piece: the visual world (Phase 1) and the agent/communication/memory
architecture (Phases 2–3) are real and running. Intelligence data is mocked — see
[Mock data](#mock-data) below — and chat responses are heuristic, not LLM-backed, pending Phase 5.

## Stack

React 19 + TypeScript + Vite, Tailwind CSS v4, Motion (Framer Motion), Zustand, Lucide icons.

## Architecture

```
src/
  agents/          Agent domain types, the static registry (identity, brain, permissions),
                    and the heuristic chat responder.
  communication/    AgentMessage type + a minimal pub/sub message bus — the facility's nervous system.
  memory/           Short-term / long-term / task / relationship memory types.
  providers/        IntelligenceProvider interface + mock/ implementations, clearly labeled isMock.
  simulation/       Pure helper functions the store uses to run the agent lifecycle
                    (confidence scoring, correlation rules, briefing copy).
  state/            The Zustand store — the only place that mutates runtime state, memory,
                    and drives the async agent/Jarvis cycles.
  world/            The facility overview (Building.tsx) — radial desktop layout, stacked mobile layout.
  rooms/            One component per agent room; each renders its own hand-built visual centerpiece.
  components/       Shared UI: brain meter, status tag, activity feed, memory/task panels, chat dock.
```

### Adding a new agent

1. Add an `AgentDefinition` to `agents/registry.ts` (identity, brain tier, permissions, provider names).
2. Add a provider set under `providers/mock/` and register it in `providers/registry.ts`.
3. Add a room component under `rooms/` with that agent's own visual, and wire it into `App.tsx`.

No changes to the store, message bus, or simulation engine are required — they all key off `AgentId`.

### Mock data

Every provider in `providers/mock/` is synthetic and sets `isMock: true`. Nothing in the UI
claims this is live intelligence — providers show their `sourceLabel` (prefixed `Mock:`) wherever
their data surfaces. Swapping in a real API means implementing `IntelligenceProvider` and registering
it in `providers/registry.ts`; nothing else changes.

### Chat

Each agent's chat (`components/ChatDock.tsx`) answers using a small rule-based function
(`agents/responder.ts`) grounded in that agent's own memory — not a language model. It's labeled
"heuristic · no live model" in the UI. Phase 5 replaces this with a real per-agent model call
behind the same interface.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
