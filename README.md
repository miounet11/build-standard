# Build Standard

[Ship Standard](https://github.com/miounet11/ship-standard) 回答：**怎样才算上线。**  
这个仓库回答：**这些程序是怎么被创建出来的。**

我们不是「一句话生成整盘软件」。能连续做出浏览器、远控、长跑自动化，靠的是同一套创建法：

**人定完成定义 → 仓库当记忆 → Agent 跑闭环 → 真路径验收 → 把新坑写回合同。**

做法拆成实践（practice）。每份有一句话、步骤、禁止项。以后只加实践，不重写整本。

| 实践 | 一句话 | 文档 |
|------|--------|------|
| [loop](./practices/loop.md) | 非平凡改动走七步，缺一步就停 | 诊断 → 规格 → 计划 → 红 → 绿 → 验证 → 反思 |
| [owner-agent](./practices/owner-agent.md) | 人拥有「做成了」，Agent 在规则里执行 | 分工、交接、禁止让模型自己宣布完成 |
| [repo-memory](./practices/repo-memory.md) | 下一会话必须能从仓库接着干 | 身份文件、合同目录、生成的状态页 |
| [smallest-green](./practices/smallest-green.md) | 只做让红灯变绿的最小改动 | 一层一个提交，禁止顺手重构 |
| [real-path](./practices/real-path.md) | 在用户会走的路径上创建 | 正式包、同版本、主路径，不认本机感觉 |

自己怎么用这套法做出来的，见 [examples/our-studio.md](./examples/our-studio.md)。

机器可读目录：[catalog.json](./catalog.json)。

---

## 和 Ship Standard 怎么配合

```
创建（本仓库）                    验收与上线（ship-standard）
人定做成什么样          →        门禁、主柱、主路径
仓库记住缺口和规格      →        不变量、风险、探针
Agent 先红后绿          →        完成由门禁说了算
真路径跑通              →        灰度、同版本、用户吃到才算修了
抽出可复用做法          →        新纬度进 ship-standard
```

创建时缺记忆，验收时就会从聊天重讲。验收时缺门禁，创建时就会自我宣布完成。

---

## 怎么用

1. 开一个新产品：先写北极星和「这版做成什么样」，再生成仓库记忆，再让 Agent 动代码。
2. 每一笔非平凡改动套 [loop](./practices/loop.md)。
3. 做完一轮，对照 [ship-standard](https://github.com/miounet11/ship-standard) 的门禁，没勾完的就是还不能上线的原因。
4. 新的创建习惯按 [practices/_template.md](./practices/_template.md) 加文件，并登记 `catalog.json`。

---

## 许可

[MIT](./LICENSE)。
