# The JsDoc style, owned by `architect`

Rules that mechanically enforce this repo's conventions over JSDoc blocks — mostly
`.claude/agents/articles/doc-comments.md`, and `engineering.md`'s indexical clause.

`architect` alone authors or changes a rule here, on the `ast-grep` precedent. Every other role
reads the output and reports tensions to it.

Every rule ships a `../fixtures/<Rule>.bad.<ext>` that must report exactly that rule, and a
`../fixtures/<Rule>.good.<ext>` that must report nothing. It ships that pair for every extension its
own `scope:` claims.

**Which extensions a rule claims is a per-rule ruling**, and a rule records its answer in its own
header. The test is whether the rule assumes the block comment is an interface doc. See
`.claude/agents/articles/prose-linting.md`, "Each rule declares its own extensions".
