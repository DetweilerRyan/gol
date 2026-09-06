---
name: docker-sandbox-for-the-toolchain
title: Run the toolchain in a container, and resolve where perf measurement lives
created: 2026-09-05
---

## Context

Nothing containerises this repo today: no `Dockerfile`, no `.devcontainer`, no
CI config of any kind. Two separate pressures point at one:

- **Agent isolation.** Five roles run with `Write`, `Edit`, and `Bash` over the
  whole checkout. Nothing bounds what a role can touch beyond the write
  boundaries stated in prose, and those are conventions rather than mechanism.
- **Reproducibility.** The repo declares **no** Node version — no `engines`, no
  `.nvmrc`, no `packageManager`. The host happens to run Node 24.19.0 and npm
  11.17.0; nothing records that, and nothing would notice a divergence.

Feasibility was checked against the real tree rather than assumed, and the one
thing that could have sunk it does not:

- **`package-lock.json` already carries the Linux native binaries** — 13
  `linux-arm64` and 13 `linux-x64` entries against 8 `darwin-arm64`. `npm ci`
  resolves in a Linux container with no lockfile surgery.
- **`node_modules` can never be shared host↔container.** Those 8 packages
  (`@oxlint/binding`, `@ast-grep/cli`, `@dry4ts`, `@esbuild`,
  `@rolldown/binding`, `@tailwindcss/oxide`, `lightningcss`) are
  `darwin-arm64`-only. A bind mount of the host's `node_modules` produces a
  container that fails on the first lint. It has to be a volume or an in-image
  install.
- `@playwright/test` is 1.62.1; the checkout is 599M, of which `node_modules` is
  553M.
- Declaration-only emit works against `tsconfig.app.json` unmodified
  (`--noEmit false --declaration --emitDeclarationOnly`, exit 0, 186 `.d.ts`) —
  incidental here, but it means the container needs no tsconfig variant.

The hard part is not the image. It is **`npm run test:perf`**, which is the one
command whose output is only meaningful relative to a baseline measured
somewhere else — `reports/perf/latest.md` figures are M2 Pro numbers, and
Docker Desktop on macOS is a VM with no hardware GPU.

## Sketch

Image: `node:24-bookworm`, `npm ci`, then
`npx playwright install --with-deps chromium` — which self-matches the lockfile
forever, where `mcr.microsoft.com/playwright:v1.62.1-noble` would need retagging
on every Playwright bump. Build `linux/arm64`: amd64 under emulation on Apple
Silicon costs roughly 40%.

Run flags that are not optional, per Playwright's own Docker guidance:
`--ipc=host` (or `--shm-size=2g`) or Chromium OOM-crashes on Docker's 64MB
default `/dev/shm`, and `--init` or Playwright leaks zombie browser processes.
Both present as flaky test failures, which in this repo means someone burns a
slice chasing a phantom.

Volumes, not bind mounts, for the many-small-files paths — `node_modules`,
`.stryker-tmp*`, `coverage/`. VirtioFS runs write-heavy work 30–50% slower than
native.

**One container per slice, with its own clone**, rather than mounting a
worktree. That is the direct analog of today's worktree-per-slice flow and the
merge protocol survives unchanged (the host fetches the slice branch from the
container's clone). It also sidesteps the trap below.

## Touches

New `Dockerfile` and `.dockerignore`. `package.json` (`engines`) and a `.nvmrc`,
which the slice should add regardless — otherwise the image silently becomes the
only place the Node version is declared.

`CLAUDE.md`'s "Running slices concurrently" section, whose isolation argument is
written entirely in terms of worktrees and fixed relative paths, and its merge
protocol, if container-per-clone replaces worktree-per-slice.

`dev-port.ts`, possibly — see the open questions.

`.claude/settings.json` if roles are to run inside the container, plus whatever
carries credentials into it.

## Open questions

- **What is the sandbox actually for?** This decides the shape and nothing else
  can be settled before it. A read-write bind mount buys **no** containment —
  `rm -rf` on the mount hits the host — so if isolation is the goal the answer
  is a per-container clone, not a mount. If the goal is reproducibility instead,
  `COPY . .` and no mounts is simpler and stricter. The two builds differ enough
  that guessing wastes the slice.
- **Where does perf measurement live?** Three resolutions, and mixing any two is
  the failure mode. (a) Host-only, container never runs `test:perf` — simplest,
  keeps the recorded baselines valid. (b) Move it entirely and **regenerate the
  `main` baseline in-container** — valid, but every figure in
  `reports/perf/latest.md` and every perf number quoted in `CLAUDE.md` becomes
  stale on the same day. (c) Make containerised perf a purely _relative_
  instrument: run merge-base and candidate builds interleaved **inside one
  container invocation** and report the ratio, so environment noise is
  common-mode. (c) is the most attractive and the least proven — no source found
  documents it for Playwright, so it needs its own acceptance test before it is
  trusted: run it twice on an unchanged tree and require the ratio to come back
  at 1.00. This overlaps `perf-run-triggers`, which asks who decides a run is
  needed; this one asks where the run happens. They are separable but should not
  contradict each other.
- **Does the container measure the thing we care about?** Headless Chromium in a
  container has no hardware GPU and falls back to SwiftShader, which is CPU
  rendering. This app is DOM nodes plus a `translate()` on one layer div with
  re-layout on zoom — no canvas, no WebGL — so the cost being measured is
  main-thread style and layout, which is the part that containerises most
  faithfully. That is an argument, not a measurement, and (c) above is what
  would turn it into one.
- **`git worktree repair` is a live footgun.** A linked worktree's `.git` is a
  file holding an absolute host gitdir path. An agent inside a container that
  runs `git worktree repair` over a bind mount rewrites those pointers in the
  **shared** `.git` — fixing the container and breaking the host checkout.
  Container-per-clone avoids it; a mount-based design has to forbid it somehow,
  and there is no obvious mechanism for that.
- **Does `dev-port.ts` survive?** Its whole purpose is stopping two worktrees
  sharing a dev-server port, and container network namespaces make that
  impossible by construction — inside a container you would just pin
  `GOL_DEV_PORT=5173`. But the module stays load-bearing on the host, so the
  repo would carry two schemes for one problem. Worth deciding whether the
  container is an exception that sets the env var, or whether host worktrees go
  away entirely.
- **Stryker under a CPU allocation.** Concurrency is `min(16, cpus - 2)` from the
  CPUs visible _inside_ the container, and Docker Desktop hands over a fraction
  of the host by default. `--cpuset-cpus` pinning is better than `--cpus`
  quotas — quota throttling is itself a variance source — but whether the
  ~10-minute full-run figure survives at all is unmeasured, and a mutation gate
  that takes an hour changes how the pipeline is used.
- **Credentials.** Do not bind-mount `~/.claude` wholesale to get them: it holds
  the memory directory and every session transcript, including the per-subagent
  transcripts under `<session>/subagents/`. Needs a scoped config dir or a
  workspace-scoped key, decided before anything runs inside.
- `anthropics/claude-code` ships a reference `.devcontainer` including a
  network-restriction firewall script, which is close to the agent-isolation
  starting point. Check its current shape rather than reproducing it from
  memory.
