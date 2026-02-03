/**
 * Safe File API - パス検証済みのファイル操作API
 * 
 * すべてのファイル操作は PathValidator を通して検証される
 * ワークスペース外へのアクセスは一切許可しない
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const PathValidator = require('./path-validator');

class FileAPI {
  constructor(workspace) {
    this.validator = new PathValidator(workspace);
    this.workspace = this.validator.getWorkspaceRoot();
  }

  /**
   * ファイル一覧を取得
   */
  async list(dirPath = '.') {
    const validPath = this.validator.validate(dirPath);
    
    try {
      const items = await fs.readdir(validPath, { withFileTypes: true });
      
      return items.map(item => ({
        name: item.name,
        path: path.join(dirPath, item.name),
        isDirectory: item.isDirectory(),
        isFile: item.isFile()
      }));
    } catch (error) {
      throw new Error(`Failed to list directory: ${error.message}`);
    }
  }

  /**
   * ファイル内容を読み込み（テキスト）
   */
  async readText(filePath, encoding = 'utf-8') {
    const validPath = this.validator.validate(filePath);
    
    try {
      const content = await fs.readFile(validPath, encoding);
      return content;
    } catch (error) {
      throw new Error(`Failed to read file: ${error.message}`);
    }
  }

  /**
   * ファイルに書き込み
   */
  async writeText(filePath, content, mode = 'overwrite') {
    const validPath = this.validator.validate(filePath);
    
    try {
      if (mode === 'append') {
        await fs.appendFile(validPath, content, 'utf-8');
      } else {
        await fs.writeFile(validPath, content, 'utf-8');
      }
      
      return { success: true, path: validPath };
    } catch (error) {
      throw new Error(`Failed to write file: ${error.message}`);
    }
  }

  /**
   * ディレクトリを作成
   */
  async mkdir(dirPath, recursive = false) {
    const validPath = this.validator.validate(dirPath);
    
    try {
      await fs.mkdir(validPath, { recursive });
      return { success: true, path: validPath };
    } catch (error) {
      throw new Error(`Failed to create directory: ${error.message}`);
    }
  }

  /**
   * ファイル/ディレクトリを移動
   */
  async move(srcPath, dstPath) {
    const validSrc = this.validator.validate(srcPath);
    const validDst = this.validator.validate(dstPath);
    
    try {
      await fs.rename(validSrc, validDst);
      return { success: true, from: validSrc, to: validDst };
    } catch (error) {
      throw new Error(`Failed to move: ${error.message}`);
    }
  }

  /**
   * ファイル/ディレクトリをコピー
   */
  async copy(srcPath, dstPath) {
    const validSrc = this.validator.validate(srcPath);
    const validDst = this.validator.validate(dstPath);
    
    try {
      const stat = await fs.stat(validSrc);
      
      if (stat.isDirectory()) {
        // ディレクトリの再帰的コピー
        await this.copyDirectory(validSrc, validDst);
      } else {
        // ファイルコピー
        await fs.copyFile(validSrc, validDst);
      }
      
      return { success: true, from: validSrc, to: validDst };
    } catch (error) {
      throw new Error(`Failed to copy: ${error.message}`);
    }
  }

  /**
   * ディレクトリを再帰的にコピー
   */
  async copyDirectory(src, dst) {
    await fs.mkdir(dst, { recursive: true });
    const items = await fs.readdir(src, { withFileTypes: true });
    
    for (const item of items) {
      const srcPath = path.join(src, item.name);
      const dstPath = path.join(dst, item.name);
      
      if (item.isDirectory()) {
        await this.copyDirectory(srcPath, dstPath);
      } else {
        await fs.copyFile(srcPath, dstPath);
      }
    }
  }

  /**
   * ファイル/ディレクトリを削除
   */
  async delete(targetPath, recursive = false) {
    const validPath = this.validator.validate(targetPath);
    
    try {
      const stat = await fs.stat(validPath);
      
      if (stat.isDirectory()) {
        await fs.rm(validPath, { recursive, force: true });
      } else {
        await fs.unlink(validPath);
      }
      
      return { success: true, path: validPath };
    } catch (error) {
      throw new Error(`Failed to delete: ${error.message}`);
    }
  }

  /**
   * ファイル情報を取得
   */
  async getInfo(filePath) {
    const validPath = this.validator.validate(filePath);
    
    try {
      const stat = await fs.stat(validPath);
      
      return {
        path: filePath,
        size: stat.size,
        isDirectory: stat.isDirectory(),
        isFile: stat.isFile(),
        created: stat.birthtime,
        modified: stat.mtime,
        accessed: stat.atime
      };
    } catch (error) {
      throw new Error(`Failed to get file info: ${error.message}`);
    }
  }

  /**
   * ファイル名で検索
   */
  async searchByName(pattern, dirPath = '.') {
    const validPath = this.validator.validate(dirPath);
    const results = [];
    
    await this.searchRecursive(validPath, pattern, results, dirPath);
    
    return results;
  }

  /**
   * 再帰的にファイルを検索
   */
  async searchRecursive(currentPath, pattern, results, relativeTo) {
    try {
      const items = await fs.readdir(currentPath, { withFileTypes: true });
      
      for (const item of items) {
        const fullPath = path.join(currentPath, item.name);
        const relativePath = path.relative(this.validator.validate(relativeTo), fullPath);
        
        // パターンマッチ（シンプルな部分一致）
        if (item.name.includes(pattern)) {
          results.push({
            name: item.name,
            path: relativePath,
            isDirectory: item.isDirectory()
          });
        }
        
        // ディレクトリの場合は再帰的に検索
        if (item.isDirectory()) {
          await this.searchRecursive(fullPath, pattern, results, relativeTo);
        }
      }
    } catch (error) {
      // アクセス権限エラー等は無視して続行
      console.warn(`Skipping directory: ${error.message}`);
    }
  }

  /**
   * ファイルが存在するか確認
   */
  async exists(filePath) {
    try {
      const validPath = this.validator.validate(filePath);
      await fs.access(validPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * ワークスペースのルートパスを取得
   */
  getWorkspace() {
    return this.workspace;
  }
}

module.exports = FileAPI;
