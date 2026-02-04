# 🐛 Gemini CLI 常駐型セッション改善タスク

**作成日時**: 2026-02-04 07:50  
**問題**: Gemini CLI の応答が毎回2分かかる  
**原因**: セッションタイムアウト(5秒)が短すぎて、毎回フォールバックで新プロセス起動

---

## 📊 問題分析

### 現在の動作フロー
```
1. セッション準備 (session_prepare_done) - 成功
2. プロンプト送信 (session_send_prompt)
3. ⏱️ 5秒待機
4. ❌ タイムアウト (session_error: Response timeout 5000ms)
5. 🔄 フォールバック: 新しいプロセスを起動 (gemini.cmd -p -o json -y)
6. ⏳ 約2分待機 (97,073ms ~ 102,303ms)
7. ✅ 応答受信
```

### 問題点
1. **セッションタイムアウトが5秒**と短すぎる
2. **常駐セッションが機能していない**
   - 毎回タイムアウトして新プロセス起動
   - 2分の待機時間が発生
3. **セッションの応答を待てていない**
   - Gemini CLIが準備できていても応答を受け取れない

---

## 🎯 改善方針

### 方針1: セッションタイムアウトを延長 (推奨)
```javascript
// 現在: 5000ms (5秒)
session_timeout_ms: 5000

// 改善: 30000ms (30秒) または 60000ms (60秒)
session_timeout_ms: 60000
```

**メリット**:
- 簡単な修正
- セッションが正常に動作する可能性が高い
- 2分の待機時間を削減

**デメリット**:
- 初回応答時のタイムアウトが長くなる

### 方針2: セッション管理を改善
1. **セッション起動時のヘルスチェック**
   - 起動後に簡単なプロンプトで動作確認
   - 準備完了を確実に検知

2. **プロンプト送信後の応答待機**
   - ストリーミング応答に対応
   - チャンク単位で受信

3. **セッションの再利用**
   - 一度起動したセッションを維持
   - 複数リクエストで同じセッションを使用

### 方針3: ハイブリッドアプローチ
1. **初回**: フォールバック(新プロセス)を使用
2. **2回目以降**: セッションを再利用
3. **タイムアウト**: 30秒に延長

---

## 🔧 実装方針 (推奨: 方針1 + 方針3)

### Step 1: セッションタイムアウトを延長

**ファイル**: おそらく `src/main/index.js` または設定ファイル

```javascript
// 修正前
const SESSION_TIMEOUT_MS = 5000;

// 修正後
const SESSION_TIMEOUT_MS = 60000; // 60秒
```

### Step 2: セッション再利用の確認

セッションが終了せずに保持されているか確認:

```javascript
// セッションの状態管理
let interactiveSession = null;
let sessionReady = false;

// セッション起動
async function ensureSession() {
  if (interactiveSession && sessionReady) {
    return interactiveSession; // 既存セッションを再利用
  }
  
  // 新しいセッションを起動
  interactiveSession = await startInteractiveSession();
  sessionReady = true;
  return interactiveSession;
}
```

### Step 3: セッションヘルスチェック (オプション)

```javascript
async function checkSessionHealth() {
  try {
    const response = await sendToSession('echo test', { timeout: 10000 });
    return response !== null;
  } catch (err) {
    return false;
  }
}
```

---

## 📝 修正が必要なファイル (推測)

### 1. `src/main/index.js`
```javascript
// セッションタイムアウトの設定箇所を探す
session_timeout_ms: 5000  →  session_timeout_ms: 60000

// または
const SESSION_TIMEOUT = 5000  →  const SESSION_TIMEOUT = 60000
```

### 2. 環境変数での設定
```javascript
// .env ファイルまたは環境変数
GEMINI_SESSION_TIMEOUT_MS=60000
```

---

## 🧪 検証方法

### 修正後のテスト手順

1. **アプリ起動**
   ```bash
   npm run dev
   ```

2. **ワークスペース選択**
   - `C:/temp` などを選択

3. **1回目のプロンプト送信**
   - 「こんにちは」
   - ⏱️ 応答時間を計測 (初回は2分かかる可能性あり)

4. **2回目のプロンプト送信**
   - 「フォルダの一覧を見せて」
   - ⏱️ 応答時間を計測 (**5~10秒以内を目標**)

5. **ログ確認**
   ```
   [期待されるログ]
   - session_prepare_done: pid=XXXXX ready=true
   - session_send_prompt
   - (タイムアウトなし)
   - session_response_received (NEW!)
   - response_sent: status=200
   ```

### 成功の基準
- ✅ 2回目以降の応答が **10秒以内**
- ✅ `session_error` が発生しない
- ✅ `fallback_subprocess_start` が実行されない
- ✅ セッションが再利用される

---

## 📋 実装手順 (ローカルPCで実施)

### 1. コードを確認
```bash
cd /path/to/geminiCLI
git pull origin main

# セッションタイムアウトの設定箇所を検索
grep -rn "5000\|session_timeout" src/main/
```

### 2. タイムアウトを修正
```javascript
// src/main/index.js (推測)
- const SESSION_TIMEOUT_MS = 5000;
+ const SESSION_TIMEOUT_MS = 60000; // 60秒に延長
```

### 3. テスト
```bash
npm run dev
# 上記の検証方法を実施
```

### 4. コミット&プッシュ
```bash
git add src/main/index.js
git commit -m "fix: Increase session timeout from 5s to 60s for stable session reuse

Problem: Session timeout (5000ms) was too short, causing every request 
to fall back to new process spawn (~2min response time).

Solution: Increase session_timeout_ms to 60000ms (60 seconds).

Expected result:
- First request: ~2min (session initialization)
- Subsequent requests: ~5-10s (session reuse)
- No more session_error timeouts

Refs: #Performance #Session-Management"
git push origin main
```

---

## 📊 期待される改善効果

| 項目 | 修正前 | 修正後 |
|------|--------|--------|
| **初回応答時間** | 2分 | 2分 (変わらず) |
| **2回目以降** | 2分 | **5~10秒** |
| **セッション再利用** | ❌ 不可 | ✅ 可能 |
| **タイムアウト** | 毎回発生 | ✅ 発生しない |

### ユーザー体験の改善
- ✅ 会話が **スムーズ** に
- ✅ 待ち時間が **90%短縮**
- ✅ 常駐型セッションの **本来の性能** を発揮

---

## 🔄 代替案 (タイムアウト延長で解決しない場合)

### セッション起動方法の変更

**現在**: `gemini` (対話モード)
**代替**: `gemini server` (サーバーモード)

サーバーモードを使用すると:
- HTTP/JSONでの通信
- より安定したセッション管理
- タイムアウトの柔軟な設定

```javascript
// サーバーモード起動
spawn('gemini', ['server', '--port', '9876'], { ... });

// HTTP経由でリクエスト
fetch('http://localhost:9876/prompt', {
  method: 'POST',
  body: JSON.stringify({ prompt: '...' })
});
```

---

## 📝 結果報告先

`results/20260204-0750-session-timeout-fix-result.md`

---

**作成者**: GenSpark AI Developer  
**作成日時**: 2026-02-04 07:50  
**優先度**: 🔴 高 (ユーザー体験に直結)
