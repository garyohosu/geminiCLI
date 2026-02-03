# タスク: 基本 Electron アプリケーションの実装

## 📋 タスク概要

Gemini CLI GUI Wrapper の基本的な Electron アプリケーション構造を実装します。これにより、ユーザーがGUIから Gemini CLI を操作できるようになります。

## 🎯 目的

1. Electron のメインプロセスを実装
2. 最小限の Renderer プロセス（UI）を作成
3. Preload スクリプトで安全な IPC 通信を設定
4. ワークスペース選択機能を実装
5. Gemini CLI の出力を表示

## ✅ 前提条件

以下のモジュールが既に実装済み：
- ✅ `PathValidator` - パス検証
- ✅ `FileAPI` - ファイル操作
- ✅ `GeminiCLIManager` - Gemini CLI 管理

## 📝 実装要件

### 1. Main プロセス (`src/main/index.js`)

#### 必須機能
- Electron アプリの初期化
- メインウィンドウの作成と管理
- IPC ハンドラーの設定
- GeminiCLIManager のインスタンス管理

#### 実装すべき IPC ハンドラー
```javascript
// ワークスペース選択
ipcMain.handle('select-workspace', async () => { /* ... */ });

// Gemini CLI 制御
ipcMain.handle('gemini:start', async (event, workspace) => { /* ... */ });
ipcMain.handle('gemini:stop', async () => { /* ... */ });
ipcMain.handle('gemini:send', async (event, message) => { /* ... */ });

// ファイル操作
ipcMain.handle('file:list', async (event, path) => { /* ... */ });
ipcMain.handle('file:read', async (event, path) => { /* ... */ });
```

#### Gemini CLI イベントの転送
```javascript
geminiManager.on('stdout', (data) => {
  mainWindow.webContents.send('gemini:output', { type: 'stdout', data });
});

geminiManager.on('stderr', (data) => {
  mainWindow.webContents.send('gemini:output', { type: 'stderr', data });
});
```

### 2. Preload スクリプト (`src/preload/preload.js`)

#### contextBridge API の公開
```javascript
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // ワークスペース
  selectWorkspace: () => ipcRenderer.invoke('select-workspace'),
  
  // Gemini CLI
  gemini: {
    start: (workspace) => ipcRenderer.invoke('gemini:start', workspace),
    stop: () => ipcRenderer.invoke('gemini:stop'),
    send: (message) => ipcRenderer.invoke('gemini:send', message),
    onOutput: (callback) => ipcRenderer.on('gemini:output', (e, data) => callback(data))
  },
  
  // ファイル操作
  files: {
    list: (path) => ipcRenderer.invoke('file:list', path),
    read: (path) => ipcRenderer.invoke('file:read', path)
  }
});
```

### 3. Renderer プロセス - HTML (`src/renderer/index.html`)

#### 必須UI要素
```html
<!DOCTYPE html>
<html>
<head>
  <title>Gemini CLI GUI Wrapper</title>
  <meta charset="UTF-8">
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div id="app">
    <!-- ワークスペース選択 -->
    <div id="workspace-section">
      <h2>ワークスペース選択</h2>
      <button id="select-workspace-btn">フォルダを選択</button>
      <div id="workspace-path"></div>
    </div>

    <!-- Gemini CLI 制御 -->
    <div id="control-section">
      <button id="start-btn" disabled>Gemini CLI 起動</button>
      <button id="stop-btn" disabled>停止</button>
    </div>

    <!-- チャット入力 -->
    <div id="chat-section">
      <textarea id="message-input" placeholder="メッセージを入力..."></textarea>
      <button id="send-btn" disabled>送信</button>
    </div>

    <!-- 出力表示 -->
    <div id="output-section">
      <h3>出力</h3>
      <div id="output-log"></div>
    </div>
  </div>

  <script src="renderer.js"></script>
</body>
</html>
```

### 4. Renderer プロセス - JavaScript (`src/renderer/renderer.js`)

#### 必須機能
```javascript
// DOM要素の取得
const selectWorkspaceBtn = document.getElementById('select-workspace-btn');
const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const sendBtn = document.getElementById('send-btn');
const messageInput = document.getElementById('message-input');
const outputLog = document.getElementById('output-log');
const workspacePath = document.getElementById('workspace-path');

let selectedWorkspace = null;

// ワークスペース選択
selectWorkspaceBtn.addEventListener('click', async () => {
  selectedWorkspace = await window.electronAPI.selectWorkspace();
  if (selectedWorkspace) {
    workspacePath.textContent = selectedWorkspace;
    startBtn.disabled = false;
  }
});

// Gemini CLI 起動
startBtn.addEventListener('click', async () => {
  await window.electronAPI.gemini.start(selectedWorkspace);
  startBtn.disabled = true;
  stopBtn.disabled = false;
  sendBtn.disabled = false;
});

// Gemini CLI 停止
stopBtn.addEventListener('click', async () => {
  await window.electronAPI.gemini.stop();
  startBtn.disabled = false;
  stopBtn.disabled = true;
  sendBtn.disabled = true;
});

// メッセージ送信
sendBtn.addEventListener('click', async () => {
  const message = messageInput.value.trim();
  if (message) {
    await window.electronAPI.gemini.send(message);
    messageInput.value = '';
  }
});

// 出力受信
window.electronAPI.gemini.onOutput((data) => {
  const div = document.createElement('div');
  div.className = `output-${data.type}`;
  div.textContent = data.data;
  outputLog.appendChild(div);
  outputLog.scrollTop = outputLog.scrollHeight;
});
```

### 5. スタイル (`src/renderer/style.css`)

#### 基本スタイル
```css
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  margin: 0;
  padding: 20px;
  background: #f5f5f5;
}

#app {
  max-width: 1200px;
  margin: 0 auto;
}

button {
  padding: 10px 20px;
  margin: 5px;
  border: none;
  border-radius: 4px;
  background: #007bff;
  color: white;
  cursor: pointer;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

#output-log {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 15px;
  border-radius: 4px;
  height: 400px;
  overflow-y: auto;
  font-family: 'Courier New', monospace;
}

.output-stdout {
  color: #4ec9b0;
}

.output-stderr {
  color: #f48771;
}
```

## 🧪 テスト要件

### 手動テスト項目

1. ✅ アプリケーションが起動する
2. ✅ ワークスペース選択ダイアログが表示される
3. ✅ 選択したワークスペースが表示される
4. ✅ Gemini CLI が起動する
5. ✅ メッセージを送信できる
6. ✅ Gemini CLI の出力が表示される
7. ✅ Gemini CLI を停止できる

### 自動テスト（推奨）

- E2E テスト（Playwright / Spectron）
- IPC 通信のモックテスト

## 📊 期待される成果物

### ファイル一覧
```
src/
├── main/
│   └── index.js          (新規作成、~300行)
├── preload/
│   └── preload.js        (新規作成、~50行)
└── renderer/
    ├── index.html        (新規作成、~80行)
    ├── renderer.js       (新規作成、~150行)
    └── style.css         (新規作成、~100行)
```

### package.json の更新

```json
{
  "main": "src/main/index.js",
  "scripts": {
    "start": "electron .",
    "dev": "electron . --dev"
  }
}
```

## 📝 結果の報告

作業完了後、以下のファイルに結果を記録してください：

```
results/20260203-0350-implement-electron-app-result.md
```

### テンプレート

```markdown
# タスク結果: 基本 Electron アプリケーションの実装

## ✅ ステータス: [成功 / 一部成功 / 失敗]

## 📊 実装結果

### 作成したファイル
- `src/main/index.js`: XXX行
- `src/preload/preload.js`: XXX行
- `src/renderer/index.html`: XXX行
- `src/renderer/renderer.js`: XXX行
- `src/renderer/style.css`: XXX行

### 動作確認
- [ ] アプリケーション起動
- [ ] ワークスペース選択
- [ ] Gemini CLI 起動
- [ ] メッセージ送信
- [ ] 出力表示
- [ ] Gemini CLI 停止

### スクリーンショット
（可能であれば、アプリの動作画面を添付）

## ❗ 問題点・課題

（あれば記載）

## ⏱️ 所要時間

約 XX 時間

## 📝 備考

（その他気づいた点があれば記載）
```

## 🔗 参考リンク

- [Electron ドキュメント](https://www.electronjs.org/docs/latest/)
- [IPC 通信ガイド](https://www.electronjs.org/docs/latest/tutorial/ipc)
- [contextBridge](https://www.electronjs.org/docs/latest/api/context-bridge)
- [GeminiCLIManager の使用例](./GEMINI_CLI_MANAGER_COMPLETE.md)

## ⏰ 期限

2週間以内（緊急度: 中）

---

**Note**: この実装により、Gemini CLI GUI Wrapper の基本的な動作が可能になります！ユーザーがGUIからファイル操作を依頼できる最初のバージョンです。
