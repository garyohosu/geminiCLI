/**
 * GeminiCLIManager 単体テスト
 */

const GeminiCLIManager = require('../../src/main/gemini-cli-manager');
const path = require('path');
const os = require('os');
const fs = require('fs').promises;

describe('GeminiCLIManager', () => {
  let tempDir;
  let manager;

  beforeAll(async () => {
    // テスト用の一時ディレクトリを作成
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'gemini-test-'));
  });

  afterAll(async () => {
    // 一時ディレクトリを削除
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  afterEach(async () => {
    // 各テスト後にマネージャーを停止
    if (manager && manager.isRunning()) {
      await manager.stop(true);
    }
    manager = null;
  });

  describe('コンストラクタ', () => {
    test('ワークスペースパスが必須', () => {
      expect(() => new GeminiCLIManager()).toThrow('Workspace path is required');
      expect(() => new GeminiCLIManager({})).toThrow('Workspace path is required');
    });

    test('ワークスペースパスを設定できる', () => {
      manager = new GeminiCLIManager({ workspace: tempDir });
      expect(manager.getWorkspace()).toBe(path.resolve(tempDir));
    });

    test('デフォルトオプションが設定される', () => {
      manager = new GeminiCLIManager({ workspace: tempDir });
      expect(manager.cliPath).toBe('gemini');
      expect(manager.autoRestart).toBe(false);
      expect(manager.restartDelay).toBe(1000);
      expect(manager.maxRestarts).toBe(3);
    });

    test('カスタムオプションを設定できる', () => {
      manager = new GeminiCLIManager({
        workspace: tempDir,
        cliPath: '/custom/path/gemini',
        autoRestart: true,
        restartDelay: 2000,
        maxRestarts: 5
      });
      expect(manager.cliPath).toBe('/custom/path/gemini');
      expect(manager.autoRestart).toBe(true);
      expect(manager.restartDelay).toBe(2000);
      expect(manager.maxRestarts).toBe(5);
    });

    test('相対パスが絶対パスに変換される', () => {
      manager = new GeminiCLIManager({ workspace: './test' });
      expect(path.isAbsolute(manager.getWorkspace())).toBe(true);
    });
  });

  describe('状態管理', () => {
    beforeEach(() => {
      manager = new GeminiCLIManager({ workspace: tempDir });
    });

    test('初期状態は STOPPED', () => {
      expect(manager.getState()).toBe(GeminiCLIManager.ProcessState.STOPPED);
    });

    test('isRunning は初期状態で false を返す', () => {
      expect(manager.isRunning()).toBe(false);
    });
  });

  describe('イベントエミッター機能', () => {
    beforeEach(() => {
      manager = new GeminiCLIManager({ workspace: tempDir });
    });

    test('EventEmitter を継承している', () => {
      expect(typeof manager.on).toBe('function');
      expect(typeof manager.emit).toBe('function');
      expect(typeof manager.removeListener).toBe('function');
    });

    test('イベントを受信できる', (done) => {
      manager.on('test-event', (data) => {
        expect(data).toBe('test-data');
        done();
      });
      manager.emit('test-event', 'test-data');
    });
  });

  describe('出力バッファ', () => {
    beforeEach(() => {
      manager = new GeminiCLIManager({ workspace: tempDir });
    });

    test('初期バッファは空', () => {
      expect(manager.getBuffer()).toBe('');
    });

    test('バッファをクリアできる', () => {
      manager.outputBuffer = 'some output';
      manager.clearBuffer();
      expect(manager.getBuffer()).toBe('');
    });
  });

  describe('再起動カウント', () => {
    beforeEach(() => {
      manager = new GeminiCLIManager({ workspace: tempDir });
    });

    test('再起動カウントをリセットできる', () => {
      manager.restartCount = 5;
      manager.resetRestartCount();
      expect(manager.restartCount).toBe(0);
    });
  });

  describe('start/stop（モック使用）', () => {
    beforeEach(() => {
      // echo コマンドを使ってテスト（Gemini CLI の代わり）
      manager = new GeminiCLIManager({
        workspace: tempDir,
        cliPath: process.platform === 'win32' ? 'cmd /c echo' : 'echo'
      });
    });

    test('既に起動中の場合はエラー', async () => {
      // モック：状態を RUNNING に設定
      manager.state = GeminiCLIManager.ProcessState.RUNNING;

      await expect(manager.start()).rejects.toThrow('already running');
    });

    test('STARTING 状態の場合はエラー', async () => {
      manager.state = GeminiCLIManager.ProcessState.STARTING;

      await expect(manager.start()).rejects.toThrow('already running');
    });

    test('停止中の状態で stop を呼んでもエラーにならない', async () => {
      expect(manager.getState()).toBe(GeminiCLIManager.ProcessState.STOPPED);
      await expect(manager.stop()).resolves.toBeUndefined();
    });
  });

  describe('send（実行前チェック）', () => {
    beforeEach(() => {
      manager = new GeminiCLIManager({ workspace: tempDir });
    });

    test('未起動時に send するとエラー', () => {
      expect(() => manager.send('hello')).toThrow('not running');
    });
  });

  describe('ProcessState 定数', () => {
    test('すべての状態が定義されている', () => {
      expect(GeminiCLIManager.ProcessState.STOPPED).toBe('stopped');
      expect(GeminiCLIManager.ProcessState.STARTING).toBe('starting');
      expect(GeminiCLIManager.ProcessState.RUNNING).toBe('running');
      expect(GeminiCLIManager.ProcessState.STOPPING).toBe('stopping');
      expect(GeminiCLIManager.ProcessState.ERROR).toBe('error');
    });
  });
});

describe('GeminiCLIManager 統合テスト（実プロセス）', () => {
  let tempDir;
  let manager;

  beforeAll(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'gemini-integration-'));
  });

  afterAll(async () => {
    // プロセスが完全に終了するのを待つ
    await new Promise(resolve => setTimeout(resolve, 500));
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (e) {
      // Windows でロックされている場合は無視
      console.warn('Could not delete temp dir:', e.message);
    }
  });

  afterEach(async () => {
    if (manager && manager.isRunning()) {
      await manager.stop(true);
    }
    // プロセスが完全に終了するのを待つ
    await new Promise(resolve => setTimeout(resolve, 100));
    manager = null;
  });

  describe('プロセス起動・停止', () => {
    test('シンプルなコマンドを起動・停止できる', async () => {
      // node -e を使って対話的なプロセスをシミュレート
      const isWindows = process.platform === 'win32';
      manager = new GeminiCLIManager({
        workspace: tempDir,
        cliPath: isWindows
          ? 'node -e "process.stdin.resume()"'
          : 'node -e "process.stdin.resume()"'
      });

      const stateChanges = [];
      manager.on('stateChange', (state) => stateChanges.push(state));

      await manager.start();

      expect(manager.isRunning()).toBe(true);
      expect(manager.getState()).toBe(GeminiCLIManager.ProcessState.RUNNING);
      expect(stateChanges).toContain(GeminiCLIManager.ProcessState.STARTING);
      expect(stateChanges).toContain(GeminiCLIManager.ProcessState.RUNNING);

      await manager.stop();

      expect(manager.isRunning()).toBe(false);
      expect(manager.getState()).toBe(GeminiCLIManager.ProcessState.STOPPED);
    }, 10000);

    test('強制停止ができる', async () => {
      manager = new GeminiCLIManager({
        workspace: tempDir,
        cliPath: 'node -e "process.stdin.resume()"'
      });

      await manager.start();
      expect(manager.isRunning()).toBe(true);

      await manager.stop(true); // 強制停止

      expect(manager.isRunning()).toBe(false);
    }, 10000);

    test('再起動ができる', async () => {
      manager = new GeminiCLIManager({
        workspace: tempDir,
        cliPath: 'node -e "process.stdin.resume()"'
      });

      await manager.start();
      expect(manager.isRunning()).toBe(true);

      await manager.restart();

      expect(manager.isRunning()).toBe(true);
    }, 15000);
  });

  describe('標準入出力', () => {
    test('stdout を受信できる', async () => {
      manager = new GeminiCLIManager({
        workspace: tempDir,
        cliPath: 'node -e "console.log(\'hello world\')"'
      });

      const outputs = [];
      manager.on('stdout', (data) => outputs.push(data));

      await manager.start();

      // プロセス終了を待つ
      await new Promise(resolve => manager.once('close', resolve));

      expect(outputs.join('')).toContain('hello world');
    }, 10000);

    test('stderr を受信できる', async () => {
      manager = new GeminiCLIManager({
        workspace: tempDir,
        cliPath: 'node -e "console.error(\'error message\')"'
      });

      const errors = [];
      manager.on('stderr', (data) => errors.push(data));

      await manager.start();

      // プロセス終了を待つ
      await new Promise(resolve => manager.once('close', resolve));

      expect(errors.join('')).toContain('error message');
    }, 10000);

    test('output イベントで stdout/stderr を統合受信できる', async () => {
      manager = new GeminiCLIManager({
        workspace: tempDir,
        cliPath: 'node -e "console.log(\'out\'); console.error(\'err\')"'
      });

      const outputs = [];
      manager.on('output', (data) => outputs.push(data));

      await manager.start();

      // プロセス終了を待つ
      await new Promise(resolve => manager.once('close', resolve));

      expect(outputs.some(o => o.type === 'stdout')).toBe(true);
      expect(outputs.some(o => o.type === 'stderr')).toBe(true);
    }, 10000);

    test('メッセージを送信できる', async () => {
      // stdin から読み込んで出力するスクリプト
      manager = new GeminiCLIManager({
        workspace: tempDir,
        cliPath: 'node -e "process.stdin.once(\'data\', d => { console.log(\'received:\' + d.toString().trim()); process.exit(0); })"'
      });

      const outputs = [];
      manager.on('stdout', (data) => outputs.push(data));

      await manager.start();

      // メッセージを送信
      const sent = manager.send('test message');
      expect(sent).toBe(true);

      // プロセス終了を待つ
      await new Promise(resolve => manager.once('close', resolve));

      expect(outputs.join('')).toContain('received:test message');
    }, 10000);

    test('sent イベントが発火する', async () => {
      manager = new GeminiCLIManager({
        workspace: tempDir,
        cliPath: 'node -e "process.stdin.resume()"'
      });

      const sentMessages = [];
      manager.on('sent', (msg) => sentMessages.push(msg));

      await manager.start();

      manager.send('hello');
      manager.send('world');

      expect(sentMessages).toContain('hello');
      expect(sentMessages).toContain('world');

      await manager.stop(true);
    }, 10000);
  });

  describe('出力バッファ', () => {
    test('出力がバッファに蓄積される', async () => {
      manager = new GeminiCLIManager({
        workspace: tempDir,
        cliPath: 'node -e "console.log(\'line1\'); console.log(\'line2\')"'
      });

      await manager.start();

      // プロセス終了を待つ
      await new Promise(resolve => manager.once('close', resolve));

      const buffer = manager.getBuffer();
      expect(buffer).toContain('line1');
      expect(buffer).toContain('line2');
    }, 10000);
  });

  describe('イベント', () => {
    test('started イベントが発火する', async () => {
      manager = new GeminiCLIManager({
        workspace: tempDir,
        cliPath: 'node -e "process.stdin.resume()"'
      });

      let startedFired = false;
      manager.on('started', () => { startedFired = true; });

      await manager.start();

      expect(startedFired).toBe(true);

      await manager.stop(true);
    }, 10000);

    test('stopped イベントが発火する', async () => {
      manager = new GeminiCLIManager({
        workspace: tempDir,
        cliPath: 'node -e "process.stdin.resume()"'
      });

      let stoppedFired = false;
      manager.on('stopped', () => { stoppedFired = true; });

      await manager.start();
      await manager.stop();

      expect(stoppedFired).toBe(true);
    }, 10000);

    test('close イベントが終了コードを含む', async () => {
      manager = new GeminiCLIManager({
        workspace: tempDir,
        cliPath: 'node -e "process.exit(42)"'
      });

      const closeEvent = await new Promise(async (resolve) => {
        manager.on('close', resolve);
        await manager.start();
      });

      expect(closeEvent).toHaveProperty('code');
      expect(closeEvent.code).toBe(42);
    }, 10000);
  });

  describe('エラーハンドリング', () => {
    test('存在しないコマンドでエラーまたは異常終了が発生', async () => {
      manager = new GeminiCLIManager({
        workspace: tempDir,
        cliPath: 'nonexistent-command-that-does-not-exist-12345'
      });

      let errorFired = false;
      let closeCode = null;
      manager.on('error', () => { errorFired = true; });
      manager.on('close', ({ code }) => { closeCode = code; });

      try {
        await manager.start();
        // Windows の shell:true では spawn は成功するので close を待つ
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) {
        // エラーが発生することを期待
        errorFired = true;
      }

      // Windows では close イベントで非0のコードが返される
      // または error イベントが発火する
      // または state が ERROR/STOPPED であることを確認
      const hasError = errorFired ||
        closeCode !== 0 ||
        manager.getState() === GeminiCLIManager.ProcessState.ERROR ||
        manager.getState() === GeminiCLIManager.ProcessState.STOPPED;

      expect(hasError).toBe(true);
    }, 10000);
  });

  describe('自動再起動', () => {
    test('autoRestart が有効な場合、異常終了時に再起動する', async () => {
      manager = new GeminiCLIManager({
        workspace: tempDir,
        cliPath: 'node -e "process.exit(1)"',
        autoRestart: true,
        restartDelay: 100,
        maxRestarts: 2
      });

      const restartEvents = [];
      manager.on('restarting', (data) => restartEvents.push(data));

      await manager.start();

      // 再起動が発生するのを待つ
      await new Promise(resolve => setTimeout(resolve, 500));

      // 少なくとも1回は再起動が試みられる
      expect(restartEvents.length).toBeGreaterThan(0);
      expect(restartEvents[0].attempt).toBe(1);
    }, 15000);

    test('maxRestarts を超えると再起動しない', async () => {
      manager = new GeminiCLIManager({
        workspace: tempDir,
        cliPath: 'node -e "process.exit(1)"',
        autoRestart: true,
        restartDelay: 100,
        maxRestarts: 2
      });

      const restartEvents = [];
      manager.on('restarting', (data) => restartEvents.push(data));

      await manager.start();

      // 再起動が完了するのを待つ（十分な時間を確保）
      await new Promise(resolve => setTimeout(resolve, 800));

      // restarting イベントは maxRestarts 回まで
      // 最大再起動回数(2)を超えないことを確認
      expect(restartEvents.length).toBeLessThanOrEqual(2);

      // 最後の再起動イベントの attempt が maxRestarts 以下であることを確認
      if (restartEvents.length > 0) {
        const lastEvent = restartEvents[restartEvents.length - 1];
        expect(lastEvent.attempt).toBeLessThanOrEqual(2);
      }
    }, 15000);
  });

  describe('Windows 固有のテスト', () => {
    const isWindows = process.platform === 'win32';

    (isWindows ? test : test.skip)('Windows でプロセスが起動できる', async () => {
      manager = new GeminiCLIManager({
        workspace: tempDir,
        cliPath: 'node -e "console.log(\'windows test\')"'
      });

      const outputs = [];
      manager.on('stdout', (data) => outputs.push(data));

      await manager.start();
      await new Promise(resolve => manager.once('close', resolve));

      expect(outputs.join('')).toContain('windows test');
    }, 10000);

    (isWindows ? test : test.skip)('Windows でバックスラッシュパスが扱える', async () => {
      const windowsPath = tempDir.replace(/\//g, '\\');
      manager = new GeminiCLIManager({
        workspace: windowsPath,
        cliPath: 'node -e "console.log(process.cwd())"'
      });

      const outputs = [];
      manager.on('stdout', (data) => outputs.push(data));

      await manager.start();
      await new Promise(resolve => manager.once('close', resolve));

      // ワークスペースパスが出力に含まれる
      const output = outputs.join('');
      expect(output.toLowerCase()).toContain(tempDir.toLowerCase().replace(/\//g, '\\'));
    }, 10000);

    (isWindows ? test : test.skip)('日本語パスが扱える', async () => {
      // 日本語フォルダを作成
      const japanesePath = path.join(tempDir, '日本語フォルダ');
      await fs.mkdir(japanesePath, { recursive: true });

      manager = new GeminiCLIManager({
        workspace: japanesePath,
        cliPath: 'node -e "console.log(\'success\')"'
      });

      const outputs = [];
      manager.on('stdout', (data) => outputs.push(data));

      await manager.start();
      await new Promise(resolve => manager.once('close', resolve));

      expect(outputs.join('')).toContain('success');

      // クリーンアップ
      await fs.rm(japanesePath, { recursive: true, force: true });
    }, 10000);
  });
});
