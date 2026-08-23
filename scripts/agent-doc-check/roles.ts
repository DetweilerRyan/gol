// The role vocabulary check3 (no stale role references) needs: which roles
// used to exist but were retired.
//
// RETIRED_ROLES is a hand-kept list rather than something discovered off
// disk at runtime, and deliberately small: `git log --all --diff-filter=D
// --name-only -- '.claude/agents/*.md'` (excluding articles/, which holds
// no per-role files) names exactly these three as ever having been deleted
// from that directory -- `specifier` and `qa` were merged into `product`,
// `refactorer` became `cleaner`.
//
// A generic "any backticked, role-shaped word" scan was tried first and
// rejected: run over this repo's own docs, a plain backtick scan near the
// literal word "role" flagged `tsx`, `main`, `ast-grep`, and
// `fix-tile-hysteresis` alongside the real historical mentions of `qa` --
// six false positives to two true ones, which is worse than not checking
// at all (a noisy gate trains people to ignore it). Scoping to this short,
// git-verified list keeps the check at zero known false positives while
// still catching the exact mistake the manual sweep this program replaces
// was for: a stale reference to a role that used to exist. The tradeoff is
// real -- a role retired after this list was last updated won't be caught
// until someone adds it here -- but role retirements are rare, deliberate,
// user-directed events (see workflow.md), which is exactly the kind of
// change that should also touch this list.
export const RETIRED_ROLES = ['qa', 'refactorer', 'specifier']

// Words that, on the same line as a retired-role mention, mark it as
// deliberate historical prose rather than a stale reference to a role that
// no longer exists (e.g. "the old `qa` role", "(then `qa`, now `product`)",
// "the `specifier`+`qa` -> `product` merge"). This repo writes each doc
// paragraph/bullet as one long line (verified: no manually wrapped
// prose in CLAUDE.md or .claude/agents/**), so "same line" is a reliable,
// simple proxy for "same sentence" here without needing real sentence
// splitting.
const HISTORICAL_QUALIFIER = /\b(old|former|then|merge|merged|moved|retired|used to)\b/i

const BACKTICKED_TOKEN = /`([a-z][a-z-]*)`/g

export interface StaleRoleReference {
  role: string
  line: number
  lineText: string
}

export function findStaleRoleReferences(text: string): StaleRoleReference[] {
  const retired = new Set(RETIRED_ROLES)
  const found: StaleRoleReference[] = []
  text.split('\n').forEach((line, index) => {
    if (HISTORICAL_QUALIFIER.test(line)) return
    for (const match of line.matchAll(BACKTICKED_TOKEN)) {
      const token = match[1]
      if (!retired.has(token)) continue
      found.push({ role: token, line: index + 1, lineText: line.trim() })
    }
  })
  return found
}
