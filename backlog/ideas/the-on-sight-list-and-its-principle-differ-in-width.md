---
name: the-on-sight-list-and-its-principle-differ-in-width
title: Reconcile prose.md's on-sight prohibition list with the section principle above it
created: 2026-09-22
---

Recommended by `coach` REVIEW at the close of
`slice/a-reader-finds-a-sidecar-without-an-inventory`, 2026-09-22, and specified there in
detail. That slice cut the sidecar-pointer bullet three times — A10 drew it on grammatical mood,
B1 redrew it on binding, C1 fixed what "its own" means. Each cut was signed. **The residue is
that the bullet and the section containing it now answer at different widths, and nothing says
which governs.**

## Situation

`.claude/agents/articles/prose.md`'s `### What an instruction file may not carry` opens a
four-bullet list. Its first bullet prohibits a pointer to a file's own `.meta.md` sidecar when
that pointer is addressed to every reader, exempts a pointer bound to one named ruling at that
ruling's site, exempts the module `@see` form, and defines "its own" as the sidecar named after
the host file.

Four blocks above it, inside the same parent section `## Instruction stays. Explanation moves.`,
sits an unqualified principle: **"A sidecar carries no read trigger, and that is the point. It is
read when a rule is being changed, never in order to follow one."**

## Complication

Three tensions, and they interact. **Ruling any one alone makes another worse.**

**A — the principle is destination-agnostic and the bullet is not.** The principle names no
destination, so it reaches a general every-reader trigger pointing at a _neighbour's_ sidecar.
C1's definition removed every cross-file pointer from the bullet's subject. So the wider
prohibition lives in the principle and the narrower one in the bullet, and a reader meets
whichever they reach first.

**This is exactly how the slice's own AUDIT went wrong.** `editor` swept for `.meta.md` tokens
and concluded the bullet had surrendered coverage; `coach` overturned it by finding the
principle, which contains no such token. **A rule stated in words rather than tokens is
invisible to the method the corpus uses to check itself.**

**B — the principle is not reconciled with the exemption the same slice landed.** Its first
sentence forbids a read trigger outright. Its second licenses a change-time one. B1's ruling-site
exemption sits in that gap, and so do the three live triggers it protects, in `doc-comments.md`
and `mutation-testing.md`.

**C — the list's own frame no longer describes its first bullet.** The header reads "Each is a
shape to remove on sight, not a judgement call." Bullet 1 is four sentences carrying a
prohibition, two exemptions and a definition. Its three siblings are one glance each. `coach`
ruled the bullet is _more_ mechanical after C1 — three yes/no readings, no weighing — so the
strain is on "sight" reading as "at a glance", which is a question about the frame.

## Question

Which text governs a cross-file every-reader sidecar trigger — the section principle or the
bullet — and can the frame, the principle and the bullet be made to agree without any of them
naming an instance?

## Answer

Shaped, not specified, and the three must be ruled together: widening the bullet worsens the
frame, and splitting the bullet may settle all three.

**One brittleness fact for whoever specs it.** C1's added sentence is 25 words against
`STE.SentenceLength`'s 25-word cap, and the bullet is four sentences against its own signed
four-sentence bound. Vale reports no finding on it. **Any widening written in place will trip a
rule.** The remedy is a restructure, not an insertion.

## The three-reading table, copied from `amendment-3.md`

The amendment that resolved this lives in `backlog/done/`, which the retrospective deletes. The
table is copied here because **a ruling surviving only in a deleted board file is the defect the
parent slice existed to close.** It records what the ambiguity was, before C1 settled it.

| Reading of "its own `.meta.md` sidecar"               | Does the prohibition reach it?                              | Verdict    |
| ----------------------------------------------------- | ----------------------------------------------------------- | ---------- |
| The sidecar named after this file                     | No. `engineering.meta.md` is not named after this file.     | permitted  |
| The sidecar holding this file's evidence              | Yes, but the appositive limits the prohibited forms to two. | permitted  |
| The same, reading "alongside the rules …" as a census | Yes, and the census clause catches it.                      | prohibited |

C1 chose the first reading. The wider coverage the second and third would have given is held by
the section principle instead, which is tension A.

## A measured starting point

**Measured 2026-09-22 on `main` at `c03fbe3`**, and re-derived independently by both `editor`
AUDIT and `coach` REVIEW with the same result: **fourteen live cross-file sidecar pointers across
five files** — `claim-discipline.md` 8, `doc-comments.md` 3, `architecture.md` 1, `prose.md` 1,
`merge-protocol.md` 1.

Every one is either the evidence announcement `CLAUDE.md`'s sidecar section mandates, or a
ruling-site citation. **Zero live instances of the shape the tension is about.** So this is a
rule-consistency item rather than a remediation, and nothing in the tree is currently wrong.

## No-gos

- **Do not name an instance in `prose.md`.** `amendment-3.md`'s falsifier stands: the prohibition
  lists no instances, and a fix that adds one re-creates the roster form the parent slice removed.
- **Do not fold this into `prose-md-has-an-untriaged-interior`.** That candidate is a triage
  sweep of accuracy defects; this is a design ruling. `coach` was explicit that mixing them is how
  a sweep grows a ruling nobody signed.
- **Do not re-open C1.** It is signed and landed, and `coach` ruled it defensible. This is about
  the text around it.

## Open questions

- **Does the frame change, or the bullet?** Splitting bullet 1 into two would restore "on sight"
  and might settle A by giving the cross-file case its own line. Rewriting the frame to promise
  "no judgement call" without "on sight" is the one-word alternative. Neither has been costed.
- **Does the principle need the exemption, or does the exemption need the principle?** Tension B
  can be closed from either end, and the choice decides whether `prose.md` states one rule with
  carve-outs or two rules at different altitudes.
- **Is the principle the right home for the cross-file prohibition at all?** It sits under
  "Instruction stays. Explanation moves.", which is about register. A destination rule may belong
  with the placement rule in `CLAUDE.md`'s sidecar section instead — which would make this a
  two-file change and pull `CLAUDE.md` back into scope.
