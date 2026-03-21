# パート割り当てツール

参加者の希望順位にもとづいて、最適なパート割り当てを探索するWebアプリです。

公開先：https://haruinoue.github.io/part-assign-tool/

## 概要

- 参加者とパートを登録し、希望順位を入力して最適な割り当てを計算します。
- 順位ごとの配点を設定し、合計スコアが最大となる組み合わせを表示します。
- 同点候補が複数ある場合は、上位候補を一覧で確認できます。

## 技術スタック

- React 19
- React Router 7
- TypeScript
- Vite
- Material UI (MUI) v7
- react-hook-form
- zod

## プロジェクト構成

```text
.
├─ build/
│  └─ client/
├─ public/
└─ src/
   ├─ components/
   ├─ features/
   │  └─ types/
   └─ routes/
```

## AI 活用について
本プロジェクトでは、作成・改善に AI を活用しています。
