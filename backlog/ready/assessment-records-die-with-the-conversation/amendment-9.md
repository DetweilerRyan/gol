# Amendment 9 — assessment-records-die-with-the-conversation

`coach` SPEC, 2026-09-20, against tip `242b08e`. **This amendment needs the user's signature
before `writer` runs.** It carries two items, numbered **26 and 27**, continuing the sequence.

**`spec.md` and amendments 1 to 8 are all signed and immutable.** Nothing in any of them is
reworded, renumbered or reordered. The live instruction set is ten files read in number order.

## The falsified claim, recorded in its own terms

**Amendment 8 claimed: "if an amendment 9 is needed, it will be because item 24 or item 25
introduced something, not because a home was missed." A home was missed. The claim is false.**

`.claude/agents/articles/handoffs.md`, lines 55 to 57, carries "No role reads or writes the board."
`git log -L` places that sentence at `aa9cde2`, in an earlier slice. **Items 24 and 25 introduced
nothing there, and this pass never touched the file.** The claim failed in exactly the direction
it named as the one that would falsify it.

**It is strictly worse than the sentence item 24a repaired.** CLAUDE.md's old form forbade
_deriving_. This one denies that a role reads the board at all and writes it at all, so it forbids
two licensed acts: `coach` SPEC's own deliverable, and the entire read carve-out. **`writer`
cannot execute a spec it is told it cannot read, and `editor` read `amendment-8.md` this pass
under a licence this sentence denies.**

**It is met before any trigger-read file.** `handoffs.md` is one of the four house-rules articles
every role reads unconditionally. The role files cite it as `handoffs` without the extension —
`coach.md` line 15, `writer.md` line 13, `editor.md` line 14 — which is why a search for the
filename finds nothing in them.

**No mitigating pointer.** `orchestration.md` states the same universal and is correctly recorded,
because its very next sentence names the canonical rule. This paragraph points at Defect
adjudication and `workflow.md`, and neither states the carve-out.

### What is falsified, and what is not

|                            | Status                                                                                                                                        |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| The **stopping condition** | **Not in question.** It classified this as blocking on its first real test and sent four other findings to the retrospective without argument |
| The **convergence claim**  | **False**, in the missed-home direction it named                                                                                              |
| The **assessment record**  | **Zero new defects, third consecutive round**                                                                                                 |

**A claim worth making is one that can fail this way.** The alternative was a hedge that could not
have been checked, and it would have been worth less.

## Why the census missed it, which outlives the fix

**`editor`'s diagnosis is right: the method missed it, not the reading of its hits.** Item 24's
recorded grep matched on `deriv|board path|read carve-out|nothing else under|never glob|directory
listing|write grant|separate grant`. **"No role reads or writes the board" contains none of those
tokens.** My record that every hit was read rather than filtered is true and irrelevant — the term
list never produced this hit to read.

**The first two censuses filtered on the predicate. Both failed for the same reason.** A predicate
can be paraphrased without limit: derive, read, open, touch, perform, may, is a duty no role can
do. A list of predicates finds the phrasings its author imagined, and this slice has now been
surprised three times by exactly that.

**A third predicate list would be the same method with a third author's imagination.** So item 26
censuses on a different axis.

## The census by claim — method, counts, and the enumeration

### The axis, and why it is not a third token list

**A claim about who may touch the board must name its subject.** The predicate is free; the
referent is not. A sentence that binds a reader has to say what it is about, so filtering on
`board|backlog|proposal.md|idea file|candidate` is a **necessary condition** for the claim to
exist rather than a guess at its wording.

**Then read, rather than filter further.** The narrowing is mechanical; the judgement is human.

### The method, recorded so it can be re-run

```bash
# 1. scope — every paragraph in .claude/**/*.md plus CLAUDE.md
# 2. narrow — the paragraph names a board referent AND an agent AND a permission or action word
# 3. read every survivor; classify by hand
```

The script lives in this amendment's history, and the three regular expressions are:

```text
referent:   \b(board|backlog|proposal\.md|idea file|candidate)\b
agent:      \b(role|roles|seat|session|agent|coach|writer|editor|product|coder|cleaner|architect|hardener|you|your)\b
permission: \b(never|no role|only|cannot|can't|must not|may not|not yours|owns|reads|writes|edits|touches|derive)\b
```

### The counts

| Measure                                              | Reading            |
| ---------------------------------------------------- | ------------------ |
| `.md` files under `.claude/**` plus CLAUDE.md        | **55**             |
| Paragraphs scanned                                   | **3,047**          |
| Files naming a board referent                        | **36**             |
| Paragraphs surviving the narrowing, all read by hand | **40**             |
| Paragraphs stating who may touch the board           | **12, in 6 files** |
| Of those, wrong                                      | **1**              |

**Forty paragraphs is a readable set, which is why the census was cheap rather than expensive.**
The narrowing did the volume; the reading did the judgement.

### The twelve, and their disposition

| Where                                                                          | Disposition                                                                |
| ------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| `handoffs.md`, the report-a-finding paragraph                                  | **Wrong** — item 26                                                        |
| `handoffs.md`, "Recommend the board only where no open role can rule it"       | Correct; about recommending                                                |
| `orchestration.md`, "`backlog/` is a duty no role can perform"                 | Recorded for the retrospective; its next sentence names the canonical rule |
| `coach.md` Boundaries, "Read only the board paths your prompt names"           | Correct                                                                    |
| `coach.md` Owns, the `spec.md` deliverable                                     | Correct — the write grant                                                  |
| `writer.md` description, the write surface                                     | Correct                                                                    |
| `writer.md` Boundaries, "even though the board docs sit in your write surface" | Correct                                                                    |
| `writer.md` Boundaries, "Nothing else under `backlog/` is yours"               | **Ambiguous** — item 27                                                    |
| `pipelines.md` line 288, the read carve-out                                    | Correct — canonical                                                        |
| `pipelines.md` line 292, the write grant                                       | Correct — canonical                                                        |
| `CLAUDE.md` line 313                                                           | Correct since item 24a                                                     |
| `CLAUDE.md`, the no-role-edits bullet                                          | Correct since item 17e                                                     |

**`idea-assess/SKILL.md`'s "the idea file, its frontmatter and its lane are not yours to touch" is
a skill's own write rule**, correct and outside the role carve-out, on the ruling item 24 already
recorded for `idea-capture`.

### The residual hole, stated rather than hidden

**A rule stated in a paragraph that never names the board, `backlog/`, a proposal, an idea file or
a candidate would not survive the narrowing.** Such a paragraph would have to rely on anaphora
reaching across a paragraph boundary, since within-paragraph anaphora is caught by scanning
paragraphs rather than lines — which is the change that would have caught `handoffs.md` on the
first pass, where its sentence is hard-wrapped across two lines.

**I am not claiming that hole is empty. I am claiming it is smaller than the two before it, and
naming what would fall in it.**

## The claim this time, checkable rather than confident

**Twelve paragraphs in six files state who may touch the board. They are enumerated above.**

**The falsifier:** a paragraph under `.claude/**` or in CLAUDE.md that states a rule about who may
read or write the board and is not in that table.

**What I do not claim.** That amendment 10 is unnecessary. That the enumeration is complete. That
a third method being wider than two narrower ones makes it exhaustive. **This is the third method,
and the honest reading of three surprises is that each census was narrower than the claim space
until it was not — and I cannot show from inside that this one finally is.**

**What stops the next surprise is not a corpus edit.** No roster goes into the corpus;
`claim-discipline.md` forbids exactly that, and a list of homes would rot the way the count did.
**What is durable is the recorded re-runnable method**, which makes the next census minutes rather
than a discovery.

## Rulings on the two binned findings

| Finding                             | Ruling                            |
| ----------------------------------- | --------------------------------- |
| `writer.md` line 46                 | **Misbinned. It becomes item 27** |
| CLAUDE.md line 313's near-duplicate | **Correctly binned**              |

**`writer.md` line 46 meets amendment 8's own discriminator — does the overclaim forbid a licensed
act, or oversell a convenience?** "Nothing else under `backlog/` is yours", read standalone,
denies the write surface that the same file asserts **three lines above**: "even though the board
docs sit in your write surface". Specs and amendments are under `backlog/`. That is a licensed act
denied inside one file.

**It is also the identical shape to R4, which I ruled misbinned one amendment ago**, and on the
same ground: the mitigation offered is that the lead scopes it, which is the trailing-clause
charity item 18 refused for `pipelines.md`. **Accepting it here and refusing it there would make
the rule a matter of who is reading.** The sentence is mine, from item 24b, and the fix is three
words.

**CLAUDE.md line 313's near-duplicate of `pipelines.md` line 292 is correctly binned.** CLAUDE.md's
own routing branch 1 sanctions carrying a gating predicate on the auto-loaded surface, the user
signed that argument at amendment 6, and the dropped clause is closed for `coach` by its own file.

## What this supersedes

| Item | Supersedes                              | File                                  |
| ---- | --------------------------------------- | ------------------------------------- |
| 26   | nothing — a paragraph no item has named | `.claude/agents/articles/handoffs.md` |
| 27   | Amendment 8's item 24b, in part         | `.claude/agents/writer.md`            |

**The file set widens by one, to `.claude/agents/articles/handoffs.md`**, forced by the blocking
finding.

## Item 26 — `handoffs.md` drops the universal rather than scoping it

**Ruled: delete the false reason, do not scope it. That is home reduction, not a repair.** The
paragraph's instruction is "never file it yourself". Its stated reason is the universal. **Filing
a candidate is the seat's act whether or not a role may read a spec**, so the true reason needs no
reference to the carve-out at all.

**Scoping it would have added a thirteenth statement of the rule.** Deleting it takes the count to
eleven.

**Find** (two whole lines, unique in the file):

```text
**Report a finding the slice cannot resolve. Never file it yourself.** No role reads or
writes the board, so a candidate is the seat's act on your recommendation. Report and stop,
```

**Replace with:**

```text
**Report a finding the slice cannot resolve. Never file it yourself.** Filing a candidate is
the seat's act on your recommendation. Report and stop,
```

**The prohibition survives verbatim and its reason becomes true.** "Never file it yourself" is
byte-identical. "No role reads or writes the board, so a candidate is the seat's act" becomes
"Filing a candidate is the seat's act", which asserts only what the instruction needs. The third
sentence, naming Defect adjudication and `workflow.md`, is untouched.

## Item 27 — `writer.md`'s conjunct stops standing alone

**Supersedes amendment 8's item 24b, in part.**

**Find** (a clause; one occurrence):

```text
Nothing else under
  `backlog/` is yours.
```

**Replace with:**

```text
Nothing else under
  `backlog/` is yours to read.
```

**Three words, and the ambiguity goes rather than resolving carefully.** The bullet's lead is
"Read only the board paths your prompt names", so the scope was always reads; the second sentence
now says so on its own terms and no longer reads as a claim about ownership.

## Which pass the items run in

**One pass, two files, one commit**, with `editor` CLEAN after it. Neither item depends on the
other.

## Measured readings — baseline first, then candidate, then discriminator

**Measured 2026-09-20 in this worktree at tip `242b08e`**, in place, restored with `git checkout`.
`git status --porcelain` reported empty afterwards.

**`handoffs.md` reads 23 at baseline, and taking that reading first is what keeps its post-edit 23
from reading as a regression.** It is the highest baseline any file in this chain has carried.

| Path                                    | Baseline                     | With items 26 and 27             |
| --------------------------------------- | ---------------------------- | -------------------------------- |
| `.claude/agents/articles/handoffs.md`   | **23 warnings**              | **23**                           |
| `.claude/agents/writer.md`              | 0 in 1 file                  | **0**                            |
| `npm run reference-check`               | 538 files, 3,226 refs, clean | **538 files, 3,226 refs, clean** |
| `npm run agent-doc-check`               | 55 / 8 / 32, clean           | **unchanged, clean**             |
| `npx prettier --check` on the two files | clean                        | **clean**                        |

**The reference count does not move.** Neither item adds or removes a filename token.

**Two discriminators, each reporting, each run against the whole enabled rule set for its path:**

| Probe                                              | Reported                                     |
| -------------------------------------------------- | -------------------------------------------- |
| Item 26's replacement written past the 25-word cap | `STE.SentenceLength`, 26 words               |
| Item 27's bullet written in four sentences         | `Instruction.ListItemSentences`, 4 sentences |

## Sign-off

The user signs this amendment before `writer` runs. **The file set widens by one**, to
`.claude/agents/articles/handoffs.md`, and nothing here reaches `scripts/`, `src/`,
`vale-styles/` or `.vale.ini`.

**Three things to weigh beyond the items.** Amendment 8's convergence claim is recorded as false.
One of `editor`'s bins is overturned for the second round running. And this amendment makes no
claim that it is the last — only an enumeration a reader can check and a method they can re-run.
