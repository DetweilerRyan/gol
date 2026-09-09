# Article: The ast-grep Structural Rules

**Audience:** architect, hardener

**Read when:**

- before authoring or narrowing a `rules/*.yml`
- on an `agent-doc-check` check-5 failure
- before acting on an ast-grep finding

> The per-rule arguments are in `ast-grep-rules.rationale.md`. It holds what each rule matches, how each
> was verified, and why each is scoped as it is. It also holds the two rules documented outside the main
> enumeration.
> Narrowing or widening a rule **is** changing one, so that is when to open it.

## The rules

Thirty-one, and this list is what `npm run agent-doc-check`'s check 5 reads:

`no-react-in-domain`, `no-dom-in-domain`, `no-build-env-in-domain`, `no-ambient-time-in-domain`, `no-module-state-in-domain`, `domain-imports-upward`, `no-manual-memo-ts` / `no-manual-memo-tsx`, `no-logic-in-composition-root`, `no-overlays-inside-grid-content`, `no-camera-in-cell-leaf`, `no-tile-policy-in-components`, `no-value-import-across-perf-boundary`, `no-aliveness-by-paint-class`, `no-test-support-in-product-ts` / `no-test-support-in-product-tsx`, `no-domain-imports-in-bdd-steps`, `no-domain-imports-in-e2e-specs`, `no-ruler-axis-by-paint-class`, `no-unbraced-accessible-name`, `no-unbraced-name-from-contents`, `no-store-in-cell-components`, `no-playwright-config-import-in-mutation-config`, `no-cucumber-parser-outside-adapter`, `no-fast-check-outside-property-file-ts` / `no-fast-check-outside-property-file-tsx`, `no-dom-surgery-in-components`, `no-barrel-import-in-screenplay`, `no-expect-in-screenplay-questions`, and — documented outside the main enumeration, in the sidecar — `no-dead-doc-on-annotated-return-literal` and `no-downward-import-in-scripts`.

**The sidecar's enumeration follows this same order.** Search it for the rule id rather than reading it
through. It is one 29,809-byte sentence, and that is how it is meant to be used.

**Re-derive this list against `rules/` rather than trusting it.** It is an enumeration of another
directory's contents, and `ls rules/*.yml | wc -l` is the check.

## What the gate does and does not buy

**A rule added to `rules/` and not named in this article reds check 5.** CLAUDE.md carries no rule list
at all, deliberately — two hand-maintained copies of one list is the shape this repo distrusts.

The check is satisfied by **any** backticked mention of the id anywhere in this file, the list above
included. So "every rule is named here" is gated; **"every rule has an argument behind it" is
convention**. No regex can decide what counts as an argument, so when you add a rule, add its argument
to the sidecar by hand.

## Reading a finding

**ast-grep is report-only for findings.** Every rule is `severity: warning`, so a rule matching your code
does not move the exit code — read the output rather than `$?`. Promote one to a gate by changing it to
`error`.

**The exit code answers a different question, and a nonzero one always warrants investigation.** Measured
against ast-grep 0.45.1: **8** means a rule file failed to parse, **1** means an `error`-severity rule
matched.

**Read the rule's own `note:` field in `rules/<id>.yml` before acting on its finding.** Several rules ban
something narrower than their name suggests — `no-dom-surgery-in-components` is not "no DOM in a
component", and reading the DOM is sanctioned. The rule file is the live source; a summary here would
drift from it.

## Authoring a rule

**Every rule ships with a fixture in `rule-tests/`, and `npm run ast-grep:test` must pass.** This is not
ceremony. **A malformed ast-grep rule matches nothing and reports nothing — it looks exactly like a
clean codebase.** Two of these rules were silently inert when first written. **A rule with no failing
fixture has not been shown to work.**

Four things that make a rule inert, all of them measured:

- **A metavariable does not interpolate inside a string literal.** An import path needs `kind:` +
  `regex:`, not a pattern.
- **A `matches:` util is bound to one language**, so it never applies to the `.tsx` files a rule may
  exist to check.
- **TypeScript and TSX use different parsers.** That is why `no-manual-memo-ts` and `-tsx` are
  near-duplicates by necessity rather than oversight — and why a rule declared for the wrong one matches
  nothing and reports nothing.
- **A `files:` glob that resolves to nothing.** `npm run ast-grep:rules` fails it, which is the check
  that catches this class.
- **A missing or misspelled `severity:` key**, which silently demotes the rule to `help` and exits 0.
  `npm run ast-grep:rules` checks that too.

**That list is derived from `npm run ast-grep:rules`'s own checks, and CLAUDE.md describes them in
full.** Four more are not restated here. `id` must match the filename, ids must be unique, an `invalid:`
case is required, and a fixture binds to a rule by its `id` rather than its filename. **Read CLAUDE.md's
`ast-grep-rule-check` entry before authoring**, rather than treating this list as the whole obligation.

**One glob asymmetry to write around.** ast-grep's `*` **crosses `/`**; `npm run ast-grep:rules` resolves
`files:` globs with `node:fs`'s `globSync`, whose `*` does **not**. So `src/*.test.tsx` is live for the
scanner and resolves to nothing for the checker, which fails it. Write the `**` form. The checker is
stricter than the scanner rather than wrong, and it fails safe.

**Authoring a rule ahead of the directory it scopes is sanctioned, and carries a standing bargain.** The
fixture proves the matcher. A live probe proves the `files:` glob once the target exists. An
`allow-unresolved-files` marker makes the debt visible in between, and `npm run ast-grep:rules` reports
that marker as stale the moment the glob resolves.

> **A presence-only rule — "every export carries a doc" — was proposed and rejected.** It cannot tell
> whether a summary says anything, and an empty `/** */` satisfies it. See the sidecar before
> re-proposing it.

**One entry deliberately restates another article.** The `no-fast-check-outside-property-file-ts` /
`-tsx` argument summarises the Stryker seed-pin mechanism; **`mutation-testing.md` is the source of truth
for it, and if the two disagree that article wins.**
