/**
 * Electron Main Process
 *
 * アプリケーションのメインプロセス
 * - ウィンドウ管理
 * - IPC ハンドラー
 * - GeminiCLIManager の制御
 */

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const GeminiCLIManager = require('./gemini-cli-manager');
const FileAPI = require('./file-api');

// 開発モードかどうか
const isDev = process.argv.includes('--dev');

// 開発モードでは userData をプロジェクト配下に固定し、キャッシュ権限問題を回避
if (isDev) {
  const devUserData = path.join(process.cwd(), '.electron-userdata');
  app.setPath('userData', devUserData);
}

// グローバル参照
let mainWindow = null;
let geminiManager = null;
let fileAPI = null;
let currentWorkspace = null;
let logStream = null;

function initLogger() {
  try {
    const logDir = path.join(app.getPath('userData'), 'logs');
    fs.mkdirSync(logDir, { recursive: true });
    const logPath = path.join(logDir, 'main.log');
    logStream = fs.createWriteStream(logPath, { flags: 'a' });
  } catch (err) {
    console.error('Logger init failed:', err);
  }
}

function logMain(message, meta) {
  const ts = new Date().toISOString();
  const line = `[${ts}] ${message}${meta ? ` ${JSON.stringify(meta)}` : ''}`;
  console.log(line);
  if (logStream) {
    logStream.write(line + '\n');
  }
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('app:log', { ts, message, meta });
  }
}

/**
 * メインウィンドウを作成
 */
function createWindow() {
  logMain('createWindow:start');
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    },
    title: 'Gemini CLI GUI Wrapper',
    show: false // 準備ができるまで非表示
  });

  // HTML を読み込み
  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  // 準備ができたら表示
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    logMain('createWindow:ready-to-show');
  });

  // 開発モードの場合は DevTools を開く
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // ウィンドウが閉じられたときの処理
  mainWindow.on('closed', () => {
    mainWindow = null;
    // Gemini CLI を停止
    if (geminiManager && geminiManager.isRunning()) {
      geminiManager.stop(true);
    }
    logMain('createWindow:closed');
  });

  return mainWindow;
}

/**
 * IPC ハンドラーを設定
 */
function setupIPCHandlers() {
  logMain('setupIPCHandlers:start');
  // ワークスペース選択
  ipcMain.handle('select-workspace', async () => {
    logMain('ipc:select-workspace');
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'ワークスペースフォルダを選択',
      properties: ['openDirectory'],
      buttonLabel: '選択'
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    currentWorkspace = result.filePaths[0];

    // FileAPI を初期化
    try {
      fileAPI = new FileAPI(currentWorkspace);
    } catch (err) {
      console.error('FileAPI initialization failed:', err);
      logMain('fileAPI:init:error', { message: err.message });
    }

    logMain('ipc:select-workspace:done', { workspace: currentWorkspace });
    return currentWorkspace;
  });

  // Gemini CLI 起動（マネージャー初期化）
  ipcMain.handle('gemini:start', async (event, workspace) => {
    logMain('ipc:gemini:start', { workspace: workspace || currentWorkspace });
    try {
      // 新しいマネージャーを作成（非対話モード用）
      geminiManager = new GeminiCLIManager({
        workspace: workspace || currentWorkspace,
        autoRestart: false
      });

      // イベントハンドラーを設定
      setupGeminiEventHandlers();

      // 非対話モードでは常時起動プロセスは不要
      // executePrompt で都度実行する
      geminiManager.state = 'running'; // 状態を設定

      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('gemini:started');
      }

      logMain('ipc:gemini:start:success');
      return { success: true };
    } catch (err) {
      console.error('Gemini CLI start failed:', err);
      logMain('ipc:gemini:start:error', { message: err.message });
      return { success: false, error: err.message };
    }
  });

  // Gemini CLI 停止
  ipcMain.handle('gemini:stop', async () => {
    logMain('ipc:gemini:stop');
    try {
      if (geminiManager) {
        geminiManager.state = 'stopped';
        geminiManager = null;
      }

      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('gemini:stopped');
      }

      logMain('ipc:gemini:stop:success');
      return { success: true };
    } catch (err) {
      console.error('Gemini CLI stop failed:', err);
      logMain('ipc:gemini:stop:error', { message: err.message });
      return { success: false, error: err.message };
    }
  });

  // Gemini CLI にメッセージ送信（非対話モードで実行）
  ipcMain.handle('gemini:send', async (event, message) => {
    logMain('ipc:gemini:send', { length: message ? message.length : 0 });
    try {
      if (!geminiManager) {
        return { success: false, error: 'Gemini CLI manager not initialized' };
      }

      // 非対話モードでプロンプトを実行
      logMain('gemini:executePrompt:start');
      const result = await geminiManager.executePrompt(message);
      logMain('gemini:executePrompt:success', { outputLength: result ? result.length : 0 });
      return { success: true, result };
    } catch (err) {
      console.error('Gemini CLI send failed:', err);
      logMain('gemini:executePrompt:error', { message: err.message });
      return { success: false, error: err.message };
    }
  });

  // Gemini CLI 状態取得
  ipcMain.handle('gemini:status', async () => {
    logMain('ipc:gemini:status');
    return {
      running: geminiManager ? geminiManager.state === 'running' : false,
      state: geminiManager ? geminiManager.state : 'stopped',
      workspace: currentWorkspace
    };
  });

  // ファイル一覧取得
  ipcMain.handle('file:list', async (event, dirPath) => {
    logMain('ipc:file:list', { dirPath: dirPath || '.' });
    try {
      if (!fileAPI) {
        return { success: false, error: 'Workspace not selected' };
      }
      const files = await fileAPI.list(dirPath || '.');
      logMain('ipc:file:list:success', { count: files.length });
      return { success: true, files };
    } catch (err) {
      console.error('File list failed:', err);
      logMain('ipc:file:list:error', { message: err.message });
      return { success: false, error: err.message };
    }
  });

  // ファイル読み込み
  ipcMain.handle('file:read', async (event, filePath) => {
    logMain('ipc:file:read', { filePath });
    try {
      if (!fileAPI) {
        return { success: false, error: 'Workspace not selected' };
      }
      const content = await fileAPI.readText(filePath);
      logMain('ipc:file:read:success', { length: content ? content.length : 0 });
      return { success: true, content };
    } catch (err) {
      console.error('File read failed:', err);
      logMain('ipc:file:read:error', { message: err.message });
      return { success: false, error: err.message };
    }
  });

  // ファイル情報取得
  ipcMain.handle('file:info', async (event, filePath) => {
    logMain('ipc:file:info', { filePath });
    try {
      if (!fileAPI) {
        return { success: false, error: 'Workspace not selected' };
      }
      const info = await fileAPI.getInfo(filePath);
      logMain('ipc:file:info:success');
      return { success: true, info };
    } catch (err) {
      console.error('File info failed:', err);
      logMain('ipc:file:info:error', { message: err.message });
      return { success: false, error: err.message };
    }
  });

  // ファイル検索
  ipcMain.handle('file:search', async (event, pattern, dirPath) => {
    logMain('ipc:file:search', { pattern, dirPath: dirPath || '.' });
    try {
      if (!fileAPI) {
        return { success: false, error: 'Workspace not selected' };
      }
      const results = await fileAPI.searchByName(pattern, dirPath || '.');
      logMain('ipc:file:search:success', { count: results.length });
      return { success: true, results };
    } catch (err) {
      console.error('File search failed:', err);
      logMain('ipc:file:search:error', { message: err.message });
      return { success: false, error: err.message };
    }
  });

  // ファイル書き込み前の diff 生成
  ipcMain.handle('file:preview-write', async (event, filePath, newContent) => {
    logMain('ipc:file:preview-write', { filePath, length: newContent ? newContent.length : 0 });
    try {
      if (!fileAPI) {
        return { success: false, error: 'Workspace not selected' };
      }

      let currentContent = '';
      try {
        currentContent = await fileAPI.readText(filePath);
      } catch (e) {
        // ファイルが存在しない場合は空文字として扱う
        currentContent = '';
      }

      const diff = generateDiff(currentContent, newContent);
      logMain('ipc:file:preview-write:success');
      return { success: true, diff, isNewFile: currentContent === '' };
    } catch (err) {
      console.error('File preview failed:', err);
      logMain('ipc:file:preview-write:error', { message: err.message });
      return { success: false, error: err.message };
    }
  });

  // ファイル書き込み（承認後）
  ipcMain.handle('file:write', async (event, filePath, content) => {
    logMain('ipc:file:write', { filePath, length: content ? content.length : 0 });
    try {
      if (!fileAPI) {
        return { success: false, error: 'Workspace not selected' };
      }
      await fileAPI.writeText(filePath, content);
      logMain('ipc:file:write:success');
      return { success: true };
    } catch (err) {
      console.error('File write failed:', err);
      logMain('ipc:file:write:error', { message: err.message });
      return { success: false, error: err.message };
    }
  });
}

/**
 * 簡易的な diff を生成
 */
function generateDiff(oldContent, newContent) {
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');
  const changes = [];

  const maxLen = Math.max(oldLines.length, newLines.length);

  for (let i = 0; i < maxLen; i++) {
    const oldLine = i < oldLines.length ? oldLines[i] : null;
    const newLine = i < newLines.length ? newLines[i] : null;

    if (oldLine === null) {
      // 新規追加行
      changes.push({ type: 'add', line: newLine });
    } else if (newLine === null) {
      // 削除行
      changes.push({ type: 'remove', line: oldLine });
    } else if (oldLine !== newLine) {
      // 変更行
      changes.push({ type: 'remove', line: oldLine });
      changes.push({ type: 'add', line: newLine });
    } else {
      // 変更なし
      changes.push({ type: 'context', line: oldLine });
    }
  }

  return { changes };
}

/**
 * Gemini CLI のイベントハンドラーを設定
 */
function setupGeminiEventHandlers() {
  if (!geminiManager) return;

  geminiManager.on('debug', (payload) => {
    logMain(`gemini:debug:${payload.message}`, payload.meta);
  });

  // 標準出力
  geminiManager.on('stdout', (data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('gemini:output', { type: 'stdout', data });
    }
  });

  // 標準エラー
  geminiManager.on('stderr', (data) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('gemini:output', { type: 'stderr', data });
    }
  });

  // 状態変化
  geminiManager.on('stateChange', (state) => {
    logMain('gemini:stateChange', { state });
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('gemini:state', { state });
    }
  });

  // 起動
  geminiManager.on('started', () => {
    logMain('gemini:started');
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('gemini:started');
    }
  });

  // 停止
  geminiManager.on('stopped', () => {
    logMain('gemini:stopped');
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('gemini:stopped');
    }
  });

  // エラー
  geminiManager.on('error', (err) => {
    logMain('gemini:error', { message: err.message });
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('gemini:error', { message: err.message });
    }
  });

  // プロセス終了
  geminiManager.on('close', ({ code, signal }) => {
    logMain('gemini:close', { code, signal });
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('gemini:close', { code, signal });
    }
  });
}

// アプリケーション初期化
app.whenReady().then(() => {
  initLogger();
  logMain('app:ready');
  createWindow();
  setupIPCHandlers();

  // macOS: ドックアイコンクリック時にウィンドウがなければ作成
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// すべてのウィンドウが閉じられたときの処理
app.on('window-all-closed', () => {
  // Gemini CLI を停止
  if (geminiManager && geminiManager.isRunning()) {
    geminiManager.stop(true);
  }

  // macOS 以外はアプリを終了
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// アプリ終了前の処理
app.on('before-quit', async () => {
  logMain('app:before-quit');
  if (geminiManager && geminiManager.isRunning()) {
    await geminiManager.stop(true);
  }
  if (logStream) {
    logStream.end();
  }
});

// セキュリティ: リモートコンテンツの読み込みを禁止
app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    if (parsedUrl.protocol !== 'file:') {
      event.preventDefault();
    }
  });
});

module.exports = { createWindow };
