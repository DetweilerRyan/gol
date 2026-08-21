import { describe, expect, it } from 'vitest'
import { readRunEnvironment } from './environment.ts'

describe('readRunEnvironment', () => {
  it('assembles every field from the injected readers', () => {
    const env = readRunEnvironment({
      gitSha: () => 'abc1234',
      cpus: () => [{ model: 'Apple M2' }, { model: 'Apple M2' }],
      nodeVersion: () => 'v24.0.0',
      now: () => new Date('2026-08-21T12:00:00.000Z'),
    })
    expect(env).toEqual({
      gitSha: 'abc1234',
      cpuModel: 'Apple M2',
      cpuCoreCount: 2,
      nodeVersion: 'v24.0.0',
      timestampIso: '2026-08-21T12:00:00.000Z',
    })
  })

  it('falls back to "unknown" cpuModel and cpuCoreCount 0 when cpus() reports none', () => {
    const env = readRunEnvironment({
      gitSha: () => 'abc1234',
      cpus: () => [],
      nodeVersion: () => 'v24.0.0',
      now: () => new Date('2026-08-21T12:00:00.000Z'),
    })
    expect(env.cpuModel).toBe('unknown')
    expect(env.cpuCoreCount).toBe(0)
  })
})
