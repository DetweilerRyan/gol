// Finds every occurrence of the role-cycle chain (e.g. "product → coder →
// cleaner → architect → hardener → product") across the docs, built from
// whatever roles currently exist rather than a hardcoded word list, so a
// role rename is picked up automatically by check4 rather than needing a
// second manual update. Only chains built entirely from known role names
// count, and only chains of three or more roles (two or more arrows) --
// CLAUDE.md and the agent files use the same "→" glyph for other, unrelated
// chains (e.g. "framework-free → hook → component", "Grid → GridCells →
// Cell"), and a plain arrow-chain scan would misread those as a cycle
// mention. Every occurrence found in this repo's docs today is the full
// six-link cycle, but a shorter, still-all-roles fragment is accepted too --
// nothing in the source docs currently produces one, so this is future
// headroom rather than something exercised today.

export interface CycleMention {
  text: string
  line: number
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function findCycleMentions(text: string, knownRoles: ReadonlySet<string>): CycleMention[] {
  if (knownRoles.size === 0) return []
  const roleAlternation = [...knownRoles].map(escapeRegExp).join('|')
  const pattern = new RegExp(`\\b(?:${roleAlternation})(?:\\s*→\\s*(?:${roleAlternation})){2,}\\b`, 'g')
  const mentions: CycleMention[] = []
  text.split('\n').forEach((line, index) => {
    for (const match of line.matchAll(pattern)) {
      mentions.push({ text: match[0], line: index + 1 })
    }
  })
  return mentions
}
