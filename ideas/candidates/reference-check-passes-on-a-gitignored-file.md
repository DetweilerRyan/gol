---
name: reference-check-passes-on-a-gitignored-file
title: Explain why reference-check resolves a token naming a gitignored file
created: 2026-09-10
---

## Situation

`.claude/agents/articles/prose-linting.md` and its rationale sidecar both cite
`.vale/STE/Contractions.yml` by name. `.vale/` is gitignored — it holds the style package that
`vale sync` downloads — so its basename should be absent from
`git ls-files --cached --others --exclude-standard`, which is the tree `file-reference-resolves`
resolves against.

`npm run reference-check` passes anyway. Found by `architect` during the `lint-pass-regressions`
review; not investigated.

## Complication

**Either the checker is more permissive than CLAUDE.md says, or the exclusion does not work the way
the docs describe.** Both readings matter:

- If `--others --exclude-standard` is listing the file despite `.gitignore`, then the checker's
  notion of "the live tree" is wider than documented, and CLAUDE.md's description of it is wrong.
- If the token is not being extracted at all, then a whole class of citation is silently unchecked,
  and this one only looks fine by accident.

**The second reading is the dangerous one**, and it is the same shape as the leading-dot discard that
`check-md-references` left behind: a citation form that reads as verified and is not.

## Question

Which of the two is happening, and does it leave a citation class unchecked?

## Answer

Unknown. This is a measurement slice before it is a fix slice.

Probe in order: run `git ls-files --cached --others --exclude-standard | grep -c Contractions.yml`;
call `extractFileTokens` directly on the citing line; then plant a citation of a file that certainly
does not exist under a gitignored path and see whether the gate reds.

Only then decide whether anything needs changing. It is entirely possible the right answer is a
sentence in CLAUDE.md correcting how the live tree is described.

## Touches

- `scripts/reference-check/` — reading, and a test only if a defect is confirmed
- `CLAUDE.md`'s description of `file-reference-resolves`, if that is what is wrong
- `.claude/agents/articles/prose-linting.md`, if the citation form has to change

## Open questions

- **Are there other citations of gitignored paths?** `reports/`, `coverage/`, `node_modules/` and
  `dist/` are all cited in the docs somewhere. If those resolve too, the permissive reading is more
  likely, and the docs are the thing to fix.
- **Does this interact with the `.vale/` bootstrap?** A fresh worktree has no `.vale/` at all until
  `vale sync` runs, so the same citation may resolve or not depending on whether setup has happened —
  which would make the gate's result depend on machine state.
