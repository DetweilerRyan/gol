/**
 * Checks if two values are strictly equal using Object.is().
 * This function is preferable over using the `===` operator
 * because it handles special cases like `NaN` and `-0` vs `+0`.
 *
 * The only advantage of using this over Object.is is that this
 * function is better typed.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is
 */
export function isStrictEqual<T>(a: T, b: T): boolean {
  return Object.is(a, b)
}
