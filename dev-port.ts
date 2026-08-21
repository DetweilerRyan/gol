import { createHash } from 'node:crypto'
import { statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Concurrent slices run in separate git worktrees, and each needs its own dev
// server port. Sharing one is not a loud failure but a silent one:
// playwright.config.ts's `reuseExistingServer` sees *a* server answering on the
// URL, attaches, and reports a green e2e suite against the other worktree's
// build. Vite makes that easy to hit -- with no `strictPort` it quietly slides
// 5173 -> 5174 rather than refusing to start, so the two worktrees end up on
// different ports while both configs still point at 5173.
//
// strictPort alone is not enough to catch this. Verified on macOS: `localhost`
// resolves to both 127.0.0.1 and ::1, and two Vite servers can each bind one of
// them and both report "ready" on the same port number -- so a shared port can
// look free, bind cleanly, and still leave a Playwright run talking to the
// wrong checkout. Distinct port numbers are what actually separates worktrees;
// strictPort is the backstop that turns a genuine same-address collision into a
// crash rather than a slide.
//
// So the port is derived from the checkout's own directory rather than from an
// env var a role could forget to export. It's read from import.meta.url rather
// than process.cwd() deliberately: that's the checkout's identity, not the
// shell's, so it holds however the command was invoked.
const ROOT = path.dirname(fileURLToPath(import.meta.url))

const BASE_PORT = 5173
const BROWSER_API_BASE_PORT = 21000
const SLOT_COUNT = 1000

// A linked worktree's `.git` is a file pointing at the primary's gitdir; the
// primary checkout's is a real directory. That's what keeps the primary on slot
// 0, so http://localhost:5173 stays true in CLAUDE.md and in muscle memory.
function isPrimaryWorktree(): boolean {
  try {
    return statSync(path.join(ROOT, '.git')).isDirectory()
  } catch {
    return false
  }
}

// 1000 slots keeps the chance that two live worktrees hash to the same slot
// negligible (~0.3% at three). It isn't zero, and a collision reintroduces the
// silent-reuse failure above rather than a crash -- so if two worktrees ever do
// land on one port, set GOL_DEV_PORT explicitly in one of them.
function slot(): number {
  if (isPrimaryWorktree()) return 0
  return createHash('sha256').update(ROOT).digest().readUInt16BE(0) % SLOT_COUNT
}

export function devPort(): number {
  const override = process.env.GOL_DEV_PORT
  return override ? Number(override) : BASE_PORT + slot()
}

// Vitest browser mode serves the tests over its own HTTP server (default
// 63315). Same per-worktree reasoning, in a range disjoint from the dev
// server's so the two schemes can never collide with each other.
export function browserApiPort(): number {
  return BROWSER_API_BASE_PORT + slot()
}
