// Shared by every program's argv parser that accepts exactly one optional
// string flag (`acceptance-mutation`'s `--feature <name>`,
// `mutation-invariance`'s `--diff <range>`) -- hoisted here after dry4ts
// flagged the two hand-written copies as a 0.94-similarity duplicate.
// node:util's own parseArgs already rejects an unknown flag, a missing
// value, and a bare positional argument under `strict: true` and
// `allowPositionals: false` (both its defaults since Node 18.3), so this
// module's only job is translating its `values` shape into a plain
// `string | undefined` and appending the accepted form to whatever message
// parseArgs itself throws -- the message fix each caller wanted, without
// either one reclaiming the parsing loop.

import { parseArgs as nodeParseArgs } from 'node:util'

/**
 * Parses `argv` for exactly one optional string flag, `--<flag> <value>`
 * (or `--<flag>=<value>`). Returns the flag's value, or `undefined` if the
 * flag was not given.
 *
 * @throws Error naming the offending argument and `acceptedForm`, on any unknown flag, missing value, or positional argument.
 */
export function parseSingleStringFlag(argv: string[], flag: string, acceptedForm: string): string | undefined {
  let values: Record<string, string | boolean | undefined>
  try {
    ;({ values } = nodeParseArgs({
      args: argv,
      options: { [flag]: { type: 'string' } },
      strict: true,
      allowPositionals: false,
    }))
  } catch (error) {
    // `as Error` rather than an `error instanceof Error` narrowing:
    // parseArgs throws only ERR_PARSE_ARGS_*/ERR_INVALID_ARG_TYPE, both
    // Error subclasses, so the non-Error arm is unreachable by construction
    // and therefore invisible to every gate here.
    throw new Error(`${(error as Error).message}. The only accepted argument is ${acceptedForm}.`)
  }
  return values[flag] as string | undefined
}
