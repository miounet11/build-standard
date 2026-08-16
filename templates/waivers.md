# 门禁豁免单

过不了的门禁写在这里，**不要静默绕过**。静默绕过会让所有绿灯失去信号。

规则（见 [SCHEME.md](https://github.com/miounet11/build-standard/blob/main/SCHEME.md) §6）：

- 门禁 id 引用 [ship-standard/gates.json](https://github.com/miounet11/ship-standard/blob/main/gates.json)
- **到期日必填**，最长一个发布周期
- 过期的豁免 = 门禁失败，发布脚本必须拦
- 同一 id 连续豁免两次 → 改产品或改门禁，不许第三次
- 密钥类与生产守卫类门禁（如 `LAUNCH-5`、`PRESHIP-4`）**不可豁免**

| 门禁 id | 原因（事实） | 补偿动作 | 到期日 | owner | 第几次 |
|---------|--------------|----------|--------|-------|--------|
| PATH-6 | 尚未做满一个业务周期长测 | 对外材料标「仅冒烟、未长测」；只发内测通道 | 2026-09-01 | — | 1 |

## 关闭一条豁免

在表里删行之前，先确认门禁真的绿了，并在 `product/risks.md` 里留一行说明当时的缺口怎么补上的。
