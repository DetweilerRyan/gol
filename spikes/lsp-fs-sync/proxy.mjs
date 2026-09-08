#!/usr/bin/env node
// SPIKE PROTOTYPE -- not gate-ready, not in scripts/ on purpose. See README.md here.
//
// A transparent LSP stdio proxy that makes out-of-band writes visible to the
// language server.
//
// Why this is needed at all: LSP says that once a client sends
// textDocument/didOpen, "the document's truth is now managed by the client and
// the server must not try to read the document's truth using the document's
// Uri". So a server that is behaving correctly will ignore sed, cat >, git
// rebase, git checkout and prettier forever. The remedy has to come from the
// client side, and since we cannot change the client, it comes from a shim
// wearing the server's clothes.
//
// What it does: for every document the client opens, watch the containing
// directory. When that file changes on disk and its content hash differs from
// what we last handed the server, synthesize a full-content
// textDocument/didChange toward the server. The client never sees these; they
// are injected into the server-bound stream only.
//
// Why forcing disk content over the client's buffer is safe HERE and would not
// be in a normal editor: Claude Code has no unsaved-buffer concept -- every
// Edit/Write is flushed to disk before the notification is sent -- so disk is
// always the truth. In VS Code this same proxy would clobber unsaved work.

import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync, watch } from 'node:fs'
import { dirname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

const SERVER_CMD = process.env.LSP_FS_SYNC_CMD ?? 'typescript-language-server'
const SERVER_ARGS = (process.env.LSP_FS_SYNC_ARGS ?? '--stdio').split(' ').filter(Boolean)
const DEBOUNCE_MS = Number(process.env.LSP_FS_SYNC_DEBOUNCE ?? 60)
const VERBOSE = process.env.LSP_FS_SYNC_VERBOSE === '1'

// stderr only: stdout is the protocol channel and anything stray on it
// corrupts framing. The plugin docs call this out explicitly.
const log = (...a) => VERBOSE && process.stderr.write(`[lsp-fs-sync] ${a.join(' ')}\n`)

const server = spawn(SERVER_CMD, SERVER_ARGS, { stdio: ['pipe', 'pipe', 'inherit'] })
server.on('exit', (code) => process.exit(code ?? 0))

/** uri -> { path, version, hash, dir, base } for every document the client has open. */
const open = new Map()
/** directory -> fs.FSWatcher, shared by every open file in that directory. */
const watchers = new Map()
/** Pending debounce timers, keyed by uri. */
const timers = new Map()

const hashOf = (text) => createHash('sha1').update(text).digest('hex')

const encode = (msg) => {
  const body = Buffer.from(JSON.stringify(msg), 'utf8')
  return Buffer.concat([Buffer.from(`Content-Length: ${body.length}\r\n\r\n`, 'ascii'), body])
}

/**
 * Splits a byte stream into LSP frames. Returns a push(chunk) that invokes
 * onMessage for each complete frame and onRaw for the bytes, so a caller can
 * choose to forward verbatim or re-encode.
 */
function framer(onMessage) {
  let buf = Buffer.alloc(0)
  return (chunk) => {
    buf = Buffer.concat([buf, chunk])
    for (;;) {
      const headerEnd = buf.indexOf('\r\n\r\n')
      if (headerEnd === -1) return
      const header = buf.subarray(0, headerEnd).toString('ascii')
      const match = /Content-Length:\s*(\d+)/i.exec(header)
      if (!match) {
        // Unparseable header: drop it rather than desync forever.
        buf = buf.subarray(headerEnd + 4)
        continue
      }
      const length = Number(match[1])
      const start = headerEnd + 4
      if (buf.length < start + length) return
      const body = buf.subarray(start, start + length).toString('utf8')
      buf = buf.subarray(start + length)
      let msg
      try {
        msg = JSON.parse(body)
      } catch {
        continue
      }
      onMessage(msg)
    }
  }
}

/** Push the current on-disk content of `uri` to the server as a full-content change. */
function syncFromDisk(uri) {
  const entry = open.get(uri)
  if (!entry) return
  let text
  try {
    text = readFileSync(entry.path, 'utf8')
  } catch {
    return // deleted or mid-rename; the next event will settle it
  }
  const hash = hashOf(text)
  if (hash === entry.hash) return // already what the server believes
  entry.hash = hash
  entry.version += 1
  server.stdin.write(
    encode({
      jsonrpc: '2.0',
      method: 'textDocument/didChange',
      params: {
        textDocument: { uri, version: entry.version },
        // A contentChanges entry with no `range` is a full replacement. Legal
        // under both Full and Incremental sync kinds.
        contentChanges: [{ text }],
      },
    }),
  )
  log('resynced', entry.base, 'v' + entry.version)
}

function watchFor(uri) {
  const entry = open.get(uri)
  if (!entry || watchers.has(entry.dir)) return
  try {
    // Watch the DIRECTORY, not the file. `sed -i ''`, git checkout and
    // prettier all replace the inode rather than writing in place, which
    // silently detaches a file-level watch after the first change.
    const w = watch(entry.dir, { persistent: false }, (_event, filename) => {
      if (!filename) return
      for (const [u, e] of open) {
        if (e.dir === entry.dir && e.base === filename) {
          clearTimeout(timers.get(u))
          timers.set(
            u,
            setTimeout(() => syncFromDisk(u), DEBOUNCE_MS),
          )
        }
      }
    })
    watchers.set(entry.dir, w)
  } catch (err) {
    log('watch failed', entry.dir, String(err))
  }
}

const toPath = (uri) => {
  try {
    return fileURLToPath(uri)
  } catch {
    return null
  }
}

/** Client -> server. Inspects, may rewrite the version, always forwards. */
const fromClient = framer((msg) => {
  const method = msg.method
  if (method === 'textDocument/didOpen') {
    const doc = msg.params?.textDocument
    const path = doc && toPath(doc.uri)
    if (path) {
      open.set(doc.uri, {
        path,
        dir: dirname(path),
        base: basename(path),
        version: doc.version ?? 1,
        hash: hashOf(doc.text ?? ''),
      })
      watchFor(doc.uri)
      log('opened', basename(path))
    }
  } else if (method === 'textDocument/didClose') {
    const uri = msg.params?.textDocument?.uri
    if (uri) {
      open.delete(uri)
      clearTimeout(timers.get(uri))
      timers.delete(uri)
    }
  } else if (method === 'textDocument/didChange') {
    // The proxy owns the version namespace toward the server, because it also
    // injects its own changes. Rewriting here is what keeps versions
    // monotonic no matter how client edits and disk events interleave.
    const uri = msg.params?.textDocument?.uri
    const entry = uri && open.get(uri)
    if (entry) {
      entry.version += 1
      msg.params.textDocument.version = entry.version
      const full = msg.params.contentChanges?.find((c) => c.range === undefined)
      if (full) entry.hash = hashOf(full.text)
      // An incremental change leaves our hash stale, which can only cause a
      // redundant resync later -- never a missed one.
    }
  }
  server.stdin.write(encode(msg))
})

process.stdin.on('data', fromClient)
process.stdin.on('end', () => server.stdin.end())
// Server -> client is pure passthrough; re-encoding would only risk corruption.
server.stdout.on('data', (chunk) => process.stdout.write(chunk))
