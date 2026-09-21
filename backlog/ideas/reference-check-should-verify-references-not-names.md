---
name: reference-check-should-verify-references-not-names
title: Narrow reference-check to citations of real files, so prose naming a convention needs no opt-out
created: 2026-09-21
---

## Situation

`npm run reference-check` treats every filename-shaped token in a comment or a documentation file as
a citation, and requires each one to resolve by basename against the live tree. The check exists to
catch a real defect: prose names a file, that file is renamed or deleted, and nothing notices.

Prose that describes a convention names files that do not exist yet. To keep such a sentence legal
the checker carries an opt-out — a comment naming the token and a mandatory reason. The checker also
polices its own opt-outs, reporting one as stale once its token resolves, because an opt-out kept
past its cause silently disarms the protection it suspends.

Measured 2026-09-21: the tree carries 59 opt-out markers.

## Complication

An escape hatch used 59 times is not an exception, it is a toll. Each instance is a sentence a writer
had to stop and justify, and each is a failure armed for whenever its token becomes real.

The failure fires on success. Promoting the first board item to carry an `assessment.md` turned four
markers stale at once and exited the gate non-zero on `main` — recorded in commit `474389a`. Nothing
had rotted. The repo had simply done the thing the convention described.

The root cause is that the checker cannot tell a citation from a noun. `camera.ts` named in a comment
is a pointer at a file and is worth verifying. `assessment.md` named in a sentence defining what a
promoted item holds is the name of a shape, and there is nothing to verify until one exists. The
checker sees a single token class and demands both resolve.

## Question

What distinguishes a citation of a file from a name for a file shape, closely enough that a checker
can tell them apart without losing the rot it was built to catch?

## Answer

None shaped. The discriminator is the whole question, and no candidate has been measured.

## No-gos

- **The check is not deleted.** The rot it catches is real and the two checks over `<file>'s <symbol>`
  citations and over source line numbers are not in question.
- **No relaxation that trades a false negative for silence.** Basename matching already under-reports
  deliberately, and a narrowing that quietly stops checking real citations is worse than the toll.

## Open questions

- **Is a path prefix the discriminator?** A token carrying a directory reads as a citation and a bare
  basename as a noun. Plausible, unmeasured, and the 59 existing markers are the corpus to test it
  against: a rule that would still demand an opt-out for most of them has not solved anything.
- **What does the 59 break down into?** Nobody has classified them. Some name files that never
  existed anywhere, some name generated files outside the tracked tree, some name a convention. Each
  class may want a different answer, and the counts decide whether one rule covers them.
- **Does the stale-marker check survive a narrowing?** If legitimate prose stops needing opt-outs, the
  remaining markers are a smaller and differently-shaped population, and the case for policing them
  may get stronger rather than weaker.
- **Is the real fix upstream in the procedures instead?** The promotion procedure creates the file
  that expires a marker and has no step that deletes it. The two sibling `tasks.md` markers will fail
  identically on the first design pass that writes one. A procedure step would stop the recurrence
  without touching the checker, and would leave the toll in place.
- **Does this want a spike before a slice?** The discriminator is an unmeasured mechanism, and a
  design premise built on the wrong one would be expensive to unwind after the checker changes.
