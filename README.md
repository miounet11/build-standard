# Build Standard

**总纲在 [SCHEME.md](./SCHEME.md)。先读那一页。**

这不是「一句话生成整盘」。方案是从一个因果模型推出来的：软件不高质量，是因为四种结构性泄漏 —— 完成定义不可检查、权威不唯一、反馈晚于改动、修复到不了用户。

对应堵法：

**门禁定完成 → 权威只有一份 → 先红后绿一层一提交 → 用户装到才算修了 → 过不了写豁免不是绕过。**

| 文档 | 回答 |
|------|------|
| [SCHEME.md](./SCHEME.md) | 因果模型、十条铁律、成熟度 L0–L3、豁免机制、明确不适用 |
| [ADOPTION.md](./ADOPTION.md) | 老仓库第一小时 / 第一天 / 第一周怎么止血 |
| [templates/](./templates/) | 产品仓可直接复制的空合同与可执行门禁 |
| [ship-standard](https://github.com/miounet11/ship-standard) | 能不能上线：60 条带 id 的门禁 |
| [STATUS.md](./STATUS.md) | 生成的本仓状态 |
| [CHANGELOG.md](./CHANGELOG.md) | 标准自己的版本与兼容承诺 |

---

## 实践（怎么执行）

| 实践 | 一句话 |
|------|--------|
| [loop](./practices/loop.md) | 七步，缺一步就停 |
| [owner-agent](./practices/owner-agent.md) | 人拥有上线权，Agent 在规则里执行 |
| [repo-memory](./practices/repo-memory.md) | 下一会话必须能从仓库接着干 |
| [authority](./practices/authority.md) | 每类问题只认一份现行文件 |
| [status](./practices/status.md) | STATUS 只生成，不手改 |
| [archive](./practices/archive.md) | 病例进归档，不再开第二本手册 |
| [smallest-green](./practices/smallest-green.md) | 一层一个提交 |
| [real-path](./practices/real-path.md) | 在用户会走的路径上创建 |

自己怎么做出来的：[examples/our-studio.md](./examples/our-studio.md)。机器可读目录：[catalog.json](./catalog.json)。

---

## 边界：本仓 vs ship-standard

同一件事只有一个权威，两仓不重叠。

| 问题 | 权威 |
|------|------|
| 总纲、铁律、成熟度、豁免 | 本仓 [SCHEME.md](./SCHEME.md) |
| 怎么创建（七步执行、分工、仓库记忆、最小变绿） | 本仓 `practices/` |
| 能不能上线（门禁 id、主柱、主路径、灰度、回滚） | ship-standard `dimensions/` |
| 产品仓空合同与落地脚本 | 本仓 `templates/` |

---

## 今天先做这四步

1. 抄 [templates/product-README.md](./templates/product-README.md) 到产品仓 `product/README.md`，写上当前成熟度级别（老项目诚实写 L0）。
2. 声称「当前唯一版本」的文档改名或搬进 `docs/archive/`。
3. 复制 [templates/quality-gate.mjs](./templates/quality-gate.mjs)，接一条 `npm run gate`。
4. 下一笔非平凡改动走七步；发版对照 [SCHEME §8](./SCHEME.md)。

---

## 自检

本仓自己先过自己的门禁：

```bash
npm run verify   # 生成 STATUS + 校验铁律条数、成熟度分级、门禁 id、死链、重复标题
```

---

## 许可

[MIT](./LICENSE)。
