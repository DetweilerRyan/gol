# Amendment 1 — 2026-09-19, after `coder`'s finding on spec items 1 to 3

`coach` REVIEW mode, slice `the-board-hook-misfits-per-item-artifacts`, against tip `08c500c`.
**This amendment needs the user's re-signature before `coder` runs again.** `cleaner` waits on
the signature, because the amendment changes what it measures.

## What this supersedes, and nothing else

| Spec item                                                                         | Disposition                                      |
| --------------------------------------------------------------------------------- | ------------------------------------------------ |
| R7, the paragraph "One behaviour widens beyond the board, deliberately."          | Withdrawn as false. Replaced by item A1 below.   |
| Item 1, replacement A, the `segmentsAfterRoot` comment                            | Its third clause is false. Corrected by item A2. |
| Item 2, addition C, the row named `'an off-board argv target is not a candidate'` | Renamed and joined by a second row; item A3.     |

Everything else in the spec stands. R1 through R6, R8 and R9 are untouched, and no ruling
changes. `coder`'s execution of items 1 to 3 was byte-for-byte correct and nothing it wrote is
being reverted.

## The verdict: a false claim, not a defect

`coder` is right, and I reproduced it. Measured 2026-09-19 at tip `08c500c`:

```text
$ node scripts/board-shape-hook/run.ts src/camera.ts
LAYER1 src/camera.ts: 6 checks, 5 findings
```

R7 said this would report the refusal. It does not.

**The mechanism, stated correctly this time.** `isCandidatePath` counts segments after an
_attempted_ `backlog/` strip. A path under neither `backlog/` form keeps all its segments, so an
off-board path with exactly two of them satisfies the `<lane>/<name>.md` shape by coincidence.
Measured across the boundary:

| argv target                       | Segments | Reading                     |
| --------------------------------- | -------- | --------------------------- |
| `package.json`                    | 1        | `not a candidate, 0 checks` |
| `src/camera.ts`                   | 2        | `6 checks, 5 findings`      |
| `.claude/settings.json`           | 2        | `6 checks, 5 findings`      |
| `adr/README.md`                   | 2        | `6 checks, 5 findings`      |
| `scripts/board-shape-hook/run.ts` | 3        | `not a candidate, 0 checks` |

**Three measurements decide this, and none of them was available to me when I wrote R7.**

**Nothing regressed.** Running the pre-change program at `08c500c~1` against the same targets:
`src/camera.ts`, `scripts/post-tool-use.ts`, `.claude/settings.json` and `adr/README.md` each read
`6 checks, 5 findings` before the change and after it. Two targets improved —`package.json` and
`scripts/board-shape-hook/run.ts` now refuse where they did not. The slice moved this behaviour in
one direction only.

**No path the hook can receive is misclassified.** `run.ts` gates on `isBoardPath` before it
resolves or reads anything, so an off-board payload produces zero bytes on both streams. Confirmed
for a relative and an absolute off-board path. Against the in-board shapes — both idea-file forms,
four artifact forms, the template, a fourth-segment path, and the absolute variants — the
classification is right in every case.

**The obvious fix would strand a live invariant.** Adding `if (!isBoardPath(target)) return false`
to `isCandidatePath` reads as a one-line correction. It is not free. The `^` in
`segmentsAfterRoot`'s `replace(/^backlog\//, '')` is load-bearing today and killed by the
`zzbacklog/sub/foo.md` test: unanchored, that path strips to `zzsub/foo.md`, which is two segments
and therefore a candidate. Behind an `isBoardPath` guard, `zzbacklog/...` is refused before the
strip, the anchor becomes unreachable, and the mutant that removes it survives. That trades a
measured invariant on a module scoring 99.22 for a misuse case no hook invocation can reach.

**So the defect is in my sentence, not in the discriminator.** The discriminator does what R1
designed it to do for every path in its domain. R7 published a mechanism I had not run — the
failure `claim-discipline.md` names as a conclusion from a plausible mechanism. My own
classification table contained the blind spot: its single off-board row used `clean.md`, one
segment, which refuses for a reason that does not generalise.

**The residue is real and is accepted, not hidden.** `/idea-assess` pointed at a two-segment
off-board path still runs six checks on it. That was true before this slice and is unchanged by
it. `.claude/skills/idea-assess/SKILL.md`'s own `argument-hint` already declares the target as
`backlog/ideas/<name>.md`, so the case sits outside the skill's stated contract. Items A2 and A3
make the tree say so rather than claim otherwise.

## Item A1 — R7's paragraph, withdrawn and replaced

`coach` supersedes this text in `spec.md`. **No role edits `spec.md`; the signed bytes stay the
signed bytes.** The replacement below is the live text for anyone reading R7.

Withdrawn:

```text
**One behaviour widens beyond the board, deliberately.** An argv target that is not board-shaped at
all — `/idea-assess` pointed at `src/camera.ts` — now reports the refusal rather than six checks.
That is the same category error the slice exists to fix, and SKILL.md's guard already tells the
judge to stop.
```

Live text:

```text
**Argv mode has no board-scoping gate, and this slice does not add one.** `isCandidatePath`
counts segments, so an off-board argv target with exactly two of them still reads as a candidate
and still runs six checks. Measured 2026-09-19: `src/camera.ts` reads `6 checks, 5 findings`
before and after the change. One- and three-segment off-board targets do refuse. The hook path
cannot reach any of it — `run.ts` gates on `isBoardPath` first — so the residue is confined to
`/idea-assess` pointed outside its own `argument-hint`. It is named in `board-shape.test.ts` and
recommended as a candidate rather than closed here, because the naive guard strands the `^` anchor
in `segmentsAfterRoot` as an equivalent mutant.
```

**What the withdrawn block carried that the replacement does not.** It claimed an improvement to
the off-board argv case; that claim is gone because it was false, not relocated. It cited
SKILL.md's guard as already covering the case; the guard is real and still lands as item 4, but it
fires on the refusal line, which a two-segment off-board target never prints — so that clause is
withdrawn too rather than moved. No other obligation sat in the block.

## Item A2 — `scripts/board-shape-hook/board-shape.ts`, one comment (`coder`)

The comment's third clause states the same false mechanism, and it is now shipped.

**Anchor:**

```text
// The board-relative path segments. `/backlog/` marks an absolute path and a
// leading `backlog/` a relative one; a target under neither keeps all of its
// segments, which is what makes an off-board argv target a non-candidate.
```

**Replace with:**

```text
// The board-relative path segments. `/backlog/` marks an absolute path and a
// leading `backlog/` a relative one. A target under neither keeps all of its
// segments, so argv mode -- which has no board-scoping gate -- classifies an
// off-board path by that segment count like any other, and a two-segment one
// reads as a candidate. The hook path cannot reach that case: run.ts gates on
// isBoardPath before it resolves or reads anything.
```

Comment text only. No executable line in `board-shape.ts` changes, so the mutation score, the
coverage and the seam rule are all untouched.

## Item A3 — `scripts/board-shape-hook/board-shape.test.ts`, one row renamed and one added (`coder`)

The row named `'an off-board argv target is not a candidate'` asserts a true instance under a name
that states a general property the code lacks. A test name is read as documentation, so it is
corrected, and the residue gets a row of its own rather than staying invisible.

**Anchor**, one line inside the `checkShape candidate classification` table:

```text
    { name: 'an off-board argv target is not a candidate', target: 'clean.md', candidate: false },
```

**Replace with:**

```text
    { name: 'a bare single-segment argv target is not a candidate', target: 'clean.md', candidate: false },
    // Named residue, 2026-09-19: argv mode has no board-scoping gate, so an
    // off-board path with exactly two segments satisfies the <lane>/<name>.md
    // shape by coincidence. Unreachable from the hook, which gates on
    // isBoardPath first, and unchanged by this slice -- src/camera.ts read six
    // checks before it too. Adding the gate here would strand the ^ anchor in
    // segmentsAfterRoot as an equivalent mutant, which is why it is named
    // rather than closed.
    {
      name: 'an off-board two-segment path is a candidate -- the named argv residue',
      target: 'src/camera.ts',
      candidate: true,
    },
```

The wrapped object is Prettier's own output, not a style choice. The block is Prettier-stable as
written.

## Item A4 — nothing else changes

`scripts/board-shape-hook/run.ts`, `scripts/post-tool-use.ts` and `scripts/board-shape-hook/run.test.ts`
are untouched by this amendment. So are spec items 4, 5 and 6, which `writer` has not yet run.
`isCandidatePath`'s executable body is untouched.

## Expected readings

**Method.** Taken 2026-09-19 by mirroring the landed `scripts/` hook tier into a scratch
directory, applying items A2 and A3, formatting with this repo's Prettier config, and running
vitest. Readings by direct invocation, never by live-fire — the hook fires the main checkout's
copy, as the spec's verification section states.

| Check                                            | Before (tip `08c500c`) | After A2 and A3             |
| ------------------------------------------------ | ---------------------- | --------------------------- |
| `npm run test:scripts`, this program's two files | 46 tests               | 47 tests, all green         |
| `npm run test:scripts`, whole tier               | 72 files, 1127 tests   | 72 files, 1128 tests        |
| `npx prettier --check` on both edited files      | clean                  | clean                       |
| `node ... run.ts src/camera.ts`                  | `6 checks, 5 findings` | unchanged, and now asserted |
| `node ... run.ts package.json`                   | `not a candidate`      | unchanged                   |
| every board reading in the spec's tables         | as the spec states     | unchanged                   |

**The executable behaviour does not move.** A2 is a comment and A3 is a test. Every candidate and
non-candidate reading `coder` already reported stays exactly as reported, so `cleaner` measures the
same program it was going to measure.

## Recommendation flowing out, for the seat to capture

**A new candidate: argv mode has no board-scoping gate.** The shaped answer, and it is not the
one-liner: put the gate in `run.ts`'s argv branch rather than in `isCandidatePath`. `run.ts`
executes at import and is excluded from crap4ts, Stryker and dry4ts, so a guard there costs no
mutation score. `board-shape.test.ts` calls `checkShape` directly, so the `^` anchor stays
reachable and killable at the unit level. That closes the misuse case without stranding the
invariant — which the guard placed in `isCandidatePath` does not. It touches `run.ts`, which this
slice's DESIGN ruling excludes, so it is a slice of its own.

## Re-sign-off

Two things to rule on.

1. **The verdict: a false claim, not a defect in the discriminator.** The remedy is a record
   correction plus two shipped corrections that make the tree state the residue. The alternative
   is closing the residue in `isCandidatePath`, which is measured to strand the `^` anchor as an
   equivalent mutant on a module scoring 99.22. Ruled toward the correction; overturn it here if
   the misuse case should close in this slice.
2. **Items A2 and A3 as a `coder` pass.** A comment and two test rows, no executable change. The
   narrower alternative is A1 alone — correcting only the spec record — and accepting the shipped
   comment and test name as residue. I do not recommend it: both are false statements in the
   tracked tree, and the test name is the one that will be believed.
