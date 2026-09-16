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
// Delivery, measured 2026-09-16: only the hookSpecificOutput envelope reaches the acting
// agent -- main context and subagent alike -- while flat additionalContext, systemMessage,
// and exit-0 stderr all vanish. Stderr keeps the full log; the envelope goes to stdout only
// when there is something to act on, so a clean write stays silent in the agent's context.
const deliver = (lines: string[]) => {
  if (lines.length === 0) return
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: lines.join('\n') },
    }),
  )
}
let path = ''
if (process.argv[2] === '--hook') {
  // Everything to stderr in hook mode, as the shell's exec 1>&2 did.
  const collected: string[] = []
  const write = (line: string) => {
    collected.push(line)
    process.stderr.write(line + '\n')
  }
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
    deliver(collected)
    process.exit(0)
  }
  if (!(path.includes('/backlog/') || path.startsWith('backlog/'))) process.exit(0)
  const result = run(path, write)
  if (result.actionable) deliver(collected)
  process.exit(0)
} else {
  path = process.argv[2] ?? ''
  run(path, say)
  process.exit(0)
}

function run(target: string, out: (line: string) => void): { actionable: boolean } {
  // Bare-slug resolution: ideas checked first, ready second, last hit wins. A ready
  // item is a folder, so its file is <lane>/<slug>/proposal.md rather than <slug>.md.
  if (!existsSync(target)) {
    const slug = target.replace(/\.md$/, '')
    for (const candidate of [`backlog/ideas/${slug}.md`, `backlog/ready/${slug}/proposal.md`]) {
      if (existsSync(candidate)) target = candidate
    }
  }
  if (target === '' || !existsSync(target)) {
    out(`LAYER1 ${target === '' ? '(no path)' : target}: 0 checks, 1 findings -- path missing or unreadable`)
    return { actionable: true }
  }
  const text = readFileSync(target, 'utf8')
  const lines = text.split('\n')
  // In the folder lanes the file is always proposal.md, so the identity the name:
  // field must match is the folder's basename, not the file's.
  const stem = basename(target, '.md')
  const base = stem === 'proposal' ? basename(dirname(target)) : stem
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
  // The lane is the path segment after backlog/ -- dirname's basename would report the
  // item's own folder name for the ready/ and done/ forms.
  const afterRoot = target.includes('/backlog/') ? target.split('/backlog/')[1] : target.replace(/^backlog\//, '')
  const lane = afterRoot.includes('/') ? afterRoot.split('/')[0] : basename(dirname(target))
  out(`lane ${lane}, ${era} shape, ${newlines} lines, ${depends} depends-on mention(s)`)
  out(`LAYER1 ${target}: 6 checks, ${findings} findings`)
  return { actionable: findings > 0 }
}
