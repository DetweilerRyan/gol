# Spec — the board hook misfits per-item artifacts

`coach` SPEC mode, 2026-09-18, in the `the-board-hook-misfits-per-item-artifacts` worktree,
branch point `b62d0dc`. **The user signs this before `writer` runs.**

This file carries no frontmatter, and its heading-plus-attribution opening is the convention
item 3 lands. It is the first artifact written under it.

`.claude/skills/idea-assess/scripts/layer1.ts` changes, and so do the three prose surfaces that
tell a reader what an artifact is. Every reading in the readings section was taken by running
the replacement file, not by predicting it.

---

## The impediment, measured

The hook's scope test asks one question: is the path under `backlog/`. There is no basename test
and no extension test, so every file in an item folder is measured against the idea-file shape.
The one artifact-aware branch is the identity check's `proposal` case. The author met this
problem once and solved it for exactly one basename.

**Two failure directions, both live.** Taken 2026-09-18 by running the hook over the board.

The noisy direction. These report `6 checks, 5 findings`, none a defect in the file:

- `backlog/done/record-two-rules-the-amendment-cycle-surfaced/spec.md`
- `backlog/done/name-the-spec-amendment-and-the-in-cycle-fix-rule/spec.md`
- `backlog/done/name-the-spec-amendment-and-the-in-cycle-fix-rule/amendment-1.md`
- `backlog/done/name-the-spec-amendment-and-the-in-cycle-fix-rule/amendment-2.md`
- `backlog/done/name-the-spec-amendment-and-the-in-cycle-fix-rule/amendment-3.md`
- `backlog/done/name-the-spec-amendment-and-the-in-cycle-fix-rule/amendment-4.md`
- `backlog/done/record-two-rules-the-amendment-cycle-surfaced/amendment-1.md`
- `backlog/done/procedure-length-clears-by-relocation/findings.md`

`backlog/TEMPLATE.md` joins them at `6 checks, 2 findings`. It is the idea-file template, not an
idea file, and the demand for `name: TEMPLATE` is the same category error one directory up.

The silent direction, and it is the worse one. These report `6 checks, 0 findings`:

- `backlog/done/extract-the-merge-protocol/spec.md`
- `backlog/done/split-the-merge-protocol-reasoning-into-its-sidecar/spec.md`
- `backlog/done/declare-the-role-cycles-in-config/design.md`
- `backlog/done/staff-the-enabler-process-pipeline/design.md`

The proposal named two. The reading names four, across two artifact kinds and four slices. Each
declares `name: spec` or `name: design`, a `title:`, and a `created:` date, because each was bent
to the shape the hook demanded. **The hook deformed them and now reads green on them.**

**Three readings the proposal did not carry, and each changes a ruling below.**

**The compelled sections carry real content.** `## Touches` in all four holds the file manifest,
and `## Open questions` in the two designs holds live questions. The deformation is in the
frontmatter, which asserts a false identity. The section names were compelled and then filled
with what a spec or a design owes its reader anyway. Ruling R5 turns on this.

**The corpus already split into two artifact eras, and the later one is right.** The eight noisy
files carry no frontmatter at all. They open with a heading and an attribution line. They read
`5 findings` for having done the correct thing. Ruling R2 ratifies practice rather than inventing
a convention.

**`split-the-merge-protocol-reasoning-into-its-sidecar/spec.md` reads `0 findings` for a second
reason.** Its `## Situation`, `## Question` and `## Open questions` sit inside a fenced
` ```markdown ` block quoting a candidate file the spec told the seat to create. The section
checks are line-exact and fence-blind, so quoted text satisfied them. Ruling R6 disposes of that.

**The envelope reaches the acting agent.** Hook mode delivers on `actionable`, so a `coach` or a
`writer` editing an artifact gets the five findings in context. Measured 2026-09-18, stdout of
`--hook` on `record-two-rules-the-amendment-cycle-surfaced/amendment-1.md`:

```text
{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":"name: does not match basename 'amendment-1'\ntitle: missing or empty\ncreated: not a YYYY-MM-DD date\nsection missing: ## Touches\nsection missing: ## Open questions\nlane done, legacy shape, 167 lines, 0 depends-on mention(s)\nLAYER1 backlog/done/record-two-rules-the-amendment-cycle-surfaced/amendment-1.md: 6 checks, 5 findings"}}
```

---

## R1 — the discriminator is positional, and it names one basename

The proposal offered basename, lane and frontmatter. **Lane and frontmatter are both refused, on
their own terms.**

**Lane cannot discriminate.** `backlog/ready/<item>/proposal.md` and
`backlog/done/<item>/proposal.md` are idea files sitting in the same folders as the artifacts. A
lane test would have to exempt or include both together.

**Frontmatter is circular and fails open.** The frontmatter is the thing under test. A file
classified as an artifact because it declares no `name:` means the `name:` check can never fire
on an idea file that lost its frontmatter — which is the defect the check exists to catch.

**Basename is right, and a shape table keyed on basenames is still wrong.** A table needs an
entry per artifact kind, a pattern for `amendment-<n>`, and an edit the day `tasks.md` first
lands. The proposal was right that `amendment-<n>` is the hardest case. **The ruling dissolves it
rather than solving it.**

Classify by **position in the board tree**, and read the basename only to recognise
`proposal.md`:

| Path shape                     | Class           | Identity        | Checks  |
| ------------------------------ | --------------- | --------------- | ------- |
| `<lane>/<name>.md`             | idea file       | the file stem   | all six |
| `<lane>/<item>/proposal.md`    | idea file       | the item folder | all six |
| anything else under `backlog/` | not a candidate | positional      | none    |

Three properties follow, and they are the argument for this form over the other two:

- **A new artifact kind needs no edit.** `tasks.md` is covered the day it lands.
- **`amendment-<n>` needs no pattern.** It is not a case.
- **A new lane directory needs no literal.** `backlog/ideas/epics-get-a-lane-and-a-pipeline.md` is
  a live candidate; this rule survives it.

`backlog/TEMPLATE.md` falls in the third row by construction, with no literal naming it.

## R2 — a per-item artifact owes no frontmatter

**Ruled: a spec, a design, an amendment, a task list and a spike's findings each carry no
frontmatter at all.** The proposal's open question offered "resolve identity from the folder as
`proposal.md` does" as the alternative. It is refused.

- **Identity is already positional.** The folder names the item and the basename names the
  artifact's job. A `name:` field restates the folder.
- **Every other field restates something authoritative.** `title:` restates the heading.
  `created:` restates what `git log --diff-filter=A` answers and cannot rot. `kind:` is
  `proposal.md`'s fact, and a second home for it is a second thing to keep in sync.
- **Practice already converged here.** The eight artifacts that carry no frontmatter are the
  eight the hook complained about. The four that carry it are the four the hook bent.

**What an artifact owes instead**: a heading naming the artifact and its item, and an attribution
line naming the authoring role, its mode, and the date. Nothing more, and nothing mechanised.

## R3 — the convention lives in `.claude/references/pipelines.md`

The proposal offered `backlog/TEMPLATE.md`, a sibling template, or `pipelines.md`.

- **`backlog/TEMPLATE.md` is the idea-file shape**, and CLAUDE.md names it as exactly that.
  Artifact shapes there conflate two shapes in one file.
- **A sibling template per artifact** is five files for three sentences, and each adds a board
  basename with its own `reference-check` exposure.
- **`pipelines.md` already names the artifacts per kind** in its Artifacts columns, and its stated
  job is the between-invocation facts including what each invoking prompt must carry. `coach.md`
  already sends `coach` there before any spec.

CLAUDE.md's ready-lane bullet already enumerates the artifacts, so it gets one pointer clause and
nothing else — routing branch 2's "at most one pointer sentence".

## R4 — split the two questions; the legacy branch stays

The era discriminator answers "does this file open with `## Situation`" and the hook reads it as
"is this an old idea file". **Splitting the questions does not retire the legacy branch, and the
board says so loudly.**

Measured 2026-09-18 over `backlog/ideas/*.md` plus both `ready/` proposals: 41 of 78 carry no
`## Situation` and classify legacy. One of them,
`backlog/ready/only-harness-writes-reach-the-language-server/proposal.md`, is a promoted ready
item with `## Context`, `## Sketch`, `## Touches` and `## Open questions`, and it reads
`6 checks, 0 findings` through the legacy branch today.

So the era check is untouched. R1 does the whole job: after it, the era branch runs only on files
that are idea files, where "legacy" means what it says.

**This narrows the sibling candidate rather than retiring it.**
`backlog/ideas/board-era-check-as-a-tengo-rule.md` ports the era check into a `Board` Tengo rule
scoped `[backlog/**/*.md]`. That glob reaches every per-item artifact, so the port must carry R1's
positional test inside the Tengo script — a Vale section glob cannot express "not
`<lane>/<item>/<non-proposal>.md`". Without it the port reintroduces the defect this slice
removes, through a second mechanism. The recommendation is in the recommendations section;
`coach` does not edit the board.

## R5 — the four deformed artifacts stay as they are, and the record lives here

**Ruled: `writer` edits nothing under `backlog/done/`.** The alternative — stripping the
frontmatter from the four — is the sign-off question I most want the user's ruling on, and it is
stated in the sign-off section.

The argument for leaving them:

- **A landed spec's bytes are immutable by `pipelines.md`'s own amendment rule.** "The spec and
  every signed amendment are immutable once the slice starts, so the signed bytes stay the signed
  bytes." Editing a landed artifact sets the precedent that a `done/` file is editable, which is a
  larger harm than the one it fixes.
- **The harm is bounded and expiring.** `backlog/done/` is the retrospective queue. No gate reads
  it: `reference-check` excludes `backlog/**` from both its surfaces, `agent-doc-check` scans
  `.claude/**` and CLAUDE.md, and the only checker that reaches a board file is Vale's
  `Board.NoStatusField`, which none of the four trips. The retrospective deletes the folders.
- **Naming them in the corpus would manufacture a new hazard.**
  `backlog/ideas/artifact-name-tokens-break-when-done-empties.md` records that `spec.md` and
  `design.md` resolve only inside `backlog/done/`, and that the retrospective reds
  `reference-check` on every file citing them. A corrective note in an article or a sidecar would
  add citations to that set. This spec is a `backlog/` file, excluded from both surfaces, and it
  expires with the folders it describes. It is the right home for the record.
- **The propagation vector is not those files.** It is the hook and the missing convention, and
  items 1 and 3 close both. Nothing reproduces the deformation after this slice.

**The record, dated.** On 2026-09-18 these four carried frontmatter declaring `name: spec` or
`name: design`, written to satisfy a check that should not have run on them. They are a record of
the demand, not of the convention:
`backlog/done/extract-the-merge-protocol/spec.md`,
`backlog/done/split-the-merge-protocol-reasoning-into-its-sidecar/spec.md`,
`backlog/done/declare-the-role-cycles-in-config/design.md`,
`backlog/done/staff-the-enabler-process-pipeline/design.md`.

Their `## Touches` and `## Open questions` sections are content-bearing and were never the
defect.

## R6 — fence-blindness is out of scope, with a falsifier

The section and frontmatter checks read every line, including lines inside a fenced block. That is
why one artifact read clean.

After R1 the section checks run on idea files alone. **Measured 2026-09-18: 0 of 78 idea files and
proposals carry `## Situation`, `## Question`, `## Open questions` or `## Touches` inside a
fence.** The change removes the only live instance by removing the file from scope.

So it is a recommendation, not an item. **The falsifier is the first idea file that quotes one of
those headings inside a fence** — most likely a candidate quoting another candidate. Same hazard
reaches `Board.NoStatusField` and the proposed Tengo rule.

---

## Files this spec changes

Execution order. Each item is complete; `writer` makes no judgement call.

### Item 1 — `.claude/skills/idea-assess/scripts/layer1.ts`, whole-file replacement

Replace the entire file with the block below. It was written, formatted, type-checked, linted and
run before being pasted here — see the verification section.

**This is a whole-block replacement, so here is every obligation the current file carries. The
replacement keeps all of them.** `writer` returns the item rather than executing it if any is
absent from the block below.

1. Exits 0 always, in both modes.
2. `--hook` parses the PostToolUse JSON from fd 0; a malformed or keyless payload reports
   `extraction returned empty` and delivers an envelope.
3. Hook mode writes every line to stderr and delivers the envelope only when actionable.
4. Bare mode writes every line to stdout.
5. Hook mode exits silently for a path outside `backlog/`.
6. Bare-slug resolution tries `backlog/ideas/<slug>.md` then `backlog/ready/<slug>/proposal.md`,
   last hit wins.
7. A missing or unreadable path reports `0 checks, 1 findings -- path missing or unreadable` and
   is actionable.
8. The frontmatter window is line 2 through the first bare `---`, inclusive, to EOF when there is
   no closer.
9. The six checks, each with its message string byte-identical to today's.
10. `proposal.md` resolves its identity from the folder.
11. The lane is the path segment after `backlog/`, falling back to the parent directory's
    basename.
12. The report line keeps its field order and wording.
13. A candidate closes with `LAYER1 <target>: 6 checks, <n> findings`.
14. Erasable syntax only, runnable by bare `node`.
15. The dated 2026-09-16 delivery note survives verbatim.

**Two comments relocate rather than disappear.** The identity note ("In the folder lanes the file
is always proposal.md…") and the lane note ("The lane is the path segment after backlog/…") both
move into `classify`'s header, where the code they describe now lives.

**One comment is new**, in the module header: the fact that no vitest project, coverage config,
Stryker config or tsconfig reaches this path, and what to run instead.

```text
// Layer 1 of definition-of-ready.md: deterministic facts, never a judgment. Always
// exits 0 -- the board has no gate. --hook reads the PostToolUse JSON on stdin; a
// malformed or keyless payload lands in the empty-extraction branch, reported as a
// finding rather than read as nothing-to-check. A bare board slug resolves by exact
// basename -- name is identity, so the lookup is not a guess.
// Runner: bare node. Requires a node whose flag-free .ts run writes zero stderr
// bytes (type stripping, documented from v23.6; measured clean on v24.19.0).
// Erasable syntax only -- no enum, no namespace, no parameter properties.
// No vitest project, coverage config, Stryker config or tsconfig reaches this path, so
// nothing type-checks or tests it on the way past. Verify a change by running the file
// in both modes over a board path, and by a standalone tsc invocation that names its
// compiler options on the command line.
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

// Two board shapes carry the candidate form and everything else does not. <lane>/<name>.md
// is a flat idea file, and <lane>/<item>/proposal.md is the same idea promoted into its own
// folder. Every other .md under an item folder is a per-item artifact -- a spec, a design,
// an amendment, a task list, a spike's findings -- and owes the candidate form nothing.
// The test is positional, so a new artifact kind needs no entry here, a numbered amendment
// needs no pattern, and a new lane directory needs no literal. proposal.md is the one
// basename this function names, and the lane is derived rather than matched.
function classify(target: string): { candidate: boolean; identity: string; lane: string } {
  const afterRoot = target.includes('/backlog/') ? target.split('/backlog/')[1] : target.replace(/^backlog\//, '')
  const segments = afterRoot.split('/')
  const lane = segments.length > 1 ? segments[0] : basename(dirname(target))
  if (segments.length === 2) return { candidate: true, identity: basename(segments[1], '.md'), lane }
  if (segments.length === 3 && segments[2] === 'proposal.md') return { candidate: true, identity: segments[1], lane }
  return { candidate: false, identity: '', lane }
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
  const shape = classify(target)
  // Not actionable, so no envelope reaches the acting agent and a spec, a design or an
  // amendment lands silently. The line still reaches stderr's full log, and it is worded
  // as a refusal to assess rather than as a pass -- SKILL.md tells the judge to stop on it.
  if (!shape.candidate) {
    out(`LAYER1 ${target}: not a candidate, 0 checks -- only an idea file carries the candidate shape`)
    return { actionable: false }
  }
  const text = readFileSync(target, 'utf8')
  const lines = text.split('\n')
  let findings = 0
  // The frontmatter window is sed -n '2,/^---$/p' exactly: line 2 through the first
  // bare --- at or after it, inclusive; to EOF when no closer exists.
  const fm: string[] = []
  for (let i = 1; i < lines.length; i++) {
    fm.push(lines[i])
    if (lines[i] === '---') break
  }
  if (!fm.includes(`name: ${shape.identity}`)) {
    out(`name: does not match basename '${shape.identity}'`)
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
  out(`lane ${shape.lane}, ${era} shape, ${newlines} lines, ${depends} depends-on mention(s)`)
  out(`LAYER1 ${target}: 6 checks, ${findings} findings`)
  return { actionable: findings > 0 }
}
```

**The identity check's message keeps the word "basename" unchanged**, even though the identity can
be a folder. It reads that way today, nothing consumes the string, and changing it would move an
observable output for no impediment. A deliberate non-change.

### Item 2 — `.claude/skills/idea-assess/SKILL.md`, one new paragraph

The skill stops on a target it cannot assess. A non-candidate line is a third stop condition
beside the two already written.

**Anchor**, the existing bold paragraph, unchanged:

```text
**Absent a `LAYER1` count line directly above, Layer 1 did not run — stop and say so. A line reporting the path missing means the target was never measured — stop the same way. Never assess on hand-computed checks.**
```

**Insert immediately after it, as its own paragraph separated by a blank line:**

```text
**A `not a candidate` line means the target is a per-item artifact rather than an idea file — stop and say so, and score nothing.**
```

It is its own paragraph rather than a fourth sentence in the anchor, deliberately.
`Instruction.ParagraphSentences` caps a paragraph at four sentences and the anchor already holds
three; a fourth would sit on the boundary for no benefit.

### Item 3 — `.claude/references/pipelines.md`, one new section

**Anchor**, the existing heading:

```text
## Story — contract-bearing
```

**Insert the block below immediately before that heading, followed by a blank line.**

```text
## Per-item artifacts — the shape they owe

A `ready/` or `done/` item is a folder. `proposal.md` is the promoted idea file, and it keeps
the shape `backlog/TEMPLATE.md` states. Every other file in that folder is a **per-item
artifact**, and it owes that shape nothing.

**A per-item artifact carries no frontmatter.** Its identity is positional. The folder names the
item and the basename names the artifact's job. A `name:` field would restate the folder and a
`title:` field the heading. `created:` restates what `git log --diff-filter=A` answers, and
`kind:` belongs to `proposal.md` alone.

**Open with a heading and an attribution line instead.** The heading names the artifact and its
item. The attribution line names the authoring role, its mode, and the date.

**The board hook checks no per-item artifact.** `.claude/skills/idea-assess/scripts/layer1.ts`
classifies by position and prints a non-candidate line rather than findings. Read that line as a
refusal to assess, never as a pass. Vale's `Board.NoStatusField` still reaches every board file,
artifacts included.

**Name the artifact's shape in the prompt of any role that writes one.** A role reaches this file
only when its own file or its invoking prompt sends it here.
```

### Item 4 — `CLAUDE.md`, one pointer clause

**Anchor**, a fragment of the `backlog/ready/<name>/` bullet:

```text
`findings.md` for a spike's recorded answer. The orchestrating session owns this board:
```

**Replace with:**

```text
`findings.md` for a spike's recorded answer. **Only `proposal.md` carries the idea-file shape**; `.claude/references/pipelines.md` states what a per-item artifact owes instead. The orchestrating session owns this board:
```

Nothing else in CLAUDE.md moves. The enumeration it already carries is correct.

---

## How `writer` verifies a TypeScript file no suite reaches

**`.claude/skills/idea-assess/scripts/layer1.ts` is inside `writer`'s write surface.** The role's
own description names `.claude/**`, and the file is not under `src/`, `scripts/`, `features/`,
`rules/` or `vale-styles/`. `writer` does not return item 1 on a boundary reading.

**What does not reach it, measured 2026-09-18 in this worktree.** `tsc -b` compiles the three
projects `tsconfig.json` references, and their includes are `src`/`features`/`perf`, a named list
of root config files, and `scripts`. No vitest config, no Stryker config, no crap4ts or dry4ts
config names the path. `reference-check`'s source surface is `src/`, `scripts/`, `features/`,
`perf/`, `rules/`, `rule-tests/` and `vale-styles/`, so the file's comments are unscanned.
`agent-doc-check` reads `.md` only.

**What does reach it, each measured on the current file.** Run all five, in this order:

1. `npx tsc --ignoreConfig --noEmit --erasableSyntaxOnly --strict --target es2023 --module nodenext --moduleResolution nodenext --types node --lib ES2023 .claude/skills/idea-assess/scripts/layer1.ts` — exit 0 today, and exit 0 on the replacement. `--ignoreConfig` is not optional: without it `tsc` refuses with TS5112 because a `tsconfig.json` is present. This is the substitute for `tsc -b`.
2. `npm run lint` — oxlint reaches the path. Bare, it reports 365 files; with `--ignore-pattern '.claude/**'` it reports 363, which is what proves the two skill scripts are in the set. Measured against oxlint 1.78.0. Three pre-existing warnings sit outside this slice's manifest; leave them.
3. `npx prettier --check .claude/skills/idea-assess/scripts/layer1.ts` — clean today and clean on the replacement. **Then run `npm run format` and `git diff` the file.** If Prettier moved a byte, report it rather than accepting it: the block in item 1 is Prettier-stable as written, so movement means the paste drifted.
4. `npm run prose-lint -- --scope .claude/skills/idea-assess` — reports 2 tracked files and 0 findings today, and covers items 1 and 2 together. **Scope the directory, never the file.** `pathspecsFor` appends `/*.md`, `/*.ts` and `/*.tsx` to the scope, so a scope naming a file matches nothing and reports a confident zero.
5. **The readings table below**, which is the real acceptance. Nothing else executes this file's logic.

**`writer` runs the readings table from the repo root with repo-relative paths.** Bare mode is
`node .claude/skills/idea-assess/scripts/layer1.ts <path>`. Hook mode is
`echo '{"tool_input":{"file_path":"<path>"}}' | node .claude/skills/idea-assess/scripts/layer1.ts --hook`.
The scope test and the envelope live only on the hook path, so a bare-mode run alone measures
neither.

---

## Check readings, before and after

**Method.** The before column was measured by running the landed file. The after column was
measured by running the replacement from a scratch location against the same repo-relative paths,
2026-09-18. `writer` re-measures at the real path and reports any row that differs.

**Two things the first pass did not measure, both since measured.** The hook's payload carries an
**absolute** `file_path`, so the repo-relative runs alone proved nothing about the live path. Re-run
2026-09-18 with absolute paths in both modes: an artifact classifies as a non-candidate, and a
proposal and an idea file each report byte-identical output to the landed file's. And the block in
item 1 was extracted back out of this spec after `prettier --write` and diffed against the verified
source: identical, Prettier-clean, and exit 0 under the `tsc` invocation above. A `text` fence is
why. **Do not re-fence it as `markdown`** — Prettier formats embedded code inside a `markdown`
fence, and that damage is on the record from an earlier spec in this pipeline.

**The hook, bare mode.** Every candidate row is byte-identical across the change.

| Target                                                                          | Before                                    | After                       |
| ------------------------------------------------------------------------------- | ----------------------------------------- | --------------------------- |
| `backlog/ideas/board-era-check-as-a-tengo-rule.md`                              | `6 checks, 0 findings`, scqa, 46 lines    | unchanged, byte for byte    |
| `backlog/ready/the-board-hook-misfits-per-item-artifacts/proposal.md`           | `6 checks, 0 findings`, scqa, 93 lines    | unchanged, byte for byte    |
| `backlog/ready/only-harness-writes-reach-the-language-server/proposal.md`       | `6 checks, 0 findings`, legacy, 287 lines | unchanged, byte for byte    |
| `backlog/done/backlog-board-migration/proposal.md`                              | `6 checks, 0 findings`, scqa, 87 lines    | unchanged, byte for byte    |
| `backlog/ideas/does-not-exist.md`                                               | `0 checks, 1 findings -- path missing`    | unchanged                   |
| bare slug `board-era-check-as-a-tengo-rule`                                     | resolves to the ideas file, `0 findings`  | unchanged                   |
| `backlog/done/extract-the-merge-protocol/spec.md`                               | `6 checks, 0 findings`                    | `not a candidate, 0 checks` |
| `backlog/done/split-the-merge-protocol-reasoning-into-its-sidecar/spec.md`      | `6 checks, 0 findings`                    | `not a candidate, 0 checks` |
| `backlog/done/record-two-rules-the-amendment-cycle-surfaced/spec.md`            | `6 checks, 5 findings`                    | `not a candidate, 0 checks` |
| `backlog/done/declare-the-role-cycles-in-config/design.md`                      | `6 checks, 0 findings`                    | `not a candidate, 0 checks` |
| `backlog/done/staff-the-enabler-process-pipeline/design.md`                     | `6 checks, 0 findings`                    | `not a candidate, 0 checks` |
| `backlog/done/name-the-spec-amendment-and-the-in-cycle-fix-rule/amendment-1.md` | `6 checks, 5 findings`                    | `not a candidate, 0 checks` |
| `backlog/done/procedure-length-clears-by-relocation/findings.md`                | `6 checks, 5 findings`                    | `not a candidate, 0 checks` |
| `backlog/TEMPLATE.md`                                                           | `6 checks, 2 findings`                    | `not a candidate, 0 checks` |

The full non-candidate line is
`LAYER1 <target>: not a candidate, 0 checks -- only an idea file carries the candidate shape`.

**The hook, hook mode.** Read stdout, which is the only stream the acting agent sees.

| Payload `file_path`                                                         | Before stdout                            | After stdout |
| --------------------------------------------------------------------------- | ---------------------------------------- | ------------ |
| `backlog/done/record-two-rules-the-amendment-cycle-surfaced/amendment-1.md` | an envelope, 5 findings                  | empty        |
| `backlog/TEMPLATE.md`                                                       | an envelope, 2 findings                  | empty        |
| `backlog/ideas/board-era-check-as-a-tengo-rule.md`                          | empty                                    | empty        |
| `CLAUDE.md`                                                                 | empty                                    | empty        |
| absent (`{}`)                                                               | an envelope, `extraction returned empty` | unchanged    |

The non-candidate line still reaches stderr in hook mode, where the full log lives. **An empty
stdout is the designed reading, and the stderr line is what distinguishes it from a skipped run.**

**This spec's own file is a live before-reading.** Writing it fires the hook on
`backlog/ready/the-board-hook-misfits-per-item-artifacts/spec.md`, which today delivers five
findings into `coach`'s context. After the change it delivers nothing.

**The gates.** Measured 2026-09-18 on the branch point.

| Command                                                    | Before                                                               | Expected after                                |
| ---------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------- |
| `npm run agent-doc-check`                                  | 54 doc files, 8 agent files, 31 rules, no failures                   | no failures; the counts do not move           |
| `npm run reference-check`                                  | 524 files scanned, 3157 references, no failures                      | no failures; `writer` records the new figures |
| `npm run prose-lint -- --scope .claude/references`         | 8 files; 1 finding, `merge-protocol.md:21` Procedure.ProcedureLength | 8 files; the same single finding              |
| `npm run prose-lint -- --scope .claude/skills/idea-assess` | 2 files, 0 findings                                                  | 2 files, 0 findings                           |
| `npm run prose-lint 2>&1 \| grep -c '^CLAUDE.md'`          | 21                                                                   | 21                                            |
| `npx tsc --ignoreConfig … layer1.ts`                       | exit 0                                                               | exit 0                                        |
| `npx prettier --check … layer1.ts`                         | clean                                                                | clean                                         |

**`--scope CLAUDE.md` reports a confident zero.** The scope form appends `/*.md` to its argument,
so the only reading for that file is the whole-tree run filtered by path. The grep form above is
the measurement, not a convenience.

**Raw Vale, repo-relative, for the three prose files this spec touches.** Measured 2026-09-18:
`vale .claude/references/pipelines.md .claude/skills/idea-assess/SKILL.md CLAUDE.md` reports
**0 errors, 21 warnings and 0 suggestions in 3 files**, every warning on `CLAUDE.md`.
`vale .claude/skills/idea-assess/scripts/layer1.ts` reports **0 errors, 0 warnings and 0
suggestions in 1 file**. Expected after: the same two readings. An absolute path lints nothing
and reports zero, so `writer` takes both with repo-relative paths and reads the `in N files`
count.

---

## What `writer` must not do

- **Edit anything under `backlog/`.** Not the four deformed artifacts, not `backlog/TEMPLATE.md`,
  not this spec, not a candidate file. R5 rules the first and R6 the last.
- **Add a shape table keyed on artifact basenames**, or a pattern for `amendment-<n>`. R1 refuses
  both by construction.
- **Touch the era discriminator, the six checks, their message strings, or the report line's
  wording.** R4 leaves them standing.
- **Add a check that runs on a per-item artifact.** The non-candidate branch reports and returns.
- **Widen `.vale.ini`, `vale-styles/**` or `rules/*.yml`.** Those are `architect`'s, and nothing
  here needs them.
- **Run an `src/` gate.** None of them reaches this diff.

---

## Out of scope, and each is a refusal rather than an omission

- **Fence-blindness in the line-exact checks.** R6, with its falsifier.
- **The Tengo port of the era check.** R4 narrows it; `coach` does not edit the board.
- **Correcting the four deformed artifacts.** R5, and the sign-off question below.
- **Moving the skill scripts under `scripts/`** so the gates reach them. It is a real design
  question — `${CLAUDE_SKILL_DIR}` and `.claude/settings.json` both name the current path — and it
  is a technical enabler, not this slice.
- **Retiring the `done/` lane's artifact citations.** `artifact-name-tokens-break-when-done-empties`
  owns it, unassessed.
- **A `## Touches` section in this spec.** The convention R2 lands asks for a heading and an
  attribution line; the file manifest sits under its own descriptive heading instead.

---

## Recommendations flowing out, for the seat to capture

`coach` writes no board file but this one. Each of these is a recommendation the seat captures or
declines.

1. **Amend `backlog/ideas/board-era-check-as-a-tengo-rule.md`** with R4's constraint: the Tengo
   rule must carry the positional classification, because `[backlog/**/*.md]` reaches every
   per-item artifact and a Vale section glob cannot exclude them. Narrowed, not retired.
2. **A new candidate: the line-exact board checks are fence-blind.** Include R6's measurement
   (0 of 78 today), its falsifier, and the note that it binds `Board.NoStatusField` and the
   proposed Tengo rule as well as the hook.
3. **A new `enabler-technical` candidate: the two `.claude/skills/**/scripts/*.ts` programs sit
   outside every test, coverage, mutation and type-check scope.** Only Prettier, oxlint and Vale
   reach them. Name the two options — relocate under `scripts/`, or add a scoped vitest project
   and tsconfig include — and name the constraint that `${CLAUDE_SKILL_DIR}` and
   `.claude/settings.json` both encode the current path. **Recommend a spike first** if the seat
   cannot tell from the docs whether a skill script may live outside its skill directory.

---

## Sign-off

The user signs this spec before `writer` is invoked. Four things to rule on, the first being the
one that most needs a ruling.

1. **R5 — the four deformed artifacts stay as they are.** The record lives in this spec, which the
   retrospective deletes alongside the folders it describes. **The alternative is a fifth item
   telling `writer` to strip the frontmatter block from all four**, leaving their `## Touches` and
   `## Open questions` sections untouched. That trades a live false identity claim for a precedent
   that a landed `done/` artifact is editable. Ruled toward leaving them; overturn it here if the
   false record matters more than the precedent.
2. **R2 — an artifact carries no frontmatter at all.** The alternative on the record is
   folder-derived identity, matching `proposal.md`. Declining this collapses items 2 through 4 as
   well.
3. **Item 4, the CLAUDE.md pointer clause.** Declinable on its own. The convention still lands in
   `pipelines.md`; a reader meeting CLAUDE.md's artifact enumeration would simply not be told
   where the shape is stated.
4. **R6 and the recommendations** — confirm that fence-blindness and the skill-script gate gap
   leave as candidates rather than entering this slice.

If this spec needs changing after sign-off, it changes through `amendment-1.md` in this folder and
never by editing these bytes.
