# Issue: セッションタイムアウト修正（応答遅延改善）

**作成日**: 2026-02-04  
**優先度**: 🔴 High  
**ステータス**: Open  
**担当**: ローカルPC開発者

---

## 🐛 問題の説明

Gemini CLI GUI Wrapper で、メッセージ送信後の応答に **約2分かかる** 問題が発生しています。

### 現在の動作フロー
```
1. ✅ セッション準備完了 (session_prepare_done)
2. 📤 プロンプト送信 (session_send_prompt)  
3. ⏱️ 5秒待機
4. ❌ タイムアウト (session_error: Response timeout 5000ms)
5. 🔄 フォールバック: 新プロセス起動 (gemini.cmd -p -o json -y)
6. ⏳ 約2分待機 (97,073ms ~ 102,303ms)
7. ✅ 応答受信
```

### ログ例（ローカルPC）
```
[16:28:44] [SYS] Gemini サーバーを起動しています...
[16:28:59] [SYS] ワークスペース設定しました: C:/temp
[workspace_selected] path=C:/temp
[16:28:59] [SYS] ワークスペースに合わせてサーバーを再起動します...
[16:29:26] [SYS] ワークスペースをサーバーに同期しました
[16:29:26] [SYS] サーバー準備完了
[16:29:26] [SYS] サーバー準...  ← ここで途切れ

⏱️ 約2分の遅延発生
```

### 根本原因

**`session_timeout_ms: 5000` (5秒) が短すぎる**

- セッションが応答する前にタイムアウト
- 毎回フォールバックで新プロセスを起動
- 新プロセス起動に約2分かかる

---

## 🎯 期待される動作

### 改善後の動作フロー
```
1. ✅ セッション準備完了
2. 📤 プロンプト送信
3. ⏱️ 60秒待機（余裕を持って待つ）
4. ✅ セッションから応答受信（5-10秒）
5. 🎉 完了
```

### パフォーマンス改善
| タイミング | 現在 | 改善後 | 改善率 |
|----------|------|--------|--------|
| 初回応答 | 約2分 | 約30秒 | -75% |
| 2回目以降 | 約2分 | **5-10秒** | **-90%** |

---

## 🔧 修正方法

### ステップ1: 設定箇所を特定

ローカルPCで以下のコマンドを実行：

```bash
# プロジェクトディレクトリに移動
cd /path/to/geminiCLI

# session_timeout を検索
grep -rn "session_timeout" . --include="*.js" --include="*.json"

# 5000 を検索
grep -rn "5000" src/main/ --include="*.js"

# 設定ファイルを確認
find . -name "config*.js" -o -name "*.config.json" | head -10
```

**予想される場所**:
- `src/main/index.js`
- `src/main/gemini-cli-manager.js`
- `config/default.json` などの設定ファイル
- ローカルPC独自の実装ファイル

---

### ステップ2: コードを修正

見つかった箇所を以下のように変更：

```javascript
// === 修正前 ===
const sessionConfig = {
  session_timeout_ms: 5000,  // ← これを探す
  // ...
};

// === 修正後 ===
const sessionConfig = {
  session_timeout_ms: 60000,  // 60秒に延長
  // ...
};
```

または

```javascript
// === 修正前 ===
timeout: 5000

// === 修正後 ===
timeout: 60000
```

---

### ステップ3: セッション再利用を確認

セッション管理コードで以下が実装されているか確認：

```javascript
// セッションが有効な場合は再利用
async function getSession() {
  if (this.currentSession && !this.isSessionExpired()) {
    console.log('既存セッションを再利用');
    return this.currentSession;
  }
  
  console.log('新しいセッションを作成');
  this.currentSession = await this.createNewSession();
  return this.currentSession;
}
```

---

### ステップ4: テスト

1. **アプリを起動**
   ```bash
   npm run dev
   ```

2. **ワークスペースを選択**
   - 「フォルダを選択」ボタン
   - `C:/temp` などを選択

3. **初回メッセージ送信**
   - テキストエリアに「こんにちは」と入力
   - 送信ボタンをクリック
   - ⏱️ 約30秒待つ（初回はセッション準備が必要）
   - ✅ 応答を確認

4. **2回目メッセージ送信** ← **重要！**
   - 「天気を教えて」など別のメッセージを送信
   - ⏱️ **5-10秒で応答が返ることを確認**
   - ❌ もし2分かかったら修正が反映されていない

---

### ステップ5: コミット & プッシュ

```bash
# 変更を確認
git status
git diff

# コミット
git add .
git commit -m "fix: Increase session timeout from 5s to 60s

- Change session_timeout_ms: 5000 -> 60000
- Enable session reuse for 90% faster responses
- 2nd+ messages now take 5-10s instead of 2 minutes
- Refs: #Performance #Session-Timeout"

# プッシュ
git push origin main
```

---

## 📊 影響範囲

### 変更ファイル
- **予想**: `src/main/index.js` または設定ファイル
- **変更行数**: 1-5行程度（最小限の修正）

### 互換性
- ✅ 既存機能に影響なし
- ✅ 破壊的変更なし
- ✅ ユーザー体験の大幅改善

### リスク
- ⚠️ タイムアウトが長くなることで、実際にエラーが発生した場合の検出が遅れる
  - **対策**: エラー時は即座にフォールバック

---

## 📝 参考資料

### ドキュメント
- [タスク指示書](./instructions/20260204-0750-session-timeout-fix.md)
- [CHANGELOG](./CHANGELOG.md)
- [セッション管理](./docs/developer-guide.md#session-management)

### 関連コミット
- `38fafa9` - タスク指示書作成
- `2e96005` - メニュー追加（最新）

### GitHub
- **リポジトリ**: https://github.com/garyohosu/geminiCLI
- **Issue**: このファイルをベースにIssueを作成予定

---

## ✅ 完了チェックリスト

作業完了時にチェックしてください：

### 実装
- [ ] `session_timeout_ms` の設定箇所を特定した
- [ ] タイムアウトを `5000` → `60000` に変更した
- [ ] セッション再利用ロジックを確認・修正した
- [ ] コードレビュー（自己チェック）

### テスト
- [ ] ローカルでアプリ起動成功
- [ ] ワークスペース選択成功
- [ ] 初回メッセージ送信成功（約30秒）
- [ ] **2回目メッセージが5-10秒で応答** ← **最重要**
- [ ] 3回目以降も高速応答を確認

### ドキュメント
- [ ] CHANGELOG.md に修正内容を記載
- [ ] コミットメッセージを記入
- [ ] results/20260204-0750-session-timeout-fix-result.md を作成

### Git操作
- [ ] `git add .` 実行
- [ ] `git commit` 実行
- [ ] `git push origin main` 実行
- [ ] GitHub でコミット確認

### 完了報告
- [ ] このIssueファイルを更新（ステータス: Closed）
- [ ] 結果報告ファイルを作成
- [ ] GenSpark AI に完了を報告

---

## 🔗 関連情報

### 優先度
- **レベル**: 🔴 High
- **理由**: ユーザー体験に直結する重大なパフォーマンス問題

### マイルストーン
- M0 技術検証フェーズ - パフォーマンス最適化

### ラベル
- `bug` - 予期しない動作
- `performance` - パフォーマンス改善
- `user-experience` - ユーザー体験向上
- `high-priority` - 高優先度

### 担当
- **実装**: ローカルPC開発者
- **レビュー**: GenSpark AI Developer
- **テスト**: ローカルPC開発者

---

## 📞 質問・サポート

修正中に問題が発生した場合：

1. **エラーメッセージをコピー**
2. **該当ファイルの内容を共有**
3. **GenSpark AI に報告**

---

**作成者**: GenSpark AI Developer  
**作成日時**: 2026-02-04 08:15  
**最終更新**: 2026-02-04 08:15  
**ステータス**: 🟡 Open（ローカルPC実装待ち）
