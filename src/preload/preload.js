/**
 * Preload Script
 *
 * Renderer プロセスに安全な API を公開する
 * contextBridge を使用して、Node.js の機能へのアクセスを制限
 */

const { contextBridge, ipcRenderer } = require('electron');

// 許可されたチャンネルのリスト
const validSendChannels = [
  'select-workspace',
  'gemini:start',
  'gemini:stop',
  'gemini:send',
  'gemini:status',
  'file:list',
  'file:read',
  'file:info',
  'file:search'
];

const validReceiveChannels = [
  'gemini:output',
  'gemini:state',
  'gemini:started',
  'gemini:stopped',
  'gemini:error',
  'gemini:close'
];

// 安全な API を公開
contextBridge.exposeInMainWorld('electronAPI', {
  // ワークスペース選択
  selectWorkspace: () => ipcRenderer.invoke('select-workspace'),

  // Gemini CLI 制御
  gemini: {
    start: (workspace) => ipcRenderer.invoke('gemini:start', workspace),
    stop: () => ipcRenderer.invoke('gemini:stop'),
    send: (message) => ipcRenderer.invoke('gemini:send', message),
    getStatus: () => ipcRenderer.invoke('gemini:status'),

    // イベントリスナー
    onOutput: (callback) => {
      const listener = (event, data) => callback(data);
      ipcRenderer.on('gemini:output', listener);
      // クリーンアップ関数を返す
      return () => ipcRenderer.removeListener('gemini:output', listener);
    },

    onState: (callback) => {
      const listener = (event, data) => callback(data);
      ipcRenderer.on('gemini:state', listener);
      return () => ipcRenderer.removeListener('gemini:state', listener);
    },

    onStarted: (callback) => {
      const listener = () => callback();
      ipcRenderer.on('gemini:started', listener);
      return () => ipcRenderer.removeListener('gemini:started', listener);
    },

    onStopped: (callback) => {
      const listener = () => callback();
      ipcRenderer.on('gemini:stopped', listener);
      return () => ipcRenderer.removeListener('gemini:stopped', listener);
    },

    onError: (callback) => {
      const listener = (event, data) => callback(data);
      ipcRenderer.on('gemini:error', listener);
      return () => ipcRenderer.removeListener('gemini:error', listener);
    },

    onClose: (callback) => {
      const listener = (event, data) => callback(data);
      ipcRenderer.on('gemini:close', listener);
      return () => ipcRenderer.removeListener('gemini:close', listener);
    }
  },

  // ファイル操作
  files: {
    list: (dirPath) => ipcRenderer.invoke('file:list', dirPath),
    read: (filePath) => ipcRenderer.invoke('file:read', filePath),
    info: (filePath) => ipcRenderer.invoke('file:info', filePath),
    search: (pattern, dirPath) => ipcRenderer.invoke('file:search', pattern, dirPath)
  },

  // アプリケーション情報
  app: {
    getVersion: () => '0.1.0',
    getPlatform: () => process.platform
  }
});

// Renderer が読み込まれたことを通知（開発用）
console.log('Preload script loaded successfully');
