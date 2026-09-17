export interface CycleMention {
  text: string
  line: number
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Finds every occurrence of the role-cycle chain (e.g. "product → coder →
 * cleaner → architect → hardener → product") across the docs, built from
 * whatever roles currently exist rather than a hardcoded word list, so a
 * role rename is picked up automatically by check4 rather than needing a
 * second manual update. Only chains built entirely from known role names
 * count, and only chains of three or more roles (two or more arrows) --
 * CLAUDE.md and the agent files use the same "→" glyph for other, unrelated
 * chains (e.g. "framework-free → hook → component", "Grid → GridCells →
 * Cell"), and a plain arrow-chain scan would misread those as a cycle
 * mention.
 *
 * A chain in which any link carries a parenthetical mode marker (e.g.
 * "product (SPECIFY) → coder → cleaner") is a pipeline sequence, not a cycle
 * mention, and is never reported -- nor is a bare sub-chain found inside
 * one. Only a chain with no parenthetical on any link is reported, and it
 * must still match the canonical form byte-for-byte.
 */
// `.claude/references/pipelines.md` writes the parenthetical-decorated form
// and has no obligation to match the canonical cycle string byte-for-byte --
// that is why a decorated chain is excluded outright rather than flagged as
// a divergent mention. The whole decorated chain is matched greedily as one
// unit, so a fully-bare sub-chain inside it (e.g. "coder → cleaner →
// architect") is consumed as part of that match and never considered as a
// separate mention.
// Every bare occurrence found in this repo's docs today is the full six-link
// cycle, but a shorter, still-all-roles fragment is accepted too -- nothing
// in the source docs currently produces one, so this is future headroom
// rather than something exercised today.
export function findCycleMentions(text: string, knownRoles: ReadonlySet<string>): CycleMention[] {
  if (knownRoles.size === 0) return []
  const roleAlternation = [...knownRoles].map(escapeRegExp).join('|')
  // A parenthetical mode marker is optional on each link, so it is consumed
  // as part of the same match as the role name it follows -- that is what
  // keeps a decorated chain's bare sub-chain from ever being extracted on
  // its own, since matchAll never revisits text a prior match consumed.
  const modeMarker = `(?:\\s*\\([^()]*\\))?`
  const link = `(?:${roleAlternation})\\b${modeMarker}`
  const pattern = new RegExp(`\\b${link}(?:\\s*→\\s*${link}){2,}`, 'g')
  const mentions: CycleMention[] = []
  text.split('\n').forEach((line, index) => {
    for (const match of line.matchAll(pattern)) {
      if (match[0].includes('(')) continue
      mentions.push({ text: match[0], line: index + 1 })
    }
  })
  return mentions
}
