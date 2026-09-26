# MINDHOUSE

A facility of autonomous AI agents, viewed as a physical/digital space rather than a dashboard.
Jarvis (central intelligence) coordinates four specialists — Mancy (Manchester), Null
(cybersecurity), Atlas (global events), and Orbit (science & space). Agents pull a task, call a
tool, reason over the result with a real `LLMProvider` call, write memory, and report to Jarvis —
who decides whether another specialist should correlate before filing a facility briefing. All of
it runs client-side today; every layer is built so a real backend, real tools, and real models can
be dropped in without changing the layers above them.

## The three-way split

- **Agent** (`agents/`) — the intelligence: identity, system prompt, brain (provider + model),
  permissions, memory. The registry in `agents/registry.ts` is the only place this is authored.
- **Tools** (`tools/`) — what an agent is allowed to touch. An `IntelligenceTool` is called through
  a permission-checked registry (`tools/registry.ts`), never directly — the same interface a future
  MCP-backed tool would implement.
- **World** (`world/`, `rooms/`) — how the user *observes* the agent. A room is not the AI; it's a
  window into its current state, rendered from the real store, never faked in the component.

## Architecture

```
src/
  agents/        Domain types, the registry (identity, system prompt, brain, permissions, tools),
                 and the permission checks in permissions.ts.
  tools/         IntelligenceTool interface + mock/ implementations + the permission-enforcing registry.
  llm/           LLMProvider interface + providers: mock (heuristic, default), ollama (real local
                 model support), cloud (deliberately unconfigured — see Security below).
  communication/ AgentMessage type + a pub/sub message bus — the facility's nervous system.
  memory/        Short-term / long-term / task-queue / relationship memory types.
  simulation/    Pure prompt builders and the Jarvis correlation policy — no side effects.
  state/         The Zustand store: the only place that runs the task queue -> tool call ->
                 LLM reasoning -> memory -> agent message -> next agent pipeline.
  world/         Facility.tsx — the corridor of doorways, not a card grid.
  rooms/         One room per agent; each owns its own live visual, fed by real store state.
  components/    Doorway, RoomReadout, BrainReadout, ActivityFeed, MemoryPanel, TaskList, ChatDock.
```

### Adding a new agent

1. Add an `AgentDefinition` to `agents/registry.ts` (system prompt, brain, permissions, `toolIds`).
2. Add a tool set under `tools/mock/` and register it in `tools/registry.ts`.
3. Add a room under `rooms/` with its own visual and a `DoorwayPreview` case, wire it into `App.tsx`.

The store, message bus, and simulation engine all key off `AgentId` and need no changes.

### Real vs. simulated

Every tool in `tools/mock/` sets `isMock: true` and carries a `sourceLabel` prefixed `Mock:` —
shown wherever its data surfaces. Every agent's `brain.provider` starts as `'mock'`; nothing
pretends to run a model that isn't connected. Swapping a mock tool for a real one means
implementing `IntelligenceTool`; nothing above the registry changes.

### Local models are real, not a placeholder

`llm/providers/ollama.ts` actually calls a local Ollama daemon on `localhost:11434` — no API key
involved, since it's a request to a process on your own machine. From Jarvis's room, **Connect
local model** checks for a running Ollama with at least one pulled model and, if found, switches
Jarvis's `brain` to it for real; if not, it says so. No model name is ever invented.

### Security boundary

`llm/providers/cloud.ts` is an intentional dead end: calling it throws, explaining that a cloud
provider needs a server-side proxy to hold the API key, because that key must never ship to the
browser. This is the seam where a real backend belongs — client code stays exactly as it is; only
`llm/registry.ts` would start routing `'cloud'` through an HTTP call to that backend instead.

### Permissions

Each agent's `toolIds` is an explicit allow-list — `tools/registry.ts` never returns a tool an
agent wasn't assigned. Each agent's `permissions` gate which `AgentMessage` types it may send
(`agents/permissions.ts`); Jarvis is the only agent that can delegate (`request`/`question`),
specialists can only report (`report`/`alert`) and answer (`response`).

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
