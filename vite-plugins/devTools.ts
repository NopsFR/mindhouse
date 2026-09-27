import type { Plugin, ViteDevServer } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { exec } from 'node:child_process'

/**
 * Real filesystem + terminal tools for Jarvis and the specialists — but
 * ONLY reachable when you run `npm run dev` on your own machine.
 *
 * `apply: 'serve'` means this plugin does not exist during `vite build` —
 * it is not bundled, not shipped, not present in the GitHub Pages / Vercel
 * output in any form. The public deployed site has no execution endpoints
 * at all. This is the actual security boundary, not a UI toggle: giving a
 * publicly deployed page the ability to run shell commands or write files
 * would let any visitor execute code on whatever machine hosts it. Running
 * locally, the trust boundary is the same as you already having a
 * terminal open — every operation is scoped to WORKSPACE_ROOT below.
 */
const WORKSPACE_ROOT = path.resolve(process.cwd(), 'agent-workspace')

function resolveInWorkspace(userPath: string): string {
  const target = path.resolve(WORKSPACE_ROOT, userPath || '.')
  if (target !== WORKSPACE_ROOT && !target.startsWith(WORKSPACE_ROOT + path.sep)) {
    throw new Error(`Path "${userPath}" escapes the workspace — refusing.`)
  }
  return target
}

function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let raw = ''
    req.on('data', (chunk) => (raw += chunk))
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {})
      } catch (e) {
        reject(e)
      }
    })
    req.on('error', reject)
  })
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

type Handler = (body: Record<string, unknown>) => Promise<unknown>

const handlers: Record<string, Handler> = {
  async '/__devtools/fs/list'(body) {
    const dir = resolveInWorkspace(String(body.path ?? '.'))
    const entries = await fs.readdir(dir, { withFileTypes: true })
    return {
      entries: entries.map((e) => ({ name: e.name, type: e.isDirectory() ? 'directory' : 'file' })),
    }
  },
  async '/__devtools/fs/read'(body) {
    const file = resolveInWorkspace(String(body.path))
    const content = await fs.readFile(file, 'utf-8')
    return { content }
  },
  async '/__devtools/fs/write'(body) {
    const file = resolveInWorkspace(String(body.path))
    await fs.mkdir(path.dirname(file), { recursive: true })
    await fs.writeFile(file, String(body.content ?? ''), 'utf-8')
    return { ok: true }
  },
  async '/__devtools/fs/mkdir'(body) {
    const dir = resolveInWorkspace(String(body.path))
    await fs.mkdir(dir, { recursive: true })
    return { ok: true }
  },
  async '/__devtools/fs/delete'(body) {
    const target = resolveInWorkspace(String(body.path))
    await fs.rm(target, { recursive: true, force: true })
    return { ok: true }
  },
  async '/__devtools/exec'(body) {
    const cwd = resolveInWorkspace(String(body.cwd ?? '.'))
    const command = String(body.command ?? '')
    if (!command.trim()) throw new Error('No command given.')
    return new Promise((resolve) => {
      exec(command, { cwd, timeout: 30_000, maxBuffer: 5 * 1024 * 1024 }, (error, stdout, stderr) => {
        resolve({ ok: !error, exitCode: error && 'code' in error ? (error as { code?: number }).code ?? 1 : 0, stdout, stderr: stderr || (error && !stdout ? String(error.message) : '') })
      })
    })
  },
}

export function devToolsPlugin(): Plugin {
  return {
    name: 'mindhouse-dev-tools',
    apply: 'serve',
    async configureServer(server: ViteDevServer) {
      await fs.mkdir(WORKSPACE_ROOT, { recursive: true })

      server.middlewares.use('/__devtools/status', (_req, res) => {
        sendJson(res, 200, { available: true, workspaceRoot: WORKSPACE_ROOT })
      })

      for (const [route, handler] of Object.entries(handlers)) {
        server.middlewares.use(route, async (req, res) => {
          if (req.method !== 'POST') return sendJson(res, 405, { error: 'POST only' })
          try {
            const body = await readJsonBody(req)
            const result = await handler(body)
            sendJson(res, 200, { ok: true, ...(result as object) })
          } catch (err) {
            sendJson(res, 400, { ok: false, error: err instanceof Error ? err.message : String(err) })
          }
        })
      }

      console.log(`[mindhouse-dev-tools] workspace: ${WORKSPACE_ROOT}`)
    },
  }
}
