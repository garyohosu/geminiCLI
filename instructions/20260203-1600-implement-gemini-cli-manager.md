# タスク: Gemini CLI統合モジュールの実装

## 目的
Gemini CLIを子プロセスとして起動・管理し、stdin/stdoutで通信する機能を実装する。

## 要件
- [ ] `GeminiCLIManager` クラスを作成
- [ ] `spawn()` でGemini CLIを起動
- [ ] 標準出力をストリーミングで取得
- [ ] 標準入力にメッセージを送信
- [ ] プロセスの終了・再起動機能
- [ ] エラーハンドリング
- [ ] 単体テストを追加

## 実装ファイル
- `src/main/gemini-cli-manager.js` (新規作成)
- `tests/unit/gemini-cli-manager.test.js` (新規作成)

## 結果の出力先
**重要: 必ずこのファイルに結果を出力してください**
```
results/20260203-1600-implement-gemini-cli-manager-result.md
```

## 制約条件
- ワークスペースパスを起動時に渡す
- 認証済みのGemini CLIを前提とする（認証フローは後回し）
- タイムアウト処理は次のフェーズで実装

## 参考資料
- [spec.md](../spec.md) のセクション8「Gemini CLI 連携仕様」
- [AGENTS.md](../AGENTS.md) の「開発フロー」

## テストケース
- Gemini CLIの起動・停止
- メッセージの送受信
- エラー時の挙動
- プロセスクラッシュ時の再起動

## Windows 11 環境での動作確認（必須）
- [ ] Windows 11環境でGemini CLIが起動できるか
- [ ] 子プロセス（spawn）が正常に動作するか
- [ ] パス処理（バックスラッシュ）が正しいか
- [ ] 日本語のワークスペースパスが扱えるか

## 期限
2026年2月5日まで

## 重要事項
- ✅ 必ず results/ フォルダに結果を出力すること
- ✅ 実装後は必ず `git add .`, `git commit`, `git push` すること
- ✅ CHANGELOG.md を更新すること
- ✅ すべてのテストが合格することを確認すること

## 成功条件
- すべてのテストが合格
- CHANGELOG.md に記録
- results/ に結果ファイルが生成されている
- GitHubにpush済み

## 備考
まずは基本的な起動・通信機能を実装し、後から機能を追加していく方針で進めてください。

---
**GenSpark AIエージェントより:**
実装完了後、results/フォルダの結果ファイルを確認します。
質問や不明点があれば、結果ファイルに記載してください。
