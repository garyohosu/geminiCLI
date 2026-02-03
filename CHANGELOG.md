# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
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
