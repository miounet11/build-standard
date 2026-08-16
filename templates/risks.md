# Risk register

Add a row when you discover a risk. Close it when mitigated. **Do not delete closed rows.**

Severity: **S1** = can break a release · **S2** = degrades a major feature · **S3** = debt.
Status: `open` · `mitigating` · `closed`.

| ID | Severity | Area | Status | Risk | Mitigation | Owner |
|----|----------|------|--------|------|------------|-------|
| R-001 | S1 | Process | open | STATUS is still hand-written in more than one file | Add render-status; delete duplicate CURRENT-STATUS | — |

R-001 不是装饰行。刚接进这套的仓库通常真的有这个缺口，所以第一天 `npm run gate` 会红、`COMPOUND-5` 会拦正式发布 —— 这是对的。接上生成的 STATUS 后把它改 `closed`（保留行）。真的赶时间就写豁免，不要删行。

## How to file

1. Next free `R-NNN`.
2. Score from the user's view, not from how hard it is to fix.
3. Link mitigation to a roadmap item or PR.
