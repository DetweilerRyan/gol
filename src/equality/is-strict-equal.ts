/**
 * Checks whether two values are strictly equal, using Object.is().
 *
 * Prefer it over `===`, which reports two `NaN`s as unequal and `-0` and `+0`
 * as equal. The only gain over calling Object.is() directly is the tighter
 * type: both sides are the same `T`.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is
 */
export function isStrictEqual<T>(a: T, b: T): boolean {
  return Object.is(a, b)
}
