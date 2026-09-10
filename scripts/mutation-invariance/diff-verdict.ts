// Whether a landing diff is mutation-invariant under CLAUDE.md's
// merge-protocol step 5 predicate: every changed path is covered by an
// `allow[]` entry. `absent[]` never participates in the decision -- it
// supplies only the explanatory reason printed alongside a "not invariant"
// verdict, for the (common) case where the disqualifying path was
// considered and explicitly ruled unsafe rather than simply unlisted.

import { matchesChangedPath } from './path-forms.ts'
import type { AbsentEntry, MutationInvarianceConfig } from './config-file.ts'

export interface DiffVerdict {
  invariant: boolean
  reason?: string
  disqualifying?: { path: string; absentReason?: string }
}

function findAbsentReason(absent: AbsentEntry[], path: string): string | undefined {
  return absent.find((entry) => matchesChangedPath(entry.path, path))?.reason
}

/**
 * The verdict for one landing diff: `invariant` is true only when every path
 * in `changedPaths` is covered by some `allow[]` entry. An empty
 * `changedPaths` is never invariant -- it's treated as a signal to check the
 * diff range rather than as a vacuous pass.
 */
export function evaluateDiff(changedPaths: string[], config: MutationInvarianceConfig): DiffVerdict {
  if (changedPaths.length === 0) {
    return { invariant: false, reason: 'the diff listed no changed paths -- check the range' }
  }

  for (const path of changedPaths) {
    const covered = config.allow.some((entry) => matchesChangedPath(entry.path, path))
    if (covered) continue
    return {
      invariant: false,
      reason: `${path} is not covered by any allow[] entry`,
      disqualifying: { path, absentReason: findAbsentReason(config.absent, path) },
    }
  }

  return { invariant: true }
}
