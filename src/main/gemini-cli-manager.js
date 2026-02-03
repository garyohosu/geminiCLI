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

    this.process = null;
    this.state = ProcessState.STOPPED;
    this.restartCount = 0;
    this.outputBuffer = '';
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
          env: {
            ...process.env,
            // 必要に応じて環境変数を設定
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
