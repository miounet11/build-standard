# Changelog

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

- 铁律编号稳定；新增规则只能替换或新增，不悄悄改含义。
- 成熟度各级的必备门禁清单变化会写在本文件。
- 门禁 id 的权威在 [ship-standard/CHANGELOG](https://github.com/miounet11/ship-standard/blob/main/CHANGELOG.md)。
