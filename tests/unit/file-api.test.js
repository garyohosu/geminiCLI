/**
 * File API のテスト
 */

const FileAPI = require('../../src/main/file-api');
const path = require('path');
const fs = require('fs');
const os = require('os');

describe('FileAPI', () => {
  let tempWorkspace;
  let fileAPI;

  beforeEach(() => {
    // テスト用の一時ワークスペースを作成
    tempWorkspace = fs.mkdtempSync(path.join(os.tmpdir(), 'test-fileapi-'));
    fileAPI = new FileAPI(tempWorkspace);

    // テスト用のファイル構造を作成
    fs.mkdirSync(path.join(tempWorkspace, 'folder1'));
    fs.mkdirSync(path.join(tempWorkspace, 'folder2'));
    fs.writeFileSync(path.join(tempWorkspace, 'file1.txt'), 'content1');
    fs.writeFileSync(path.join(tempWorkspace, 'file2.txt'), 'content2');
    fs.writeFileSync(path.join(tempWorkspace, 'folder1', 'nested.txt'), 'nested content');
  });

  afterEach(() => {
    // クリーンアップ
    if (fs.existsSync(tempWorkspace)) {
      fs.rmSync(tempWorkspace, { recursive: true, force: true });
    }
  });

  describe('list()', () => {
    test('should list files in workspace root', async () => {
      const items = await fileAPI.list('.');
      
      expect(items.length).toBeGreaterThan(0);
      expect(items.some(item => item.name === 'file1.txt')).toBe(true);
      expect(items.some(item => item.name === 'folder1')).toBe(true);
    });

    test('should list files in subdirectory', async () => {
      const items = await fileAPI.list('folder1');
      
      expect(items.some(item => item.name === 'nested.txt')).toBe(true);
    });

    test('should throw error for path outside workspace', async () => {
      await expect(fileAPI.list('../')).rejects.toThrow();
    });
  });

  describe('readText()', () => {
    test('should read file content', async () => {
      const content = await fileAPI.readText('file1.txt');
      expect(content).toBe('content1');
    });

    test('should read nested file', async () => {
      const content = await fileAPI.readText('folder1/nested.txt');
      expect(content).toBe('nested content');
    });

    test('should throw error for non-existent file', async () => {
      await expect(fileAPI.readText('nonexistent.txt')).rejects.toThrow();
    });
  });

  describe('writeText()', () => {
    test('should write new file', async () => {
      const result = await fileAPI.writeText('newfile.txt', 'new content');
      
      expect(result.success).toBe(true);
      
      const content = fs.readFileSync(path.join(tempWorkspace, 'newfile.txt'), 'utf-8');
      expect(content).toBe('new content');
    });

    test('should overwrite existing file', async () => {
      await fileAPI.writeText('file1.txt', 'overwritten');
      
      const content = await fileAPI.readText('file1.txt');
      expect(content).toBe('overwritten');
    });

    test('should append to file', async () => {
      await fileAPI.writeText('file1.txt', ' appended', 'append');
      
      const content = await fileAPI.readText('file1.txt');
      expect(content).toBe('content1 appended');
    });
  });

  describe('mkdir()', () => {
    test('should create new directory', async () => {
      const result = await fileAPI.mkdir('newfolder');
      
      expect(result.success).toBe(true);
      expect(fs.existsSync(path.join(tempWorkspace, 'newfolder'))).toBe(true);
    });

    test('should create nested directories with recursive option', async () => {
      const result = await fileAPI.mkdir('a/b/c', true);
      
      expect(result.success).toBe(true);
      expect(fs.existsSync(path.join(tempWorkspace, 'a', 'b', 'c'))).toBe(true);
    });
  });

  describe('move()', () => {
    test('should move file', async () => {
      const result = await fileAPI.move('file1.txt', 'moved.txt');
      
      expect(result.success).toBe(true);
      expect(fs.existsSync(path.join(tempWorkspace, 'moved.txt'))).toBe(true);
      expect(fs.existsSync(path.join(tempWorkspace, 'file1.txt'))).toBe(false);
    });

    test('should move file to subdirectory', async () => {
      await fileAPI.move('file1.txt', 'folder2/file1.txt');
      
      expect(fs.existsSync(path.join(tempWorkspace, 'folder2', 'file1.txt'))).toBe(true);
    });
  });

  describe('copy()', () => {
    test('should copy file', async () => {
      const result = await fileAPI.copy('file1.txt', 'copied.txt');
      
      expect(result.success).toBe(true);
      expect(fs.existsSync(path.join(tempWorkspace, 'copied.txt'))).toBe(true);
      expect(fs.existsSync(path.join(tempWorkspace, 'file1.txt'))).toBe(true);
      
      const originalContent = await fileAPI.readText('file1.txt');
      const copiedContent = await fileAPI.readText('copied.txt');
      expect(originalContent).toBe(copiedContent);
    });

    test('should copy directory recursively', async () => {
      await fileAPI.copy('folder1', 'folder1-copy');
      
      expect(fs.existsSync(path.join(tempWorkspace, 'folder1-copy'))).toBe(true);
      expect(fs.existsSync(path.join(tempWorkspace, 'folder1-copy', 'nested.txt'))).toBe(true);
    });
  });

  describe('delete()', () => {
    test('should delete file', async () => {
      const result = await fileAPI.delete('file1.txt');
      
      expect(result.success).toBe(true);
      expect(fs.existsSync(path.join(tempWorkspace, 'file1.txt'))).toBe(false);
    });

    test('should delete empty directory', async () => {
      fs.mkdirSync(path.join(tempWorkspace, 'empty'));
      
      await fileAPI.delete('empty', true);
      
      expect(fs.existsSync(path.join(tempWorkspace, 'empty'))).toBe(false);
    });

    test('should delete directory with contents', async () => {
      await fileAPI.delete('folder1', true);
      
      expect(fs.existsSync(path.join(tempWorkspace, 'folder1'))).toBe(false);
    });
  });

  describe('getInfo()', () => {
    test('should get file information', async () => {
      const info = await fileAPI.getInfo('file1.txt');
      
      expect(info.path).toBe('file1.txt');
      expect(info.size).toBeGreaterThan(0);
      expect(info.isFile).toBe(true);
      expect(info.isDirectory).toBe(false);
      expect(info.created).toBeInstanceOf(Date);
      expect(info.modified).toBeInstanceOf(Date);
    });

    test('should get directory information', async () => {
      const info = await fileAPI.getInfo('folder1');
      
      expect(info.isDirectory).toBe(true);
      expect(info.isFile).toBe(false);
    });
  });

  describe('searchByName()', () => {
    test('should find files by name pattern', async () => {
      const results = await fileAPI.searchByName('file1');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.name === 'file1.txt')).toBe(true);
    });

    test('should search recursively', async () => {
      const results = await fileAPI.searchByName('nested');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.name === 'nested.txt')).toBe(true);
    });

    test('should return empty array when no matches', async () => {
      const results = await fileAPI.searchByName('nonexistent');
      
      expect(results).toEqual([]);
    });
  });

  describe('exists()', () => {
    test('should return true for existing file', async () => {
      const exists = await fileAPI.exists('file1.txt');
      expect(exists).toBe(true);
    });

    test('should return false for non-existent file', async () => {
      const exists = await fileAPI.exists('nonexistent.txt');
      expect(exists).toBe(false);
    });
  });

  describe('Security - Path validation', () => {
    test('should block operations outside workspace', async () => {
      await expect(fileAPI.readText('../outside.txt')).rejects.toThrow();
      await expect(fileAPI.writeText('../outside.txt', 'test')).rejects.toThrow();
      await expect(fileAPI.delete('../outside.txt')).rejects.toThrow();
    });
  });
});
