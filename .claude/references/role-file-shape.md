# The role-file shape

**Audience:** the orchestrating seat and the process roles. **Read when:** authoring or
restructuring a role file.

A role file opens with a job statement and satisfies the TROOP checklist over the anatomy
role files already use. The shape gives a new role one documented source to inherit from,
rather than imitation of whichever file was read last.

## The job statement

The first paragraph after frontmatter, ahead of the identity opener. Two sentences make the
statement. The first takes the form "when [situation], the seat hires `<role>` to
[motivation]". The second states the outcome the hiring buys. The statement is the file's
Objective — the job the role exists to do.

Write it kind-neutrally. The authority object is the spec the invoking prompt names,
never any one pipeline's artifact. A job statement that names a `.feature` builds the
Story assumption into the role. Keep each sentence within STE's 25-word cap, use no
contractions and no narration tokens, and give the statement its own paragraph.

## TROOP over the anatomy

The checklist confirms each letter has a home. The anatomy already carries four; the job
statement supplies the fifth. `product.md` is the worked example of the anatomy.

| TROOP letter | Where it lives in the file               |
| ------------ | ---------------------------------------- |
| Objective    | The job statement                        |
| Role         | The identity opener                      |
| Task         | Owns, plus the mode or workflow sections |
| Output       | Handoff                                  |
| Perspective  | Boundaries, plus the articles read list  |

A letter without a home is a gap to fill before the file lands. A section serving no
letter is a candidate for the file's sidecar or for deletion.

## What this shape does not do

- **No retrofit of the five existing role files** — ruled by the user 2026-09-17. They keep
  their current anatomy; a future slice may cite this file if their rewrite is ever ruled.
- **No consumer-JTBD emotional or social dimensions.** A repo role has a functional job
  only; the statement stays two sentences.
