# Design — checkers-do-not-reach-the-assessment-sidecar

`architect` DESIGN, 2026-09-20, against tip `5d6d2b8`. **Written into the folder by the
orchestrating seat**, because `architect.md` names no `design.md` deliverable and the corpus rule
gives a board write only through a role's own file. The content is the design pass's, returned as
reply text; see finding P1.

Baseline before any change: `test:scripts` 1,132 tests over 72 files green; `ast-grep:rules` 32/32;
`ast-grep:test` 32 passed; `agent-doc-check` clean; `reference-check` 538 files / 3,226 refs / 0
failures; `crap4ts:scripts` 294 functions, 0 above threshold, worst 6.0.

**Ratified, with one premise refuted and two landmines found.**

## F1 — the proposal's premise is refuted, and the correction adds a surface

The proposal states that an assessment cites files that exist. **Measured: no assessment record
has ever existed** — none in the tree, none across all refs in history.

A record synthesized for a real pending idea, run through the checker's own token grammar and
basename resolver: **7 tokens extracted, 3 unresolved**, every one a file that idea proposes
creating. That is `scan-scope.ts`'s own documented reason (2) for the board exclusion, verbatim.

Scope of the claim: one synthesized record, one idea, this checkout, today. Sufficient to refute a
universal.

**The carve-out survives** — a record's citations are predominantly claims about live files, and
hiding them hides real defects. What changes is that **records need allow markers, and nothing
tells the judge so.** That is a fifth documentation surface, and it is behavioural rather than
descriptive: absent it, the first record to land reds the second gate stage and its author cannot
know why.

## F2 — a pre-existing landmine fires on the first promotion

Measured by planting a file named exactly `assessment.md`: **exit 1, four `stale-allow-marker`
failures.** Removing it returns exit 0. The ideas-lane form does not trip them, since basenames
differ.

- **A no-go for `coder`:** create no fixture, test file or example named exactly `assessment.md`.
  Both target modules are pure over path arrays, so no real file is needed.
- The slice does not fire this. The first real promotion will, and all four sites are files no
  role may edit. The seat absorbs it.

## F3 — the classifier defect, demonstrated rather than read

The hook run for real against a well-formed record in the ideas lane reports **6 checks, 5
findings** — a name mismatch, a missing title, a bad created date, two missing headings — reads the
era as legacy, and **delivers the envelope**, so the noise reaches the judge that wrote the file.
The skill's ignore-the-hook-line prose covers only the reading half.

## The path-shape call: a new shared module, and `isCandidatePath` is not touched

Three reasons, in order of weight.

1. **Two programs need the same fact**, which is the layout rule's own test for the shared tier,
   met on the merits.
2. **The positional test is correct and stays.** The ideas lane is flat, so every file there is two
   segments and position can never separate an idea from its sidecar. The name test is forced by
   the artifact's placement rather than being a weakening of the rule.
3. **The outcomes differ.** A non-candidate gets a refusal; a record is additionally the subject of
   the new check. Folding it in forces a second entry point anyway.

The record test runs **before** `isCandidatePath`. Rejected and named: splitting the predicate from
the blob members across two files, which divides one artifact's definition.

## Ratified file set

| #   | File                                           | State              | Owns                                                             |
| --- | ---------------------------------------------- | ------------------ | ---------------------------------------------------------------- |
| 1   | `scripts/assessment-record.ts`                 | new, shared tier   | Path shape, sibling lookup, stored-blob read, blob id            |
| 2   | `scripts/assessment-record.test.ts`            | new                | Its unit tests                                                   |
| 3   | `scripts/board-shape-hook/board-shape.ts`      | change             | Record refusal; staleness decision; summary clause; tally 6 to 7 |
| 4   | `scripts/board-shape-hook/run.ts`              | change             | Sibling lookup, read, hash, build the lookup                     |
| 5   | `scripts/board-shape-hook/board-shape.test.ts` | change             | Two tests assert full line arrays and move                       |
| 6   | `scripts/board-shape-hook/run.test.ts`         | change             | The filesystem plumbing                                          |
| 7   | `scripts/reference-check/scan-scope.ts`        | change             | One predicate call in `isDocFile`                                |
| 8   | `scripts/reference-check/scan-scope.test.ts`   | change             | Carve-out cases over literal path arrays                         |
| 9   | The structural rule and its fixture            | deferred to REVIEW | The guard, see the sequencing question                           |

No new program, no new npm script, no config edit. Both scoping configs are glob-minus-exclusion,
so the new module is measured the day it lands. **Add no exclusion for it.**

## Interfaces

`scripts/assessment-record.ts` exports `isAssessmentRecordPath`, `siblingRecordPathFor`,
`storedBlobOf` and `blobIdOf`. The sibling lookup returns nothing for a record path, a
non-candidate path or an off-board path — which is what keeps the branch out of the shell, where
code is unmeasured by every scoring tool at once.

`blobIdOf` computes the id from the bytes directly. **Measured: 736 of 736 tracked files agree
with `git hash-object`**, and the repo carries no attributes file to complicate it. No subprocess,
so the hook program's ban on process IO is respected; the crypto import is pure and permitted.
**Pin it against a fixed literal**, never against a tree read, which is a test that agrees with
itself.

`checkShape` gains a **required discriminated union** third parameter — absent, present with both
blobs, or unreadable. That is the fail-open guard expressed in the type rather than at runtime: a
caller cannot omit it, and "no record" is a value someone wrote rather than an argument someone
forgot. An optional parameter would make the vacuous pass the default, which is the defect itself.
The unreadable state is a finding in every lane.

## What Layer 1 reports

| Lane          | Record     | Blob   | Clause                         | Finding |
| ------------- | ---------- | ------ | ------------------------------ | ------- |
| ideas         | absent     | —      | `no assessment record`         | no      |
| ideas         | present    | match  | `assessment current`           | no      |
| ideas         | present    | differ | `assessment stale`             | **yes** |
| ready or done | absent     | —      | `no assessment record`         | no      |
| ready or done | present    | match  | `assessment current`           | no      |
| ready or done | present    | differ | `assessment frozen`            | no      |
| any           | unreadable | —      | `assessment record unreadable` | **yes** |

**The tally goes to seven unconditionally.** The LAYER1 line is carried verbatim into every record
and is the only proof the layer ran, so a check invisible to it is a check no record can show was
run. A constant literal is also mutation-testable where a variable one invites a survivor.

**Lane sensitivity lives in exactly one named function** — one place to read, test and mutate.

## The three open questions, ruled

**Reporting.** Every state is reported on the summary line, always. Absence is reported and never a
finding; staleness and unreadability are findings. Silence is what the proposal rightly refuses,
because it cannot be told from a vacuous pass — and making absence a finding would deliver an
envelope on every fresh capture.

**Which surface.** The doc surface only. Measured: no board path has ever reached the source
surface, so there is no exclusion there to carve out of. A symmetric change would be inert and
would read as protection.

**How wide.** The sidecar alone. F1 is why this is more than caution — the proposed-module reason
demonstrably still applies to records, and applies at least as strongly to the other per-item
artifacts, none of which exists to measure. Widening on no evidence is the fail-open direction.

## Ordering — five steps, each leaving the suite green

1. **The shared module, with no consumers.** Nothing imports it.
2. **The carve-out**, independent of the rest. Its tests must cover both lane forms, the three
   non-record board files, and a worktree-nested record that must still be excluded.
3. **The record refusal**, ahead of the candidate test. This alone closes F3.
4. **Thread the parameter, inert.** The shell builds the lookup for real and the decision ignores
   it. **The risky step split in two on precedent**: the filesystem code and the hash run against
   the real tree with no output to assert against, so a failure here is unambiguously plumbing.
5. **Consume it.** The clause lands, the tally moves, delivery picks up the two findings.

**The test that must exist, and that a lane-blind implementation must fail:** a ready-lane proposal
beside a record whose stored blob differs, asserting `assessment frozen` and **zero** findings.
Without it, deleting the lane gate leaves every test green and reports every promoted item stale.
Its ideas-lane mirror pins the discriminator from the other side.

`coder` writes no documentation.

## Tier constraints

At full coverage the complexity score equals cyclomatic complexity, so the live constraint is CC at
most 6 per function. **Two existing functions sit at 5 with one branch of headroom each — add no
branch to either.** Duplication is what the shared module prevents, and the structural rule is its
backstop. The union plus a lane gate is mutation-rich: expect survivors between the frozen and
current clauses unless the ready-lane test above exists. **Any survivor believed equivalent is
`architect`'s ruling, not `coder`'s or `hardener`'s.**

## Documentation staleness — five surfaces, none `coder`'s to edit

| Surface                                   | What goes false                                                                     |
| ----------------------------------------- | ----------------------------------------------------------------------------------- |
| The routing entry for `reference-check`   | The exclusion is no longer whole                                                    |
| The readiness reference                   | What Layer 1 measures, and its example tally                                        |
| The judging skill                         | **Binds hardest** — a clause that cites this defect as its reason, false on landing |
| The judging skill, second and new from F1 | Must gain the instruction to write an allow marker for a proposed-but-absent file   |
| The rules article                         | Gains the structural rule's entry, if the sequencing is ruled that way              |

## Process findings

- **P1.** The pipeline reference says this pass writes the design artifact; the role's own file
  names no such deliverable and grants no board write. The reference plans an artifact its own
  producer is not authorized to produce.
- **P2.** A structural rule and its mandatory documentation are split across two owners with no
  green intermediate state: landing the rule reds a gate until the seat writes the article line.
- **P3.** The role file tells this pass to author a rule with its fixture passing; an invoking
  prompt saying to write no file makes that impossible. The prompt won and the pass flagged rather
  than proceeded.

## Where the design disagrees with the proposal

- **The citations premise is false as a universal**, per F1. The correct claim is
  _predominantly_ live, which is still why hiding them hides real defects.
- **The fail-open risk is sharper than stated.** The carve-out matches no record **on landing**,
  because none exists. Unit proof over literal path arrays is available and sufficient; the
  end-to-end fact is unprovable until a record exists, and no green run should be read as proof of
  it.
- **The shared non-empty guard is the wrong precedent for the carve-out.** The proposal names it.
  Applied there it would fail the gate immediately and permanently, since the matched set is
  legitimately empty today. The required union replaces it on the hash side.
