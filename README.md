# Build Standard

**高质量软件的总纲在 [SCHEME.md](./SCHEME.md)。** 先读那一页。

[Ship Standard](https://github.com/miounet11/ship-standard) 回答怎样才算上线。本仓库回答怎样创建，以及文档怎样才不会把长项目拖死。

不是「一句话生成整盘」。方案是：

**人定做成 → 仓库只认一份权威 → Agent 七步先红后绿 → 主柱取 min → 用户装到才算修了 → 过期文档进归档。**

| 实践 | 一句话 |
|------|--------|
| [loop](./practices/loop.md) | 七步，缺一步就停 |
| [owner-agent](./practices/owner-agent.md) | 人拥有上线权，Agent 在规则里执行 |
| [repo-memory](./practices/repo-memory.md) | 下一会话必须能从仓库接着干 |
| [authority](./practices/authority.md) | 每类问题只认一份现行文件 |
| [status](./practices/status.md) | STATUS 只生成，不手改 |
| [archive](./practices/archive.md) | 病例进归档，禁止再写「最新」 |
| [smallest-green](./practices/smallest-green.md) | 一层一个提交 |
| [real-path](./practices/real-path.md) | 在用户会走的路径上创建 |

产品仓空合同：[templates/](./templates/)。自己怎么做出来的：[examples/our-studio.md](./examples/our-studio.md)。

机器可读目录：[catalog.json](./catalog.json)。

---

## 今天先做这四步

1. 抄 [templates/product-README.md](./templates/product-README.md) 到产品仓 `product/README.md`。
2. 标题含「最新」的文档改名或搬进 `docs/archive/`。
3. 接一条生成 STATUS 的命令（第一版：version + 打开的 S1）。
4. 下一笔非平凡改动走七步；发版对照 [SCHEME.md](./SCHEME.md) 的清单。

---

## 许可

[MIT](./LICENSE)。
