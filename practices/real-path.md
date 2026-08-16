# 真路径上创建

在 `dev` 里把主路径点绿，只证明作者知道怎么点。程序是在**用户会安装、会登录、会走的那条路径**上创建出来的。

验收细节见 [ship-standard / acceptance-path](https://github.com/miounet11/ship-standard/blob/main/dimensions/acceptance-path.md) 与 [launch](https://github.com/miounet11/ship-standard/blob/main/dimensions/launch.md)。这里写创建时必须守的习惯。

---

## 一句话

**创建用的包、版本、拓扑、账号关系，必须和用户会碰到的一致。用户没装到的修复，等于没创建出来。**

---

## 创建时的硬规则

1. **同号。** 双端 / 多端产品，创建和联调都用同一 version。一端新码一端旧包，修的是假世界。
2. **正式路径。** 签名、CSP、origin、API base 与 dev 不同，至少有一轮用正式包创建/验收。
3. **真拓扑。** 不在反模式环境里当主路径。验收句是 ship `PATH-7`，这里只要求创建时就走用户会走的那条。
4. **先主路径后功能。** 登录 → 主任务 → 退出 → 再进，没走通就不加旁边的能力。
5. **分发是创建的最后一厘米。** 构建成功但没进用户通道，这版对用户不存在。

---

## 和本机开发的关系

本机 `dev` 用来红灯变绿。变绿之后，创建还没结束：还要把同一行为放到正式路径上再走一遍。两段都要有，顺序不能反。

---

## 禁止

- 只在 A 平台的 dev 里创建 B 平台行为
- 用反模式拓扑上的「成功」当作创建完成
- 文档写已修，安装通道还停在旧包

---

## 接到评测与审查

用户会碰到的 AI 通道（GUI / CLI / agent / TUI / IDE / 办公）用 [ability-harness](https://github.com/miounet11/ability-harness) 同一套 broken seed，只换 `--model --channel --harness`。版本迭代、升级、修 bug 用 [review-harness](https://github.com/miounet11/review-harness)：威胁模型 → 扫描 → 分诊 → 补丁验证梯。

创建未在真路径上跑过该跑的尺子，这版对用户仍不存在。**算不算通过**仍是 ship `PATH-7` / `LAUNCH-*`，本页不另写门禁。

## 产出

同版本正式包记录、主路径勾选、用户通道版本号。
