# The JsDoc style, owned by `architect`

Rules that mechanically enforce `.claude/agents/articles/doc-comments.md` over JSDoc blocks.

`architect` alone authors or changes a rule here, on the `ast-grep` precedent. Every other role
reads the output and reports tensions to it.

Every rule ships a `../fixtures/<Rule>.bad.ts` that must report exactly that rule, and a
`../fixtures/<Rule>.good.ts` that must report nothing.
