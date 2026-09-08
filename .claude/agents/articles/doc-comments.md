# Article: Doc Comments — writing interface docs and reading them instead of code

**Audience:** coder, cleaner, architect - **Read when:** before writing or moving a comment block in `src/` or `scripts/`, before adding a JSDoc block to a new export, and whenever a hover did not tell you enough to use a thing.

> **The evidence for every rule here lives in `doc-comments.rationale.md`** — the measurements, the probe
> methods, the rejected alternatives and the corrections. Read that file when you are **changing** a rule
> below, never in order to follow one. Every rule here is stated to be actionable without it.

This article is one loop with two halves. Part 1 is how to write an interface comment; Part 2 is how to read one instead of reading a body. They only pay off together: the writing rule is worth obeying because roles consume hover, and the reading habit is worth forming because comments are written to the split rule.

## Scope: who this binds, and who carries a read trigger

Three roles name this article in their own files — `coder`, `cleaner`, `architect`. **That is the trigger list, not the binding list.** Both rulings below were made in the `jsdoc-standing-rule` DESIGN pass on 2026-09-06, on the user's direction that the standing duty be split across those three roles; the account is in `doc-comments.rationale.md`.

- **`hardener` is bound but carries no read trigger, deliberately.** It reaches the governing rule through `engineering.md`'s "Where a comment goes is a design decision too" line, which every role reads unconditionally. A remediation of its own that adds or changes an export under `src/` or `scripts/` is governed by rules 1–9 exactly as `coder`'s work is. Because its pass is a _gate_ rather than an authoring pass, Part 2 §4's disposition applies to it as it does to `coder`: an insufficient hover is a finding to report, not a thing to fix inside the gate.
- **`features/**` TypeScript: every mechanical fact here applies to it; the _duty_ is not codified.** Part 1's placement rules and Part 2's reading habit are as true in `features/screenplay/*.ts` as in `src/`. No role file assigns the duty there, and that is a recorded gap rather than an oversight. Note `rules/no-dead-doc-on-annotated-return-literal.yml` is unscoped by path and so already fires in `features/`.

## The problem this exists to fix

**A `//` comment is invisible on both channels a consumer has** — `LSP` hover (at the declaration and at a cross-file call site alike) and `tsc --emitDeclarationOnly`. JSDoc reaches both, prose and tags rendered.

The fix is **not** "move it all into JSDoc." Whatever goes into JSDoc is paid for at every hover, at every call site, forever, and hover renders everything including tags. **There is no truncation lever — volume is controlled by writing less, not by tagging it differently.**

> **`@remarks` was rejected as a truncation lever and again as a tag at all — see `doc-comments.rationale.md`.**

## Part 1 — Writing

### The governing rule: Ousterhout's interface/implementation split

_A Philosophy of Software Design_: "If a user must read the code of a method in order to use it, then there is no abstraction." So this is a **partition, not a fold**:

- **Interface half → JSDoc above the declaration.** Visible in hover and in the `.d.ts`. What a caller needs in order to use the thing correctly.
- **Implementation half → stays `//`,** relocated below the signature, into the body, **or between the JSDoc block and the declaration.**

**The between-position is sanctioned.** `/** … */`, then a `//` block, then the declaration: the JSDoc still reaches a cross-file hover, tags and all. **Do not "fix" a file into the below-the-signature form on the belief that the between form is broken; it is not.**

**Partitioning is not the same as being already-JSDoc.** A block can be in the right channel and still be the wrong content at the wrong length. **Apply the split test to JSDoc you find, not only to `//` you find** — "it is already JSDoc" is not a reason to skip a file.

### 1. The split test

For each existing line, ask: **does a caller need this to use the thing correctly?** → JSDoc. **Does it explain how it works inside, or why it was built that way?** → `//`, below the signature.

### 2. The first line is one sentence saying what the caller gets

Not how it is computed. No "This function…". It is the line that has to make reading the body unnecessary, and it is the only line guaranteed to be read.

### 3. Interface facts that belong in JSDoc

These are the things the type cannot state, and this repo is dense with them:

- **Identity and reference guarantees** — `nextTileRange` returning `previous` _by reference_ is why React can skip a re-render. Nothing in the signature says that.
- **Coordinate space and units** — `camera.ts`'s client-pixel vs viewport-pixel distinction.
- **Sign conventions** — `scrollbars.ts` follows the document-scroll convention, the _opposite_ sign from `panCamera`'s drag-to-pan convention. A caller that gets this wrong compiles.
- **Ordering and staleness preconditions** — "`thumbRatio` must be the value from when the drag started, not recomputed mid-drag."
- **Error behaviour** — what throws, and on what.

### 4. What stays `//`

Measured findings and their numbers; rejected alternatives and why; why a constant has the value it has; "three things follow by construction" derivations; cross-references into another module's internals.

**This rule settles the channel, not the shelf life.** A measured finding and a cross-reference are both permitted on the `//` channel, and both are still governed by `engineering.md`'s "A comment may state why; it may not state an undated present-tense fact about another file": cite the command rather than the number, cite `<file>'s <symbol>` rather than a line, name the slice rather than writing "this slice", and state the contract callers must honour rather than listing who calls.

### 5. The tag rule is an information test, not an allowlist

**Does this line say something the signature cannot?** Keep it. **Does it restate the signature?** Delete it — tag or prose alike.

`@param constraints — Constraints to apply` is the type name in English and fails the test. `@param thumbRatio — must be the value from when the drag started` passes it.

Default posture is minimal. Each tag has a trigger that earns it:

| tag        | earns its place when                                                                                                 |
| ---------- | -------------------------------------------------------------------------------------------------------------------- |
| `@example` | the call protocol is the hard part — chaining, a required ordering, a factory returning something already configured |
| `@param`   | a specific parameter carries a precondition or a unit the type cannot state                                          |
| `@returns` | the returned value's _meaning_ is conditional — `previous` returned by reference when it still holds                 |
| `@throws`  | there is an error contract                                                                                           |
| `@see`     | an external reference, or the sidecar file in rule 7                                                                 |

**The table is closed, and it is closed for _block_ tags.** Those five are the entire permitted block-tag vocabulary in `src/` and `scripts/`. `@remarks`, `@todo`, `@deprecated`, `@internal`, `@defaultValue` and the rest of TSDoc are not written here. **A tag's content can pass the information test while the tag fails it**; when it does, keep the content and drop the tag word, moving it into the prose above the block tags.

> **The closure is a ruling with an argument behind it, not a preference** — a block tag's hover payload is its own label, and a label earns its rendered line only when it says something the prose could not. Read `doc-comments.rationale.md` before proposing a sixth row; `@deprecated` is the likeliest candidate and still needs its measurement.

**`{@link}` is an _inline_ tag and is sanctioned** — mandated by rule 7, and used throughout `src/cache.ts` and `src/cellTiles.ts`. The closure governs tags that open a line, not ones written inside prose.

**Prose paragraphs go _before_ the first block tag.** Summary, then prose, then tags. A paragraph written after a block tag renders inside that tag's block.

**Part of this is mechanised and the larger part is not.** `.oxlintrc.json`'s `jsdoc/check-tag-names` gates a misspelled tag, a non-JSDoc tag and the TypeScript-redundant family. **It cannot enforce the table**, so the rest of standard JSDoc still passes the gate and is still forbidden here by this ruling. See `quality-tooling.md`'s JSDoc-tier section.

**Amending the table is an `architect` ruling with a measured rendering attached.** Propose a row; do not read the list as illustrative and interpret your way onto it.

**`architect` is the arbiter.** DESIGN sets the target vocabulary for a slice; REVIEW rules per export on whether hover is _necessary and sufficient_ to use the thing without opening the body.

### 6. A hover budget: roughly 15 rendered lines, `@example` included

Past that, treat it as a signal that the split is wrong or the module is shallow — **not** as a reason to widen the budget. `@example` is the highest-variance construct; `architect` REVIEW prices it with `findReferences`, because the cost scales with call sites.

The budget is about **rendered** lines: measure it by hovering the symbol, not by counting source lines.

### 7. Overflow goes to a sidecar `<module>.md`, not into the hover

When an abstraction genuinely needs more than the budget, keep a lighter overview in the JSDoc and move the depth into a Markdown file beside the source: `src/cellTiles.md` next to `src/cellTiles.ts`.

That gives a three-tier escalation — **hover for the contract, sidecar for the depth, implementation only when changing it.**

**The reference form is `@see {@link ./cellTiles.md}`, and it is mandated.** A bare path after `@see` is mangled in hover; the braced form renders exactly.

> **Four alternative `@see` forms were measured and rejected — see `doc-comments.rationale.md`.**

**Nothing checks that a sidecar link resolves.** `npm run agent-doc-check` scans `.claude/**/*.md` plus `CLAUDE.md`, not `src/**`, so a `@see {@link ./name.md}` can rot silently after a rename. Until that closes, a rename that moves a module is also a rename of its sidecar.

### 8. Scope: exported declarations **and** interface/type members

Both. **An interface's own JSDoc does not reach a member hover**, so a fact about a member written on the containing interface is invisible where the member is used. Members are legitimate placement targets, and for a callback bag or a store interface they are the _only_ correct target.

**The unit of work is the existing comment blocks, not the export list.** **Documenting every undocumented export is not this convention** — an export whose signature already says everything gets no JSDoc, because a summary that restates the signature fails rule 5 and costs a hover anyway.

**And "comment block" means every block in the file, not only the ones next to an export.** Sizing a sweep by "blocks directly above an exported declaration" undercounts it by roughly 3x (measured over the 45 files `jsdoc-in-scripts` touched; the counts are in `doc-comments.rationale.md`). Module headers, blocks above non-exported helpers, blocks above module-private constants and in-body blocks each still have to be read and ruled on, even when the ruling is "stays `//`". Budget the whole comment surface.

**A hook that returns an object.** Two facts, and keep them apart — the first says what breaks, the second says where to write instead, and they are not scoped alike.

**What severs: _any_ return type annotation** — named, inline type literal, `async` or sync. Under one, a doc above the implementing declaration and a doc on the `return { … }` property are **both severed**: the hover comes back as a bare signature, indistinguishable from no doc having been written.

**Where the doc goes, and there are two arms and no third:**

- **Named return type** — `useCellTiles`'s `CellTilesView`, `useZoomGlide`'s `ZoomGlideController` — the doc goes on the **interface member**, which is then the only site that reaches a caller at all.
- **Inferred return** — a hook that annotates nothing — the doc goes on the **property in the `return { … }` literal**. That literal is the analogue of an interface member: the one contiguous place a hook's public surface is listed. **This arm covers the whole literal, shorthand and longhand alike** — it is the only site available for a property whose value is an inline arrow (`openOrCancelLibrary: () => setPlacement(toggleLibrary)`), so the arm is not split by how each entry happens to be written.

**An inline type literal annotation severs, and where the doc should go instead is unmeasured** — the type literal has a member position, but nothing measured says a doc on it reaches. Do not reason from the named-return arm onto it.

**Ruling: never add a named return interface to a hook in order to create a documentation site.** A hook's return type is part of its public API, so changing one is an API change rather than comment work. An annotation added for hover reasons blanks every doc already written on the implementing declarations _and_ on the return literal, at every call site, with no error and no lint finding. A named return type earns its place when the _type_ is what wants naming — reuse across modules, a controller or a store handed around — and then its members are where the docs go.

**Two docs on one action means one of them is dead.** The loser is never rendered anywhere, at any call site. If you find a pair, delete the one that does not reach rather than leaving a reader to guess which they are looking at.

**A re-export line is not a documentation site — the original declaration is.** A value re-export carries the original's block through untouched. The destructured form (`export const { a, b } = bag`) has exactly one site: the source object's own longhand property. Where the original is third-party there is no site at all, which is why `scripts/acceptance-mutation/gherkin-document.ts` leaves both of its blocks `//`.

**This is the one claim in this article a machine can check, and it now is.** `rules/no-dead-doc-on-annotated-return-literal.yml` matches a JSDoc block standing inside an annotated function's return literal, in all six function kinds and in the arrow's parenthesised expression-body form. It never judges prose. See `ast-grep-rules.md` for its matcher.

> **Four things here are deliberately unmeasured. Do not assume either way, in either direction:** an inline type literal's member position; a longhand `name: fn` property's _precedence_ against a declaration doc (distinct from the placement arm above, which covers longhand); `{@link}` inside `@param`'s own type slot (`@param {@link X} value`); and `@example` in every respect. The probe methods are in `doc-comments.rationale.md`, but the constraint is here because it binds what you may write.

> **A presence-only rule — "every export carries a doc" — was proposed alongside the ast-grep rule above and rejected**, because it cannot tell whether a summary says anything and is satisfied by an empty `/** */`. See `doc-comments.rationale.md` before re-proposing it.

### 9. Syntax hazards

**A JSDoc tag is recognized wherever `@` is preceded by whitespace** — including the block's own leading `*` — regardless of what follows it, and **regardless of being inside a fenced code block.** It is _not_ recognized when `@` is preceded by any non-whitespace character.

**So: backtick any `@`-prefixed token, always. Never rely on a code fence to protect one.** A backslash escape renders literally — do not use it. In an `@example`, a package import written with quotes is safe; a bare `@`-token at the start of an example line is not.

**A clean `npm run lint` is no evidence a block hovers as written.** oxlint's JSDoc parser recognises a tag only at the start of a JSDoc line and is blind to a mid-line one, while the whitespace rule above is TypeScript's and holds anywhere in the block. The discipline stays human.

**A brace in a block tag's leading position is read as a _type slot_.** `@param` and `@returns` strip a well-formed braced type; **`@throws` and `@see` print it verbatim, so a `@throws` gets its exception type written bare.** Never open `@throws` or `@returns` with `{@link …}` — it breaks the tag, and `@returns` loses its text entirely. Put every other link in the tag's **prose**, where it resolves. `@see {@link ./file.md}` is the one sanctioned leading-brace form, per rule 7.

Three more. The first is fatal; the second is silent, which is worse; the third is a coexistence ruling:

- **A `*/` inside prose terminates the block early**, leaving a syntax error. Lines mentioning a glob like `**/run.ts` are the usual source. Reword such a line _before_ moving it into JSDoc, as its own commit — see the commit discipline below.
- **Neither a blank line nor an intervening `//` block detaches a JSDoc block from the declaration below it.** So a file-leading JSDoc block that _looks_ like a module header is silently documenting the first declaration under it. **Before treating any leading block as a module header, hover the first export**; if it comes back, that block is already an interface comment and gets partitioned like one. A true module header must be `//`. **That hover test only decides a leading block that is already JSDoc** — a leading `//` block always hovers as nothing, so settle it from content instead: does the block describe the file's exports **jointly**, or is it a multi-concern block that happens to sit above the first one?
- **`// prettier-ignore` and JSDoc coexist, in either order. Mandate JSDoc, then `// prettier-ignore`, then the declaration**, so the directive stays adjacent to the thing whose formatting it suppresses. The other ordering reads as suppressing the comment's formatting, which it does not.

## Part 2 — Reading

`coder`, `cleaner` and `architect` all write code against abstractions they did not author, and all three carry `LSP`.

### 1. Hover before Read

To _use_ an abstraction — call it, wire it, review a call to it — `LSP hover` the symbol **at the call site**, not at its declaration. If the hover answers your question, stop; do not open the defining file. That is the entire return on this convention.

### 2. `documentSymbol` before `Read` when you need a module's shape

It returns the symbol tree without any statement bodies. **Know what it actually returns**: not a clean declaration list, but every top-level declaration _plus_ the local constants and object properties nested inside each one. **It carries no doc prose at all.**

So `documentSymbol` is an inventory tool, and **hover remains the only channel that carries a contract.** Reach for `Read` when you must _change_ a module, not when you must _call_ one.

### 3. Walk the tiers in order, and stop at the first that suffices

Hover → the sidecar `.md` if the JSDoc points at one → the implementation. An agent that opens the body first has paid for all three.

### 4. A hover that doesn't suffice is a finding, not an inconvenience

If you had to open the body to use the thing correctly, the interface comment is incomplete. Each role does something different with that:

- **`coder`** — note it in the handoff manifest. Fixing it is outside the slice.
- **`cleaner`** — fix it. A missing interface fact is naming-adjacent, which is already this role's charter.
- **`architect`** (REVIEW) — rule on whether the comment is thin or the module boundary is wrong. Only this role can make that call.

### 5. Know the silent-fallback trap

Roles fall back to `Grep`/`Read` **silently** when the language server is absent, so a hover returning only a signature is ambiguous: _no JSDoc here_, or _no server at all_.

**The probe:** hover `isStrictEqual` in `src/equality/is-strict-equal.ts`. It must return prose plus an `@see` link. If it returns a bare signature, the server is missing, every other hover this session is worthless, and the thing to report is that — not that the codebase is undocumented. If a later slice ever strips that block, re-pin the probe on another documented export in the same pass rather than deleting it.

### 6. Don't spend a hover on what the type already says

The signature comes back either way. A hover earns its round-trip when there is prose behind it, so hovering a two-line predicate whose name is its contract is pure cost.

### 7. Writing is verified by reading

After adding or changing an exported declaration, **hover it from a different file** and ask whether what came back would let you use it without opening the body. The cross-file position matters, because that is where a caller actually stands.

Three hover hazards defeat that test, and each has a rule:

- **A hover taken right after your own edit can serve the pre-edit text.** When a rendering has to be **measured** rather than recalled, put the variants in a **new** file the server has not read yet.
- **A hover that reveals a defect is not a defect until you have read the source.** Staleness is not bounded by your own session's edits — a server can answer from a copy predating a rebase, producing text that exists in no tree on disk. Confirm against the file before reporting, always. One `sed -n` costs nothing next to a false finding filed against another role's work.
- **Pass `LSP` an absolute path, always.** A relative path resolves against the session's working directory, which under the one-slice-one-worktree protocol is not the tree you are editing. A path that exists in **both** trees silently answers about the wrong one, and since the copies agree everywhere the slice has not touched, that wrong answer is right most of the time.

**Do not use `Bad line number` as the diagnostic for a misroute.** The tsserver `Debug Failure. Bad line number` error reports only that the server's line map disagrees with the request, and that has more than one cause. Read it as _this hover is unsafe_, never as _that path was relative_.

## Commit discipline for a partition sweep

Separate the mechanical move from the judgment, so each is reviewable on its own:

0. **Reword the syntax hazards first** — the `*/` lines and any whitespace-preceded `@` token — still as `//` comments, with no relocation. Small, individually reviewable, and it establishes the baseline the next commit preserves.
1. **Partition, text-preserving.** Split each block into its interface and implementation halves and relocate them. **No line's wording changes** — only its location and its comment marker. This is verifiable: strip the markers from both sides of the diff and assert the union of the halves equals the commit-0 baseline.
2. **Author the summaries and any tags.** The judgment half, separated so it cannot hide inside the relocation.

Per commit: `npm run format:check` and `npm run build`, plus `npm test` after any `src/` batch.

**A comment cannot legitimately move `crap4ts`, `dry4ts`, or a mutation score.** Record all three at the start of a sweep and compare at the end; a moved number is a finding to explain, not a new baseline.
