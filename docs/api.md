# Gemini CLI GUI Wrapper - API ドキュメント

**バージョン**: 1.0.0  
**最終更新**: 2026-02-03

---

## 📖 目次

1. [Preload API](#preload-api)
2. [IPC Handlers](#ipc-handlers)
3. [GeminiCLIManager](#geminiclimanager)
4. [PathValidator](#pathvalidator)
5. [FileAPI](#fileapi)

---

## Preload API

Renderer プロセスから利用できる API（`window.electronAPI` 経由）

### ワークスペース管理

#### `selectWorkspace()`

ワークスペース選択ダイアログを表示します。

**シグネチャ**:
```typescript
selectWorkspace(): Promise<string | null>
```

**戻り値**:
- `string`: 選択されたフォルダパス
- `null`: キャンセルされた場合

**例**:
```javascript
const workspace = await window.electronAPI.selectWorkspace();
if (workspace) {
  console.log('Selected:', workspace);
}
```

---

### Gemini CLI 制御

#### `gemini.start(workspace)`

Gemini CLI を起動します。

**シグネチャ**:
```typescript
gemini.start(workspace: string): Promise<void>
```

**パラメータ**:
- `workspace` (string): ワークスペースパス

**例外**:
- ワークスペースが不正な場合にエラー

**例**:
```javascript
try {
  await window.electronAPI.gemini.start('/path/to/workspace');
  console.log('Gemini CLI started');
} catch (error) {
  console.error('Failed to start:', error);
}
```

#### `gemini.stop()`

Gemini CLI を停止します。

**シグネチャ**:
```typescript
gemini.stop(): Promise<void>
```

**例**:
```javascript
await window.electronAPI.gemini.stop();
console.log('Gemini CLI stopped');
```

#### `gemini.restart()`

Gemini CLI を再起動します。

**シグネチャ**:
```typescript
gemini.restart(): Promise<void>
```

**例**:
```javascript
await window.electronAPI.gemini.restart();
console.log('Gemini CLI restarted');
```

#### `gemini.send(message)`

Gemini CLI にメッセージを送信します。

**シグネチャ**:
```typescript
gemini.send(message: string): Promise<void>
```

**パラメータ**:
- `message` (string): 送信するメッセージ

**例**:
```javascript
await window.electronAPI.gemini.send('list files');
```

#### `gemini.status()`

Gemini CLI の現在の状態を取得します。

**シグネチャ**:
```typescript
gemini.status(): Promise<{ state: string, isRunning: boolean }>
```

**戻り値**:
```typescript
{
  state: 'stopped' | 'starting' | 'running' | 'stopping' | 'error',
  isRunning: boolean
}
```

**例**:
```javascript
const status = await window.electronAPI.gemini.status();
console.log('State:', status.state);
console.log('Is Running:', status.isRunning);
```

#### `gemini.onOutput(callback)`

出力を受信したときのコールバックを登録します。

**シグネチャ**:
```typescript
gemini.onOutput(callback: (data: OutputData) => void): () => void
```

**パラメータ**:
- `callback`: 出力を受信したときに呼ばれる関数

**戻り値**:
- リスナーを解除する関数

**OutputData**:
```typescript
interface OutputData {
  type: 'stdout' | 'stderr' | 'error';
  data: string;
  timestamp: number;
}
```

**例**:
```javascript
const unsubscribe = window.electronAPI.gemini.onOutput((data) => {
  console.log(`[${data.type}]`, data.data);
});

// リスナーを解除
unsubscribe();
```

---

### ファイル操作

#### `files.list(path)`

ディレクトリ内のファイル一覧を取得します。

**シグネチャ**:
```typescript
files.list(path: string): Promise<FileInfo[]>
```

**パラメータ**:
- `path` (string): ディレクトリパス（ワークスペース相対または絶対）

**戻り値**:
```typescript
interface FileInfo {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  mtime: Date;
}
```

**例外**:
- ワークスペース外のパス: `PATH_OUTSIDE_WORKSPACE`
- ディレクトリが存在しない: `ENOENT`

**例**:
```javascript
const files = await window.electronAPI.files.list('src');
files.forEach(file => {
  console.log(file.name, file.isDirectory ? '(dir)' : '');
});
```

#### `files.read(path)`

ファイルの内容を読み込みます。

**シグネチャ**:
```typescript
files.read(path: string): Promise<string>
```

**パラメータ**:
- `path` (string): ファイルパス

**戻り値**:
- ファイルの内容（テキスト）

**例外**:
- ワークスペース外: `PATH_OUTSIDE_WORKSPACE`
- ファイルが存在しない: `ENOENT`

**例**:
```javascript
const content = await window.electronAPI.files.read('README.md');
console.log(content);
```

#### `files.write(path, content, mode)`

ファイルに書き込みます。

**シグネチャ**:
```typescript
files.write(
  path: string,
  content: string,
  mode?: 'overwrite' | 'append'
): Promise<void>
```

**パラメータ**:
- `path` (string): ファイルパス
- `content` (string): 書き込む内容
- `mode` (string, optional): 書き込みモード（デフォルト: `'overwrite'`）

**例**:
```javascript
// 上書き
await window.electronAPI.files.write('test.txt', 'Hello World');

// 追記
await window.electronAPI.files.write('log.txt', 'New line\n', 'append');
```

---

## IPC Handlers

Main プロセスで実装されている IPC ハンドラー（内部 API）

### ワークスペース

#### `select-workspace`

**ハンドラー**: `ipcMain.handle('select-workspace', async () => { ... })`

**処理**:
1. `dialog.showOpenDialog()` でフォルダ選択ダイアログを表示
2. 選択されたパスを返す

### Gemini CLI

#### `gemini:start`

**ハンドラー**: `ipcMain.handle('gemini:start', async (event, workspace) => { ... })`

**処理**:
1. GeminiCLIManager のインスタンスを作成
2. イベントリスナーを設定（stdout, stderr, error など）
3. `geminiManager.start()` を呼び出し

#### `gemini:stop`

**ハンドラー**: `ipcMain.handle('gemini:stop', async () => { ... })`

**処理**:
1. `geminiManager.stop()` を呼び出し
2. イベントリスナーをクリーンアップ

#### `gemini:send`

**ハンドラー**: `ipcMain.handle('gemini:send', async (event, message) => { ... })`

**処理**:
1. `geminiManager.send(message)` を呼び出し

#### `gemini:status`

**ハンドラー**: `ipcMain.handle('gemini:status', async () => { ... })`

**処理**:
1. `geminiManager.getState()` と `geminiManager.isRunning()` を取得
2. ステータス情報を返す

### ファイル操作

#### `file:list`

**ハンドラー**: `ipcMain.handle('file:list', async (event, dirPath) => { ... })`

**処理**:
1. `fileAPI.list(dirPath)` を呼び出し
2. ファイル情報の配列を返す

#### `file:read`

**ハンドラー**: `ipcMain.handle('file:read', async (event, filePath) => { ... })`

**処理**:
1. `fileAPI.readText(filePath)` を呼び出し
2. ファイル内容を返す

#### `file:write`

**ハンドラー**: `ipcMain.handle('file:write', async (event, filePath, content, mode) => { ... })`

**処理**:
1. `fileAPI.writeText(filePath, content, mode)` を呼び出し

---

## GeminiCLIManager

Gemini CLI の子プロセスを管理するクラス。

### コンストラクタ

```typescript
constructor(options: {
  workspace: string;
  cliPath?: string;
  autoRestart?: boolean;
  restartDelay?: number;
  maxRestarts?: number;
})
```

**オプション**:
- `workspace` (required): ワークスペースパス
- `cliPath` (optional): Gemini CLI の実行パス（デフォルト: `'gemini'`）
- `autoRestart` (optional): 自動再起動（デフォルト: `false`）
- `restartDelay` (optional): 再起動までの待機時間（ms）（デフォルト: `1000`）
- `maxRestarts` (optional): 最大再起動回数（デフォルト: `3`）

**例**:
```javascript
const manager = new GeminiCLIManager({
  workspace: '/path/to/workspace',
  autoRestart: true,
  maxRestarts: 5
});
```

### メソッド

#### `async start()`

Gemini CLI を起動します。

**例外**:
- 既に起動中の場合

#### `async stop(force = false)`

Gemini CLI を停止します。

**パラメータ**:
- `force` (boolean): 強制終了するか（デフォルト: `false`）

#### `async restart()`

Gemini CLI を再起動します。

#### `send(message)`

メッセージを送信します。

**パラメータ**:
- `message` (string): 送信するメッセージ

**例外**:
- 起動していない場合

#### `getState()`

現在の状態を取得します。

**戻り値**:
- `'stopped'` | `'starting'` | `'running'` | `'stopping'` | `'error'`

#### `isRunning()`

実行中かどうかを取得します。

**戻り値**:
- `boolean`

### イベント

GeminiCLIManager は `EventEmitter` を継承しています。

#### `started`

起動完了時に発火。

```javascript
manager.on('started', () => {
  console.log('Started');
});
```

#### `stopped`

停止時に発火。

```javascript
manager.on('stopped', () => {
  console.log('Stopped');
});
```

#### `stdout`

標準出力を受信したときに発火。

```javascript
manager.on('stdout', (data) => {
  console.log('Output:', data);
});
```

#### `stderr`

標準エラーを受信したときに発火。

```javascript
manager.on('stderr', (data) => {
  console.error('Error:', data);
});
```

#### `error`

エラー発生時に発火。

```javascript
manager.on('error', (error) => {
  console.error('Error:', error);
});
```

#### `close`

プロセス終了時に発火。

```javascript
manager.on('close', (code, signal) => {
  console.log(`Closed with code ${code}`);
});
```

---

## PathValidator

パス検証とセキュリティを担当するクラス。

### コンストラクタ

```typescript
constructor(workspace: string)
```

**パラメータ**:
- `workspace` (string): ワークスペースパス

### メソッド

#### `validate(targetPath)`

パスを検証します。

**パラメータ**:
- `targetPath` (string): 検証対象のパス

**戻り値**:
- 検証済みの絶対パス

**例外**:
- `PATH_OUTSIDE_WORKSPACE`: ワークスペース外のパス
- `INVALID_PATH`: 不正なパス

**例**:
```javascript
const validator = new PathValidator('/path/to/workspace');

// 正常
const safePath = validator.validate('subfolder/file.txt');

// エラー
validator.validate('../../../etc/passwd'); // throws
```

---

## FileAPI

安全なファイル操作を提供するクラス。

### コンストラクタ

```typescript
constructor(workspace: string)
```

**パラメータ**:
- `workspace` (string): ワークスペースパス

### メソッド

#### `async list(dirPath)`

ファイル一覧を取得します。

**パラメータ**:
- `dirPath` (string): ディレクトリパス

**戻り値**:
```typescript
Array<{
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  mtime: Date;
}>
```

#### `async readText(filePath, encoding = 'utf8')`

テキストファイルを読み込みます。

**パラメータ**:
- `filePath` (string): ファイルパス
- `encoding` (string, optional): エンコーディング

**戻り値**:
- ファイルの内容

#### `async writeText(filePath, content, mode = 'overwrite')`

テキストファイルに書き込みます。

**パラメータ**:
- `filePath` (string): ファイルパス
- `content` (string): 書き込む内容
- `mode` ('overwrite' | 'append'): 書き込みモード

#### `async mkdir(dirPath, recursive = true)`

ディレクトリを作成します。

**パラメータ**:
- `dirPath` (string): ディレクトリパス
- `recursive` (boolean): 再帰的に作成するか

#### `async move(srcPath, destPath)`

ファイル/ディレクトリを移動します。

#### `async copy(srcPath, destPath, recursive = true)`

ファイル/ディレクトリをコピーします。

#### `async delete(targetPath, recursive = false)`

ファイル/ディレクトリを削除します。

**注意**: `recursive = true` の場合、ディレクトリを再帰的に削除します。

---

**API ドキュメントは以上です。詳細は各ソースコードのコメントも参照してください。**
