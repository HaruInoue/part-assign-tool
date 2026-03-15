# パート割り当てツール

参加者の希望順位をもとに、総当たり探索で最適な担当パートの組み合わせを計算する Web アプリです。

## 概要

- 参加者とパートを同数で登録し、各参加者が第1希望〜第N希望を入力します。
- 希望順位ごとの配点（重み）を使って総スコアを計算します。
- 全割り当てパターン（$n!$ 通り）を探索し、総スコア最大の候補を表示します。
- 同点候補が複数ある場合は上位100件まで表示し、超過件数を通知します。

## 主な機能

- 参加者・パートの追加/削除/並び替え
- 希望数（rankCount）と順位ごとの配点設定
- 希望入力の重複防止（同一参加者内で同じパートを選択不可）
- 入力バリデーション（即時）
- localStorage への自動保存と復元
- 最適割り当て候補の一覧表示（得点、達成希望順位、探索件数）

## スコアリング仕様

- 第1希望〜第N希望（および圏外）は、画面上で設定できる配点にもとづいて得点化します。
- 各参加者の得点合計を最大化する組み合わせを最適解とします。

## バリデーション仕様

- 参加者数/パート数は 1 以上
- 参加者数とパート数は一致必須
- 参加者数の上限は 30（探索上限）
- 参加者名・パート名は必須かつ重複不可
- 各希望欄は未選択不可
- 同一参加者の希望内で同一パート重複不可

## 技術スタック

- React 19
- React Router 7
- TypeScript
- Material UI (MUI) v7
- react-hook-form + zod
- Vite

## セットアップ

```bash
npm install
```

## 開発

```bash
npm run dev
```

開発サーバー起動後、表示URLにアクセスしてください。

## 型チェック

```bash
npm run typecheck
```

## ビルド

```bash
npm run build
```

ビルド成果物は `build/client/` に出力されます。

## プレビュー

```bash
npm run preview
```

## GitHub Pages へのデプロイ

このプロジェクトは GitHub Pages 配下で動作するように、`vite.config.ts` と `react-router.config.ts` の base/basename を `/part-assign-tool/` に設定しています。

- 自動デプロイ: `main` ブランチへの push で GitHub Actions が実行されます
- 手動デプロイ: ローカルから `npm run deploy` を実行できます

```bash
npm run deploy
```

公開先の例:

`https://<GitHubユーザー名>.github.io/part-assign-tool/`

## プロジェクト構成

```text
app/
	routes/PartAssignPage.tsx       # 画面UI
	features/usePartAssign.ts       # 割り当て計算ロジックと状態管理
	features/usePartAssignForm.ts   # フォーム初期化とバリデーション
	features/partAssignStorage.ts   # localStorage 永続化
	features/types/partAssignTypes.ts
```

## AI 活用について

- 本プロジェクトでは、README およびコードの一部作成・改善に AI を活用しています。
