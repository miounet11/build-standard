# Risk register

Add a row when you discover a risk. Close it when mitigated. **Do not delete closed rows.**

Severity: **S1** = can break a release · **S2** = degrades a major feature · **S3** = debt.
Status: `open` · `mitigating` · `closed`.

| ID | Severity | Area | Status | Risk | Mitigation | Owner |
|----|----------|------|--------|------|------------|-------|
| R-001 | S1 | Process | open | STATUS is still hand-written in more than one file | Add render-status; delete duplicate CURRENT-STATUS | — |

## How to file

1. Next free `R-NNN`.
2. Score from the user's view, not from how hard it is to fix.
3. Link mitigation to a roadmap item or PR.
