/**
 * Renders the row count.
 * @param props the caller's row count and its label.
 * @returns the rendered count.
 */
export function TagGood(props: { n: number }) {
  return (
    <span>
      {/* The same JSX block, with the same at-rule, and it must stay silent. A
          bare at-rule wrapped onto its own line is the rule's one residue, and
          `@supports` backticked is the remedy the message names. Strip the
          backticks and this fixture reports. */}
      {props.n}
    </span>
  )
}
