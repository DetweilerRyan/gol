---
name: role-files-carry-exposition-that-belongs-elsewhere
title: Strip the role files to instruction and route every explanation out of them
created: 2026-09-11
---

## Situation

**Ruled by the user on 2026-09-11, and this entry treats it as fact rather than as a hypothesis to
test.** The five role files carry too much exposition, explanation and reasoning. A role file should
be a set of instructions. Anything that is not an instruction belongs somewhere else.

The ruling stands whether or not a measurement agrees with it. A prior spike
(`spike-vale-rules-that-compress-the-agent-files`) reported that no available Vale rule compresses
these files and recorded zero enablements. **That result does not refute this ruling — it answers a
different question**, and the difference is the reason this entry exists.

## Complication

**The prior spike asked "which off-the-shelf rules make these sentences shorter". The real question is
"what kind of content does not belong in this file at all".** Those come apart completely:

- Vale rules measure sentence mechanics — length, voice, gerunds, modals. Every one of them scores a
  sentence that is already in the file.
- The defect is **whole paragraphs of correct, well-argued reasoning sitting in a file whose job is to
  say what to do.** A rule that shortens each of those sentences by two words leaves the paragraph
  there.

The spike's own ENABLE bar makes this concrete: it required a 2 percent word reduction. A problem
measured in paragraphs cannot clear a bar denominated in that way, so the bar guaranteed the answer.

**Measured on `coder.md`, 1,857 words, 2026-09-11.** Of 18 prose paragraphs, **6 run to five or more
sentences**, and the largest are a 24-sentence numbered procedure with justification woven into each
step, a 13-sentence block, and a 12-sentence block. Representative content, quoted rather than
characterised:

- "The orchestrating session has made exactly that mistake, repeatedly, and no coder caught it. An
  explicit instruction felt more authoritative than this file. It is not." — three sentences of
  narrative supporting an instruction that is one clause.
- "Making a step-7 finding disappear by loosening the rule that produced it disarms the check for
  everyone afterward. It does so invisibly, since a dead rule and a satisfied rule look identical." —
  true, well put, and an argument **for** an instruction rather than an instruction.

**The reasoning is good, and that is why it accumulated.** Nobody added a bad paragraph. Each one
defends a rule someone got wrong once. The question is not whether it is correct; it is whether the
file a role reads before acting is where it belongs.

## Question

What is left when every sentence that is not an instruction leaves the role files, and where does each
kind of departing sentence go?

## Sketch

**This is a routing and rewriting job, not a linting job.** Take that as the ruling's operative half.

### 1. Classify every paragraph, not every sentence

The unit is the paragraph, because that is the unit the defect lives in. For each, decide: instruction,
or not. An instruction tells a role what to do, what not to do, or when. Everything else — the
argument for it, the incident that produced it, the measurement that supports it, the mechanism that
makes it true — is exposition.

**Deliberately a coarser cut than `prose-linting.md`'s sentence-level split.** That article's
instruction-versus-explanation rule is the right idea at the wrong granularity for this job.

### 2. Route what leaves, and do not delete it

Four destinations, and CLAUDE.md's branches already name three:

- **A role's own `.rationale.md` sidecar.** `architect`, `cleaner` and `hardener` have one; `coder` and
  `product` do not and would gain one. This is the default destination and takes the arguments.
- **A shared article**, when the reasoning binds more than one role.
- **A `scripts/` sidecar**, when the explanation is really about a program rather than about a role.
  The user named this destination specifically, and it is the least-used of the four today.
- **Deletion**, where a paragraph defends a rule nobody disputes. Rare, and it needs a reason.

### 3. A role file never points at its own sidecar

**Ruled by the user on 2026-09-11.** A role file carries no reference to its `.rationale.md` sidecar,
and no instruction about when to read one. A role does not change its own file, so the rationale is
not addressed to it. A pointer is unnecessary at best and dangerous at worst: it invites the role to
read material that argues about rules rather than stating them, which is the exposition this whole
entry exists to remove — reintroduced by the very sentence that routed it away.

**The sidecar's audience is whoever is changing the rule**, and that reader arrives from
`CLAUDE.md`'s sidecar index, not from the role file.

**Measured 2026-09-11, and it is not one line.** Across the four role files with a sidecar there are
**21 pointers**: `architect.md` 8, `hardener.md` 7, `cleaner.md` 5, `coder.md` 1. Most take the form
"the worked example is in `<role>.rationale.md`" or "the measurement is in `<role>.rationale.md`" —
a sentence whose whole content is that an argument exists elsewhere.

`coder.md`'s was removed when this was ruled. **The other 20 are follow-up work**, one per role file,
and each strip clears its own.

**This binds the other three sidecar tiers differently, and do not over-apply it.** An article may
point at its own sidecar, and `CLAUDE.md`'s branches 4 and 5 still mandate the `@see` form for a
module sidecar. The rule is specific to a role file, because a role file's reader is the only one
who provably never needs the argument.

### 3. Keep the one-clause why

**The floor, and it is not "no reasoning".** CLAUDE.md's comment convention already states the rule for
code: a comment says why, and the why stays beside the thing. The same holds here. What moves is the
multi-sentence account. What stays is the clause that changes what a reader does next.

"Never edit `rules/*.yml` — a dead rule and a satisfied rule look identical" keeps its why and loses
four sentences.

### 4. Pin what may not be lost

The prior spike built the right instrument for this and it should be reused: **a pre-registered
constraint census, pinned to the pre-edit file's git blob hash** — every obligation, prohibition,
precondition, exemption and named wrong answer, numbered before any edit, then cited line by line in
the after-file or in its new home. An uncited line is a recorded loss.

That census is what makes an aggressive cut safe, and it is the reason this can be aggressive.

### 5. Then ask what mechanises

**Only after the rewrite**, and on the evidence it produces. A rule that detects an eight-sentence
paragraph in a role file, or a past-tense narrative sentence, is a plausible guard against
re-accumulation. `HistoricalNarration` — deferred by the prior spike at precision 8/9 — is the
existing candidate and its YAML and fixtures are recorded in `prose-linting.rationale.md`.

**A guard against regrowth is worth more here than a compression tool**, because the files did not
arrive verbose. They grew that way one good paragraph at a time.

## Touches

`.claude/agents/*.md` — all five. New `coder.rationale.md` and `product.rationale.md` in
`articles/`, which is where a role sidecar is forced to live. Possibly `scripts/*/` sidecars.
`prose-linting.md`, whose instruction-versus-explanation section this refines at a coarser
granularity. `CLAUDE.md`'s documentation map, if a sidecar is added.

## Open questions

- **Does `architect.md` need a split rather than a strip?** The prior spike measured its length as
  scope rather than loose prose — four modes in one file, at lower finding density than `coder.md`.
  That is a CLAUDE.md branch question and may be a separate slice. It does not exempt the file from
  this one.
- **Which role goes first?** `coder.md` is the smallest at 1,857 words and the densest in findings,
  which made it the prior spike's starting point on the user's ruling. The same argument holds here.
- **Does a role file keep its prose voice at all?** An instruction-only file may read as a checklist.
  The one-clause-why floor is the answer this entry proposes; whether it is enough is a judgement the
  first rewritten file will settle better than an argument will.
- **What stops the sidecar becoming the new dumping ground?** Nothing proposed here. The sidecars are
  already large. Worth naming before the first move, because "route it to the sidecar" is exactly how
  a file grows one good paragraph at a time.
