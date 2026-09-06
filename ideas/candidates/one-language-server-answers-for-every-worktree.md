---
name: one-language-server-answers-for-every-worktree
title: Give each worktree its own TypeScript language server, the way dev-port.ts already gives it its own ports
created: 2026-09-06
---

## Context

`jsdoc-in-src` made `LSP` hover load-bearing — `doc-comments.md` Part 2 tells
every implementing role to hover a symbol at its call site instead of opening
the defining file. That slice then hit two failures in the same session, both
of which end with a role reading a confident answer about the wrong bytes.

**The misroute.** A path passed to `LSP` **relative** to a worktree resolves
against the session cwd — the primary checkout — not the worktree. Measured:
`src/hooks/useCamera.ts` at 25:9 returned `const glide: ZoomGlideController`,
which is what stands at that position in the primary checkout's copy; the
worktree's own copy has `[` there. A path present in **neither** tree errors
cleanly. A path present in **both** — which is every file in `src/` — answers
about the wrong copy in silence, and since the copies agree everywhere the
slice has not touched, the wrong answer is right most of the time.

**The staleness.** Hovering `toggleLibrary` from
`src/hooks/usePatternPlacement.ts` returned a claim that had been corrected on
`main` and rebased away — text in neither tree and, by grep, nowhere on disk
outside `.git/`. The server answered from a copy predating the rebase.

The mechanism links the two: a server rooted at the primary checkout has **no
file watcher on files in another worktree**, because they sit outside its
project root. It reads such a file once, on demand, and nothing ever
invalidates that read. Staleness inside the rooted project is ordinary and
self-corrects; staleness outside it does not.

**This is a shape this repo has already solved once.** `dev-port.ts` exists
because a worktree separates every fixed relative path for free and does
**not** separate a TCP port — so `playwright.config.ts`'s `reuseExistingServer`
would find another worktree's dev server, attach, and report "a green e2e suite
against the wrong build." A single language server answering hover for three
checkouts is the same failure with a different transport.

## Sketch

Establish whether the `typescript-lsp` plugin can be pointed at a per-checkout
root at all, and what it costs. `tsserver` on a project this size is not free,
and the ceiling is two or three concurrent slices, so the question is whether
three servers are affordable rather than whether one is wrong.

If it is configurable, derive the root the way `dev-port.ts` derives a port —
from the checkout directory — so a new worktree is covered with no config edit.
If it is not configurable, the fallback is what the article already mandates
(absolute paths, and read the source before believing a hover that reveals a
defect), and this idea closes as measured-and-rejected rather than staying open.

## Touches

`.claude/settings.json` and whatever the plugin exposes; possibly `dev-port.ts`
if the derivation is worth sharing. `doc-comments.md` Part 2 §7 and
`workflow.md`'s worktree section both carry the current mitigations and would
need rescoping if the cause is removed.

Note the two halves are **not** fixed by the same change: a per-worktree server
addresses staleness, and the misroute is a client-side path-resolution problem that
happens before any server is chosen. Absolute paths remain mandatory either way.

## Open questions

- **Is it configurable at all?** Unknown, and the whole idea rests on it. Worth
  ten minutes with `claude --debug`, which names any LSP server it skipped and
  why, before anything else here is designed.
- **What does three `tsserver` instances cost on this machine?** If it is a
  gigabyte each, the honest answer may be to keep one server and rely on the
  documented discipline — which is already written and already caught both
  failures.
- **Would it actually fix the staleness, or move it?** The mechanism argument
  (no watcher outside the project root) is inference from observed behaviour,
  not a measurement. It should be measured before being designed against.
- **Does the misroute deserve its own guard?** Nothing stops a role passing a
  relative path; the mitigation is prose in an article. The failure is silent
  and the wrong answer is usually right, which is the worst combination for a
  convention held by discipline alone.
