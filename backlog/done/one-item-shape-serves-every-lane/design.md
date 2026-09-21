# Design: one-item-shape-serves-every-lane

Architect, DESIGN mode, 2026-09-21. Enabler-technical, so this pass is the slice's only
pre-implementation gate. The ruled Answer in `proposal.md` binds; this design executes it and
settles or defers its open questions. No product code was written in this pass.

## Re-derivation of the proposal's measurements

Every claim was re-measured in the slice worktree at branch tip (base `b7c0f2b`), 2026-09-21.
None was falsified.

| Claim                                                                     | Method                                                                                                    | Result                                                                                                                                                             |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `checkShape` returns from the candidacy guard before `laneFor` runs       | Fault injection: a `throw` added to `laneFor`, then both probe runs below; restored after                 | Confirmed both directions — the non-candidate probe printed its refusal untouched; the candidate probe (`backlog/ideas/effective-prose.md`) hit the injected throw |
| A two-segment path in an undeclared directory is a candidate and delivers | Created `backlog/zzprobe/x.md`, piped a PostToolUse payload into `run.ts --hook`, removed the probe after | Confirmed — stderr carried `lane zzprobe` and `7 checks, 4 findings`; stdout carried the `hookSpecificOutput` envelope                                             |
| A one-segment board-root path draws the plain refusal with no lane clause | `node scripts/board-shape-hook/run.ts backlog/TEMPLATE.md`                                                | Confirmed — `not a candidate, 0 checks`, no lane clause, no tally                                                                                                  |
| Every item file in `ready` and `done` is named `proposal.md`              | `find backlog -type f` over the full board                                                                | Confirmed — 2 `ready/` folders and 17 `done/` folders, each holding `proposal.md`; no flat `.md` at lane depth in either folder lane                               |

The proposal's probe reported five findings where mine reported four; the probe files differed
in content, not the mechanism. The finding counts are content-dependent and the claim —
candidate classification plus envelope delivery — held.

## Ratified file set

| File                                                 | Status    | Carries                                                                        |
| ---------------------------------------------------- | --------- | ------------------------------------------------------------------------------ |
| `board-lanes.config.json`                            | new, root | The lane declarations, beside `role-cycles.config.json` on the same precedent  |
| `schemas/board-lanes.schema.json`                    | new       | Editor affordance only — the runtime validator below stays authoritative       |
| `scripts/board-shape-hook/lane-declarations.ts`      | new       | The declaration types and the pure text-to-value parser/validator              |
| `scripts/board-shape-hook/lane-declarations.test.ts` | new       | The validator table, plus the tracked-config content pin                       |
| `scripts/board-shape-hook/board-shape.ts`            | modified  | Declaration-driven lane classification; the new outcome builders               |
| `scripts/board-shape-hook/board-shape.test.ts`       | modified  | The classification table's flipped and added rows                              |
| `scripts/board-shape-hook/run.ts`                    | modified  | Reads the config file, short-circuits an unavailable lookup                    |
| `scripts/board-shape-hook/run.test.ts`               | modified  | Temp-dir config seeding; end-to-end rows for the new outcomes                  |
| `scripts/board-shape-hook/board-shape.meta.md`       | new       | The rationale sidecar the Answer mandates — first of its tier under `scripts/` |

No file moves. `assessment-record.ts` is untouched: its lane literals sit on the record-path
axis, which this slice does not own.

**The declaration file's home is a ruling this design makes, since the Answer fixed only
data-not-code.** Repo root, named `board-lanes.config.json`, on the
`role-cycles.config.json` / `mutation-invariance.config.json` precedent: a root config a
checker reads and validates. A home inside `backlog/` was weighed and rejected — the board is
ruled machinery-free ("`ls backlog/ready/` is the board"), and the classifier's own input
sitting inside the tree the classifier polices would fire the hook on every edit to it.
The `schemas/` sibling and the `$schema` key follow the two live root configs.

## Interfaces

`lane-declarations.ts` — pure, no `node:fs` (the existing
`rules/no-process-io-outside-run-in-hook-programs.yml` covers it by glob the day it lands):

```ts
export type LaneShape = { shape: 'flat' } | { shape: 'folder'; item: string }
export type LaneDeclarations = ReadonlyMap<string, LaneShape>
export type LaneDeclarationsLookup =
  { kind: 'declared'; lanes: LaneDeclarations } | { kind: 'unavailable'; reason: string }
export function parseLaneDeclarations(text: string | undefined): LaneDeclarationsLookup
```

- `undefined` in means the file was missing or unreadable — the caller writes absence as a
  value, the `RecordLookup` construction generalized as the invoking prompt asked.
- A `Map`, not a `Record`. Lane names are path-derived keys, and a `Record` lookup on
  `__proto__` or `constructor` answers from the prototype rather than the data.
- Validation, all failures `unavailable` with a reason: parseable JSON; a `lanes` object with
  at least one entry (the `checkNonEmpty` inertness principle — an empty declaration would
  reclassify every finding as a warning, the exact fail-open direction this slice closes);
  each lane name non-empty and `/`-free; each value `{ shape: 'flat' }` (no `item` key) or
  `{ shape: 'folder', item }` with `item` a non-empty, `/`-free `*.md` basename. The top-level
  `$schema` key is tolerated by name.

`board-shape.ts`:

```ts
export function laneDeclarationsUnavailableOutcome(target: string, reason: string): HookOutcome
export function checkShape(target: string, text: string, record: RecordLookup, lanes: LaneDeclarations): HookOutcome
```

`checkShape` takes the validated map, never the lookup union: it cannot classify without
declarations, and the guard-outcome-sequenced-in-`run.ts` pattern is exactly how
`missingOutcome` and `offBoardOutcome` already work. Exact line wordings are `coder`'s, under
one constraint carried over from the existing outcomes: every refusal class stays tellable
apart in the log stream, so the two new warning wordings must be distinct from each other and
from `notACandidateOutcome`'s.

`run.ts` — `checkTarget` becomes:

1. Read `board-lanes.config.json` CWD-relative (both entry points already run with cwd at the
   checkout root — the relative `backlog/…` candidates in `resolveTarget` rest on the same
   assumption, so this adds none), pass the text or `undefined` to `parseLaneDeclarations`.
2. `unavailable` → return `laneDeclarationsUnavailableOutcome(target, reason)`.
3. Otherwise resolve, missing-check, board-check, and call `checkShape` with the map, as today.

Hook mode's `isBoardPath` gate still precedes `checkTarget`, so an off-board write stays
zero-byte silent even with a broken config. Argv mode with an off-board target and a broken
config reports the config problem instead of the off-board refusal — accepted: Layer 1 was
asked to assess and cannot substantiate any answer.

## The classification decision table

For a board target, `s = segmentsAfterRoot(target)`, `D` the validated declarations. Rows in
evaluation order; "unchanged" means byte-identical outcome to today's.

| #   | Condition                                      | Outcome                               | deliver        | Change                                                                          |
| --- | ---------------------------------------------- | ------------------------------------- | -------------- | ------------------------------------------------------------------------------- |
| 0   | (in `run.ts`) declarations unavailable         | `0 checks, 1 findings` config outcome | true           | new                                                                             |
| 1   | `isAssessmentRecordPath`                       | record refusal                        | false          | unchanged                                                                       |
| 2   | `s.length < 2`                                 | not-a-candidate refusal               | false          | unchanged — the ruled root silence                                              |
| 3   | `s[0]` not in `D`                              | undeclared-lane warning               | false          | new — was full candidate + envelope                                             |
| 4   | flat lane, `s.length === 2`                    | candidate — the 7 checks              | `findings > 0` | unchanged                                                                       |
| 5   | flat lane, `s.length > 2`                      | shape-mismatch warning                | false          | new wording; was refusal or, for a 3-segment `…/proposal.md`, a false candidate |
| 6   | folder lane, `s.length === 3`, basename = item | candidate — the 7 checks              | `findings > 0` | unchanged                                                                       |
| 7   | folder lane, `s.length === 3`, basename ≠ item | not-a-candidate refusal               | false          | unchanged — the positional artifact axis                                        |
| 8   | folder lane, `s.length === 2`                  | shape-mismatch warning                | false          | new — was full candidate + envelope                                             |
| 9   | folder lane, `s.length > 3`                    | not-a-candidate refusal               | false          | unchanged                                                                       |

Rows 3, 5 and 8 are the slice's whole behavioral surface. Warnings reach the log stream only:
`deliver: false`, no tally line counted, so the envelope keeps firing on the finding count
exactly as ruled. Row 7 and row 9 keep `notACandidateOutcome` byte-identical — the artifact
axis is untouched, per the no-gos.

Two existing test rows flip and their comments need rewriting, not deleting:

- `board-shape.test.ts`'s "off-board two-segment path is a candidate when called directly"
  (`src/camera.ts`): lane `src` is undeclared, so the row becomes a warning. The named residue
  narrows rather than closes — an off-board relative path whose first segment collides with a
  declared lane name (`ideas/x.md`) still classifies as a candidate on direct call. Both
  shells still gate on `isBoardPath` first, so it stays unreachable from either mode.
- The `zzbacklog/sub/foo.md` anchor row: lane `zzbacklog` is undeclared, so the expected
  wording changes while the anchor it pins still holds.

## Rulings on the open questions

1. **Missing or malformed declaration file — settled.** Neither all-declared nor
   all-undeclared: the run refuses to classify at all. `run.ts` returns the config outcome —
   `deliver: true`, counted as one finding, exit still 0 — for every board target until the
   file is fixed. That is `scripts/vale-fixture-check/`'s refuse-to-report-clean principle
   expressed inside the no-gate constraint: the loudest channel available short of a nonzero
   exit is a delivered envelope. The no-go holds — nothing fails, the hook exits 0.
2. **Basename mismatch at declared depth — deferred.** The narrowing (probe whether the
   declared item file exists beside a written artifact) needs a second injected filesystem
   answer threaded through `checkShape`, and its whole benefit sits on the artifact-reporting
   axis the no-gos close. Zero instances exist on today's board (the `find` above). What would
   settle it: an observed stray item folder without its item file, or a user ruling promoting
   the narrowing. The `resolveTarget` `exists`-callback precedent makes it cheap when wanted.
3. **The silent root — implemented as deferred.** Row 2 tests segment count before the lane
   lookup, which is the ruled preservation, verbatim.
4. **First `scripts/`-tier sidecar — settled: yes,** `scripts/board-shape-hook/board-shape.meta.md`.
   Verified 2026-09-21: `.vale.ini`'s `[**/*.meta.md]` section reaches it regardless of
   directory, so the tier's exemption applies with no config change; `npm run reference-check`
   scans every `.md`, so its claims must be dated history per claim discipline. It records:
   the 2026-09-21 axis-split ruling (lane literal, artifact positional), rulings 1–3 above,
   and the residuals below.
5. **The declaration names no template, so the sibling-rename hazard dissolves.** The schema
   carries depth and basename only. Nothing in it references `TEMPLATE.md` or any template,
   so `the-idea-template-claims-the-whole-board` has nothing here to retarget.

## The declaration content, and its drift guard

```json
{
  "$schema": "./schemas/board-lanes.schema.json",
  "lanes": {
    "ideas": { "shape": "flat" },
    "ready": { "shape": "folder", "item": "proposal.md" },
    "done": { "shape": "folder", "item": "proposal.md" }
  }
}
```

`lane-declarations.test.ts` reads the tracked config (test-file I/O is sanctioned) and pins
both that it parses as `declared` and its exact content — the three lanes and their shapes.
The validator deliberately does not require these literals; the test does. A lane deleted or
misdeclared by accident then reds the suite instead of silently downgrading that lane's
findings to warnings.

## Step ordering — each step leaves `npm run test:scripts` and `npm run build` green

1. **Add the declaration tier.** `board-lanes.config.json`, `schemas/board-lanes.schema.json`,
   `lane-declarations.ts` + its test file, written test-first: the validator table (one row
   per `unavailable` reason, including `undefined` in), the `$schema`-tolerated row, the
   prototype-key row, and the tracked-config content pin. Pure addition; nothing imports it
   yet. Both scripts configs pick the module up by glob — no config edit.
2. **Declaration-driven classification, end to end.** The `checkShape` signature change forces
   `board-shape.ts`, `board-shape.test.ts`, `run.ts` and `run.test.ts` into one green step.
   Test-first: add the row-3/5/8 rows and flip the two rows named above, then implement the
   decision table; wire `run.ts` per the interface section. `run.test.ts`'s existing temp-dir
   spawns must seed a config copy into each temp dir (one shared helper), which is also what
   makes the unavailable branch spawn-testable by omission. New end-to-end rows: an
   undeclared-lane write logs its warning and emits no envelope; a missing config delivers
   the config envelope in hook mode and prints the line in argv mode.
3. **`resolveTarget` derives its candidates from the declarations.**
   `resolveTarget(target, exists, lanes)`: for its own precedence list — `ideas` then `ready`,
   which stays this function's fact, since resolution membership is not derivable from shape
   (`done` is a folder lane and deliberately does not resolve) — build the candidate from the
   declared shape: flat → `backlog/<lane>/<slug>.md`, folder → `backlog/<lane>/<slug>/<item>`;
   skip an undeclared lane. Kills the module's duplicated `proposal.md` literal.
   Behavior-preserving under the tracked config; existing rows prove it, signature updated.
4. **The sidecar.** `board-shape.meta.md` with the content named in ruling 4, plus a
   `@see {@link ./board-shape.meta.md}` from `checkShape`'s JSDoc. Update the module-header
   and `isCandidatePath`-successor comments that describe the old single-axis test.
5. Standard close: `npm run lint`, `npm run format`, `npm run build`,
   `npm run test:scripts`, `npm run ast-grep` (read the output — the new module sits inside
   the hook-purity rule's glob).

`cleaner`/REVIEW note, not `coder`'s: one property test is worth adding at that stage — over
arbitrary board paths whose first segment is not a declared lane, `checkShape` never delivers
and never emits a tally line. It pins the fail-open direction this slice exists to close.
`coder` writes no property tests, per `engineering.md`.

## Rules that bear on the slice

- `rules/no-process-io-outside-run-in-hook-programs.yml` — its `scripts/board-shape-hook/*.ts`
  glob covers `lane-declarations.ts` the day it lands; the design's central seam (declaration
  arrives as text, never read inside a pure module) is exactly what it checks. **No new
  ast-grep rule is authored**: the one invariant the design leans on is already mechanized,
  and a lane-literal ban would fire on the sanctioned residuals below.
- `rules/no-downward-import-in-scripts.yml` — the new sibling import stays flat; nothing
  descends.

## Named residuals — sanctioned, recorded in the sidecar

- `assessmentSummary`'s `lane === 'ideas'` literal stays: staleness semantics per lane are
  not item shape, and the ruled schema is as small as the rulings require.
- `assessment-record.ts`'s lane literals in its path regexes stay: record paths are the
  record axis, out of this slice's scope.
- `resolveTarget`'s `['ideas', 'ready']` precedence list stays: resolution membership and
  order are its own fact, not derivable from shape.

## Disagreements with the proposal

None with the rulings. One correction of emphasis: the proposal's "seven checks with five
findings" probe figure is content-dependent — my re-run of the same probe class produced four
findings from a different probe body. The mechanism claim it supported held.

## Staleness report — for the seat, named not edited

- `CLAUDE.md`, Idea board section: "backlog/ has no gate, no checker, and no test beyond the
  advisory `Board` Vale style" — after landing, a scripts test pins `board-lanes.config.json`'s
  content and the hook classifies lanes from it. The sentence needs a qualifying clause, and
  nothing in `CLAUDE.md` yet names the declaration file.
- `.claude/skills/idea-assess/SKILL.md`: its Layer-1 stop rule names only the path-missing
  line; the new declarations-unavailable line is a second never-measured case it should name.
- Merge-protocol relevance, not a doc edit: a future diff touching only
  `board-lanes.config.json` is **not** mutation-invariant — a unit test reads the file — and
  the file sits under no `mutation-invariance.config.json` entry, so the `--diff` predicate
  will correctly demand the full gate.
- `coder`'s invoking prompt should name `board-lanes.config.json` and
  `schemas/board-lanes.schema.json` as in-scope root files, the way this pass's prompt
  granted the `design.md` path.
