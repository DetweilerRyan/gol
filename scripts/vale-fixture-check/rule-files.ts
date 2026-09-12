// Which extensions a rule claims, derived from the rule's own `scope:`.
//
// `.claude/agents/articles/prose.md` makes this a per-rule ruling rather than a
// per-style default, and the two tracked registers express it differently:
//
//   - A JsDoc rule names syntax scopes explicitly -- `text.comment.block.ts`,
//     `text.comment.block.tsx`. Those ARE the claim, and a rule reaching both
//     writes both, because a list is an OR and `.ts` never reaches a `.tsx` file.
//     Both are Vale scope selectors rather than paths, and reference-check reads
//     a dotted token ending in a known suffix as a filename.
// reference-check: allow text.comment.block.ts -- a Vale syntax scope selector, not a file
// reference-check: allow text.comment.block.tsx -- a Vale syntax scope selector, not a file
//   - An Instruction or Procedure rule names a markup scope -- `raw`, `list`,
//     `paragraph`, `sentence`. Those carry no extension, and the surface those
//     styles are enabled on is Markdown.
//
// SO THE `.md` FALLBACK IS AN ASSUMPTION, NOT A READING. It is right for every
// rule tracked today and it is the safe direction: a rule that claims `.md` and
// means something else fails check 1 loudly, by naming a fixture pair nobody
// wrote. The dangerous direction would be inferring NO extension and checking
// nothing, which is the fail-open shape every checker here is built against.

const COMMENT_SCOPE = /text\.comment\.[A-Za-z]+\.([A-Za-z]+)/g

/** One rule file: its style, its rule name, and the extensions it claims. */
export interface RuleFile {
  style: string
  name: string
  path: string
  extensions: string[]
}

/**
 * Extensions a rule's `scope:` claims, as bare suffixes without the dot
 * (`['ts', 'tsx']`, or `['md']` when the scope names no syntax scope).
 * Deduplicated and ordered as first seen, so a fixture roster reads stably.
 */
export function claimedExtensions(ruleText: string): string[] {
  const found: string[] = []
  for (const match of ruleText.matchAll(COMMENT_SCOPE)) {
    const ext = match[1]
    if (ext !== undefined && !found.includes(ext)) found.push(ext)
  }
  return found.length > 0 ? found : ['md']
}

/** Builds one RuleFile from a style name, a file path and the file's text. */
export function toRuleFile(style: string, filePath: string, text: string): RuleFile {
  const base = filePath.slice(filePath.lastIndexOf('/') + 1)
  return { style, name: base.replace(/\.ya?ml$/, ''), path: filePath, extensions: claimedExtensions(text) }
}
