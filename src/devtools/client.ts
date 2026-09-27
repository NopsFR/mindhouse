/**
 * Talks to the local-only Vite dev-server plugin (vite-plugins/devTools.ts).
 * Same origin as the app in dev, so a plain relative fetch works with no
 * CORS setup. On the deployed static build there is no such route — these
 * calls simply fail closed (checkDevToolsAvailable returns false), because
 * `apply: 'serve'` means the plugin was never built into that output.
 */
const BASE = '/__devtools'

export async function checkDevToolsAvailable(): Promise<{ available: boolean; workspaceRoot: string | null }> {
  try {
    const res = await fetch(`${BASE}/status`, { signal: AbortSignal.timeout(1200) })
    if (!res.ok) return { available: false, workspaceRoot: null }
    const data = (await res.json()) as { available: boolean; workspaceRoot: string }
    return { available: Boolean(data.available), workspaceRoot: data.workspaceRoot ?? null }
  } catch {
    return { available: false, workspaceRoot: null }
  }
}

async function post(route: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const res = await fetch(`${BASE}${route}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = (await res.json()) as Record<string, unknown>
  if (!res.ok || data.ok === false) throw new Error(typeof data.error === 'string' ? data.error : `${route} failed`)
  return data
}

export const devToolsClient = {
  listDirectory: (dirPath: string) => post('/fs/list', { path: dirPath }) as Promise<{ entries: { name: string; type: string }[] }>,
  readFile: (filePath: string) => post('/fs/read', { path: filePath }) as Promise<{ content: string }>,
  writeFile: (filePath: string, content: string) => post('/fs/write', { path: filePath, content }),
  makeDirectory: (dirPath: string) => post('/fs/mkdir', { path: dirPath }),
  deleteFile: (targetPath: string) => post('/fs/delete', { path: targetPath }),
  runCommand: (command: string, cwd?: string) =>
    post('/exec', { command, cwd }) as Promise<{ stdout: string; stderr: string; exitCode: number }>,
}
