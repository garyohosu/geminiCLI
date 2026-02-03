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
  - `AGENTS.md`: Comprehensive guide for AI agents
  - `CLAUDE.md`: Claude AI specific instructions
  - `GEMINI.md`: Gemini AI specific instructions
  - `CHANGELOG.md`: This file

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
