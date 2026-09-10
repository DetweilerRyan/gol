/**
 * Renders the row count the last parse produced.
 *
 * @summary a tag oxlint accepts and doc-comments.md rule 5 does not
 */
export function TagBad() {
  return (
    <span>
      {/* The JSX block is the shape .ts has no counterpart for, and the rule
          fires here too. A bare at-rule wrapped onto its own line, such as
          @supports, opens a source line and is indistinguishable from a block
          tag. Backticking it is the remedy, and the good fixture pins it. */}
      0
    </span>
  )
}
