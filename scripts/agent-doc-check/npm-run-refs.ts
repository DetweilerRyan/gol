// Extracts every `npm run <script>` reference from markdown prose, for
// checks.ts's check1 to confirm each one names a real package.json script.
// A script name is read as a run of [a-zA-Z0-9:_-] characters immediately
// after the literal "npm run " -- exactly the character set this repo's
// package.json script names use (colons separate scoped names like
// test:mutation:scripts) -- so the match naturally stops at the space
// before a trailing flag (as in "npm run crap4ts -- --verbose") or at
// whatever punctuation/backtick markdown wraps the reference in.

const NPM_RUN_REFERENCE = /\bnpm run ([a-zA-Z0-9:_-]+)/g

export function extractNpmRunReferences(text: string): string[] {
  return [...text.matchAll(NPM_RUN_REFERENCE)].map((match) => match[1])
}
