// Layer 1 of definition-of-ready.md: deterministic facts, never a judgment. Always
// exits 0 -- the board has no gate. --hook reads the PostToolUse JSON on stdin; a
// malformed or keyless payload lands in the empty-extraction branch, reported as a
// finding rather than read as nothing-to-check. A bare board slug resolves by exact
// basename -- name is identity, so the lookup is not a guess.
// Runner: bare node. Requires a node whose flag-free .ts run writes zero stderr
// bytes (type stripping, documented from v23.6; measured clean on v24.19.0).
// Erasable syntax only -- no enum, no namespace, no parameter properties.
import { existsSync, readFileSync } from 'node:fs'
import { basename, dirname } from 'node:path'

const say = (line: string) => process.stdout.write(line + '\n')
let path = ''
if (process.argv[2] === '--hook') {
  // Everything to stderr in hook mode, as the shell's exec 1>&2 did.
  const write = (line: string) => process.stderr.write(line + '\n')
  let payload: unknown
  try {
    payload = JSON.parse(readFileSync(0, 'utf8'))
  } catch {
    payload = undefined
  }
  const fp = (payload as { tool_input?: { file_path?: unknown } })?.tool_input?.file_path
  path = typeof fp === 'string' ? fp : ''
  if (path === '') {
    write('LAYER1 (no path): 0 checks, 1 findings -- extraction returned empty')
    process.exit(0)
  }
  if (!(path.includes('/ideas/') || path.startsWith('ideas/'))) process.exit(0)
  run(path, write)
} else {
  path = process.argv[2] ?? ''
  run(path, say)
}

function run(target: string, out: (line: string) => void): void {
  // Bare-slug resolution: candidates checked first, todo second, last hit wins.
  if (!existsSync(target)) {
    for (const lane of ['ideas/candidates', 'ideas/todo']) {
      const candidate = `${lane}/${target.replace(/\.md$/, '')}.md`
      if (existsSync(candidate)) target = candidate
    }
  }
  if (target === '' || !existsSync(target)) {
    out(`LAYER1 ${target === '' ? '(no path)' : target}: 0 checks, 1 findings -- path missing or unreadable`)
    process.exit(0)
  }
  const text = readFileSync(target, 'utf8')
  const lines = text.split('\n')
  const base = basename(target, '.md')
  let findings = 0
  // The frontmatter window is sed -n '2,/^---$/p' exactly: line 2 through the first
  // bare --- at or after it, inclusive; to EOF when no closer exists.
  const fm: string[] = []
  for (let i = 1; i < lines.length; i++) {
    fm.push(lines[i])
    if (lines[i] === '---') break
  }
  if (!fm.includes(`name: ${base}`)) {
    out(`name: does not match basename '${base}'`)
    findings++
  }
  if (!fm.some((l) => /^title: ./.test(l))) {
    out('title: missing or empty')
    findings++
  }
  if (!fm.some((l) => /^created: [0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(l))) {
    out('created: not a YYYY-MM-DD date')
    findings++
  }
  if (fm.some((l) => l.startsWith('status:'))) {
    out('status: present -- the directory is the status')
    findings++
  }
  const era = lines.includes('## Situation') ? 'scqa' : 'legacy'
  const first = era === 'scqa' ? '## Question' : '## Touches'
  for (const heading of [first, '## Open questions']) {
    if (!lines.includes(heading)) {
      out(`section missing: ${heading}`)
      findings++
    }
  }
  // wc -l counts newline bytes; grep -ci counts matching lines, case-insensitively.
  const newlines = (text.match(/\n/g) ?? []).length
  const depends = lines.filter((l) => l.toLowerCase().includes('depends on')).length
  out(`lane ${basename(dirname(target))}, ${era} shape, ${newlines} lines, ${depends} depends-on mention(s)`)
  out(`LAYER1 ${target}: 6 checks, ${findings} findings`)
  process.exit(0)
}
