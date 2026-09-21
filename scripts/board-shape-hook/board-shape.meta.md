# `board-shape.ts` — rationale

The rationale half of the sidecar pair, per `doc-comments.md` rule 7: the hover carries the
contract, and this file carries the evidence for why the contract is shaped that way. Read it
when you are changing lane classification, not in order to call `checkShape`. This was the tier's
first instance outside `src/` when it landed (2026-09-21).

## The 2026-09-21 axis-split ruling

`architect` DESIGN split lane classification onto two axes that are checked differently, and this
is why. The **lane axis** — which top-level `backlog/` directory a path names, and what shape
that lane declares — is checked against `board-lanes.config.json` through `LaneDeclarations`, a
closed, ruled set: a lane exists because someone declared it, so an undeclared name is itself
informative and earns its own outcome. The **artifact axis** — which per-item file sits inside a
folder-lane item (`spec.md`, `design.md`, a numbered amendment file) — stays positional, checked
only by where a path falls in a lane's own declared shape, never by a name lookup. An artifact kind
arrives unannounced: `spec.md` and `design.md` predate this slice, and a numbered amendment file
or a spike's `findings.md` needs no registration to be classified correctly. Declaring that population
the way lanes are declared would need a new entry, and hence a config edit, for every future
artifact kind — the open set the two-axis split exists to keep open.

## Ruling 1 — a missing or malformed declaration file refuses to classify, settled

`run.ts` reads `board-lanes.config.json` before any target is resolved. When the read fails, or
`parseLaneDeclarations` rejects the text, the run does not fall back to "every lane declared" or
"no lane declared" — either default would silently misclassify some board write. It returns
`laneDeclarationsUnavailableOutcome`: `deliver: true`, one finding, exit still `0`, for every board
target until the file is fixed. `npm run vale-fixture-check`'s refuse-to-report-clean posture is
the model — a delivered envelope is the loudest channel available inside a no-gate constraint,
since the hook always exits `0` and the board has no gate of its own.

## Ruling 2 — a basename mismatch at declared depth stays deferred

A folder lane's third segment matching the declared item name is checked by string equality, never
by confirming the item file actually exists on disk. Narrowing that would need a second injected
filesystem answer threaded through `checkShape`, parallel to `resolveTarget`'s existing `exists`
callback, and its benefit sits entirely on the artifact axis this slice deliberately left
positional. At design time, walking the tracked board found zero stray item folders lacking their
declared item file. What would settle this open question: an observed stray folder in that shape,
or a user ruling promoting the narrowing ahead of an observed instance.

## Ruling 3 — the silent board root, implemented as deferred

A one-segment path directly under `backlog/` (`backlog/TEMPLATE.md`) draws the plain
not-a-candidate refusal, with no lane clause at all. `classifyShape` tests `segments.length < 2`
before it ever looks a lane up, so the root stays silent by the same code path it always has —
this slice preserves that ordering rather than introducing it.

## Three sanctioned residuals

Each is a literal this slice's own decision table does not reach, left in place on purpose rather
than folded into `LaneDeclarations`:

- **`assessmentSummary`'s `lane === 'ideas'` check.** Staleness semantics differ per lane — a blob
  mismatch is drift in `ideas` and expected history once promoted — but that is not an item-shape
  fact, so it stays a direct lane-name comparison rather than a new declared field.
- **`assessment-record.ts`'s lane names inside its own path regexes.** Those regexes classify a
  record's own path, not an item's shape, so they sit on the record axis this slice does not own.
- **`resolveTarget`'s `['ideas', 'ready']` precedence list.** Resolution membership and order are
  that function's own fact rather than a derivable consequence of a lane's declared shape — `done`
  is a folder lane exactly like `ready` and deliberately does not resolve a bare slug.
