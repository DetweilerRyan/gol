Run the gate before handoff.

- Run the gate before handoff. Read the output rather than the exit code, because a warning does not move it. Silently leaving a finding is not an option.
- Commit only when the tree is green.

1. Read the approved scenario first.
2. Write the failing test. Then make the smallest change that passes it. Report the result at handoff.
