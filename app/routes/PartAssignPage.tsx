import {
  Alert,
  Box,
  Button,
  Container,
  FormControl,
  FormHelperText,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { Controller } from "react-hook-form";

import type { Route } from "@/routes/+types/PartAssignPage";

import { usePartAssign } from "@/features/usePartAssign";
import { usePartAssignForm } from "@/features/usePartAssignForm";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "パート割り当てツール" },
    { name: "description", content: "優先順位から総当りで計算してパートの割当を行う。" },
  ];
}

function IssueList({ issues }: { issues: string[] }) {
  if (issues.length === 0) return null;
  return (
    <Box component="ul" sx={{ m: 0, pl: 2 }}>
      {issues.map((issue, index) => (
        <li key={`${issue}-${index}`}>{issue}</li>
      ))}
    </Box>
  );
}

export default function PartAssignPage() {
  const form = usePartAssignForm();

  const {
    participants,
    parts,
    rankCount,
    rankOptions,
    weights,
    unrankedPenalty,
    preferences,
    result,
    globalIssues,
    participantIssuesById,
    partIssuesById,
    preferenceIssuesByKey,
    canSolve,
    createPreferenceIssueKey,
    addParticipant,
    removeParticipant,
    moveParticipant,
    updateParticipantName,
    addPart,
    removePart,
    movePart,
    updatePartName,
    updateRankCount,
    updatePreference,
    touchPreference,
    updateWeight,
    persistSettings,
    solve,
    resetAll,
    maxTieResults,
    maxSearchSize,
  } = usePartAssign(form);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h4" component="h1" fontWeight={700}>
            パート割り当てツール
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            参加者が回答した優先順位を元に、誰がどのパートを担当するのが最適かを計算するツールです。
          </Typography>
        </Paper>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper variant="outlined" sx={{ p: 2.5 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6">パート設定</Typography>
                <Button variant="contained" onClick={addPart}>パート追加</Button>
              </Stack>
              <Stack spacing={1.5}>
                {parts.map((part, index) => {
                  const partIssues = partIssuesById[part.id] ?? [];
                  return (
                    <Box key={part.id} sx={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 1 }}>
                      <Controller
                        control={form.control}
                        name={`parts.${index}.name` as const}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            size="small"
                            placeholder={`パート${index + 1}`}
                            error={partIssues.length > 0}
                            helperText={<IssueList issues={partIssues} />}
                            onChange={(event) => {
                              field.onChange(event.target.value);
                              updatePartName(part.id, event.target.value);
                            }}
                            onBlur={() => {
                              field.onBlur();
                              persistSettings();
                            }}
                          />
                        )}
                      />
                      <Stack direction="row" spacing={0.5} alignSelf="start">
                        <Button variant="outlined" size="small" onClick={() => movePart(part.id, -1)}>
                          ↑
                        </Button>
                        <Button variant="outlined" size="small" onClick={() => movePart(part.id, 1)}>
                          ↓
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          color="inherit"
                          onClick={() => removePart(part.id)}
                          disabled={parts.length <= 1}
                        >
                          削除
                        </Button>
                      </Stack>
                    </Box>
                  );
                })}
              </Stack>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper variant="outlined" sx={{ p: 2.5 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6">参加者設定</Typography>
                <Button variant="contained" onClick={addParticipant}>参加者追加</Button>
              </Stack>
              <Stack spacing={1.5}>
                {participants.map((participant, index) => {
                  const participantIssues = participantIssuesById[participant.id] ?? [];
                  return (
                    <Box key={participant.id} sx={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 1 }}>
                      <Controller
                        control={form.control}
                        name={`participants.${index}.name` as const}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            size="small"
                            placeholder={`参加者${index + 1}`}
                            error={participantIssues.length > 0}
                            helperText={<IssueList issues={participantIssues} />}
                            onChange={(event) => {
                              field.onChange(event.target.value);
                              updateParticipantName(participant.id, event.target.value);
                            }}
                            onBlur={() => {
                              field.onBlur();
                              persistSettings();
                            }}
                          />
                        )}
                      />
                      <Stack direction="row" spacing={0.5} alignSelf="start">
                        <Button variant="outlined" size="small" onClick={() => moveParticipant(participant.id, -1)}>
                          ↑
                        </Button>
                        <Button variant="outlined" size="small" onClick={() => moveParticipant(participant.id, 1)}>
                          ↓
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          color="inherit"
                          onClick={() => removeParticipant(participant.id)}
                          disabled={participants.length <= 1}
                        >
                          削除
                        </Button>
                      </Stack>
                    </Box>
                  );
                })}
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        <Paper variant="outlined" sx={{ p: 2.5 }}>
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "flex-end" }}>
              <Controller
                control={form.control}
                name="rankCount"
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="number"
                    size="small"
                    label="希望数"
                    slotProps={{
                      htmlInput: { min: 1, max: Math.max(parts.length, 1) },
                      input: {
                        endAdornment: <InputAdornment position="end">つ</InputAdornment>,
                      },
                    }}
                    value={rankCount}
                    onChange={(event) => {
                      const nextValue = Number(event.target.value);
                      field.onChange(nextValue);
                      updateRankCount(nextValue);
                    }}
                    onBlur={() => {
                      field.onBlur();
                      persistSettings();
                    }}
                    sx={{ width: 120 }}
                  />
                )}
              />

              <Stack direction="row" spacing={1} flexWrap="wrap">
                {rankOptions.map((rank, index) => (
                  <Controller
                    key={rank}
                    control={form.control}
                    name={`weights.${index}` as const}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        type="number"
                        size="small"
                        label={`${rank}位`}
                        slotProps={{
                          input: {
                            endAdornment: <InputAdornment position="end">点</InputAdornment>,
                          },
                        }}
                        value={weights[index] ?? 0}
                        onChange={(event) => {
                          const nextValue = Number(event.target.value);
                          field.onChange(nextValue);
                          updateWeight(index, nextValue);
                        }}
                        onBlur={() => {
                          field.onBlur();
                          persistSettings();
                        }}
                        sx={{ width: 96 }}
                      />
                    )}
                  />
                ))}
                <TextField
                  type="number"
                  size="small"
                  label="圏外"
                  value={unrankedPenalty}
                  slotProps={{
                    input: {
                      readOnly: true,
                      endAdornment: <InputAdornment position="end">点</InputAdornment>,
                    },
                  }}
                  sx={{ width: 96 }}
                />
              </Stack>
            </Stack>

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>参加者</TableCell>
                    {rankOptions.map((rank) => (
                      <TableCell key={rank}>第{rank}希望</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {participants.map((participant) => (
                    <TableRow key={participant.id}>
                      <TableCell sx={{ fontWeight: 600 }}>{participant.name || "未命名参加者"}</TableCell>
                      {rankOptions.map((_, rankIndex) => {
                        const preferenceIssues =
                          preferenceIssuesByKey[createPreferenceIssueKey(participant.id, rankIndex)] ?? [];

                        return (
                          <TableCell key={`${participant.id}-${rankIndex}`} sx={{ verticalAlign: "top", minWidth: 210 }}>
                            <Controller
                              control={form.control}
                              name={`preferences.${participant.id}` as const}
                              render={({ field }) => {
                                const row = Array.isArray(field.value)
                                  ? field.value
                                  : (preferences[participant.id] ?? []);
                                const value = row[rankIndex] ?? "";
                                const selectedPartIds = new Set(
                                  row.filter((partId, index) => index !== rankIndex && Boolean(partId)),
                                );
                                const selectableParts = parts.filter(
                                  (part) => part.id === value || !selectedPartIds.has(part.id),
                                );

                                return (
                                  <FormControl fullWidth size="small" error={preferenceIssues.length > 0}>
                                    <InputLabel id={`pref-label-${participant.id}-${rankIndex}`}>
                                      第{rankIndex + 1}希望
                                    </InputLabel>
                                    <Select
                                      labelId={`pref-label-${participant.id}-${rankIndex}`}
                                      label={`第${rankIndex + 1}希望`}
                                      value={value}
                                      onChange={(event) => {
                                        const nextValue = String(event.target.value);
                                        const nextRow = [...row];
                                        while (nextRow.length < rankCount) nextRow.push("");
                                        nextRow[rankIndex] = nextValue;
                                        field.onChange(nextRow);
                                        updatePreference(participant.id, rankIndex, nextValue);
                                      }}
                                      onBlur={() => {
                                        field.onBlur();
                                        touchPreference(participant.id, rankIndex);
                                        persistSettings();
                                      }}
                                    >
                                      <MenuItem value="">選択してください</MenuItem>
                                      {selectableParts.map((part) => (
                                        <MenuItem key={part.id} value={part.id}>
                                          {part.name || "未命名パート"}
                                        </MenuItem>
                                      ))}
                                    </Select>
                                    {preferenceIssues.length > 0 && (
                                      <FormHelperText>
                                        <IssueList issues={preferenceIssues} />
                                      </FormHelperText>
                                    )}
                                  </FormControl>
                                );
                              }}
                            />
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2.5 }}>
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }}>
              <Button variant="contained" onClick={solve} disabled={!canSolve}>
                最適割り当てを計算
              </Button>
              <Button variant="outlined" color="inherit" onClick={resetAll}>
                初期化
              </Button>
              <Typography variant="caption" color="text.secondary">
                探索対象: {participants.length}! 通り / 上限: {maxSearchSize}人
              </Typography>
            </Stack>

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

        <Paper variant="outlined" sx={{ p: 2.5 }}>
          <Typography variant="h6">結果</Typography>
          {result.totalBestScore === null ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              まだ計算結果はありません。
            </Typography>
          ) : (
            <Stack spacing={2} sx={{ mt: 2 }}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} flexWrap="wrap">
                <Alert severity="info" sx={{ py: 0 }}>最高得点: {result.totalBestScore}</Alert>
                <Alert severity="info" sx={{ py: 0 }}>表示候補: {result.candidates.length}件</Alert>
                <Alert severity="info" sx={{ py: 0 }}>探索件数: {result.searchedCount.toLocaleString()}通り</Alert>
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
                            <TableCell>参加者</TableCell>
                            <TableCell>担当パート</TableCell>
                            <TableCell>達成希望</TableCell>
                            <TableCell>得点</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {candidate.lines.map((line) => (
                            <TableRow key={line.participantId}>
                              <TableCell>{line.participantName}</TableCell>
                              <TableCell>{line.partName}</TableCell>
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
      </Stack>
    </Container>
  );
}
