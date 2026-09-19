# Design — argv-mode-has-no-board-scoping-gate

By `architect` in DESIGN mode, 2026-09-19.

Readings taken by direct invocation on this branch, 2026-09-19: `node scripts/board-shape-hook/run.ts src/camera.ts` prints `6 checks, 5 findings` and exits 0; `no-such-slug` prints `path missing or unreadable`; `backlog/TEMPLATE.md` prints the non-candidate refusal. The shaped answer holds as proposed — the design below is a small plan, not a paragraph, because the three open questions each needed a ruling, not because the diff is large.

## Ruling 1 — the slug path needs no gate of its own; gate the resolved target, after the missing check

`resolveTarget`'s two candidate templates are both `backlog/`-rooted, so a slug that resolves is board-scoped by construction, and `resolveTarget`'s own test rows pin those templates. The cases that escape are the passthroughs: a target that already exists off-board (`src/camera.ts`), and a bare argument shadowed by a same-named file in the cwd. Gating on the **resolved** target catches both.

The order inside `run.ts`'s `checkTarget` is: resolve → missing check (unchanged) → board gate → `checkShape`. The gate sits **after** the missing check, deliberately:

- A typo'd slug keeps its `path missing or unreadable` line, which `idea-assess/SKILL.md` already names as a stop. "Off the board" would be false for a slug that resolves nowhere — it is not off the board, it is nowhere.
- No file content is read off-board either way: `readFileSync` sits in the `checkShape` branch only, so the gate still runs before any read, matching the hook path's read-nothing property.

Hook mode is untouched. It gates on `isBoardPath` before `checkTarget`, so the new branch is unreachable from `--hook` — reachable only via argv, which is the point.

## Ruling 2 — a distinct refusal line, not the shared one

The off-board refusal must not reuse the `not a candidate` text — reusing it preserves exactly the `SKILL.md` imprecision this item exists to close. Shape it parallel to the non-candidate refusal — `LAYER1` prefix, `0 checks`, `--` reason, no findings tally, since a refusal is not a finding count:

`LAYER1 <target>: off the board, 0 checks -- only a backlog/ target can be assessed`

`deliver: false`, on the same reasoning as `notACandidateOutcome`: a refusal to assess, never a pass — and argv mode delivers no envelope regardless.

Consequences, ruled with it:

- The `not a candidate` line's domain narrows to on-board non-candidates, so `SKILL.md`'s per-item-artifact stop condition becomes accurate without touching signed bytes. That is the second finding closing.
- **Residue for the seat:** `SKILL.md` names no stop for the new off-board line. The line is self-explaining and every other outcome is a stop, but nothing pins that a skill run stops on it. If that gap warrants a third stop clause, it is a process-pipeline follow-up, not this slice.
- **Pre-existing residue, unchanged:** `backlog/TEMPLATE.md` draws the non-candidate line while being neither idea file nor per-item artifact. One on-board file, misuse to assess, refusal still correct. Named, not acted on.

## Ruling 3 — what pins a guard the mutation gate cannot see

Two tests at two layers, and what each buys:

- **`board-shape.test.ts`: a `toEqual` pin on `offBoardOutcome`** (exact lines plus `deliver`), the `missingOutcome` shape. This is the mutation-scored half — the constructor's string and flag mutants die here, and nothing in `segmentsAfterRoot` is newly strandable because the constructor never touches it.
- **`run.test.ts`: two argv spawn rows.**
  1. An existing off-board file (`src/camera.ts` under the temp dir): stdout carries `off the board` and not `6 checks`, stderr empty, exit 0. This buys regression protection Stryker cannot: it reds if the gate is deleted or its predicate inverted. It kills no mutants — a spawned child runs outside Stryker's activation environment, and `run.ts` is excluded regardless — and that is the honest extent of what it proves.
  2. An unresolvable argument: stdout carries `path missing or unreadable`. This pins Ruling 1's ordering — gate moved above the exists check, this row reds.

Fault-injection obligation, one run each: row 1 is red against today's `run.ts` (measured above), so ordinary TDD shows it. Row 2 is green before the gate exists; show it red once by hand-moving the gate above the missing check, then restore.

**No new ast-grep rule.** The invariant — the argv branch consults `isBoardPath` before `checkShape` — is a control-flow fact inside one ~50-line shell, not a cross-file boundary; a pattern rule would pin the file's current shape rather than the invariant, and the existing `no-process-io-outside-run-in-hook-programs` rule is what already forces the gate into `run.ts`. The spawn rows are the pin.

## File set — ratified

1. **`scripts/board-shape-hook/board-shape.ts`** — add exported `offBoardOutcome(target: string): HookOutcome` beside the other outcome constructors. Re-derive two doc sites: the `segmentsAfterRoot` comment (drop the argv-has-no-gate clause; keep that a target under neither marker keeps all its segments, and that both shells now gate on `isBoardPath` before `checkShape` reaches an off-board path — hook before resolution, argv after); and `isBoardPath`'s JSDoc, whose "Hook-mode scope gate" hover becomes false the moment argv mode calls it — reword to cover both shells within the current hover size.
2. **`scripts/board-shape-hook/run.ts`** — one guarded return in `checkTarget` after the missing check: `if (!isBoardPath(resolved)) return offBoardOutcome(resolved)`, plus the import. The header's "Always exits 0 -- the board has no gate" stays true and stays.
3. **`scripts/board-shape-hook/board-shape.test.ts`** — a describe block pinning `offBoardOutcome`. Re-derive the named-residue row (2026-09-19 comment): **the row stays** — it pins `checkShape`'s own classification when called directly and carries the anchor-stranding rationale, which stays true. Its comment and name change from "argv mode has no board-scoping gate" to "`checkShape` alone has no board gate; both shells gate before it".
4. **`scripts/board-shape-hook/run.test.ts`** — the two argv rows from Ruling 3; the header's pinned-contract list gains the off-board refusal.

No other file. The matching sentences in `backlog/done/the-board-hook-misfits-per-item-artifacts/amendment-1.md` are dated records and stay as written.

## Interfaces

- `offBoardOutcome(target: string): HookOutcome` → `{ lines: ['LAYER1 <target>: off the board, 0 checks -- only a backlog/ target can be assessed'], deliver: false }`. Exact wording is `coder`'s within these constraints: `LAYER1 <target>:` prefix, contains `0 checks`, contains neither `not a candidate` nor a findings tally.
- `checkTarget`'s internal order (resolve → missing → gate → read-and-check) is the contract between the two files; spawn row 2 is what holds it.

## Ordering — each step leaves the suite green

1. `offBoardOutcome` plus its `toEqual` pin, red-then-green; the export has no caller yet, so the tree stays green. Read `doc-comments.md` before writing its JSDoc.
2. Spawn row 1 red against the ungated shell, then the gate in `checkTarget`, green. Land spawn row 2, and run its hand-injected fault once (Ruling 3). Suite green.
3. Re-derive the four doc sites named in the file set. Read `claim-discipline.md` first — every one is a present-tense claim about another file's behaviour, which is why they are re-derived rather than trimmed.
4. Verify: `npm run test:scripts`; `npm run reference-check` reading the exit code directly; `npm run lint`; `npm run format`. Watch `npm run dry4ts:scripts`: `offBoardOutcome` is a fourth small outcome constructor beside three existing ones — if the clone gate fires, fold refusal construction into one shared helper rather than raising a threshold, and do not pre-fold absent a finding.
