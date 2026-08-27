---
name: duplicate-seedkey-error-names-data-rows-not-headers
title: Name the Examples header lines in the duplicate-seedKey error, not just the data rows
created: 2026-08-27
---

## Context

Found by `product` at `acceptance-mutation-seed-keys-are-positional`'s VERIFY, by planting a
colliding feature and reading what the tool actually printed. Explicitly filed as a wishlist item,
not a defect — `product`'s verdict on the message as a whole was that it could act on it **without
opening the source**, which is what let `architect`'s "the message is the documentation" ruling
stand instead of owing a CLAUDE.md entry.

The message names the **data rows** the colliding sites sit on, while its remedy — "rename the
shared column" — acts on the **header** lines. In the probe: lines 10 and 20 reported, headers at
9 and 19.

That mismatch is deliberate rather than sloppy, and `assertUniqueSeedKeys`'s own comment says why:
the seedKey cannot distinguish the colliding sites, so the message names each _site's_ line. The
column segment of the key (`probe-collide.feature:0:x` → `x`) closes the gap, which is why this is
a nit and not a defect.

## Sketch

Carry the header line alongside the row line, so the message can say both. The finder knows the
`Examples` node and therefore its `tableHeader.location.line`, so this is a matter of threading one
more field to where the message is built — not new parsing.

Weigh it against the cost: `MutationSite` is a small, kind-agnostic shape shared by every future
finder, and a header line is meaningful only for table-shaped kinds. A `SiteKind` for step text
would carry a field that means nothing to it. That is the real question here — whether this belongs
on the shared type at all, or in a kind-specific detail the message builder can ask for.

## Touches

`scripts/acceptance-mutation/mutation-sites.ts` (the message and possibly `MutationSite`),
`examples-cell-sites.ts` (the finder that would supply the line), and `mutation-sites.test.ts` —
where fixture (a) already pins the message's exact content, so any change here must update it. Note
that test **deliberately restates the message as a literal rather than importing it**, on the
`SCROLLBAR_THICKNESS_PX` precedent; keep that.

## Open questions

- Does `MutationSite` want an optional kind-specific detail bag, or does the message builder ask
  the finder? The second keeps the shared type clean and is probably right, but it is a small
  architectural decision rather than an obvious one.
- Is this worth doing at all before a second `SiteKind` exists? The shape of the answer depends on
  what that kind needs, and guessing now risks designing for one table-shaped case forever.
