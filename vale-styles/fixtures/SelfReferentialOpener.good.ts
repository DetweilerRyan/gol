/**
 * Reports how many rows the last parse produced, counted once at the end.
 * This function-shaped referring expression opens a SOURCE LINE rather than a
 * paragraph, and must stay silent. That is what pins `^` as paragraph-start:
 * `(?m)^` fires on this line, and a bare `^` does not.
 *
 * Locates spans and nothing else, and the sentence below opens a line too.
 * This module does not decide what to do when a file cannot be parsed at all;
 * that belongs to the caller, which has the target name to attach to the
 * error. A boundary statement like that one is an interface fact under rule 3,
 * and it is why the anchor earns its keep.
 */
export function rowsParsedPlain(): number {
  return 0
}
