import { Button, Paper, Stack, Typography } from "@mui/material";
import { Controller } from "react-hook-form";

import { EditableNameRow } from "@/components/EditableNameRow";

import type { Item } from "@/features/types/partAssignTypes";
import type { PartAssignForm } from "@/features/usePartAssignForm";

interface PartsSectionProps {
  control: PartAssignForm["control"];
  parts: Item[];
  partIssuesById: Record<string, string[]>;
  onAddPart: () => void;
  onMovePart: (id: string, direction: -1 | 1) => void;
  onRemovePart: (id: string) => void;
  onUpdatePartName: (id: string, value: string) => void;
  onPersistSettings: () => void;
}

export function PartsSection({
  control,
  parts,
  partIssuesById,
  onAddPart,
  onMovePart,
  onRemovePart,
  onUpdatePartName,
  onPersistSettings,
}: PartsSectionProps) {
  return (
    <Paper variant="outlined" sx={{ p: 2.5 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6">パート設定</Typography>
        <Button variant="contained" onClick={onAddPart}>
          パート追加
        </Button>
      </Stack>
      <Stack spacing={1.5}>
        {parts.map((part, index) => {
          const partIssues = partIssuesById[part.id] ?? [];
          return (
            <Controller
              key={part.id}
              control={control}
              name={`parts.${index}.name` as const}
              render={({ field }) => (
                <EditableNameRow
                  value={field.value}
                  index={index}
                  placeholderPrefix="パート"
                  issues={partIssues}
                  canRemove={parts.length > 1}
                  onChange={(value) => {
                    field.onChange(value);
                    onUpdatePartName(part.id, value);
                  }}
                  onBlur={() => {
                    field.onBlur();
                    onPersistSettings();
                  }}
                  onMoveUp={() => onMovePart(part.id, -1)}
                  onMoveDown={() => onMovePart(part.id, 1)}
                  onRemove={() => onRemovePart(part.id)}
                />
              )}
            />
          );
        })}
      </Stack>
    </Paper>
  );
}
