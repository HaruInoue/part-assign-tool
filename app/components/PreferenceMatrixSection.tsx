import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { Controller } from "react-hook-form";

import { IssueList } from "@/components/IssueList";

import type { Item } from "@/features/types/partAssignTypes";
import type { PartAssignForm } from "@/features/usePartAssignForm";
import { NO_PREFERENCE } from "@/features/usePartAssignForm";

interface PreferenceMatrixSectionProps {
  control: PartAssignForm["control"];
  participants: Item[];
  parts: Item[];
  rankCount: number;
  rankOptions: number[];
  preferences: Record<string, string[]>;
  noPreferenceValue: typeof NO_PREFERENCE;
  preferenceIssuesByKey: Record<string, string[]>;
  createPreferenceIssueKey: (participantId: string, rankIndex: number) => string;
  onUpdatePreference: (participantId: string, rankIndex: number, partId: string) => void;
  onTouchPreference: (participantId: string, rankIndex: number) => void;
  onPersistSettings: () => void;
}

export function PreferenceMatrixSection({
  control,
  participants,
  parts,
  rankCount,
  rankOptions,
  preferences,
  noPreferenceValue,
  preferenceIssuesByKey,
  createPreferenceIssueKey,
  onUpdatePreference,
  onTouchPreference,
  onPersistSettings,
}: PreferenceMatrixSectionProps) {
  return (
    <Paper variant="outlined" sx={{ p: 2.5 }}>
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
                        control={control}
                        name={`preferences.${participant.id}` as const}
                        render={({ field }) => {
                          const row = Array.isArray(field.value)
                            ? field.value
                            : (preferences[participant.id] ?? []);
                          const value = row[rankIndex] ?? "";
                          const selectedPartIds = new Set(
                            row.filter(
                              (partId, index) =>
                                index !== rankIndex && Boolean(partId) && partId !== noPreferenceValue,
                            ),
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
                                  onUpdatePreference(participant.id, rankIndex, nextValue);
                                }}
                                onBlur={() => {
                                  field.onBlur();
                                  onTouchPreference(participant.id, rankIndex);
                                  onPersistSettings();
                                }}
                              >
                                <MenuItem value="">選択してください</MenuItem>
                                <MenuItem value={noPreferenceValue}>希望なし</MenuItem>
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
    </Paper>
  );
}
