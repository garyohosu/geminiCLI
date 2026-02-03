# Gemini CLI GUI Wrapper - ユーザーガイド

**バージョン**: 1.0.0  
**最終更新**: 2026-02-03

---

## 📖 目次

1. [はじめに](#はじめに)
2. [システム要件](#システム要件)
3. [インストール](#インストール)
4. [基本的な使い方](#基本的な使い方)
5. [機能詳細](#機能詳細)
6. [トラブルシューティング](#トラブルシューティング)
7. [FAQ](#faq)

---

## はじめに

Gemini CLI GUI Wrapper は、Gemini CLI を使いやすいグラフィカルインターフェースでラップしたアプリケーションです。CLI操作が苦手な方でも、チャット形式で簡単にファイル操作ができます。

### 主な特徴

- 🎯 **完全無料**: Gemini CLI の無料枠を活用
- 🛡️ **安全設計**: ワークスペース外の操作を完全ブロック
- 👨‍💼 **初心者向け**: CLI不要、チャットUIで直感的に操作
- 🤖 **AIエージェント**: ファイル操作をAIがサポート

---

## システム要件

### 必須環境

- **OS**: Windows 10/11 (64bit)
- **RAM**: 4GB以上推奨
- **ストレージ**: 500MB以上の空き容量
- **Node.js**: 18.x 以上（開発版のみ）

### 推奨環境

- **RAM**: 8GB以上
- **ディスプレイ**: 1920x1080以上

---

## インストール

### 方法 1: インストーラー版（推奨）

1. [GitHub Releases](https://github.com/garyohosu/geminiCLI/releases) から最新版をダウンロード
2. `GeminiCLI-Setup-1.0.0.exe` を実行
3. インストールウィザードに従って進める
4. デスクトップショートカットまたはスタートメニューから起動

### 方法 2: ポータブル版

1. [GitHub Releases](https://github.com/garyohosu/geminiCLI/releases) から `GeminiCLI-Portable-1.0.0.exe` をダウンロード
2. 任意のフォルダに配置
3. ダブルクリックで起動

### 方法 3: ソースからビルド（開発者向け）

```bash
git clone https://github.com/garyohosu/geminiCLI.git
cd geminiCLI
npm install
npm start
```

---

## 基本的な使い方

### 1. アプリケーションの起動

デスクトップショートカットまたはスタートメニューから「Gemini CLI GUI Wrapper」を起動します。

### 2. ワークスペースの選択

![ワークスペース選択](_screenshots/workspace-selection.png)

1. アプリ起動後、「ワークスペースを選択」ボタンをクリック
2. フォルダ選択ダイアログが表示される
3. 作業したいフォルダを選択
4. 選択したパスが表示される

**注意**: 選択したフォルダ内のファイルのみ操作可能です。

### 3. Gemini CLI の起動

![Gemini CLI 起動](_screenshots/gemini-start.png)

1. ワークスペース選択後、「Gemini CLI 起動」ボタンをクリック
2. ステータスインジケーターが「🔴 停止中」から「🟢 実行中」に変わる
3. 起動完了まで数秒待つ

### 4. メッセージの送信

![チャット操作](_screenshots/chat-interface.png)

1. 画面下部のチャット入力欄にメッセージを入力
2. 「送信」ボタンをクリック（または Enter キー）
3. 出力ログでレスポンスを確認

**例**:
```
list all files in current directory
```

### 5. ファイルツリーの確認

![ファイルツリー](_screenshots/file-tree.png)

画面左側のファイルツリーで、ワークスペース内のファイル構造を確認できます。

---

## 機能詳細

### ワークスペース管理

#### ワークスペースとは？

ワークスペースは、アプリが操作できるフォルダの範囲を限定するものです。セキュリティのため、選択したフォルダの外にあるファイルは操作できません。

#### ワークスペースの変更

1. Gemini CLI を停止
2. 「ワークスペースを選択」ボタンをクリック
3. 新しいフォルダを選択

### Gemini CLI 制御

#### 起動

- ボタン: 「Gemini CLI 起動」
- ショートカット: `Ctrl+S`

#### 停止

- ボタン: 「Gemini CLI 停止」
- ショートカット: `Ctrl+T`

#### 再起動

- ボタン: 「再起動」
- ショートカット: `Ctrl+R`

### チャット操作

#### メッセージ送信

- ボタン: 「送信」
- ショートカット: `Enter`

#### メッセージ例

**ファイル一覧の取得**:
```
list files
```

**ファイルの読み込み**:
```
read README.md
```

**ファイルの検索**:
```
find files containing "TODO"
```

**ファイルの作成**:
```
create a new file called test.txt with content "Hello World"
```

### 出力ログ

#### ログの色分け

- **緑色**: 標準出力（stdout）
- **赤色**: エラー出力（stderr）
- **黄色**: システムメッセージ

#### ログのクリア

「ログをクリア」ボタンをクリック

#### ログのコピー

出力ログ内のテキストを選択してコピー可能

---

## トラブルシューティング

### Gemini CLI が起動しない

#### 症状
「Gemini CLI 起動」ボタンをクリックしても起動しない

#### 原因と対処法

1. **Gemini CLI がインストールされていない**
   - 対処: Gemini CLI をインストール
   - 参考: [Gemini CLI 公式ドキュメント](https://github.com/google/generative-ai-cli)

2. **ワークスペースのパスが不正**
   - 対処: 正しいフォルダパスを選択し直す

3. **権限不足**
   - 対処: 管理者権限でアプリを実行

### 出力が表示されない

#### 症状
メッセージを送信しても出力ログに何も表示されない

#### 対処法

1. **アプリを再起動**
   - アプリを終了して再度起動

2. **ログを確認**
   - DevTools を開く（`Ctrl+Shift+I`）
   - Console タブでエラーを確認

3. **Gemini CLI を再起動**
   - 「停止」→「起動」を試す

### ファイル操作ができない

#### 症状
「Permission denied」などのエラーが表示される

#### 原因と対処法

1. **ワークスペース外のファイル**
   - 対処: ワークスペース内のファイルのみ操作可能

2. **ファイルが使用中**
   - 対処: 他のプログラムでファイルを開いていないか確認

3. **読み取り専用ファイル**
   - 対処: ファイルのプロパティを確認

### アプリが起動しない

#### 症状
ダブルクリックしても何も起動しない

#### 対処法

1. **Node.js のバージョン確認**（開発版のみ）
   ```bash
   node --version
   ```
   18.x 以上が必要

2. **依存関係の再インストール**（開発版のみ）
   ```bash
   npm install
   ```

3. **アプリの再インストール**
   - アンインストール → 再インストール

---

## FAQ

### Q1: Gemini CLI GUI Wrapper は無料ですか？

**A**: はい、完全無料です。Gemini CLI の無料枠（1日1500リクエスト）を活用しています。

### Q2: Mac や Linux でも使えますか？

**A**: 現在のバージョン（v1.0）は Windows のみ対応です。将来的に他のOSにも対応予定です。

### Q3: インターネット接続は必要ですか？

**A**: Gemini CLI が Google の API と通信するため、インターネット接続が必要です。

### Q4: どんなファイル操作ができますか？

**A**: 以下の操作が可能です：
- ファイル一覧の取得
- ファイルの読み込み
- ファイルの書き込み
- ファイルの移動・コピー
- ファイルの削除
- ファイルの検索
- zip の作成・展開

### Q5: 安全性は保証されていますか？

**A**: はい。以下のセキュリティ対策を実施しています：
- ワークスペース外のファイルアクセスを完全ブロック
- パストラバーサル攻撃の防止
- シンボリックリンク脱出の防止
- 85+ のテストケースで検証済み

### Q6: エラーが発生したらどうすればいいですか？

**A**: 以下の手順をお試しください：
1. アプリを再起動
2. [トラブルシューティング](#トラブルシューティング)を確認
3. それでも解決しない場合は [GitHub Issues](https://github.com/garyohosu/geminiCLI/issues) で報告

### Q7: フィードバックや機能要望はどこに送ればいいですか？

**A**: [GitHub Issues](https://github.com/garyohosu/geminiCLI/issues) または [Discussions](https://github.com/garyohosu/geminiCLI/discussions) でお願いします。

---

## サポート

### 問題が解決しない場合

- **GitHub Issues**: https://github.com/garyohosu/geminiCLI/issues
- **Discussions**: https://github.com/garyohosu/geminiCLI/discussions
- **ドキュメント**: https://github.com/garyohosu/geminiCLI/blob/main/README.md

---

## 関連リンク

- [公式リポジトリ](https://github.com/garyohosu/geminiCLI)
- [Gemini CLI 公式](https://github.com/google/generative-ai-cli)
- [開発者ガイド](./developer-guide.md)
- [API ドキュメント](./api.md)

---

**Happy Coding with Gemini CLI GUI Wrapper! 🎉**
