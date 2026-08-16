# 质量门禁

本仓认哪些门禁、每条是 `warn` 还是 `block`、由什么来判。

- 门禁 id 与含义的权威是 [ship-standard/gates.json](https://github.com/miounet11/ship-standard/blob/main/gates.json)，**不要在这里重写含义**。
- 哪些门禁在本级阻断，由声明的成熟度级别推导，见 [SCHEME.md](https://github.com/miounet11/build-standard/blob/main/SCHEME.md) §4。
- 每一行都必须写 `warn` 或 `block`（门禁 `PROBE-2`）。没写就是没想清楚。

当前级别以 [product/README.md](./README.md) 为准。

---

## 结构门禁（`node scripts/quality-gate.mjs`）

不需要产品知识，抄来就能跑。

| 门禁 | 判定 | 级别 |
|------|------|------|
| `DOC-1` | 权威表存在、声明级别与升级到期日、写明主柱 | block |
| `DOC-2` | STATUS 由脚本生成、未过期、含当前版本号 | block |
| `DOC-3` | 风险册存在且每行有状态 | block |
| `DOC-5` | 无文件名/标题声称「最新」的现行文档 | block |
| `COMPOUND-1` | 北极星已写下 | block |
| `COMPOUND-2` | 合同目录齐 | block |
| `COMPOUND-5` | 打开的 S1 为 0 | warn（L3 起 block） |
| `KERNEL-1` | 主柱已写下或已声明不适用 | block |
| `PROBE-1` | PR 模板含七步 | block |
| `PROBE-2` | 本表每行标了 warn/block | block |
| `LAUNCH-5` | 文档与安装包无明文凭据 | block（不可豁免） |
| `LAUNCH-11` | 第三条配置路径不靠公布主机地址 | block（不可豁免；脚本标 not machine-checked） |

---

## 业务门禁（本仓已有的脚本）

把已经存在的脚本挂上门禁 id，别为了标准另写一套。

| 门禁 | 用什么判 | 级别 | 升级条件 |
|------|----------|------|----------|
| `PROBE-3` | `npm test` | block | — |
| `PATH-1` | `npm run e2e:smoke` | warn | 连续两次 CI 全绿后升 block |
| `COMPOUND-4` | `baselines/` 对比 | warn | 基线稳定两轮后升 block |

---

## 只能人判的（写清楚，别假装脚本覆盖了）

| 门禁 | 谁判 | 什么时候判 |
|------|------|------------|
| `DIAG-1` | owner | 每次做分层改动 |
| `PROBE-6` | 评审 | 每个 PR |
| `PATH-6` | owner | 发版前 |

---

## 升级规矩

`warn → block` 的条件必须可数，默认「连续两次 CI 全绿」。
过不了又必须发，走 [waivers.md](./waivers.md)，不要把 block 偷偷改回 warn ——
改级别要和改代码同一笔 PR，并写原因。
