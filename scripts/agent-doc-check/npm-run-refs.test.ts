import { describe, expect, it } from 'vitest'
import { extractNpmRunReferences } from './npm-run-refs.ts'

describe('extractNpmRunReferences', () => {
  it('reads a bare `npm run <script>` reference', () => {
    expect(extractNpmRunReferences('run `npm run build` first')).toEqual(['build'])
  })

  it('reads a colon-scoped script name in full, since colons separate scoped names like test:mutation:scripts', () => {
    expect(extractNpmRunReferences('see `npm run test:mutation:scripts`')).toEqual(['test:mutation:scripts'])
  })

  it('stops at the space before a trailing flag, e.g. `npm run crap4ts -- --verbose`', () => {
    expect(extractNpmRunReferences('`npm run crap4ts -- --verbose` distinguishes the two cases')).toEqual(['crap4ts'])
  })

  it('finds every reference in a longer passage, in order, including duplicates', () => {
    const text = 'first `npm run build`, then `npm run test:unit`, and again `npm run build`.'
    expect(extractNpmRunReferences(text)).toEqual(['build', 'test:unit', 'build'])
  })

  it('returns an empty array when there is no reference at all', () => {
    expect(extractNpmRunReferences('nothing to see here')).toEqual([])
  })

  it('does not read an angle-bracketed placeholder as a script name', () => {
    // The safe way to write a hypothetical example in these docs -- see the
    // module comment. A bare kebab-case placeholder with no brackets (e.g.
    // "npm run some-script") does NOT get this pass: it reads exactly like
    // a real reference and check1 will flag it as unresolved.
    expect(extractNpmRunReferences('e.g. `npm run <script-name>`')).toEqual([])
  })
})
