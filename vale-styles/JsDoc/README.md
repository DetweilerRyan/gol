# The JsDoc style, owned by `architect`

Rules that mechanically enforce this repo's conventions over JSDoc blocks — mostly
`.claude/agents/articles/doc-comments.md`, and `engineering.md`'s indexical clause.

`architect` alone authors or changes a rule here, on the `ast-grep` precedent. Every other role
reads the output and reports tensions to it.

Every rule ships a `../fixtures/<Rule>.bad.ts` that must report exactly that rule, and a
`../fixtures/<Rule>.good.ts` that must report nothing.
