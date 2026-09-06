// Extracts rule-id mentions out of doc prose for check5.

const RULE_PATH_MENTION = /rules\/([a-zA-Z0-9_-]+)\.ya?ml/g
const BACKTICKED_TOKEN = /`([a-zA-Z0-9_-]+)`/g
const SHORTHAND_PAIR = /`([a-zA-Z0-9_-]+-[a-zA-Z0-9]+)`\s*(?:\/|and)\s*`(-[a-zA-Z0-9_-]+)`/g

/**
 * The one form of a rule reference that is unambiguous in this repo's docs --
 * an explicit `rules/<id>.yml` path -- which is why it's the only signal
 * check5's reverse direction (a path naming a rule file that no longer
 * exists) uses: a bare backticked id like `no-react-in-domain` is
 * indistinguishable, by shape alone, from any other backticked kebab-case
 * identifier in these docs (`acceptance-mutation`, `split-grid-render-props`,
 * ...), so treating every such token as a candidate rule reference would make
 * the reverse direction as noisy as the generic "role-shaped token" scan
 * rejected in roles.ts.
 */
export function extractRulePathMentions(text: string): string[] {
  return [...text.matchAll(RULE_PATH_MENTION)].map((match) => match[1])
}

// Recovers this repo's one paired-shorthand convention, "`no-manual-memo-ts`
// / `-tsx`" (or "... and `-tsx`"), which reads as "no-manual-memo-ts and
// no-manual-memo-tsx" to a human but never spells the second id out in full
// -- so the forward check in extractMentionedRuleIds below doesn't misreport
// a real mention as missing.
function synthesizeShorthandIds(text: string): string[] {
  const synthesized: string[] = []
  for (const match of text.matchAll(SHORTHAND_PAIR)) {
    const [, prefixToken, suffixToken] = match
    const stem = prefixToken.replace(/-[^-]+$/, '')
    synthesized.push(stem + suffixToken)
  }
  return synthesized
}

/**
 * Every token in the rule documentation file (run.ts's ruleDocFile) that could
 * be a mention of a rule id -- check5's forward direction, "is this real rule
 * named anywhere roles will read." Deliberately permissive: every backticked
 * token counts as a candidate (plus every path mention and every synthesized
 * shorthand pair), since a false-positive candidate here only means "counts as
 * mentioned," never "flagged as missing."
 */
export function extractMentionedRuleIds(text: string): Set<string> {
  const bareTokens = [...text.matchAll(BACKTICKED_TOKEN)].map((match) => match[1])
  return new Set([...bareTokens, ...extractRulePathMentions(text), ...synthesizeShorthandIds(text)])
}
