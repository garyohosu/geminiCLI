/**
 * Diff Viewer Component
 *
 * ファイル変更のプレビューと承認フローを管理
 */

class DiffViewer {
  constructor() {
    this.modal = null;
    this.resolvePromise = null;
    this.rejectPromise = null;
    this.createModal();
    this.setupEventListeners();
  }

  /**
   * モーダルダイアログを作成
   */
  createModal() {
    this.modal = document.createElement('div');
    this.modal.id = 'diff-modal';
    this.modal.className = 'modal hidden';
    this.modal.innerHTML = `
      <div class="modal-overlay"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h2>変更プレビュー</h2>
          <button id="diff-close-btn" class="modal-close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div id="diff-file-info" class="diff-file-info"></div>
          <div id="diff-stats" class="diff-stats"></div>
          <div id="diff-display" class="diff-display"></div>
        </div>
        <div class="modal-footer">
          <button id="diff-cancel-btn" class="btn btn-secondary">キャンセル</button>
          <button id="diff-approve-btn" class="btn btn-primary">承認して実行</button>
        </div>
      </div>
    `;
    document.body.appendChild(this.modal);
  }

  /**
   * イベントリスナーを設定
   */
  setupEventListeners() {
    // 承認ボタン
    this.modal.querySelector('#diff-approve-btn').addEventListener('click', () => {
      this.approve();
    });

    // キャンセルボタン
    this.modal.querySelector('#diff-cancel-btn').addEventListener('click', () => {
      this.cancel();
    });

    // 閉じるボタン
    this.modal.querySelector('#diff-close-btn').addEventListener('click', () => {
      this.cancel();
    });

    // オーバーレイクリックで閉じる
    this.modal.querySelector('.modal-overlay').addEventListener('click', () => {
      this.cancel();
    });

    // ESC キーで閉じる
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.modal.classList.contains('hidden')) {
        this.cancel();
      }
    });
  }

  /**
   * Diff を表示して承認を待つ
   * @param {Object} options - 表示オプション
   * @param {string} options.filePath - ファイルパス
   * @param {Object} options.diff - Diff データ
   * @param {string} options.operation - 操作タイプ ('write', 'delete', etc.)
   * @returns {Promise<boolean>} - 承認された場合 true
   */
  show(options) {
    const { filePath, diff, operation = 'write' } = options;

    // ファイル情報を表示
    const fileInfo = this.modal.querySelector('#diff-file-info');
    fileInfo.innerHTML = `
      <span class="file-path">${this.escapeHtml(filePath)}</span>
      <span class="operation-badge operation-${operation}">${this.getOperationLabel(operation)}</span>
    `;

    // 統計情報を表示
    const stats = this.calculateStats(diff);
    const statsDiv = this.modal.querySelector('#diff-stats');
    statsDiv.innerHTML = `
      <span class="stat stat-add">+${stats.additions} 追加</span>
      <span class="stat stat-remove">-${stats.deletions} 削除</span>
      <span class="stat stat-context">${stats.unchanged} 変更なし</span>
    `;

    // Diff を表示
    const diffDisplay = this.modal.querySelector('#diff-display');
    diffDisplay.innerHTML = this.formatDiff(diff);

    // モーダルを表示
    this.modal.classList.remove('hidden');

    // Promise を返す
    return new Promise((resolve, reject) => {
      this.resolvePromise = resolve;
      this.rejectPromise = reject;
    });
  }

  /**
   * 承認処理
   */
  approve() {
    this.hide();
    if (this.resolvePromise) {
      this.resolvePromise(true);
      this.resolvePromise = null;
      this.rejectPromise = null;
    }
  }

  /**
   * キャンセル処理
   */
  cancel() {
    this.hide();
    if (this.resolvePromise) {
      this.resolvePromise(false);
      this.resolvePromise = null;
      this.rejectPromise = null;
    }
  }

  /**
   * モーダルを非表示
   */
  hide() {
    this.modal.classList.add('hidden');
  }

  /**
   * Diff をフォーマット
   */
  formatDiff(diff) {
    if (!diff || !diff.changes || diff.changes.length === 0) {
      return '<div class="diff-empty">変更なし</div>';
    }

    let html = '<pre class="diff-content">';
    let lineNumber = 1;

    diff.changes.forEach((change, index) => {
      const lineNum = this.padLineNumber(lineNumber);

      if (change.type === 'add') {
        html += `<div class="diff-line diff-add"><span class="line-number">${lineNum}</span><span class="line-prefix">+</span><span class="line-content">${this.escapeHtml(change.line)}</span></div>`;
        lineNumber++;
      } else if (change.type === 'remove') {
        html += `<div class="diff-line diff-remove"><span class="line-number">  </span><span class="line-prefix">-</span><span class="line-content">${this.escapeHtml(change.line)}</span></div>`;
      } else {
        html += `<div class="diff-line diff-context"><span class="line-number">${lineNum}</span><span class="line-prefix"> </span><span class="line-content">${this.escapeHtml(change.line)}</span></div>`;
        lineNumber++;
      }
    });

    html += '</pre>';
    return html;
  }

  /**
   * 統計情報を計算
   */
  calculateStats(diff) {
    const stats = { additions: 0, deletions: 0, unchanged: 0 };

    if (diff && diff.changes) {
      diff.changes.forEach(change => {
        if (change.type === 'add') stats.additions++;
        else if (change.type === 'remove') stats.deletions++;
        else stats.unchanged++;
      });
    }

    return stats;
  }

  /**
   * 行番号をパディング
   */
  padLineNumber(num) {
    return String(num).padStart(4, ' ');
  }

  /**
   * 操作ラベルを取得
   */
  getOperationLabel(operation) {
    const labels = {
      write: '書き込み',
      delete: '削除',
      move: '移動',
      copy: 'コピー',
      rename: 'リネーム'
    };
    return labels[operation] || operation;
  }

  /**
   * HTML エスケープ
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// グローバルに公開
window.DiffViewer = DiffViewer;
