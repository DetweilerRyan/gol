# Amendment 4 — 2026-09-18, the dropped obligation

`coach`, slice `name-the-spec-amendment-and-the-in-cycle-fix-rule`, against tip `fc94d73`.
**This amendment needs the user's re-sign-off before `writer` runs.**

One item, one sentence, one file already in the manifest.

## The tests, each stated rather than implied

**Amendment 3's falsifier has not fired.** It names any further instance of the single-source
class, in any file or field. This is not that class. `editor`'s literal search returns one hit,
`pipelines.md`'s source line, which is the source.

**Amendment 3's stopping condition is satisfied.** One hit, down from two. The single-source
class is closed.

**Amendment 1's falsifier has not fired either**, and it is the one that could have. It names a
fourth disposition for the outside-scope case or a second instruction granting a role a board
write. A **dropped** obligation is neither. Amendment 1's stopping condition also still holds:
no line tells a role to write the board, and the dispositions still agree across the three files.

**So this is a new class, not a recurrence.** Round 1 was a routing contradiction, round 2 a
duplication across files, round 3 that duplication's residue in a location the repair could not
reach. This is the fourth: an obligation lost inside a block replacement. `prose.md` already
names the shape — what a rewrite drops is disproportionately an obligation — and it is a hazard
of the act of rewriting rather than of the corpus's shape.

## Why an amendment, on the merits

**I deleted user-signed text without ruling on it.** The sentence was in the spec the user
signed. Amendment 1's supersession table disclosed "two paragraphs replaced verbatim", which is
true and was the wrong granularity to notice a sentence going missing inside them. Naming that
as accepted would be naming as accepted a deletion nobody approved.

**The obligation is the load-bearing half for the user's stated purpose.** The remaining
paragraphs cover the neighbouring cases: a finding the slice authored is covered by the first
paragraph, and a pre-existing one by the last. What is uncovered is the qualifying test itself —
"Recommend the board only where no open route resolves it" has no floor under _resolves_, so a
role may call a route closed when it is merely expensive. That is the case the rule exists to
refuse.

**Cost: one sentence in a file already in the manifest. No file is added.**

## Restoring the obligation, not the bytes

**The original sentence cannot be restored verbatim.** It read "A finding that is merely
inconvenient is neither", and "neither" pointed at two enumerated cases that A1's rewrite
replaced with routes. Pasting it back would strand the referent — the exact defect class this
cycle has been sweeping for. The obligation is restored in the rewrite's own vocabulary instead.

## What this supersedes, and nothing else

| Item                 | Disposition                                      |
| -------------------- | ------------------------------------------------ |
| Amendment 1, item A1 | One sentence added to its second paragraph by E1 |

Everything else stands. The spec, Amendments 2 and 3, and the rest of Amendment 1 are untouched.

## Part E — the item

### E1 — `.claude/agents/articles/handoffs.md`, restore the inconvenience floor

**Find,** in `## Resolve a finding in the cycle that made it`:

```markdown
signed spec and re-enter the cycle. Recommend the board only where no open route resolves
it.
```

**Replace with:**

```markdown
signed spec and re-enter the cycle. Recommend the board only where no open route resolves
it. A route you would rather not take is not a closed one.
```

Change nothing else in the section.

## Part F — the three smaller findings, ruled without repair

- **`handoffs.md` naming `coach` as able to amend and re-enter.** It stays. It states a
  destination and the reason a reporting role needs for choosing it, and no part of the
  mechanism. Amendment 2's register table assigned it exactly that shape, and `editor` reading
  it the same way independently is the check working.
- **`amendment-1.md`'s Part C citing wording its own Part A deletes.** Accepted, no action. It is
  an immutable record and reaches no corpus file. It is also the first observed cost of the
  immutability rule: an amendment can strand its own prose against its own edits. Worth knowing
  before somebody proposes editing a signed amendment to tidy one.
- **Bare sibling-section citations in the new section.** `editor` declined to normalise so the
  landed bytes stay comparable to the signed block, which was right at the time. E1 ends that
  comparability anyway, so the reason expires here rather than being overturned. Normalising
  citation style across the article is a cosmetic sweep and not this slice's work.

## Part G — the measurement hazard, and where it belongs

**`vale` given an absolute path reports "0 files" and exits 0.** `.vale.ini`'s section globs do
not match an absolute path, so the run applies no style at all. A clean file and an unstyled run
are the same text apart from the file count.

**I hit this myself at the start of this slice.** The first `pipelines.md` probe I ran used an
absolute path and returned 0 findings in **0 files**; I switched to a relative path and
re-measured. Every reading in this cycle was taken relative, with the "in N files" count read
each time. That is the provenance, and it is why none of the readings in these four amendments
rests on it.

**Recommended home: `prose.md`'s confident-zero list, with the measurement in `prose.meta.md`.**
The instruction half is one line — run `vale` with a repo-relative path and read the file count.
The evidence half is the glob mechanism and the exit code. That is the branch-5 split applied
unchanged.

**Out of scope here, and the reason is my own rule.** It is not this slice's doing; it is a
standing property of `vale` and `.vale.ini`. `prose.md` and its sidecar are not in this
manifest, and `vale-styles/` questions are `architect`'s in any case. **Cost of taking it now:**
two files added to the manifest, a fifth round, and a subject unrelated to everything this slice
has ruled.

**One question for that item rather than a second item.** Whether `scripts/prose-lint/` can
refuse an absolute path mechanically is an `enabler-technical` half, and it should be asked
inside the same candidate rather than filed separately.

## Part H — a recommendation about this mechanism, from its own first use

**A verbatim block replacement discloses at block granularity.** An obligation inside the
replaced block can disappear without appearing anywhere in the supersession table, which is
exactly what happened here. A candidate rule — an amendment that replaces a block names any
obligation the block carried that the replacement does not — would close it.

**Not folded in, deliberately.** This round is one sentence. Adding a new rule to the mechanism
in the same round is how a one-sentence amendment becomes a fifth round. Recommended to the
board with its cost: one `pipelines.md` edit, and a judgement call at every future amendment
about what counts as an obligation.

## Part I — closing properties

**The cycle is not closed.** E1 is outstanding and needs the user's signature.

**These properties close it.** All are checkable by reading or by a literal search, and all but
the last are already true at tip `fc94d73`:

1. No line in the live corpus tells a role to write the board.
2. Every disposition for an outside-scope finding reads the same in `handoffs.md`, in its
   `Defect adjudication` table, and in `workflow.md`.
3. A search of `.claude/**` and CLAUDE.md for the removed phrases returns exactly one hit,
   `pipelines.md`'s source line.
4. Each of the six rules has one file stating its mechanism; every other file states only its
   own role's act.
5. `pipelines.md`'s lane census matches its own bullet count, and both mermaid edges route
   through the user gate.
6. **Every obligation the signed spec carried is live in the corpus or named as ruled out.** E1
   is what makes this true.

**Falsifier for this round.** If `editor` finds a second obligation dropped by Amendments 1
through 3 that no file states, the block-replacement practice is the defect rather than any one
sentence. **Do not write Amendment 5.** Apply the fallback.

**Fallback, decided now.** Stop amending and hand the slice's remaining findings to a successor
`enabler-process` item that re-derives the section from the signed spec text in one pass, rather
than repairing it sentence by sentence. Record what is missing rather than restoring it under
time pressure.

## Part J — expected readings

Measured today on a probe copy carrying E1 exactly, then deleted.

| Check                                      | At tip `fc94d73`              | Expected after E1                 |
| ------------------------------------------ | ----------------------------- | --------------------------------- |
| `vale .claude/agents/articles/handoffs.md` | 23 warnings                   | 23 warnings, the same lines       |
| `npm run agent-doc-check`                  | exit 0                        | exit 0, untouched surface         |
| `npm run reference-check`                  | exit 0, 524 files, 3,151 refs | exit 0, 524 files, refs unchanged |

`vale sync` remains the precondition, and **the reading must be taken with a repo-relative
path** — see Part G.

## Re-sign-off

The user signs this amendment before `writer` runs. The cycle then re-enters at step 2, scoped to
`handoffs.md` alone.
