#!/usr/bin/env node
// SPIKE HARNESS. Drives a real typescript-language-server twice per scenario --
// once directly (control) and once through proxy.mjs -- and reports whether a
// hover taken after an out-of-band write sees the new bytes.
//
// Deliberately a real LSP client rather than the Claude Code harness: wiring
// the proxy into ~/.claude would change every one of the user's sessions, and
// the claim under test ("the server sees the change") is fully observable from
// any conforming client.

import { execFileSync, spawn } from 'node:child_process'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const PROXY = join(HERE, 'proxy.mjs')
const PRETTIER = process.env.PRETTIER_BIN ?? 'prettier'
const SETTLE_MS = Number(process.env.SETTLE_MS ?? 1500)
const TSSERVER =
  process.env.TSSERVER_PATH ??
  '/Users/ryandetweiler/Documents/projects/gol-claude/node_modules/typescript/lib/tsserver.js'

const FIXTURE_ALPHA = `/**
 * SENTINEL-ALPHA doc for the sync spike.
 */
export function probe(a: number): number {
  return a
}
`
const FIXTURE_BRAVO = FIXTURE_ALPHA.replace('SENTINEL-ALPHA', 'SENTINEL-BRAVO')

const sh = (cmd, args, cwd) => execFileSync(cmd, args, { cwd, stdio: 'pipe', encoding: 'utf8' })

/** Minimal LSP client over a child process's stdio. */
function client(proc) {
  let buf = Buffer.alloc(0)
  const pending = new Map()
  let nextId = 1
  proc.stdout.on('data', (chunk) => {
    buf = Buffer.concat([buf, chunk])
    for (;;) {
      const end = buf.indexOf('\r\n\r\n')
      if (end === -1) return
      const len = Number(/Content-Length:\s*(\d+)/i.exec(buf.subarray(0, end).toString('ascii'))?.[1])
      if (!Number.isFinite(len) || buf.length < end + 4 + len) return
      const body = buf.subarray(end + 4, end + 4 + len).toString('utf8')
      buf = buf.subarray(end + 4 + len)
      let msg
      try {
        msg = JSON.parse(body)
      } catch {
        continue
      }
      if (msg.id !== undefined && pending.has(msg.id)) {
        pending.get(msg.id)(msg)
        pending.delete(msg.id)
      }
    }
  })
  const send = (msg) => {
    const b = Buffer.from(JSON.stringify(msg), 'utf8')
    proc.stdin.write(`Content-Length: ${b.length}\r\n\r\n`)
    proc.stdin.write(b)
  }
  return {
    notify: (method, params) => send({ jsonrpc: '2.0', method, params }),
    request: (method, params) =>
      new Promise((res) => {
        const id = nextId++
        pending.set(id, res)
        send({ jsonrpc: '2.0', id, method, params })
      }),
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const hoverText = (resp) => {
  if (process.env.DEBUG_HOVER) process.stderr.write(`RAW ${JSON.stringify(resp)}\n`)
  const c = resp?.result?.contents
  if (!c) return ''
  if (typeof c === 'string') return c
  if (Array.isArray(c)) return c.map((x) => (typeof x === 'string' ? x : (x?.value ?? ''))).join('\n')
  return c.value ?? ''
}

const sentinelIn = (text) => /SENTINEL-(\w+)/.exec(text)?.[1] ?? 'none'

/**
 * One scenario: build a fixture dir, open the file, hover, mutate out-of-band,
 * hover again. `mutate(dir, file)` performs the out-of-band write.
 */
async function runOnce({ mode, mutate, needsGit }) {
  const dir = mkdtempSync(join(HERE, '.tmp-'))
  const file = join(dir, 'probe.ts')
  writeFileSync(join(dir, 'tsconfig.json'), JSON.stringify({ compilerOptions: { strict: true } }))
  writeFileSync(file, FIXTURE_ALPHA)
  if (needsGit) {
    sh('git', ['init', '-q', '-b', 'main'], dir)
    sh('git', ['config', 'user.email', 'spike@example.com'], dir)
    sh('git', ['config', 'user.name', 'spike'], dir)
    sh('git', ['add', '-A'], dir)
    sh('git', ['commit', '-qm', 'alpha'], dir)
  }

  const proc =
    mode === 'proxy'
      ? spawn('node', [PROXY], { stdio: ['pipe', 'pipe', 'inherit'] })
      : spawn('typescript-language-server', ['--stdio'], { stdio: ['pipe', 'pipe', 'inherit'] })

  const c = client(proc)
  await c.request('initialize', {
    processId: process.pid,
    rootUri: pathToFileURL(dir).href,
    workspaceFolders: [{ uri: pathToFileURL(dir).href, name: 'spike' }],
    // A throwaway fixture dir has no node_modules, and typescript-language-server
    // refuses to initialize without a resolvable typescript install. Point it at
    // a real one rather than npm-installing into every temp directory.
    initializationOptions: { tsserver: { path: TSSERVER } },
    capabilities: {
      textDocument: {
        synchronization: { dynamicRegistration: false },
        hover: { contentFormat: ['markdown', 'plaintext'] },
      },
    },
  })
  c.notify('initialized', {})

  const uri = pathToFileURL(file).href
  c.notify('textDocument/didOpen', {
    textDocument: { uri, languageId: 'typescript', version: 1, text: FIXTURE_ALPHA },
  })
  await sleep(SETTLE_MS)

  const before = sentinelIn(
    hoverText(
      await c.request('textDocument/hover', {
        textDocument: { uri },
        position: { line: 3, character: 16 },
      }),
    ),
  )

  await mutate(dir, file, c, uri)
  await sleep(SETTLE_MS)

  const after = sentinelIn(
    hoverText(
      await c.request('textDocument/hover', {
        textDocument: { uri },
        position: { line: 3, character: 16 },
      }),
    ),
  )

  proc.kill()
  rmSync(dir, { recursive: true, force: true })
  return { before, after }
}

const SCENARIOS = [
  {
    name: 'sed -i (inode replace)',
    mutate: (_d, f) => sh('sed', ['-i', '', 's/SENTINEL-ALPHA/SENTINEL-BRAVO/', f]),
  },
  {
    name: 'cat > (truncate in place)',
    mutate: (_d, f) => writeFileSync(f, FIXTURE_BRAVO),
  },
  {
    name: 'git checkout <branch>',
    needsGit: true,
    mutate: (d, f) => {
      sh('git', ['checkout', '-q', '-b', 'other'], d)
      writeFileSync(f, FIXTURE_BRAVO)
      sh('git', ['commit', '-qam', 'bravo'], d)
      sh('git', ['checkout', '-q', 'main'], d)
      sh('git', ['checkout', '-q', 'other'], d)
    },
  },
  {
    name: 'git rebase',
    needsGit: true,
    mutate: (d, f) => {
      // feature branch touches an unrelated file; main moves probe.ts to BRAVO;
      // rebasing feature onto main rewrites the working tree underneath us.
      sh('git', ['checkout', '-q', '-b', 'feature'], d)
      writeFileSync(join(d, 'other.ts'), 'export const x = 1\n')
      sh('git', ['add', '-A'], d)
      sh('git', ['commit', '-qm', 'feature work'], d)
      sh('git', ['checkout', '-q', 'main'], d)
      writeFileSync(f, FIXTURE_BRAVO)
      sh('git', ['commit', '-qam', 'bravo on main'], d)
      sh('git', ['checkout', '-q', 'feature'], d)
      sh('git', ['rebase', '-q', 'main'], d)
    },
  },
  {
    // Regression guard: the proxy rewrites the version on every client
    // didChange, so the ordinary Edit-tool path must still work through it.
    name: 'client didChange only (Edit path)',
    // The one scenario where the unproxied server is SUPPOSED to keep up: this
    // is the in-band path, so a stale result here would be a different bug.
    directSeesIt: true,
    mutate: async (_d, f, c, uri) => {
      writeFileSync(f, FIXTURE_BRAVO)
      c.notify('textDocument/didChange', {
        textDocument: { uri, version: 2 },
        contentChanges: [{ text: FIXTURE_BRAVO }],
      })
    },
  },
  {
    // Interleaving guard: a client change followed by an out-of-band one. If
    // the proxy's version bookkeeping were wrong, the second would be dropped.
    name: 'didChange then sed (interleaved)',
    mutate: async (_d, f, c, uri) => {
      const mid = FIXTURE_ALPHA.replace('SENTINEL-ALPHA', 'SENTINEL-MID')
      writeFileSync(f, mid)
      c.notify('textDocument/didChange', {
        textDocument: { uri, version: 2 },
        contentChanges: [{ text: mid }],
      })
      await sleep(300)
      sh('sed', ['-i', '', 's/SENTINEL-MID/SENTINEL-BRAVO/', f])
    },
  },
  {
    name: 'prettier --write (npm run format)',
    mutate: (_d, f) => {
      writeFileSync(f, FIXTURE_BRAVO.replace('export function', 'export    function'))
      sh(PRETTIER, ['--write', '--no-config', '--semi=false', '--single-quote', f])
    },
  },
]

const rows = []
for (const s of SCENARIOS) {
  for (const mode of ['direct', 'proxy']) {
    const r = await runOnce({ mode, mutate: s.mutate, needsGit: s.needsGit })
    rows.push({
      scenario: s.name,
      mode,
      ...r,
      fresh: r.after === 'BRAVO',
      expectedDirect: s.directSeesIt === true,
    })
    process.stderr.write(`  ${s.name} [${mode}] ${r.before} -> ${r.after}\n`)
  }
}

console.log('\n| scenario | mode | hover before | hover after | sees the write? |')
console.log('| --- | --- | --- | --- | --- |')
for (const r of rows) {
  console.log(`| ${r.scenario} | ${r.mode} | ${r.before} | ${r.after} | ${r.fresh ? '**yes**' : 'no'} |`)
}
// The load-bearing guard. Every run must see ALPHA before the mutation --
// otherwise the hover is failing for some unrelated reason and every "did not
// see the write" row below is vacuous rather than evidence. The first draft of
// this harness reported a clean control sweep while in fact returning null for
// all ten hovers.
const baselineOk = rows.every((r) => r.before === 'ALPHA')
// Out-of-band scenarios must go stale unproxied (that is the bug); the in-band
// scenario must not (that would be a different bug). Both directions asserted.
const controlsStale = rows.filter((r) => r.mode === 'direct').every((r) => r.fresh === r.expectedDirect)
const proxyFresh = rows.filter((r) => r.mode === 'proxy').every((r) => r.fresh)
console.log(
  `\nbaseline hover ALPHA everywhere: ${baselineOk}` +
    ` | controls behaved as expected: ${controlsStale}` +
    ` | proxy all fresh: ${proxyFresh}`,
)
process.exit(baselineOk && controlsStale && proxyFresh ? 0 : 1)
