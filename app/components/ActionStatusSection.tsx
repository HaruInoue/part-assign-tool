import { Alert, Button, Paper, Stack, Typography } from "@mui/material";

import { IssueList } from "@/components/IssueList";

interface ActionStatusSectionProps {
  canSolve: boolean;
  copyShareUrlDone: boolean;
  globalIssues: string[];
  maxSearchSize: number;
  participantsCount: number;
  urlLoadError: boolean;
  onSolve: () => void;
  onResetAll: () => void;
  onCopyShareUrl: () => void;
  onDismissUrlLoadError: () => void;
}

export function ActionStatusSection({
  canSolve,
  copyShareUrlDone,
  globalIssues,
  maxSearchSize,
  participantsCount,
  urlLoadError,
  onSolve,
  onResetAll,
  onCopyShareUrl,
  onDismissUrlLoadError,
}: ActionStatusSectionProps) {
  return (
    <Paper variant="outlined" sx={{ p: 2.5 }}>
      <Stack spacing={2}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }}>
          <Button variant="contained" onClick={onSolve} disabled={!canSolve}>
            最適割り当てを計算
          </Button>
          <Button variant="outlined" color="inherit" onClick={onResetAll}>
            初期化
          </Button>
          <Button variant="outlined" onClick={onCopyShareUrl}>
            {copyShareUrlDone ? "コピーしました！" : "共有用URL取得"}
          </Button>
          <Typography variant="caption" color="text.secondary">
            探索対象: {participantsCount}! 通り / 上限: {maxSearchSize}人
          </Typography>
        </Stack>

        {urlLoadError && (
          <Alert severity="error" onClose={onDismissUrlLoadError}>
            URLからの設定読み込みに失敗しました。
          </Alert>
        )}

        {globalIssues.length > 0 ? (
          <Alert severity="warning">
            <IssueList issues={globalIssues} />
          </Alert>
        ) : !canSolve ? (
          <Alert severity="error">入力欄のエラーを修正すると計算できます。</Alert>
        ) : (
          <Alert severity="success">入力は有効です。計算を実行できます。</Alert>
        )}
      </Stack>
    </Paper>
  );
}
