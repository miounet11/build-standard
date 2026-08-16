# 生成的状态页

「现在坏在哪」如果靠手写中文段落，长项目里一定漂。四份状态手册互相打架，比没有手册更伤。

---

## 一句话

**STATUS.md 由脚本从路线图、风险、基线、包版本生成。人手改进度百分比视为违规。打不开 STATUS，就不能回答现在坏在哪。**

---

## 何时用

- 状态散落在 CURRENT-STATUS、升级计划、开发手册、会话回复里
- 文档里的 version 落后仓库两个次版本以上
- 新人或 Agent 要问人才能知道「能不能发」

---

## 最低输出

脚本至少打印：

| 字段 | 来源 |
|------|------|
| 生成时间 | 时钟 |
| 仓库 / 各端 version | 包配置，不是文档里的数字 |
| 用户通道 version | OTA / 下载页 / 商店，读得到就读 |
| 里程碑勾选 | `roadmap.md` |
| 打开的 S1 / S2 数 | `risks.md` |
| 主路径是否关门 | 验收清单；空着就写「未关门」 |
| 基线是否回退 | `baselines/` |

第一版可以很矮：version + S1 数 + 「主路径未关门」。有了就不许再手写第二份进度。

示例：[templates/STATUS.example.md](../templates/STATUS.example.md)。

---

## 步骤

1. 输入只允许 `product/` 与包配置，不允许再解析三份中文计划。
2. CI 在 main 上跑生成器；有变化就提交或至少让 PR 看到 diff。
3. 文首写 `Generated. Do not edit.`
4. 人要改进度：改路线图勾选或风险状态，再生成。

---

## 禁止

- 手改 STATUS 里的百分比或 version
- 再开 `CURRENT-STATUS-*.md` 作为第二份进度
- 用目标文件自我打勾代替 STATUS

---

## 产出

一条 `npm run status` / `./script/render-status` 和生成的 `STATUS.md`。
