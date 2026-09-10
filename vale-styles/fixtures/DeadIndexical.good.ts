/**
 * Reports the exit code the checker settled on. The second return value
 * arrived with `split-grid-render-props`, so a caller written before that
 * slice may ignore it -- a named slice resolves through `git tag -l`, which is
 * the whole point of naming one.
 *
 * Near-misses live here on purpose. A pass over the tree, the slice that owns
 * a rule, and a commit message are all ordinary nouns, and none of them may
 * fire.
 */
export function exitCodeSettledNamed(): number {
  return 0
}
