# 落地：老仓库怎么接进来

新项目照 [SCHEME.md](./SCHEME.md) §7 建就行。这一页给**已经跑了很久、文档互相打架**的仓库。

原则：**先止血，再补灯，最后才动业务。** 不要一次全绿，不要为了合规重写产品。

---

## 第一小时：止血（只动文档）

目标：让下一会话不再读到过期结论。

1. **建权威表。** 抄 [templates/product-README.md](./templates/product-README.md) 到 `product/README.md`，每类问题只填一份现行文件。填不出就说明有两份在打架 —— 现在选一份。
2. **降级其余总纲。** 未进表却自称 SoT 的文件，文首加一行：
   `服从 product/README.md · 角色：历史 | 子集 | 操作备忘`
3. **处理「当前唯一版本」类文件名。** 带旧版本号却叫「最新」的操作手册，改名进 `docs/archive/`，只留一份不带版本号的现行入口。
4. **声明成熟度级别和升级到期日。** 老仓库诚实写 L0，不要写 L3。**到期日必填** —— 没有时钟的级别是永久免罪符，门禁会拒。

停止条件：这一小时不改任何业务代码，不删任何历史内容（只移动和标注）。

---

## 第一天：接灯

抄这七个文件，一个都别省 —— 少一个，门禁会告诉你少了哪个：

```bash
# 在产品仓根目录
mkdir -p product/spec scripts .github
cp .../templates/product-README.md  product/README.md
cp .../templates/roadmap.md         product/roadmap.md
cp .../templates/risks.md           product/risks.md
cp .../templates/waivers.md         product/waivers.md
cp .../templates/quality-gates.md   product/quality-gates.md
cp .../templates/render-status.mjs  scripts/render-status.mjs
cp .../templates/quality-gate.mjs   scripts/quality-gate.mjs

node scripts/render-status.mjs && node scripts/quality-gate.mjs
```

再补两样模板里没有的：`product/spec/` 下至少一份不变量，和 `.github/pull_request_template.md`
（含七步，否则 `PROBE-1` 红）。

然后：

1. **填风险册。** 把散落在各计划文件里的缺口收进 `product/risks.md`，按用户视角定级。**关闭不删行。**
2. **填豁免单。** 当前过不了但必须发的门禁写上，带到期日和 owner。这一步把「静默绕过」变成「有账可查」。
3. **删掉第二份进度。** 手写的 CURRENT-STATUS / 升级计划里的百分比表格删掉，改成链接到 STATUS。
4. 接 `npm run status` 和 `npm run gate` 两条 script，CI 里加一行 `git diff --exit-code STATUS.md`。

### 第一次跑一定是红的，这是对的

红在哪，就是你现在的真实状态。典型的第一次输出：

```
quality gate — /path/to/repo
  · level: L0 · promote by 2026-12-31
  · open S1: 3
  warn  COMPOUND-5: 3 open S1 — official release blocked [above L0]
  FAIL  DOC-5: living doc claims to be the moving latest -> docs/联调-最新版-操作步骤.md
  FAIL  PROBE-1: no PR template — the seven steps have nowhere to show up

  not machine-checked at L0 (verify by hand):
    DIAG-1 — 分层与每层证据是产品知识，脚本判不了

channel: beta
2 blocking problem(s) at L0.
```

读法：`[above L0]` 是本级之上的门禁，只提示不阻断（打开的 S1 在 L0 不拦你，到 L3 才拦）。
`not machine-checked` 是脚本**承认自己判不了**的部分 —— 绿灯不代表全覆盖。

**不要为了变绿删掉 `product/risks.md`。** 删风险册本身就是 `DOC-3` 失败，比诚实填写更红。

停止条件：`node scripts/quality-gate.mjs` 能跑出结果，且你能对每一条红灯说出「知道，排在第几」。

---

## 第一周：病例归档

1. 现行规格里给不变量编号（`K1…` / `S-1…`）。
2. 每篇病例（BUGFIX / 事故复盘）在文首写它并入了哪个编号。
3. 编号进规格且有测试之后，病例移到 `docs/archive/<年>/`，标 `archived`。
4. 版本化的操作手册只留一份现行；旧的进归档。

停止条件：新人在现行目录里找不到会误导他的旧手册。

---

## 之后：按级升门禁

对照 [SCHEME.md](./SCHEME.md) §4。本级门禁**连续两轮全绿**再升下一级；升级只需改
`product/README.md` 里的一行，阻断范围会自动跟着 `stage` 变。

到了升级到期日还没升，门禁会红。这不是催促，是防止 L0 变成永久免罪符。

---

## 常见卡点

| 卡点 | 处理 |
|------|------|
| 「两份文件都还在用」 | 选一份为现行，另一份标子集并写清它只回答哪个更窄的问题 |
| 「历史病例太多，不知道哪些还算数」 | 不逐篇判断。先建编号表，只把**本轮碰到的**病例并进去，其余整批归档 |
| 「门禁一开全红」 | 先确认级别声明对不对。L0 只阻断 `see` 阶段的门禁；如果 release 阶段的也在红，多半是级别写高了 |
| 「时间不够做不到」 | 写豁免单 + 到期日 + owner，这是合法的；静默跳过不是。注意豁免只把门禁降为 warn 并把通道压到 beta，不会变绿 |
| 「Agent 又按旧文档改了」 | 权威表没建好或身份文件还写着进度。修文档，不要只提醒模型 |
| 「文档里有现场账号」 | 改成 `.env.*.example` 引用；仓库正文不留凭据。这条不可豁免 |
| 「本地的私人笔记被扫成泄露」 | 门禁会跳过 `git check-ignore` 命中的文件。真被报了，说明那个文件其实被追踪着 |
| 「不是 Node 项目」 | 两个脚本是零依赖单文件，`node scripts/xxx.mjs` 就能跑；不想装 Node 就照着判定自己实现，门禁 id 不变 |

---

## 落地是否成功，看三句

1. 不打开作者的聊天记录，能回答「下一步做什么」和「现在坏在哪」。
2. 过不了的门禁有豁免单和到期日，而不是没人提。
3. 现行目录里没有会误导下一个人的旧手册。

三句都成立，这套就已经在替你挡事故了。
