# Build Standard

> **Language: the standard itself is written in Chinese.** Filenames, code, and gate ids are
> English; the reasoning is not translated. Scroll to [In English](#in-english) for a summary
> of the model and the executable parts, which are language-independent.

**总纲在 [SCHEME.md](./SCHEME.md)。先读那一页。**

这不是「一句话生成整盘」。方案是从一个因果模型推出来的：软件不高质量，是因为六种结构性泄漏 ——
完成定义不可检查、权威不唯一、反馈晚于改动、修复到不了用户、不可逆伤害没有闸、世界在变而仓库冻着。

对应堵法：

**门禁定完成 → 权威只有一份 → 先红后绿一层一提交 → 用户装到才算修了 → 不可逆的事有不可豁免的闸 → 按期重验。**

| 文档 | 回答 |
|------|------|
| [SCHEME.md](./SCHEME.md) | 因果模型、十二条铁律、成熟度 L0–L3、豁免机制、明确不适用与明确未覆盖 |
| [ADOPTION.md](./ADOPTION.md) | 老仓库第一小时 / 第一天 / 第一周怎么止血，含第一次跑的真实输出 |
| [templates/](./templates/) | 产品仓可直接复制的空合同、STATUS 生成器与可执行门禁 |
| [ship-standard](https://github.com/miounet11/ship-standard) | 能不能上线：带稳定 id 的门禁（条数以那边 `gates.json` 为准） |
| [creativity-is-engineering](https://github.com/miounet11/creativity-is-engineering) | 洞察有没有落成可引用的定律 |
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

## 边界：三仓不重叠

同一件事只有一个权威。**本仓不判定任何一条门禁的含义，也不列举哪条 id 在哪一级阻断。**

| 问题 | 权威 |
|------|------|
| 为什么会不高质量、铁律、成熟度**规则**、豁免**规则** | 本仓 [SCHEME.md](./SCHEME.md) |
| 怎么创建（七步执行、分工、仓库记忆、最小变绿） | 本仓 [practices/](./practices/) |
| 能不能上线（门禁 id / stage / severity / 是否可豁免 / 各级要求哪些） | [ship-standard](https://github.com/miounet11/ship-standard) [gates.json](https://github.com/miounet11/ship-standard/blob/main/gates.json) |
| 创造有没有落成定律 | [creativity-is-engineering](https://github.com/miounet11/creativity-is-engineering) |
| 产品仓空合同与落地脚本 | 本仓 [templates/](./templates/) |

成熟度不是本仓手写的清单，是一条推导规则：**级别 `Ln` 阻断 `stage` 在本级内的 `block` 门禁**，
清单由 `gates.json` 生成。本仓钉了一份 [gates.pinned.json](./checks/gates.pinned.json)，
所以上游改 id 会在这里变成一条 diff，而不是悄悄烂掉。

---

## 今天先做这四步

1. 抄 [templates/product-README.md](./templates/product-README.md) 到产品仓 `product/README.md`，写上当前级别（老项目诚实写 L0）**和升级到期日**。
2. 声称「当前唯一版本」的文档改名或搬进 `docs/archive/`。
3. 抄 [templates/quality-gate.mjs](./templates/quality-gate.mjs) 和 [templates/render-status.mjs](./templates/render-status.mjs)，跑一次。第一次会红，这是对的。
4. 下一笔非平凡改动走七步。

完整清单和第一次跑的真实输出在 [ADOPTION.md](./ADOPTION.md)。

---

## 自检

本仓自己先过自己的门禁：

```bash
npm run verify
```

它会校验：铁律条数与每条的泄漏标注、每个泄漏是否真有规则堵、§4 有没有偷偷手写门禁 id、
§5 有没有重抄七步表、引用的门禁 id 是否真实存在于钉住的 `gates.json`、
死链、重复标题、四处实践清单是否漂移 ——
**并且把 `templates/quality-gate.mjs` 真的跑在 3 个 fixture 仓上**（绿 / 红 / 带豁免），
断言它该红的红、该绿的绿。`node --check` 只能证明文件能解析，挡不住任何一个真 bug。

刷新钉住的门禁定义：`npm run pin`。

---

## In English

The claim: software quality does not leak because people are careless. It leaks through six
structural holes, and every rule in this standard names the hole it plugs — a rule that plugs
nothing does not get in.

| # | Leak | Plugged by |
|---|------|-----------|
| 1 | Definition of done is not checkable | Gates decide done, not a checklist |
| 2 | More than one document claims authority | One authority table; STATUS is generated |
| 3 | Feedback arrives after the change | Red probe first, one layer per commit |
| 4 | The fix never reaches users | Distribution lag is a quality incident |
| 5 | Irreversible harm has no brake | A small set of gates that cannot be waived |
| 6 | The world moves while the repo is frozen | Scheduled re-verification, not just on PR |

Two things here are language-independent and are the point of the repo:

- **`templates/quality-gate.mjs`** — a dependency-free structural gate for a product repo. It reads
  the maturity level you declare, blocks only on gates whose stage is at or below that level,
  honours waivers by demoting a gate to a warning and forcing the beta channel, and prints the gates
  it cannot check rather than implying full coverage.
- **`templates/render-status.mjs`** — generates `STATUS.md` so nobody can hand-write a percentage
  into it.

Gate ids, stages and severities live in [ship-standard](https://github.com/miounet11/ship-standard);
this repo only defines how levels are derived from them. Both are MIT.

---

## 许可

[MIT](./LICENSE)。
