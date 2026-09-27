import type { AutonomyLevel, DevTool } from './types'
import { devToolsClient } from './client'

function cap(text: string, max = 4000): string {
  return text.length > max ? `${text.slice(0, max)}\n…(truncated, ${text.length} chars total)` : text
}

/**
 * Real tools — filesystem and terminal, scoped to the local workspace folder
 * by the server plugin (not by anything client-side, so this can't be
 * bypassed by a clever prompt). Every `run()` here makes an actual network
 * call to a real endpoint; nothing is simulated.
 */
export const devToolRegistry: DevTool[] = [
  {
    name: 'list_directory',
    description: 'List files and subdirectories at a path inside the agent workspace.',
    permission: 'read',
    parameters: { type: 'object', properties: { path: { type: 'string', description: 'Path relative to the workspace root, "." for the root.' } }, required: [] },
    async run(args) {
      const { entries } = await devToolsClient.listDirectory(String(args.path ?? '.'))
      if (entries.length === 0) return { ok: true, output: '(empty directory)' }
      return { ok: true, output: entries.map((e) => `${e.type === 'directory' ? 'dir ' : 'file'}  ${e.name}`).join('\n') }
    },
  },
  {
    name: 'read_file',
    description: 'Read the full contents of a text file inside the agent workspace.',
    permission: 'read',
    parameters: { type: 'object', properties: { path: { type: 'string', description: 'File path relative to the workspace root.' } }, required: ['path'] },
    async run(args) {
      const { content } = await devToolsClient.readFile(String(args.path))
      return { ok: true, output: cap(content) }
    },
  },
  {
    name: 'write_file',
    description: 'Create or overwrite a text file inside the agent workspace. Creates parent directories as needed.',
    permission: 'write',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path relative to the workspace root.' },
        content: { type: 'string', description: 'The full text content to write.' },
      },
      required: ['path', 'content'],
    },
    async run(args) {
      await devToolsClient.writeFile(String(args.path), String(args.content ?? ''))
      return { ok: true, output: `Wrote ${String(args.content ?? '').length} bytes to ${String(args.path)}` }
    },
  },
  {
    name: 'make_directory',
    description: 'Create a directory (and parents) inside the agent workspace.',
    permission: 'write',
    parameters: { type: 'object', properties: { path: { type: 'string', description: 'Directory path relative to the workspace root.' } }, required: ['path'] },
    async run(args) {
      await devToolsClient.makeDirectory(String(args.path))
      return { ok: true, output: `Created ${String(args.path)}` }
    },
  },
  {
    name: 'delete_path',
    description: 'Delete a file or directory (recursively) inside the agent workspace. Irreversible.',
    permission: 'write',
    parameters: { type: 'object', properties: { path: { type: 'string', description: 'Path relative to the workspace root.' } }, required: ['path'] },
    async run(args) {
      await devToolsClient.deleteFile(String(args.path))
      return { ok: true, output: `Deleted ${String(args.path)}` }
    },
  },
  {
    name: 'run_command',
    description: 'Run a shell command inside the agent workspace (e.g. npm install, python script.py, npm test). 30s timeout.',
    permission: 'execute',
    parameters: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'The shell command to run.' },
        cwd: { type: 'string', description: 'Working directory relative to the workspace root, defaults to root.' },
      },
      required: ['command'],
    },
    async run(args) {
      const { stdout, stderr, exitCode } = await devToolsClient.runCommand(String(args.command), args.cwd ? String(args.cwd) : undefined)
      const output = [`exit code: ${exitCode}`, stdout && `stdout:\n${cap(stdout)}`, stderr && `stderr:\n${cap(stderr)}`].filter(Boolean).join('\n\n')
      return { ok: exitCode === 0, output: output || '(no output)' }
    },
  },
]

export function toolsForLevel(level: AutonomyLevel): DevTool[] {
  if (level === 0) return []
  if (level === 1) return devToolRegistry.filter((t) => t.permission === 'read')
  return devToolRegistry
}
