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

## Conversation vs. environment

These are deliberately two separate layers (`conversation/` vs `memory/`):

- **Conversation** — what the user actually typed and what an agent said back
  (`state.conversations`, rendered by `ChatDock`). A greeting gets a greeting; nothing here is ever
  a dump of an agent's internal intelligence memory.
- **Environment** — the facility's own state (agent runtime, tasks, tool calls, the message bus).
  Visible in each room and the Activity Feed, but never injected into a chat reply as text.

Talking to **Jarvis** routes through `conversation/intents.ts`: a greeting gets a greeting; a
question that needs current information (`detectRelevantSpecialist`, matched against each
specialist's declared `topics`) gets *visibly* delegated — the specialist's room goes into
`researching`, a real `AgentMessage` crosses the bus, and Jarvis answers in plain language citing
what it found. Everything else is answered directly, from a small hand-written knowledge base
(`conversation/knowledge.ts`) when no real model is connected, or by the connected model when one
is. Specialists work the same way one level down: no delegation, but the same
greeting/knowledge/research split, using their own tools.

### On cost — why the honest answer isn't "plug in a real LLM everywhere"

This project has a £0 budget, so there is no server-side model call anyone else's key pays for.
Two paths exist, both genuinely free:

1. **The heuristic layer** (default) — the hand-written knowledge base above. Real, curated,
   accurate for what it covers; honest about what it doesn't cover.
2. **A local model via Ollama** (`llm/providers/ollama.ts`) — genuinely wired up, not a stub. If
   *you* have Ollama running with a model pulled, "Connect local model" in Jarvis's room switches
   Jarvis onto it for real, and conversation quality jumps accordingly. This only benefits whoever
   is running Ollama on the machine viewing the page — a stranger visiting the deployed site
   without Ollama running still gets the heuristic layer, not a generic cloud LLM, because giving
   *every* visitor a real model would mean a server holding a paid or free-tier API key, which
   isn't part of this budget.

## Real tools, local-only

Everything above describes what runs on the deployed site for every visitor. Locally, running
`npm run dev` also starts a second thing: a genuine tool-execution layer, gated behind a hard
boundary so the public site never gains it.

- **`vite-plugins/devTools.ts`** registers `apply: 'serve'` — Vite's own mechanism for "only exists
  under `vite dev`, never under `vite build`." It opens `/__devtools/fs/*` (list/read/write/mkdir/
  delete) and `/__devtools/exec` as same-origin middleware routes, all confined to a single
  `agent-workspace/` directory via `path.resolve` + a `startsWith(WORKSPACE_ROOT)` check — a request
  for `../../etc/passwd` is rejected, not sandboxed-and-allowed. Verified directly: `npm run build`
  then `grep` the output bundle for `child_process` / `node:fs` / `agent-workspace` — none present.
  Verified live: curled every endpoint including a path-escape attempt, which was correctly refused.
- **`src/devtools/`** is the client side — `registry.ts` declares the tools (`list_directory`,
  `read_file`, `write_file`, `make_directory`, `delete_path`, `run_command`) and which autonomy
  level unlocks each; `client.ts` talks to the routes above; on the deployed site
  `checkDevToolsAvailable()` simply gets a 404 and everything reports "not running" — that's the
  entire security model, not a flag anyone has to remember to set.
- **Autonomy levels** (`AutonomyLevel = 0 | 1 | 2`, chosen in Jarvis's room footer): 0 = chat only,
  no tools; 1 = read-only workspace tools; 2 = read + write + run commands. Nothing above level 0
  is offered unless the dev-tools server actually responded.
- **The agent loop** (`runAgentLoop` in `state/store.ts`) is real ReAct, not a scripted sequence: it
  sends the conversation plus the currently-unlocked tool specs to the LLM, and if the model returns
  a `tool_calls` response, the loop executes that specific call, appends the real result as a `tool`
  message, and asks the model to continue — up to 8 steps. Every call is logged to
  `toolActivity[agentId]` and shown in the **Tools** panel (`ToolActivityList.tsx`) with no
  synthetic "thinking…" filler standing in for a step that didn't happen.
- **Delegation is a tool, not a keyword match.** `buildBridgeTools()` exposes
  `consult_specialist` (Jarvis only) and `check_current_info` (any agent with `toolIds`) as
  ordinary entries in the same tool list the model sees — the model chooses to call them the same
  way it chooses to call `read_file`. There is no code path that scans the user's message for
  "Manchester" or "CVE" and forces a specialist hand-off; that heuristic only exists in the no-model
  fallback described below.
- **Tool-calling support is real, not assumed.** `llm/providers/ollama.ts` sets
  `supportsTools: true` and speaks Ollama's actual `/api/chat` `tools` / `tool_calls` wire format;
  `mock` and `cloud` both declare `supportsTools: false` so the loop never pretends a provider that
  can't do function-calling is doing it.

**Honesty about what could and couldn't be verified here:** Ollama isn't installed in this sandbox,
so the live decision-making — does a real local model actually choose `consult_specialist` at the
right moment, does it retry sensibly after a failed tool call — could not be exercised end-to-end.
What was verified is everything that doesn't require a live model: the endpoints, the sandboxing,
the production-bundle exclusion, the mode-gating in `sendChatMessage`, and that fallback-mode
conversation quality didn't regress. Test this part on your own machine with Ollama running and a
tool-calling-capable model pulled (e.g. `qwen2.5`, `llama3.1`, `mistral-nemo`).

## The reasoning layer (composable system prompt)

`agents/prompt.ts` builds each agent's system prompt from fragments rather than one hard-coded
block, so policy can be added or removed per agent without duplicating text:

```ts
buildSystemPrompt(def, { hasTools }) →
  def.systemPrompt           // this agent's specific identity
  + REASONING_POLICY         // act over explain; ask only when genuinely ambiguous; no forced categories
  + TOOL_POLICY              // only if hasTools — never claim a tool ran when it didn't
  + SPECIALIST_POLICY        // only if def.isCoordinator — delegate by judgment, not keyword
  + MEMORY_POLICY            // never paste internal memory into a chat reply
  + SAFETY_POLICY            // judge the actual objective, don't pattern-match on words like "hack"
  + COMMUNICATION_STYLE      // direct, no disclaimers, no "Certainly! I'd be happy to..."
```

This only governs real-model mode. In `state/store.ts`, `sendChatMessage` checks `isReal`
immediately after the cheap greeting/thanks shortcut, before any keyword logic runs — a connected
real model goes straight to `runAgentLoop` (or a plain `generate()` call if the provider can't do
tool-calling) and never touches the heuristic layer. Everything below that point in the function —
forced delegation, topic clarification, chitchat matching, the knowledge-base fallback — is real
code that only executes with **no model connected**, which is also why it's still there: it's the
honest, disclosed answer for the £0-budget "someone visits with no local model" case, not dead code
being routed around.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
