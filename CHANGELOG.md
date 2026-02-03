# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Gemini CLI Manager Module**: `src/main/gemini-cli-manager.js`
  - `GeminiCLIManager` クラスを実装
  - 子プロセス（spawn）でGemini CLIを起動・管理
  - 標準入出力のストリーミング通信
  - プロセスの起動・停止・再起動機能
  - 自動再起動機能（autoRestart オプション）
  - イベントエミッター（started, stopped, stdout, stderr, error, close等）
  - 出力バッファ管理
- **Unit Tests**: `tests/unit/gemini-cli-manager.test.js`
  - 35テストケースを追加
  - コンストラクタ、状態管理、イベント、入出力のテスト
  - Windows固有のテスト（バックスラッシュパス、日本語パス対応）

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
