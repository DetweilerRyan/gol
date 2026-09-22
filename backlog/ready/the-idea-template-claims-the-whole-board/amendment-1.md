# Amendment 1: the-idea-template-claims-the-whole-board

By `coach` (SPEC), 2026-09-22.

## Item numbers this amendment names

**Item 9**, new. It adds an obligation the signed spec missed.

**This amendment supersedes no spec item.** Items 1 to 8 stand exactly as signed, item 4
included. Nothing here replaces a block, so the rule about naming every obligation a replaced
block carried has nothing to act on.

Item 9 is numbered into the spec's own sequence rather than as `4b`, because item 4 landed
correctly and completely for the paragraph it named. A sub-number would read as a correction to
it.

## Why this amendment exists

`writer` returned a spec point it could not execute: `.claude/references/pipelines.md` carries a
live citation of `backlog/TEMPLATE.md` that no item in the spec names. Item 1 has landed, so the
file that token names no longer exists. The citation is stale now, on
`the-idea-template-claims-the-whole-board`'s branch.

Neither gate reports it, for the reason the spec already gave. Measured by `coach` on the branch
tip, 2026-09-22: `npm run reference-check` reports 546 files, 3229 references, no failures.
`adr/TEMPLATE.md` absorbs the basename.

## R11 — the edit is a token substitution, and the surrounding sentence needs nothing more

The new name carries the lane, so the question is whether a sentence about a `ready/`-lane file
can still point at an `ideas/`-lane template without explaining itself. It can, and the rename
improves it rather than straining it.

The paragraph's own first clause is the justification: `proposal.md` **is the promoted idea
file**. The shape follows the file across the lane move. Under the old neutral name that link was
invisible, because `TEMPLATE.md` named no lane. Under `IDEA-TEMPLATE.md` the noun appears on both
sides of the sentence, and a reader joins them without help.

Adding a lane clause here would copy CLAUDE.md's definition site, which item 2 has already
written. A pointer cannot go stale and a copy drifts, so no clause is added.

## R12 — the three pathless references stay, and each was read rather than assumed

A filename-token sweep cannot see a reference that names no path, so `coach` swept the phrasings
separately on the branch tip, 2026-09-22:
`git grep -in 'idea.file shape\|idea template\|item shape\|the template' -- CLAUDE.md .claude adr scripts`.

Three live instances sit outside `backlog/`, and none is stale:

- `.claude/skills/idea-capture/SKILL.md`'s frontmatter `description` — "in the template's shape".
  The signed item 5 names it already and rules it untouched.
- The same file's step 3 — "Write the candidate in the template's shape." Its referent is step 2's
  path, which item 5 corrected.
- CLAUDE.md's "Only `proposal.md` carries the idea-file shape", four lines above the paragraph item
  2 replaced.

The third is a vocabulary question rather than a stale path. Three phrasings now name one shape —
"the idea-file shape", "the `ideas/` lane's item shape", and "the shape `IDEA-TEMPLATE.md`
states" — and none of the three is false. R6 closed further edits to CLAUDE.md's Idea board
section and the user signed that ruling. Re-opening a signed ruling to trade one true phrasing for
another is the wrong price, so it stays. What would reopen it is a reader misled by the
difference, and nobody has observed one.

## Item 9 — the pipelines reference, the per-item-artifact paragraph — `writer`

**This is not the paragraph item 4 edited.** Item 4's paragraph opens
`**The kinds are not a closed set.**` and has already landed. Item 9's paragraph sits further up
the same section, and the two are separate.

**Anchor.** In `.claude/references/pipelines.md`, under the heading
`## Per-item artifacts — the shape they owe`, the first paragraph — the one opening with the words
"A `ready/` or `done/` item is a folder." It carries the only remaining `TEMPLATE.md` token in that
file.

It reads:

```text
A `ready/` or `done/` item is a folder. `proposal.md` is the promoted idea file, and it keeps
the shape `backlog/TEMPLATE.md` states. Every other file in that folder is a **per-item
artifact**, and it owes that shape nothing.
```

**Replace that whole paragraph with:**

```text
A `ready/` or `done/` item is a folder. `proposal.md` is the promoted idea file, and it keeps
the shape `backlog/IDEA-TEMPLATE.md` states. Every other file in that folder is a **per-item
artifact**, and it owes that shape nothing.
```

The only change is `TEMPLATE.md` to `IDEA-TEMPLATE.md`. Keep the three line breaks where they are,
and change no other byte.

Measured 2026-09-22, two probes, both in a throwaway tree carrying this repo's `.prettierrc.json`,
`.vale.ini`, `vale-styles/` and `.vale/`:

- Prettier returns the replacement byte for byte. `proseWrap` is at its default `preserve`, since
  `.prettierrc.json` sets it nowhere, so the five added characters cannot reflow the paragraph.
- Vale reports nothing on the replacement under the `[.claude/references/**/*.md]` section. The
  probe was shown to discriminate: a deliberately long numbered step at the same path fired
  `Procedure.ProcedureLength`, so the zero is a measured zero rather than an unreached path.

## The census correction

**The signed spec's citation-census bullet is wrong, and it is corrected here rather than in the
spec.** The signed bytes stay as signed.

Measured by `coach` 2026-09-22, at commit `7778324` — the spec commit, before item 1 landed:
`git grep -n 'TEMPLATE\.md' 7778324 -- . ':!backlog'` returns **ten lines in seven files**, not
nine.

| File                                             | Lines | Disposition in the signed spec |
| ------------------------------------------------ | ----- | ------------------------------ |
| `CLAUDE.md`                                      | 1     | item 2                         |
| `.claude/skills/idea-capture/SKILL.md`           | 1     | item 5                         |
| `.claude/references/pipelines.md`                | 1     | none — item 9 above            |
| `scripts/board-shape-hook/board-shape.meta.md`   | 1     | item 8A                        |
| `scripts/board-shape-hook/board-shape.test.ts`   | 2     | item 8B                        |
| `.claude/references/definition-of-ready.meta.md` | 3     | out of scope, dated records    |
| `adr/README.md`                                  | 1     | out of scope, No-go 4          |

**The file count was right and the token count mixed its units.** The spec's breakdown — "three
are live prose, two are `scripts/`, three are dated records … and one is `adr/README.md`" — sums to
nine only if the `scripts/` term counts files while every other term counts lines. Under one unit
throughout the figure is ten lines, or seven files, and never nine.

**The class of error, stated so it can be avoided rather than only fixed: a per-file
reconciliation cannot show a second token inside a file an item already names.** The item set is
organised per file, and `pipelines.md` is already named by item 4. Checking the census against the
item set file by file therefore reported full coverage. `board-shape.test.ts` escaped the same trap
only because item 8B counted its two occurrences out loud.

**Two sweeps were re-derived rather than inherited**, and both are above: the per-line census in
the table, and R12's phrasing sweep for references that carry no filename token. `pipelines.md` is
the only omission either found.

## What the spec's other sections owe, and what they do not

**"Check readings" is confirmed, not corrected.** Its "What cannot move" paragraph named the exact
mechanism that hid this token, and named it correctly: `reference-check` matches by basename and
`adr/TEMPLATE.md` keeps resolving the old one. Re-measured green on the branch tip with the stale
citation live. The spec's 3227 references and the tip's 3229 differ by items 2 to 5's own new
citations, and neither reading can move on item 9's edit.

**Item 9 adds no row to that table.** Two existing rows cover it, both re-measured 2026-09-22:
`npm run prose-lint -- --scope .claude/references` reads 1 finding, in `merge-protocol.md`, before
and after; `npm run format:check` reads clean before and after.

**"Out of scope" stays as written.** Both its rulings stand — `adr/TEMPLATE.md` keeps its name, and
the three dated tokens in `definition-of-ready.meta.md` are records rather than oversights. It
never claimed the swept set was complete, and item 9 is the one file it omitted.

**"Recommendations" stands, and its first bullet is now better evidenced.** The basename spike it
recommends has a second measured instance inside the same slice: a stale citation of a renamed file,
reading green, in a file the slice was already editing.

## Execution

**Run item 9 in `writer`'s next pass, alongside items 6 and 7.** It is one token in a file
`writer` already writes, and a pass of its own would buy a second `editor` CLEAN round for a
five-character edit.

There is no ordering dependency. Item 4 landed on a different paragraph of the same file, so item 9
neither waits on it nor conflicts with it. `editor` CLEAN then reads one manifest covering 6, 7 and 9.

## Sign-off

**Unsigned.** The user rules on this amendment before `writer` re-enters. Item 9 carries no
authority until then, and items 1 to 8 keep the authority the spec's own signature gave them.

The ruling most worth overturning is **R11** — whether the pipelines sentence should say more than
the renamed token, now that the name carries a lane the sentence does not mention.
