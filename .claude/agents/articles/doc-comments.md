# Article: Doc Comments — writing interface docs and reading them instead of code

**Audience:** coder, cleaner, architect - **Read when:** before writing or moving a comment block in `src/` or `scripts/`, before adding a JSDoc block to a new export, and whenever a hover did not tell you enough to use a thing.

This article is one loop with two halves. Part 1 is how to write an interface comment; Part 2 is how to read one instead of reading a body. They only pay off together: the writing rule is worth obeying because roles consume hover, and the reading habit is worth forming because comments are written to the split rule.

## The problem this exists to fix

**A `//` comment is invisible on both channels a consumer has.** Measured on this tree:

|                                           | `//` block        | JSDoc block               |
| ----------------------------------------- | ----------------- | ------------------------- |
| `LSP` hover at the declaration            | bare signature    | full prose, tags rendered |
| `LSP` hover at a **cross-file call site** | bare signature    | full prose, tags rendered |
| `tsc --emitDeclarationOnly`               | stripped entirely | preserved verbatim        |

**The before-state, measured when this article was authored and named here because the sweep that follows is what closes it:** `nextTileRange` carried a 113-line `//` block (`src/cellTiles.ts:241-353`) and hovered as a bare signature at its cross-file call site in `src/hooks/useCellTiles.ts`, while `isStrictEqual` hovered as its full prose plus its `@see` link. Every role carries `LSP`; none of them could see the first one's reasoning without opening the file. If you are reading this after the sweep and that hover now returns prose, the example has done its job — it is a record of the gap, not a live defect.

The fix is **not** "move it all into JSDoc." Whatever goes into JSDoc is paid for at every hover, at every call site, forever — and hover renders everything, tags included. **There is no truncation lever.** TSDoc's summary/`@remarks` split is a documentation-_generator_ convention that the language server does not honour: `@remarks` was measured rendering inline, exactly like summary prose. Volume is controlled by writing less, not by tagging it differently.

## Part 1 — Writing

### The governing rule: Ousterhout's interface/implementation split

_A Philosophy of Software Design_ separates two kinds of comment:

> Interface comments provide information that someone needs to know in order to use a class or method; they define the abstraction. Implementation comments describe how a class or method works internally.
>
> If a user must read the code of a method in order to use it, then there is no abstraction.

That last line **is** the token argument, stated years before agents existed. So this is a **partition, not a fold**:

- **Interface half → JSDoc above the declaration.** Visible in hover and in the `.d.ts`. What a caller needs in order to use the thing correctly.
- **Implementation half → stays `//`,** relocated below the signature or into the body. Invisible to hover, which is _correct_: a caller should neither be exposed to internals nor pay tokens for them.

**Partitioning is not the same as being already-JSDoc.** A block can be in the right channel and still be the wrong content at the wrong length. When this article was authored, `src/equality/is-deep-equal.ts` carried a 22-line JSDoc whose middle paragraph ("`isDeepEqual` is its own leaf comparator here — `structurallyEqual`'s own initial short-circuit…") was pure implementation rationale sitting on the hover channel, and `Cache.insert` in `src/cache.ts` hovered at roughly 30 rendered lines carrying a misspelled `@remark` that renders as an empty tag, an `@todo` about a future API, and two bare `@param`s that name the parameters and say nothing. **Apply the split test to JSDoc you find, not only to `//` you find** — "it is already JSDoc" is not a reason to skip a file.

### 1. The split test

For each existing line, ask: **does a caller need this to use the thing correctly?** → JSDoc. **Does it explain how it works inside, or why it was built that way?** → `//`, below the signature.

### 2. The first line is one sentence saying what the caller gets

Not how it is computed. No "This function…". It is the line that has to make reading the body unnecessary, and it is the only line guaranteed to be read.

### 3. Interface facts that belong in JSDoc

These are the things the type cannot state, and this repo is dense with them:

- **Identity and reference guarantees** — `nextTileRange` returning `previous` _by reference_ is why React can skip a re-render. Nothing in `(previous: TileRange, …) => TileRange` says that.
- **Coordinate space and units** — `camera.ts`'s client-pixel vs viewport-pixel distinction, already described in-file as "the single translation point".
- **Sign conventions** — `scrollbars.ts` follows the document-scroll convention, the _opposite_ sign from `panCamera`'s drag-to-pan convention. A caller that gets this wrong compiles.
- **Ordering and staleness preconditions** — "`thumbRatio` must be the value from when the drag started, not recomputed mid-drag."
- **Error behaviour** — what throws, and on what.

### 4. What stays `//`

Measured findings and their numbers; rejected alternatives and why; why a constant has the value it has; "three things follow by construction" derivations; cross-references into another module's internals. All of it is real and worth keeping — it just does not belong on a channel every caller pays for.

### 5. The tag rule is an information test, not an allowlist

**Does this line say something the signature cannot?** Keep it. **Does it restate the signature?** Delete it — tag or prose alike.

`@param constraints — Constraints to apply` is the type name in English and fails the test. `@param thumbRatio — must be the value from when the drag started` passes it, and as a tag it is positionally unambiguous in a way summary prose is not.

Default posture is minimal. Each tag has a trigger that earns it:

| tag        | earns its place when                                                                                                 |
| ---------- | -------------------------------------------------------------------------------------------------------------------- |
| `@example` | the call protocol is the hard part — chaining, a required ordering, a factory returning something already configured |
| `@param`   | a specific parameter carries a precondition or a unit the type cannot state                                          |
| `@returns` | the returned value's _meaning_ is conditional — `previous` returned by reference when it still holds                 |
| `@throws`  | there is an error contract                                                                                           |
| `@see`     | an external reference, or the sidecar file in rule 7                                                                 |

One measured limit on `@param`'s value here: the `LSP` tool's operation set is `goToDefinition`, `findReferences`, `hover`, `documentSymbol`, `workspaceSymbol`, `goToImplementation`, `prepareCallHierarchy`, `incomingCalls`, `outgoingCalls` — **there is no `signatureHelp`**, so `@param`'s editor payoff (per-parameter hints while typing) does not reach an agent in this repo. For us it is one more hover line whose value is disambiguation, not a second surface.

**The table is closed, and it is closed for _block_ tags.** Those five are the entire permitted block-tag vocabulary in `src/` and `scripts/`. `@remarks`, `@todo`, `@deprecated`, `@internal`, `@defaultValue` and the rest of TSDoc are not written here. This is a ruling rather than an omission, and it follows from the information test one level up: **a block tag's hover payload is its own label**, and a label earns its rendered line only when it tells a caller something the prose alone could not. The five do — an error contract, a binding to a named parameter, the returned value's conditional meaning, a pointer out of the file, a call protocol. `@remarks` does not: measured, it renders inline as `*@remarks* — <text>`, so the only thing the tag adds over writing the same words as a second paragraph is a label meaning "detail rather than summary" — a distinction a documentation _generator_ honours and a hover does not. **A tag's content can pass the information test while the tag fails it**; when it does, keep the content and drop the tag word.

**`{@link}` is an _inline_ tag and is sanctioned** — mandated, in fact, by rule 7, and used throughout `src/cache.ts` and `src/cellTiles.ts`. The closure above governs the tags that open a line, not the ones written inside prose.

**Prose paragraphs go _before_ the first block tag.** Measured: a paragraph written after a `@throws` (`Cache.remove`'s "Removing mid-iteration invalidates that iteration…") renders inside that tag's block, below its text — TS reads everything up to the next tag as the tag's own comment text. It still reads as its own paragraph, so this is attribution drift rather than a hazard, but a fact about the whole function sitting under `@throws` looks like a fact about the throw. Summary, then prose, then tags.

**Amending the table is an `architect` ruling with a measured rendering attached.** Propose a row; do not read the list as illustrative and interpret your way onto it. (`@deprecated` is the likeliest future candidate, because it has real language-server semantics — a strikethrough at the call site — rather than a generator convention behind it. It still needs the measurement and the ruling.)

**`architect` is the arbiter.** DESIGN sets the target vocabulary for a slice; REVIEW rules per export on whether hover is _necessary and sufficient_ to use the thing without opening the body. That is an interface-surface judgment, which is already that role's job and no one else's.

### 6. A hover budget: roughly 15 rendered lines, `@example` included

Past that, treat it as a signal that the split is wrong or the module is shallow — **not** as a reason to widen the budget. `@example` is the highest-variance construct, since it is the one thing that can silently triple a hover; `architect` REVIEW prices it with `findReferences`, because the cost scales with call sites.

The budget is about **rendered** lines, so measure it the way a reader experiences it — hover the symbol — rather than by counting source lines.

### 7. Overflow goes to a sidecar `<module>.md`, not into the hover

When an abstraction genuinely needs more than the budget — extended examples, use cases, best-practice notes — keep a lighter overview in the JSDoc and move the depth into a Markdown file beside the source: `src/cellTiles.md` next to `src/cellTiles.ts`. React's `useState` is the model: terse type-level docs, with the best-practice material living elsewhere.

That gives a three-tier escalation a reader can walk on demand — **hover for the contract, sidecar for the depth, implementation only when changing it** — instead of paying for all three on every read.

**The reference form is `@see {@link ./cellTiles.md}`, and this was measured rather than guessed.** TypeScript parses the token after a `@see` as an entity name, which mangles a bare path:

| written                           | rendered in hover             |                                                 |
| --------------------------------- | ----------------------------- | ----------------------------------------------- |
| `@see ./cellTiles.md`             | `@see — . /cellTiles.md`      | **mangled** — space injected after `.`          |
| `@see src/cellTiles.md`           | `@see — src /cellTiles.md`    | **mangled** — space injected after `src`        |
| `@see cellTiles.md`               | `@see — cellTiles.md`         | clean, but says nothing about where the file is |
| `` @see `./cellTiles.md` ``       | ``@see —  `./cellTiles.md` `` | clean, with stray backticks and a doubled space |
| **`@see {@link ./cellTiles.md}`** | **`@see — ./cellTiles.md`**   | **exact — this is the mandated form**           |

All five survive `tsc --emitDeclarationOnly` verbatim, so this is purely a hover-rendering ruling. The plain `@see ./name.md` form was the one predicted to work during planning, and `{@link}` the one predicted to render unresolved for a relative Markdown path. The measurement is the reverse of both. When `{@link}` _can_ resolve a target it links it, which is why a `{@link Cache.has}` — a declaration reference rather than a path — renders as a clickable file link instead.

**Nothing checks that a sidecar link resolves.** `npm run agent-doc-check` scans `.claude/**/*.md` plus `CLAUDE.md`, not `src/**`, so a `@see {@link ./name.md}` can rot silently after a rename. That gap is filed as a follow-up candidate rather than fixed here; until it closes, a rename that moves a module is also a rename of its sidecar.

### 8. Scope: exported declarations **and** interface/type members

Both, and the reason is measured, not stylistic: **an interface's own JSDoc does not reach a member hover.**

```
interface DocumentedInterface {          hover on it.memberWithoutDoc  → bare signature
  memberWithoutDoc(v: number): number      (even though the interface above it carries prose)
  /** The member's own contract. */      hover on it.memberWithDoc     → "The member's own contract."
  memberWithDoc(v: number): number
}
```

So a fact about a member, written on the containing interface, is **invisible at the site where the member is used**. Members are legitimate placement targets, and for a callback bag or a store interface they are the _only_ correct target.

**But the unit of work is the existing comment blocks, not the export list.** Measured when this article was authored, `src/` (excluding `catalyst/`, including `test-support/`) held roughly 195 exported declarations and 128 interface/type members, against about 84 existing comment blocks — and it is the blocks that are the surface. **Documenting every undocumented export is not this convention** — an export whose signature already says everything gets no JSDoc, because a summary that restates the signature fails rule 5 and costs a hover anyway. Members are where you _may_ put a partitioned fact, not a checklist to fill in.

### 9. Syntax hazards, all measured

**A JSDoc tag is recognized wherever `@` is preceded by whitespace** — including the block's own leading `*` — regardless of what follows it, and **regardless of being inside a fenced code block.** It is _not_ recognized when `@` is preceded by any non-whitespace character. Every case measured on this tree is explained by that one rule, **with one measured exception — the token position immediately after `@throws`, in the `@throws` table below**:

| in a JSDoc block                                                     | parsed as a tag?                                        |
| -------------------------------------------------------------------- | ------------------------------------------------------- |
| `see the @see convention for details` (mid-line, space-preceded)     | **yes** — prose splits, remainder becomes tag text      |
| `the @fast-check/vitest package` (mid-line, space-preceded)          | **yes** — renders as `@fast-check` + `/vitest`          |
| a line beginning `@fast-check/vitest` **inside a fenced code block** | **yes** — a code fence is _not_ a safe harbour          |
| ``the `@fast-check/vitest` package`` (backtick-preceded)             | no — **this is the escape to use**                      |
| `reachable at foo@bar.com` (letter-preceded)                         | no                                                      |
| `import { thing } from '@scope/package'` inside an `@example`        | no — the quote precedes the `@`                         |
| `the \@fast-check/vitest package` (backslash-preceded)               | no, but the `\` renders literally — **do not use this** |

**So: backtick any `@`-prefixed token, always. Never rely on a code fence to protect one.** The practical consequence for an `@example` is that a package import written with quotes is safe, while a bare `@`-token at the start of an example line is not.

**`@throws` is the one tag whose first token TypeScript tries to read as a _type_, and braces are the trap.** Measured cross-file, on a probe file the language server had not previously read:

| written                                                   | rendered in hover                                                  |
| --------------------------------------------------------- | ------------------------------------------------------------------ |
| `@throws {CacheError} …`                                  | `{CacheError}` **literally, braces and all, no link** — do not use |
| **`@throws CacheError …`**                                | **`CacheError`, clean — this is the mandated form**                |
| `@throws {@link CacheError} …`                            | **broken**: a stray `{`, then `@link` parsed as its own tag        |
| `@throws CacheError … guard with {@link Cache.has} first` | the mid-text `{@link}` resolves to a clickable link                |

The third row is the one worth knowing, because it is exactly what a reader deduces from the first two and it is wrong. TS attempts a braced type immediately after `@throws`; `{@link …}` is not one, so the `{` is emitted literally and the `@link` behind it is picked up as a block tag **despite being brace-preceded** — the one position where the whitespace rule above does not hold. Put the link in the tag's prose instead, where it resolves and where it belongs.

Three more. The first is fatal; the second is silent, which is worse; the third is a coexistence ruling rather than a hazard:

- **A `*/` inside prose terminates the block early**, leaving a syntax error. Lines mentioning a glob like `**/run.ts` are the usual source. Reword such a line _before_ moving it into JSDoc, as its own commit — see the commit discipline below.
- **A blank line does not detach a JSDoc block from the declaration below it.** Measured: a `/** … */` block, then a blank line, then `export function afterBlankLine` — the block still reaches that function's hover at a cross-file call site. So a file-leading block that _looks_ like a module header is silently documenting the first declaration under it, whatever the author intended. Before treating any leading block as a module header, hover the first export and see whether it comes back; if it does, that block is already an interface comment and gets partitioned like one. A true module header — one that should reach nobody's hover — must be `//`.
- **`// prettier-ignore` and JSDoc coexist, in either order.** Measured on a 126-character signature that Prettier reformats when the directive is removed: with the directive present, `npx prettier --check` stays clean and hover returns the full JSDoc **both** when the directive sits above the JSDoc and when it sits between the JSDoc and the declaration. **Mandate the second — JSDoc, then `// prettier-ignore`, then the declaration** — so the directive stays adjacent to the thing whose formatting it suppresses. The other ordering reads as suppressing the comment's formatting, which it does not. Both were green; if a future TypeScript or Prettier upgrade breaks one, that is a change against this record rather than evidence the convention was wrong.

### 10. The research record, rejections included

- **LSP/token-reduction guidance for agents** — searched; what exists is about _retrieval strategy_ (which files to open, how to chunk) and carries no authoring guidance. **No established precedent** for JSDoc conventions aimed at agents navigating via LSP. Rejected as a source.
- **Ousterhout, _A Philosophy of Software Design_** — the interface/implementation comment split. **Adopted** as the governing rule; it is older than the problem and states the token argument exactly.
- **TSDoc's `@remarks`** — a core standard tag, and the obvious candidate for a summary/detail split. **Rejected as a truncation lever**, and now **rejected as a tag at all** under rule 5's closed table. Measured twice: it renders inline in hover as `*@remarks* — <text>`, i.e. the same words as prose plus a label whose only meaning is "detail rather than summary" — which a documentation _generator_ honours and a hover does not. So it is not quite free either: prose renders the same content one label cheaper. Kept as a follow-up candidate (`hover-carries-detail-no-reader-asked-for`), since a generated docs pipeline is the only thing that would make the distinction pay.
- **Contract-style docstring guidance for agent tools** (preconditions, invariants, error contracts) — **adopted**, as rule 3.
- **`{@link}` for sidecar references** — predicted to render unresolved, **measured to render exactly**, and adopted for that reason. See rule 7's table.

## Part 2 — Reading

`coder`, `cleaner` and `architect` all write code against abstractions they did not author, and all three carry `LSP`.

### 1. Hover before Read

To _use_ an abstraction — call it, wire it, review a call to it — `LSP hover` the symbol **at the call site**, not at its declaration. If the hover answers your question, stop; do not open the defining file. That is the entire return on this convention.

### 2. `documentSymbol` before `Read` when you need a module's shape

It returns the symbol tree without any statement bodies, which is far cheaper than reading the file. **Know what it actually returns**, though: not a clean declaration list, but every top-level declaration _plus_ the local constants and object properties nested inside each one. Running it on `src/scrollbars.ts` returns `computeAxisScrollbarMetrics` along with `contentPxLeft`, `extentPxRight`, `thumbRatio` and the rest of its locals. **It carries no doc prose at all.**

So `documentSymbol` is an inventory tool — what is in here, what is exported, what is the shape — and **hover remains the only channel that carries a contract.** Reach for `Read` when you must _change_ a module, not when you must _call_ one.

### 3. Walk the tiers in order, and stop at the first that suffices

Hover → the sidecar `.md` if the JSDoc points at one → the implementation. An agent that opens the body first has paid for all three.

### 4. A hover that doesn't suffice is a finding, not an inconvenience

If you had to open the body to use the thing correctly, the interface comment is incomplete. Each role does something different with that:

- **`coder`** — note it in the handoff manifest. Fixing it is outside the slice.
- **`cleaner`** — fix it. A missing interface fact is naming-adjacent, which is already this role's charter.
- **`architect`** (REVIEW) — rule on whether the comment is thin or the module boundary is wrong. Only this role can make that call.

### 5. Know the silent-fallback trap

Roles fall back to `Grep`/`Read` **silently** when the language server is absent (see CLAUDE.md's note on the `typescript-lsp` plugin), so a hover returning only a signature is ambiguous: _no JSDoc here_, or _no server at all_.

**The probe:** hover `isStrictEqual` in `src/equality/is-strict-equal.ts`. It must return prose plus an `@see` link. If it returns a bare signature, the server is missing, every other hover this session is worthless, and the thing to report is that — not that the codebase is undocumented. The probe depends on that one file keeping a JSDoc block with an `@see`; if a later slice ever strips it, re-pin the probe on another documented export in the same pass rather than deleting it.

### 6. Don't spend a hover on what the type already says

The signature comes back either way. A hover earns its round-trip when there is prose behind it, so hovering a two-line predicate whose name is its contract is pure cost.

### 7. Writing is verified by reading

After adding or changing an exported declaration, **hover it from a different file** and ask whether what came back would let you use it without opening the body. Same operation as the reading habit, run as the authoring acceptance test — and the cross-file position matters, because that is where a caller actually stands.

**One harness caveat, measured this pass: the language server serves hover from its own copy of a file, which can be stale after an on-disk edit.** Editing a JSDoc block in `src/cache.ts` and immediately re-hovering its cross-file call site returned the _pre-edit_ rendering; a sentinel word added to the summary is what distinguished staleness from the edit having failed. So a hover taken right after your own edit can verify the old comment. When a rendering has to be **measured** rather than recalled, put the variants in a **new** file the server has not read yet — that is how the `@throws` table in rule 9 was taken.

## Commit discipline for a partition sweep

Adapted from `split-claude-md`'s "this commit only COPIES" rule. Separate the mechanical move from the judgment, so each is reviewable on its own:

0. **Reword the syntax hazards first** — the `*/` lines and any whitespace-preceded `@` token — still as `//` comments, with no relocation. Small, individually reviewable, and it establishes the baseline the next commit preserves.
1. **Partition, text-preserving.** Split each block into its interface and implementation halves and relocate them. **No line's wording changes** — only its location and its comment marker. This is verifiable: strip the markers from both sides of the diff and assert the union of the halves equals the commit-0 baseline.
2. **Author the summaries and any tags.** The judgment half, separated so it cannot hide inside the relocation.

Per commit: `npm run format:check` and `npm run build` (`tsc -b` catches a broken comment block immediately), plus `npm test` after any `src/` batch.

**A comment cannot legitimately move `crap4ts`, `dry4ts`, or a mutation score.** Record all three at the start of a sweep and compare at the end; a moved number is a finding to explain, not a new baseline.
