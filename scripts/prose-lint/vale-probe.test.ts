import { describe, expect, it } from 'vitest'
import { classifyProbe } from './vale-probe.ts'

describe('classifyProbe', () => {
  it.each<[string, boolean]>([
    ['ENOENT', false],
    ['EACCES', true],
  ])('reads a %s spawn error as valeOnPath=%s', (code, valeOnPath) => {
    const probe = classifyProbe({ error: { code }, status: null, stdout: undefined, stderr: undefined })
    expect(probe).toEqual({ valeOnPath, configLoaded: false, output: '' })
  })

  it('reads a clean ls-config as vale on PATH with a loaded config', () => {
    const probe = classifyProbe({ status: 0, stdout: 'INI\nStylesPath = vale-styles\n', stderr: '' })
    expect(probe).toEqual({
      valeOnPath: true,
      configLoaded: true,
      output: 'INI\nStylesPath = vale-styles\n',
    })
  })

  it('reads a nonzero status with no spawn error as vale on PATH but unable to load the config', () => {
    const probe = classifyProbe({
      status: 2,
      stdout: '',
      stderr: 'E100 [.vale.ini not found] Runtime error\n\nno config file found\n',
    })
    expect(probe.valeOnPath).toBe(true)
    expect(probe.configLoaded).toBe(false)
    expect(probe.output).toBe('E100 [.vale.ini not found] Runtime error\n\nno config file found\n')
  })

  it('combines stdout and stderr into one output string', () => {
    const probe = classifyProbe({ status: 2, stdout: 'a\n', stderr: 'b\nc\n' })
    expect(probe.output).toBe('a\nb\nc\n')
  })
})
