# Spike report: procedure-length-clears-by-relocation

**Ruling: the continuation paragraph is a legitimate shape. `Procedure.ProcedureLength`'s
marker-line measure is the correct measure, not an incidental gap. The rule stays as-is, no
companion rule, and the residual judgment lands as a recorded ruling in `prose.md` with no
code.**

**Exposure count: 51 of 51 current findings clear by relocation alone (44% of the corpus's
116 numbered steps), and 28 steps already use the shape today, reading clean.**

Answered by `architect` on 2026-09-18. The harness refused the subagent's file write, so
the orchestrating seat recorded this text.

## Probe method (named before running)

- **Probe A — current exposure.** `vale --output=JSON` over the exact tracked file list
  `npm run prose-lint` uses (`git ls-files '*.md' '*.ts' '*.tsx'` minus `src/catalyst/`),
  filtered to `Procedure.ProcedureLength`. Since the rule counts words on the marker line
  only, relocation clears any finding by construction — so the finding count is the
  exposure count. Probe C demonstrates the cleared shape rather than asserting it.
- **Probe B — the already-invisible mass.** A Node scan over the rule's enabled surface
  (`.claude/agents/**`, `.claude/skills/**`, `.claude/references/**`, `CLAUDE.md`,
  `src/**/*.md`, minus `*.meta.md`), reproducing the rule's own state machine (marker
  regex, fence toggling, split-on-space word count), extended to accumulate indented
  continuation lines per step, classified into plain paragraph / sub-bullet / fenced code.
- **Probe C — what lints the body after relocation.** A scratch `.vale.ini` against this
  checkout's `vale-styles/` and `.vale/`, probing whether `STE.SentenceLength` and
  `STE.ParagraphLength` reach a numbered step's continuation paragraph.

**One probe defect, caught and corrected.** Probe B's first run used git pathspec
`.claude/references/**/*.md`, which matches nothing (git's `**/` requires an intermediate
directory), silently dropping the reference tier and reporting 45 marker violations against
vale's 51. A per-file diff located the gap; the corrected run reconciles at 51 = 51. Only
the reconciled run is reported.

## Probe A — 51 findings, 9 files

171 alerts corpus-wide across all enabled rules; `Procedure.ProcedureLength` accounts for
51: `product.md` 13 (21–61 words), `coder.md` 8 (21–38), `cleaner.md` 6 (24–60),
`merge-protocol.md` 6 (24–71), `CLAUDE.md` 5 (27–116), `architect/contract-mode.md` 4
(50–107), `testing-layers.md` 4 (54–85), `engineering.md` 3 (73–89), `mutation-testing.md`
2 (23–34). No finding is exempt from relocation, so this is not a footnote — the ruling
governs nearly half the corpus's 116 numbered steps.

## Probe B — the shape is already in the corpus at scale

44 of 116 steps already carry an indented body; **28 pass the rule while marker + body
exceeds 20 words** (27 via plain continuation paragraphs). Extremes: `merge-protocol.md`
line 95 (marker 9, body 147), line 117 (marker 4, body 92); `product.md` line 110 (marker
4, body 22 + 46 in sub-bullets). Hand-sampling the extremes: the bodies are qualification
and rationale (why the tag is annotated, why `slice/` is load-bearing), and the stub
markers head sanctioned sub-bullet decompositions (`1. **Write Gherkin.**`). Twenty of the
27 are `prose.md`'s numbered enumerations of failure modes — numbered statements, not
procedures; a separate known imprecision, not this spike's subject. So `coach`'s proposed
relocation is not a new precedent — it is the corpus's existing shape applied to three more
steps.

## Probe C — the body is not an unlinted void (measured)

1. A 26-word marker line fires `ProcedureLength` and does **not** fire `SentenceLength`
   despite exceeding 25 words — on the marker line, `ProcedureLength` is the **only**
   length rule, so weakening it leaves marker lines wholly unmeasured.
2. A 31-word single-sentence continuation paragraph fires `STE.SentenceLength` ("Sentence
   is 31 words. STE caps descriptive text at 25."). **SentenceLength reaches the body.**
3. A 7-sentence continuation fires `STE.ParagraphLength`; a second probe pinned the
   boundary — a 6-sentence body is clean, and the marker's own sentence does not count
   toward the six. **ParagraphLength reaches the body.**
4. Probe items 2–3 are themselves the post-relocation shape and read clean under
   `ProcedureLength` — relocation-clears demonstrated, not asserted.

So relocation moves words from a 20-words-per-step **procedural** cap into a
25-per-sentence, 6-sentences-per-paragraph **descriptive** regime — exactly ASD-STE100's
own procedural/descriptive split, which the vale-llm-slop package encodes. The body is
bounded per sentence and per paragraph, though not in total.

## The three-way argument

- **Keep (chosen).** Marker = instruction, body = qualification is the house register
  already (`prose.md`'s "Instruction stays. Explanation moves."; CLAUDE.md's "keep the why
  to one clause beside its rule") and STE's own division. The rule measures precisely the
  procedural text; the body changes lint jurisdiction rather than escaping it.
- **Close (rejected).** Mechanically feasible in the raw-scope Tengo (accumulate indented
  continuations, report at the marker offset so the verified offset arithmetic survives) —
  but the measure is wrong: a total-words-per-step cap has no STE basis and converts the 28
  legitimate shadow steps plus every future rationale body into findings. The
  instruction/rationale split inside a body is not mechanically decidable —
  `OneInstruction`'s imperative-verb discriminator fails there, since rationale is full of
  quoted imperatives ("a plain `git push` already carries the tag"). The no-judgment-left
  version of the rule does not exist without banning a ratified register.
- **Companion rule (rejected).** The body is already bounded by two enabled STE rules — a
  `Procedure` body rule would be a second rule reporting one defect at a different
  precision, the exact drift `.vale.ini` names as the reason `STE.ProcedureLength` was
  disabled by name. The stub-marker hazard is not cleanly matchable either: sanctioned
  decomposition steps (`1. **Write Gherkin.**`, `6. Final all-clean check:`) are themselves
  stub markers. The stub hazard's mechanical exposure is 5 words per sentence (25 vs 20)
  plus loss of a per-step total — small, and priced in.

## The residual judgment (what the `prose.md` ruling should say)

Relocation is honest when (1) the marker line keeps the **complete executable
instruction** — a reader executing only marker lines performs the procedure correctly — and
(2) what moves down is qualification, rationale, or worked example, never a second action
(`OneInstruction` still catches that on the marker line) and never the step's applicability
condition. Same judgment `prose.md` already requires at file scale, applied at step scale.

## Fixture obligations per option

- **Keep:** none — no rule change, `vale-fixture-check` untouched. Optionally, a
  discriminating short-marker/long-body case could be added to
  `vale-styles/fixtures/ProcedureLength.good.md` as hardening; not an obligation.
- **Close:** an edited `ProcedureLength.yml` owes an updated `.bad`/`.good` pair for `.md`
  (the only extension it claims). The `.good` would need a marker-plus-rationale step that
  stays silent — the undecidable discrimination above, so the fixture cannot be written
  honestly. That impossibility is itself evidence against the option.
- **Companion:** a new rule file under `vale-styles/Procedure/`, fresh fixture pair per
  claimed extension, `fixtures.vale.ini` wiring, `.vale.ini` enables — moot under
  rejection.

## Open questions, answered

- **Exposure:** 51/51; 28 already-invisible steps; 116 steps total.
- **Mechanically complete `ProcedureLength`?** No — see Close, rejected.
- **Does `STE.ParagraphLength` reach the body?** Yes, measured (7 fires, 6 clean, marker
  sentence excluded). `SentenceLength` reaches it too, and deliberately not the marker
  line.
- **Rule change or `prose.md` ruling?** A ruling in `prose.md`, no code. `prose.md` is an
  article, so the recording routes through the process pipeline (`coach` spec → `writer`)
  or rides the parent slice's spec revision — the seat's call. **No `enabler-technical`
  candidate**: the answer needs no rule, script, or config change.

## Not measured (stated, not inferred)

- Whether `SentenceLength` reaches **sub-bullet** text under a numbered step — Probe C
  covered plain continuation paragraphs only.
- Probe B's register classification rests on hand-sampling the extremes and `prose.md`'s
  cluster, not all 28 bodies.
- `ParagraphLength` segmentation was pinned only at the 6/7 boundary with single-paragraph
  bodies.

## Consequence for the parent slice

`split-the-merge-protocol-reasoning-into-its-sidecar`'s T stands: its post-split Vale
reading of 0 on the three steps (50, 39, 30 words) is legitimate under this ruling,
**conditional on each marker line keeping the complete instruction after the split** — a
step-by-step check for that slice's spec review.
