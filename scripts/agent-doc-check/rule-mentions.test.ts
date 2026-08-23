import { describe, expect, it } from 'vitest'
import { extractMentionedRuleIds, extractRulePathMentions } from './rule-mentions.ts'

describe('extractRulePathMentions', () => {
  it('reads the id out of a `rules/<id>.yml` path mention', () => {
    expect(extractRulePathMentions('see `rules/no-dom-in-domain.yml` for the rule')).toEqual(['no-dom-in-domain'])
  })

  it('finds every distinct path mention in a longer passage, duplicates included', () => {
    const text =
      '`rules/no-dom-in-domain.yml` and again `rules/no-dom-in-domain.yml`, also `rules/no-react-in-domain.yml`'
    expect(extractRulePathMentions(text)).toEqual(['no-dom-in-domain', 'no-dom-in-domain', 'no-react-in-domain'])
  })

  it('returns an empty array when there is no path mention', () => {
    expect(extractRulePathMentions('just the bare id `no-dom-in-domain`')).toEqual([])
  })
})

describe('extractMentionedRuleIds', () => {
  it('includes a bare backticked rule id', () => {
    expect(extractMentionedRuleIds('the `no-react-in-domain` rule')).toContain('no-react-in-domain')
  })

  it('includes an id mentioned only via a full `rules/<id>.yml` path', () => {
    expect(extractMentionedRuleIds('see `rules/no-dom-in-domain.yml`')).toContain('no-dom-in-domain')
  })

  it('synthesizes the second id out of this repo\'s "`X-ts` / `-tsx`" shorthand pairing', () => {
    const mentioned = extractMentionedRuleIds('manual memo (`no-manual-memo-ts` / `-tsx`)')
    expect(mentioned).toContain('no-manual-memo-ts')
    expect(mentioned).toContain('no-manual-memo-tsx')
  })

  it('synthesizes the shorthand pairing when joined by "and" instead of "/"', () => {
    const mentioned = extractMentionedRuleIds('why `no-manual-memo-ts` and `-tsx` are near-duplicates')
    expect(mentioned).toContain('no-manual-memo-tsx')
  })

  it('does not include a rule id nowhere mentioned', () => {
    expect(extractMentionedRuleIds('nothing relevant here')).not.toContain('no-react-in-domain')
  })
})
