import {
  InputAdornment,
  Paper,
  Stack,
  TextField,
} from "@mui/material";
import { Controller } from "react-hook-form";

import type { Item } from "@/features/types/partAssignTypes";
import type { PartAssignForm } from "@/features/usePartAssignForm";

interface RankSettingsSectionProps {
  control: PartAssignForm["control"];
  parts: Item[];
  rankCount: number;
  rankOptions: number[];
  weights: number[];
  unrankedPenalty: number;
  onUpdateRankCount: (value: number) => void;
  onUpdateWeight: (rankIndex: number, value: number) => void;
  onUpdateUnrankedPenalty: (value: number) => void;
  onPersistSettings: () => void;
}

export function RankSettingsSection({
  control,
  parts,
  rankCount,
  rankOptions,
  weights,
  unrankedPenalty,
  onUpdateRankCount,
  onUpdateWeight,
  onUpdateUnrankedPenalty,
  onPersistSettings,
}: RankSettingsSectionProps) {
  return (
    <Paper variant="outlined" sx={{ p: 2.5 }}>
      <Stack spacing={2}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "flex-end" }}>
          <Controller
            control={control}
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
                  onUpdateRankCount(nextValue);
                }}
                onBlur={() => {
                  field.onBlur();
                  onPersistSettings();
                }}
                sx={{ width: 120 }}
              />
            )}
          />

          <Stack direction="row" spacing={1} flexWrap="wrap">
            {rankOptions.map((rank, index) => (
              <Controller
                key={rank}
                control={control}
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
                      onUpdateWeight(index, nextValue);
                    }}
                    onBlur={() => {
                      field.onBlur();
                      onPersistSettings();
                    }}
                    sx={{ width: 96 }}
                  />
                )}
              />
            ))}
            <Controller
              control={control}
              name="unrankedPenalty"
              render={({ field }) => (
                <TextField
                  {...field}
                  type="number"
                  size="small"
                  label="圏外"
                  slotProps={{
                    input: {
                      endAdornment: <InputAdornment position="end">点</InputAdornment>,
                    },
                  }}
                  value={unrankedPenalty}
                  onChange={(event) => {
                    const nextValue = Number(event.target.value);
                    field.onChange(nextValue);
                    onUpdateUnrankedPenalty(nextValue);
                  }}
                  onBlur={() => {
                    field.onBlur();
                    onPersistSettings();
                  }}
                  sx={{ width: 96 }}
                />
              )}
            />
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  );
}
