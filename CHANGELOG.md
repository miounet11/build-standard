# Changelog

## 0.5.0

三个模型再次独立审查：钉住的门禁落后于 ship-standard 0.8.0，三仓边界缺 creativity，README 手写「60 条」会过期。

- 钉住 [ship-standard 0.8.0](https://github.com/miounet11/ship-standard)：63 个 id，含 `LAUNCH-11` / `KERNEL-7` / `PATH-7`。
- `catalog.related` 与 README / SCHEME 补上 [creativity-is-engineering](https://github.com/miounet11/creativity-is-engineering)。
- 不可豁免名单与 pin 对齐：`LAUNCH-5` `LAUNCH-11` `PRESHIP-4`。`quality-gate.mjs` 的 fallback 必须等于 pin，否则自检红。
- README 不再手写门禁条数。§11「计划中的纬度」改指现行 id；拒绝再催 `compat` / `observe` / `rollback` 新纬度。
- `archive`、`real-path` 标 draft：本仓只写怎么做，验收句留在 ship。
- 上游 pin 漂移在 CI 里改为失败，不再只警告。有 sibling checkout 时，本地 `verify` 也会因 pin 落后而红。

本仓仍然不自造 `BUILD-*` 门禁 id。

## 0.4.0

三个模型（gemini-3.7 / grok-4.6 / opus-5）各自独立审查 0.3.0，三份报告一致指向同一件事：
**说得对，但没接上电。** 本版把接线做完，并删掉两处自己造出来的第二权威。

### 破坏性

- **§4 不再手写「哪条 id 在哪一级阻断」。** 那份手写清单和 ship-standard 的 `stage`
  是两套映射，互相矛盾，结果有 18 条门禁（含编码了铁律 7 的 `KERNEL-1`）在任何级别都不会被要求。
  现在只有一条推导规则：**级别 `Ln` 阻断 `stage` 在本级内的 `block` 门禁**，清单由
  [gates.json](https://github.com/miounet11/ship-standard/blob/main/gates.json) 的 `levels` 生成。
  自检会拒绝 §4 里出现任何门禁 id。
- **删掉 SCHEME 开头的「三者冲突时以本页为准」。** 那句话让本页成了 ship-standard 的第二权威，
  和 README 里「两仓不重叠」直接打架。边界表改为逐项声明谁说了算。
- **§5 不再重抄七步表**，权威归 [practices/loop.md](./practices/loop.md)；
  ship-standard `probe.md` 里的那份副本同步删除。自检两边都拦。
- 豁免单表结构改为**追加写 + 状态列**。原来「关闭时删行」会把「第几次」擦掉，
  而那正是滥用发生的地方。

### 因果模型

- 泄漏从 4 个加到 6 个：新增**「不可逆伤害没有闸」**（密钥、生产守卫、破坏性迁移、无回滚）
  和**「世界在变而仓库冻着」**（依赖 CVE、证书过期、上游改字段、系统大版本）。
  前者是铁律 2 的真正归属（原来硬挂在泄漏 1 上，用它自己的拒绝测试是过不了的）。
- 铁律 10 → 12：新增「探针不稳就修好或删掉，不准靠重试」（会闪的绿灯是自动运行的静默绕过）
  和「世界会变，仓库要按期重验」。
- 铁律 8（产品力取 min）明确只对有用户可见主柱的产品成立，库 / CLI / 编译器在 §11 声明替代物。
- §11 新增**「明确未覆盖」**：数据迁移、供应链、可观测性、性能预算、无障碍、七步的成本 ——
  写下来，是为了不让「堵不到泄漏就不加」变成假装这些问题不存在。它们的归宿是 ship-standard 的新纬度。

### 门禁真的会跑了

- **重写 [templates/quality-gate.mjs](./templates/quality-gate.mjs)。** 修掉的真 bug：
  - 不读成熟度级别，在 L0 就用 release 阶段的 `COMPOUND-5` 把人拦死
  - 豁免完全不生效 —— 失败信息叫你去写豁免，写了照样 FAIL
  - S1 用整行子串匹配 `open`：`mitigating` 和大写 `Open` 漏报，closed 行里写了 "open" 误报
  - 到期日用「整行第一个日期」，原因里提一句历史日期就被判过期
  - 缺到期日时 `continue` 掉了「不可豁免」的判定，更严重的那条反而不报
  - 缺 `product/risks.md` 只是 warn —— 删掉风险册比诚实填写更容易变绿
  - `ROOT = cwd`，从子目录跑会检查错的树
  - 用 UTC 日期，UTC+8 的豁免提前八小时死亡
  - 级别用全文第一个 `L0..L3` 匹配，散文里提一句就算声明
  - 注释声称检查 STATUS 新鲜度和 DOC-4 归档，两者都不存在
- 新增判定：`COMPOUND-1` `COMPOUND-2` `DOC-3` `KERNEL-1` `PROBE-1` `PROBE-2`、
  升级到期日、豁免 owner 与次数、STATUS 与版本号一致、真的重跑生成器比对新鲜度。
- 扫描前先过 `git check-ignore`，本地私人笔记不再误报为泄露；凭据检测补上表格形式。
- **不可豁免门禁在任何级别都阻断** —— 否则 L0 可以把泄密降级成一条警告。
- 脚本会打印**自己判不了的门禁**（`not machine-checked`），不再让绿灯暗示全覆盖。

### 补齐盒子

- 新增 [templates/render-status.mjs](./templates/render-status.mjs)。
  原来 ADOPTION 第一天要求「接 STATUS」，但仓里根本没有生成器，读者得自己写约 160 行。
  明确约定 STATUS 里**不放墙钟时间戳**，否则 CI 那行 `git diff --exit-code STATUS.md` 每次都红。
- 新增 [templates/roadmap.md](./templates/roadmap.md)、[templates/quality-gates.md](./templates/quality-gates.md)。
  `templates/product-README.md` 一直链着这两个不存在的文件。
- `templates/product-README.md` 加**升级到期日**和**主柱**两节。

### 自检不再是摆设

- **新增 [checks/fixtures/](./checks/fixtures/) 与 `npm run test:gate`**：把 `quality-gate.mjs`
  真的跑在 green / red / waived 三个 fixture 仓上，断言退出码和具体门禁 id。
  原来只有 `node --check`（语法解析），上面每一个运行时 bug 都能绿着发出去。
- 门禁 id 改为对**钉住的 `gates.json`** 校验（[checks/gates.pinned.json](./checks/gates.pinned.json)，
  `npm run pin` 刷新）。原来只校验前缀，一个编造的 DOC-99 也能过。
- 新增校验：每条铁律必须标注泄漏、每个泄漏必须有规则堵、§4 不得手写 id、§5 不得重抄七步表、
  `catalog.json` 与 `package.json` 的版本和描述一致、四处实践清单不漂移、
  死链改为匹配全部相对链接（原来只匹配 `./` 和 `../`，生成的 STATUS 里的链接全部漏检）、
  标题里的「最新」。
- CI 加每周定时跑（泄漏 6：只在 PR 上跑发现不了上游漂移）和上游 pin 漂移检测。

### 其他

- README 首行写明**语言契约**（正文中文），并给出英文摘要 —— 原来用英文名和英文描述招来读者，
  再用全中文正文把人挡回去。
- 修掉过度宣称：README 原称自检校验「门禁 id」（实为前缀）。
- 修掉陈旧声明：`examples/our-studio.md` 说「五份实践」，实际八份。
- `catalog.json` 与 `package.json` 原来是两句不同的定位描述。

## 0.3.0

- [SCHEME.md](./SCHEME.md) 重写为可推导的形式：先给**因果模型**（四种质量泄漏），十条铁律逐条注明它堵哪一种。加不进这个模型的规则不进总纲。
- 新增**成熟度分级 L0–L3**：老项目不再被一次判死，按级把 `warn` 升 `block`。
- 新增**豁免机制**：过不了的门禁必须写单，带到期日与 owner；过期即失败；密钥类与生产守卫类不可豁免。这一条把「静默绕过」变成有账可查。
- 新增**明确不适用**范围：一次性脚本、spike、原型不必建 `product/`。
- 新增 [ADOPTION.md](./ADOPTION.md)：老仓库第一小时 / 第一天 / 第一周的止血顺序，含常见卡点。
- 新增 [templates/quality-gate.mjs](./templates/quality-gate.mjs)：产品仓可直接复制的结构门禁（权威表、生成 STATUS、打开的 S1、过期豁免、疑似密钥）。
- 新增 [templates/waivers.md](./templates/waivers.md)。
- 新增 `checks/` 自检与 CI：本仓自己先过自己的门禁（铁律条数、成熟度分级完整、门禁 id 前缀合法、死链、重复标题、模板可解析）。
- 新增生成的 [STATUS.md](./STATUS.md)。

## 0.2.0

- 新增实践 `authority`、`status`、`archive`（来自两个长期项目的文档漂移）。
- 首版 SCHEME.md 与 `templates/`。

## 0.1.0

- 首发实践 `loop`、`owner-agent`、`repo-memory`、`smallest-green`、`real-path`。

## 兼容承诺

诚实版：**0.x 期间铁律编号会变。** 0.3.0 重写过一次，0.4.0 又从 10 条加到 12 条 ——
所以「编号稳定」在 1.0 之前是句空话，写出来只会让人不信剩下的部分。

现在的承诺是：

- **改编号必须在本文件逐条列出旧→新的对应**，不许静默重排。
- **门禁 id 的含义不在这里定，也不在这里改。** 权威是
  [ship-standard/CHANGELOG](https://github.com/miounet11/ship-standard/blob/main/CHANGELOG.md)；
  收紧一条已公布 id 的判定 = 加新 id，旧的标 deprecated。
- **成熟度不再有「各级必备清单」这种东西可变** —— 它现在是一条推导规则。
  变的只可能是 `gates.json` 里某条门禁的 `stage`，那会记在上游的 CHANGELOG 里。
- 1.0 之后铁律编号才冻结。
