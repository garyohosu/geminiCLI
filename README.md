# Gemini CLI GUI Wrapper

**無料で使える AIエージェント型ファイル管理ツール for Windows**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Platform: Windows](https://img.shields.io/badge/Platform-Windows%2010%2F11-blue.svg)](https://www.microsoft.com/windows)

## 📖 概要

Gemini CLI GUI Wrapper は、Google の無料 Gemini CLI を使って、プログラミング知識がない人でも AI エージェントの力を借りてファイル操作を自動化できる Windows デスクトップアプリです。

**「Claude Cowork」の非プログラマー版** として、自然言語で指示するだけで、ファイルの整理・編集・検索などを安全に実行できます。

## ✨ 特徴

- 🆓 **完全無料**: Gemini API の無料枠（1日1500リクエスト）で利用可能
- 🤖 **AIエージェント**: 会話から必要な操作を自動判断・実行
- 🛡️ **安全設計**: ワークスペース内のみ操作、破壊的操作は承認必須
- 💬 **簡単操作**: CLI知識不要、チャットするだけ
- 🎯 **初心者向け**: 直感的なGUI、日本語対応

## 🎯 こんな人におすすめ

- **事務職**: 大量の請求書PDFを自動で整理したい
- **教師**: 生徒のレポートからデータを抽出したい
- **フリーランス**: 写真を日付別に自動で分類したい
- **ブロガー**: 記事ファイルからタイトル一覧を作りたい
- **学生**: レポートファイルを一括リネームしたい

## 🚀 使い方の例

```
あなた: 「このフォルダの写真を日付別に整理して」

AI: 「承知しました。現在のファイルを確認します...
     25個の写真ファイルを発見しました。
     2024年12月の写真を '2024-12' フォルダに移動します。」

[操作プレビューが表示される]

あなた: [実行する] ボタンをクリック

AI: 「完了しました！25個のファイルを移動しました。」
```

## 📥 インストール

### システム要件
- Windows 10 / 11 (64bit)
- メモリ 4GB以上推奨
- インターネット接続

### インストール手順

1. [GitHub Releases](https://github.com/yourusername/gemini-cli-gui-wrapper/releases) から最新版をダウンロード
2. `GeminiCLI-GUI-Setup-1.0.0.exe` を実行
3. インストールウィザードに従ってインストール
4. 初回起動時に Google アカウントで認証

## 📚 ドキュメント

- **[AGENTS.md](./AGENTS.md)**: AIエージェント向けの詳細な実装ガイド
- **[spec_corrected.md](./spec_corrected.md)**: プロジェクトの完全な仕様書
- **[CHANGELOG.md](./CHANGELOG.md)**: 変更履歴

### AIエージェント向けドキュメント

このプロジェクトで作業するAIエージェント（Claude、Gemini等）は、まず以下のドキュメントを読んでください：

- **[AGENTS.md](./AGENTS.md)**: 必読。実装ガイド、技術スタック、開発フロー
- **[CLAUDE.md](./CLAUDE.md)**: Claude AI向けの追加情報
- **[GEMINI.md](./GEMINI.md)**: Gemini AI向けの追加情報

## 🔐 セキュリティ

- ✅ ワークスペース外へのアクセスを完全にブロック
- ✅ すべてのパスを検証（シンボリックリンク対策済み）
- ✅ 破壊的操作は必ず事前承認
- ✅ 操作ログを自動保存

## 🛣️ ロードマップ

### v1.0（現在開発中）
- [x] 基本設計完了
- [ ] 技術検証（M0）
- [ ] MVP実装（M1）
- [ ] 公開準備（M2）

### v2.0（将来）
- [ ] サンドボックス内でのコード実行
- [ ] Git操作サポート
- [ ] Mac/Linux版
- [ ] クラウド連携

## 📝 ライセンス

MIT License - 詳細は [LICENSE](./LICENSE) をご覧ください。

## 🤝 コントリビューション

Issue や Pull Request を歓迎します！

開発に参加する前に、[AGENTS.md](./AGENTS.md) をご確認ください。

## 📞 お問い合わせ

- GitHub Issues: [Issues](https://github.com/yourusername/gemini-cli-gui-wrapper/issues)
- Twitter: [@yourhandle](https://twitter.com/yourhandle)

## 🙏 謝辞

- [Google Gemini CLI](https://github.com/google-gemini/gemini-cli) - 無料のAIエージェントCLI
- [Electron](https://www.electronjs.org/) - クロスプラットフォームデスクトップアプリフレームワーク

---

**無料でここまでできるのは、今のところ Gemini CLI だけ！**
