// argv parsing for the one accepted flag, `--diff <range>` -- mirrors
// acceptance-mutation/discovery.ts's parseArgs: node:util's parseArgs
// already rejects an unknown flag, a missing value, and a bare positional
// under `strict: true` (its default) and `allowPositionals: false` (also
// its default once strict is true), so there is no hand-rolled validation
// loop to write. This module only translates its `values` shape into the
// plain `{ range?: string }` this program's decide() wants, and improves the
// thrown message with the one form that's actually accepted.

import { parseArgs as nodeParseArgs } from 'node:util'

export interface ParsedArgs {
  range?: string
}

/**
 * @throws Error if `argv` carries anything but an optional `--diff <range>`.
 */
export function parseArgs(argv: string[]): ParsedArgs {
  let values: { diff?: string }
  try {
    ;({ values } = nodeParseArgs({
      args: argv,
      options: { diff: { type: 'string' } },
      strict: true,
      allowPositionals: false,
    }))
  } catch (error) {
    // Same idiom as acceptance-mutation/discovery.ts's parseArgs: `as Error`
    // rather than an `instanceof` narrowing, since node:util's parseArgs
    // throws only ERR_PARSE_ARGS_*/ERR_INVALID_ARG_TYPE, both Error
    // subclasses, so the non-Error arm is unreachable by construction and
    // therefore invisible to every gate here.
    throw new Error(`${(error as Error).message}. The only accepted argument is --diff <range>.`)
  }
  return values.diff === undefined ? {} : { range: values.diff }
}
