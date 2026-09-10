---
name: self-revocation-cites-a-paragraph-that-contradicts-it
title: Repair the self-revocation clause, whose motivating example the acceptance-project removal falsified
created: 2026-09-10
---

## Situation

CLAUDE.md's mutation-invariance section carries a self-revoking clause: if `hardener`'s own
remediation writes a file outside the allowlist, the exemption is void and stage 5 runs.

It motivates that with a worked case — _"stage 5 is skipped, stage 6 then legitimately moves (see the
paragraph above), and `hardener`'s standing duty is to close a coverage shortfall with a test under
`src/`"_.

**The paragraph it cites now says the opposite.** That paragraph records that
`delete-step-test-layer` removed the `acceptance` project, so `coverage/coverage-final.json` holds
zero `features/` entries, and an allowlist-only diff therefore moves **neither** `crap4ts` nor
`dry4ts`. Stage 6 cannot legitimately move on such a diff.

Found by `architect` during the `lint-the-routing-index` review, and ratified as report-only during
`close-the-pointer-drift`.

## Complication

**It fails in the safe direction, which is why it is a candidate and not a stop-work.** The operative
rule is unaffected: remediation outside the allowlist voids the exemption and stage 5 runs. A reader
following the rule still runs the gate. Only the example is wrong, so the clause confuses rather than
mis-routes.

**But it is a false statement inside the most safety-critical prose in the repo**, in the file every
session and every subagent auto-loads, and it will read as authoritative to whoever meets it next.

**The obvious repair may be wrong.** Deleting the example leaves the self-revocation without a
concrete trigger, and the clause exists precisely because an abstract prohibition was not enough. The
better repair is probably a **replacement** example — some other stage that can still move on an
allowlist diff, and `npm run build` and `npm run agent-doc-check` are the two the same paragraph
names — rather than a deletion.

## Question

What is the real remaining trigger for self-revocation, now that stage 6 is not one?

## Answer

Unknown, and worth deriving rather than assuming. The candidates the same section already names:

- **`npm run build`** — `tsconfig.app.json`'s `include` is `["src", "features", "perf"]`, so a type
  error a `features/`-only diff introduces is a real stage-1 failure, and its fix can reach `src/`.
- **`npm run agent-doc-check`** — moves on the `.claude/**` and `CLAUDE.md` entries, but its
  remediation is prose, which cannot reach `src/`.

So stage 1 looks like the surviving trigger and stage 8 does not. If that holds, the clause should
name stage 1 — which is also what `hardener.md`'s own copy of this reasoning already says.

**This section is owned elsewhere.** A worktree named
`the-invariance-allowlist-omits-paths-that-provably-cannot-move-a-mutant` was open on exactly this
reasoning while the rollout ran. Whoever holds that work should take this rather than a separate
slice editing the same paragraphs.

## Touches

- `CLAUDE.md`, the mutation-invariance section only
- `.claude/agents/hardener.md`'s stage 5, if its copy needs to agree

## Open questions

- **Is stage 1 the only surviving trigger?** Derive it rather than reasoning from the list above; the
  paragraph that falsified the old example was itself a re-derivation after a project was deleted.
- **Should the clause carry an example at all?** An example that a later slice can falsify is what
  produced this defect. A clause stated without one cannot go stale, but is weaker to follow.
