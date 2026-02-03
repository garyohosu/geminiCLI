/**
 * Path Validator のテスト
 * セキュリティ最重要：ワークスペース外へのアクセスを完全にブロック
 */

const PathValidator = require('../../src/main/path-validator');
const path = require('path');
const fs = require('fs');
const os = require('os');

describe('PathValidator', () => {
  let tempWorkspace;
  let validator;

  beforeEach(() => {
    // テスト用の一時ワークスペースを作成
    tempWorkspace = fs.mkdtempSync(path.join(os.tmpdir(), 'test-workspace-'));
    validator = new PathValidator(tempWorkspace);

    // テスト用のディレクトリ構造を作成
    fs.mkdirSync(path.join(tempWorkspace, 'subfolder'));
    fs.writeFileSync(path.join(tempWorkspace, 'file.txt'), 'test');
    fs.writeFileSync(path.join(tempWorkspace, 'subfolder', 'nested.txt'), 'nested');
  });

  afterEach(() => {
    // テスト後にクリーンアップ
    if (fs.existsSync(tempWorkspace)) {
      fs.rmSync(tempWorkspace, { recursive: true, force: true });
    }
  });

  describe('Constructor', () => {
    test('should initialize with valid workspace', () => {
      expect(validator.getWorkspaceRoot()).toBeTruthy();
      expect(fs.existsSync(validator.getWorkspaceRoot())).toBe(true);
    });

    test('should throw error with invalid workspace', () => {
      expect(() => {
        new PathValidator('/nonexistent/path/12345');
      }).toThrow();
    });

    test('should throw error with empty workspace', () => {
      expect(() => {
        new PathValidator('');
      }).toThrow('Workspace path is required');
    });
  });

  describe('validate() - 正常系', () => {
    test('should allow workspace root itself', () => {
      const result = validator.validate('.');
      expect(result).toBeTruthy();
    });

    test('should allow files inside workspace', () => {
      const result = validator.validate('file.txt');
      expect(result).toContain('file.txt');
    });

    test('should allow nested files', () => {
      const result = validator.validate('subfolder/nested.txt');
      expect(result).toContain('nested.txt');
    });

    test('should allow relative paths with ./', () => {
      const result = validator.validate('./file.txt');
      expect(result).toContain('file.txt');
    });

    test('should allow subdirectory navigation', () => {
      const result = validator.validate('subfolder/../file.txt');
      expect(result).toContain('file.txt');
    });

    test('should allow non-existent files in workspace', () => {
      const result = validator.validate('newfile.txt');
      expect(result).toContain('newfile.txt');
    });
  });

  describe('validate() - 攻撃パターン（すべてブロック）', () => {
    test('should block parent directory traversal (../)', () => {
      expect(() => {
        validator.validate('../');
      }).toThrow('PATH_OUTSIDE_WORKSPACE');
    });

    test('should block multiple parent traversal (../../../)', () => {
      expect(() => {
        validator.validate('../../../');
      }).toThrow('PATH_OUTSIDE_WORKSPACE');
    });

    test('should block absolute paths outside workspace', () => {
      expect(() => {
        validator.validate('/etc/passwd');
      }).toThrow('PATH_OUTSIDE_WORKSPACE');
    });

    test('should block Windows system paths', () => {
      if (process.platform === 'win32') {
        expect(() => {
          validator.validate('C:\\Windows\\System32');
        }).toThrow('PATH_OUTSIDE_WORKSPACE');
      }
    });

    test('should block parent escape via backslash', () => {
      expect(() => {
        validator.validate('..\\..\\..\\etc\\passwd');
      }).toThrow('PATH_OUTSIDE_WORKSPACE');
    });

    test('should block complex traversal attempts', () => {
      expect(() => {
        validator.validate('subfolder/../../outside.txt');
      }).toThrow('PATH_OUTSIDE_WORKSPACE');
    });
  });

  describe('validate() - シンボリックリンク対策', () => {
    test('should resolve symlinks and validate real path', () => {
      // Unix系でのみテスト
      if (process.platform !== 'win32') {
        const linkPath = path.join(tempWorkspace, 'link-to-file');
        fs.symlinkSync(path.join(tempWorkspace, 'file.txt'), linkPath);

        const result = validator.validate('link-to-file');
        expect(result).toContain('file.txt');
      }
    });

    test('should block symlinks pointing outside workspace', () => {
      if (process.platform !== 'win32') {
        const outsideFile = path.join(os.tmpdir(), 'outside.txt');
        fs.writeFileSync(outsideFile, 'outside');

        const linkPath = path.join(tempWorkspace, 'malicious-link');
        fs.symlinkSync(outsideFile, linkPath);

        expect(() => {
          validator.validate('malicious-link');
        }).toThrow('PATH_OUTSIDE_WORKSPACE');

        // クリーンアップ
        fs.unlinkSync(outsideFile);
      }
    });
  });

  describe('validateBatch()', () => {
    test('should validate multiple paths', () => {
      const paths = ['file.txt', 'subfolder/nested.txt', 'newfile.txt'];
      const results = validator.validateBatch(paths);
      
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toBeTruthy();
      });
    });

    test('should throw on first invalid path in batch', () => {
      const paths = ['file.txt', '../outside.txt', 'valid.txt'];
      
      expect(() => {
        validator.validateBatch(paths);
      }).toThrow('PATH_OUTSIDE_WORKSPACE');
    });
  });

  describe('Edge cases', () => {
    test('should throw error for empty path', () => {
      expect(() => {
        validator.validate('');
      }).toThrow('Path cannot be empty');
    });

    test('should handle paths with spaces', () => {
      const fileWithSpace = path.join(tempWorkspace, 'file with space.txt');
      fs.writeFileSync(fileWithSpace, 'test');

      const result = validator.validate('file with space.txt');
      expect(result).toContain('file with space.txt');
    });

    test('should handle paths with special characters', () => {
      const specialFile = path.join(tempWorkspace, 'file@#$.txt');
      fs.writeFileSync(specialFile, 'test');

      const result = validator.validate('file@#$.txt');
      expect(result).toContain('file@#$.txt');
    });
  });
});
