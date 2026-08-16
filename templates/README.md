# 可复制到产品仓的空合同

抄完这一列，`node scripts/render-status.mjs && node scripts/quality-gate.mjs` 就能跑出真结果。

| 文件 | 放到产品仓 | 作用 |
|------|------------|------|
| [product-README.md](./product-README.md) | `product/README.md` | 权威表 + 成熟度级别 + 升级到期日 + 主柱 |
| [roadmap.md](./roadmap.md) | `product/roadmap.md` | 北极星 + 里程碑 + 本季度不做 |
| [risks.md](./risks.md) | `product/risks.md` | 缺口册；打开的 S1 会把通道压到 beta |
| [waivers.md](./waivers.md) | `product/waivers.md` | 追加写的豁免账本，带到期日与 owner |
| [quality-gates.md](./quality-gates.md) | `product/quality-gates.md` | 本仓认哪些门禁，每条 warn 还是 block |
| [quality-gate.mjs](./quality-gate.mjs) | `scripts/quality-gate.mjs` | 可执行的结构门禁，接 `npm run gate` |
| [render-status.mjs](./render-status.mjs) | `scripts/render-status.mjs` | 生成 `STATUS.md`，接 `npm run status` |
| [STATUS.example.md](./STATUS.example.md) | 生成器的输出形状 | 不要手抄进仓库当真状态 |

还需要你自己建：`product/spec/`（一份纬度一份不变量）和一个 PR 模板
（`.github/pull_request_template.md`，含七步，否则 `PROBE-1` 红）。

总纲是 [SCHEME.md](../SCHEME.md)，落地顺序与常见卡点是 [ADOPTION.md](../ADOPTION.md)。

## 第一次跑一定是红的

这是对的。红在哪，就是你现在的真实状态。不要为了变绿删掉 `product/risks.md` ——
删掉风险册本身就是 `DOC-3` 失败，比诚实填写更红。

## quality-gate.mjs 检查什么

按声明的成熟度级别决定阻断范围（SCHEME §4）：`stage` 在本级内的门禁阻断，本级之上的跑 warn。

机器判：`DOC-1` `DOC-2` `DOC-3` `DOC-5` `KERNEL-1` `COMPOUND-1` `COMPOUND-2` `COMPOUND-5`
`PROBE-1` `PROBE-2` `LAUNCH-5`，以及豁免单本身（到期日、owner、次数、是否可豁免）。

它不假装覆盖整级：判不了的门禁（如 `DIAG-1`、`PROBE-6`）会单独列在 `not machine-checked`
里，提醒你人工确认。业务门禁（主路径、主柱、灰度）用 [ship-standard](https://github.com/miounet11/ship-standard)
的 id，在你自己的测试与发布脚本里落地，并登记进 `product/quality-gates.md`。

## 可选：钉住门禁定义

把 ship-standard 的 `gates.json` 抄一份到 `product/gates.json`，脚本就会额外校验
豁免单和门禁表里引用的 id 是否真实存在、以及内置的 stage 是否已经漂移。
