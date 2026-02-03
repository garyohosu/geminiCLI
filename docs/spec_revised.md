# Gemini AI エージェント for Windows 仕様書（MVP〜v1）

## 0. プロジェクト名変更
**旧名**: Gemini CLI GUI Wrapper  
**新名**: Gemini AI Agent（仮）

理由: CLIラッパーではなく、AIエージェントとして機能するため

---

## 1. 目的

**「Claude Cowork」の非プログラマー版を作る**

プログラマー以外の一般ユーザー（事務職、教師、個人事業主等）が、AIエージェントに「お願い」するだけで、実際にファイル操作を自動実行してもらえるWindowsアプリ。

### 実現する体験
- ❌ ChatGPT: 「こうすればいいですよ」（提案するだけ）
- ✅ このアプリ: 「やっておきました」（実際に実行）

### 差別化ポイント
1. **無料**: Google Gemini API（無料枠）を使用
2. **安全**: ワークスペース内のみ自動操作
3. **簡単**: CLIやプログラミング知識不要
4. **エージェント動作**: 会話から必要な操作を自動判断・実行

---

## 2. 想定ユーザー

### メインターゲット
- **非プログラマー** の一般PCユーザー
- CLIやコマンドプロンプトを使ったことがない人
- AI課金を避けたいが、AIの力は借りたい人

### ユースケース例
| 職種 | 利用シーン |
|------|------------|
| 事務職 | 「先月の請求書PDFを全部『202501_請求書』フォルダに移動して」 |
| 教師 | 「生徒の提出レポート50個から、名前だけ抜き出してExcel風CSVにして」 |
| フリーランス | 「写真フォルダの中から2024年12月の写真だけ選んで新しいフォルダに」 |
| ブロガー | 「draft フォルダの記事を全部読んで、タイトル一覧をMarkdownで作って」 |

**重要**: プログラマーは対象外（VSCode拡張やCLI使えばいい）

---

## 3. スコープ

### 3.1 対応OS
- Windows 10 / 11（64bit）

### 3.2 コア機能（v1）

#### A. AIエージェント機能
- 自然言語での依頼受付
- ワークスペース状況の自動把握
- 必要な操作の自動判断・実行
- 実行結果の報告

#### B. 対応するファイル操作（ワークスペース内のみ）
- **参照**: ファイル一覧、内容読み込み、検索
- **作成**: 新規ファイル/フォルダ作成
- **更新**: テキスト編集、検索/置換、追記、移動、リネーム
- **削除**: ファイル/フォルダ削除（確認必須）
- **複製**: コピー
- **圧縮/展開**: zip の作成・展開
- **整理**: 日付・拡張子・名前でのグルーピング

#### C. 安全機能
- ワークスペース外へのアクセス完全ブロック
- 破壊的操作の事前確認（削除・上書き等）
- 変更プレビュー（diff表示）
- 操作ログ保存

---

## 4. 非スコープ（v1ではやらない）

### 絶対にやらない
- ワークスペース外の操作
- OS設定変更、レジストリ操作
- 外部ネットワークアクセス

### v2以降で検討
- 任意コマンド実行（サンドボックス内）
- Git操作
- クラウド連携（Google Drive等）
- 画像編集・変換
- Office文書の編集

---

## 5. 全体像（アーキテクチャ）

### 5.1 技術スタック
```
┌─────────────────────────────────────┐
│  Electron Renderer (GUI)            │
│  - チャット画面                      │
│  - ファイルツリー表示                │
│  - 変更プレビュー                    │
└──────────────┬──────────────────────┘
               │ IPC
┌──────────────▼──────────────────────┐
│  Electron Main (制御層)              │
│  - 安全なファイルAPI                 │
│  - パス検証                          │
│  - 操作ログ記録                      │
└──────────────┬──────────────────────┘
               │ HTTPS API
┌──────────────▼──────────────────────┐
│  Google Gemini API                  │
│  - Function Calling でツール提供     │
│  - エージェント動作                  │
└─────────────────────────────────────┘
```

### 5.2 重要な設計変更

**❌ 旧spec.md（間違い）:**
```
Gemini CLI を子プロセス起動して標準入出力をストリーミング
```

**✅ 新設計（正解）:**
```
Gemini API を直接呼び出し、Function Calling でツールを提供
```

**理由:**
- Gemini CLIには「ツール実行機能」がない
- Function CallingでClaude Cowork相当の動作が可能
- APIなら無料枠も大きい（CLI経由と同じ）

---

## 6. Gemini API連携仕様（最重要）

### 6.1 Function Calling設計

Gemini APIに以下のツールを登録:

```javascript
const tools = [
  {
    name: "list_files",
    description: "List files and directories in workspace",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "Relative path from workspace root" }
      }
    }
  },
  {
    name: "read_file",
    description: "Read file content (text files only)",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "File path to read" }
      },
      required: ["path"]
    }
  },
  {
    name: "write_file",
    description: "Write content to file (requires user approval for overwrite)",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string" },
        content: { type: "string" },
        mode: { type: "string", enum: ["overwrite", "append"] }
      },
      required: ["path", "content"]
    }
  },
  {
    name: "move_file",
    description: "Move or rename file/folder",
    parameters: {
      type: "object",
      properties: {
        src: { type: "string" },
        dst: { type: "string" }
      },
      required: ["src", "dst"]
    }
  },
  {
    name: "delete_file",
    description: "Delete file or folder (requires user approval)",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string" }
      },
      required: ["path"]
    }
  },
  {
    name: "search_files",
    description: "Search files by name pattern or content",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string" },
        type: { type: "string", enum: ["name", "content"] }
      },
      required: ["query"]
    }
  }
  // ... 他のツール
];
```

### 6.2 エージェントフロー

```
1. ユーザー「2024年12月の写真を全部移動して」
                ↓
2. Gemini API が判断「まずファイル一覧が必要」
                ↓
3. Function Call: list_files({path: "."})
                ↓
4. アプリが実行 → 結果を返す
                ↓
5. Gemini「写真ファイルを発見、日付を確認する必要がある」
                ↓
6. Function Call: get_file_metadata(...)
                ↓
7. 対象特定後、Gemini「これらを移動します」
                ↓
8. 【ここで人間の承認】
                ↓
9. 承認後、Function Call: move_file(...) × 複数回
                ↓
10. 完了報告
```

### 6.3 承認フロー（重要）

破壊的操作は自動実行しない:
- ファイル削除
- 上書き
- 大量操作（10ファイル以上）
- zip展開（上書きリスク）

**承認画面例:**
```
AIが以下の操作を提案しています:

📂 移動: 25個のファイル
  photo_001.jpg → 2024-12/photo_001.jpg
  photo_002.jpg → 2024-12/photo_002.jpg
  ... 他23個

[詳細を見る] [実行する] [キャンセル]
```

---

## 7. 安全設計（最重要）

### 7.1 ワークスペース脱出防止

```javascript
// 全てのファイル操作で実施
function validatePath(inputPath) {
  const absPath = path.resolve(workspace, inputPath);
  const realPath = fs.realpathSync(absPath); // シンボリックリンク解決
  const workspaceReal = fs.realpathSync(workspace);
  
  if (!realPath.startsWith(workspaceReal)) {
    throw new Error("PATH_OUTSIDE_WORKSPACE");
  }
  
  return realPath;
}
```

### 7.2 許可する操作（allowlist）

```javascript
const ALLOWED_OPERATIONS = [
  "list_files",
  "read_file",
  "write_file",
  "move_file",
  "copy_file",
  "delete_file",
  "create_folder",
  "search_files",
  "get_file_info",
  "zip_create",
  "zip_extract"
];

// これ以外の操作は一切受け付けない
```

### 7.3 禁止事項

v1では以下を完全禁止:
- `exec()`, `spawn()` での外部コマンド実行
- `.exe`, `.bat`, `.ps1` の実行
- レジストリアクセス
- ネットワークアクセス（APIは除く）

---

## 8. UI要件

### 8.1 メイン画面構成

```
┌─────────────────────────────────────────────┐
│ 📁 ワークスペース: C:\Users\...\Documents   │
├──────────┬──────────────────────────────────┤
│          │  💬 チャット画面                 │
│  ファイル │                                  │
│  ツリー  │  ユーザー「写真を整理して」       │
│          │                                  │
│  📁 2024 │  AI「承知しました。まず現在の     │
│  📁 2025 │     ファイルを確認します...」     │
│  📄 a.txt│                                  │
│          │  🤖 操作提案                     │
│          │  ┌─────────────────────┐       │
│          │  │ 25個のファイルを移動  │       │
│          │  │ [詳細] [実行]        │       │
│          │  └─────────────────────┘       │
│          │                                  │
│          │  [メッセージ入力欄]              │
└──────────┴──────────────────────────────────┘
```

### 8.2 操作プレビュー画面

変更がある場合は必ずdiffを表示:

```
変更プレビュー
─────────────────────────────
ファイル: report.txt

- 古い内容の行
+ 新しい内容の行
  変更なしの行

[戻る] [この変更を実行]
```

---

## 9. 認証・セットアップ

### 9.1 初回起動フロー

```
1. アプリ起動
    ↓
2. 「Gemini APIキーが必要です」説明画面
    ↓
3. [Google AI Studioを開く] ボタン
    ↓
4. ユーザーがブラウザでAPIキー取得
    ↓
5. アプリにAPIキーを貼り付け
    ↓
6. ワークスペースフォルダを選択
    ↓
7. 利用開始
```

### 9.2 APIキー保存

- Windows資格情報マネージャーに保存（推奨）
- または暗号化してローカルファイルに保存
- **絶対に平文保存しない**

---

## 10. 配布・インストール

### 10.1 配布方法
- GitHub Releases でインストーラー配布
- `GeminiAgent-Setup-1.0.0.exe` 形式
- 自動更新機能（electron-updater）

### 10.2 インストーラーに含めるもの
- Electron + Node.js（同梱）
- アプリ本体
- **Gemini CLIは不要**（API直接利用のため）

### 10.3 システム要件
- Windows 10/11 64bit
- メモリ: 4GB以上推奨
- ストレージ: 200MB（インストールサイズ）

---

## 11. 開発マイルストーン

### M0（技術検証）2週間
- [ ] Gemini API Function Calling の動作確認
- [ ] Electron + IPC の基本実装
- [ ] パス検証ロジックの実装とテスト
- [ ] 簡単なread/write操作

### M1（MVP）4週間
- [ ] チャットUI実装
- [ ] ファイルツリー表示
- [ ] list/read/write/move 操作
- [ ] 承認フロー（モックでも可）

### M2（v1に向けて）6週間
- [ ] diff表示
- [ ] delete/copy/zip操作
- [ ] 操作ログ
- [ ] エラーハンドリング強化
- [ ] セキュリティテスト

### v1.0リリース（+2週間）
- [ ] インストーラー作成
- [ ] ドキュメント整備
- [ ] GitHub Releases 公開
- [ ] 使い方動画作成

---

## 12. 受け入れ条件（v1）

以下を全て満たすこと:

- [ ] ワークスペース外への操作が100%ブロックされる
- [ ] シンボリックリンク経由の脱出が防げる
- [ ] 破壊的操作は必ず承認が必要
- [ ] 初心者が「APIキー取得→インストール→使い始め」まで30分以内で到達
- [ ] エージェントが自動でファイル操作を実行できる
- [ ] 日本語で自然な会話ができる
- [ ] GitHub Releases からインストーラーがダウンロードできる

---

## 13. よくある質問（FAQ）

### Q1: Gemini CLIは使わないの？
**A**: 使いません。Gemini APIを直接呼び出します。CLIにはFunction Calling機能がないため、エージェント動作が実現できません。

### Q2: ChatGPTとの違いは？
**A**: ChatGPTは提案するだけですが、このアプリは実際にファイル操作を実行します。Claude Coworkの非プログラマー版です。

### Q3: 無料で使える？
**A**: はい。Gemini APIの無料枠内（月1500リクエストまで等）で使えます。

### Q4: プログラマーも使える？
**A**: 使えますが、プログラマーならVSCode拡張やCLIの方が便利です。このアプリは非プログラマー向けです。

### Q5: Macでは使えない？
**A**: v1はWindows専用です。需要があればMac/Linux版も検討します。

---

## 14. リスクと対策

| リスク | 影響 | 対策 |
|--------|------|------|
| Gemini API無料枠の制限 | ユーザーが使えなくなる | 使用量表示、有料プラン案内 |
| パス検証の脆弱性 | ワークスペース外へ脱出 | 徹底的なセキュリティテスト |
| 誤操作での重要ファイル削除 | データ消失 | 削除前の確認、ゴミ箱機能 |
| APIキーの流出 | 悪用される | 資格情報マネージャー使用 |
| SmartScreen警告 | インストールされない | コード署名（将来） |

---

## 付録A: 旧spec.mdとの主な変更点

| 項目 | 旧spec.md | 新spec（本文書） |
|------|-----------|------------------|
| プロジェクト名 | Gemini CLI GUI Wrapper | Gemini AI Agent |
| 技術基盤 | Gemini CLI（子プロセス） | Gemini API（直接呼び出し） |
| 動作モード | 提案→承認→実行 | エージェント自動実行（承認あり） |
| ターゲット | Windows初心者 | 非プログラマー全般 |
| 参考 | なし | Claude Cowork |
| Function Calling | 言及なし | 中核機能 |

---

## 付録B: 参考リンク

- [Gemini API Function Calling ドキュメント](https://ai.google.dev/docs/function_calling)
- [Electron Security ベストプラクティス](https://www.electronjs.org/docs/latest/tutorial/security)
- [Google AI Studio（APIキー取得）](https://makersuite.google.com/app/apikey)

---

更新履歴:
- 2026-02-03 全面改訂（CLIベース→APIベースに変更）
- 2026-02-03 初版（旧spec.md）
