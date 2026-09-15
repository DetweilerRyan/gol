---
name: idea-capture
description: File a raw thought as a candidate on the ideas/ board, in the template's shape.
when_to_use: When the user voices an idea, a "we should", a defect worth a slice, or any problem worth not forgetting -- capture it the moment it appears rather than letting it die in conversation.
argument-hint: '[the thought]'
allowed-tools: Read, Write
---

# Capture an idea

File the thought in $ARGUMENTS as `ideas/candidates/<name>.md`.

1. Derive `<name>`: kebab-case, short, naming the problem.
2. Read `ideas/TEMPLATE.md`.
3. Write the candidate in the template's shape.

Rules that bind the file:

- Set `name` to the file's own basename, `title` to one imperative line, and `created` to today.
- Do not add a `status:` field. The directory is the status.
- Put agreed facts under Situation and the need under Complication. State the need, never a chosen implementation.
- Pose the core as one explicit Question. Subsidiary decisions go under Open questions, not there.
- Answer is optional, and a raw candidate often has none. When present, keep it shaped, not specified — no file list.
- Leave at least one line under Open questions. An idea with nothing there is usually under-examined rather than simple.
- Date any measured claim. Write no second person.

Report the new file's path. Formatting is prettier's job, so match the 120-character width and let `npm run format` cover the rest.
