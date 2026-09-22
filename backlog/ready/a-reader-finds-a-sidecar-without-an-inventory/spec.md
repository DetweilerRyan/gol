# Spec: a-reader-finds-a-sidecar-without-an-inventory

Written by `coach`, SPEC mode, 2026-09-21. Measured on the slice worktree at `e6899c9`.

Rulings A–J in `proposal.md` are the user's and bind. This file rules the six open questions
under them, and names every edit file by file. `writer` executes it after the user signs off.

## What was re-derived, and where the proposal's figures move

`CLAUDE.md` is byte-identical between `de8fbd6` (the proposal's measurement tree) and `e6899c9`,
so every difference below is a counting difference rather than a tree difference.

| Fact                                  | Proposal      | Re-derived at `e6899c9`                                             |
| ------------------------------------- | ------------- | ------------------------------------------------------------------- |
| Named sidecar mentions in `CLAUDE.md` | 30            | **32 tokens**, across **13 distinct basenames**                     |
| `CLAUDE.meta.md` self-citations       | 11            | **11** — confirmed                                                  |
| Generic placeholders                  | 10            | **10 places, 11 tokens** — the extra is a second token on one line  |
| Tracked sidecars                      | 24            | **24** — confirmed                                                  |
| Displaced sidecars                    | 6             | **6** — the five role sidecars plus `CLAUDE.meta.md`; 18 sit beside |
| Roster repaired, then re-broken       | 11:14 / 15:20 | **Confirmed** — `1b1f3e9` then `2f1aca3`, both 2026-09-21           |
| `board-shape` named in `CLAUDE.md`    | never         | **Confirmed** — zero occurrences                                    |

The named-mention count reconciles as 32 tokens at 30 places: two lines carry two tokens each.
The placeholder count reconciles as 11 tokens at 10 places, which is the proposal's figure.
Neither figure changes any ruling. **Do not carry either number into the corpus** — it is a census
of a file this slice rewrites.

**Three premises the rulings rest on were checked and hold.**

1. **`mutation-testing.md` already carries the C4 fact ruling E relies on.** Its
   "The mutation-invariant merge allowlist is structurally safe" section states that every entry's
   argument lives in the sidecar, bound to the config by the checker's own C4. Its own sidecar
   adds the failure reading: adding an entry without an argument reds the gate. **So nothing has
   to move, and `mutation-testing.md` leaves this slice's reach with zero edits.** That is a
   confirmation of ruling E's premise, not a departure from it.
2. **Every article that has a sidecar points at it from its own header**, so deleting
   `CLAUDE.md`'s per-article sidecar sentences strands nothing. Eight of the nine carry a header
   blockquote; `engineering.md` cites its sidecar four times in body instead.
3. **No role file names a sidecar at all.** Measured across all eight files in `.claude/agents/`:
   zero occurrences of `meta.md`. The section's read-trigger sentence is therefore true as
   written.

**One claim in the passages being deleted has already rotted, and the deletion fixes it.**
Branch 5's `CLAUDE.md`-placement paragraph says `reference-check` and `agent-doc-check` both scan
`CLAUDE.md`, `README.md` and `.claude/**/*.md`, "and neither reaches a third root-level `.md`".
`reference-check`'s surface has since widened to every tracked `.md` outside `backlog/**` and
`.claude/worktrees/`, so it **does** reach a root-level file today; `agent-doc-check`'s
`.claude/**/*.md` glob plus an exact-name read of `CLAUDE.md` still does not. `CLAUDE.meta.md`
already carries the dated correction. Deleting the paragraph removes the stale half and keeps the
corrected one.

## The six open questions, ruled

### 1. Do routing branches 2, 4 and 5 move into the new section, or become pointers into it?

**Neither. The cut runs inside each branch, not between the branches and the section.**

Each of those branches does two jobs. It answers a **routing question** — where does this prose
go — and it separately **restates the sidecar convention**: what a sidecar is called, where it
sits, what checks reach it. The routing answer is what the ordered test owes a reader walking it.
The convention is what ruling J asks to colocate.

So: **every branch keeps a complete answer to its own question, in its own numbered slot, and
loses only the convention it restates.** The section is the single home for naming, placement,
the mechanical facts and the citation form.

Three reasons, in order of weight.

- **Fifteen live citations in the corpus name these branches by number.** `prose.md` four times,
  `CLAUDE.meta.md` five, `doc-comments.md` twice, plus `engineering.md`, `ast-grep-rules.meta.md`,
  `prose.meta.md` and `state-flow.meta.md`. Emptying a branch strands every one of them, and the
  No-go bars the sweep that would repair them. Under this cut all but one survive unchanged.
- **It is the cut the corpus already made once.** `CLAUDE.meta.md` records the 2026-09-10 ruling:
  a branch stays when it answers **which file**, and goes when it answers **which half of a pair**.
  The register half of branch 4 went to `prose.md` on exactly that test. Naming and placement are
  a third question again — which _location_ — and that is what the section takes.
- **It keeps the test hole-free.** A reader who walks branches 1 to 6 and never opens the section
  still routes their paragraph correctly. They learn the filename and the placement one screen
  earlier, where the section sits.

### 2. Does the routing tie-break survive being moved?

**It is not moved, so the question does not arise — and that is a consequence of ruling 1, not a
dodge.** The tie-break answers a subject question ("is this passage about `scrollbars.ts` or about
`architecture.md`'s rule?"), which the 2026-09-10 ruling already tested and kept in the branch.
Its closing clause — "settled here rather than in `prose.md`" — keeps its referent and needs no
re-derivation. It loses its named precedent per ruling G and its placeholder per ruling J, and
nothing else.

### 3. Does the Conventions bullet move?

**The bullet stays. Its placeholder token drops.** Branch 3's exception placed it on the
auto-loaded surface because it binds at authoring time, and ruling J asks for the placeholder to
colocate rather than for the bullet to move. Rewriting "to the file's `.meta.md` sidecar" as "to
the file's sidecar" satisfies both at one token. The bullet already routes the split to
`prose.md`, so it loses no reader.

### 4. Where does the section sit, relative to the routing test?

**In the index's own slot: immediately before the "Where new documentation goes" paragraph, at
the end of the Documentation map.** A reader walking the test has then already read it, so branch
4 carries no forward reference. Front-loading costs little, because the section is a rule rather
than a roster.

**It takes the index's shape, not a new `###` heading.** The Documentation map uses bolded lead
paragraphs for its blocks, and a `###` heading inserted there would capture the routing test
underneath it. The bolded lead is what this file means by a section.

### 5. Where does ruling B's argument live once ruling H deletes the proposal?

**The argument dies, per ruling H. The prohibition survives, in `CLAUDE.md`.**

Ruling H declines to record the decline, so no file gets the asymmetry argument back. What stops
the next reader re-proposing the checker is not the argument but the ruling, and a closed decision
is **instruction** rather than explanation — `prose.md` names it as exempt class 2 under
"Instruction stays. Explanation moves.", precisely because it tells a reader not to reopen
something. So the section closes with a one-sentence prohibition, dated, with the one-clause why
that `CLAUDE.md`'s own Conventions bullet allows.

That is not a rewrite of the deleted paragraph. The deleted paragraph proposed a checker; this
sentence forbids one.

### 6. Does the corpus-wide residue get its own candidate?

**Yes, and it is a recommendation rather than an edit.** This spec names no work outside the four
files. Two shapes found while measuring belong to that candidate and are listed under
"Cross-pipeline recommendations" below: the eight articles' own sidecar pointers, and the
reference tier's unnamed "Its sidecar carries…" clauses that this slice deliberately leaves.

## The shape, in one paragraph

`CLAUDE.md` loses its sidecar index, every sentence naming a sidecar file, and every generic
placeholder outside one place. It gains one bolded-lead section stating the convention as a rule.
The routing branches keep their numbers and their destination answers. `CLAUDE.meta.md` loses its
stale index sentence and gains the two mechanism details that leave `CLAUDE.md`. `doc-comments.md`
loses its copy of the module roster and genericises its syntax example. `mutation-testing.md` is
untouched.

---

## Item 1 — `CLAUDE.md`: the sidecar section replaces the index

**Anchor.** The block beginning `**Which files have a sidecar today, and nothing checks this
list.**` and ending with the bullet beginning `- **Module sidecars are a different tier**`. That
is the lead paragraph plus its eight bullets.

**Delete the lead paragraph and seven of the eight bullets.** The eighth — the bullet beginning
`- **A role may also hold mode files in its own subdirectory**` — is about mode files rather than
sidecars and **must survive**. Promote it to a standalone bolded paragraph in the same position,
by removing its `- ` list marker and changing nothing else in it.

**Insert this text in place of the deleted block**, above the surviving mode-files paragraph:

> **Sidecars, and where one sits.** Any instruction file in this repo may take a sidecar. Name it
> `<name>.meta.md`, and put it beside the file it belongs to. A file owes one once it has
> explanation to displace, and not before. A file whose evidence sits in another file's sidecar
> says so in its own header.
>
> **What fills a sidecar is `.claude/agents/articles/prose.md`'s question**, under "Instruction
> stays. Explanation moves." No line here answers that one.
>
> **Two classes sit in `.claude/agents/articles/` instead, and the reason differs.** A role file's
> sidecar is forced there: `scripts/agent-doc-check` reads the direct `.md` children of
> `.claude/agents/` as the agent roster, and a prose file there fails the frontmatter check. This
> file keeps its own sidecar there by choice, so that both doc checkers reach it.
>
> **The mechanics are the same for every `*.meta.md`.** Vale lints the instruction half and exempts
> the sidecar. `npm run reference-check` resolves a citation of one by basename, and checks no
> relative path in front of the name. Nothing checks a sidecar's contents.
>
> **No role file names a sidecar as a read trigger.** Read one when you are changing the rule it
> stands behind, never in order to follow one.
>
> **A module's pair splits by audience.** `<module>.md` is for whoever is _calling_ the module, and
> `<module>.meta.md` for whoever is _changing_ it. Cite it from the JSDoc as
> `@see {@link ./<module>.meta.md}`.
>
> **A checker over this rule is a closed decision, ruled 2026-09-21.** The set of sidecars is
> derivable from the tree, so a gate would protect a hand-written copy of it. Do not re-propose
> one, and do not add a list of instances here.

**The wording is load-bearing and was probed.** Seven paragraphs, measured at an in-scope path:
zero findings at the default level, and one `STE.PassiveVoice` suggestion on "is forced there",
which is exempt class 4 — the sentence names its agent. The probe was confirmed to discriminate.
Re-splitting a sentence here can re-create the `ParagraphLength` finding the first draft carried,
so re-probe rather than edit by eye.

**What each deleted bullet's durable half becomes.**

| Deleted bullet       | Durable half                                      | Where it lands                       |
| -------------------- | ------------------------------------------------- | ------------------------------------ |
| Articles that have   | naming, beside-ness                               | section, paragraph 1                 |
| Articles that do not | a shared sidecar is announced by its own file     | section, paragraph 1, final sentence |
| Role files           | the `agent-doc-check` roster forces the placement | section, paragraph 3                 |
| Reference pairs      | beside, since no glob forces otherwise            | section, paragraph 1                 |
| Skill files          | `reference-check` resolves by basename            | section, paragraph 4                 |
| `CLAUDE.md` has one  | this file's sidecar sits in `articles/` by choice | section, paragraph 3                 |
| Module sidecars      | the tier exists, under branch 4                   | branch 4, unchanged                  |

The fourth row is the one that repays checking. The skills bullet warned that `SKILL.meta.md` is
shared across the tier, so a citation of it resolves against any skill's sidecar. Paragraph 4's
basename sentence is the general form of that warning.

## Item 2 — `CLAUDE.md`: the Documentation map's named mentions

Each edit below deletes a sentence or a clause. **Change nothing else on the line.**

**2a. The file's own sidecar pointer.** Delete the whole paragraph beginning `**This file takes a
sidecar of its own**`. `prose.md` forbids an instruction file carrying a pointer to its own
sidecar, and the section's placement rule locates it.

**2b. `engineering.md`'s line.** Delete the sentence `Its evidence lives in the sidecar
`engineering.meta.md`, which no role reads.`

**2c. `claim-discipline.md`'s line.** Delete the sentence `Its evidence shares
`engineering.meta.md`.` **Verified non-loss:** `claim-discipline.md`'s own third paragraph says
its evidence lives in `engineering.meta.md` alongside the rules it was split from. The section's
final sentence in paragraph 1 is what tells a reader to expect that announcement.

**2d. `state-flow.md`'s line.** Delete the sentence beginning `Its sidecar `state-flow.meta.md`
carries` up to and including `and no role reads it.`

**2e. `testing-layers.md`'s line.** Delete the sentence beginning `Its sidecar
`testing-layers.meta.md` carries` up to and including `and no role reads it.`

**2f. `ast-grep-rules.md`'s line.** Replace

> Its sidecar `ast-grep-rules.meta.md` carries each rule's scope, what it matches and how it was verified. Read the article before authoring or narrowing a rule, and the sidecar when changing one.

with

> Read the article before authoring or narrowing a rule.

**Verified non-loss:** `ast-grep-rules.md`'s own header blockquote carries both the sidecar's
contents and the read trigger, in the same words — "Narrowing or widening a rule **is** changing
one, so that is when to open it."

**2g. `acceptance-mutation.md`'s line.** Delete the sentence beginning `Its sidecar
`acceptance-mutation.meta.md` carries` up to and including `and no role reads it.`

**2h. `doc-comments.md`'s line.** Replace `the paired `<module>.md`/`<module>.meta.md` sidecar
tier` with `the paired module-sidecar tier`.

**2i. `prose.md`'s line.** Replace `between every instruction file and its `.meta.md` sidecar`
with `between every instruction file and its sidecar`.

**2j. `quality-tooling.md`'s line.** Delete the sentence beginning `Its sidecar
`quality-tooling.meta.md` carries` up to and including `and no role reads it.`

**2k. The references tier paragraph.** Delete the sentence `The pair convention carries over
unchanged: `<name>.md`is the instruction half,`<name>.meta.md`the evidence half, and every`*.meta.md` exemption applies.` Leave `Four entries today:` and the four bullets alone.

**Explicitly out of scope, and `writer` must not touch them.** The four reference-tier bullets
each say "Its sidecar carries …" without naming a file. They name no instance and claim no
completeness, and a sweep of unnamed pointers is a No-go. They stay exactly as they are.

## Item 3 — `CLAUDE.md`: the routing test

**3a. Branch 1.** Delete the sentence `This clause once claimed that seat had no other instruction
surface; `CLAUDE.meta.md` carries the correction.` Branch 1's remaining text is unchanged, and
`CLAUDE.meta.md` keeps the correction record under its own heading.

**3b. Branch 2.** Replace `**or its `.meta.md` sidecar if it has one, which branch 5 decides.**`
with `**or its sidecar if it has one, which branch 5 decides.**` Keep the following sentence,
which is the branch-2-against-branch-5 precedence rule.

**3c. Branch 4, the numbered line.** Replace

> 4. Is it **depth about one module** that overflows a JSDoc hover? → a **pair of sidecars beside the source**, split by filename so the register is visible before a word is read. `<module>.md` is for whoever is _calling_ the module, and `<module>.meta.md` for whoever is _changing_ it. Which half a given sentence belongs in is a question for `prose.md`, not for this branch. Either may be absent, and usually one is. Reference from the JSDoc as `@see {@link ./useZoomGlide.meta.md}`.

with

> 4. Is it **depth about one module** that overflows a JSDoc hover? → a **pair of sidecars beside the source**, split by filename so the register is visible before a word is read. Which half a given sentence belongs in is a question for `prose.md`, not for this branch. Either may be absent, and usually one is. The sidecar section above names the pair and the citation form.

**3d. Branch 4's audience paragraph.** Keep unchanged: `This is the one documentation surface that
lives outside `.claude/**`. Its audience is whoever is holding a call site rather than whoever is
running a role.`

**3e. Branch 4's two `reference-check` paragraphs.** Delete both — the one beginning `**Note what
`npm run reference-check` actually reaches.**` and the one beginning `What the checker verifies is
that the _name_ resolves`. Their durable content is `doc-comments.md` rule 7's, which branch 4
already cites, plus the section's paragraph 4. **Their two slice records move to
`CLAUDE.meta.md`** — see item 6e. Do not delete those records.

**3f. Branch 4's Vale paragraph.** Replace

> Vale lints `<module>.md` and exempts `<module>.meta.md`, mirroring the article tier. See `.claude/agents/articles/doc-comments.md`, rule 7. The live instances are `src/cache.meta.md`, `src/hooks/useZoomGlide.meta.md` and `src/scrollbars.meta.md`.

with

> See `.claude/agents/articles/doc-comments.md`, rule 7, for what a hover may hand off to the pair.

**3g. Branch 5, the numbered line.** Replace

> 5. Is it **the evidence behind a rule in an article**, rather than the rule itself? → a sidecar `<article>.meta.md` **beside the article** (`doc-comments.meta.md` next to `doc-comments.md`).

with

> 5. Is it **the evidence behind a rule in an article**, rather than the rule itself? → that article's sidecar.

**3h. Branch 5's topic-and-register paragraphs.** Keep both unchanged — the one beginning `**These
branches route by topic, and explicitly not by register.**` and the one beginning `They do **not**
answer how prose is split`. `prose.md` cites them.

**3i. Branch 5's `archive.md` paragraph.** Keep unchanged.

**3j. Branch 5's two placement paragraphs.** Delete both — the one beginning `**A role file takes
the same pair, and its sidecar lives in `articles/` — that placement is forced, not preferred.**`
and the one beginning `**`CLAUDE.md`takes the same pair, and its sidecar lives in`articles/`
too**`. The rule survives as the section's paragraph 3. **One detail from the first must move**
rather than die — see item 6d.

**3k. Branch 5's tie-break paragraph.** Replace

> The rule stays in the article, and the worked case goes to `<module>.meta.md`. `src/scrollbars.meta.md` under `architecture.md`'s provenance rule is the live precedent.

with

> The rule stays in the article, and the worked case goes to that module's sidecar.

Leave the paragraph's opening and closing sentences byte-identical, including "settled here rather
than in `prose.md`".

**3l. Branch 5's pair-consistency paragraph.** Delete the paragraph beginning `**Keeping the pair
consistent is manual and nothing checks it.**` **Verified non-loss:** `prose.md`'s "Instruction
stays" section already states that nothing checks the pair and that the audit is by hand, and
`CLAUDE.meta.md` keeps the measured drift under its own heading.

## Item 4 — `CLAUDE.md`: the named mentions outside the Documentation map

Ruling F rules each of the eleven `CLAUDE.meta.md` self-citations per mention. Four die with the
passages that carry them (items 2a, 3a, 3j twice). The remaining seven are ruled here.

**The governing rule is one line of `prose.md`:** under "What an instruction file may not carry",
a pointer to its own `.meta.md` sidecar is a shape to remove on sight. That rule was widened on
2026-09-21 to govern every instruction file in this corpus, whatever tier it sits in. `CLAUDE.md`
is an instruction file, so it binds here.

| Mention                      | The claim the citation supports         | Does the claim survive?                                          | Ruling                    |
| ---------------------------- | --------------------------------------- | ---------------------------------------------------------------- | ------------------------- |
| branch 1's correction        | none — the clause is narration          | n/a                                                              | dies with the clause (3a) |
| `agent-doc-check` check 2    | the frontmatter reader is bespoke       | yes — the literal `": "` reason is stated in the same sentence   | drop the citation (4a)    |
| `agent-doc-check` check 3    | the generic scan was tried and rejected | yes — a closed decision, which is instruction                    | drop the citation (4b)    |
| `mutation-invariance` entry  | C4 binds each entry to its argument     | yes — `mutation-testing.md` states it                            | drop the sentence (4c)    |
| idea board, move-only commit | a move plus a rewrite loses history     | yes — stated in the two preceding sentences                      | drop the citation (4d)    |
| the write boundary           | the allowlist framing was dishonest     | yes — stated in the same sentence                                | drop the citation (4e)    |
| sentence-case roster         | the roster is a snapshot, not closed    | yes — "carried a false universal twice" is history, not a census | drop the citation (4f)    |

**4a.** In `agent-doc-check` check 2, delete ` `CLAUDE.meta.md` carries the measurement.`

**4b.** In `agent-doc-check` check 3, replace `That generic form was tried and rejected;
`CLAUDE.meta.md` carries what it flagged.` with `That generic form was tried and rejected.`

**4c.** In the `scripts/mutation-invariance/` entry, delete the sentence `Check C4 binds each entry
to its argument in `.claude/agents/articles/mutation-testing.meta.md`, the same shape as
`agent-doc-check`'s check 5.`

**This drops one thing that goes nowhere, and the drop is ruled rather than accidental**: the
analogy to `agent-doc-check`'s check 5. It is a comparison between two checkers, not a fact about
how either behaves, and ruling E does not preserve it. Do not reinstate it anywhere.

**4d.** In the promotion bullet, delete ` `CLAUDE.meta.md` carries the similarity scores.` Keep the
parenthetical about `--follow`.

**4e.** In the write-boundary paragraph, delete ` `CLAUDE.meta.md` carries the account.`

**4f.** In the sentence-case convention, delete ` `CLAUDE.meta.md` names both, and who caught
each.` The preceding two sentences stay byte-identical.

**4g. The `ast-grep-rules` sidecar, in the Architecture section.** Replace

> That place is `.claude/agents/articles/ast-grep-rules.meta.md`, the sidecar beside `ast-grep-rules.md`.

with

> That place is `.claude/agents/articles/ast-grep-rules.md`'s sidecar.

The gate fact in the following sentence — that check 5 reads `ast-grep-rules.md`, so an
undocumented rule reds the gate — stays byte-identical. It names no sidecar.

## Item 5 — `CLAUDE.md`: the Conventions bullet

In the bullet beginning `**Write instructions, not accounts, in every instruction file**`, replace
`to the file's `.meta.md` sidecar` with `to the file's sidecar`. Change nothing else in the
bullet. Per ruling 3 above, the bullet keeps its place.

## Item 6 — `CLAUDE.meta.md`

**6a. The opening pointer.** Replace `under the sidecar convention that file's own "Where new
documentation goes" branch 5 states` with `under the sidecar convention that file's own sidecar
section states`. Branch 5 no longer states the convention.

**6b. The placement heading's branch citation.** Replace `Branch 5's literal wording — a sidecar
goes _beside the article_ — would have put this one at `CLAUDE.meta.md` in the repo root, and
nothing would have refused it.` with `The placement rule's literal wording — a sidecar sits beside
its instruction file — would have put this one in the repo root, and nothing would have refused
it.`

**6c. The two-consequences sentence.** Replace `Two consequences the choice itself required, both
landed in `CLAUDE.md`: branch 5 records this as its second placement exception, and the
documentation map carries the pointer line.` with `One consequence the choice itself required,
landed in `CLAUDE.md`: the sidecar section records this as its second placement exception.` The
map's pointer line is deleted by item 2a, so the old sentence would be false.

**6d. Add the foreclosed workaround**, at the end of the paragraph that currently ends `so a prose
file there fails the frontmatter check outright.`:

> The only way to pass that check is to give a prose file agent frontmatter, which then enrols it
> as a sixth agent. Measured both ways.

This is the one obligation-bearing detail in the deleted branch-5 paragraph. It forecloses a
workaround a later reader would otherwise try.

**6e. Add the two `reference-check` slice records**, as a new `###` subsection under the existing
`## Documentation map` heading, after the `### Branch 5's pair-consistency audit` subsection:

> ### What made a sidecar citation resolve
>
> A repo-relative token naming a sidecar became resolvable when `check-md-references` added `.md`
> to the extractor. A leading-dot token, which is the form the module tier mandates, resolved from
> `reference-check-reach` onward, by its own basename.

Both are dated past-tense records naming a slice. They are the only content in the deleted
branch-4 paragraphs that `doc-comments.md` rule 7 does not already carry.

**6f. Delete the stale index paragraph, per ruling H.** Delete the whole paragraph beginning
`**The sidecar index above is hand-maintained and nothing checks it.**`, including its checker
proposal. Nothing replaces it. Its referent — "the index above" — is deleted by item 1, so the
paragraph would point at nothing.

**Out of scope in this file.** Leave `### Branch 5's roughly-1 KB floor` and its heading alone.
`prose.md` cites its content, and the heading is a pre-existing looseness that predates this
slice.

## Item 7 — `doc-comments.md`

**7a. The module roster in rule 7.** Replace

> Either file may be absent, and usually one is. All three live instances are rationale: `src/cache.meta.md`, `src/hooks/useZoomGlide.meta.md` and `src/scrollbars.meta.md`. Read the `useZoomGlide` one as the precedent.

with

> Either file may be absent, and usually one is. Read `src/hooks/useZoomGlide.meta.md` as the precedent.

The roster and its census go, per ruling A and ruling I. **The precedent pointer stays**: it is a
read instruction naming one model artifact, not a roster, and rule 7's later paragraph already
names `useZoomGlide` as the live example of the which-half test.

**7b. The syntax example.** Replace `**Write the reference as `@see
{@link ./useZoomGlide.meta.md}`.**` with `**Write the reference as `@see
{@link ./<module>.meta.md}`.**` per ruling G.

The generic form is already this file's idiom in two later paragraphs, and `reference-check`
resolves an angle-bracket token today — `CLAUDE.md` carries four such tokens and the gate is
green.

**Out of scope in this file, and `writer` must not touch them.** The two past-tense measurements
stay byte-identical, per ruling I: the one about renaming both module sidecars redding four
references, and the one about relocating `src/cache.meta.md` into `src/hooks/`.

## Item 8 — `prose.md`: two pointer repairs

**This item extends the reach the proposal names, and the user rules it at sign-off.** Item 3c
moves the module pair's audience split out of branch 4. `prose.md` cites branch 4 for exactly that
fact, and cites the routing branches for where a sidecar physically sits. Both citations point at
text this slice moves, which is the stranded-reference failure `prose.md` itself names.

The alternative is to leave branch 4's placeholder in place, which contradicts ruling J. Ruling I
set the precedent for the choice: a defect left in the file that owns the tier is relocated rather
than removed.

**8a.** In the paragraph beginning `**The module tier takes the same cut, under different
filenames.**`, replace `CLAUDE.md's routing branch 4 says who each is for` with `CLAUDE.md's
sidecar section says who each is for`.

**8b.** In the paragraph beginning `**Which article a subject belongs to, and where a sidecar file
physically sits, are CLAUDE.md's questions**`, replace `— routing branches 1 to 6.` with `— its
sidecar section and routing branches 1 to 6.`

Change nothing else in `prose.md`. Its two earlier mentions of the routing branches stay true and
stay untouched.

## `mutation-testing.md` — zero edits

The proposal's reach names this file. **Re-derivation says it needs no edit**, because ruling E's
premise already holds: the article states that every allowlist entry's argument lives in its
sidecar, bound by the checker's own C4, and the sidecar states that an entry without an argument
reds the gate.

**`writer` makes no edit here, and reports the file as verified rather than as skipped.** The
verification is the two greps in the check table below.

---

## Obligations, each restored or ruled out

`prose.md` says what a shortening pass drops. Every passage this spec deletes was read against its
replacement, and each obligation is accounted for here.

| Obligation in the deleted text                                | Disposition                                                                                               |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| A sidecar is named `<name>.meta.md`                           | restored — section, paragraph 1                                                                           |
| It sits beside its instruction file                           | restored — section, paragraph 1                                                                           |
| The role-file placement is forced, by which mechanism         | restored — section, paragraph 3                                                                           |
| `CLAUDE.md`'s own placement is chosen, not forced             | restored — section, paragraph 3                                                                           |
| Frontmatter is the only way to pass, and enrols a sixth agent | restored — `CLAUDE.meta.md`, item 6d                                                                      |
| No role file names a sidecar as a read trigger                | restored — section, paragraph 5                                                                           |
| What fills a sidecar is `prose.md`'s question                 | restored — section, paragraph 2                                                                           |
| `reference-check` matches by basename, not by path            | restored — section, paragraph 4                                                                           |
| Nothing checks a sidecar's contents                           | restored — section, paragraph 4                                                                           |
| Vale lints the instruction half and exempts the sidecar       | restored — section, paragraph 4                                                                           |
| `SKILL.meta.md` is shared across the skills tier              | restored in general form — section, paragraph 4                                                           |
| `claim-discipline.md`'s evidence sits in another sidecar      | restored in general form — section, paragraph 1; the instance stays in `claim-discipline.md`'s own header |
| The module pair splits by audience                            | restored — section, paragraph 6                                                                           |
| The mandated `@see` citation form                             | restored, genericised — section, paragraph 6                                                              |
| `ast-grep-rules`' sidecar read trigger                        | already at the destination — `ast-grep-rules.md`'s header                                                 |
| C4 binds each config entry to its argument                    | already at the destination — `mutation-testing.md`                                                        |
| Keeping the pair consistent is manual                         | already at the destination — `prose.md`                                                                   |
| Nothing checks which files have a sidecar                     | **converted** — from a status claim to a dated prohibition, section, paragraph 7                          |
| The checker proposal over the index                           | **ruled out** — ruling H                                                                                  |
| The C4-to-check-5 analogy                                     | **ruled out** — item 4c                                                                                   |
| "All three live instances are rationale"                      | **ruled out** — a census of external state                                                                |
| Every named instance of a sidecar in `CLAUDE.md`              | **ruled out** — rulings A, E, G                                                                           |

**Two obligations were added rather than dropped, and both are deliberate.** The section's final
sentence in paragraph 1 states a rule the index only implied. Paragraph 7 states a prohibition the
corpus previously carried as a proposal.

## Method `writer` owes

- **Every anchor in this spec was verified to exist verbatim in its target file.** All of them
  resolve at `e6899c9`. `CLAUDE.meta.md`, `doc-comments.md` and `prose.md` are hard-wrapped, so an
  anchor quoted on one line here spans two lines there — match across the newline rather than
  concluding the anchor is stale.
- **Take the pre-edit token frequency of each edited file before the first edit** — `CLAUDE.md`,
  `CLAUDE.meta.md`, `doc-comments.md` and `prose.md` — and diff
  the set after. Account for every non-zero delta as a move, a ruled deletion, or a defect. Diff
  `CLAUDE.md` and `CLAUDE.meta.md` **as a pair**, since this spec moves content between them.
- **Include the causal connectives** `because`, `since` and `so` in that diff.
- **After each deletion, re-read the surviving sentences around it** for a `the`, `that`, `those`
  or `it` whose referent left. Item 6f's paragraph is the worked instance of that failure.
- **Count top-level list items and indented continuations** in the routing test before and after.
  Items 1 and 3 both edit inside a numbered list, and `format:check` stays green over a broken one.
- **Run `npm run format`** before reporting. Prettier owns blank-line placement, and no anchor in
  this spec is a line number.
- **Re-probe the section's Vale reading at an in-scope path if a word of it changes.** Do not
  count by eye.

## Check readings, before and after

Run every command from the repo root with repo-relative paths. **A bare `vale` on an absolute path
matches no glob and reports "in 0 files" while exiting 0** — read the file count in every reading.

| Command                                                 | Before (`e6899c9`)                          | After                                      | A different reading means                                                                 |
| ------------------------------------------------------- | ------------------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------- |
| `npm run agent-doc-check`                               | 56 doc files, 8 agent files, 32 rules, pass | pass, same counts                          | a deleted line carried an `npm run` reference, or a role-cycle string moved               |
| `npm run reference-check`                               | 546 files, 3275 references, pass            | pass, fewer references                     | a citation now names a file that does not resolve, or an allow marker went stale          |
| `vale CLAUDE.md`                                        | 19 warnings in 1 file                       | **≤ 19**, and 0 of them in the new section | the new section was reworded without a re-probe                                           |
| `vale .claude/agents/articles/doc-comments.md`          | 0 warnings in 1 file                        | **0**                                      | item 7 split a sentence or a paragraph past a cap                                         |
| `vale .claude/agents/articles/prose.md`                 | 5 warnings in 1 file                        | **5**                                      | item 8 did more than replace two phrases                                                  |
| `vale .claude/agents/articles/CLAUDE.meta.md`           | 0 warnings in 1 file                        | **0**                                      | the `[**/*.meta.md]` exemption stopped applying — investigate `.vale.ini` before the file |
| `npm run prose-lint -- --scope .claude/agents/articles` | linted 30 tracked files                     | linted 30 tracked files                    | a file was added or removed under `articles/`; this slice adds none                       |

**Four findings in `vale CLAUDE.md` are expected to move, and none to appear.** The
`Procedure.ProcedureLength` findings on branches 1, 2, 4 and 5 each shrink. Branch 5's, at 27
words before, may clear the 20-word cap outright. **Re-measure rather than predicting a number**
— report the new count and name which findings moved.

**Two acceptance greps, which are the slice's own predicate.**

```bash
grep -n '\.meta\.md' CLAUDE.md          # every hit must fall inside the sidecar section
grep -c 'CLAUDE\.meta\.md' CLAUDE.md    # must be 0
```

The first is the whole outcome in one command: after the change, `CLAUDE.md` names no sidecar
instance, and every generic form sits in one place.

## What would falsify the shape

Report these to the seat rather than working around them.

- **A branch cannot answer its own question without a placeholder.** Then the cut in ruling 1 is
  wrong, and the branch needs an amendment rather than a rewording.
- **A third sidecar placement class exists**, beyond the two in paragraph 3. Then the rule is
  converging on the inventory it replaces, and the proposal's own ruling-out condition has fired.
- **A deleted passage carries an obligation not in the table above.** Return the point; `writer`
  does not amend a signed spec.

## Cross-pipeline recommendations

These leave the slice as backlog recommendations. None is an edit in this spec.

1. **An `enabler-process` candidate for the corpus-wide residue.** Over eighty named sidecar
   mentions sit in eight articles, untriaged. Two shapes found while measuring this slice belong
   to it: eight articles carry a pointer to their own sidecar in a header blockquote, which
   `prose.md` prohibits for an instruction file; and the reference tier's four "Its sidecar
   carries …" clauses, which this slice deliberately leaves because they name no instance. The
   asymmetry that leaves is visible in the Documentation map after this slice lands.
2. **A `spike`, not an enabler, on whether the section's rule is mechanically checkable.** Ruling
   B closes the question of a checker over the _roster_. It does not close whether a checker could
   assert the _placement rule_ — that every `*.meta.md` sits beside a same-named instruction file,
   or in `articles/` under the two named classes. That is a different predicate, derivable rather
   than hand-copied, and nobody has measured whether it is worth a program. Recommend a spike
   because the answer is unmeasured, not a checker because it might not be.
