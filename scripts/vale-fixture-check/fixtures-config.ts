// Parses `vale-styles/fixtures/fixtures.vale.ini` into the one fact check 5
// needs: for each section glob, which styles that section enables.
//
// This is a line-anchored reader rather than a real INI parser, for the same
// reason agent-doc-check's frontmatter reader is bespoke -- the file is written
// for humans and carries `;` comment lines a strict parser would refuse. The
// grammar consumed here is two productions: a `[glob]` section header, and a
// `BasedOnStyles = A, B` assignment inside one.
//
// A style enabled in NO section is the defect check 5 exists to catch. That is
// exactly how `Procedure` would have entered the tree: its rules and fixtures
// all present and correct, its fixtures never linted, and every other check in
// this program passing because it saw nothing to complain about.

/** One `[glob]` section of the fixture config and the styles it enables. */
export interface FixtureSection {
  glob: string
  styles: string[]
}

const SECTION = /^\[(.+)]$/
const BASED_ON = /^BasedOnStyles\s*=\s*(.*)$/
const BRACED_SUFFIXES = /^\*\.\{(.+)}$/

/** The glob a `[…]` header names, or undefined when the line is not a header. */
function sectionGlob(line: string): string | undefined {
  return SECTION.exec(line)?.[1]
}

/**
 * The styles a `BasedOnStyles =` line enables, or undefined when the line is
 * not one. An empty assignment yields an empty list rather than undefined: it
 * enables nothing, which is how the exemption sections are written.
 */
function styleList(line: string): string[] | undefined {
  const assignment = BASED_ON.exec(line)?.[1]
  if (assignment === undefined) return undefined
  return assignment
    .split(',')
    .map((style) => style.trim())
    .filter((style) => style.length > 0)
}

/**
 * Sections in file order. A section with no `BasedOnStyles` line yields an
 * empty `styles`, which is a real answer rather than an omission: it means
 * that glob enables nothing. An assignment before any header is dropped,
 * since it belongs to no section.
 *
 * THERE IS NO EXPLICIT SKIP FOR BLANK AND `;` COMMENT LINES, and there was one
 * until mutation testing showed no test could distinguish it. Both regexes are
 * anchored at the start of the trimmed line, so a comment fails `^\[` and
 * `^BasedOnStyles` on its own, and a blank line fails both. The guard could not
 * change a result. Restore it only alongside a change that unanchors either
 * pattern -- and that change owes a test proving the guard now matters.
 */
export function parseFixtureSections(iniText: string): FixtureSection[] {
  const sections: FixtureSection[] = []
  for (const rawLine of iniText.split('\n')) {
    const line = rawLine.trim()
    const glob = sectionGlob(line)
    if (glob !== undefined) {
      sections.push({ glob, styles: [] })
      continue
    }
    const styles = styleList(line)
    const current = sections.at(-1)
    if (styles !== undefined && current !== undefined) current.styles = styles
  }
  return sections
}

/**
 * Whether a section glob covers a bare extension suffix. The fixture config
 * writes `[*.md]` and `[*.{ts,tsx}]`, so brace expansion is the only form
 * needing a reader; a glob naming one suffix is matched literally.
 */
export function sectionCoversExtension(glob: string, extension: string): boolean {
  const braced = BRACED_SUFFIXES.exec(glob)?.[1]
  if (braced !== undefined) return braced.split(',').some((part) => part.trim() === extension)
  return glob === `*.${extension}`
}
