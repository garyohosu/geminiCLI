/**
 * Path Validator - ワークスペース外へのアクセスを防ぐ
 * 
 * セキュリティ要件:
 * - ワークスペース外のパスは一切許可しない
 * - シンボリックリンク/ジャンクションでの脱出を防ぐ
 * - パストラバーサル攻撃（../../../etc/passwd等）をブロック
 * - Windowsのパス形式（バックスラッシュ、ドライブレター）に対応
 */

const path = require('path');
const fs = require('fs');

class PathValidator {
  constructor(workspace) {
    if (!workspace) {
      throw new Error('Workspace path is required');
    }

    // ワークスペースの実体パスを取得（シンボリックリンク解決）
    try {
      this.workspaceRealPath = fs.realpathSync(workspace);
    } catch (error) {
      throw new Error(`Invalid workspace path: ${workspace} - ${error.message}`);
    }

    // パス区切り文字を正規化（Windows: \\ → /）
    this.workspaceRealPath = this.normalizePath(this.workspaceRealPath);
  }

  /**
   * パスを正規化（Windows/Unix両対応）
   */
  normalizePath(inputPath) {
    // バックスラッシュをスラッシュに統一
    return inputPath.replace(/\\/g, '/');
  }

  /**
   * パスがワークスペース内かを検証
   * 
   * @param {string} inputPath - 検証するパス（相対または絶対）
   * @returns {string} - 検証済みの絶対パス
   * @throws {Error} - ワークスペース外の場合
   */
  validate(inputPath) {
    if (!inputPath) {
      throw new Error('Path cannot be empty');
    }

    // 1. 相対パスを絶対パスに変換
    const absolutePath = path.resolve(this.workspaceRealPath, inputPath);
    
    let realPath;
    try {
      // 2. 実体パスを取得（シンボリックリンク解決）
      realPath = fs.realpathSync(absolutePath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // ファイルが存在しない場合は、親ディレクトリで検証
        const parentDir = path.dirname(absolutePath);
        
        // 親ディレクトリが存在する場合
        if (fs.existsSync(parentDir)) {
          const parentRealPath = fs.realpathSync(parentDir);
          const normalizedParent = this.normalizePath(parentRealPath);
          
          // 親ディレクトリがワークスペース内かチェック
          if (!this.isInsideWorkspace(normalizedParent)) {
            throw new Error('PATH_OUTSIDE_WORKSPACE: Parent directory is outside workspace');
          }
          
          // 親が安全なら、元のパスを返す
          return absolutePath;
        } else {
          // 親ディレクトリも存在しない場合は再帰的にチェック
          this.validate(parentDir);
          return absolutePath;
        }
      }
      throw error;
    }

    // 3. 正規化
    const normalizedRealPath = this.normalizePath(realPath);

    // 4. ワークスペース内かチェック
    if (!this.isInsideWorkspace(normalizedRealPath)) {
      throw new Error(`PATH_OUTSIDE_WORKSPACE: ${inputPath} resolves to ${realPath}`);
    }

    return realPath;
  }

  /**
   * パスがワークスペース内かを判定
   */
  isInsideWorkspace(normalizedPath) {
    // 完全一致（ワークスペースルート自体）
    if (normalizedPath === this.workspaceRealPath) {
      return true;
    }

    // 接頭辞として含まれているか + パス区切り文字で始まるか
    // これにより /workspace と /workspace-other の誤判定を防ぐ
    return normalizedPath.startsWith(this.workspaceRealPath + '/');
  }

  /**
   * 複数のパスを一括検証
   */
  validateBatch(paths) {
    return paths.map(p => this.validate(p));
  }

  /**
   * ワークスペースのルートパスを取得
   */
  getWorkspaceRoot() {
    return this.workspaceRealPath;
  }
}

module.exports = PathValidator;
