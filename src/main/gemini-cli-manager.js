/**
 * Gemini CLI Manager - Gemini CLIの子プロセス管理
 *
 * Gemini CLIを子プロセスとして起動・管理し、stdin/stdoutで通信する
 */

const { spawn } = require('child_process');
const path = require('path');
const EventEmitter = require('events');

/**
 * Gemini CLI の状態
 */
const ProcessState = {
  STOPPED: 'stopped',
  STARTING: 'starting',
  RUNNING: 'running',
  STOPPING: 'stopping',
  ERROR: 'error'
};

class GeminiCLIManager extends EventEmitter {
  /**
   * @param {Object} options - 設定オプション
   * @param {string} options.workspace - ワークスペースパス
   * @param {string} [options.cliPath] - Gemini CLI の実行パス（省略時は 'gemini'）
   * @param {boolean} [options.autoRestart] - クラッシュ時の自動再起動（デフォルト: false）
   * @param {number} [options.restartDelay] - 再起動までの待機時間（ms）（デフォルト: 1000）
   * @param {number} [options.maxRestarts] - 最大再起動回数（デフォルト: 3）
   */
  constructor(options = {}) {
    super();

    if (!options.workspace) {
      throw new Error('Workspace path is required');
    }

    this.workspace = path.resolve(options.workspace);
    this.cliPath = options.cliPath || 'gemini';
    this.autoRestart = options.autoRestart || false;
    this.restartDelay = options.restartDelay || 1000;
    this.maxRestarts = options.maxRestarts || 3;
    this.defaultModel = options.model || process.env.GEMINI_CLI_MODEL || process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    this.fallbackModel = options.fallbackModel || 'gemini-2.5-flash-lite';
    this.requestTimeoutMs = Number.isFinite(Number(process.env.GEMINI_CLI_TIMEOUT_MS))
      ? Number(process.env.GEMINI_CLI_TIMEOUT_MS)
      : (options.requestTimeoutMs || 90000);

    this.process = null;
    this.state = ProcessState.STOPPED;
    this.restartCount = 0;
    this.outputBuffer = '';
  }

  emitDebug(message, meta) {
    this.emit('debug', { message, meta, ts: new Date().toISOString() });
  }

  /**
   * 現在の状態を取得
   * @returns {string} 現在の状態
   */
  getState() {
    return this.state;
  }

  /**
   * プロセスが実行中かどうか
   * @returns {boolean}
   */
  isRunning() {
    return this.state === ProcessState.RUNNING;
  }

  /**
   * Gemini CLI を起動
   * @returns {Promise<void>}
   */
  async start() {
    if (this.state === ProcessState.RUNNING || this.state === ProcessState.STARTING) {
      throw new Error('Gemini CLI is already running or starting');
    }

    this.state = ProcessState.STARTING;
    this.emit('stateChange', this.state);

    return new Promise((resolve, reject) => {
      try {
        // Gemini CLI を対話モードで起動（--yolo なし = 確認を求める）
        this.process = spawn(this.cliPath, [], {
          cwd: this.workspace,
          shell: true,
          stdio: ['pipe', 'pipe', 'pipe'],
          windowsHide: false,
          env: {
            ...process.env,
            // 強制的に色なし出力（パース用）
            NO_COLOR: '1',
            FORCE_COLOR: '0',
            // TTY を偽装しない
            TERM: 'dumb'
          }
        });

        // 標準出力の処理
        this.process.stdout.on('data', (data) => {
          const output = data.toString();
          this.outputBuffer += output;
          this.emit('stdout', output);
          this.emit('output', { type: 'stdout', data: output });
        });

        // 標準エラーの処理
        this.process.stderr.on('data', (data) => {
          const output = data.toString();
          this.emit('stderr', output);
          this.emit('output', { type: 'stderr', data: output });
        });

        // プロセス終了時の処理
        this.process.on('close', (code, signal) => {
          const wasRunning = this.state === ProcessState.RUNNING;
          this.state = ProcessState.STOPPED;
          this.process = null;

          this.emit('close', { code, signal });
          this.emit('stateChange', this.state);

          // 正常終了時は再起動カウントをリセット
          if (code === 0) {
            this.restartCount = 0;
            return;
          }

          // 予期しない終了時の自動再起動
          if (wasRunning && this.autoRestart && this.restartCount < this.maxRestarts) {
            this.restartCount++;
            this.emit('restarting', { attempt: this.restartCount, maxRestarts: this.maxRestarts });

            setTimeout(() => {
              this.start().catch(err => {
                this.emit('error', err);
              });
            }, this.restartDelay);
          }
        });

        // エラー発生時の処理
        this.process.on('error', (err) => {
          this.state = ProcessState.ERROR;
          this.emit('error', err);
          this.emit('stateChange', this.state);
          reject(err);
        });

        // 起動成功（少し待ってから成功とみなす）
        // 実際にはプロセスが起動したらすぐに RUNNING とする
        this.process.on('spawn', () => {
          this.state = ProcessState.RUNNING;
          // 注: restartCount は正常終了時のみリセット（close イベントで処理）
          this.emit('started');
          this.emit('stateChange', this.state);
          resolve();
        });

      } catch (err) {
        this.state = ProcessState.ERROR;
        this.emit('error', err);
        this.emit('stateChange', this.state);
        reject(err);
      }
    });
  }

  /**
   * Gemini CLI を停止
   * @param {boolean} [force=false] - 強制終了するか
   * @returns {Promise<void>}
   */
  async stop(force = false) {
    if (!this.process || this.state === ProcessState.STOPPED) {
      return;
    }

    this.state = ProcessState.STOPPING;
    this.emit('stateChange', this.state);

    return new Promise((resolve) => {
      const cleanup = () => {
        this.process = null;
        this.state = ProcessState.STOPPED;
        this.emit('stopped');
        this.emit('stateChange', this.state);
        resolve();
      };

      // close イベントを待つ
      this.process.once('close', cleanup);

      if (force) {
        this.process.kill('SIGKILL');
      } else {
        // 正常終了を試みる
        this.process.kill('SIGTERM');

        // 5秒待っても終了しない場合は強制終了
        setTimeout(() => {
          if (this.process) {
            this.process.kill('SIGKILL');
          }
        }, 5000);
      }
    });
  }

  /**
   * Gemini CLI を再起動
   * @returns {Promise<void>}
   */
  async restart() {
    await this.stop();
    await this.start();
  }

  /**
   * メッセージを送信（標準入力に書き込み）
   * @param {string} message - 送信するメッセージ
   * @returns {boolean} 送信成功したか
   */
  send(message) {
    if (!this.process || this.state !== ProcessState.RUNNING) {
      throw new Error('Gemini CLI is not running');
    }

    try {
      // 改行を追加して送信
      const messageWithNewline = message.endsWith('\n') ? message : message + '\n';
      this.process.stdin.write(messageWithNewline);
      this.emit('sent', message);
      return true;
    } catch (err) {
      this.emit('error', err);
      return false;
    }
  }

  /**
   * 単発のプロンプトを実行（非対話モード）
   * @param {string} prompt - 実行するプロンプト
   * @returns {Promise<string>} 出力結果
   */
  async executePrompt(prompt) {
    const baseArgs = [
      '-p',
      prompt,
      '--output-format',
      'text',
      // 非対話モードでは拡張機能を無効化して長時間常駐を避ける
      '--extensions',
      'none',
      // プレビューを避けるため安定版モデルを指定
      '--model',
      this.defaultModel
    ];

    const redactArgs = (args) => {
      const redacted = [...args];
      for (let i = 0; i < redacted.length; i++) {
        if (redacted[i] === '-p' || redacted[i] === '--prompt') {
          const next = redacted[i + 1];
          const len = typeof next === 'string' ? next.length : 0;
          redacted[i + 1] = `<prompt:${len}>`;
          i += 1;
        }
      }
      return redacted;
    };

    const runPrompt = (extraArgs = []) => new Promise((resolve, reject) => {
      let output = '';
      let errorOutput = '';
      const args = [...baseArgs, ...extraArgs];
      let settled = false;
      let timeoutId = null;

      this.emitDebug('executePrompt:spawn', { args: redactArgs(args) });
      const proc = spawn(this.cliPath, args, {
        cwd: this.workspace,
        shell: true,
        env: {
          ...process.env,
          NO_COLOR: '1',
          FORCE_COLOR: '0'
        }
      });

      proc.on('spawn', () => {
        this.emitDebug('executePrompt:spawned', { pid: proc.pid });
      });

      const finalize = (err) => {
        if (settled) return;
        settled = true;
        if (timeoutId) clearTimeout(timeoutId);
        proc.stdout?.removeListener('data', onStdout);
        proc.stderr?.removeListener('data', onStderr);
        if (err) reject(err);
        else resolve(output);
      };

      const onStdout = (data) => {
        if (settled) return;
        const text = data.toString();
        output += text;
        this.emit('stdout', text);
        this.emit('output', { type: 'stdout', data: text });
      };

      const onStderr = (data) => {
        if (settled) return;
        const text = data.toString();
        errorOutput += text;
        this.emit('stderr', text);
        this.emit('output', { type: 'stderr', data: text });
      };

      timeoutId = setTimeout(() => {
        this.emitDebug('executePrompt:timeout', { timeoutMs: this.requestTimeoutMs });
        const timeoutError = new Error(`Request timed out after ${this.requestTimeoutMs}ms`);
        timeoutError.code = 'REQUEST_TIMEOUT';
        try {
          if (process.platform === 'win32' && proc.pid) {
            spawn('taskkill', ['/pid', String(proc.pid), '/T', '/F']);
          }
        } catch (e) {
          this.emitDebug('executePrompt:timeout:taskkill:error', { message: e.message });
        }
        try {
          proc.kill('SIGKILL');
        } catch (e) {
          // ignore
        }
        finalize(timeoutError);
      }, this.requestTimeoutMs);

      proc.stdout.on('data', onStdout);
      proc.stderr.on('data', onStderr);

      proc.on('close', (code) => {
        if (settled) {
          this.emitDebug('executePrompt:close', { code, late: true });
          return;
        }
        this.emitDebug('executePrompt:close', { code });
        if (code === 0) {
          finalize();
        } else {
          finalize(new Error(errorOutput || `Process exited with code ${code}`));
        }
      });

      proc.on('error', (err) => {
        this.emitDebug('executePrompt:error', { message: err.message });
        finalize(err);
      });
    });

    try {
      this.emitDebug('executePrompt:start', { length: prompt ? prompt.length : 0 });
      return await runPrompt();
    } catch (err) {
      const message = err?.message || '';
      const isCapacityError = /MODEL_CAPACITY_EXHAUSTED|No capacity available|RESOURCE_EXHAUSTED|status 429|exhausted your capacity|quota will reset|rateLimitExceeded/i.test(message);
      if (!isCapacityError) {
        throw err;
      }

      // 容量枯渇時は軽量モデルにフォールバック
      const fallbackModel = this.fallbackModel;
      if (!fallbackModel || fallbackModel === this.defaultModel) {
        throw err;
      }
      this.emitDebug('executePrompt:fallback', { model: fallbackModel });
      this.emit('stderr', `Model capacity exhausted. Falling back to ${fallbackModel}...`);
      this.emit('output', { type: 'stderr', data: `Model capacity exhausted. Falling back to ${fallbackModel}...\n` });

      return runPrompt(['--model', fallbackModel]);
    }
  }

  /**
   * 出力バッファをクリア
   */
  clearBuffer() {
    this.outputBuffer = '';
  }

  /**
   * 出力バッファを取得
   * @returns {string}
   */
  getBuffer() {
    return this.outputBuffer;
  }

  /**
   * ワークスペースパスを取得
   * @returns {string}
   */
  getWorkspace() {
    return this.workspace;
  }

  /**
   * 再起動カウントをリセット
   */
  resetRestartCount() {
    this.restartCount = 0;
  }
}

// 状態定数をエクスポート
GeminiCLIManager.ProcessState = ProcessState;

module.exports = GeminiCLIManager;
