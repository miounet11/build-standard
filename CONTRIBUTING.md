# 怎么改这个标准

## 加一条创建实践

1. 复制 [practices/_template.md](./practices/_template.md) 为 `practices/<id>.md`。
2. 在 [catalog.json](./catalog.json)、根 [README.md](./README.md)、[practices/README.md](./practices/README.md) 各加一行。
   三处不一致 `npm run verify` 会红（`LIST-DRIFT`）—— 这条规则本仓自己也守。
3. 产品故事放 [examples/](./examples/)，不要把密钥、账号、内网写进实践正文。
4. 不复制 [ship-standard](https://github.com/miounet11/ship-standard) 已有的验收门禁，也不写 [creativity-is-engineering](https://github.com/miounet11/creativity-is-engineering) 的护城河。这里只写「怎么做出来」。
5. 不要为本仓发明 `BUILD-*` 门禁 id。

## 加一条铁律

先回答：**它堵 §1 里的哪个泄漏。** 答不上来就不加 —— 自检会拒绝没有 `（n）` 标注的规则，
也会拒绝引用不存在的泄漏编号。

如果它堵的是一个 §1 还没写下的泄漏，那就先加泄漏，并说明这个泄漏在哪个真实故障里出现过。
六个泄漏不是分类学，是复盘归纳；加第七个要有病例。

如果它其实是一条验收判定（「发版前必须 X」），它属于 ship-standard 的门禁，不属于这里。

## 改门禁 id

不在这里改。id 的权威是 ship-standard 的 `gates.json`。
上游改完，在本仓跑 `npm run pin` 刷新 [checks/gates.pinned.json](./checks/gates.pinned.json)，
本仓引用了不存在的 id 会红。

收紧一条已公布 id 的判定 = 加新 id，旧的标 deprecated。不要原地改含义。

## 改模板脚本

`templates/quality-gate.mjs` 和 `templates/render-status.mjs` 有 fixture 测试：
[checks/fixtures/](./checks/fixtures/)（green / red / waived）。

改判定就要改或加 fixture。**先让 fixture 红**，再改脚本 —— 这一页自己也走七步。
`npm run test:gate` 单独跑，`npm run verify` 会带上。

## 提交前

```bash
npm run verify
```

不要提交 `.env`、安装包、真实账号。
