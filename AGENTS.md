# AGENTS.md - AI Agent Development Guide

このドキュメントは、Gemini CLI GUI Wrapper プロジェクトで作業する **AIエージェント**（Claude、Gemini、その他のコーディングAI）向けの実装ガイドです。

## 🎯 プロジェクト概要

### 目的
プログラマー以外のアマチュアユーザー向けに、無料の Gemini CLI をラップした安全なファイル操作GUIアプリを作る。

### 参考
- **類似製品**: Claude Cowork（プログラマー向け）
- **ターゲット**: 非プログラマー（事務職、教師、フリーランス等）
- **差別化**: 完全無料、安全設計、初心者向けUI

## 📋 必読ドキュメント

開発を始める前に、以下のドキュメントを順番に読んでください：

1. **[README.md](./README.md)**: プロジェクトの概要、インストール方法
2. **[spec.md](./spec.md)**: 完全な仕様書（最重要）
3. **[CHANGELOG.md](./CHANGELOG.md)**: 変更履歴

## ⚠️ 重要：変更履歴の記録

**何かを変更した場合は、必ず [CHANGELOG.md](./CHANGELOG.md) に変更内容を追記してください。**

これにより：
- 開発の進捗が追跡できる
- 次回作業時に前回の変更内容を思い出せる
- チーム（人間・AI問わず）で変更内容を共有できる

記録すべき変更：
- ✅ 新機能の追加
- ✅ バグ修正
- ✅ ドキュメント更新
- ✅ 依存関係の変更
- ✅ 設定ファイルの変更
- ✅ リファクタリング

記録方法は [CHANGELOG.md](./CHANGELOG.md) のフォーマットに従ってください。

## 💻 GenSpark AIエージェント ↔ ローカルCLIツール 連携方法

このプロジェクトは、**GenSpark AIエージェント**と**ローカルPCのCLIツール**（Claude Code、Codex CLI、Gemini CLI等）が協力して開発します。

### 🔄 ワークフロー全体像

```
1. 🌐 GenSpark AIエージェントが instructions/ に指示書を作成
        ↓
2. 📤 GitHubにpush（instructions/ファイルをコミット）
        ↓
3. 📥 ローカルPCで git pull を実行
        ↓
4. 💻 ローカルCLIツール（Claude/Codex/Gemini）が instructions/ を読む
        ↓
5. 🔨 ローカルCLIツールがタスクを実行（実装・テスト・コミット）
        ↓
6. 📝 ローカルCLIツールが results/ に結果を出力
        ↓
7. 📤 GitHubにpush（results/ファイルをコミット）
        ↓
8. 🌐 GenSpark AIエージェントが git pull して results/ を確認
        ↓
9. ✅ 成功/失敗を判定 → 次のタスクへ
```

### 📥 指示書の作成（GenSpark AIエージェント側）

**GenSpark AIエージェント → ローカルCLIツール**

GenSpark AIエージェントは `instructions/` フォルダに指示書（Markdownファイル）を作成し、GitHubにpushします。

**指示ファイルの命名規則:**
```
instructions/YYYYMMDD-HHMM-<タスク名>.md
例: instructions/20260203-1430-implement-gemini-cli.md
```

**指示ファイルの構造（必須項目）:**
```markdown
# タスク: [タスク名]

## 目的
[このタスクで達成したいこと]

## 要件
- [ ] 要件1
- [ ] 要件2
- [ ] 要件3

## 実装ファイル
- src/main/xxx.js (新規作成)
- tests/unit/xxx.test.js (新規作成)

## 結果の出力先
results/20260203-1430-implement-gemini-cli-result.md

## 参考資料
- spec.md のセクションX
- AGENTS.md の「開発フロー」

## 期限
YYYY年MM月DD日まで

## 重要事項
- 必ず results/ フォルダに結果を出力すること
- 実装後は必ず git add, git commit, git push すること
- CHANGELOG.md を更新すること
```

**⚠️ 重要：GenSpark AIエージェントがやること**
1. `instructions/` にMarkdownファイルを作成
2. `git add instructions/`
3. `git commit -m "task: Add instruction for XXX"`
4. `git push`
5. ローカルCLIツールの実行完了を待つ
6. `git pull` して `results/` を確認

### 📤 結果の出力（ローカルCLIツール側）

**ローカルCLIツール → GenSpark AIエージェント**

ローカルCLIツール（Claude Code等）は、以下の手順で作業します：

**手順:**
```bash
# 1. 最新の指示を取得
git pull

# 2. instructions/ フォルダの指示書を確認
ls instructions/

# 3. 指示書を読んで実装
cat instructions/20260203-1430-implement-gemini-cli.md

# 4. 実装・テスト・コミット
# （ローカルCLIツールが自動で実行）

# 5. 結果を results/ に出力
# （指示書に書かれた出力先に結果ファイルを作成）

# 6. 変更をpush
git add .
git commit -m "feat: Implement XXX"
git push
```

**結果ファイルの命名規則:**
```
results/YYYYMMDD-HHMM-<タスク名>-result.md
例: results/20260203-1430-implement-gemini-cli-result.md
```

**結果ファイルの構造（必須項目）:**
```markdown
# タスク結果: [タスク名]

## ステータス
✅ 完了 / ⚠️ 部分完了 / ❌ 未完了

## 実装内容
- [実装した機能の説明]

## 変更ファイル
- 新規: path/to/file.js (行数)
- 更新: path/to/existing.js (変更内容)
- 削除: path/to/old.js

## テスト結果
✅ すべてのテストが合格 (XX/XX)
または
❌ テスト失敗 (XX/XX) - エラー内容

## コミット情報
- コミットハッシュ: [hash]
- コミットメッセージ: "[message]"

## 次のステップ（推奨）
1. [次にやるべきこと]
2. [次にやるべきこと]

## 問題点・課題
- [発生した問題や疑問点]
- [GenSpark AIエージェントへの質問]

## 所要時間
約XX分

## 備考
[その他の情報]
```

### 📂 ディレクトリ構造

```
gemini-cli-gui-wrapper/
├── instructions/          # 🌐 GenSpark → 💻 ローカルCLI
│   ├── 20260203-1430-implement-gemini-cli.md
│   └── 20260205-0900-add-ui-components.md
└── results/               # 💻 ローカルCLI → 🌐 GenSpark
    ├── 20260203-1430-implement-gemini-cli-result.md
    └── 20260205-0900-add-ui-components-result.md
```

### ✅ ベストプラクティス

**GenSpark AIエージェント側:**
- 指示は具体的かつ明確に書く
- 結果の出力先ファイル名を必ず指定
- 「git push すること」を明記
- 複雑なタスクは分割する
- results/ を確認したら、指示書は削除してOK（またはアーカイブ）

**ローカルCLIツール側:**
- 必ず `git pull` してから作業開始
- 指示書に書かれた出力先に結果ファイルを作成
- 結果ファイルは必ず生成する（失敗した場合も）
- コードを変更したら必ず CHANGELOG.md を更新
- 必ず `git push` して GenSpark に結果を伝える

### 🚨 注意事項

**⚠️ Git管理について:**
- `instructions/` と `results/` は **Git管理に含める**（`.gitignore`に追加しない）
- これにより、GenSparkとローカルCLIが連携可能

**⚠️ ファイル管理:**
- 完了したタスクの指示書・結果は定期的にアーカイブ
- または削除して整理
- 重要な情報は README.md や spec.md に反映

**⚠️ セキュリティ:**
- APIキーや機密情報は絶対に書かない
- パスワードやトークンは環境変数で管理

## 🏗️ 技術スタック

### フロントエンド
- **Electron**: デスクトップアプリフレームワーク
- **React** または **Vue.js**: UIフレームワーク（検討中）
- **Tailwind CSS**: スタイリング

### バックエンド（Electron Main）
- **Node.js**: 実行環境
- **子プロセス管理**: Gemini CLI の起動・監視
- **ファイルシステムAPI**: パス検証、ファイル操作

### AI連携
- **Gemini CLI**: Google提供の無料AIエージェントCLI
- **標準入出力**: stdin/stdoutでGemini CLIと通信

### テスト
- **Jest**: 単体テスト
- **Playwright**: E2Eテスト
- **セキュリティテスト**: パストラバーサル攻撃への耐性

## 📁 プロジェクト構造（予定）

```
gemini-cli-gui-wrapper/
├── README.md                    # プロジェクト概要
├── AGENTS.md                    # このファイル（AIエージェント向け）
├── CLAUDE.md                    # Claude AI向け追加情報
├── GEMINI.md                    # Gemini AI向け追加情報
├── CHANGELOG.md                 # 変更履歴
├── LICENSE                      # ライセンス
├── spec_corrected.md            # 仕様書
├── package.json                 # npm設定
├── .gitignore                   # Git除外設定
├── src/
│   ├── main/                    # Electron Main プロセス
│   │   ├── index.js             # エントリーポイント
│   │   ├── gemini-cli.js        # Gemini CLI管理
│   │   ├── file-api.js          # 安全なファイル操作API
│   │   ├── path-validator.js   # パス検証ロジック
│   │   └── ipc-handlers.js      # IPC通信ハンドラ
│   ├── renderer/                # Electron Renderer プロセス
│   │   ├── index.html           # メインHTML
│   │   ├── App.jsx              # メインReactコンポーネント
│   │   ├── components/          # UIコンポーネント
│   │   │   ├── ChatWindow.jsx   # チャット画面
│   │   │   ├── FileTree.jsx     # ファイルツリー
│   │   │   ├── DiffViewer.jsx   # 差分表示
│   │   │   └── ApprovalDialog.jsx # 承認ダイアログ
│   │   └── styles/              # CSS
│   └── preload/                 # Preloadスクリプト
│       └── index.js             # IPC bridge
├── tests/
│   ├── unit/                    # 単体テスト
│   │   ├── path-validator.test.js
│   │   └── file-api.test.js
│   ├── e2e/                     # E2Eテスト
│   │   └── basic-flow.test.js
│   └── security/                # セキュリティテスト
│       └── path-traversal.test.js
└── build/                       # ビルド設定
    └── installer.nsh            # インストーラー設定
```

## 🔧 開発環境セットアップ

### 前提条件
- Node.js 18.x 以上
- npm または yarn
- Git

### セットアップ手順

```bash
# リポジトリをクローン
git clone https://github.com/yourusername/gemini-cli-gui-wrapper.git
cd gemini-cli-gui-wrapper

# 依存関係をインストール
npm install

# Gemini CLIをインストール（開発用）
npm install -g @google/gemini-cli

# 開発サーバーを起動
npm run dev
```

## 🚀 開発フロー

### マイルストーン

#### M0: 技術検証（2週間）
**目標**: 基本的な技術要素の動作確認

- [ ] Gemini CLI の子プロセス起動
- [ ] 標準入出力の監視・パース
- [ ] Electron + IPC の基本実装
- [ ] パス検証ロジックの実装
- [ ] 簡単なread/write操作

**成果物**:
- `src/main/gemini-cli.js`: Gemini CLI管理モジュール
- `src/main/path-validator.js`: パス検証モジュール
- `tests/unit/path-validator.test.js`: 単体テスト

#### M1: MVP（4週間）
**目標**: 最小限の動作するアプリ

- [ ] チャットUI実装
- [ ] ファイルツリー表示
- [ ] list/read/write/move 操作
- [ ] 承認フロー（基本版）
- [ ] diff表示

**成果物**:
- 動作するElectronアプリ
- 基本的なファイル操作デモ

#### M2: v1.0に向けて（6週間）
**目標**: 公開可能な品質

- [ ] delete/copy/zip操作
- [ ] 操作ログ
- [ ] エラーハンドリング強化
- [ ] セキュリティテスト
- [ ] 大量操作時の進捗表示

**成果物**:
- インストーラー
- ドキュメント完備
- GitHub Releases 準備完了

## 🛡️ セキュリティ重要事項

### パス検証ロジック（最重要）

すべてのファイル操作で以下を実施：

```javascript
const path = require('path');
const fs = require('fs');

function validatePath(inputPath, workspace) {
  try {
    // 1. 絶対パス化
    const absPath = path.resolve(workspace, inputPath);
    
    // 2. 実体パス取得（シンボリックリンク解決）
    const realPath = fs.realpathSync(absPath);
    const workspaceReal = fs.realpathSync(workspace);
    
    // 3. ワークスペース内かチェック
    // path.sepを追加して、接頭辞の部分一致を防ぐ
    if (!realPath.startsWith(workspaceReal + path.sep) && realPath !== workspaceReal) {
      throw new Error('PATH_OUTSIDE_WORKSPACE');
    }
    
    return realPath;
  } catch (error) {
    if (error.code === 'ENOENT') {
      // ファイルが存在しない場合は、親ディレクトリで検証
      const parentDir = path.dirname(inputPath);
      validatePath(parentDir, workspace);
      return path.resolve(workspace, inputPath);
    }
    throw error;
  }
}
```

### テストケース

以下の攻撃パターンをすべてブロックすること：

```javascript
// パストラバーサル攻撃
validatePath('../../../Windows/System32', workspace); // → エラー
validatePath('..\\..\\..\\Windows\\System32', workspace); // → エラー

// 絶対パス指定
validatePath('C:\\Windows\\System32', workspace); // → エラー

// シンボリックリンク経由
// workspace内に悪意あるシンボリックリンクがあっても、
// realpathで実体パスを取得するため安全
```

## 📝 コーディング規約

### ファイル命名
- **ケバブケース**: `file-api.js`, `path-validator.js`
- **Reactコンポーネント**: PascalCase `ChatWindow.jsx`

### コミットメッセージ
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type**:
- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント
- `style`: フォーマット
- `refactor`: リファクタリング
- `test`: テスト追加
- `chore`: その他

**例**:
```
feat(file-api): Add safe file write operation with path validation

- Implement validatePath function
- Add unit tests for path traversal prevention
- Support Windows path separators

Closes #123
```

### コードスタイル
- **ESLint**: `eslint:recommended` を使用
- **Prettier**: 自動フォーマット
- **インデント**: 2スペース
- **セミコロン**: 必須

## 🧪 テスト戦略

### 単体テスト（Jest）

```javascript
// tests/unit/path-validator.test.js
describe('validatePath', () => {
  it('should allow paths inside workspace', () => {
    const result = validatePath('subfolder/file.txt', workspace);
    expect(result).toContain(workspace);
  });

  it('should reject paths outside workspace', () => {
    expect(() => {
      validatePath('../../../etc/passwd', workspace);
    }).toThrow('PATH_OUTSIDE_WORKSPACE');
  });

  it('should resolve symlinks and validate real path', () => {
    // シンボリックリンクのテスト
  });
});
```

### E2Eテスト（Playwright）

```javascript
// tests/e2e/basic-flow.test.js
test('basic file operation flow', async ({ page }) => {
  // 1. アプリ起動
  await page.goto('http://localhost:3000');
  
  // 2. ワークスペース選択
  await page.click('[data-testid="select-workspace"]');
  
  // 3. チャットで依頼
  await page.fill('[data-testid="chat-input"]', 'test.txtを作成して');
  await page.press('[data-testid="chat-input"]', 'Enter');
  
  // 4. 承認ダイアログが表示される
  await page.waitForSelector('[data-testid="approval-dialog"]');
  
  // 5. 実行
  await page.click('[data-testid="execute-button"]');
  
  // 6. 完了確認
  await page.waitForSelector('[data-testid="success-message"]');
});
```

## 🐛 デバッグ方法

### Electron Main プロセス
```bash
# Chrome DevToolsでデバッグ
npm run dev -- --inspect
```

### Renderer プロセス
- F12でChrome DevToolsを開く

### ログ出力
```javascript
// src/main/index.js
const log = require('electron-log');

log.info('Application started');
log.error('Error occurred:', error);
```

## 📦 ビルド・リリース

### 開発ビルド
```bash
npm run build
```

### プロダクションビルド
```bash
npm run build:prod
```

### インストーラー作成
```bash
npm run dist
```

### GitHub Releases
```bash
# タグを作成
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# GitHub Actionsが自動でビルド・リリース
```

## 🚨 注意事項（AIエージェント向け）

### やること
✅ spec_corrected.md を常に参照  
✅ セキュリティを最優先  
✅ パス検証を必ず実施  
✅ テストを書く  
✅ コミットメッセージを丁寧に

### やらないこと
❌ ワークスペース外へのアクセス  
❌ パス検証の省略  
❌ テストなしでのマージ  
❌ 仕様書と矛盾する実装  
❌ セキュリティリスクのある実装

## 📚 参考リソース

### ドキュメント
- [Electron公式ドキュメント](https://www.electronjs.org/docs/latest/)
- [Gemini CLI GitHub](https://github.com/google-gemini/gemini-cli)
- [Node.js Path API](https://nodejs.org/api/path.html)
- [Node.js File System API](https://nodejs.org/api/fs.html)

### セキュリティ
- [OWASP Path Traversal](https://owasp.org/www-community/attacks/Path_Traversal)
- [Electron Security Checklist](https://www.electronjs.org/docs/latest/tutorial/security)

## 🤝 質問・相談

実装中に不明点があれば、以下を確認してください：

1. **spec_corrected.md**: 仕様の詳細
2. **GitHub Issues**: 既存の議論
3. **この AGENTS.md**: 実装ガイドライン

それでも解決しない場合は、Issueを立ててください。

---

**Happy Coding! 🚀**
