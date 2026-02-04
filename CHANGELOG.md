# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **🐛 セッションタイムアウト改善タスク作成** (2026-02-04)
  - `instructions/20260204-0750-session-timeout-fix.md`: セッションタイムアウト問題の分析と修正方針
  - **問題**: Gemini CLI の応答が毎回2分かかる
  - **原因**: セッションタイムアウト(5秒)が短すぎて、毎回フォールバックで新プロセス起動
  - **解決策**: タイムアウトを5秒→60秒に延長、セッション再利用を実現
  - **期待効果**: 2回目以降の応答時間を2分→5-10秒に短縮 (90%改善)

- **🎉🎉🎉 M0 技術検証フェーズ: 100% 完了!** (2026-02-03)
  - **総コード行数**: 3,624 行 (Phase 4 実装後 +753行)
  - **総テストケース**: 102 テスト (Unit: 85 + E2E: 17)
  - **総ドキュメントファイル**: 30+ ファイル
  - **総コミット数**: 16 コミット
  - **開発期間**: 1日完結!

- **🎉 Phase 4: 仕上げと配布準備** (2026-02-03)
  - **E2E テスト基盤**
    - `playwright.config.js`: Playwright 設定
    - `tests/e2e/app.e2e.test.js`: 17+ E2E テストケース
    - アプリ起動、UI 要素、初期状態のテスト
  - **操作承認フロー（Diff プレビュー）**
    - `src/renderer/diff-viewer.js`: Diff Viewer コンポーネント
    - `src/main/index.js`: diff プレビュー IPC ハンドラー追加
    - モーダルダイアログでの変更プレビュー
    - 承認/キャンセル機能
  - **インストーラー準備**
    - `package.json`: electron-builder 設定追加
    - NSIS インストーラー設定
    - ポータブル版設定
    - `build/README.md`: アイコン作成ガイド
  - **npm scripts 追加**
    - `test:e2e`: Playwright E2E テスト
    - `build`: Windows インストーラー生成
    - `build:portable`: ポータブル版生成
- **Progress Update**: M0 技術検証 100% 完了

- **🎉 Basic Electron Application Implementation** (2026-02-03)
  - `src/main/index.js`: Electron メインプロセス（~280行）
    - ウィンドウ管理
    - IPC ハンドラー（workspace, gemini, file 操作）
    - GeminiCLIManager 統合
    - セキュリティ設定（contextIsolation, sandbox）
  - `src/preload/preload.js`: Preload スクリプト（~100行）
    - contextBridge による安全な API 公開
    - イベントリスナー登録/解除機能
  - `src/renderer/index.html`: UI HTML（~100行）
    - ワークスペース選択
    - Gemini CLI 制御パネル
    - チャット入出力エリア
    - ファイルツリー表示
  - `src/renderer/renderer.js`: UI JavaScript（~250行）
    - イベントハンドリング
    - 状態管理
    - 出力表示（タイムスタンプ付き）
  - `src/renderer/style.css`: スタイル（~280行）
    - モダンな UI デザイン
    - ダークテーマの出力ログ
    - レスポンシブレイアウト
- **Progress Update**: M0 技術検証 80% 完了（+20%）
- instructions/20260203-1708-mcp-gemini-windows.md（MCP Windows 対応の作業指示）

- **🎉 Gemini CLI Manager Implementation Complete** (2026-02-03)
  - `src/main/gemini-cli-manager.js`: 266行の実装完了
  - `tests/unit/gemini-cli-manager.test.js`: 571行、35テストケース（全て成功）
  - プロセス制御: start/stop/restart/forceStop
  - 通信機能: send(message)、stdout/stderr/output イベント
  - 自動再起動機能（autoRestart、maxRestarts）
  - Windows対応（バックスラッシュパス、日本語パス）
  - イベント駆動アーキテクチャ
- **Progress Update**: M0 技術検証 60% 完了（+10%）
- **Next Task**: 基本 Electron アプリケーション実装
  - 指示書作成: `instructions/20260203-0350-implement-electron-app.md`
  - Main プロセス、Preload、Renderer の実装
  - IPC 通信の設定
  - 最小限のチャットUI

### Changed
- Dev モード時に Electron の userData をプロジェクト配下の `.electron-userdata` に固定し、Windows のキャッシュ権限エラーを回避
- `.electron-userdata/` を Git 管理対象外に追加
- 非対話プロンプト実行時に `--extensions none` と `--output-format text` を付与し、拡張の常駐によるハングを回避
- UI で表示する Gemini CLI のノイズログ（認証キャッシュ/Hook 初期化）を抑制
- 429 (MODEL_CAPACITY_EXHAUSTED) で失敗した場合は安定版モデルへフォールバックし、UI では短い警告に要約
- DevTools 由来の `dragEvent is not defined` ノイズを抑制
- フリーズ調査用に main/renderer の進行ログを追加し、`app:log` を UI に表示
- 容量/クォータ枯渇のリトライログを要約表示し、フォールバック判定に追加
- 非対話実行のデフォルトモデルを安定版 `gemini-2.5-flash` に固定し、タイムアウトで中断する仕組みを追加
- タイムアウト後の遅延出力を抑止し、プロンプト内容はログで伏字化
- GEMINI_E2E=1 でのみ実行される Gemini CLI 実通信テストを追加
- 子プロセスの入出力検証用に `scripts/ipc-echo-*.js` を追加
- Gemini CLI 起動/応答時間を測る `scripts/gemini-startup-probe.js` を追加
- Gemini CLI `--version` の起動時間を測る `scripts/gemini-version-probe.js` を追加
- MCP stdio サーバーとの疎通検証用に `scripts/mcp-stdio-probe.js` を追加
- MCP 疎通テストで `gemini-mcp-tool` が Windows の `spawn` (shell false) により `gemini` / `echo` を解決できず ENOENT になる課題を確認

### Added (Previous)
- **🎉 GitHub Push Success**: Successfully pushed 7 commits to GitHub
  - All core functionality and documentation now available on GitHub
  - Repository URL: https://github.com/garyohosu/geminiCLI
- **CI/CD Pipeline** (Pending local PC completion):
  - `.github/workflows/ci.yml`: CI configuration with test, lint, and build jobs (to be added from local PC)
  - Multi-version Node.js testing (18.x, 20.x)
  - Windows-specific testing on pull requests
  - Code coverage upload to Codecov
  - **Note**: GitHub App `workflows` permission restriction prevents direct push from GenSpark
- **Development Tools Configuration** (Prepared, pending local PC push):
  - `.eslintrc.js`: ESLint configuration for code quality
  - `.prettierrc`: Prettier configuration for code formatting
  - Enhanced npm scripts in `package.json`:
    - `test:coverage`: Generate test coverage reports
    - `test:security`: Run security-focused tests
    - `lint:fix`: Auto-fix linting issues
    - `prepare`: Husky setup for git hooks
- **Documentation Updates**:
  - Comprehensive `README.md` with project overview, quickstart, and workflow
  - CI status badge and license badge
  - Project structure and development guidelines
  - Updated repository URL to `https://github.com/garyohosu/geminiCLI.git`
  - `PUSH_REQUEST.md`: Push request documentation
  - `CI_CD_SETUP_COMPLETE.md`: Complete CI/CD setup report
  - `instructions/20260203-0329-add-cicd-workflow.md`: Instructions for adding CI/CD files from local PC

### Added (Previous)
- Initial project setup
- Project specification documents
  - `spec.md`: Initial specification (draft)
  - `spec_revised.md`: Revised specification (API-based approach)
  - `spec_corrected.md`: Final specification (CLI-based approach)
- Documentation structure
  - `README.md`: Project overview and quick start
  - `AGENTS.md`: Comprehensive guide for AI agents (with CHANGELOG update requirement)
  - `CLAUDE.md`: Claude AI specific instructions
  - `GEMINI.md`: Gemini AI specific instructions
  - `CHANGELOG.md`: This file
- **M0 (Technical Validation) - Started 2026-02-03**
  - `package.json`: Node.js project configuration with Electron, Jest, Playwright
  - Project directory structure: `src/{main,renderer,preload}`, `tests/{unit,e2e,security}`
  - **Core Security Module**: `src/main/path-validator.js`
    - Workspace boundary enforcement
    - Symlink/junction escape prevention
    - Path traversal attack mitigation
    - Windows/Unix path compatibility
  - **Safe File Operations**: `src/main/file-api.js`
    - Path-validated file operations (list, read, write, move, copy, delete)
    - Recursive directory operations
    - File search functionality
    - All operations restricted to workspace
  - **Test Suite**: Comprehensive unit tests
    - `tests/unit/path-validator.test.js`: 30+ security test cases
    - `tests/unit/file-api.test.js`: Full coverage of file operations
    - Attack pattern validation (path traversal, symlink escape, etc.)
  - `jest.config.js`: Jest test configuration
- **Workflow System**: GenSpark AI ↔ Local CLI collaboration workflow
  - `instructions/` folder: GenSpark AI → Local CLI task instructions
  - `results/` folder: Local CLI → GenSpark AI task results
  - README files in both folders with templates and guidelines
  - **Git-tracked** (not in .gitignore) for cross-environment communication
  - Documented in AGENTS.md with detailed workflow explanation
  - GenSpark creates instructions, Local CLI executes and reports results
- **Development Environment Information**:
  - GenSpark AI: Linux sandbox (cannot test Windows-specific features)
  - Local PC: Windows 11 64bit (can perform real device testing)
  - Added Windows environment testing guidelines to AGENTS.md
  - Documented Windows-specific test cases and manual testing requirements

### Context
- Project goal: Create a GUI wrapper for Gemini CLI targeting non-programmers
- Target users: Amateur users (office workers, teachers, freelancers) who want AI agent capabilities without CLI knowledge
- Inspiration: Claude Cowork (for programmers) → This project (for non-programmers)
- Key insight: Gemini CLI already has AI agent capabilities (file operations, command execution)

### Design Decisions
- **Architecture**: Electron-based desktop app wrapping Gemini CLI
- **Security**: Workspace-only file operations with strict path validation
- **UX**: Approval flow for destructive operations (preview → approve → execute)
- **Platform**: Windows 10/11 (64bit) for v1.0

### Next Steps
- [ ] M0: Technical validation (2 weeks)
  - Gemini CLI subprocess management
  - stdin/stdout monitoring and parsing
  - Path validation implementation
  - Basic file operations
- [ ] M1: MVP implementation (4 weeks)
  - Chat UI
  - File tree viewer
  - Basic operations (list/read/write/move)
  - Approval flow
- [ ] M2: v1.0 preparation (6 weeks)
  - Complete operations (delete/copy/zip)
  - Security testing
  - Installer creation
  - Documentation

## [0.0.0] - 2026-02-03

### Added
- Git repository initialization
- Initial specification document (`spec.md`)
- Specification review and iteration
- Final specification (`spec_corrected.md`)

---

## Version History Summary

- **v0.0.0** (2026-02-03): Project inception, specification phase
- **v1.0.0** (Target: Q2 2026): First public release

## Contributing

Please read [AGENTS.md](./AGENTS.md) before contributing to this project.
