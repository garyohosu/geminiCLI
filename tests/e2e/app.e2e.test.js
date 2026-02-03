/**
 * Electron E2E Tests
 *
 * アプリケーション全体の動作を検証する E2E テスト
 */

const { test, expect } = require('@playwright/test');
const { _electron: electron } = require('playwright');
const path = require('path');

let electronApp;
let window;

test.describe('Gemini CLI GUI Wrapper E2E Tests', () => {
  test.beforeAll(async () => {
    // Electron アプリを起動
    electronApp = await electron.launch({
      args: [path.join(__dirname, '../../src/main/index.js')],
      env: {
        ...process.env,
        NODE_ENV: 'test'
      }
    });

    // 最初のウィンドウを取得
    window = await electronApp.firstWindow();

    // ウィンドウが完全に読み込まれるまで待機
    await window.waitForLoadState('domcontentloaded');
  });

  test.afterAll(async () => {
    // アプリを終了
    if (electronApp) {
      await electronApp.close();
    }
  });

  test('should launch application with correct title', async () => {
    const title = await window.title();
    expect(title).toBe('Gemini CLI GUI Wrapper');
  });

  test('should show workspace selection button', async () => {
    const button = window.locator('#select-workspace-btn');
    await expect(button).toBeVisible();
    await expect(button).toHaveText('フォルダを選択');
  });

  test('should have disabled start button initially', async () => {
    const startBtn = window.locator('#start-btn');
    await expect(startBtn).toBeVisible();
    await expect(startBtn).toBeDisabled();
  });

  test('should have disabled stop button initially', async () => {
    const stopBtn = window.locator('#stop-btn');
    await expect(stopBtn).toBeVisible();
    await expect(stopBtn).toBeDisabled();
  });

  test('should have disabled send button initially', async () => {
    const sendBtn = window.locator('#send-btn');
    await expect(sendBtn).toBeVisible();
    await expect(sendBtn).toBeDisabled();
  });

  test('should have disabled message input initially', async () => {
    const messageInput = window.locator('#message-input');
    await expect(messageInput).toBeVisible();
    await expect(messageInput).toBeDisabled();
  });

  test('should show output log area', async () => {
    const outputLog = window.locator('#output-log');
    await expect(outputLog).toBeVisible();
  });

  test('should show welcome message in output log', async () => {
    const welcomeMessage = window.locator('.welcome-message');
    await expect(welcomeMessage).toBeVisible();
    await expect(welcomeMessage).toContainText('ようこそ');
  });

  test('should show file tree section', async () => {
    const fileTree = window.locator('#file-tree');
    await expect(fileTree).toBeVisible();
  });

  test('should show status indicator as stopped', async () => {
    const statusText = window.locator('#status-text');
    await expect(statusText).toHaveText('停止中');
  });

  test('should show header with app title', async () => {
    const header = window.locator('#header h1');
    await expect(header).toHaveText('Gemini CLI GUI Wrapper');
  });

  test('should show clear output button', async () => {
    const clearBtn = window.locator('#clear-output-btn');
    await expect(clearBtn).toBeVisible();
    await expect(clearBtn).toHaveText('クリア');
  });

  test('should clear output when clear button is clicked', async () => {
    // 出力ログに何かあることを確認
    const outputLog = window.locator('#output-log');
    const initialContent = await outputLog.innerHTML();
    expect(initialContent.length).toBeGreaterThan(0);

    // クリアボタンをクリック
    const clearBtn = window.locator('#clear-output-btn');
    await clearBtn.click();

    // 出力ログが空になったことを確認
    const clearedContent = await outputLog.innerHTML();
    expect(clearedContent).toBe('');
  });

  test('should show footer with version', async () => {
    const footer = window.locator('#footer');
    await expect(footer).toBeVisible();
    await expect(footer).toContainText('v0.1.0');
  });

  test('should show platform info in footer', async () => {
    const platform = window.locator('#platform');
    await expect(platform).toBeVisible();
    await expect(platform).toContainText('Platform:');
  });
});

test.describe('UI Interaction Tests', () => {
  test.beforeAll(async () => {
    if (!electronApp) {
      electronApp = await electron.launch({
        args: [path.join(__dirname, '../../src/main/index.js')],
        env: {
          ...process.env,
          NODE_ENV: 'test'
        }
      });
      window = await electronApp.firstWindow();
      await window.waitForLoadState('domcontentloaded');
    }
  });

  test.afterAll(async () => {
    if (electronApp) {
      await electronApp.close();
    }
  });

  test('should have correct sidebar structure', async () => {
    const sidebar = window.locator('#sidebar');
    await expect(sidebar).toBeVisible();

    // ワークスペースセクション
    const workspaceSection = window.locator('#workspace-section');
    await expect(workspaceSection).toBeVisible();

    // コントロールセクション
    const controlSection = window.locator('#control-section');
    await expect(controlSection).toBeVisible();

    // ファイルセクション
    const fileSection = window.locator('#file-section');
    await expect(fileSection).toBeVisible();
  });

  test('should have correct chat area structure', async () => {
    const chatArea = window.locator('#chat-area');
    await expect(chatArea).toBeVisible();

    // 出力セクション
    const outputSection = window.locator('#output-section');
    await expect(outputSection).toBeVisible();

    // チャット入力セクション
    const chatInputSection = window.locator('#chat-input-section');
    await expect(chatInputSection).toBeVisible();
  });
});
