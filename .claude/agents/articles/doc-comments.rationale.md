# Rationale: Doc Comments

**Audience:** whoever is changing a rule in `doc-comments.md`. **Read when:** you are amending, narrowing or overturning one of those rules — never in order to follow one.

No role carries a read trigger for this file, and that is the point. `doc-comments.md` is written to be actionable on its own; this file holds the evidence behind it, so that a rule can be argued with rather than only obeyed. The precedent is `archive.md`, which is likewise research material no role is told to read.

Everything below is history: what was measured, when, by what method, and what was rejected. It is written in the past tense deliberately — a dated past measurement claims history and cannot rot, which is the escape hatch `engineering.md`'s claim-discipline section describes.

## Why the split rule exists at all

**The identity example in rule 3, written out.** `nextTileRange` returns `previous` _by reference_, and the signature it hides behind is `(previous: TileRange, …) => TileRange` — which states none of it. That signature is why the rule names identity guarantees first.

**The channel table, measured when the article was authored:**

|                                           | `//` block        | JSDoc block               |
| ----------------------------------------- | ----------------- | ------------------------- |
| `LSP` hover at the declaration            | bare signature    | full prose, tags rendered |
| `LSP` hover at a **cross-file call site** | bare signature    | full prose, tags rendered |
| `tsc --emitDeclarationOnly`               | stripped entirely | preserved verbatim        |

**The before-state that motivated the sweep.** `nextTileRange` carried a 113-line `//` block and hovered as a bare signature at its cross-file call site in `src/hooks/useCellTiles.ts`, while `isStrictEqual` hovered as its full prose plus its `@see` link. Every role carries `LSP`; none could see the first one's reasoning without opening the file. This is a record of the gap, not a live defect.

**Ousterhout is the governing source.** _A Philosophy of Software Design_ separates the two kinds of comment:

> Interface comments provide information that someone needs to know in order to use a class or method; they define the abstraction. Implementation comments describe how a class or method works internally.
>
> If a user must read the code of a method in order to use it, then there is no abstraction.

That last line **is** the token argument, stated years before agents existed.

**The between-position was measured rather than assumed.** `/** … */`, then a `//` block, then the declaration: the JSDoc still reaches a cross-file hover, tags and all. This is what the repo's sweep actually landed in 36 places. The failure mode had it severed would have been the silent one — a bare signature, indistinguishable from no doc having been written — which is why it was measured before being sanctioned.

**Why "already JSDoc" is not a reason to skip a file.** When the article was authored, `src/equality/is-deep-equal.ts` carried a 22-line JSDoc whose middle paragraph was pure implementation rationale sitting on the hover channel — "`isDeepEqual` is its own leaf comparator here — `structurallyEqual`'s own initial short-circuit…" — and `Cache.insert` in `src/cache.ts` hovered at roughly 30 rendered lines carrying a misspelled `@remark` that renders as an empty tag, an `@todo` about a future API, and two bare `@param`s that name the parameters and say nothing.

## The scope rulings, and who made them

Both rulings in `doc-comments.md`'s Scope section are dated 2026-09-06 and were made in the `jsdoc-standing-rule` DESIGN pass, on the user's direction that the standing duty be split across `coder`, `cleaner` and `architect`.

**On `hardener` carrying no trigger.** It reaches the governing rule through `engineering.md`, so nothing is blind; what it lacks is a second, redundant pointer. A previous `hardener` flagged the audience line as arguably naming it and correctly declined to edit its own scope; the ruling in the instruction file is the answer, so the next one finds a ruling rather than a gap.

**On `features/**`.** The seven `features/screenplay/*.ts` modules export 97 symbols that the step modules import — genuine cross-file call sites, the exact position the article is written for — and `coder`'s workflow step 2 has it _reading_ `features/steps/*.ts` to learn what the contract asserts, which is the read hover exists to replace. What `slice/jsdoc-standing-rule` did **not** do is write a duty into `product.md` or backfill `features/`: role files change only on explicit user direction, and the direction behind that slice named three roles, none of them `product`. Carried into that slice's handoff as a follow-on.

## The tag table: why five, and why closed

**The closure follows from the information test one level up.** A block tag's hover payload is its own label, and a label earns its rendered line only when it tells a caller something the prose alone could not. The five do — an error contract, a binding to a named parameter, the returned value's conditional meaning, a pointer out of the file, a call protocol.

**`@remarks` does not, and was rejected twice.** Measured, it renders inline as `*@remarks* — <text>`, so the only thing the tag adds over writing the same words as a second paragraph is a label meaning "detail rather than summary" — a distinction a documentation _generator_ honours and a hover does not. It is not quite free either: prose renders the same content one label cheaper. Kept as a follow-up candidate (`hover-carries-detail-no-reader-asked-for`), since a generated docs pipeline is the only thing that would make the distinction pay.

**Why the linter cannot enforce the table.** `.oxlintrc.json`'s `jsdoc/check-tag-names` gates a misspelled tag, a non-JSDoc tag, the TypeScript-redundant family, and five tags explicitly — `@remarks` and `@defaultValue` because they are not JSDoc vocabulary at all, `@deprecated`/`@internal`/`@todo` through an explicit ban. The table is an allowlist of five against a ~65-tag vocabulary, and oxlint offers only an additive `definedTags`.

**`@deprecated` is the likeliest future candidate for the table**, because it has real language-server semantics — a strikethrough at the call site — rather than a generator convention behind it. It still needs the measurement and the ruling.

**One measured limit on `@param`'s value here.** The `LSP` tool's operation set is `goToDefinition`, `findReferences`, `hover`, `documentSymbol`, `workspaceSymbol`, `goToImplementation`, `prepareCallHierarchy`, `incomingCalls`, `outgoingCalls` — **there is no `signatureHelp`**, so `@param`'s editor payoff (per-parameter hints while typing) does not reach an agent in this repo. For us it is one more hover line whose value is disambiguation, not a second surface.

**On prose after a block tag.** Measured: a paragraph written after a `@throws` (`Cache.remove`'s "Removing mid-iteration invalidates that iteration…") renders inside that tag's block, below its text — TS reads everything up to the next tag as the tag's own comment text. It still reads as its own paragraph, so this is attribution drift rather than a hazard, but a fact about the whole function sitting under `@throws` looks like a fact about the throw.

## The `@see` form: four rejected alternatives

TypeScript parses the token after a `@see` as an entity name, which mangles a bare path:

| written                           | rendered in hover             |                                                 |
| --------------------------------- | ----------------------------- | ----------------------------------------------- |
| `@see ./cellTiles.md`             | `@see — . /cellTiles.md`      | **mangled** — space injected after `.`          |
| `@see src/cellTiles.md`           | `@see — src /cellTiles.md`    | **mangled** — space injected after `src`        |
| `@see cellTiles.md`               | `@see — cellTiles.md`         | clean, but says nothing about where the file is |
| `` @see `./cellTiles.md` ``       | ``@see —  `./cellTiles.md` `` | clean, with stray backticks and a doubled space |
| **`@see {@link ./cellTiles.md}`** | **`@see — ./cellTiles.md`**   | **exact — this is the mandated form**           |

All five survive `tsc --emitDeclarationOnly` verbatim, so this is purely a hover-rendering ruling. **The plain `@see ./name.md` form was the one predicted to work during planning, and `{@link}` the one predicted to render unresolved for a relative Markdown path. The measurement is the reverse of both.** When `{@link}` _can_ resolve a target it links it, which is why a `{@link Cache.has}` renders as a clickable file link instead.

## The member and return-type measurements

**An interface's own JSDoc does not reach a member hover:**

```
interface DocumentedInterface {          hover on it.memberWithoutDoc  → bare signature
  memberWithoutDoc(v: number): number      (even though the interface above it carries prose)
  /** The member's own contract. */      hover on it.memberWithDoc     → "The member's own contract."
  memberWithDoc(v: number): number
}
```

**Sizing the surface.** Measured when the article was authored, `src/` (excluding `catalyst/`, including `test-support/`) held roughly 195 exported declarations and 128 interface/type members, against about 84 existing comment blocks.

**Why "every block, not the exported slice".** Sizing a sweep by "blocks directly above an exported declaration" undercounts it by about 3x — which happened three times running while surveying `scripts/`: `acceptance-mutation/` was billed 12 files / 253 comment lines and came in at 14 / 950, `agent-doc-check/` 3 / 67 against 8 / 222, `ast-grep-rule-check/` 4 / 66 against 6 / 211. Measured over the 45 files `jsdoc-in-scripts` touched: **94 of 217 pre-sweep comment blocks, and 712 of 1838 comment lines (39%), sat directly above an `export`.** The other 61% were module headers, blocks above non-exported helpers, blocks above module-private constants, and in-body blocks — each of which still had to be read and ruled on.

**The hook return-type table.** Measured cross-file on four probe pairs (eight files) the server had not read, hovering each action at a **destructured** call site:

| the hook's return type               | doc above the implementing declaration                    | doc on the `return { … }` shorthand property | doc on the named interface's member       |
| ------------------------------------ | --------------------------------------------------------- | -------------------------------------------- | ----------------------------------------- |
| **inferred** (a bare object literal) | **reaches** — and outranks a property doc when both exist | **reaches** when it is the only one          | n/a                                       |
| **named** (`(): CellTilesView`)      | **severed** — bare signature                              | **severed** — bare signature                 | **reaches** — and outranks a property doc |

**The severing condition is _an_ annotation, not a _named_ one.** Measured a slice later, cross-file at a destructured call site, on a fresh file pair:

| the function's return type                    | doc on the `return { … }` property |
| --------------------------------------------- | ---------------------------------- |
| `(): { alpha: number }` — inline type literal | **severed**                        |
| `(): View =>` — annotated arrow               | **severed**                        |
| none — inferred (**the control**)             | **reaches**                        |

The third row is the control rather than a bonus data point. An earlier round of the same three probes returned `any` for all three, because the server had not yet resolved the import — a bare-signature answer that reads exactly like "severed", which is the false negative any measurement in this direction is exposed to. All three hovers were taken from one file in one round, and the inferred one came back carrying its sentinel prose; that is what makes the two severed readings evidence rather than silence.

**`async` and `Promise<T>` sever it too.** This closed a hedge rather than adding a curiosity: it used to sit in the unmeasured list while `rules/no-dead-doc-on-annotated-return-literal.yml` reported the shape as severed anyway. One probe module and one caller, both fresh, every reading in one round, hovering `const { alpha } = await f()`:

| the function's return type                    | doc on the `return { … }` property |
| --------------------------------------------- | ---------------------------------- |
| `async f(): Promise<View>`                    | **severed**                        |
| `async f()` — no annotation                   | **reaches**                        |
| `f()` — no annotation, sync (**the control**) | **reaches**                        |

The second row is its own new cell rather than a restatement: `await` alone does **not** sever a property doc, so it is the annotation doing the work exactly as it does synchronously. The first row also came back typed as `View.alpha` rather than `any`, a second independent sign the import had resolved. The remedy holds under `async`: a doc on `View`'s own member, read through the same `await`, **reaches** — so the placement rule needs no async arm.

**Re-exports and destructured exports.** Six cells, each measured cross-file on fresh probe files, hovering the symbol two modules downstream of the declaration:

| measured                                                                     | result                               |
| ---------------------------------------------------------------------------- | ------------------------------------ |
| doc above `export type { X } from './source'`                                | **severed**                          |
| doc on the original `interface X` that line re-exports                       | **reaches**                          |
| doc on the original `const x`, re-exported by `export { x } from './source'` | **reaches**                          |
| doc above `export const { a, b } = bag`                                      | **severed** — at the declaration too |
| doc on `bag`'s own declaration                                               | **severed** at `a`                   |
| doc on `bag`'s longhand property, `{ /** … */ a: 1 }`                        | **reaches** at `a`                   |

Where the original is third-party there is no site at all, which is why `scripts/acceptance-mutation/gherkin-document.ts` leaves both of its blocks `//`: it re-exports AST node types from `@cucumber/messages` and parse-error classes off `@cucumber/gherkin`'s `Errors` namespace, and this repo owns neither declaration.

**The last row is not the longhand caveat.** That one is about _precedence_ between a declaration's doc and a property's doc inside a hook's return literal; nothing in this table puts two docs in play, so it measures reach only.

### Deliberately unmeasured

- **Where the doc should go when the annotation is an inline type literal.** The type literal has a member position, but nothing measured says a doc on it reaches.
- **Longhand `name: fn` property precedence.** The declaration-beats-property row was measured for **shorthand** properties, at module scope and inside the hook body alike. A longhand property was not measured.
- **`{@link}` inside `@param`'s own type slot** (`@param {@link X} value`).
- **`@example`.** On `jsdoc-in-src`'s tree, `src/` contained no `@example` at all — the budget's highest-variance construct was simply absent. `grep -rn '@example' src` answers whether that still holds.

### Why the machine-checkable rule is narrow

A presence-only "every export carries a doc" rule was proposed in the same pass and **rejected**, because it cannot tell whether a summary says anything and is satisfied by an empty `/** */`. The rule that did land depends on `stopBy` for its precision; `ast-grep-rules.md` carries the matcher.

### A correction, kept because the mechanism is what a later reader reasons from

Batch 4 of the `jsdoc-in-src` sweep recorded that a declaration's JSDoc does not reach a destructured caller, and that is what motivated the return-literal placement in the first place. Measured later, it **reaches**, and it outranks the property. The branch never carried a JSDoc above `stampArmedPattern`'s declaration at all, so the bare signature that was seen was a `//` block hovering exactly as designed, or the stale-hover trap — suspected, not measured, and it does not matter which. **The placement that reading produced is correct, for the reasons above; the mechanism behind it was not.**

## The syntax-hazard measurements

**Every case measured on this tree is explained by one rule** — a tag is recognized wherever `@` is preceded by whitespace — **with one measured class of exception**, a `{@link …}` in a block tag's leading type slot, where the brace-preceded `@` is parsed as a tag anyway.

| in a JSDoc block                                                     | parsed as a tag?                                        |
| -------------------------------------------------------------------- | ------------------------------------------------------- |
| `see the @see convention for details` (mid-line, space-preceded)     | **yes** — prose splits, remainder becomes tag text      |
| `the @fast-check/vitest package` (mid-line, space-preceded)          | **yes** — renders as `@fast-check` + `/vitest`          |
| a line beginning `@fast-check/vitest` **inside a fenced code block** | **yes** — a code fence is _not_ a safe harbour          |
| ``the `@fast-check/vitest` package`` (backtick-preceded)             | no — **this is the escape to use**                      |
| `reachable at foo@bar.com` (letter-preceded)                         | no                                                      |
| `import { thing } from '@scope/package'` inside an `@example`        | no — the quote precedes the `@`                         |
| `the \@fast-check/vitest package` (backslash-preceded)               | no, but the `\` renders literally — **do not use this** |

**Why the linter closes only half of it, and not the surprising half.** Measured: oxlint's JSDoc parser recognises a tag **only at the start of a JSDoc line** (leading whitespace tolerated) and is blind to a mid-line one, while the whitespace rule above is TypeScript's and holds anywhere in the block. `jsdoc/check-tag-names` therefore catches a line-leading `@fast-check/vitest`, including one inside an `@example` fence, and lets rows 1 and 2 through in silence.

**The type-slot table**, measured cross-file on a probe file the language server had not previously read:

| written                                                                         | rendered in hover                                                  |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `@param {number} value …`                                                       | type **stripped**, renders clean                                   |
| `@returns {TileRange} …`                                                        | type **stripped**, renders clean                                   |
| `@throws {CacheError} …`                                                        | `{CacheError}` **literally, braces and all, no link** — do not use |
| `@see {CacheError}`                                                             | `{CacheError}` literally, same leak as `@throws`                   |
| **`@throws CacheError …`**                                                      | **`CacheError`, clean — this is the mandated form**                |
| `@throws {@link CacheError} …`                                                  | **broken** — a stray `{`, then `@link` parsed as its own tag       |
| `@returns {@link CacheError} …`                                                 | **broken** — worse: the `@returns` text is lost entirely           |
| `@param value {@link CacheError} …` (after the name, outside the type slot)     | the link resolves                                                  |
| `@throws CacheError … guard with {@link Cache.has} first` (mid-prose)           | the link resolves                                                  |
| `@see {@link ./cellTiles.md}`                                                   | resolves — the mandated form, and `@see`'s own special case        |
| `@see {@link tileRangeHolds} for the asymmetry this permits` (link, then prose) | resolves, and the trailing prose renders after it — measured       |

**The rows that matter most are the two broken ones**, because a leading `{@link}` is exactly what a reader deduces from "braces leak, but `{@link}` resolves". It does not: TS tries the type slot first, `{@link …}` is not a type, and the `@link` behind the brace is picked up as a block tag despite being brace-preceded — the one measured place the whitespace rule does not hold. `@see` is the exception to the exception, special-casing `{@link}` while still leaking a plain `{Type}`.

**On the blank-line rule.** Measured: a `/** … */` block, then a blank line, then `export function afterBlankLine` — the block still reaches that function's hover at a cross-file call site. The `//`-block half was measured on a probe file the server had not read, at a cross-file call site, and is what the between-position rests on.

**Worked example of the leading-`//`-block judgement.** `src/test-support/lifeReference.ts` and `src/test-support/arbitraries.ts` are the joint kind and correctly stay `//` — "reference implementations of the two things the Life model derives", "arbitraries shared by the property tests of the camera-side modules" are claims about the file, true of every export in it and of none in particular. `src/test-support/scrollbarQuery.ts`'s 32-line opener reads like the same thing and is not: four separate concerns stacked above one export, which partition into a three-paragraph JSDoc on that export and a three-paragraph `//` block under it, two of the four having split down the middle.

**On `// prettier-ignore` coexistence.** Measured on a 126-character signature that Prettier reformats when the directive is removed: with the directive present, `npx prettier --check` stays clean and hover returns the full JSDoc **both** when the directive sits above the JSDoc and when it sits between the JSDoc and the declaration. Both were green; the mandated ordering is a readability ruling, not a correctness one. If a future TypeScript or Prettier upgrade breaks one, that is a change against this record rather than evidence the convention was wrong.

## The hover-staleness measurements

**Same-tree staleness.** Measured on `jsdoc-in-src`: editing a JSDoc block in `src/cache.ts` and immediately re-hovering its cross-file call site returned the _pre-edit_ rendering; a sentinel word added to the summary is what distinguished staleness from the edit having failed.

**Cross-rebase staleness, which is the form that manufactures a false defect.** Measured during `jsdoc-in-src`'s REVIEW pass: hovering `toggleLibrary` at `src/hooks/usePatternPlacement.ts`, on an **absolute** path, in a file that session had not edited, returned the module's _pre-correction_ comment — text that `main`'s commit `8611351` had replaced because it asserted a false mechanism. That text was then confirmed to exist in **neither** tree and, by `grep`, **nowhere on disk outside `.git/`**. The server was answering from a copy predating a rebase.

Read the consequence carefully, because it inverts the usual advice: the same-tree staleness makes you think your edit failed; this one makes you think **someone else's code is wrong** — the hover reads exactly like a live defect, and the more alarming the finding, the more it looks worth reporting.

**Cross-tree misrouting.** Measured from a slice worktree: `hover` on the **relative** path `src/hooks/useCamera.ts` at 25:9 returned `const glide: ZoomGlideController` — which is what stands at that position in the **main checkout's** copy, and is not what stands there in the worktree's (a `[` inside a destructuring pattern, which the same position under an absolute path correctly reports as no symbol). A relative path that exists in **neither** tree errors cleanly (`File does not exist`, measured); a path that exists in **both** silently answers about the wrong one, and since the two copies agree everywhere the slice has not touched, that wrong answer is right most of the time.

**Why `Bad line number` is not the diagnostic for a misroute.** Measured on the same pass, on a correct **absolute** path: a path naming a 128-line `src/components/LifeBoard.tsx` failed at line 120 with `lineStarts.length: 98`, and failed identically on retry — the server answering from a 98-line map for a file that is not 98 lines, a stale server copy rather than a misrouted path. A misroute between two copies of similar length raises it not at all.

### The write path is the variable, not recency — measured 2026-09-08

Measured by the `only-harness-writes-reach-the-language-server` spike, on macOS with Claude Code 2.1.231 and `typescript-lsp@1.0.0`. Untracked probe modules carrying a nonce sentinel in a JSDoc summary; every hover took an **absolute** path. The probes were deleted afterwards.

**What does not clear a stale hover.** A probe **inside the server's own project root**, edited with `sed`, hovered stale at t = 0s, 45s, 117s and 265s, and never converged. `cat`, the `Read` tool, and `EnterWorktree` each left it stale as well. So neither elapsed time nor the project root is the variable — the in-root arm is the one that kills the missing-watcher explanation, because a watcher is supposed to exist there.

**What does clear it.** The harness's `Edit` tool made the same file hover fresh **immediately**, and `Write` behaved identically. A `sed` to that same file seconds later staled it again. The pair, run in that order on one file, is what isolates the write path from every other candidate.

**The re-sync is whole-file, which is what makes the refresh idiom work.** A trivial `Edit` adding a trailing newline at the **end** of a `sed`-staled file made the server pick up a `sed`-authored change to the **comment block** as well. So a harness write replaces the server's copy from disk wholesale rather than patching the edited range. That is why Part 2 §7 can tell you to refresh with an edit that does not touch the lines you are about to hover.

**The cross-file arm, which is the case Part 2 §7's test actually describes.** A caller module hovering an imported symbol from a declaration module: an `Edit` to the declaration's JSDoc showed at the caller's call site immediately, and a later `sed` to the same block did not. So the finding holds where a caller stands, not only in the file being edited. Note the namespace-import form (`m.probeA`) was needed to get a doc-carrying hover at all — a plain named import hovers as `import probeA` with no prose, which is worth knowing before concluding a doc is missing.

**Reconciling the same-tree record above.** The `jsdoc-in-src` measurement recorded a pre-edit rendering after an immediate re-hover, and the `Edit` arm here does not reproduce that. That record does not say which tool performed the write, so the two are consistent if the edit went through a shell command rather than `Edit`. Nothing here contradicts the observation; what changed is the mechanism assigned to it. This is the same correction shape as the entry above under "A correction, kept because the mechanism is what a later reader reasons from" — the verdict survived and the reason did not.

**The stale set is bounded.** A probe created, opened with the `Read` tool, `sed`-ed, and then hovered for the first time returned the **new** bytes. So a `Read` does not enrol a file with the server, and exposure is limited to files that have had an LSP operation run against them. Bounded is not the same as visible: nothing exposes which files a session has enrolled, and the set only grows.

**Why no server-side setting can fix this.** LSP 3.17 states that after `textDocument/didOpen` "the document's truth is now managed by the client and the server must not try to read the document's truth using the document's Uri". A conforming server is therefore required to ignore the disk for an open document, and the protocol's own remedies — `workspace/didChangeWatchedFiles` for closed files, a buffer reload for open ones — both live in the client. The same failure class is open against other clients, for example `zed-industries/zed#48439`. Remedies beyond the refresh idiom, including a proxy that resyncs open documents from disk, were weighed in that spike's decision record rather than here.

## Illustrations the shape passes dropped from the article

`ste-shape-rules-on-doc-comments` shortened the article six times. Each pass removed examples rather than
rules, and these were dropped without being moved here at the time. They are recorded now because an
illustration is evidence, and evidence belongs on this side.

**What `documentSymbol` actually returns.** Run on `src/scrollbars.ts` it returned
`computeAxisScrollbarMetrics` along with `contentPxLeft`, `extentPxRight`, `thumbRatio` and the rest of
that function's locals — which is the concrete form of the article's claim that it returns every
top-level declaration plus the constants nested inside each one.

**The model for rule 7's sidecar tier.** React's `useState` is it: terse type-level docs, with the
best-practice material living elsewhere. That is what "keep a lighter overview in the JSDoc and move the
depth into a Markdown file" was drawn from.

**Where the silent-fallback trap is documented.** CLAUDE.md's note on the `typescript-lsp` plugin is the
pointer Part 2 §5 used to carry: the plugin needs a global `npm install -g typescript-language-server
typescript`, so `npm ci` alone does not reproduce it, which is why a role can fall back to `Grep`/`Read`
without saying so.

**Why `npm run build` belongs in the per-commit list.** `tsc -b` catches a broken comment block
immediately — a `*/` terminated early inside prose is a syntax error, and the build is the fastest thing
that reports it.

**The named-return arm used to be an exhaustive roster.** It read "every hook in `src/hooks/` except the
two below", naming `useCamera` and `usePatternPlacement` as the inferred pair. The shape pass replaced it
with two examples. That is a strict improvement rather than a loss: an exhaustive present-tense roster of
another directory's files is the form `engineering.md`'s claim discipline forbids, and it would have gone
stale on the next hook added.

## The research record, rejections included

- **LSP/token-reduction guidance for agents** — searched; what exists is about _retrieval strategy_ (which files to open, how to chunk) and carries no authoring guidance. **No established precedent** for JSDoc conventions aimed at agents navigating via LSP. Rejected as a source.
- **Ousterhout, _A Philosophy of Software Design_** — the interface/implementation comment split. **Adopted** as the governing rule; it is older than the problem and states the token argument exactly.
- **TSDoc's `@remarks`** — **rejected as a truncation lever**, and **rejected as a tag at all** under the closed table. See the tag section above.
- **Contract-style docstring guidance for agent tools** (preconditions, invariants, error contracts) — **adopted**, as rule 3.
- **`{@link}` for sidecar references** — predicted to render unresolved, **measured to render exactly**, and adopted for that reason.

## Provenance of the commit discipline

The partition sweep's commit sequence is adapted from `split-claude-md`'s "this commit only COPIES" rule.
