# Article: Claim discipline

**Audience:** every role, and the orchestrating session - **Read when:** before writing down a conclusion, a measurement, or a comment that asserts something about another file.

Four rules about what a claim may say and how long it stays true. They are not engineering rules: they bind every prose surface in this repo, including the orchestrating session's own writing, which has no reviewer upstream of `hardener`.

Its evidence lives in the sidecar `engineering.rationale.md`, alongside the rules these were split from.

## The scope of a claim is the scope of the command that produced it

A measured number licenses a conclusion exactly as wide as the command that produced it, and no wider. Writing it down at a wider scope is the same defect as trusting a scoped gate as if it had covered everything. The scoped forms are `--mutate` on one file, `acceptance-mutation --feature <name>`, `vitest run <path>`, and one `.e2e.spec.ts`.

- **Before writing a conclusion down, re-read the command.** If it names a path, a `--feature`, a `--project`, or a single spec file, the conclusion may name that path too and nothing above it. "This spec does not catch X" and "the e2e layer cannot catch X" are different claims, and only the first is bought by `npx playwright test features/<one>.e2e.spec.ts`.
- **Watch the pre-registered column.** Fixing the command up front is good experimental practice, and is exactly what makes this easy to miss later. The scope was chosen while the question was narrow, and stays narrow after the question widens. **Re-run at full scope before generalizing.** Running the whole layer is usually seconds, and is the difference between a fact and a plausible inference.
- **An experiment whose conclusions get committed must commit its table**, at minimum in the commit body. When one row turns out to be wrong, nothing says what the other rows were, so none can be re-checked. The worked example, an experiment that published one row and recorded no table, is in `engineering.rationale.md`.
- **A tool's own attribution metadata is a claim at the scope of the run _the tool_ made, not the run you would have made.** Stryker's `killedBy` names whichever test failed inside a filtered execution. Against a runner that compiles each Gherkin step into its own `test`, it routinely named a test that fails on any tree, mutated or not. Reading it as "this test kills this mutant under `npm test`" is the same widening, one layer down.

  **The Gherkin instance is no longer reachable**, because `stryker.config.json`'s `ignorePatterns` keeps `features/` out of the sandbox. The principle is untouched and generalizes past that one layer. `killedBy` is **first-kill-wins**, so an attribution claims which test ran first, never which tests _could_ kill the mutant. Counting attributions per file therefore measures ordering, not coverage. `archive.md` in this directory carries the measurement and its one-command reproduction.

- **A harness argument may not be in the unit its name implies, and the wrong unit reads as a completed measurement.** When a probe's numbers are _plausible but not what you targeted_, check the argument's units before concluding anything about the subject. The measured case, on Playwright's device-pixel wheel argument, is in `engineering.rationale.md`.

This is the same family as the `--mutate`-is-last-wins trap in `mutation-testing.md`, and the stale-`coverage/` trap in `quality-tooling.md`. Each is a real measurement, correctly run, describing less than the reader will assume.

## A conclusion from a plausible mechanism outlives a measurement

The section above is about a measurement whose scope gets widened. This one is about its more common sibling: **a conclusion that was never measured at all, reached instead from a mechanism that sounds right.** Those two are indistinguishable in a handoff. Both arrive as a confident sentence, and only one has anything behind it.

One asymmetry makes this worth a section of its own. **A wrong mechanism survives review far more easily than a wrong number does.** A reviewer can check a number against the command that produced it. Against a mechanism they have nothing but their own intuition, which is usually the intuition that produced it.

Every role in this pipeline has published one, and in each case the verdict survived while the reason did not. **That is the characteristic signature** — a right answer for a wrong reason is not self-correcting, because nothing downstream fails. The six published examples are in `engineering.rationale.md`.

What to do about it, in order of cost:

- **Prefer the cheap command to the confident sentence.** The three `smooth-zoom-transitions` errors cost one Stryker run, one replay script and one arithmetic count between them, each under a minute. If a claim can be checked by running something, running it is nearly always cheaper than the paragraph arguing for it.
- **When you cannot check it, say the claim is unverified.** An unverified claim a later role can check is worth more than a confident one it has to refute, and it costs one clause. This is the same instruction the `architect` role carries about reachability claims, generalized: it applies to any mechanism, not just to what calls what.
- **Write down the mechanism you actually verified, not the one you set out to verify.** When a check comes back confirming the verdict by a different route than you expected, the route is the finding. `smooth-zoom-transitions`' `clamp01` note is the worked example. The equivalence claim was right and the "measured equivalent mutant" heading was not. That heading sent the next role hunting for a survivor no mutator generates.
- **Re-measure the premise you were handed, not just the conclusion.** This is the habit that caught all six, and it is the reason the pipeline's cost is worth paying. A role that only re-checks the previous role's _answer_ will agree with it; the errors live one level down, in why.

## A comment may state why; it may not state an undated present-tense fact about another file

The section above is about how _wide_ a claim is. This one is about how long it stays true. **It binds every prose surface in the repo**: `//` and JSDoc under `src/`, `scripts/`, `features/` and `perf/`; comments in `rules/` and `rule-tests/`; and every `.md` under `.claude/`, plus `CLAUDE.md` itself.

**A dated past measurement claims history and cannot rot.** **An undated present-tense claim about another file's current state is a promise with no mechanism behind it.** Nothing re-checks it, and the file it describes moves without it. The two are indistinguishable at the moment of writing, which is why this is a rule rather than a matter of care.

Six forms, worst first:

- **Never enumerate call sites.** `LSP findReferences` answers "who calls this" correctly, forever. A roster in prose is a second representation of what the import graph already holds authoritatively. _The Pragmatic Programmer_ names that DRY violation for comments explicitly. **State the contract callers must honour instead.** That is the durable half, and the half a reader actually needs. "Its only caller passes a non-empty array" becomes "the argument must be non-empty". That stays true when a second caller arrives, and it is a fact about _this_ module rather than about two others.

  **A predicted caller is a roster in the future tense, and it rots worse than a present-tense one.** Nothing ever falsifies it: on the day the predicted caller arrives, the sentence still reads as a plan rather than as a lie. Say what the value is _for_, not who is going to consume it. See `engineering.rationale.md` for the predicted caller this rule was written on.

- **Cite `<file>'s <symbol>`, never `<file>:NN`.** `cellTiles.ts`'s `nextTileRange` survives a line being inserted above it. `cellTiles.ts:241` does not, and fails silently by pointing at whatever moved into that position. `npm run reference-check` machine-verifies both halves. The filename must resolve against the live tree, and the cited symbol must appear in the file it is attributed to. A line reference in a source comment is a failure whether or not it currently resolves.
- **Cite a test by what it guards, not by its quoted title.** Any slice that touches a title can reword it, and nothing notices. What the test guards is the reason you are pointing at it in the first place. **Nothing checks this one, so it is convention the whole way down.** A quoted-title check was specified, built against and dropped during `slice/comment-reference-checks`: the citation form was too rare on this tree to be worth the false-positive surface.
- **Name the slice, never "this slice"** — in anything that is a _record_. A comment, an article paragraph, a rule file's rationale and a commit body all outlive the session that wrote them. "This slice" in a record names a referent that died with its author. Recovering it costs a `git log -S` the writer could have spent one token avoiding.

  **The carve-out is not the same construct at all.** In a role file or an article instruction, "this slice" is a procedural indexical. The reader is always inside a slice, so context supplies the referent the way it supplies "you". `architect.md`'s "any property added this slice was shown to fail against a deliberately broken implementation" instructs whoever is reading. Naming a slice there would break it. **The test is whether the sentence instructs a future reader, or reports what happened.**

  **Either spelling of the name is fine.** A backticked bare slug (`smooth-zoom-transitions`) or the tag form (`slice/smooth-zoom-transitions`): `git tag -l 'slice/*'` resolves both, and the bare slug is this repo's dominant idiom by an order of magnitude.

- **Cite the command, not the number.** A figure quoted forward is stale the moment the tree moves, and reads as current forever. The command re-derives it on demand. Where the figure genuinely _is_ the finding, **date it and name the tree it was taken on**. A figure with provenance is checkable. A bare one is indistinguishable from a current one. "Reinstating a global Enter listener reds 5 tests" is a promise. "Reds 3 of 127 in the Playwright run, measured by `hardener` on `slice/re-audit-hand-written-e2e-residue`'s tip" is history.
- **The same rule binds `.md`, harder.** Every role reads those files, so a stale claim there is _acted on_ rather than merely read. **Name which, not how many.** "Four features carry no Examples table" cannot rot from a fifth being added. "Four of the seven" has, twice.

  This refinement exists to keep the rule above off `CLAUDE.md`'s own module map, and the ruling below narrows it. **A count standing beside its own complete enumeration fails loudly. A count standing alone fails silently.** "Twenty framework-free modules — `appearance.ts`, `gameOfLife.ts`, …" lets a reader check the numeral against the list in the same breath. A drift then makes the sentence visibly self-contradictory. "Four of the seven" gives the reader nothing to check against.

  **The enumeration makes a drift loud. It does not make the count worth keeping.** Ruled 2026-09-09. Where a numeral is a **census of external state**, drop it and keep the enumeration. A census counts files on disk, config entries, a library's registry, or another article's structure. A loud failure is still a failure someone has to fix, and the list carries the same information with nothing to keep in sync.

  **The sweep has not reached `CLAUDE.md`'s own module map, and whether it should is open.** It is the worked
  example above, and it is also a census of files on disk. Do not read the example as an exemption, and do
  not sweep the map on the strength of this rule alone. `ideas/candidates/apply-the-census-count-rule-everywhere.md`
  carries the question.

  **The enumeration validates the count, not the claim.** A reader can count six names beside "Six of the
  twenty import nothing at all" and still not see whether those six still import nothing. Where the list
  does not carry the property the numeral counts, that numeral fails silently inside a form that looks loud.

  **Two kinds of count stay, and neither is a census.** A count that **is** the rule or the premise stays. "Four categories, and you may add nothing else here" closes a list, and "two levels and no more" is the constraint itself. A count over the sentence's **own adjacent bullets** also stays, because it cannot drift with the tree.

  <!-- Closed decision: the eighteen edits this was ruled on, and the live cross-file contradiction the enumeration form permitted, are in `engineering.rationale.md`. -->

**The past tense is the escape hatch, and it is a real one.** **You may write a claim in every form above, line numbers included, provided you write it as history.** Attribute it to a slice or a date, and phrase it about what _was_ true. Such a claim asserts nothing about the current tree.

`doc-comments.md`'s account of the before-state that motivated the JSDoc sweep is the model. It names the slice's own measurement, says what it measured, and closes with "it is a record of the gap, not a live defect". Converting a rotting present-tense claim into a dated past one is usually the correct fix, and is always cheaper than deleting the knowledge.

**What this codifies, honestly.** _The Pragmatic Programmer_ is the only published source behind it. **No mainstream style guide writes down "no line numbers" or "no caller lists".** Not Google's, not Microsoft's, and none of the C, R or Python community guides. This is a widely-held principle written down, not a rule cited.

The mechanism covers only the resolvable half. `npm run reference-check` gates filenames, `<file>'s <symbol>` citations and source line references. Rosters, "this slice", test titles and counts are unmechanised by construction: a roster in free prose is not a syntactic pattern. The gap between what a regex finds and what a reader finds is itself the argument for a convention rather than one more checker.

So do not read a clean grep as a clean tree. **The greps find the forms you thought of, in the file types you thought of.** That is why every role applies this while writing, rather than running it as a sweep afterwards.

<!-- Closed decision: the 17-to-19 dead-filename experiment, the `gridGeometry.ts` predicted caller, the slug-idiom count, and the three-pass sweep that measured how far a grep falls short are in `engineering.rationale.md`. -->

## Ask whether a gate still encodes its invariant

When restructuring makes an existing gate inconvenient, the reflex is to preserve the gate and shape the work around it. **Ask first whether the check still encodes the invariant it was written for.** A refactor can move the thing being protected while the check goes on guarding the old location.

**The worked example is `split-claude-md`, and it resolved by moving the check rather than by propping up the artifact.** It is recorded in `engineering.rationale.md`.

When a constraint forces an awkward artifact, state the invariant that constraint exists to protect. Then check whether the constraint still tracks it. If it does not, **changing the check is the cheaper fix and usually the smaller diff**. The warning sign is writing new prose explaining _why_ the awkward artifact must stay. That is the moment to stop and re-derive.
