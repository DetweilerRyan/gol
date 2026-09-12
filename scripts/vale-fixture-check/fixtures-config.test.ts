import { describe, expect, it } from 'vitest'
import { parseFixtureSections, sectionCoversExtension } from './fixtures-config.ts'

describe('parseFixtureSections', () => {
  it('reads one style list per section, in file order', () => {
    const ini = '[*.{ts,tsx}]\nBasedOnStyles = JsDoc\n\n[*.md]\nBasedOnStyles = Instruction, Procedure\n'
    expect(parseFixtureSections(ini)).toEqual([
      { glob: '*.{ts,tsx}', styles: ['JsDoc'] },
      { glob: '*.md', styles: ['Instruction', 'Procedure'] },
    ])
  })

  it('ignores `;` comment lines, which a strict INI parser would refuse', () => {
    const ini = '; a comment naming [*.md] and BasedOnStyles = Decoy\n[*.md]\nBasedOnStyles = Instruction\n'
    expect(parseFixtureSections(ini)).toEqual([{ glob: '*.md', styles: ['Instruction'] }])
  })

  it('gives a section with no BasedOnStyles an empty list -- that glob enables nothing', () => {
    expect(parseFixtureSections('[*.md]\n')).toEqual([{ glob: '*.md', styles: [] }])
  })

  it('ignores a BasedOnStyles line before any section header', () => {
    expect(parseFixtureSections('BasedOnStyles = Orphan\n')).toEqual([])
  })

  it('trims whitespace around each style name', () => {
    expect(parseFixtureSections('[*.md]\nBasedOnStyles =   A ,  B  \n')[0]?.styles).toEqual(['A', 'B'])
  })

  it('reads an empty assignment as enabling nothing, which is how the exemption sections are written', () => {
    expect(parseFixtureSections('[*.md]\nBasedOnStyles =\n')[0]?.styles).toEqual([])
  })
})

describe('sectionCoversExtension', () => {
  it('expands a brace glob', () => {
    expect(sectionCoversExtension('*.{ts,tsx}', 'ts')).toBe(true)
    expect(sectionCoversExtension('*.{ts,tsx}', 'tsx')).toBe(true)
    expect(sectionCoversExtension('*.{ts,tsx}', 'md')).toBe(false)
  })

  it('matches a single-suffix glob literally', () => {
    expect(sectionCoversExtension('*.md', 'md')).toBe(true)
    expect(sectionCoversExtension('*.md', 'ts')).toBe(false)
  })

  it('does not let *.ts cover a .tsx file -- the suffix has to be named', () => {
    expect(sectionCoversExtension('*.ts', 'tsx')).toBe(false)
  })
})

// Mutation-driven cases. Each pins a specific way the reader could be wrong
// while still passing the tests above -- a dropped anchor, a dropped trim, a
// flipped connective. See the module header for why this is a bespoke reader.
describe('parseFixtureSections, shapes a looser reader would accept', () => {
  it('requires the section header to START the line, so prose naming one is not a section', () => {
    expect(parseFixtureSections('see the [*.md] section\n')).toEqual([])
  })

  it('requires the header to END the line, so a trailing comment does not become part of the glob', () => {
    expect(parseFixtureSections('[*.md] ; and a note\n')).toEqual([])
  })

  it('requires BasedOnStyles to start the line, so prose mentioning it does not assign', () => {
    expect(parseFixtureSections('[*.md]\nnot a BasedOnStyles = Decoy line\n')[0]?.styles).toEqual([])
  })

  it('reads an indented line, since the config is hand-written', () => {
    expect(parseFixtureSections('  [*.md]\n   BasedOnStyles = Procedure\n')).toEqual([
      { glob: '*.md', styles: ['Procedure'] },
    ])
  })

  it('skips a blank line and a comment line for different reasons, not one rule covering both', () => {
    expect(parseFixtureSections('\n[*.md]\n; note\nBasedOnStyles = A\n')[0]?.styles).toEqual(['A'])
  })

  it('does not treat a line merely ENDING in a semicolon as a comment', () => {
    expect(parseFixtureSections('[*.md]\nBasedOnStyles = A;\n')[0]?.styles).toEqual(['A;'])
  })

  it('leaves an earlier assignment alone when a later line in the section is not one', () => {
    const sections = parseFixtureSections('[*.md]\nBasedOnStyles = A\nMinAlertLevel = warning\n')
    expect(sections[0]?.styles).toEqual(['A'])
  })
})

describe('sectionCoversExtension, shapes a looser matcher would accept', () => {
  it('needs EVERY braced suffix checked, not just one -- md must not match {ts,tsx}', () => {
    expect(sectionCoversExtension('*.{ts,tsx}', 'md')).toBe(false)
    expect(sectionCoversExtension('*.{md}', 'md')).toBe(true)
  })

  it('anchors the braced form, so a longer glob does not match by containment', () => {
    expect(sectionCoversExtension('src/*.{ts,tsx}', 'ts')).toBe(false)
  })
})

// Second mutation pass: whitespace flexibility and the end-anchors.
describe('parseFixtureSections, whitespace around the assignment', () => {
  it('accepts no whitespace at all around the equals sign', () => {
    expect(parseFixtureSections('[*.md]\nBasedOnStyles=Procedure\n')[0]?.styles).toEqual(['Procedure'])
  })

  it('accepts several spaces before the equals sign', () => {
    expect(parseFixtureSections('[*.md]\nBasedOnStyles   = Procedure\n')[0]?.styles).toEqual(['Procedure'])
  })

  it('anchors the section header at the end, so a header mid-sentence is not one', () => {
    expect(parseFixtureSections('the section is [*.md]\n')).toEqual([])
  })
})

describe('sectionCoversExtension, the end anchor', () => {
  it('does not match a braced glob with a suffix after the brace', () => {
    expect(sectionCoversExtension('*.{ts,tsx}x', 'ts')).toBe(false)
  })
})

describe('sectionCoversExtension tolerates spacing inside the braces', () => {
  it('matches a suffix written with a space after the comma', () => {
    expect(sectionCoversExtension('*.{ts, tsx}', 'tsx')).toBe(true)
  })
})
