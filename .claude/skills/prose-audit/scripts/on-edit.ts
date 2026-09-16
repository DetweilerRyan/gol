// The write-time prose loop for the zero-baseline instruction surfaces: run Vale on the
// edited file and, on findings, name /prose-audit as the fix procedure. Always exits 0 --
// PostToolUse cannot block, and the surfaces stay advisory. An absent vale binary is
// reported loudly as NOT RUN, never read as clean, on prose-lint's probe discipline.
// Scope is skills/ and references/ only; articles and CLAUDE.md wait on their backlog triage.
// Vale matches .vale.ini section globs against the path AS GIVEN, and the harness hands this
// hook absolute paths -- measured: absolute matches no section and reads clean -- so the
// path is made repo-relative before Vale ever sees it.
// Runner: bare node. Requires a node whose flag-free .ts run writes zero stderr
// bytes (type stripping, documented from v23.6; measured clean on v24.19.0).
// Erasable syntax only -- no enum, no namespace, no parameter properties.
import { accessSync, constants, readFileSync } from 'node:fs'
import { delimiter, dirname, join } from 'node:path'
import { execFileSync, spawnSync } from 'node:child_process'

const write = (line: string) => process.stderr.write(line + '\n')
let payload: unknown
try {
  payload = JSON.parse(readFileSync(0, 'utf8'))
} catch {
  payload = undefined
}
const fp = (payload as { tool_input?: { file_path?: unknown } })?.tool_input?.file_path
const path = typeof fp === 'string' ? fp : ''
if (path === '') {
  write('PROSEHOOK (no path): extraction returned empty')
  process.exit(0)
}
let root = ''
try {
  root = execFileSync('git', ['-C', dirname(path), 'rev-parse', '--show-toplevel'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim()
} catch {
  root = ''
}
if (root === '') {
  write(`PROSEHOOK ${path}: no repo root found -- NOT RUN`)
  process.exit(0)
}
const rel = path.startsWith(root + '/') ? path.slice(root.length + 1) : path
const inScope =
  (rel.startsWith('.claude/skills/') || rel.startsWith('.claude/references/')) && rel.endsWith('.md')
if (!inScope || rel.endsWith('.meta.md')) process.exit(0)
// The faithful port of command -v: a PATH scan for an executable, no execution.
const valePresent = (process.env.PATH ?? '')
  .split(delimiter)
  .some((dir) => {
    try {
      accessSync(join(dir, 'vale'), constants.X_OK)
      return true
    } catch {
      return false
    }
  })
if (!valePresent) {
  write(`PROSEHOOK ${rel}: vale absent -- NOT RUN`)
  process.exit(0)
}
// spawnSync, never execFileSync: vale exits nonzero on findings, and the shell's $() captured
// output regardless of exit. Stdout and stderr merge, as 2>&1 did.
const vale = spawnSync('vale', ['--output=line', rel], { cwd: root, encoding: 'utf8' })
const out = (vale.stdout ?? '') + (vale.stderr ?? '')
const findings = out.split('\n').filter((l) => l.includes(':')).length
if (findings > 0) {
  process.stderr.write(out.endsWith('\n') ? out : out + '\n')
  write(`PROSEHOOK ${rel}: ${findings} finding(s) -- run /prose-audit on this file, and fix before landing`)
} else {
  write(`PROSEHOOK ${rel}: 0 findings`)
}
process.exit(0)
