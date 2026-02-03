# タスク: MCP (gemini-mcp-tool) の Windows 実行を検証して修正

## 目的
Windows 11 環境で MCP サーバー (gemini-mcp-tool) が `gemini` を起動できない問題 (ENOENT) を解消し、`ask-gemini` が成功することを確認する。

## 要件
- [ ] `node scripts/mcp-stdio-probe.js` を `MCP_PROBE_ASK=1` 付きで実行し、現状の失敗ログを取得
- [ ] `where gemini` / `where gemini.cmd` で実体パスを確認し、PATH の不足が原因かを切り分ける
- [ ] 下記いずれかの方法で修正を実装し、`ask-gemini` が成功することを確認
  - A. MCP サーバー起動時に PATH に `npm bin -g` (例: `%APPDATA%\npm`) を追加して `spawn gemini ENOENT` を解消
  - B. `gemini-mcp-tool` の実装を Windows で `gemini.cmd`/`shell:true` を使うように修正（必要なら patch-package などでローカル適用）
  - C. このリポジトリ側で最小 MCP サーバーを実装して `gemini` を呼び出す
- [ ] 修正後に `scripts/mcp-stdio-probe.js` で `tools/call ask-gemini` が成功することを確認
- [ ] CHANGELOG.md に結果と課題を追記

## 実装ファイル
- `scripts/mcp-stdio-probe.js`（必要に応じて更新）
- 追加する場合: `scripts/<new-wrapper>.js` / `src/main/<new-mcp-server>.js`
- 変更した場合: `CHANGELOG.md`

## 結果の出力先
`results/20260203-1708-mcp-gemini-windows-result.md`

## 参考資料
- `scripts/mcp-stdio-probe.js`
- `CHANGELOG.md` の最新追記
- AGENTS.md の「変更履歴の記録」

## 期限
2026年02月04日まで

## 重要事項
- 必ず results/ に結果を出力
- 実装後は `git add`, `git commit`, `git push`
- CHANGELOG.md を更新すること
