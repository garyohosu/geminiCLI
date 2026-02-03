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
const GeminiCLIManager = require('./gemini-cli-manager');
const FileAPI = require('./file-api');

// 開発モードかどうか
const isDev = process.argv.includes('--dev');

// グローバル参照
let mainWindow = null;
let geminiManager = null;
let fileAPI = null;
let currentWorkspace = null;

/**
 * メインウィンドウを作成
 */
function createWindow() {
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
  });

  return mainWindow;
}

/**
 * IPC ハンドラーを設定
 */
function setupIPCHandlers() {
  // ワークスペース選択
  ipcMain.handle('select-workspace', async () => {
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
    }

    return currentWorkspace;
  });

  // Gemini CLI 起動
  ipcMain.handle('gemini:start', async (event, workspace) => {
    try {
      // 既存のマネージャーがあれば停止
      if (geminiManager && geminiManager.isRunning()) {
        await geminiManager.stop();
      }

      // 新しいマネージャーを作成
      geminiManager = new GeminiCLIManager({
        workspace: workspace || currentWorkspace,
        autoRestart: false
      });

      // イベントハンドラーを設定
      setupGeminiEventHandlers();

      // 起動
      await geminiManager.start();

      return { success: true };
    } catch (err) {
      console.error('Gemini CLI start failed:', err);
      return { success: false, error: err.message };
    }
  });

  // Gemini CLI 停止
  ipcMain.handle('gemini:stop', async () => {
    try {
      if (geminiManager && geminiManager.isRunning()) {
        await geminiManager.stop();
      }
      return { success: true };
    } catch (err) {
      console.error('Gemini CLI stop failed:', err);
      return { success: false, error: err.message };
    }
  });

  // Gemini CLI にメッセージ送信
  ipcMain.handle('gemini:send', async (event, message) => {
    try {
      if (!geminiManager || !geminiManager.isRunning()) {
        return { success: false, error: 'Gemini CLI is not running' };
      }

      geminiManager.send(message);
      return { success: true };
    } catch (err) {
      console.error('Gemini CLI send failed:', err);
      return { success: false, error: err.message };
    }
  });

  // Gemini CLI 状態取得
  ipcMain.handle('gemini:status', async () => {
    return {
      running: geminiManager ? geminiManager.isRunning() : false,
      state: geminiManager ? geminiManager.getState() : 'stopped',
      workspace: currentWorkspace
    };
  });

  // ファイル一覧取得
  ipcMain.handle('file:list', async (event, dirPath) => {
    try {
      if (!fileAPI) {
        return { success: false, error: 'Workspace not selected' };
      }
      const files = await fileAPI.list(dirPath || '.');
      return { success: true, files };
    } catch (err) {
      console.error('File list failed:', err);
      return { success: false, error: err.message };
    }
  });

  // ファイル読み込み
  ipcMain.handle('file:read', async (event, filePath) => {
    try {
      if (!fileAPI) {
        return { success: false, error: 'Workspace not selected' };
      }
      const content = await fileAPI.readText(filePath);
      return { success: true, content };
    } catch (err) {
      console.error('File read failed:', err);
      return { success: false, error: err.message };
    }
  });

  // ファイル情報取得
  ipcMain.handle('file:info', async (event, filePath) => {
    try {
      if (!fileAPI) {
        return { success: false, error: 'Workspace not selected' };
      }
      const info = await fileAPI.getInfo(filePath);
      return { success: true, info };
    } catch (err) {
      console.error('File info failed:', err);
      return { success: false, error: err.message };
    }
  });

  // ファイル検索
  ipcMain.handle('file:search', async (event, pattern, dirPath) => {
    try {
      if (!fileAPI) {
        return { success: false, error: 'Workspace not selected' };
      }
      const results = await fileAPI.searchByName(pattern, dirPath || '.');
      return { success: true, results };
    } catch (err) {
      console.error('File search failed:', err);
      return { success: false, error: err.message };
    }
  });

  // ファイル書き込み前の diff 生成
  ipcMain.handle('file:preview-write', async (event, filePath, newContent) => {
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
      return { success: true, diff, isNewFile: currentContent === '' };
    } catch (err) {
      console.error('File preview failed:', err);
      return { success: false, error: err.message };
    }
  });

  // ファイル書き込み（承認後）
  ipcMain.handle('file:write', async (event, filePath, content) => {
    try {
      if (!fileAPI) {
        return { success: false, error: 'Workspace not selected' };
      }
      await fileAPI.writeText(filePath, content);
      return { success: true };
    } catch (err) {
      console.error('File write failed:', err);
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
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('gemini:state', { state });
    }
  });

  // 起動
  geminiManager.on('started', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('gemini:started');
    }
  });

  // 停止
  geminiManager.on('stopped', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('gemini:stopped');
    }
  });

  // エラー
  geminiManager.on('error', (err) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('gemini:error', { message: err.message });
    }
  });

  // プロセス終了
  geminiManager.on('close', ({ code, signal }) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('gemini:close', { code, signal });
    }
  });
}

// アプリケーション初期化
app.whenReady().then(() => {
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
  if (geminiManager && geminiManager.isRunning()) {
    await geminiManager.stop(true);
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
