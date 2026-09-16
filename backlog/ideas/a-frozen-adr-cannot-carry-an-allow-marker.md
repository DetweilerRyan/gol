---
name: a-frozen-adr-cannot-carry-an-allow-marker
title: reference-check now scans adr/, whose own convention forbids the only remedy it offers
created: 2026-09-11
---

## Situation

`reference-check-reach` replaced the checker's two-entry exact-name doc surface with a pattern: every
tracked `.md` outside `ideas/` and the excluded directories. `adr/` came into scope with it, on an
argument that holds — an ADR names files that **did** exist, so a name gone stale is a real defect
and catching it is what this checker is for.

Measured clean on the day it landed. No ADR currently cites a missing file.

## Complication

**The two conventions collide on the first `src/` rename that a frozen ADR names.**

`reference-check`'s only remedy for a legitimate dead name is an allow-marker written **into the
citing file**. `adr/README.md` and `adr/TEMPLATE.md` both rule that a frozen `Accepted` ADR is
immutable: "Correct one by writing a superseding ADR ... never by editing it."

So a future role hits a red gate whose only mechanical fix another convention forbids. The options
available to them are all bad without a ruling: edit the ADR anyway and break its immutability;
exclude `adr/` and lose the reach this slice just bought; or leave the gate red.

**Whether a marker counts as annotation or as amendment is the question**, and it is a convention
ruling rather than a review call. `adr/` already sanctions one kind of edit to a frozen record — a
status change to `Superseded by`. If a marker is the same category, the collision dissolves. If it is
not, something else has to give.

Found by `architect` in the `reference-check-reach` REVIEW pass, which declined to rule on it and
routed it here.

## Question

Is an allow-marker an annotation a frozen ADR may carry, or an amendment it may not?

## Sketch

Three shapes, and the first is much cheaper than it looks:

- **Rule that a marker is an annotation**, on the `Superseded by` precedent, and say so in
  `adr/README.md`. One sentence, no code, and it keeps both conventions intact. The objection is that
  it makes "immutable" mean "immutable except for two things", which invites a third.
- **Exclude `adr/` from the doc surface.** Restores the status quo ante and costs the reach. Weak,
  since the inclusion argument is sound and the directory is clean today.
- **A sidecar for markers** — `adr/0002.markers.md` or similar — so the record stays untouched. New
  machinery for a problem with zero current instances, and `reference-check` reads markers from the
  citing file only, so it would need a checker change too.

**Nothing needs doing until the first instance.** Filing it is the work; the ruling can wait for a
real case, which will supply better evidence than speculation does.

## Touches

`adr/README.md` and possibly `adr/TEMPLATE.md` if the first option wins. `scan-scope.ts` if the
second does. Nothing at all until then.

## Open questions

- **Does `spikes/` have the same problem?** It came into scope in the same change. Nothing there
  claims immutability, so probably not — but nobody has checked whether a spike README is meant to be
  a dated record.
- **Is this general?** Any scanned directory whose own convention freezes its files has this shape.
  `adr/` is the only one today. Worth asking once rather than per directory.
