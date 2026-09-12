# Article: Prose — how agent-facing prose is written, and what Vale checks of it

**Audience:** any role or session that writes or edits `.claude/agents/**`, `CLAUDE.md`, a module
sidecar, or a JSDoc block in `src/` or `scripts/`

**Read when:**

- **before moving a sentence between an instruction file and its `.meta.md` sidecar** — this
  article owns that split, and CLAUDE.md's routing branches deliberately do not
- before acting on a Vale finding, so you know which ones to act on
- before enabling, disabling or re-levelling a rule in `.vale.ini`
- when a Vale run reports zero and you want to know whether that is real
- after writing or changing a JSDoc block, before handing off — see "Triaging a finding in a comment"

> **Two questions, two files.** CLAUDE.md's routing branches answer **which article** a subject belongs
> to. This article answers **which register** a sentence is in. Given that it belongs to some article,
> does it go in the instruction file, or in that file's `.meta.md` sidecar? See "Instruction stays.
> Explanation moves." below, which governs every instruction file including this one.
>
> So this article carries instructions, and `prose.meta.md` carries the measurements, the
> dates, the probe methods, the incidents, and the rules tried and rejected. Read the sidecar when you
> are **changing** a rule below, never in order to follow one. **Do not fold a reason back into this
> file.**

## Standing instructions, which bind at authoring time

These hold whether or not a checker fires. Vale's rules below are a partial and lagging check on them.

- **Write instructions in the active voice, naming who acts.** "The between-position is sanctioned"
  hides the actor; "Use the between-position freely" does not. Nothing sweeps for this — see
  "`STE.PassiveVoice`" below for why, for the exempt classes, and for how to ask on demand.
- **Write instructions, not accounts.** State what to do, when, and under what precondition; route
  the incident, the measurement and the rejected alternative to the `.meta.md` sidecar. The section
  below headed "Instruction stays" carries the full rule.

## Setup

```bash
brew install vale && vale sync
```

**Vale is a Go binary, not an npm dependency, so `npm ci` does not install it.** A machine without it
lints nothing, which reads exactly like a clean run.

**A new worktree cannot lint until you restore `.vale/`.** `git worktree add` copies tracked files
only, and `.vale/` is gitignored, so run `vale sync` there **before you start a split** rather than
when the mandate to lint arrives. The failure names a missing path rather than a missing style, so it
does not read as "Vale is not set up here".

Keep `.vale/` in `.prettierignore` as well as `.gitignore`. Prettier does not consult `.gitignore`, so
without the second entry `npm run format` rewrites third-party YAML in place.

**`npm run prose-lint` is the command, and `-- --scope <path>` narrows it to one directory.** Every
role's trigger uses the scoped form. A role reads findings in files it wrote, not in the ~238 under
`.claude/**` and `CLAUDE.md` that only the orchestrating session may edit. A scope matching no file
exits 1 rather than printing a clean count — the same refusal an empty tracked set gets.

**`npm run prose-lint` is the command.** It lints the tracked file list and prints how many files it
linted. **Read that trailing count**: a zero from a clean tree and a zero from a run that linted
nothing are the same bytes. The script fails only when it **cannot** lint — no binary, no `.vale/`, an
unloadable config, an empty file list, a mid-run abort.

Run it after editing `.claude/**`, `CLAUDE.md`, a module sidecar, or a JSDoc block. No role owns the
running, because four seats do the editing.

## Vale is report-only here

Nothing gates on Vale's exit code, and `engineering.md`'s convention for a report-only checker applies:
read the output, not `$?`.

**The exit code is not a findings count.** Measured on vale 3.20.0:

- **0** when a `warning`-severity rule matched
- **1** when an `error`-severity one did
- **2** when a file failed to parse, or the config failed to load

Every rule `.vale.ini` enables is `warning`. So the live config never exits nonzero on a finding, and
anything that gates has to read `--output=JSON` rather than `$?`.

**A config error exits 2, writes to stderr, and leaves stdout empty**, so a `grep -c` pipeline over
stdout counts zero. Do not take the number from Vale's own closing line either: it says the run stopped
"with code 1" while the process exits 2.

## Eleven ways a run reports a confident zero

Check each before you believe one.

1. **The rule's level is below `MinAlertLevel`.** `MinAlertLevel` is `warning`, and a rule shipped at
   `suggestion` reports nothing at all until you re-level it in `.vale.ini`. `STE.ProcedureLength` is
   the live example.
2. **A file failed to parse and aborted the run.** Vale parses YAML front matter with a real YAML
   parser, and one unparseable file aborts the whole invocation rather than skipping that file.
3. **Vale is not installed, or `.vale/` is absent.** See Setup.
4. **The file matches no section glob in `.vale.ini`.** Vale applies no style, reports 0 and exits 0.
   Keep every scratch copy at an in-scope path.
5. **Vale read a mistyped path as stdin.** The tell is **in stdin** where a file count belongs. Name a
   path list in every verification.
6. **An `occurrence` rule counted nothing.** It never fires at `max: 0`, so "at most zero" is not
   expressible. And under `scope: text.comment.block.<ext>` a whitespace token counts zero while
   `[\w]+` counts every word, so a rendered-**line** budget is not expressible either.
7. **`vale test` skipped a rule file that carries no `tests:` key**, and reported the skipped file as
   passing. That is the missing-fixture hazard `npm run ast-grep:rules` catches, in a checker that has
   none.
8. **A malformed section glob matched nothing, silently.** A header of `[*.{ts]` reports 0 findings and
   exits 0, with no diagnostic — number 4 reached through a typo in `.vale.ini` rather than through a
   file's path. Brace expansion is real, and an unmatched glob applies no style rather than falling
   back to everything.
9. **`.vale.ini` carries no `[formats]` mapping for the extension.** **The worst-shaped entry here**,
   because the run still reports findings and so does not look silent. Without the mapping, every
   scope-based rule is inert while a comment-scoped `existence` rule still fires.
10. **A re-levelling line in `.vale.ini` misspells its rule.** `STE.ProcedureLenght = warning` enables
    nothing and disables nothing, reports no diagnostic, and exits 0. The rule stays at its shipped
    level, below `MinAlertLevel`, so this is number 1 reached through a typo.
11. **A rule's own `scope:` selector does not exist.** An invalid selector is not an error: there is no
    `text.comment.documentation.ts` scope, and a rule carrying it reports nothing, with no diagnostic
    and exit 0. Number 8's twin, reached through the rule file rather than through the section
    header.

<!-- reference-check: allow text.comment.documentation.ts -- a Vale scope selector that does not exist, named here as the measured example; not a path -->

**One more way is not a zero at all, and no rule catches it.** Moving a block out strands the words
that pointed at it. "The split is clean" survives the table it described, and "the bullet below"
survives the bullets. Each stays grammatical, passes every mechanical rule, and now points at nothing.

**After removing a block, re-read the sentences that survived around it** and check every "the",
"that", "those" and "it" still has its referent. This is the one part of a lint pass a tool cannot do
for you.

## How a pass damages the file it cleans

A lint pass is an edit, and its defects are not random. Seven shapes, none of them caught by a checker.

**1. What a split drops is disproportionately an obligation.** Four shapes, each one a plausible
shortening:

- a dropped consequence clause
- a measurement stripped of what its number answers
- a "check that…" demoted to an assertion
- an action that evidence licensed

**The direction is not uniform, so do not screen for losses alone.** A split adds an obligation as
readily as it drops one — a plain enumeration becomes "in this order", asserting a sequence nobody
argued.

**2. So diff the tokens, not your memory.** Take a full tokenize-and-frequency diff against the
pre-edit copy. **Diff the pair rather than the file** whenever the pass moved content to a sidecar,
since a file-only diff reads every move as a loss. Account for every non-zero delta
as a split, a move, a deliberate edit, or a defect.

A fixed word list is the fallback for a file too large to diff whole. Such a list must include the
causal connectives `because`, `since` and `so`. A lost causal link reads as two adjacent facts, and no
obligation word moves.

**3. That diff has one blind spot, and the check reads the defect as an improvement.** Splitting
`X and Y` into `X. Y.` turns a conjunct into a standalone claim, so the first sentence asserts a
sufficiency that was never true. Obligation words go **up**, not down, because the condition gained a
verb. Read every split of a sentence saying when something is finished, permitted or sufficient.

**4. Splitting a sentence also widens definitions.** Detaching a restrictive clause — a `because`, an
`only if` — leaves a definition covering cases the restriction excluded. The token diff cannot see this one
either, because the detached clause survives as an adjacent sentence. Read every definition whose
sentence you split.

**5. Check list structure, because `format:check` is green over a broken list.** Replacing a whole line
can dedent the continuations under it, which ends the list early and opens a fresh one at the next
numbered item. Prettier normalises the break as intentional, so the gate vouches for the break. Count
indented continuations and top-level list items before and after. Counting `^ *1\. ` restarts is not
enough on its own: a list that reopens at its next number leaves that count unmoved.

**6. A reference is not restored until you confirm its anchor exists.** A token check verifies tokens,
not referents. A citation survives a pass that removes the label it points at, and the citation token
shows no delta at all. `npm run reference-check` does not close this gap for doc prose: its citation
matcher stops at a backtick, so the backticked form this repo writes never reaches it.

**7. A pass introduces findings as well as clearing them.** Splitting a sentence multiplies be-verb
sites, and two extra words push a bullet past `ProcedureLength`'s 20-word proxy. Compare residual
counts to a pre-edit baseline and name what the pass added, rather than reporting a self-inflicted
finding as a survivor.

**Measure the baseline before the first edit, on the pre-edit file, at an in-scope path.** A figure
recalled mid-pass reads low.

## The six enabled rules, and what to do with each

Five surface in a default run. `PassiveVoice` is the sixth, held at `suggestion` and so below
`MinAlertLevel`.

All five apply mechanically as of 2026-09-12, when the last two prompts were replaced by script
rules. The column below is what each one still asks of you, which is not the same question.

| rule                        | treat it as    | act on a finding?                       |
| --------------------------- | -------------- | --------------------------------------- |
| `STE.SentenceLength`        | mechanical     | yes — split the sentence                |
| `STE.ParagraphLength`       | mechanical     | yes — split the paragraph               |
| `STE.Contractions`          | mechanical     | yes, unless the text **names** the word |
| `Procedure.ProcedureLength` | mechanical     | yes — split the step                    |
| `Procedure.OneInstruction`  | mechanical     | yes — one action per step               |
| `STE.PassiveVoice`          | off by default | see the standing instruction below      |

**A rule is mechanical when its trigger _is_ the defect, and a prompt when it fires on a proxy.**
Classify a new rule that way rather than by whether it counts something. **A prompt is often a rule
looking at the wrong thing rather than an unmechanisable one.** `prose.meta.md` carries the worked
case: reading the list marker instead of the word count turned the last two prompts mechanical.

### Mechanical does not mean sweepable

**Bulk reading is not triage, and the finding count cannot tell you which you did.** Both look
identical afterwards: a number.

**"Mechanical" means no judgement per finding. It does not mean sweepable in one pass.** Two things
survive the 2026-09-12 change that made every rule in a default run mechanical:

- **`Contractions` keeps a per-finding judgement**, and it is the one rule where a sweep does damage.
  `that's` expands to _that is_ or _that has_ by context. See its own section below.
- **`SentenceLength` and `ParagraphLength` interact**, so a batch application needs the order and the
  re-run described below.

So when you report a file as linted, say which half you did. "Zero on the mechanical rules" is a
different claim from "I read every finding".

**Read each finding that has an exempt class against that class, and record the disposition.** Name
the count in each class and name any finding you left in as arguable. A residual you cannot place is
not exempt by default.

**A rule with exempt classes is not noise.** A finding-by-finding pass over one article's findings
turned up two real defects that a bulk read of the same list had missed.

### `STE.SentenceLength` — act on every finding

25-word cap on a sentence. Split it. This is the one rule here a sweep can follow without judgement.

### `STE.ParagraphLength` — act on every finding

Six sentences per paragraph. Split it. Purely structural — it counts sentence terminators and consults
no part-of-speech tagger.

### `STE.Contractions` — act on every finding the text uses rather than names

Expand it. At the head of an instruction, "Do not" also carries more weight than "Don't". So this rule
tends to improve a heading rather than merely conform it.

**Exempt class 1, the use/mention distinction: a contraction that is quoted or discussed rather than
used.** A contraction inside quoted prose belongs to the file you are quoting, and expanding it
misquotes that file. A contraction named as an example — "'Do not' carries more weight than 'Don't'" —
is the subject of the sentence, not its voice.

**Quotation marks are not the test, and reading them as the test is how this class gets over-applied.**
A contraction inside invented internal speech is a use, so expand it. Ask whether the sentence quotes
another file or names the word itself. Nothing else earns the exemption.

**A quotation is exempt only while it stays faithful.** Re-read a quoted contraction whenever a slice
works the file it quotes, because linting that file expires the exemption and nothing reports it.

**An article about a rule will trip that rule, and this holds for every rule here.** A guidance article
quotes the defect it governs, so its findings are dominated by mentions rather than uses. **Expect that
shape when you lint guidance prose, and do not read a high count as a dirty file.**

**Exempt class 2 is a rule false positive rather than a judgement.** A **bare** possessive fires only
when punctuation follows it, because the rule's possessive token ends `(?!\s)`. So "the cleaner's,
architect's, and hardener's gates" yields two findings from three possessives. Nothing is wrong with
the prose; the comma is doing it.

**Backticking the noun suppresses the finding too, and that is a second, independent mechanism.** A
possessive on a backticked noun fires before no punctuation at all. Reading the rule's own regex cannot
tell you this, because the regex never sees what the Markdown scoper removed first.

**Never put `that's` through a mechanical sweep.** It expands to _that is_ or _that has_ by context,
and only the sentence tells you which. Expand this one by hand and read each site.

### `Procedure.ProcedureLength` — act on every finding

20-word cap on a **numbered** list item. A bullet is never flagged, however long: the marker is the
discriminator, and a numbered item is a procedure by definition. **Act on every finding** — state one
instruction per step and move the reasoning to prose below the list.

**Do not reopen the step-or-statement question.** A statement written as a bullet is silently
correct. `prose.meta.md` carries what the `STE` rule did instead and why
it was replaced.

**One exemption survives and it is real.** A numbered item inside a fenced code block is a worked
example, not an instruction. The rule skips fences, so you should not see one; if you do, that is a
defect in the rule rather than prose to fix.

### `Procedure.OneInstruction` — act on every finding

Fires on `, then` or `and then` **followed by an imperative verb**. That verb is the discriminator:
two verbs are two actions, and a shared verb is one instruction with an ordering inside it. **Act on
every finding** — give the second action its own sentence or its own numbered step.

**Three shapes the old `STE` rule flagged are now rejected by this one**, so do not go looking for
them in a report:

- **A specified order, not two actions.** "Settle SentenceLength first, then ParagraphLength" shares
  one verb. Not flagged.
- **A plain list.** "modules, then hooks, then components" has no verb after the connective. Not
  flagged.
- **A prohibition on concurrency.** "Do not run X and Y at the same time" — the old rule's advice
  would have **inverted** it by splitting one prohibition into two instructions. The token is no
  longer matched at all.

Both fixtures in `vale-styles/fixtures/` pin these: `OneInstruction.good.md` carries the list and
specified-order shapes verbatim, and reports nothing.

### `STE.PassiveVoice` — write in the active voice; the rule does not sweep

**Write instructions in the active voice. Name who acts.** That is the standing instruction, and it
binds at authoring time. "The between-position is sanctioned" is wrong; "Use the between-position
freely" is right.

**The test: if the sentence tells a reader what to do, say who does it. If it tells them how something
behaves, leave it.** Descriptive prose and dated records keep the passive — see the five exempt
classes below, which are what the instruction does _not_ reach.

**The rule is held at `suggestion` and does not appear in a default run.** Ruled by the user
2026-09-12. Measured that day: 490 findings, of which 9 were the act-on class — **1.8 percent**, and
**51 percent of every finding the whole corpus produced**. A rule nobody can clear teaches its readers
to skim, and that cost falls on every other rule in the same run.

**Reach it on demand.** It stays named in `.vale.ini` rather than disabled, so the question can still
be asked of a file you are about to land:

```bash
vale --minAlertLevel=suggestion .claude/agents/articles/<file>.md
```

Expect to exempt most of what comes back. Do not sweep the result, and do not treat a count from it as
a backlog.

**One construction accounts for every act-on finding so far, and it is greppable.** A permission stated
as `is sanctioned`, `is permitted` or `is allowed` names no one who may act. Rewrite it as `you may …`.
This is the cheaper check of the two, and unlike the rule it is nearly all signal:

```bash
grep -rn "is sanctioned\|is permitted\|is allowed" .claude/agents/articles/
```

That grep is a shortcut into the act-on class, not a replacement for the pass. It finds the
construction already seen; the pass is what finds the next one. **With the rule below `MinAlertLevel`,
nothing mechanical finds the next one at all** — the standing instruction above is what carries that
weight now.

**Five exempt classes — do not "fix" these:**

1. **A dated past-tense record.** "Four `@see` forms were measured and rejected."
   `claim-discipline.md` **requires** this construction as the escape hatch that stops a claim
   rotting, the actor sits in the sidecar by design, and the house rule wins.
2. **Descriptive prose where the actor is irrelevant**, as in "how it is computed". STE only _prefers_
   active in descriptive text and _requires_ it in procedures, so this class is not a defect by the
   standard's own terms.
3. **A predicate adjective the tagger read as a past participle.** "The between form is broken."
4. **A passive that already names its agent.** "Staleness is not bounded _by your own session's edits_"
   is reported with the message "name the agent", which the sentence does.
5. **A deliberate aphorism, usually a heading.** "Writing is verified by reading."

**A residual that fits none of the five is not automatically exempt.** Either act on it, or say in the
commit why you did not. Do not widen a class to cover it.

**A verbatim quotation creates a finding that belongs to another file, and it is easy to create one by
accident.** Splitting a long sentence can isolate a quoted section title, or a quoted line from
another file. The matcher then reads it as your own prose. Check whether a new `PassiveVoice` finding sits
inside quotation marks before triaging it as yours.

## `SentenceLength` and `ParagraphLength` trade against each other

Both are mechanical, so act on every finding of either. Acting on one can create the other, and the
trade runs in a predictable direction:

- **Splitting a sentence adds a sentence to its paragraph**, which can push the paragraph past six.
- **Merging sentences to clear a paragraph re-creates the long sentence** you just split.

**Resolve it by splitting the paragraph, never by rejoining the sentences.** A paragraph that has grown
past six sentences is usually two paragraphs that were never separated. So the break is almost always
the better edit anyway. Rejoining sentences trades a real improvement for a formatting number.

**So there is an order.** Settle `SentenceLength` first, then `ParagraphLength`, and treat a paragraph
break or moving content out as the only legal moves for the second. Moving content out is the section
below.

**And re-run after acting.** One pass is not enough, because a fix can create a finding the same pass
already scanned past.

## Instruction stays. Explanation moves.

**An instruction file carries instructions. Its `.meta.md` sidecar carries the explanation.** That
governs every article, every role file and every module sidecar, not only the file you reached it
from. Apply it whenever acting on a finding makes you shorten something, because every mechanical rule
here is satisfied by moving something out.

### What an instruction file may not carry

Ruled 2026-09-11 while the five role files were stripped. Each is a shape to remove on sight, not a
judgement call:

- **A pointer to its own `.meta.md` sidecar.** A role never changes its own file, and an article's
  reader is following a rule rather than changing it. Only a module sidecar keeps its `@see` pointer,
  because that reader is changing the module.
- **A fact about another role's file** — whose a duty is, how they do it, or what their threshold is.
  Saying _what is not yours_ is a routing fact the role needs and stays. The rest is a second copy
  nothing compares. The property-test ownership error survived in three files this way.
- **A restatement of a section it cites.** Say what to do and where to read. A summary beside a pointer
  drifts from its source and tempts the reader to skip the source that would have corrected it.
- **The execution order.** `CLAUDE.md` is the source of truth for the cycle, and a role never chooses
  what runs next. A `description:` states the precondition that makes this agent the right one, never
  its position in a sequence.

**Prefer nested bullets to a packed sentence.** One instruction per line, under a bolded lead. That is
a review call — `Instruction.ListItemSentences` counts sentences and cannot see a bullet carrying three
instructions in one, which is measured and recorded in
`ideas/todo/role-files-carry-exposition-that-belongs-elsewhere.md`.

**Audit the destination after compressing.** Routing is only routing if the claim arrived. Grep the
destination with newlines collapsed — `tr '\n' ' ' < <file> | grep` — because prettier wraps prose and
a line-anchored grep returns false negatives.

**Sentence by sentence, ask what the sentence does to the reader's next action.** There are three
dispositions, and only one is a deletion:

- **It says what to do, what not to do, when, or under what precondition** → **instruction.** It stays.
- **It says why the rule is shaped that way, and the reader's next action is the same either way** →
  **explanation.** Move it to the `.meta.md` sidecar.
- **It restates something said better nearby** → **delete it.** This is the only legitimate deletion,
  and it is rarer than it feels mid-edit.

**Explanation is explanation whatever shape the sentence takes.** How a rule was found, what was
measured to establish it, which slice tripped over it, and what was tried and rejected all move. So
does the account of a correction. They move however short they are, even where the rule reads as
arbitrary without them, because a reader who wants the why has the pointer.

**Four exempt classes. Each one reads as explanation and is instruction, so keep it:**

1. **A trigger, a precondition or a failure mode.** "Without `.vale/` a run reports zero rather than an
   error" tells a reader to check something before believing a result. **A rule with no stated
   exemptions is a worse instruction, not a purer one**, so a rule's own exempt classes are part of the
   rule.
2. **A caveat, an unmeasured warning, or a closed decision.** Each constrains, by telling a reader not
   to reopen something or not to trust something. Keep the decision and move the argument that reached
   it.
3. **A named wrong answer, where naming it is the prohibition.** "Splitting the sentence in place is the
   wrong fix that still clears the finding" is a rule wearing a story.
4. **A dated past-tense record that a live claim rests on.** `claim-discipline.md`
   requires that construction so a present-tense claim cannot rot, and moving it strands an undated
   claim.

**The cut is instruction against explanation, never long against short.** A long instruction stays, and
a one-line discovery note moves. The same rule the other way round: **a passage that constrains
conduct never moves, whatever its size.** A passage that only says why a rule is shaped as it is never
stays.

**Kind decides before mass.** Evidence is a measurement, a probe method, a rejected alternative, or a
correction carrying a figure. Settle kind first by the three dispositions above, then apply a floor:
**below roughly 1 KB of genuine evidence, decline the sidecar.** A smaller one holds less than its own
framing, which measures 1.0–1.4 KB; `CLAUDE.meta.md` carries the census of which files cleared that
floor.

**A sidecar carries no read trigger, and that is the point.** It is read when a rule is being changed,
never in order to follow one. So an instruction that a reader needs in order to act can never live
there, however evidential it looks.

**The module tier takes the same cut, under different filenames.** `<module>.md` is the instruction
half, `<module>.meta.md` the explanation half. CLAUDE.md's routing branch 4 says who each is for, and
everything above applies to that pair unchanged.

**Which article a subject belongs to, and where a sidecar file physically sits, are CLAUDE.md's
questions** — routing branches 1 to 6. Settle those first. This rule applies once the pair exists, and
says only what may sit on each side of it.

**Nothing checks the pair.** `reference-check` and `agent-doc-check` stay green while an article and
its sidecar drift, because every filename resolves and no checker reads for absent prose. So audit the
pair by hand after a shortening pass. **The failure mode is dropping an illustration entirely** rather
than moving it across.

## The `Instruction` style — the regrowth guard on stripped role files

**The rules above cannot see the defect this style exists for.** `STE.ParagraphLength` treats a
Markdown list item as no paragraph at all, so a many-sentence numbered step reports zero. Role files
keep their instructions in lists, exactly where exposition accumulates. The three rules in the
tracked `vale-styles/Instruction/` style close that hole, mechanising the split this article states
under "Instruction stays".

**Both are proxies, and they cover each other's blind spot.** A green run is **not** evidence a file
is instruction-only; it is evidence the file has not regrown the two shapes that were measured. Each
rule's own header carries its measurements.

### `Instruction.ListItemSentences` — act on every finding

A list item gets three sentences: an instruction, its precondition, and its failure mode. A fourth
sentence is where the account of the rule starts. Route the account to the role file's
`.meta.md` sidecar per the split above — do not split the item in place to clear the count.

**What it misses:** exposition that is short. Three tight sentences of history pass this rule.

### `Instruction.ParagraphSentences` — act on every finding

The plain-paragraph counterpart, at four sentences rather than `STE.ParagraphLength`'s six. The
extra sentence over the list rule is for the intro shape. Identity, mandate, the house-rules read
trigger, and the sidecar pointer are four instruction sentences in one paragraph. The remedy is the
same routing, never a split in place.

### `Instruction.HistoricalNarration` — act unless the match is a live condition

Fires on past-reference vocabulary (`used to`, `no longer`, `previously`, `turned out`) that marks
narration about this repo's own history. State the current rule in the file; the account of how it
changed goes to the sidecar. **One exempt class:** `no longer` inside a live conditional — "when the
assumptions `no longer` hold" — is a present-tense rule, not narration. Leave it, and name it in the
handoff as arguable. **What it misses:** narration that avoids these markers; it deliberately
does not match `because` or `since`, which carry the one-clause why that stays.

### Scope: the role files and `architect/`'s mode files

The style is enabled on `.vale.ini`'s `[.claude/agents/**/*.md]` glob. Vale's `*` crosses `/`, so that
reaches the articles and the sidecars too; both are switched off by name below it.

The articles are off because they carry a backlog nobody has triaged, and the landing constraint below
forbids shipping that. `.vale.ini` records the measured count beside the opt-out, and
`ideas/candidates/the-articles-carry-an-untriaged-instruction-backlog.md` is where the question of
whether these rules bind an article at all is filed.

## Read a big number as unworked, not as broken

A file is worked when a slice edits it and lints it. Every other one carries its findings untriaged,
and most of the scoped corpus has never been worked. So a four-figure count over the whole directory
says nothing about the corpus, and nothing about the rules.

**Lint the file you are editing**, not the directory, until a rollout has been through the rest.

## Triaging a finding in a comment

Vale lints JSDoc blocks in `src/` and `scripts/`, and a finding there is **not** the same act as a
finding in an article.

**The remedy is often placement, not prose.** In an article an over-long sentence gets split; in a
JSDoc it may mean the content does not belong in the interface at all. `doc-comments.md` rule 4 sends
implementation detail to `//`, and rule 7 sends overflow to a `<module>.md` sidecar. **Splitting the
sentence in place is the wrong fix that still clears the finding**, so ask which before rewriting.

**What the `JsDoc` rules check, and the writing facts that follow from their scope, are in
`doc-comments.md` under "What Vale checks mechanically".** Read them there rather than here.

**A `@returns` is conventionally a noun phrase**, so a `PassiveVoice` finding on one may want an
exemption rather than a rewrite.

**Vale strips the comment markers before any rule sees the text.** `/**`, `*/` and every leading `*`
are gone, so a rule cannot tell `/**` from `/*`, and `scope: text.comment.block.<ext>` means
**multi-line**, not "documentation".

**Two `STE` rules reach a hover, and a tag line defeats both.** `ProcedureLength` and `OneInstruction`
are list-scoped, and a JSDoc can carry a Markdown list. A `@param` or `@returns` tag line is not a
Markdown list item, and trips neither whatever it says. So those two rules reach only the prose above
the tag block.

**Who owns the rules.** `architect` alone authors or changes a rule in `vale-styles/JsDoc/` or
`vale-styles/Instruction/`. Every other role reads the output and reports tensions to it, exactly as
with `rules/*.yml`. **The `STE` style is a different surface and is not `architect`'s alone.** That
covers the module sidecars. No `JsDoc` rule reaches a `.md` file, so a sidecar finding is an `STE`
finding or, on a stripped role file, an `Instruction` one.

## What is scoped, and what is not

Vale runs over `.claude/agents/**/*.md` — every topic article, the house-rules articles, and the five
role files — over `CLAUDE.md`, and over `src/**/*.md`, the module sidecars beside the source. Those
three surfaces get the `STE` style. **Lint a module sidecar exactly like an article**, because whoever
holds a call site reads it to act. `<module>.md` is in scope and `<module>.meta.md` is exempt.
A role file that has been stripped to instruction additionally gets the `Instruction` style, per its
own section above.

**It runs over every `.ts` and `.tsx` file in the tree as well, under a different style.**
`[*.{ts,tsx}]` enables `JsDoc`, the tracked style in `vale-styles/JsDoc/`. Each of its rules carries
both block-comment scopes as a **list**, which Vale reads as OR. So it reaches block comments in
modules and components alike.

<!-- reference-check: allow text.comment.block.ts -- a Vale scope selector, not a path; the trailing
     segment is the extension the scope binds to -->

**A scope selector is strictly per extension, and that is the trap.** `text.comment.block.ts` never
reaches a `.tsx` file. A rule carrying only the `.ts` scope is handed every component and matches
nothing, which reports zero and reads exactly like a clean file. `[*.ts]` does not match a `.tsx` file
either — the suffix has to be named, hence the brace glob.

**`block` scope also under-reaches, and that half is easy to miss.** It never sees a single-line
`/** … */`, so the same sentence a three-line hover polices, a one-line hover does not. **Prefer the
multi-line form for anything a rule should see**, and do not read this as a reason to widen a scope. A
`line` scope would reach every `//` comment too, which is a design change nobody has taken.

**Quote any front-matter scalar that contains a colon followed by a space.** An unquoted one makes the
file unparseable, and **one unparseable file silences every other file in the same invocation**. That
is number 2 above, reported as a confident zero rather than as an error you notice.

**Quote it the way Prettier will leave it, which here means single quotes.** This repo sets
`singleQuote: true`, and Prettier normalises a YAML scalar to single quotes in both standalone YAML and
Markdown front matter. A scalar containing an apostrophe is the exception and keeps double quotes.

**A `tokens:` entry in a rule file is single-quoted for a second, unrelated reason.** A YAML
double-quoted scalar processes `\b` as a backspace escape, so `"\bword\b"` is not the regex it looks
like, and Prettier leaves such a scalar alone.

**`*.meta.md` sidecars are exempt from every rule, and the exemption is two things.** The last
section of `.vale.ini` sets `BasedOnStyles` to an empty value **and** switches each enabled rule off by
name. An empty `BasedOnStyles` is not enough on its own. An explicit `STE.Rule = warning` in any
earlier matching section **activates that rule by itself**, and survives into the later one.
`BasedOnStyles` replaces the style list rather than the per-rule keys.

It leaks in the direction that looks fine: the sidecars get linted and nothing says so.

**Write that exemption as an empty `BasedOnStyles`, never as `= Vale`.** The `Vale` style is not "no
style": it enables `Vale.Spelling` and `Vale.Repetition` at **error** severity, on exactly the
technical prose a sidecar holds.

**Three sections exempt paths that only look like source**: `vale-styles/fixtures/*` (deliberate bait),
`.claude/worktrees/*` and `.stryker-tmp*/*` (other checkouts, which a bare `vale .` walks into). They
sit below `[*.{ts,tsx}]`, because sections stack and the later one takes the key. Vale has no ignore
mechanism other than a later section.

## For `architect` only — authoring, enabling and re-levelling a rule

`architect` is the only role that authors or changes a rule in `vale-styles/JsDoc/` or
`vale-styles/Instruction/`, or edits `.vale.ini`. Everything above applies to whoever holds a
finding; everything here applies to whoever holds the rule.

### Each rule declares its own extensions. That is per rule, never per style.

**A blanket "every rule carries both scopes" is the shape this ruling rejects.** The question a new rule
answers is one question:

> Does this rule assume the block comment is an interface doc?

A rule that assumes it is a rule whose finding can **invert** on a comment that is not one. Vale's scope
cannot ask that question for you: `block` means multi-line, and no selector separates a JSDoc hover from
a JSX `{/* … */}` block or a plain `/* … */`. So the rule's author answers it, and **records the answer
in the rule's own header.**

**Carrying the premise is not on its own a reason to drop an extension.** The discriminator is measured
noise that no remedy can clear without moving correctly-placed prose. A premise-carrying rule with no
such finding keeps the extension, because the coverage then costs nothing.

**`.tsx` carries one comment shape `.ts` does not** — the JSX `{/* … */}` block inside a component body.
It is in scope, it is prose a reader writes loosely, and it is the shape a premise-carrying rule inverts
on. Pin both halves of it in the `.tsx` fixture pair.

**A rule owes a fixture pair for every extension it claims**, `.bad.<ext>` and `.good.<ext>`. Nothing
checks this. The first pair proves the rule discriminates; the second proves the second scope is live at
all. A rule claiming an extension with no pair there is untested, and it fails silent.

**Run the fixtures with one command, and it needs no `.vale/`:**

```bash
vale --config=vale-styles/fixtures/fixtures.vale.ini vale-styles/fixtures
```

Contract: the bad fixture reports at least one finding, of exactly its own rule and nothing else. The
good fixture reports nothing.

**Check the silent half too.** A good fixture is evidence only if it fires under the wrong rule. Loosen
the matcher in a scratch copy of the style, and confirm the fixture reports. A near-miss that the
shipped rule and the loosened one both ignore pins nothing.

### Where a rule has to be edited, and nothing checks the counts

**Enabling an `STE` rule is a seven-place edit**, and glob overlap is the reason. `.vale.ini` carries
the six-rule enable block three times: the agent-docs glob, `[CLAUDE.md]`, and `[src/**/*.md]`. No
section's per-rule key reaches a file that section's own glob does not match.

Four later sections overlap those globs, and must each switch the rule off once by name. They are the
`*.meta.md` exemption, plus the three that keep bait and other checkouts out of a `vale .` walk.

**Adding a `JsDoc` rule is a five-place edit.** `[*.{ts,tsx}]` enables it. The three exemption sections
below that one switch it off by name. And `doc-comments.md`'s "What Vale checks mechanically" table
gains a row. `[**/*.meta.md]` is not one of them, because `[*.{ts,tsx}]` cannot match a `.md`
file.

**Two of the places in each count are article prose, and `architect` does not edit them.** The
`doc-comments.md` row and this article's own rule section are the orchestrating session's edits.
`architect` authors the rule and its fixture pair, then reports the doc change at handoff. See
CLAUDE.md's Conventions.

**Adding an `Instruction` rule is a seven-place edit.** One enabling key in the
`[.claude/agents/**/*.md]` section. Five off-by-name entries: the three bait sections,
`[**/*.meta.md]`, and `[.claude/agents/articles/**]`. The fixture pair, and this article's own
rule section above.

The scope section above says where each of those keys lives.

**Whenever you enable a rule, switch it off in the sidecar section in the same edit.** That pairing is
the whole exemption. The test is one command: `vale` on any `*.meta.md` must report zero.

**Every rule carries its own `scope:` in its own rule file, never from `.vale.ini`.** The
`Rule[param] = value` form works; do not use it. `RuleToParams` is global rather than per-section, so a
scope written inside one section silently changes that rule everywhere that rule is on.

**Vale's `*` crosses `/`**, which is ast-grep's behaviour rather than `globSync`'s — the asymmetry
CLAUDE.md documents under `ast-grep-rule-check`. A glob written on the `globSync` intuition **fails
open**: it silently lints files nobody scoped it to. `.vale.ini` writes the `**` form anyway, because it
reads correctly to someone carrying that narrower intuition.

### Enabling, disabling or re-levelling a rule

**Disable by name, never by omission.** Every rule the style ships is listed in `.vale.ini` with an
explicit value. Adding a rule to the package is then a deliberate edit here, rather than a silent
change in what gates.

**No landed state may leave a hand-run reporting a backlog nobody has triaged.** That is the constraint
a new rule has to clear. It binds harder than precision does: a rule with excellent precision can
still land 200 findings. Every later run is then unreadable, because nobody can tell its output from a
regression. So treat a rule and the remediation of what it finds as **one** piece of work.

A rule whose findings the slice cannot clear waits for a slice that can. Deferring such a rule is the
right disposition; landing it and leaving the findings is not.

**A rule earns its place by a measured precision count on a real file, not by sounding useful.** Record
the count and the date in `prose.meta.md`.

**Treat a part-of-speech-driven rule as guilty until measured on this corpus.** Imperative-heavy
technical prose is outside the tagger's training data, and two such rules say so in their own headers.

**Never enable `STE.Dictionary`.** It is not ASD-STE100's approved-word list, which is copyrighted and
which no open tool ships. It substitutes plain-language advice, which fights this corpus's necessary
jargon.

**Do not tune a rule until it stops producing arguable findings.** A rule with no arguable cases has been
tuned until it agrees with its author, which makes it a mirror rather than a check.

**Six of the style's twelve rules are off**, each on a recorded reason rather than by omission:
`Dictionary`, `Modals`, `Ambiguity`, `NounClusters`, `Articles` and `Gerunds`. `prose.meta.md`
carries the reason for each, and the `Slop` style's sixteen rules are off untried. Read a reason there
before re-proposing one.
