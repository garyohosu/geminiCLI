---
name: セッションタイムアウト修正
about: Gemini CLI の応答遅延（約2分）を改善する
title: '[Performance] セッションタイムアウトを5秒→60秒に延長'
labels: 'bug, performance, high-priority'
assignees: ''
---

## 🐛 問題の説明

Gemini CLI GUI Wrapper で、メッセージ送信後の応答に **約2分かかる** 問題が発生しています。

### 現在の動作
```
1. ✅ セッション準備完了 (session_prepare_done)
2. 📤 プロンプト送信 (session_send_prompt)
3. ⏱️ 5秒待機
4. ❌ タイムアウト (session_error: Response timeout 5000ms)
5. 🔄 フォールバック: 新プロセス起動
6. ⏳ 約2分待機 (97,073ms ~ 102,303ms)
7. ✅ 応答受信
```

### 根本原因
`session_timeout_ms: 5000` (5秒) が短すぎて、セッションが正常に動作する前にタイムアウトし、毎回新しいプロセスを起動している。

---

## 🎯 期待される動作

- 初回メッセージ: 約30秒（セッション準備）
- 2回目以降: **5-10秒**（セッション再利用）
- 改善率: **約90%の高速化**

---

## 🔧 修正方法

### 手順1: 設定箇所を特定

ローカルPCで以下のコマンドを実行し、`session_timeout_ms: 5000` の記述箇所を特定：

```bash
# session_timeout を検索
grep -r "session_timeout" . --include="*.js" --include="*.json"

# 5000 を検索（src/main 配下）
grep -r "5000" src/main/

# 設定ファイルを確認
ls -la *.json *.config.js config/ 2>/dev/null
```

### 手順2: タイムアウトを延長

見つかった箇所を以下のように修正：

```javascript
// 修正前
session_timeout_ms: 5000

// 修正後
session_timeout_ms: 60000  // 60秒
```

### 手順3: セッション再利用を有効化

セッション管理コードで、以下を確認：

```javascript
// セッションが存在する場合は再利用
if (existingSession && !sessionExpired) {
  return existingSession;
}
```

### 手順4: コミット & プッシュ

```bash
git add .
git commit -m "fix: Increase session timeout from 5s to 60s for performance"
git push origin main
```

---

## 📊 影響範囲

- **ファイル**: `src/main/index.js` または `src/main/gemini-cli-manager.js` または設定ファイル
- **変更行数**: 1-5行程度
- **テスト**: 
  1. アプリ起動
  2. ワークスペース選択（C:/temp など）
  3. メッセージ送信（初回：約30秒）
  4. 再度メッセージ送信（2回目：5-10秒を確認）

---

## 📝 参考資料

- タスク指示書: [instructions/20260204-0750-session-timeout-fix.md](../instructions/20260204-0750-session-timeout-fix.md)
- CHANGELOG: [CHANGELOG.md](../CHANGELOG.md)

---

## ✅ チェックリスト

- [ ] `session_timeout_ms` の設定箇所を特定
- [ ] タイムアウトを 5000→60000 に変更
- [ ] セッション再利用ロジックを確認
- [ ] ローカルでテスト（2回目以降の応答が5-10秒になることを確認）
- [ ] コミット & プッシュ
- [ ] CHANGELOG.md 更新
- [ ] 本Issueをクローズ

---

## 🔗 関連

- 優先度: **High** 🔴
- マイルストーン: M0 技術検証フェーズ
- ラベル: `bug`, `performance`, `user-experience`
