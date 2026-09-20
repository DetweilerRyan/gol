# Definition of Ready

**Read before assessing a candidate, promoting an idea, or ruling a disposition on the board.** Who reads this file is a routing question, and CLAUDE.md answers it.

Promotion from `backlog/ideas/` to `backlog/ready/` is this repo's Definition of Ready, in the Agile Alliance glossary sense — the lane is even named for it. The kind check below also yields the file's frontmatter `kind:` label. The judging pass rules the label, the orchestrating seat writes it when recording the ruling, and the seat reads it to plan the role cycle. Assessing a candidate is the board's backlog refinement, in the same vocabulary. This file carries the assessment: two pre-questions, six predicates, anchored scores, and four dispositions. In this file, "ready" means the board's promotion bar and nothing else; the word carries other senses elsewhere, and none is this subject.

**Nothing here gates.** Ruled by the user 2026-09-13: CLAUDE.md's decision that `ideas/` has no gate stands unreversed. Every check reports, and none can fail anything.

## The slice check — is it a slice at all?

Run this before the kind check; an exempt file never reaches it. Two classes are exempt from assessment. Scoring one is a finding against the assessor, not the file.

- **A verdict record** — the title or first heading rules the idea out: `REFUTED`, `DECLINED`, "Do not build this". It is the board's memory, and its job is to stop a re-proposal.
- **An index** — the file says of itself that it is not work. An epic gets no `ready/` folder; it lives in the `ideas/` lane as an index. Route it to a split.

## The kind check — which kind is this?

Ask first: would a `product` VERIFY pass have anything to observe?

- **Contract-bearing** (SAFe: user story) — the finished state is reachable through the accessible tree. It gets Gherkin.
- **Checker-bearing** (SAFe: architecture or infrastructure enabler) — the finished state is a check's reading, usually a command's output or exit code. A VERIFY pass therefore has nothing to observe. Its acceptance criteria are fitness functions, in the evolutionary-architecture sense. A second discriminator splits the sub-kind, and the `kind:` label carries it. A diff landing in the tree the gates measure (`src/`, `scripts/`, configs, `rules/`) is **enabler-technical**. A diff landing in the instructions that run the gates (`.claude/**`, CLAUDE.md, `.claude/references/`, `adr/`, the board docs) is **enabler-process**. V and T score against the checker-bearing column either way.
- **Knowledge-bearing** (SAFe: exploration enabler) — a readiness spike. The finished state is a recorded answer to a named question.

Score V and T against the kind's own column below. Never score a checker-bearing idea against user-visible value. An assessment record's kind row carries the label, so a reader oriented by SAFe never has to look the mapping up. Ruled by the user 2026-09-14.

## The six predicates

The letters keep INVEST as the mnemonic. Each predicate is phrased in this repo's own vocabulary, and none redefines a loaded term.

| Letter | INVEST name     | Asks                                                                                        |
| ------ | --------------- | ------------------------------------------------------------------------------------------- |
| I      | **Independent** | Does it land as one slice without waiting on another, and has each named dependency landed? |
| N      | **Negotiable**  | Is the file a proposal rather than a contract — does the solution stay open?                |
| V      | **Valuable**    | Is it worth doing? Per kind — see the anchor table.                                         |
| E      | **Estimable**   | Can the size be bounded cheaply from what the file says, with the blocking unknowns named?  |
| S      | **Small**       | Does it fit one slice? The design-pass checklist's return is the split signal.              |
| T      | **Testable**    | How is the finished state checked, per kind?                                                |

**T is never `engineering.md`'s _independently testable_.** Extractability of logic is not a question this file asks. A slice can score T=5 and contain no extractable logic at all.

**E is not an effort estimate.** This repo estimates effort nowhere; E asks whether the size can be bounded from what the file says, wherever it says it. E and S are two questions: E asks whether a bound exists, S asks what the bound trips. A file that bounds nothing scores E=1 and leaves S **unscorable** — the one place a letter declines, and the declination is the finding.

**E, S and T cite rather than restate.** The checklist is CLAUDE.md's "The optional architect design pass". The contract questions are `contract-mode.md`'s. A second copy here would drift from its source.

## Anchors

Score each letter 1–5 against its anchor. Every level names what the file says, so a reading is checkable against the file.

**I — Independent**

|     |                                                                          |
| --- | ------------------------------------------------------------------------ |
| 1   | Depends on an unlanded slice nobody has filed.                           |
| 2   | Depends on an unlanded slice that is at least on the board.              |
| 3   | Names a dependency whose blocking status is asserted, not checked.       |
| 4   | Names its dependencies, and each has landed or is demonstrably optional. |
| 5   | States it waits on nothing, and the stated reach supports that.          |

**N — Negotiable**

|     |                                                                         |
| --- | ----------------------------------------------------------------------- |
| 1   | The file is a chosen implementation with no stated problem.             |
| 2   | Names a solution and gestures at a problem.                             |
| 3   | Problem and solution both present; the solution reads as decided.       |
| 4   | States the need; the solution is offered as open rather than committed. |
| 5   | As 4, and says what would rule the idea out on its own terms.           |

**V — Valuable**

|     | Contract-bearing              | Checker-bearing                                                   | Knowledge-bearing                                      |
| --- | ----------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------ |
| 1   | No stated user harm.          | No stated failure it catches.                                     | No named decision it unblocks.                         |
| 2   | Harm asserted, nobody named.  | Failure class asserted, no instance.                              | Decision named, nothing waits on it.                   |
| 3   | Names who is worse off today. | Names the confident zero or false claim that survives without it. | Names the decision and what waits.                     |
| 4   | As 3, with the cost stated.   | As 3, with a live instance cited.                                 | As 3, and says what each answer would change.          |
| 5   | As 4, dated and measured.     | As 4, dated and measured.                                         | As 4, and the parent idea's blocked letters are named. |

**E — Estimable**

|     |                                                                          |
| --- | ------------------------------------------------------------------------ |
| 1   | Nothing in the file bounds the size. S is unscorable.                    |
| 2   | Names areas, not surfaces — the bound is a gesture.                      |
| 3   | Bounds the reach in modules or surfaces; config and docs reach unstated. |
| 4   | Bounds the size well enough to run the design-pass checklist.            |
| 5   | As 4, and names the unknowns that could move the bound.                  |

**S — Small**

|     |                                                                                                          |
| --- | -------------------------------------------------------------------------------------------------------- |
| 1   | An index or epic: the stated reach spans more than one slice's work with no ordering. Route to a split.  |
| 2   | The reach trips two or more design-pass triggers, and no ordering of behavior-preserving steps is named. |
| 3   | Trips exactly one trigger, and the file names which.                                                     |
| 4   | Trips no trigger.                                                                                        |
| 5   | As 4, and the reach is bounded tightly enough that a split would have nothing to separate.               |

**T — Testable**

|     | Contract-bearing                                                                               | Checker-bearing                                                 | Knowledge-bearing                                          |
| --- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------- |
| 1   | Names no finished state.                                                                       | Names no check.                                                 | Names no question.                                         |
| 2   | Finished state is internal only — a return value, a config key. Say which layer it belongs in. | Names a check, not its reading.                                 | Question named, answer shape unstated.                     |
| 3   | User-visible state, no affordance named for reaching it.                                       | Names the check and direction of change, no current reading.    | Names the question and what a checkable answer looks like. |
| 4   | Names the state and its affordance, and the affordance exists in the accessible tree today.    | Names the check, its reading today, and its reading afterwards. | As 3, and names the probe method.                          |
| 5   | As 4, stated in domain words per `contract-mode.md`.                                           | As 4, and names what would make the reading a confident zero.   | As 4, and says where the record will live.                 |

## What the number may do

The score **ranks and never decides**. Five bounds hold that:

- **A. Six numbers, never a total.** No sum, no average, no composite readiness score.
- **B. Never rank across kinds.** A checker-bearing T=4 and a contract-bearing T=4 answer different questions.
- **C. A number never travels without its finding text.** If the finding is too long to carry, the number stays behind too.
- **D. The promotion commit carries findings, not bare numbers.**
- **E. The scale expires per letter.** When calibration shows judge and human ordering two candidates differently on a letter, that letter's anchors are wrong. Rewrite the anchors and record the measurement in the sidecar. Never retune toward agreement.

## The four dispositions

Every assessment ends in exactly one. The disposition comes from the written findings, never from the numbers — a numeric floor would be the number deciding.

| Disposition         | When                                             | What happens                                                                   |
| ------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------ |
| **Ready**           | No letter carries a blocking finding             | Promote                                                                        |
| **Epic**            | A finding says it is more than one slice         | Split into child candidates; the parent stays in the `ideas/` lane as an index |
| **Spike**           | A blocking finding turns on knowledge nobody has | Name the spike; it is its own slice                                            |
| **Not worth doing** | V's finding rules it out on its own terms        | Record the decline in-file: a `REFUTED` or `DECLINED` title, dated             |

**Epic — the test.** Would splitting produce children that each score better? If yes, split. If the children would inherit the same low scores, the file is under-examined, and the disposition is spike or revision. The slice check catches a self-declared index; this catches one that reveals itself through its scores.

**Spike — the test.** Can the score be raised by editing the file? If yes, the answer exists and nobody wrote it down: revise. If no, nobody has the answer: spike. A low letter names its own spike:

- **V** — measure whether the problem is real.
- **T** — probe for the observable, or for the gate that would go red.
- **S** — read the tree and return a file set.
- **I** — check whether the named dependency actually blocks.
- **N** — explore two approaches and return the comparison.
- **E** — never spikes; an unbounded size is a writing task.

**A readiness spike is a first-class slice.** It gets its own candidate file, branch, and `slice/` tag. Its file names the parent idea and the letters it intends to move. It closes by re-assessing the parent; throwaway artifacts go to `spikes/`. A spike that moves no letter is itself a finding — the letter was low for a reason the spike did not address. It is **not** `product`'s acceptance spike; `product.md` owns that term.

## The three layers, and what runs today

- **Layer 1 — deterministic.** Frontmatter facts, section presence, lane counts, dependency mentions. Measurements arrive with the assessment rather than being asked for; absent them, stop rather than judge. Nothing in this layer judges.
- **Layer 2 — the judged pass.** The anchors above, applied per letter, each score with its finding text.
- **Layer 3 — calibration.** Below.

**The judge is not reproducible, and the anchors are the only thing constraining it.** Measured 2026-09-13: skill invocations exposed `model` and `effort` only, no temperature control, so the source architecture's determinism guarantee did not transfer. Treat two divergent judge runs as evidence about the anchors, not as noise to average away.

## The assessment record

Layer 2's record is a file rather than a conversation turn. The judging pass writes it, and writes nothing else.

- **It sits beside the idea**, as `backlog/ideas/<name>.assessment.md`.
- **Frontmatter carries the three facts a machine reads**: `name`, the idea's slug; `assessed`, the date; and `idea-blob`, the idea file's git blob id at assessment.
- **Kind and disposition sit in prose above the table.** The seat copies the kind ruling into the idea's own frontmatter, so neither belongs in this file's frontmatter.
- **A summary table opens the record**, one row per letter in INVEST order. Three columns: the letter spelled out, its score, and a one-line finding.
- **A detail section per letter follows**, in the same spelling, carrying the finding in full.
- **A letter that declines a score says so in the score column**, and its finding is the declination.
- **The `LAYER1` line is carried into the record verbatim.** A record without it reads as not-run.
- **The human's ruling closes the record**, under its own heading, and arrives later than the rest.

**Re-assessment replaces the record while the idea is in the ideas lane.** One idea carries one record, holding the assessment the next promotion would be granted on.

**`idea-blob` is what makes a stale record visible.** Take it with `git hash-object -- backlog/ideas/<name>.md`. Git already assigns the file that id, so the assessed text stays retrievable by it and sync is a comparison rather than a second scheme.

**The record is prose, and `claim-discipline.md` binds it.** Date every figure, name the tree it was taken on, and write the whole record as history.

The shape, with every field named:

```text
---
name: <slug>
assessed: <YYYY-MM-DD>
idea-blob: <blob id>
---

# Assessment — <slug>

`/idea-assess`, <date>. Kind: <kind> (SAFe: <orientation>). Disposition: <disposition>.

`<the LAYER1 line, verbatim>`

| Letter      | Score | Finding |
| ----------- | ----- | ------- |
| Independent |       |         |
| Negotiable  |       |         |
| Valuable    |       |         |
| Estimable   |       |         |
| Small       |       |         |
| Testable    |       |         |

## Independent

## Negotiable

## Valuable

## Estimable

## Small

## Testable

## The human ruling

None recorded.
```

`None recorded.` is a live anchor rather than filler: the ruling replaces that one line, and an idea nobody rules on keeps a true statement.

## Layer 3 — the calibration record

The record lives in git, with no new artifact class.

A promotion commit carries **two records in order**. First the judge's six letters as rendered, each number with its finding text. Then the human's ruling per letter — agree or differ, with the reason on each differing letter. Write the judge's half first, and never edit it afterwards. Without the second record the human's verdict is a contaminated label, and calibration would measure agreement with itself.

Declines keep the existing in-file practice: a dated `REFUTED` or `DECLINED` record. An epic's trace is its index sections and children. A spike's trace is its own candidate file.

A calibration pass counts agreement per letter, never a total. Disposition agreement is primary; score delta says where the divergence sits. A letter below roughly two-in-three disposition agreement has wrong anchors. Run the pass at ten dispositions of any kind, or a full `ready/` turnover, and record the counts in the sidecar.

**Stated risk:** dispositions accumulate slowly, so the scale may run unvalidated for months. Bound E above is what expires it honestly when the evidence arrives.
