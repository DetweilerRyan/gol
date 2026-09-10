# Article: Doc Comments — writing interface docs and reading them instead of code

**Audience:** coder, cleaner, architect

**Read when:**

- before writing or moving a comment block in `src/` or `scripts/`
- before adding a JSDoc block to a new export
- whenever a hover did not tell you enough to use a thing

> The evidence for every rule here is in `doc-comments.rationale.md`. It holds the measurements, the
> probe methods, the rejected alternatives and the corrections. Read it when you are **changing** a rule
> below, never in order to follow one. Every rule here is actionable without it.

This article is one loop with two halves. Part 1 is how to write an interface comment. Part 2 is how to
read one instead of reading a body. They pay off only together. Roles consume hover, so the writing rule is
worth obeying. Comments are written to the split rule, so the reading habit is worth forming.

## Scope: who this binds, and who carries a read trigger

Three roles name this article in their own files: `coder`, `cleaner`, `architect`.

**That is the trigger list, not the binding list.** The `jsdoc-standing-rule` DESIGN pass made both
rulings below on 2026-09-06, on the user's direction to split the standing duty across those three
roles. The account is in `doc-comments.rationale.md`.

**`hardener` is bound but carries no read trigger, deliberately.** It reaches the governing rule through
`engineering.md`'s "Where a comment goes is a design decision too" line, which every role reads
unconditionally. Rules 1–9 govern any remediation of its own that adds or changes an export under `src/`
or `scripts/`, exactly as they govern `coder`'s work. Its pass is a _gate_ rather than an authoring pass, so Part 2 §4
applies to it as it does to `coder`. Report an insufficient hover as a finding. Do not fix it inside the
gate.

**`features/**` TypeScript: every mechanical fact here applies to it, but no role file assigns the
_duty_.** Part 1's placement rules and Part 2's reading habit hold in `features/screenplay/*.ts` exactly
as in `src/`. That silence is a recorded gap rather than an oversight. Note that
`rules/no-dead-doc-on-annotated-return-literal.yml` is unscoped by path, so it already fires in
`features/`.

## The problem this exists to fix

A `//` comment is invisible on both channels a consumer has: `LSP` hover, at the declaration and at a
cross-file call site alike, and `tsc --emitDeclarationOnly`. JSDoc reaches both, prose and tags rendered.

The fix is **not** "move it all into JSDoc." Every hover at every call site pays for whatever goes into
JSDoc, forever, and hover renders everything including tags. **There is no truncation lever.** Control
volume by writing less, not by tagging it differently.

> `@remarks` was rejected as a truncation lever, and again as a tag at all. See
> `doc-comments.rationale.md`.

## Part 1 — Writing

### The governing rule: Ousterhout's interface/implementation split

_A Philosophy of Software Design_: "If a user must read the code of a method in order to use it, then
there is no abstraction." So this is a **partition, not a fold**:

- **Interface half → JSDoc above the declaration.** What a caller needs in order to use the thing
  correctly. Visible in hover and in the `.d.ts`.
- **Implementation half → stays `//`.** Relocate it below the signature, into the body, or between the
  JSDoc block and the declaration.

**Use the between-position freely.** Write `/** … */`, then a `//` block, then the declaration: the
JSDoc still reaches a cross-file hover, tags and all. Do not "fix" a file into the below-the-signature
form on the belief that the between form is broken. It is not.

**Partitioning is not the same as being already-JSDoc.** A block can sit in the right channel and still
be the wrong content at the wrong length. Apply the split test to JSDoc you find, not only to `//` you
find. "It is already JSDoc" is not a reason to skip a file.

### 1. The split test

Ask this of each existing line:

- **Does a caller need it to use the thing correctly?** → JSDoc.
- **Does it explain how the thing works inside, or why it was built that way?** → `//`, below the
  signature.

**Vale lints these blocks.** `vale-styles/JsDoc/` carries rules that mechanically enforce some of
what follows, and `architect` owns them. See `prose-linting.md`'s "Triaging a finding in a comment"
for how a finding here differs from one in an article. The remedy is often a **move** rather than a
rewrite.

### 2. The first line is one sentence saying what the caller gets

Not how it is computed. No "This function…". This line has to make reading the body unnecessary, and it
is the only line guaranteed to be read.

### 3. Interface facts that belong in JSDoc

These are the things the type cannot state, and this repo is dense with them:

- **Identity and reference guarantees.** `nextTileRange` returns `previous` _by reference_, which is why
  React can skip a re-render. Nothing in the signature says that.
- **Coordinate space and units.** `camera.ts` distinguishes client pixels from viewport pixels.
- **Sign conventions.** `scrollbars.ts` follows the document-scroll convention, the _opposite_ sign from
  `panCamera`'s drag-to-pan convention. A caller that gets this wrong still compiles.
- **Ordering and staleness preconditions.** "`thumbRatio` must be the value from when the drag started,
  not recomputed mid-drag."
- **Error behaviour.** What throws, and on what.

### 4. What stays `//`

- measured findings and their numbers
- rejected alternatives, and why
- why a constant has the value it has
- "three things follow by construction" derivations
- cross-references into another module's internals

**This rule settles the channel, not the shelf life.** The `//` channel permits a measured finding and a
cross-reference alike. `engineering.md`'s "A comment may state why; it may not state an undated
present-tense fact about another file" still governs both. Four forms that rule requires:

- cite the command, not the number
- cite `<file>'s <symbol>`, not a line
- name the slice, never "this slice"
- state the contract callers must honour, never who calls

### 5. The tag rule is an information test, not an allowlist

- **Does this line say something the signature cannot?** Keep it.
- **Does it restate the signature?** Delete it, tag or prose alike.

`@param constraints — Constraints to apply` is the type name in English, and fails the test.
`@param thumbRatio — must be the value from when the drag started` passes it.

Default posture is minimal. Each tag has a trigger that earns it:

| tag        | earns its place when                                                                                                 |
| ---------- | -------------------------------------------------------------------------------------------------------------------- |
| `@example` | the call protocol is the hard part — chaining, a required ordering, a factory returning something already configured |
| `@param`   | a specific parameter carries a precondition or a unit the type cannot state                                          |
| `@returns` | the returned value's _meaning_ is conditional — `previous` returned by reference when it still holds                 |
| `@throws`  | there is an error contract                                                                                           |
| `@see`     | an external reference, or the sidecar file in rule 7                                                                 |

**The table is closed, and closed for _block_ tags.** Those five are the entire permitted block-tag
vocabulary in `src/` and `scripts/`. Do not write `@remarks`, `@todo`, `@deprecated`, `@internal`,
`@defaultValue`, or the rest of TSDoc here.

A tag's content can pass the information test while the tag fails it. When that happens, keep the
content and drop the tag word, moving it into the prose above the block tags.

> The closure is a ruling with an argument behind it, not a preference. A block tag's hover payload is
> its own label, and a label earns its rendered line only when it says something the prose could not.
> Read `doc-comments.rationale.md` before proposing a sixth row. `@deprecated` is the likeliest
> candidate and still needs its measurement.

**`{@link}` is an _inline_ tag, and rule 7 mandates it.** `src/cache.ts` and `src/cellTiles.ts` use it
throughout. The closure governs tags that open a line, not ones written inside
prose.

**Prose paragraphs go _before_ the first block tag.** Summary, then prose, then tags. A paragraph written
after a block tag renders inside that tag's block.

**Part of this is mechanised. The larger part is not.** `.oxlintrc.json`'s `jsdoc/check-tag-names` gates
a misspelled tag, a non-JSDoc tag and the TypeScript-redundant family. It cannot enforce the table, so
the rest of standard JSDoc still passes the gate. This ruling forbids it anyway. See
`quality-tooling.md`'s JSDoc-tier section.

**Amending the table is an `architect` ruling with a measured rendering attached.** Propose a row. Do not
read the list as illustrative and interpret your way onto it.

**`architect` is the arbiter.** DESIGN sets the target vocabulary for a slice. REVIEW rules per export on
whether hover is _necessary and sufficient_ to use the thing without opening the body.

### 6. A hover budget: roughly 15 rendered lines, `@example` included

Past that, treat the overflow as a signal that the split is wrong or the module is shallow. It is not a
reason to widen the budget. `@example` is the highest-variance construct, and `architect` REVIEW prices
it with `findReferences`, because the cost scales with call sites.

The budget counts **rendered** lines. Measure it by hovering the symbol, not by counting source lines.

### 7. Overflow goes beside the source, as a pair of sidecars

When an abstraction genuinely needs more than the budget, keep a lighter overview in the JSDoc. Move the
depth into Markdown beside the source. That depth splits across two files, by filename, so a reader knows
which register they opened before reading a word.

| File                    | Holds                                             | Read when                                        |
| ----------------------- | ------------------------------------------------- | ------------------------------------------------ |
| `<module>.md`           | extended examples, use cases, best-practice notes | the hover was not enough, and you are calling it |
| `<module>.rationale.md` | measurements, rejected alternatives, corrections  | you are changing it                              |

Either file may be absent, and usually one is. All three live instances are rationale:
`src/cache.rationale.md`, `src/hooks/useZoomGlide.rationale.md` and `src/scrollbars.rationale.md`. Read the
`useZoomGlide` one as the precedent.

This mirrors the article tier on purpose, so one convention covers both. Separating by filename rather than
by section is the point. A filename shows in an editor tab, a diff header and an `@see` link. The reader
opens nothing to know which register it is.

**A sidecar points at an article, it does not restate one.** Its content is depth the hover cannot hold —
measurements, rejected alternatives, the failure mode a change invites. Where an article already carries a
ruling, the sidecar cites it in one line. Two copies of one paragraph, in two files nobody checks against
each other, is CLAUDE.md's branch 5 drift one tier down.

That gives a three-tier escalation: **hover for the contract, sidecar for the depth, implementation only
when changing it.**

**Write the reference as `@see {@link ./useZoomGlide.rationale.md}`.** Hover mangles a bare path after
`@see`. The braced form renders exactly. Point the hover at whichever half that declaration's reader needs,
and at both when both exist. Point it at `<module>.rationale.md` when what the reader most needs is why the
contract is shaped this way. All three live links do exactly that.

> Four alternative `@see` forms were measured and rejected. See `doc-comments.rationale.md`.

**What `reference-check` sees of a sidecar is narrower than "the filename is checked", and the difference
falls on the one form this rule mandates.** `check-md-references` added `md` to the extractor, so a
**repo-relative** token names a file the checker resolves. Everything below was measured 2026-09-09 by
fault injection against the landed tree:

- **A repo-relative token in doc prose or in a `//` comment is checked.** Rewriting
  `src/cache.rationale.md` to a name that resolves to nothing fails the gate by name and line. Renaming
  both module sidecars redded four such references at once.
- **A leading-dot token is discarded before it reaches any check.** `references.ts`'s `isDiscardedToken`
  drops every token starting with `.`, which is dotted-relative noise for its purpose and is also the exact
  shape of `@see {@link ./cache.rationale.md}`. Breaking that link to a name that resolves to nothing left
  the run green with the reference count unmoved, so the token was never extracted. **Cite a sidecar
  repo-relative in a `//` comment for that reason.** The `./` form stays only inside `{@link}`, where
  hover rendering demands it, and it buys no check there.
- **Matching is by basename, never by full path.** A sidecar moved to another directory still resolves.
  Measured by relocating `src/cache.rationale.md` into `src/hooks/`: green.
- **`src/**/*.md` is outside the checker's scan set.** The source surface is `.ts`/`.tsx`/`.yml`/`.yaml`, and
  the doc surface is `CLAUDE.md`, `README.md` and `.claude/**/*.md`. A sidecar's own references go unread; a
  made-up `.ts` token appended to `src/scrollbars.rationale.md` left the run green.

**Vale does reach the pair, and treats the halves differently.** `.vale.ini` scopes `[src/**/*.md]` to the
same six STE rules the articles carry. Its `[**/*.rationale.md]` section then exempts the rationale half,
matching how article rationale is treated.

Until the scan gaps close, treat a rename that moves a module as a rename of both its sidecars. Hold a
sidecar to the comment-assertion convention by hand as well: no quoted test titles, no caller rosters, no
`<file>:NN`. Nothing will catch one.

**Which half a fact goes in is branch 5's test, one tier down: does a caller act on it?** The claim a
caller acts on belongs in the hover, and its worked-out form in `<module>.md`. The evidence behind that
claim belongs in `<module>.rationale.md`. `useZoomGlide` is the live example. Its hover states that the
completion frame is bit-identical to an instantaneous zoom, because a caller can rely on that. The
float-divergence measurement that establishes it sits in the rationale half.

### 8. Scope: exported declarations **and** interface/type members

Both. **An interface's own JSDoc does not reach a member hover.** A fact about a member, written on the
containing interface, is invisible where the member is used. Members are legitimate placement targets.
For a callback bag or a store interface they are the _only_ correct target.

**The unit of work is the existing comment blocks, not the export list.** Documenting every undocumented
export is not this convention. An export whose signature already says everything gets no JSDoc: a
summary that restates the signature fails rule 5 and costs a hover anyway.

**"Comment block" means every block in the file, not only the ones next to an export.** Sizing a sweep by
"blocks directly above an exported declaration" undercounts it by roughly 3x. You still have to read and rule on four
kinds of block, even when the ruling is "stays `//`":

- module headers
- blocks above non-exported helpers
- blocks above module-private constants
- in-body blocks

Budget the whole comment surface. The counts behind the 3x are in `doc-comments.rationale.md`.

**A hook that returns an object.** Two facts, and keep them apart. The first says what breaks. The second
says where to write instead. They are not scoped alike.

**What severs: _any_ return type annotation.** Named, inline type literal, `async` or sync. Under one, a
doc above the implementing declaration and a doc on the `return { … }` property are **both severed**. The
hover comes back as a bare signature, indistinguishable from no doc having been written.

**Where the doc goes. Two arms, and no third:**

- **Named return type** — `useCellTiles`'s `CellTilesView`, `useZoomGlide`'s `ZoomGlideController`. The
  doc goes on the **interface member**, which is then the only site that reaches a caller at all.
- **Inferred return** — a hook that annotates nothing. The doc goes on the **property in the
  `return { … }` literal**.

**The inferred arm covers the whole literal, shorthand and longhand alike.** That literal is the analogue
of an interface member: the one contiguous place a hook's public surface is listed. It is the only site
available for a property whose value is an inline arrow, such as
`openOrCancelLibrary: () => setPlacement(toggleLibrary)`. How an entry happens to be written does not
split the arm.

**An inline type literal annotation severs, and the remedy is unmeasured.** The type literal has a member
position, but nothing measured says a doc on it reaches. Do not reason from the named-return arm onto it.

**Ruling: never add a named return interface to a hook in order to create a documentation site.** A
hook's return type is part of its public API, so changing one is an API change rather than comment work.
An annotation added for hover reasons blanks every doc already written on the implementing
declarations _and_ on the return literal. It does so at every call site, with no error and no lint
finding. A named return type
earns its place when the _type_ is what wants naming: reuse across modules, a controller or a store
handed around. Then its members are where the docs go.

**Two docs on one action means one of them is dead.** Nothing renders the loser, anywhere, at any call
site. If you find a pair, delete the one that does not reach. Do not leave a reader to guess which of the
two they are looking at.

**A re-export line is not a documentation site. The original declaration is.** A value re-export carries
the original's block through untouched. The destructured form (`export const { a, b } = bag`) has exactly
one site: the source object's own longhand property. Where the original is third-party there is no site
at all, which is why `scripts/acceptance-mutation/gherkin-document.ts` leaves both of its blocks `//`.

**This is the one claim in this article a machine can check, and it now does.**
`rules/no-dead-doc-on-annotated-return-literal.yml` matches a JSDoc block standing inside an annotated
function's return literal. It covers all six function kinds and the arrow's parenthesised expression-body
form. It never judges prose. See `ast-grep-rules.md` for its matcher.

> **Four things here are deliberately unmeasured. Do not assume either way, in either direction:**
>
> - an inline type literal's member position
> - a longhand `name: fn` property's _precedence_ against a declaration doc, which is distinct from the
>   placement arm above
> - `{@link}` inside `@param`'s own type slot (`@param {@link X} value`)
> - `@example` in every respect
>
> The probe methods are in `doc-comments.rationale.md`. The constraint is here because it binds what you
> may write.

> A presence-only rule — "every export carries a doc" — was proposed alongside the ast-grep rule above
> and rejected. It cannot tell whether a summary says anything, and an empty `/** */` satisfies it. Read
> `doc-comments.rationale.md` before re-proposing it.

### 9. Syntax hazards

**TypeScript reads a JSDoc tag wherever whitespace precedes the `@`.** That includes the block's own
leading `*`, it holds regardless of what follows the `@`, and it holds inside a fenced code block. It
does not apply when a non-whitespace character precedes the `@`.

**One measured exception.** A `{@link …}` in a block tag's leading type slot is parsed as a tag even
though a brace precedes the `@`. That is why the type-slot rule below is stated separately rather than
derived from this one. Do not reason from the universal above to conclude a leading `{@link}` is
safe.

**So backtick any `@`-prefixed token, always. Never rely on a code fence to protect one.** A backslash
escape renders literally, so do not use it. Inside an `@example`, quotes make a package import safe; a
bare `@`-token starting an example line is not safe.

**A clean `npm run lint` is no evidence a block hovers as written.** oxlint's JSDoc parser reads a tag
only at the start of a JSDoc line, and is blind to a mid-line one. TypeScript's whitespace rule holds
anywhere in the block. The discipline stays human.

**A brace in a block tag's leading position is a _type slot_.** `@param` and `@returns` strip a
well-formed braced type. `@throws` and `@see` print it verbatim, so write a `@throws` exception type
bare. Never open `@throws` or `@returns` with `{@link …}`: it breaks the tag, and `@returns` loses its
text entirely. Put every other link in the tag's **prose**, where it resolves. Rule 7's
`@see {@link ./file.md}` is the one sanctioned leading-brace form.

Three more. The first is fatal, the second is silent and therefore worse, the third is a coexistence
ruling:

- **A `*/` inside prose terminates the block early** and leaves a syntax error. Reword such a line
  _before_ moving it into JSDoc, as its own commit.
- **Neither a blank line nor an intervening `//` block detaches a JSDoc block from the declaration below
  it.** Before treating any leading block as a module header, hover the first export.

- **`// prettier-ignore` and JSDoc coexist, in either order.** Write the three in this order, so the
  directive stays adjacent to the thing whose formatting it suppresses:

  1. the JSDoc block
  2. `// prettier-ignore`
  3. the declaration

  The other ordering reads as suppressing the comment's formatting, which it does not do.

**Why the blank-line hazard needs the hover test.** A file-leading JSDoc block that _looks_ like a module
header is silently documenting the first declaration under it. If prose comes back from that hover, the
block is already an interface comment, so partition it like one. A true module header must be `//`.

That hover test decides only a leading block that is already JSDoc. A leading `//` block always hovers as
nothing, so settle that one from content instead. Ask whether the block describes the file's exports
**jointly**, or is a multi-concern block that happens to sit above the first one.

**Where the `*/` hazard usually comes from.** Lines mentioning a glob like `**/run.ts` are the usual
source. See the commit discipline below.

## Part 2 — Reading

`coder`, `cleaner` and `architect` all write code against abstractions they did not author, and all three
carry `LSP`.

### 1. Hover before Read

To _use_ an abstraction — call it, wire it, review a call to it — `LSP hover` the symbol **at the call
site**, not at its declaration. If the hover answers your question, stop. Do not open the defining file.
That is the entire return on this convention.

### 2. `documentSymbol` before `Read` when you need a module's shape

It returns the symbol tree without any statement bodies. Know what it actually returns: not a clean
declaration list, but every top-level declaration _plus_ the local constants and object properties nested
inside each one. **It carries no doc prose at all.**

So `documentSymbol` is an inventory tool, and **hover remains the only channel that carries a contract.**
Reach for `Read` when you must _change_ a module, not when you must _call_ one.

### 3. Walk the tiers in order, and stop at the first that suffices

Hover → the sidecar `.md` if the JSDoc points at one → the implementation. An agent that opens the body
first has paid for all three.

### 4. A hover that does not suffice is a finding, not an inconvenience

If you had to open the body to use the thing correctly, the interface comment is incomplete. Each role
does something different with that:

- **`coder`** — note it in the handoff manifest. Fixing it is outside the slice.
- **`cleaner`** — fix it. A missing interface fact is naming-adjacent, which is already this role's
  charter.
- **`architect`** (REVIEW) — rule on whether the comment is thin or the module boundary is wrong. Only
  this role can make that call.

### 5. Know the silent-fallback trap

Roles fall back to `Grep`/`Read` **silently** when the language server is absent. So a hover returning
only a signature is ambiguous: _no JSDoc here_, or _no server at all_.

**The probe:** hover `isStrictEqual` in `src/equality/is-strict-equal.ts`. It must return prose plus an
`@see` link. A bare signature means the server is missing and every other hover this session is
worthless. Report that, not that the codebase is undocumented. If a later slice ever strips that block,
re-pin the probe on another documented export in the same pass rather than deleting it.

### 6. Do not spend a hover on what the type already says

The signature comes back either way. A hover earns its round-trip when there is prose behind it, so
hovering a two-line predicate whose name is its contract is pure cost.

### 7. Writing is verified by reading

After adding or changing an exported declaration, **hover it from a different file.** Ask whether what
came back would let you use it without opening the body. The cross-file position matters, because that is
where a caller actually stands.

Three hover hazards defeat that test, and each has a rule:

- **A hover can serve pre-edit text after a write the harness did not make.**
- **A hover that reveals a defect is not a defect until you have read the source.**
- **Pass `LSP` an absolute path, always.**

On the first: only `Edit` and `Write` update the server's copy of a file. A shell write does not reach
it. Neither does `git checkout`, `git rebase`, or `npm run format`. That copy then answers every later
hover on the file, for the whole session.

Refresh the file with any trivial `Edit` before you trust a hover on it. The refresh replaces the whole
copy, so it need not touch the lines you care about. A `Read` does not enrol a file, so a file you have
only read still hovers fresh. A rendering that must be **measured** rather than recalled goes in a
**new** file, one the server has not read yet.

On the second: staleness is not bounded by your own session's edits. A server can answer from a copy
predating a rebase, producing text that exists in no tree on disk. Confirm against the file before
reporting, always. One `sed -n` costs nothing next to a false finding filed against another role's work.

On the third: a relative path resolves against the session's working directory, which under the
one-slice-one-worktree protocol is not the tree you are editing. A path that exists in **both** trees
silently answers about the wrong one. The two copies agree everywhere the slice has not touched, so that
wrong answer is right most of the time.

**Do not use `Bad line number` as the diagnostic for a misroute.** The tsserver
`Debug Failure. Bad line number` error reports only that the server's line map disagrees with the
request, and that has more than one cause. Read it as _this hover is unsafe_, never as _that path was
relative_.

## Commit discipline for a partition sweep

Separate the mechanical move from the judgment, so each is reviewable on its own:

0. **Reword the syntax hazards first**, still as `//` comments, with no relocation.
1. **Partition each block into its interface and implementation halves**, and relocate them.
2. **Author the summaries and any tags.**

Step 0 covers the `*/` lines and any whitespace-preceded `@` token. It is small, individually reviewable,
and it establishes the baseline step 1 preserves.

Step 1 changes no line's wording, only its location and its comment marker. Verify it: strip the markers
from both sides of the diff. Then assert that the union of the halves equals the commit-0 baseline.

Step 2 is the judgment half, separated so it cannot hide inside the relocation.

Run `npm run format:check` and `npm run build` per commit, plus `npm test` after any `src/` batch.

**A comment cannot legitimately move `crap4ts`, `dry4ts`, or a mutation score.** Record all three at the
start of a sweep and compare at the end. Treat a moved number as a finding to explain, not as a new
baseline.
