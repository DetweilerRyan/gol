// Extracts rule-id mentions out of CLAUDE.md's prose for check5.
//
// extractRulePathMentions reads the one form of a rule reference that is
// unambiguous in this repo's docs -- an explicit `rules/<id>.yml` path --
// which is why it's the only signal check5's reverse direction (a path
// naming a rule file that no longer exists) uses: a bare backticked id like
// `no-react-in-domain` is indistinguishable, by shape alone, from any other
// backticked kebab-case identifier in these docs (`acceptance-mutation`,
// `split-grid-render-props`, ...), so treating every such token as a
// candidate rule reference would make the reverse direction as noisy as the
// generic "role-shaped token" scan rejected in roles.ts.
//
// extractMentionedRuleIds is the forward direction instead: does CLAUDE.md
// mention this real rule id at all. It's deliberately permissive -- every
// backticked token counts as a candidate, since a false-positive candidate
// here only means "counts as mentioned," never "flagged as missing" -- plus
// this repo's one paired-shorthand convention, "`no-manual-memo-ts` /
// `-tsx`" (or "... and `-tsx`"), which reads as "no-manual-memo-ts and
// no-manual-memo-tsx" to a human but never spells the second id out in
// full. synthesizeShorthandIds recovers it so the forward check doesn't
// misreport a real mention as missing.

const RULE_PATH_MENTION = /rules\/([a-zA-Z0-9_-]+)\.ya?ml/g
const BACKTICKED_TOKEN = /`([a-zA-Z0-9_-]+)`/g
const SHORTHAND_PAIR = /`([a-zA-Z0-9_-]+-[a-zA-Z0-9]+)`\s*(?:\/|and)\s*`(-[a-zA-Z0-9_-]+)`/g

export function extractRulePathMentions(text: string): string[] {
  return [...text.matchAll(RULE_PATH_MENTION)].map((match) => match[1])
}

function synthesizeShorthandIds(text: string): string[] {
  const synthesized: string[] = []
  for (const match of text.matchAll(SHORTHAND_PAIR)) {
    const [, prefixToken, suffixToken] = match
    const stem = prefixToken.replace(/-[^-]+$/, '')
    synthesized.push(stem + suffixToken)
  }
  return synthesized
}

export function extractMentionedRuleIds(text: string): Set<string> {
  const bareTokens = [...text.matchAll(BACKTICKED_TOKEN)].map((match) => match[1])
  return new Set([...bareTokens, ...extractRulePathMentions(text), ...synthesizeShorthandIds(text)])
}
