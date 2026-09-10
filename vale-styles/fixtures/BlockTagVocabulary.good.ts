/**
 * Adds two lengths that are already in the caller's own unit, and returns the
 * sum in that same unit rather than a normalised one.
 *
 * Three near-misses live in the paragraph above and below on purpose. An
 * at-rule such as `@media` written inside prose, an address a@b.example
 * written inside prose, and an inline {@link ./README.md} are none of them
 * block tags, so none may fire.
 *
 * @example
 * ```ts
 * // @summary inside a fenced block reaches no hover, so it may not fire
 * const total = addLengths(1, 2)
 * ```
 *
 * @param left must already be in the caller's unit
 * @param right must be in that same unit
 * @returns the sum, in the caller's unit
 * @throws RangeError when either side is not finite
 * @see {@link ./README.md}
 */
export function addLengths(left: number, right: number): number {
  if (!Number.isFinite(left) || !Number.isFinite(right)) throw new RangeError('not finite')
  return left + right
}
