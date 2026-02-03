# Gemini CLI GUI Wrapper

![CI Status](https://github.com/garyohosu/geminiCLI/workflows/CI%20-%20Test%20%26%20Lint/badge.svg)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**🎯 完全無料で使えるAIエージェント for 非プログラマー**

Gemini CLI を安全にラップしたGUIアプリケーション。CLI操作が苦手な一般ユーザー（事務職・教師・フリーランス等）でも、チャット形式でファイル操作を安全に実行できます。

---

## 🌟 特徴

- **✨ 完全無料**: Gemini CLI の無料枠を活用（1日1500リクエスト）
- **🛡️ 安全設計**: ワークスペース外の操作を完全ブロック
- **👨‍💼 初心者向け**: CLI不要、チャットUIで直感的に操作
- **🤖 AIエージェント**: Claude Cowork の非プログラマー版

---

## 🚀 クイックスタート

### 前提条件

- Windows 10/11 (64bit)
- Node.js 18.x 以上
- Gemini CLI（初回起動時にセットアップ案内）

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/garyohosu/geminiCLI.git
cd geminiCLI

# 依存関係をインストール
npm install

# 開発モードで起動
npm run dev
```

---

## 📖 ドキュメント

| ファイル | 用途 |
|---------|------|
| **[README.md](./README.md)** | プロジェクト概要（このファイル） |
| **[AGENTS.md](./AGENTS.md)** | AIエージェント向け開発ガイド（最重要） |
| **[spec.md](./spec.md)** | 完全な技術仕様書 |
| **[CHANGELOG.md](./CHANGELOG.md)** | 変更履歴 |
| **[CLAUDE.md](./CLAUDE.md)** | Claude AI 向け指示 |
| **[GEMINI.md](./GEMINI.md)** | Gemini AI 向け指示 |

---

## 🎯 ユースケース

### 事務職の方
- 請求書PDFを日付別にフォルダ分け
- エクセルファイルから特定の情報を抽出

### 教師の方
- 生徒のレポートをクラス別に整理
- 提出物の一覧を自動作成

### フリーランスの方
- 撮影した写真を日付・イベント別に整理
- プロジェクトファイルの命名規則を一括適用

### ブロガーの方
- 記事タイトルの一覧を自動生成
- 画像ファイルをカテゴリ別に整理

---

## 🏗️ プロジェクト構造

```
gemini-cli-gui-wrapper/
├── src/
│   ├── main/              # Electron メインプロセス
│   │   ├── path-validator.js   # パス検証（セキュリティの要）
│   │   └── file-api.js         # 安全なファイル操作API
│   ├── renderer/          # Electron レンダラープロセス（UI）
│   └── preload/           # Preload スクリプト
├── tests/
│   ├── unit/              # 単体テスト
│   ├── e2e/               # E2Eテスト
│   └── security/          # セキュリティテスト
├── instructions/          # 🌐 GenSpark → 💻 ローカルCLI
│   └── YYYYMMDD-HHMM-taskname.md
├── results/               # 💻 ローカルCLI → 🌐 GenSpark
│   └── YYYYMMDD-HHMM-taskname-result.md
└── docs/                  # 旧仕様書アーカイブ
```

---

## 🧪 テスト

```bash
# 単体テストを実行
npm test

# ウォッチモードでテスト
npm run test:watch

# カバレッジレポートを生成
npm run test:coverage

# セキュリティテストのみ実行
npm run test:security
```

---

## 🔧 開発

### AI-Human 協働ワークフロー

このプロジェクトは **GenSpark AI エージェント** と **ローカルCLIツール** (Claude Code / Gemini CLI) の協働で開発されます。

#### 🌐 GenSpark AI → 💻 ローカルCLI

1. GenSpark AI が `instructions/` に指示書を作成
2. `git push` して指示を送信
3. ローカルPCで `git pull` して指示を取得
4. ローカルCLI (Claude Code / Gemini CLI) が実装
5. `results/` に結果を出力して `git push`
6. GenSpark AI が `git pull` して結果を確認

詳細は [AGENTS.md](./AGENTS.md) を参照してください。

---

## 📊 進捗状況

### M0 技術検証: **40% 完了**

- ✅ プロジェクトセットアップ
- ✅ パス検証ロジック（260行、30+テスト）
- ✅ ファイル操作API（235行、全操作網羅）
- ✅ セキュリティテスト完備
- ✅ CI/CD パイプライン構築
- 🚧 Gemini CLI統合（次フェーズ）
- 🚧 基本Electronアプリ
- 🚧 E2Eテスト基盤

---

## 🤝 コントリビューション

プルリクエストを歓迎します！以下の手順でご協力ください：

1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'feat: Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

詳細は [AGENTS.md](./AGENTS.md) をご確認ください。

---

## 📜 ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。詳細は [LICENSE](./LICENSE) をご覧ください。

---

## 🔗 関連リンク

- [Gemini CLI 公式](https://github.com/google/generative-ai-cli)
- [note記事: Gemini CLI の使い方](https://note.com/hantani/n/n461ce66e0807)
- [Claude Cowork](https://claude.ai/cowork)

---

## 🙏 謝辞

- **Gemini CLI チーム**: 素晴らしいAIエージェント機能を提供してくださり感謝します
- **Claude AI**: 開発支援にご協力いただきありがとうございます
- **すべてのコントリビューター**: このプロジェクトを支えてくださり感謝します

---

**Made with ❤️ for non-programmers who want AI agent capabilities**
