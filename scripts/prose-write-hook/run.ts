// I/O shell for the write-time Vale hook: stdin, git spawn, PATH scan, vale
// spawn, channel writes, exit. audit.ts owns every decision. Always exits 0
// -- PostToolUse cannot block, and the surfaces stay advisory.
//
// Fires from .claude/settings.json on every .claude/** Write or Edit,
// reading the PostToolUse JSON payload on stdin. Everything goes to stderr,
// as the shell's `exec 1>&2` did; the envelope carries findings and
// NOT-RUN warnings, and a clean zero stays silent in the agent's context.
//
// Runner: bare node, no shebang -- the hook command in .claude/settings.json
// names `node` directly. Requires a node whose flag-free .ts run writes
// zero stderr bytes (type stripping, documented from v23.6; measured clean
// on v24.19.0). Erasable syntax only -- no enum, no namespace, no parameter
// properties.
import { accessSync, constants, readFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { execFileSync, spawnSync } from 'node:child_process'
import { envelope, extractFilePath, type HookOutcome } from '../post-tool-use.ts'
import {
  emptyPathOutcome,
  inScope,
  noRootOutcome,
  outcomeFor,
  repoRelative,
  valeAbsentOutcome,
  valeCandidates,
} from './audit.ts'

function emit(outcome: HookOutcome): void {
  for (const line of outcome.lines) process.stderr.write(line + '\n')
  if (outcome.deliver) process.stdout.write(envelope(outcome.lines))
}

function readStdin(): string {
  try {
    return readFileSync(0, 'utf8')
  } catch {
    return ''
  }
}

function repoRootFor(path: string): string {
  try {
    return execFileSync('git', ['-C', dirname(path), 'rev-parse', '--show-toplevel'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    return ''
  }
}

const path = extractFilePath(readStdin())
if (path === '') {
  emit(emptyPathOutcome())
  process.exit(0)
}

const root = repoRootFor(path)
if (root === '') {
  emit(noRootOutcome(path))
  process.exit(0)
}

const rel = repoRelative(path, root)
if (!inScope(rel)) process.exit(0)

// The faithful port of command -v: a PATH scan for an executable, no execution.
const valePresent = valeCandidates(process.env.PATH).some((candidate) => {
  try {
    accessSync(candidate, constants.X_OK)
    return true
  } catch {
    return false
  }
})
if (!valePresent) {
  emit(valeAbsentOutcome(rel))
  process.exit(0)
}

// spawnSync, never execFileSync: vale exits nonzero on findings, and the shell's $() captured
// output regardless of exit. Stdout and stderr merge, as 2>&1 did.
const vale = spawnSync('vale', ['--output=line', rel], { cwd: root, encoding: 'utf8' })
emit(outcomeFor(rel, (vale.stdout ?? '') + (vale.stderr ?? '')))
process.exit(0)
