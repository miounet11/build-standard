# 可复制到产品仓的空合同

| 文件 | 放到产品仓 | 作用 |
|------|------------|------|
| [product-README.md](./product-README.md) | `product/README.md` | 权威表 + 成熟度级别 |
| [risks.md](./risks.md) | `product/risks.md` | 缺口册；打开的 S1 会拦正式发布 |
| [waivers.md](./waivers.md) | `product/waivers.md` | 过不了的门禁 + 到期日 + owner |
| [quality-gate.mjs](./quality-gate.mjs) | `scripts/quality-gate.mjs` | 可执行的结构门禁，接 `npm run gate` |
| [STATUS.example.md](./STATUS.example.md) | 生成器的输出形状 | 不要手抄进仓库当真状态 |

路线图、门禁矩阵、规格按产品自己写。总纲是 [SCHEME.md](../SCHEME.md)，落地顺序是 [ADOPTION.md](../ADOPTION.md)。

## quality-gate.mjs 检查什么

不需要产品知识的结构规则：权威表存在、STATUS 是生成物、打开的 S1、过期豁免、疑似凭据、声称「当前唯一版本」的现行文档。

业务门禁（主路径、主柱、灰度）用 [ship-standard](https://github.com/miounet11/ship-standard) 的 id，在你自己的测试与发布脚本里落地。
