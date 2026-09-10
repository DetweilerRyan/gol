// argv parsing for the one accepted flag, `--diff <range>` -- a thin wrapper
// over ../single-flag-arg.ts's parseSingleStringFlag (which also backs
// acceptance-mutation/discovery.ts's `--feature <name>`; dry4ts flagged the
// two hand-written copies as a duplicate). This module's own job is just
// translating that `string | undefined` into the plain `{ range?: string }`
// this program's decide() wants -- `range`, not `diff`, because that's the
// name decide.ts's DiffInput carries.

import { parseSingleStringFlag } from '../single-flag-arg.ts'

export interface ParsedArgs {
  range?: string
}

/**
 * @throws Error if `argv` carries anything but an optional `--diff <range>`.
 */
export function parseArgs(argv: string[]): ParsedArgs {
  const range = parseSingleStringFlag(argv, 'diff', '--diff <range>')
  return range === undefined ? {} : { range }
}
