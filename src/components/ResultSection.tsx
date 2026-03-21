import {
  Alert,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import type { SolveResult } from "@/features/types/partAssignTypes";

interface ResultSectionProps {
  result: SolveResult;
  maxTieResults: number;
}

export function ResultSection({ result, maxTieResults }: ResultSectionProps) {
  return (
    <Paper variant="outlined" sx={{ p: 2.5 }}>
      <Typography variant="h6">結果</Typography>
      {result.totalBestScore === null ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          まだ計算結果はありません。
        </Typography>
      ) : (
        <Stack spacing={2} sx={{ mt: 2 }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} flexWrap="wrap">
            <Alert severity="info" sx={{ py: 0 }}>
              最高得点: {result.totalBestScore}
            </Alert>
            <Alert severity="info" sx={{ py: 0 }}>
              表示候補: {result.candidates.length}件
            </Alert>
            <Alert severity="info" sx={{ py: 0 }}>
              探索件数: {result.searchedCount.toLocaleString()}通り
            </Alert>
          </Stack>

          {result.overflowCount > 0 && (
            <Alert severity="warning">
              同点候補が多数あるため、上位{maxTieResults}件を表示中です。未表示: {result.overflowCount}件
            </Alert>
          )}

          <Stack spacing={1.5}>
            {result.candidates.map((candidate, index) => (
              <Paper key={`${candidate.totalScore}-${index}`} variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
                  候補 {index + 1}
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>担当パート</TableCell>
                        <TableCell>参加者</TableCell>
                        <TableCell>達成希望</TableCell>
                        <TableCell>得点</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {candidate.lines.map((line) => (
                        <TableRow key={`${line.partId}-${line.participantId}`}>
                          <TableCell>{line.partName}</TableCell>
                          <TableCell>{line.participantName}</TableCell>
                          <TableCell>{line.rank === null ? "圏外" : `第${line.rank}希望`}</TableCell>
                          <TableCell>{line.score}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            ))}
          </Stack>
        </Stack>
      )}
    </Paper>
  );
}
