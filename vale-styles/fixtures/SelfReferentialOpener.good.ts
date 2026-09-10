/**
 * Reports how many rows the last parse produced. This function-shaped
 * referring expression sits mid-paragraph rather than opening one, so the
 * anchor must keep it silent -- that is what pins `^` as paragraph-start
 * rather than as per-source-line.
 *
 * Locates spans and nothing else. This module does not decide what to do when
 * a file cannot be parsed at all; that belongs to the caller, which has the
 * target name to attach to the error. A boundary statement like that one is an
 * interface fact under rule 3, and it is why the anchor earns its keep.
 */
export function rowsParsedPlain(): number {
  return 0
}
