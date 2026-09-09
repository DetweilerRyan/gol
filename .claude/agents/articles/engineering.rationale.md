# Rationale: Engineering Rules

**Audience:** whoever is changing a rule in `engineering.md`. **Read when:** you are amending, narrowing or
overturning one of those rules — never in order to follow one.

No role carries a read trigger for this file, and that is the point. `engineering.md` is written to be
actionable on its own; this file holds the evidence behind it, so that a rule can be argued with rather
than only obeyed. Everything below is history: what was measured, in which slice, by what method, and
which readings were later corrected. Several figures describe trees that no longer exist — **do not quote
a number forward from this file without re-deriving it.**

## The separate decision this split required

`ideas/candidates/roll-the-rationale-sidecar-out.md` ruled `engineering.md` out of the rollout queue
"without a separate decision", and named it as the one file that genuinely needed one. Two positions were
recorded there and left unreconciled:

- **Position A.** Splitting an unconditionally-read file moves argument out of the one place everyone
  sees. This is what protected four files, `engineering.md` among them.
- **Position B.** CLAUDE.md's own routing preamble argues the reverse — auto-loading is "a cost, not a
  distribution channel", and CLAUDE.md was itself shrunk on exactly that logic. On that reading the
  unconditionally-read files are the ones to split hardest.

**Ruled 2026-09-09 by the user, for Position B.** Two things carried the ruling. First, mandate 1
reconciles the positions rather than overriding one: a closed-decision marker keeps the settled **fact** in
the unconditionally-read file while the **argument** moves here, so Position A's concern is answered on its
own terms. Second, `engineering.md` was the only one of the four protected files whose protection actually
rested on the contested argument — `workflow.md` (1,486 rationale bytes) and `handoffs.md` (3,161) are
defended independently as too small to be worth a second file, and `orchestration.md` as 94% entangled and
therefore expensive rather than protected.

**What was not conceded.** Position A is not recorded here as wrong. The claim is narrower: the cost it
names is paid by the argument, not by the fact, and mandate 1 is the mechanism that separates them. A
future split that drops the markers would revive the objection in full.

## The claim-discipline rule: what it was measured on

### The natural experiment behind "an undated present-tense claim rots"

The natural experiment is on the record: the audit behind `slice/comment-reference-checks` measured this repo's dead-filename count going **17 to 19 during the JSDoc partition sweep** (measured 2026-09-07) — a sweep with a text-preserving partition commit, per-commit verification, hover budgets and an `architect` ratification. It caught none of them and created two.

### The predicted caller, which rots worse than a present-tense one

`gridGeometry.ts`'s `gridLinePhasePx` described `GridLines.tsx` as "this module's future caller", drawing the phase as a background "once dead cells no longer carry an element of their own to put a border on". That prose landed in `collapse-dead-cell-layer`'s step 1 and **its own step 2, the same day, made it false** — `GridLines.tsx` has imported and called the function ever since (verified by `git log -S`, not by blame), and the twenty-seven slices tagged after it — a whole JSDoc partition sweep among them — read past the sentence before `no-undated-cross-file-claims` caught it.

### Why either spelling of a slice name is fine

The bare slug is this repo's dominant idiom by an order of magnitude. Measured 2026-09-07 across
`.claude/**` and `CLAUDE.md`: ~120 distinct backticked slugs against 6 tag-form references. Mandating the tag form would have put the rule in conflict with its own codebase on the day it landed — the same failure the count-beside-enumeration clause below avoids.

### How far a grep falls short, measured on the sweep that first applied the rule

**How wide that gap is, measured on the sweep that first applied this rule.** `no-undated-cross-file-claims` swept the whole tree from a manifest built by regex, and two later passes each found more that the manifest had missed. `cleaner` found an undated whole-suite count, a stale test-count figure, a `<file>` line citation into a file whose structure had moved, and a stale _prediction_. `architect`'s REVIEW then found three untouched `909/909` counts byte-identical to one `cleaner` had just fixed, two more present-tense "the whole unfiltered suite stays green" rulings, a definite article standing in for a slice name ("the corrective", "the corrective tree"), and a "this slice" in `src/index.css` — which every prior pass had missed for the same reason: every prior pass was scoped to `.ts`/`.tsx`. Three roles, three passes, and each one still left instances of a class one of them had a literal string for. **State that as which rather than as how many** — the first draft of this very paragraph carried a tally, and the tally was wrong within the hour, because the pass writing it was still finding sites. That is the article's own count-beside-enumeration rule demonstrated on itself.

## Writing a property test: what the two rules were measured on

### The eight-fault run that established the property/unit split

Measured in `wheel-zoom-ignores-magnitude-and-pinch`, where `architect` ran eight faults against the wheel-zoom mapping's two properties (reciprocality — a delta then its exact negation returns the original; additive composition — two deltas in sequence land where their sum lands in one) and against its unit tests:

| fault injected                          | properties       | unit tests |
| --------------------------------------- | ---------------- | ---------- |
| base `ZOOM_FACTOR` 1.25 → 1.5           | both green       | **9 red**  |
| notch constant 100 → 200                | both green       | **7 red**  |
| exponent sign flipped                   | both green       | **8 red**  |
| exponential → linear                    | **both red**     | green      |
| continuous → quantized to whole notches | **additive red** | green      |
| `deltaMode === 0` branch inverted       | **additive red** | green      |
| zoom guard drops `                      |                  | ctrlKey`   | both green | **1 red** |
| zoom anchor x/y swapped                 | both green       | **1 red**  |

Reciprocality and additive composition hold for any exponential family `b ** (k*d)` — any base, any scale, either sign — so no property over that module could ever pin the base to `ZOOM_FACTOR`. That is a ruling recorded in `camera.property.test.ts`'s header, not an oversight.

### The arbitrary that drew from one corner of its own range

**Two ways this goes wrong, both measured in that slice rather than hypothesized.** A property that restates the implementation's own formula is an equivalence check rather than a test — `coder` flagged one against its own interest there, and it was replaced. And **a property is only as strong as the region its arbitrary actually samples**: those replacements drew from `pixelArbitrary`, whose `fc.float` draws uniformly over _representable_ floats, which crowd toward zero — **16,682 of 20,000 draws under 0.01 in magnitude**. Correct for a pixel position, useless for a wheel delta, and the quantize fault above survived at a **0.027%** detection rate until the arbitrary was replaced. **Ask what your arbitrary draws, not what its bounds are.**

### The Invalid Date defect that paid for both rules

Both rules were paid for. In `import-utilities`, `datesEqual` compared two Invalid Dates as **unequal**, so an Invalid Date was the one container the shared equality walker reported as unequal to its own `structuredClone`. `coder`, `cleaner` and `architect` all ran the property suite green; it surfaced at `hardener` on roughly a 0.2% `fc.date()` draw. Reflexivity passed through a same-reference short-circuit and symmetry saw `false` in both directions, so exactly one property could catch it, and only sometimes.

## Dropped from the source article, and why

`engineering.md` is adapted from unclebob/swarm-forge's `main`-branch constitution
(`swarmforge/constitution/articles/engineering.prompt`). Two parts of the source were reviewed and not
carried over.

- The Go/Clojure/Java language-tool installation table and per-language framework preferences (Babashka, Speclj, Maven) — this is a single-language TypeScript project; its tools (`dry4ts`, `crap4ts`, Stryker, `scripts/acceptance-mutation`) are already pinned in `package.json`/`scripts/`, nothing needs installing from GitHub at agent startup.
- `six-pack` branch's own `local-workflow.prompt` was also reviewed for this migration — it's entirely about that branch's tmux/QA-handoff-merge mechanics (`done_with_current.sh`, `merge_and_process QA <commit>`, ignoring wake-ups mid-task), not applicable here, and its one substantive rule (run tests before handoff) duplicates the `local-engineering` rule already captured above.

## The six published mechanism errors

Each was reached from a mechanism that sounded right, was never measured, and was caught by the next role
rather than by its author.

Every role in this pipeline has published one. A DESIGN pass asserted a third-party runner's cleanup lifecycle and was wrong (`black-box-acceptance-pilot`). A REVIEW pass concluded a guard existed from reading call sites (`ruler-label-axis-affordance`). `smooth-zoom-transitions` produced three in a single slice, each caught by the next role rather than by its author: the exactness ruling's justification named a consequence two orders of magnitude larger than anything the instrument could see; "a bare unconditional statement call has no Stryker mutator" was false, and one scoped run showed the mutant existing and Killed; and a severity argument called a float boundary vanishingly unlikely when the arithmetic behind it holds for 7.2% of inputs. **In all six cases the verdict survived and the reason did not.** That is the characteristic signature — a right answer for a wrong reason is not self-correcting, because nothing downstream fails.

## The gate that went on guarding the old location

Measured, in `split-claude-md`: `agent-doc-check`'s check 5 required every `rules/*.yml` to be named in `CLAUDE.md`. The invariant behind it was _a rule must be documented where roles will read_. Before the split those were the same sentence; the split moved the prose to `ast-grep-rules.md` and pulled them apart. The check was treated as fixed, a 28-row index was kept in `CLAUDE.md` to satisfy it, and four doc lines were then written hardening the wrong version into place. That index cost auto-loaded budget for every role and every subagent, had a row that diverged from its rule file on day one, and left the real gap — nothing required a rule to have article prose at all — wide open. **It resolved the other way in the end, which is the point:** check 5 now reads `.claude/agents/articles/ast-grep-rules.md` (`scripts/agent-doc-check/run.ts`'s `RULE_DOC_PATH`) and CLAUDE.md carries no rule index at all — the check moved to where the invariant went, and the awkward artifact it had been propping up disappeared with it.

## The device-pixel wheel argument

- **A harness argument may not be in the unit its name implies, and the wrong unit reads as a completed measurement.** Measured 2026-09-03: Playwright's `page.mouse.wheel(x, y)` takes **device** pixels, so the page receives `deltaY / devicePixelRatio` — a requested 100 arrives as **100 / 50 / 33.3** at `deviceScaleFactor` 1 / 2 / 3. A DPR-2 gridline sweep built on it silently swept 51/64/100/125/195% instead of the intended 40/41/100/156/300%, produced a full table, exited 0, and looked finished. Nothing in `features/` is affected today because the suite runs at DPR 1 — but every wheel scenario there would quietly measure a different gesture the moment it did not, and no assertion in the repo would notice. The general form: when a probe's numbers are _plausible but not what you targeted_, check the argument's units before concluding anything about the subject.

## Why the `scripts/` tool configs stopped enumerating their file lists

<!-- reference-check: allow mutation-rules.property.test.ts -- the historical name of `scripts/acceptance-mutation/tuple-list.property.test.ts`, renamed by `cells-column-has-two-parsers-and-neither-models-tuples`; the old name is the git-history search key and stating it wrongly to satisfy this checker would make the sentence false -->

**A new program in `scripts/` is picked up automatically** — `crap4ts.scripts.config.ts`'s `include` and `stryker.scripts.config.json`'s `mutate` are both `scripts/**/*.ts` minus `*.test.ts`, `run.ts`, and `test-support.ts` (the I/O shells and the shared fixture helpers stay excluded, the same way `src/test-support/**` is on the `src/` side). They used to be hand-maintained lists, and a program omitted from them was invisible to `crap4ts:scripts` and `test:mutation:scripts` while both still reported success — the same silent-blindness failure that `ast-grep:rules` exists to catch in the rule files, and it had already happened once in `scripts/` itself. What you must still do by hand is add an **exclusion** when a new file genuinely shouldn't be measured; the failure now shows up as a loud threshold breach rather than as silence. `.dry4tsrc.json` carries the third exclusion of the same kind, `**/run.ts` — every program's entry shell is the same six-line read-decide-print-exit `main()`, which `dry4ts` reports as a duplicate once a second program exists. It is deliberately broader than the intent ("a `scripts/` program's I/O shell") because `dry4ts` matches `ignorePatterns` against paths relative to the directory it was pointed at, not to the repo root — measured: `scripts/**/run.ts` matches nothing under `dry4ts scripts` — and one config serves both `npm run dry4ts` and `npm run dry4ts:scripts`. Nothing under `src/` is named `run.ts` today; if something ever is, it is silently exempt.

## The property test that needed no config change

- There's no scripts-scoped property _command_, so `architect`/`hardener`/`product` gain no counterpart to their `npm run test:property` obligation for `scripts/` work — running `npm run test:scripts` discharges it, because a property test there is collected by that one config like any other test. The clause this replaces said no property-test layer existed at all and that one should be added only if an invariant over a broad input range appeared that a table-driven test didn't cover. That happened, in `comma-list-mutants-are-all-syntax-breaking`: `scripts/acceptance-mutation/tuple-list.property.test.ts` (added under the name `mutation-rules.property.test.ts`) quantifies over coordinate-pair lists of any length, magnitude and sign, and the shape the table-driven fixtures could not reach — a single-pair list, and multi-digit coordinates — is exactly where the defect that slice fixed lived. Adding it needed **no config change**, which is the fact worth carrying: measured on that slice's tree, `vitest.scripts.config.ts`'s `scripts/**/*.test.ts` include collects a `*.property.test.ts` file, and `vite.config.ts`'s `sharedExclude` entry for `scripts/**` keeps the src-side `property` project — whose include is the unrooted `**/*.property.test.ts` — from collecting it too. So the suffix is a naming convention in `scripts/`, not a project selector as it is in `src/`, and a file placed there gets no separate run and no separate obligation. The bar for adding another is unchanged and is the one in "Writing a property test" above: pin the degenerates, and show it failing against a deliberately broken implementation first. The browser-required layer is a different story and still has no counterpart: `scripts/` is Node CLI tooling with no browser APIs to verify, so `npm run test:browser` has no scripts-scoped form and `hardener` simply skips that stage for `scripts/`-only work.

## The split itself, measured

Split by `split-engineering-article`, 2026-09-09. Figures taken after the final commit, on the tree that
commit produced. Re-derive rather than quoting these forward.

| Measure                            | Before |   After |
| ---------------------------------- | -----: | ------: |
| Article bytes                      | 61,890 |  41,771 |
| Sidecar bytes                      |      — |  21,610 |
| Rationale bytes inside the article | 17,383 |  12,457 |
| Entanglement                       |    82% | **91%** |
| Backticked slice slugs             |     30 |      13 |
| Vale mechanical findings           |    186 |   **2** |

**Two of those rows are bad news, and they are the interesting ones.**

**Entanglement rose, 82% to 91%.** That is the share of directive-carrying blocks that also carry
non-directive prose. Removing whole rationale blocks raised it by construction: the pure-evidence blocks
left, and what remains is disproportionately rules with their reasoning welded on. **The sidecar tier
redistributes an enumeration far better than it redistributes argument.** `ast-grep-rules.md` fell 87%
because 70% of it was one grammatical list that could move verbatim. This article is prose, and prose
resists the same operation.

**Rationale bytes fell only 28%, against a 33% fall in total bytes.** So the article did not become
proportionally more directive. It became smaller while holding a similar mix. Anyone planning the next
split of a prose article should expect that, and should not promise a rationale-share improvement.

**The Vale baseline in that table was itself wrong once, and the error was the same one twice over.** The
first figure recorded was 128, measured on the article after the extraction commits had already shortened
it. The true pre-split count, re-derived by linting `main`'s copy of the file in scope, is 186. **A
"before" figure taken at any point after the work began is not a before figure**, and the fact that this
slice recorded the measurement rule and then broke it in the same table is the strongest argument for
re-deriving rather than recalling. The three `after` rows drawn from the classifier were re-run on the
final tree and are unchanged.

**The sidecar figure is self-referential, and getting it right needs a fixed point.** Writing the byte
count into the sidecar changes the sidecar's byte count. The first attempt recorded a figure measured
before this very section existed, and was wrong in the flattering direction — which is the direction
mandate 4 exists to catch. Settle the surrounding prose first, measure, then substitute a numeral of the
same width. The article figure has no such problem and needs no such care.

**Mandate 3's audit found one drop, and it is the shape the pilot warned about.** A lint pass compressed
the hand-written-e2e bullet and took `triage-paired-specs` and its 35-test figure out of the pair
entirely, rather than moving them. `testing-layers.md` still carries the fact five times, so nothing was
lost from the corpus — but that article is read by `coder` and `product` alone, so the three other roles
would have lost the evidence for a rule they all read. Restored as a pointer. **The lesson is that a
shortening pass drops content the splitting pass carefully placed**, and only a by-hand comparison
against the pre-split article finds it.

**The two residual Vale findings are `Google's` and `Microsoft's`** — possessives that `STE.Contractions`
reads as contractions. Expanding either produces nonsense, so both stay.

## The prompt-rule triage, finding by finding

106 prompt findings on the split article. **One was act-on. The rest were exempt, and the largest class
was exempt for a single structural reason.**

| Rule              | Findings | Act-on |
| ----------------- | -------: | -----: |
| `ProcedureLength` |       56 |      0 |
| `PassiveVoice`    |       46 |      1 |
| `OneInstruction`  |        4 |      0 |

**The one act-on finding.** "What is ruled out is inventing an affordance whose only consumer is the
test" stated a prohibition with no actor. It now reads "Never invent an affordance whose only consumer is
the test." Found by reading the findings, not by the documented `is sanctioned|is permitted|is allowed`
grep, which returned nothing on this article. **The grep remains a shortcut into the class rather than a
substitute for the pass, and this slice is the evidence.**

**All 56 `ProcedureLength` findings were statements rather than steps**, and that verdict was reachable
once rather than 56 times: this repo writes a rule as a bullet carrying its own reason, so the rule fires
on the house style. They divide as 34 rule-with-rationale bullets, 9 per-role command substitutions, 6
standing verification obligations, 4 test-layer definitions, and 3 numbered decision questions. That
lesson is now in `prose-linting.md`.

**The 45 remaining `PassiveVoice` findings** divide across the article's five documented exempt classes,
with one residual left in as arguable: "None may be skipped on the grounds that it cannot fail" is a
prohibition with no named actor, kept for parallelism with the sentence beside it. Recorded here rather
than counted as exempt.

**All 4 `OneInstruction` findings** are the same markdown-list false positive as the `ProcedureLength`
set: a list item describing a tool's ordered behaviour, or an enumeration of layers, rather than two
instructions to a reader.
