/**
 * Renderer Process JavaScript
 *
 * UI のイベントハンドリングと表示ロジック
 */

// DOM 要素の取得
const elements = {
  // ワークスペース
  selectWorkspaceBtn: document.getElementById('select-workspace-btn'),
  workspacePath: document.getElementById('workspace-path'),

  // Gemini CLI 制御
  startBtn: document.getElementById('start-btn'),
  stopBtn: document.getElementById('stop-btn'),
  statusDot: document.getElementById('status-dot'),
  statusText: document.getElementById('status-text'),

  // チャット
  messageInput: document.getElementById('message-input'),
  sendBtn: document.getElementById('send-btn'),
  outputLog: document.getElementById('output-log'),
  clearOutputBtn: document.getElementById('clear-output-btn'),

  // ファイル
  fileTree: document.getElementById('file-tree'),

  // その他
  platform: document.getElementById('platform')
};

// アプリケーション状態
const state = {
  workspace: null,
  geminiRunning: false
};

/**
 * 初期化
 */
async function initialize() {
  // プラットフォーム情報を表示
  elements.platform.textContent = `Platform: ${window.electronAPI.app.getPlatform()}`;

  // イベントリスナーを設定
  setupEventListeners();

  // Gemini CLI イベントハンドラーを設定
  setupGeminiEventHandlers();

  // 初期状態を取得
  const status = await window.electronAPI.gemini.getStatus();
  if (status.workspace) {
    state.workspace = status.workspace;
    elements.workspacePath.textContent = status.workspace;
    elements.startBtn.disabled = false;
    await loadFileTree();
  }
  if (status.running) {
    setGeminiRunning(true);
  }
}

/**
 * イベントリスナーを設定
 */
function setupEventListeners() {
  // ワークスペース選択
  elements.selectWorkspaceBtn.addEventListener('click', handleSelectWorkspace);

  // Gemini CLI 制御
  elements.startBtn.addEventListener('click', handleStart);
  elements.stopBtn.addEventListener('click', handleStop);

  // メッセージ送信
  elements.sendBtn.addEventListener('click', handleSend);
  elements.messageInput.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      handleSend();
    }
  });

  // 出力クリア
  elements.clearOutputBtn.addEventListener('click', handleClearOutput);
}

/**
 * Gemini CLI イベントハンドラーを設定
 */
function setupGeminiEventHandlers() {
  // 出力受信
  window.electronAPI.gemini.onOutput((data) => {
    appendOutput(data.data, data.type);
  });

  // 状態変化
  window.electronAPI.gemini.onState((data) => {
    updateStatus(data.state);
  });

  // 起動
  window.electronAPI.gemini.onStarted(() => {
    setGeminiRunning(true);
    appendOutput('Gemini CLI が起動しました', 'info');
  });

  // 停止
  window.electronAPI.gemini.onStopped(() => {
    setGeminiRunning(false);
    appendOutput('Gemini CLI が停止しました', 'info');
  });

  // エラー
  window.electronAPI.gemini.onError((data) => {
    appendOutput(`エラー: ${data.message}`, 'error');
  });

  // プロセス終了
  window.electronAPI.gemini.onClose((data) => {
    setGeminiRunning(false);
    if (data.code !== 0) {
      appendOutput(`プロセスが終了しました (code: ${data.code})`, 'error');
    }
  });
}

/**
 * ワークスペース選択
 */
async function handleSelectWorkspace() {
  const workspace = await window.electronAPI.selectWorkspace();
  if (workspace) {
    state.workspace = workspace;
    elements.workspacePath.textContent = workspace;
    elements.startBtn.disabled = false;
    appendOutput(`ワークスペースを選択しました: ${workspace}`, 'info');
    await loadFileTree();
  }
}

/**
 * Gemini CLI 起動
 */
async function handleStart() {
  if (!state.workspace) {
    appendOutput('ワークスペースを選択してください', 'error');
    return;
  }

  elements.startBtn.disabled = true;
  appendOutput('Gemini CLI を起動中...', 'info');

  const result = await window.electronAPI.gemini.start(state.workspace);
  if (!result.success) {
    appendOutput(`起動に失敗しました: ${result.error}`, 'error');
    elements.startBtn.disabled = false;
  }
}

/**
 * Gemini CLI 停止
 */
async function handleStop() {
  elements.stopBtn.disabled = true;
  appendOutput('Gemini CLI を停止中...', 'info');

  const result = await window.electronAPI.gemini.stop();
  if (!result.success) {
    appendOutput(`停止に失敗しました: ${result.error}`, 'error');
    elements.stopBtn.disabled = false;
  }
}

/**
 * メッセージ送信
 */
async function handleSend() {
  const message = elements.messageInput.value.trim();
  if (!message) return;

  // 入力をクリア
  elements.messageInput.value = '';

  // 送信内容を表示
  appendOutput(`> ${message}`, 'user');

  // 送信
  const result = await window.electronAPI.gemini.send(message);
  if (!result.success) {
    appendOutput(`送信に失敗しました: ${result.error}`, 'error');
  }
}

/**
 * 出力クリア
 */
function handleClearOutput() {
  elements.outputLog.innerHTML = '';
}

/**
 * Gemini CLI 実行状態を設定
 */
function setGeminiRunning(running) {
  state.geminiRunning = running;

  elements.startBtn.disabled = running;
  elements.stopBtn.disabled = !running;
  elements.sendBtn.disabled = !running;
  elements.messageInput.disabled = !running;

  updateStatus(running ? 'running' : 'stopped');
}

/**
 * ステータス表示を更新
 */
function updateStatus(status) {
  const statusMap = {
    stopped: { text: '停止中', class: 'status-stopped' },
    starting: { text: '起動中...', class: 'status-starting' },
    running: { text: '実行中', class: 'status-running' },
    stopping: { text: '停止中...', class: 'status-stopping' },
    error: { text: 'エラー', class: 'status-error' }
  };

  const statusInfo = statusMap[status] || statusMap.stopped;

  elements.statusText.textContent = statusInfo.text;
  elements.statusDot.className = statusInfo.class;
}

/**
 * 出力を追加
 */
function appendOutput(text, type = 'stdout') {
  const div = document.createElement('div');
  div.className = `output-line output-${type}`;

  // タイムスタンプを追加
  const timestamp = new Date().toLocaleTimeString('ja-JP');
  const timestampSpan = document.createElement('span');
  timestampSpan.className = 'timestamp';
  timestampSpan.textContent = `[${timestamp}] `;

  const textSpan = document.createElement('span');
  textSpan.className = 'text';
  textSpan.textContent = text;

  div.appendChild(timestampSpan);
  div.appendChild(textSpan);

  elements.outputLog.appendChild(div);

  // 自動スクロール
  elements.outputLog.scrollTop = elements.outputLog.scrollHeight;
}

/**
 * ファイルツリーを読み込み
 */
async function loadFileTree() {
  if (!state.workspace) return;

  const result = await window.electronAPI.files.list('.');
  if (result.success) {
    renderFileTree(result.files);
  } else {
    elements.fileTree.innerHTML = `<p class="error">読み込みエラー: ${result.error}</p>`;
  }
}

/**
 * ファイルツリーを描画
 */
function renderFileTree(files) {
  elements.fileTree.innerHTML = '';

  if (files.length === 0) {
    elements.fileTree.innerHTML = '<p class="placeholder">ファイルがありません</p>';
    return;
  }

  const ul = document.createElement('ul');

  // ディレクトリを先に、ファイルを後に
  const sorted = [...files].sort((a, b) => {
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;
    return a.name.localeCompare(b.name);
  });

  for (const file of sorted) {
    const li = document.createElement('li');
    li.className = file.isDirectory ? 'directory' : 'file';

    const icon = document.createElement('span');
    icon.className = 'icon';
    icon.textContent = file.isDirectory ? '📁' : '📄';

    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = file.name;

    li.appendChild(icon);
    li.appendChild(name);
    ul.appendChild(li);
  }

  elements.fileTree.appendChild(ul);
}

// 初期化を実行
document.addEventListener('DOMContentLoaded', initialize);
