# Spec — the board hook misfits per-item artifacts

`coach` SPEC mode, revision 2, 2026-09-18, in the `the-board-hook-misfits-per-item-artifacts`
worktree, rebased onto `195d1a5`. **The user signs this before any executing role runs.**

**Revision 2 is a pre-sign-off revision, made in place.** Revision 1 was never signed: the user
declined to sign a spec that changes untested logic and ruled the testability work first. It
landed as `slice/spike-where-a-skill-script-can-live-and-be-tested` and
`slice/relocate-the-skill-hooks-into-the-tested-tier`, which moved the program this slice edits.
No amendment is involved, because the amendment mechanism protects a signature and there is none.

This file carries no frontmatter, and its heading-plus-attribution opening is the convention
item 3 lands. It is the first artifact written under it.

---

## What revision 2 changes

**The target moved.** `.claude/skills/idea-assess/scripts/layer1.ts` no longer exists. The logic
is `scripts/board-shape-hook/board-shape.ts`, its I/O shell is `run.ts`, the shared wire contract
is `scripts/post-tool-use.ts`, and the program is tested and mutation-scored. So revision 1's
whole-file replacement, its "no gate reaches this file" section, and its standalone `tsc`
invocation are all withdrawn.

**Every reading was retaken** against the relocated program on the rebased tree. The deformed-
artifact count moved, and a seventh artifact kind appeared.

**Three rulings are new**, and each exists only because of the move: where the change sits in the
decomposed module (R7), a scope expansion that contradicts an `architect` DESIGN ruling (R8), and
who executes a slice whose diff now lands in two trees (R9).

**Every ruling from revision 1 survives.** Each was re-verified rather than re-derived, and R1 and
R5 are strengthened by facts that arrived during the delay.

---

## The impediment, measured on the rebased tree

`checkShape` is reached for any path `run.ts` resolves, and `isBoardPath` gates only on "is this
under `backlog/`". There is no shape test, so every file in an item folder is measured against the
idea-file shape. The one artifact-aware branch is `checkShape`'s `stem === 'proposal'` case. The
author met this problem once and solved it for exactly one basename.

**The board now holds sixteen per-item artifacts across seven basenames.** Taken 2026-09-18 by
running `node scripts/board-shape-hook/run.ts` over every non-`proposal.md` file in `ready/` and
`done/`:

| Artifact                                                                        | Reading now            |
| ------------------------------------------------------------------------------- | ---------------------- |
| `backlog/done/declare-the-role-cycles-in-config/design.md`                      | `6 checks, 0 findings` |
| `backlog/done/extract-the-merge-protocol/spec.md`                               | `6 checks, 0 findings` |
| `backlog/done/split-the-merge-protocol-reasoning-into-its-sidecar/spec.md`      | `6 checks, 0 findings` |
| `backlog/done/staff-the-enabler-process-pipeline/design.md`                     | `6 checks, 0 findings` |
| `backlog/done/relocate-the-skill-hooks-into-the-tested-tier/design.md`          | `6 checks, 2 findings` |
| `backlog/done/name-the-spec-amendment-and-the-in-cycle-fix-rule/spec.md`        | `6 checks, 5 findings` |
| `backlog/done/name-the-spec-amendment-and-the-in-cycle-fix-rule/amendment-1.md` | `6 checks, 5 findings` |
| `backlog/done/name-the-spec-amendment-and-the-in-cycle-fix-rule/amendment-2.md` | `6 checks, 5 findings` |
| `backlog/done/name-the-spec-amendment-and-the-in-cycle-fix-rule/amendment-3.md` | `6 checks, 5 findings` |
| `backlog/done/name-the-spec-amendment-and-the-in-cycle-fix-rule/amendment-4.md` | `6 checks, 5 findings` |
| `backlog/done/record-two-rules-the-amendment-cycle-surfaced/spec.md`            | `6 checks, 5 findings` |
| `backlog/done/record-two-rules-the-amendment-cycle-surfaced/amendment-1.md`     | `6 checks, 5 findings` |
| `backlog/done/procedure-length-clears-by-relocation/findings.md`                | `6 checks, 5 findings` |
| `backlog/done/spike-where-a-skill-script-can-live-and-be-tested/findings.md`    | `6 checks, 5 findings` |
| `backlog/done/relocate-the-skill-hooks-into-the-tested-tier/retro.md`           | `6 checks, 5 findings` |
| `backlog/ready/the-board-hook-misfits-per-item-artifacts/spec.md`               | `6 checks, 5 findings` |

`backlog/TEMPLATE.md` joins them at `6 checks, 2 findings`. It is the idea-file template, not an
idea file, and the demand for `name: TEMPLATE` is the same category error one directory up.

**Two failure directions, and the silent one is worse.** Eleven artifacts report findings that are
not defects in them. Four report `6 checks, 0 findings` because each was bent to the demanded
shape. **The hook deformed them and now reads green on them.**

**Three facts the readings carry that a prediction would not.**

**The deformation propagated once more while this spec sat unsigned.**
`backlog/done/relocate-the-skill-hooks-into-the-tested-tier/design.md` landed 2026-09-18
declaring `name: design`. Five artifacts now carry frontmatter, and all five declare a false
`name:` — the four that read clean, plus this one, which was bent halfway and still reports its
two missing sections. **The vector is the hook, not the files, and it is still firing.**

**A seventh artifact kind arrived that nobody named.**
`backlog/done/relocate-the-skill-hooks-into-the-tested-tier/retro.md` is not in the proposal's
census, not in `pipelines.md`'s Artifacts columns, and not in CLAUDE.md's ready-folder
enumeration. A basename-keyed shape table would have missed it the day it landed. R1's positional
rule covers it with no entry, and this is the measured argument for that form rather than a
predicted one.

**The compelled sections carry real content.** `## Touches` in the deformed artifacts holds the
file manifest, and `## Open questions` holds live questions. The deformation is in the frontmatter,
which asserts a false identity. R5 turns on this.

**The envelope reaches the acting agent.** `run.ts` writes `envelope(outcome.lines)` to stdout when
`deliver` is true, so a role editing an artifact gets the findings in context. Writing this very
file fired the hook and delivered five.

---

## R1 — the discriminator is positional, and it names one basename

Survives revision 1 unchanged, and `retro.md` is new evidence for it.

The proposal offered basename, lane and frontmatter. **Lane and frontmatter are both refused on
their own terms.**

**Lane cannot discriminate.** `backlog/ready/<item>/proposal.md` and
`backlog/done/<item>/proposal.md` are idea files sitting in the same folders as the artifacts.

**Frontmatter is circular and fails open.** The frontmatter is the thing under test. Classifying a
file as an artifact because it declares no `name:` means the `name:` check can never fire on an
idea file that lost its frontmatter — the defect the check exists to catch.

**Basename is right, and a shape table keyed on basenames is still wrong.** A table needs an entry
per artifact kind, a pattern for `amendment-<n>`, and an edit each time a kind appears. `retro.md`
is the proof: it landed after the proposal's census and would have been measured against the
idea-file shape until somebody noticed.

Classify by **position in the board tree**, and read the basename only to recognise `proposal.md`:

| Path shape                     | Class           | Identity        | Checks  |
| ------------------------------ | --------------- | --------------- | ------- |
| `<lane>/<name>.md`             | idea file       | the file stem   | all six |
| `<lane>/<item>/proposal.md`    | idea file       | the item folder | all six |
| anything else under `backlog/` | not a candidate | positional      | none    |

Four properties follow, and they are the argument for this form:

- **A new artifact kind needs no edit.** `retro.md` was covered before it existed, and `tasks.md`
  is covered before it exists.
- **`amendment-<n>` needs no pattern.** It is not a case.
- **A new lane directory needs no literal.** `backlog/ideas/epics-get-a-lane-and-a-pipeline.md` is
  a live candidate; this rule survives it.
- **`backlog/TEMPLATE.md` falls out by construction**, with no literal naming it.

## R2 — a per-item artifact owes no frontmatter

Survives revision 1 unchanged.

**Ruled: a spec, a design, an amendment, a task list, a spike's findings and a retro each carry no
frontmatter at all.** The proposal's alternative — folder-derived identity, as `proposal.md` has —
is refused.

- **Identity is already positional.** The folder names the item and the basename names the
  artifact's job. A `name:` field restates the folder.
- **Every other field restates something authoritative.** `title:` restates the heading.
  `created:` restates what `git log --diff-filter=A` answers and cannot rot. `kind:` is
  `proposal.md`'s fact.
- **Practice already converged here.** The eleven artifacts that carry no frontmatter are the
  eleven the hook complained about. The five that carry it are the five the hook bent.

**What an artifact owes instead**: a heading naming the artifact and its item, and an attribution
line naming the authoring role, its mode, and the date. Nothing more, and nothing mechanised.

## R3 — the convention lives in `.claude/references/pipelines.md`

Survives revision 1 unchanged.

`backlog/TEMPLATE.md` is the idea-file shape and CLAUDE.md names it as exactly that; artifact
shapes there conflate two shapes in one file. A sibling template per artifact is a file per kind
for three sentences, and `retro.md` shows the kinds are not a closed set. `pipelines.md` already
names the artifacts per kind in its Artifacts columns, its stated job is the between-invocation
facts including what each invoking prompt must carry, and `coach.md` already sends `coach` there
before any spec.

CLAUDE.md's ready-lane bullet already enumerates the artifacts, so it gets one pointer clause and
nothing else — routing branch 2's "at most one pointer sentence".

## R4 — split the two questions; the legacy branch stays

Survives revision 1; census retaken on the rebased tree.

The era discriminator answers "does this file open with `## Situation`" and the hook reads it as
"is this an old idea file". **Splitting the questions does not retire the legacy branch.**

Measured 2026-09-18 over every candidate — `backlog/ideas/*.md` plus every `proposal.md` — **41 of
91 carry no `## Situation` and classify legacy.** One of them,
`backlog/ready/only-harness-writes-reach-the-language-server/proposal.md`, is a live `ready/` item
reading `6 checks, 0 findings` through that branch today.

So the era check is untouched. R1 does the whole job: after it, the era branch runs only on files
that are idea files, where "legacy" means what it says.

**This narrows the sibling candidate rather than retiring it.**
`backlog/ideas/board-era-check-as-a-tengo-rule.md` ports the era check into a `Board` Tengo rule
scoped `[backlog/**/*.md]`. That glob reaches every per-item artifact, so the port must carry R1's
positional test inside the Tengo script — a Vale section glob cannot express "not
`<lane>/<item>/<non-proposal>.md`". Without it the port reintroduces this defect through a second
mechanism.

## R5 — the deformed artifacts stay as they are, and the record lives here

Survives revision 1, and the fifth artifact strengthens it.

**Ruled: no executing role edits anything under `backlog/done/`.** The alternative is the sign-off
question below.

- **A landed spec's bytes are immutable by `pipelines.md`'s own amendment rule** — "the signed
  bytes stay the signed bytes". Editing a landed artifact sets the precedent that a `done/` file is
  editable, a larger harm than the one it fixes.
- **The harm is bounded and expiring.** `backlog/done/` is the retrospective queue. No gate reads
  it: `reference-check` excludes `backlog/**` from both surfaces, `agent-doc-check` scans
  `.claude/**` and CLAUDE.md, and the only checker reaching a board file is Vale's
  `Board.NoStatusField`, which none of the five trips.
- **Naming them in the corpus would manufacture a new hazard.**
  `backlog/ideas/artifact-name-tokens-break-when-done-empties.md` records that `spec.md` and
  `design.md` resolve only inside `backlog/done/`, and that the retrospective reds
  `reference-check` on every file citing them. A corrective note in an article or a sidecar adds
  to that set. This spec is a `backlog/` file, excluded from both surfaces, and it expires with the
  folders it describes.
- **The fifth artifact proves the vector.** `relocate-the-skill-hooks-into-the-tested-tier/design.md`
  was deformed while this spec sat unsigned, by the hook and by the absent convention. Items 1 and
  3 close both. Editing the five closes neither.

**The record, dated.** On 2026-09-18 these five carried frontmatter declaring `name: spec` or
`name: design`, written to satisfy a check that should not have run on them. They are a record of
the demand, not of the convention:
`backlog/done/declare-the-role-cycles-in-config/design.md`,
`backlog/done/extract-the-merge-protocol/spec.md`,
`backlog/done/relocate-the-skill-hooks-into-the-tested-tier/design.md`,
`backlog/done/split-the-merge-protocol-reasoning-into-its-sidecar/spec.md`,
`backlog/done/staff-the-enabler-process-pipeline/design.md`.

Their `## Touches` and `## Open questions` sections are content-bearing and were never the defect.

## R6 — fence-blindness is out of scope, with a falsifier

Survives revision 1; census retaken.

The section and frontmatter checks read every line, including lines inside a fenced block. That is
why `split-the-merge-protocol-reasoning-into-its-sidecar/spec.md` reads clean: its `## Situation`,
`## Question` and `## Open questions` sit inside a fenced block quoting a candidate file it told
the seat to create.

After R1 the section checks run on candidates alone. **Measured 2026-09-18: 0 of 91 candidates
carry `## Situation`, `## Question`, `## Open questions` or `## Touches` inside a fence.** The
change removes the only live instance by removing the file from scope.

**The falsifier is the first idea file that quotes one of those headings inside a fence.** The same
hazard reaches `Board.NoStatusField` and the proposed Tengo rule.

## R7 — the change sits behind `checkShape`'s first line, and `laneFor` loses a dead branch

New in revision 2. `architect`'s DESIGN pass named `board-shape.ts` as the seam and `checkShape` as
where a shape table goes. The classification goes there, as a guard clause.

**Two private helpers, not exports.** `frontmatterWindow`, `identityFindings`, `sectionFindings`
and `laneFor` are all private, tested through `checkShape`. `isCandidatePath` and
`notACandidateOutcome` follow that shape. `isBoardPath` is exported because `run.ts` calls it as a
pre-read gate; nothing outside the module calls these two. If `architect` at REVIEW prefers an
export for direct testing, that is a REVIEW finding, not an executing role's call.

**`laneFor`'s fallback becomes dead code, and the spec deletes it.** `laneFor` reads
`segments.length > 1 ? segments[0] : basename(dirname(target))`. A candidate always has two or
three segments, so after the guard the false branch is unreachable. Left in place it is a mutant
factory and a coverage hole that `architect` would rightly flag. Item 1 collapses it to
`segmentsAfterRoot(target)[0]`.

**Two existing tests guarded invariants that moved rather than disappeared**, and item 2 rewrites
each to assert the invariant at its new site. This is `claim-discipline.md`'s "ask whether a gate
still encodes its invariant", applied to a test.

- "falls back to the dirname basename for a lane path with no subdirectory segment" guarded
  `laneFor`'s fallback. The live invariant is now **a file directly under `backlog/` is not a
  candidate** — `backlog/TEMPLATE.md`.
- "anchors the backlog/ prefix strip to the start of the path" guarded the `^backlog/` anchor
  through `laneFor`. **The anchor is still load-bearing, one function along**: unanchored,
  `zzbacklog/sub/foo.md` strips to `sub/foo.md`, which is two segments and therefore a candidate.
  The test asserts the classification instead of the lane.

**One behaviour widens beyond the board, deliberately.** An argv target that is not board-shaped at
all — `/idea-assess` pointed at `src/camera.ts` — now reports the refusal rather than six checks.
That is the same category error the slice exists to fix, and SKILL.md's guard already tells the
judge to stop.

**The read is not skipped.** `run.ts` reads the file before calling `checkShape`, so a non-candidate
is read and then ignored. Moving the classification ahead of the read would edit `run.ts`, which
`architect`'s seam ruling excludes, and the cost is one read of a file the hook was already
reading. Named rather than fixed.

## R8 — the slice must also edit `run.test.ts`, which contradicts a DESIGN ruling

New in revision 2, and it needs the user rather than me.

`architect`'s DESIGN pass ruled that this slice edits `board-shape.ts` and `board-shape.test.ts`
**and nothing else**. `rules/no-process-io-outside-run-in-hook-programs.yml`'s `note` records the
same claim in prose.

**Measured, by building the whole change and running the existing suite against it: four tests
fail, two of them in `run.test.ts`.** The scope ruling is false for the test tier.

| Failing test                                                                               | File                  | Why                                                |
| ------------------------------------------------------------------------------------------ | --------------------- | -------------------------------------------------- |
| `falls back to the dirname basename for a lane path with no subdirectory segment`          | `board-shape.test.ts` | `backlog/clean.md` is now a non-candidate          |
| `anchors the backlog/ prefix strip to the start of the path, not any occurrence`           | `board-shape.test.ts` | `zzbacklog/sub/foo.md` is now a non-candidate      |
| `argv mode > writes the report to stdout, nothing to stderr, and exits 0 for a clean file` | `run.test.ts`         | its fixture is `clean.md` at the temp-dir root     |
| `--hook mode > delivers the envelope on stdout and the log on stderr when a check fails`   | `run.test.ts`         | its fixture is `<tmp>/backlog/bad.md`, one segment |

The two `run.test.ts` failures are **fixture paths, not claims**. Each test pins the shell contract
— mode dispatch, stream discipline, the envelope — and each happens to use a path that the new rule
reclassifies. Moving both fixtures into `backlog/ideas/` leaves every assertion intact.

**A third `run.test.ts` test passes but stops measuring anything**, which is why item 4 changes it
too. `never emits a hookSpecificOutput envelope, even when findings exist` writes `bad.md` at the
temp-dir root. After the change that file is a non-candidate, so it produces **no** findings, and
the test's "even when findings exist" premise is gone while the assertion still passes. It would go
green measuring nothing — the confident-zero class this repo names everywhere else. Item 4 moves
its fixture too and adds the assertion that findings were actually produced.

**Recommended: widen the slice to `scripts/board-shape-hook/run.test.ts`.** The cost, stated in
full: one more file in the manifest; no production code outside `board-shape.ts`; the seam rule
untouched, since it constrains the pure module's imports and `board-shape.ts` still imports only
`node:path` and a type; and `hardener` runs the same stages either way. **The alternative is a
round trip to `architect` for an amended DESIGN, to authorise a fixture change.** Scope is the
user's, so this sits in the sign-off.

## R9 — who executes a slice whose diff lands in two trees

New in revision 2, and it is the blocker the move created.

**`writer` may not write `scripts/`.** Its role file and its frontmatter both say so: "Never write
`src/`, `scripts/`, `features/`, `rules/`, or `vale-styles/`." Item 1 is now unexecutable by the
process pipeline's executing role.

**The kind discriminator no longer decides this slice.** `definition-of-ready.md` splits the
sub-kind by which tree the diff lands in: the tree the gates measure is `enabler-technical`, the
instructions that run the gates is `enabler-process`. **This diff lands in both**, and the
discriminator is silent on that case.

**Ruled: keep `kind: enabler-process` and dispatch item 1 to `coder`.** The ruling is a process
ruling and the code is its mechanism, exactly as a story's spec dispatches implementation. The
cycle becomes:

**coach SPEC → user sign-off → coder (item 1) → cleaner → writer (items 2 to 4) → editor CLEAN →
editor AUDIT → architect REVIEW → hardener → coach REVIEW**

- `architect` DESIGN already ran on this slice, so the pre-implementation gate an enabler owes is
  paid.
- `cleaner` runs after `coder`, per the seat's standing sequencing rule.
- **`hardener` now owes the scripts-scoped stages** — `npm run test:mutation:scripts`,
  `npm run crap4ts:scripts`, `npm run dry4ts:scripts` — which the corpus-only version did not.
- The bare chain above is mode-decorated, so `agent-doc-check`'s check 4 does not bind it.

**The alternatives, both declined and both reopenable at sign-off.** Re-kinding to
`enabler-technical` makes items 2 to 4 a corpus side-edit, which `pipelines.md` itself calls a
split signal. Splitting into two slices opens a window in which the program refuses artifacts and
nothing in the corpus says why.

---

## Files this spec changes

Execution order. Each item is complete; no executing role makes a judgement call.

**Every block below was built and run before being written here.** The module and both test files
were patched in a scratch mirror of `scripts/`, formatted with this repo's Prettier config, and
executed under vitest: **46 tests pass, against 33 before.**

### Item 1 — `scripts/board-shape-hook/board-shape.ts` (`coder`)

**Replacement A.** Replace `laneFor` and its comment with three functions. Anchor:

```text
// The lane is the path segment after backlog/ -- dirname's basename would
// report the item's own folder name for the ready/ and done/ forms.
function laneFor(target: string): string {
  const afterRoot = target.includes('/backlog/') ? target.split('/backlog/')[1] : target.replace(/^backlog\//, '')
  return afterRoot.includes('/') ? afterRoot.split('/')[0] : basename(dirname(target))
}
```

Replace with:

```text
// The board-relative path segments. `/backlog/` marks an absolute path and a
// leading `backlog/` a relative one; a target under neither keeps all of its
// segments, which is what makes an off-board argv target a non-candidate.
function segmentsAfterRoot(target: string): string[] {
  const afterRoot = target.includes('/backlog/') ? target.split('/backlog/')[1] : target.replace(/^backlog\//, '')
  return afterRoot.split('/')
}

// The lane is the first board-relative segment. Only a candidate reaches
// here, and every candidate has at least two segments, so there is no
// shorter form to fall back to.
function laneFor(target: string): string {
  return segmentsAfterRoot(target)[0]
}

// Two board shapes carry the candidate form and everything else does not.
// `<lane>/<name>.md` is a flat idea file, and `<lane>/<item>/proposal.md` is
// the same idea promoted into its own folder. Every other .md under an item
// folder is a per-item artifact -- a spec, a design, an amendment, a task
// list, a spike's findings -- and owes the candidate form nothing. The test is
// positional, so a new artifact kind needs no entry here, a numbered amendment
// needs no pattern, and a new lane directory needs no literal.
function isCandidatePath(target: string): boolean {
  const segments = segmentsAfterRoot(target)
  if (segments.length === 2) return true
  return segments.length === 3 && segments[2] === 'proposal.md'
}

// deliver is false, so no envelope reaches the acting agent and writing a
// spec, a design or an amendment stays silent. The line still reaches the log
// stream, worded as a refusal to assess rather than as a pass.
function notACandidateOutcome(target: string): HookOutcome {
  const line = `LAYER1 ${target}: not a candidate, 0 checks -- only an idea file carries the candidate shape`
  return { lines: [line], deliver: false }
}
```

**Replacement B.** Add the guard clause as `checkShape`'s first statement. Anchor:

```text
export function checkShape(target: string, text: string): HookOutcome {
  const textLines = text.split('\n')
```

Replace with:

```text
export function checkShape(target: string, text: string): HookOutcome {
  if (!isCandidatePath(target)) return notACandidateOutcome(target)
  const textLines = text.split('\n')
```

**Nothing else in the file moves.** `isBoardPath`, `resolveTarget`, `emptyPathOutcome`,
`missingOutcome`, `frontmatterWindow`, `identityFindings`, `sectionFindings`, the six check message
strings, the report line, the `LAYER1` tally, the `proposal` folder-identity case, the equivalent-
mutant note on `frontmatterWindow`, and the `checkShape` JSDoc all stay byte-identical. `dirname`
stays imported — `checkShape` still uses it for the proposal case.

**The seam rule is satisfied.** After the change `board-shape.ts` imports `node:path` and a type
from `../post-tool-use.ts`, and references neither `process`, `node:fs` nor `node:child_process`.

### Item 2 — `scripts/board-shape-hook/board-shape.test.ts` (`coder`)

**Replacement A**, the test whose invariant moved to `backlog/TEMPLATE.md`. Anchor:

```text
  it('falls back to the dirname basename for a lane path with no subdirectory segment', () => {
    const outcome = checkShape('backlog/clean.md', CLEAN.replace('name: clean', 'name: clean'))
    expect(outcome.lines[0]).toMatch(/^lane backlog,/)
  })
```

Replace with:

```text
  it('refuses a file sitting directly under backlog/ and pins the whole non-candidate outcome', () => {
    expect(checkShape('backlog/TEMPLATE.md', CLEAN)).toEqual({
      lines: ['LAYER1 backlog/TEMPLATE.md: not a candidate, 0 checks -- only an idea file carries the candidate shape'],
      deliver: false,
    })
  })
```

This one assertion pins the exact line and `deliver: false` together, which is what kills the
string-literal and boolean mutants on `notACandidateOutcome`.

**Replacement B**, the anchor test, re-aimed at the classification. Anchor:

```text
  it('anchors the backlog/ prefix strip to the start of the path, not any occurrence', () => {
    const text = CLEAN.replace('name: clean', 'name: foo')
    const outcome = checkShape('zzbacklog/sub/foo.md', text)
    expect(outcome.lines[0]).toMatch(/^lane zzbacklog,/)
  })
```

Replace with:

```text
  it('anchors the backlog/ prefix strip to the start of the path, not any occurrence', () => {
    // Unanchored, the strip would leave `sub/foo.md` -- two segments, and so a
    // candidate. The anchor is what keeps a look-alike directory off the board.
    expect(checkShape('zzbacklog/sub/foo.md', CLEAN).lines[0]).toContain('not a candidate')
  })
```

**Addition C**, a new top-level `describe` appended at the end of the file, after the closing `})`
of the existing `checkShape` block:

```text
describe('checkShape candidate classification', () => {
  const REFUSAL = 'not a candidate, 0 checks -- only an idea file carries the candidate shape'
  it.each([
    { name: 'a flat idea file is a candidate', target: 'backlog/ideas/foo.md', candidate: true },
    { name: 'a ready-lane proposal is a candidate', target: 'backlog/ready/foo/proposal.md', candidate: true },
    { name: 'a done-lane proposal is a candidate', target: 'backlog/done/foo/proposal.md', candidate: true },
    {
      name: 'an absolute proposal path classifies the same',
      target: '/repo/backlog/done/foo/proposal.md',
      candidate: true,
    },
    { name: 'a spec is a per-item artifact', target: 'backlog/ready/foo/spec.md', candidate: false },
    { name: 'a design is a per-item artifact', target: 'backlog/done/foo/design.md', candidate: false },
    { name: 'a numbered amendment needs no pattern', target: 'backlog/done/foo/amendment-11.md', candidate: false },
    { name: 'an unbuilt tasks.md needs no new entry', target: 'backlog/ready/foo/tasks.md', candidate: false },
    { name: 'a spike findings file is a per-item artifact', target: 'backlog/done/foo/findings.md', candidate: false },
    {
      name: 'an absolute artifact path classifies the same',
      target: '/repo/backlog/done/foo/spec.md',
      candidate: false,
    },
    { name: 'a fourth segment is not a candidate', target: 'backlog/ready/foo/sub/proposal.md', candidate: false },
    { name: 'an off-board argv target is not a candidate', target: 'clean.md', candidate: false },
  ])('$name', ({ target, candidate }) => {
    expect((checkShape(target, CLEAN).lines.at(-1) ?? '').includes(REFUSAL)).toBe(!candidate)
  })
})
```

The two-object rows are Prettier's own wrapping, not a style choice. The block above is
Prettier-stable as written.

### Item 3 — `scripts/board-shape-hook/run.test.ts` (`coder`, and see R8)

**This item is the scope expansion R8 describes. It runs only if the user grants it.**

**Replacement A**, the argv clean-file fixture. Anchor:

```text
    writeFileSync(path.join(dir, 'clean.md'), CLEAN)
    const result = runArgv(dir, ['clean.md'])
    expect(result.status).toBe(0)
    expect(result.stderr).toBe('')
    expect(result.stdout).toContain('LAYER1 clean.md: 6 checks, 0 findings')
```

Replace with:

```text
    mkdirSync(path.join(dir, 'backlog', 'ideas'), { recursive: true })
    writeFileSync(path.join(dir, 'backlog', 'ideas', 'clean.md'), CLEAN)
    const result = runArgv(dir, ['backlog/ideas/clean.md'])
    expect(result.status).toBe(0)
    expect(result.stderr).toBe('')
    expect(result.stdout).toContain('LAYER1 backlog/ideas/clean.md: 6 checks, 0 findings')
```

**Replacement B**, the argv envelope test — the one that would otherwise pass while measuring
nothing. Anchor:

```text
    writeFileSync(path.join(dir, 'bad.md'), '---\nname: nope\n---\n')
    const result = runArgv(dir, ['bad.md'])
    expect(result.status).toBe(0)
    expect(result.stdout).not.toContain('hookSpecificOutput')
```

Replace with:

```text
    mkdirSync(path.join(dir, 'backlog', 'ideas'), { recursive: true })
    writeFileSync(path.join(dir, 'backlog', 'ideas', 'bad.md'), '---\nname: nope\n---\n')
    const result = runArgv(dir, ['backlog/ideas/bad.md'])
    expect(result.status).toBe(0)
    expect(result.stdout).toContain('6 checks,')
    expect(result.stdout).not.toContain('hookSpecificOutput')
```

The added `toContain('6 checks,')` is what keeps the test's "even when findings exist" premise
true rather than assumed.

**Replacement C**, the hook-mode envelope fixture. Anchor:

```text
    mkdirSync(path.join(dir, 'backlog'), { recursive: true })
    const target = path.join(dir, 'backlog', 'bad.md')
```

Replace with:

```text
    mkdirSync(path.join(dir, 'backlog', 'ideas'), { recursive: true })
    const target = path.join(dir, 'backlog', 'ideas', 'bad.md')
```

**Addition D**, a new test inside the `--hook mode` describe, immediately before
`it('reports the empty-extraction finding for a malformed payload', ...)`:

```text
  it('logs a per-item artifact to stderr and delivers no envelope', () => {
    const dir = tempDir('board-shape-hook-')
    mkdirSync(path.join(dir, 'backlog', 'ready', 'item'), { recursive: true })
    const target = path.join(dir, 'backlog', 'ready', 'item', 'spec.md')
    writeFileSync(target, '# Spec\n')
    const result = runHook(JSON.stringify({ tool_input: { file_path: target } }))
    expect(result.status).toBe(0)
    expect(result.stderr).toContain('not a candidate')
    expect(result.stdout).toBe('')
  })
```

This is the only test covering `run.ts`'s handling of a `deliver: false` outcome in hook mode. No
existing test reaches that path — every current hook test delivers.

`mkdirSync` is already imported in this file. No import changes.

### Item 4 — `.claude/skills/idea-assess/SKILL.md`, one new paragraph (`writer`)

The skill stops on a target it cannot assess. A non-candidate line is a third stop condition beside
the two already written.

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

### Item 5 — `.claude/references/pipelines.md`, one new section (`writer`)

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

**The kinds are not a closed set.** `scripts/board-shape-hook/board-shape.ts` classifies by
position rather than by basename, so an artifact kind nobody has named yet is covered on the day
it lands.

**The board hook checks no per-item artifact.** It prints a non-candidate line rather than
findings. Read that line as a refusal to assess, never as a pass. Vale's `Board.NoStatusField`
still reaches every board file, artifacts included.

**Name the artifact's shape in the prompt of any role that writes one.** A role reaches this file
only when its own file or its invoking prompt sends it here.
```

### Item 6 — `CLAUDE.md`, one pointer clause (`writer`)

**Anchor**, a fragment of the `backlog/ready/<name>/` bullet:

```text
`findings.md` for a spike's recorded answer. The orchestrating session owns this board:
```

**Replace with:**

```text
`findings.md` for a spike's recorded answer. **Only `proposal.md` carries the idea-file shape**; `.claude/references/pipelines.md` states what a per-item artifact owes instead. The orchestrating session owns this board:
```

Nothing else in CLAUDE.md moves. Its artifact enumeration stays as it is — `retro.md` is a live
counterexample to enumerating them, and the clause above points at the file that says so.

---

## How the change is verified, and one thing that cannot be

**The verification story is now ordinary, and revision 1's was not.** The program sits in
`scripts/`, so `tsc -b` type-checks it through `tsconfig.scripts.json`, `npm run test:scripts` runs
it, Stryker scores it, and `crap4ts:scripts` and `dry4ts:scripts` measure it. Revision 1's
standalone `tsc --ignoreConfig` invocation and its "no gate reaches this file" inventory are both
withdrawn.

**`coder` runs, for items 1 to 3:** `npm run test:scripts`, `npm run build`, `npm run ast-grep`,
`npm run lint`, `npm run format`. Its own file carries the rest.

**`writer` runs, for items 4 to 6:** `npm run prose-lint -- --scope <path>` per edited file,
`npm run agent-doc-check`, `npm run reference-check`, `npm run format`.

**`hardener` adds the scripts-scoped stages**, per R9.

**The changed hook cannot be live-fired from this worktree, and no role should try.** A hook's
project-directory variable stays at the session's starting root across a worktree entry, so a hook
firing here runs the **main checkout's** copy of `run.ts` — the unchanged one. A Write to a board
file in this worktree therefore measures the old program and reads like a failed change.

**So every reading below is taken by invoking the program directly**, from the repo root with
repo-relative paths:

- bare mode: `node scripts/board-shape-hook/run.ts <path>`
- hook mode: `echo '{"tool_input":{"file_path":"<path>"}}' | node scripts/board-shape-hook/run.ts --hook`

The live-fire confirmation belongs to the seat, in a fresh session after the slice lands. It is not
an executing role's obligation and not a merge gate.

---

## Check readings, before and after

**Method.** The before column was taken by running the landed program on the rebased tree,
2026-09-18. The after column was taken the same day by running the fully patched program from a
scratch mirror against the same repo-relative paths. Every executing role re-measures in the real
tree and reports any row that differs.

**The candidate path does not move.** Measured across **91 candidates** — every
`backlog/ideas/*.md` plus every `proposal.md` in `ready/` and `done/` — by diffing the landed
program's complete output against the patched program's: **0 differ.** That is the strongest form
of the claim available, and it replaces revision 1's row-by-row sample.

**Per-item artifacts.** All sixteen, plus the template:

| Target                                                                        | Before                 | After                       |
| ----------------------------------------------------------------------------- | ---------------------- | --------------------------- |
| the four that read clean (R5's record, minus the halfway one)                 | `6 checks, 0 findings` | `not a candidate, 0 checks` |
| `relocate-the-skill-hooks-into-the-tested-tier/design.md`                     | `6 checks, 2 findings` | `not a candidate, 0 checks` |
| the ten that read five findings, `retro.md` and both `findings.md` among them | `6 checks, 5 findings` | `not a candidate, 0 checks` |
| `backlog/ready/the-board-hook-misfits-per-item-artifacts/spec.md`             | `6 checks, 5 findings` | `not a candidate, 0 checks` |
| `backlog/TEMPLATE.md`                                                         | `6 checks, 2 findings` | `not a candidate, 0 checks` |

The full line is
`LAYER1 <target>: not a candidate, 0 checks -- only an idea file carries the candidate shape`.

**Hook mode.** Read stdout, the only stream the acting agent sees.

| Payload `file_path`       | Before stdout           | After stdout |
| ------------------------- | ----------------------- | ------------ |
| any per-item artifact     | an envelope             | empty        |
| `backlog/TEMPLATE.md`     | an envelope, 2 findings | empty        |
| a clean idea file         | empty                   | empty        |
| a path outside `backlog/` | empty                   | empty        |
| absent (`{}`)             | an envelope             | unchanged    |

The non-candidate line still reaches stderr, where the full log lives. **An empty stdout is the
designed reading, and the stderr line is what distinguishes it from a skipped run** — Addition D in
item 3 is the test that pins exactly this.

**The suite.** Measured in the scratch mirror with the full change applied: **46 tests pass,
against 33 before.** Against the change with the existing tests unmodified: **4 fail, 29 pass**, the
four named in R8.

**The gates**, measured 2026-09-18 on the rebased tree:

| Command                                                    | Before                                                               | Expected after                                |
| ---------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------- |
| `npm run test:scripts`                                     | 72 files, 1114 tests, green                                          | green; the test count rises by the additions  |
| `npm run build`                                            | green                                                                | green                                         |
| `npm run ast-grep`                                         | no finding in either hook directory                                  | unchanged — the seam rule is satisfied        |
| `npm run agent-doc-check`                                  | 54 doc files, 8 agent files, 32 rules, no failures                   | no failures; the counts do not move           |
| `npm run reference-check`                                  | 537 files scanned, 3190 references, no failures                      | no failures; the role records the new figures |
| `npm run prose-lint -- --scope .claude/references`         | 8 files; 1 finding, `merge-protocol.md:21` Procedure.ProcedureLength | 8 files; the same single finding              |
| `npm run prose-lint -- --scope .claude/skills/idea-assess` | 1 file, 0 findings                                                   | 1 file, 0 findings                            |
| `npm run prose-lint 2>&1 \| grep -c '^CLAUDE.md'`          | 21                                                                   | 21                                            |

**`--scope CLAUDE.md` reports a confident zero.** The scope form appends `/*.md` to its argument, so
the only reading for that file is the whole-tree run filtered by path. The grep form above is the
measurement, not a convenience.

**Raw Vale, repo-relative.** Measured 2026-09-18:
`vale .claude/references/pipelines.md .claude/skills/idea-assess/SKILL.md CLAUDE.md` reports
**0 errors, 21 warnings and 0 suggestions in 3 files**, every warning on `CLAUDE.md`. Expected
after: the same reading. An absolute path lints nothing and reports zero, so take it with
repo-relative paths and read the `in N files` count.

---

## What no executing role may do

- **Edit anything under `backlog/`.** Not the five deformed artifacts, not `backlog/TEMPLATE.md`,
  not this spec, not a candidate file. R5 rules the first.
- **Edit `scripts/board-shape-hook/run.ts` or `scripts/post-tool-use.ts`.** The seam is
  `architect`'s, and the change does not need them.
- **Add a shape table keyed on artifact basenames**, or a pattern for `amendment-<n>`. R1 refuses
  both by construction, and `retro.md` is why.
- **Touch the era discriminator, the six checks, their message strings, or the report line's
  wording.** R4 leaves them standing.
- **Export `isCandidatePath` or `notACandidateOutcome`** without a REVIEW finding saying so. R7.
- **Live-fire the hook from this worktree** and read the result as evidence. It runs the main
  checkout's copy.
- **Weaken `rules/no-process-io-outside-run-in-hook-programs.yml`** or any other rule. Rules are
  `architect`'s.

---

## Out of scope, and each is a refusal rather than an omission

- **Fence-blindness in the line-exact checks.** R6, with its falsifier.
- **The Tengo port of the era check.** R4 narrows it; `coach` does not edit the board.
- **Correcting the five deformed artifacts.** R5, and the sign-off question below.
- **`rules/no-process-io-outside-run-in-hook-programs.yml`'s `note`**, which states the scope claim
  R8 measured false. Rule prose is `architect`'s; this spec recommends and does not author.
- **`definition-of-ready.md`'s sub-kind discriminator**, which R9 found silent on a two-tree diff.
- **Retiring the `done/` lane's artifact citations.** `artifact-name-tokens-break-when-done-empties`
  owns it, unassessed.

---

## Recommendations flowing out, for the seat to capture

`coach` writes no board file but this one. Each is a recommendation the seat captures or declines.

1. **Amend `backlog/ideas/board-era-check-as-a-tengo-rule.md`** with R4's constraint: the Tengo rule
   must carry the positional classification, because `[backlog/**/*.md]` reaches every per-item
   artifact and a Vale section glob cannot exclude them. Narrowed, not retired.
2. **A new candidate: the line-exact board checks are fence-blind.** Carry R6's measurement (0 of
   91), its falsifier, and the note that it binds `Board.NoStatusField` and the proposed Tengo rule
   as well as the hook.
3. **A new candidate: `definition-of-ready.md`'s sub-kind discriminator is silent on a diff that
   lands in both trees.** R9 ruled this slice by hand. The candidate asks what the discriminator
   should say, and whether `pipelines.md` needs a mixed-diff cycle beside its five.
4. **Ask `architect` to correct `rules/no-process-io-outside-run-in-hook-programs.yml`'s `note`.**
   It states that this rewrite "edits it and its test file and nothing else", which R8 measured
   false. The rule itself is correct and unaffected; only its prose over-claims.

---

## Sign-off

The user signs this spec before any executing role is invoked. Five things to rule on.

1. **R9 — the cycle, and it is the blocker.** `writer` may not write `scripts/`, so item 1 cannot
   run in the process pipeline as written. Ruled: keep `kind: enabler-process`, dispatch items 1 to
   3 to `coder` with `cleaner` after, keep items 4 to 6 with `writer`, and have `hardener` add the
   scripts-scoped stages. The alternatives are re-kinding to `enabler-technical`, or splitting into
   two slices. Both are named in R9 with their costs.
2. **R8 — the scope expansion to `run.test.ts`.** It contradicts an `architect` DESIGN ruling that
   this slice touches `board-shape.ts` and its test and nothing else. Measured false: two of its
   tests fail and a third goes green measuring nothing. Granting it costs one file in the manifest
   and no production code. Declining it costs a round trip to `architect` for an amended DESIGN.
3. **R5 — the five deformed artifacts stay as they are.** The record lives in this spec, which the
   retrospective deletes alongside the folders it describes. **The alternative is an item stripping
   the frontmatter from all five**, leaving their content sections untouched. That trades a live
   false identity claim for a precedent that a landed `done/` artifact is editable. Ruled toward
   leaving them; a fifth artifact was deformed during the delay, which argues the vector is the
   hook rather than the files.
4. **R2 — an artifact carries no frontmatter at all.** The alternative on the record is
   folder-derived identity, matching `proposal.md`. Declining this collapses items 4 to 6.
5. **Item 6, the CLAUDE.md pointer clause**, declinable on its own; and **R6 plus the
   recommendations**, confirming they leave as candidates rather than entering this slice.

If this spec needs changing **after** the signature, it changes through `amendment-1.md` in this
folder and never by editing these bytes.
