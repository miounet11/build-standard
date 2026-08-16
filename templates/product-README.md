# Documentation

This directory is the **contract**. The code is the implementation.

If the code disagrees with a spec, **one of them is wrong** — the PR that resolves it updates both.

## 成熟度

当前级别：**L0 看见** ← 诚实填写，见 [SCHEME §4](https://github.com/miounet11/build-standard/blob/main/SCHEME.md)。

**升级到期日：2026-12-31** ← 必填。没有时钟的级别是一张永久免罪符，门禁会拒。

适用纬度：compound、quality-kernel ← opt-in 纬度只有写在这里才绑定。
长跑自动化加 `resilience`，要上架加 `pre-ship`，双端加 `acceptance-path`。
纬度清单见 [gates.json](https://github.com/miounet11/ship-standard/blob/main/gates.json) 的 `applies`。

高于本级的门禁跑 `warn`；本级全绿两轮才升级。只准往上升，降级要写豁免。

## 主柱

用户看得见的主柱（产品力取其中最小值，不取平均）：

| 主柱 | 现在几分 | 判定方式 |
|------|----------|----------|
| … | … | … |

没有用户可见主柱的产品（库、CLI、编译器）在这里写 `主柱不适用`，并写明用什么代替
（例如 API 兼容性 + 基准），见 SCHEME §11。

## 权威表（每类只认一份）

| 问题 | 只读这份 | 不要读 |
|------|----------|--------|
| 下一步做什么 | [roadmap.md](./roadmap.md) | 聊天、目标文件、AGENTS 里的进度 |
| 现在坏在哪 | 仓库根 `STATUS.md`（生成） | 任何手写 CURRENT-STATUS |
| 做成什么样 | [quality-gates.md](./quality-gates.md) + 本纬度 `spec/` | 任务清单打勾 |
| 打开的缺口 | [risks.md](./risks.md) | 已归档的 BUGFIX |
| 本纬度不变量 | [spec/](./spec/) 对应文件 | 同主题的第二份「总纲」 |
| 哪条门禁暂时过不了 | [waivers.md](./waivers.md)（带到期日） | 口头约定、静默跳过 |
| 怎么创建 / 怎么上线 | [build-standard SCHEME](https://github.com/miounet11/build-standard/blob/main/SCHEME.md) · [ship-standard](https://github.com/miounet11/ship-standard) | 再写第三本手册 |

未进本表却自称 SoT 的文件，文首必须写：`服从本表 · 角色：历史|子集|操作备忘`。

## 规格怎么写

1. 现在时，能写成测试。
2. 和代码同一 PR。
3. 删一条不变量和加一条一样严。
