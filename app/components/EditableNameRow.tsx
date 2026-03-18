import { Box, Button, Stack, TextField } from "@mui/material";

import { IssueList } from "@/components/IssueList";

interface EditableNameRowProps {
  value: string;
  index: number;
  placeholderPrefix: string;
  issues: string[];
  canRemove: boolean;
  onChange: (value: string) => void;
  onBlur: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}

export function EditableNameRow({
  value,
  index,
  placeholderPrefix,
  issues,
  canRemove,
  onChange,
  onBlur,
  onMoveUp,
  onMoveDown,
  onRemove,
}: EditableNameRowProps) {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 1 }}>
      <TextField
        value={value}
        fullWidth
        size="small"
        placeholder={`${placeholderPrefix}${index + 1}`}
        error={issues.length > 0}
        helperText={<IssueList issues={issues} />}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        onBlur={onBlur}
      />
      <Stack direction="row" spacing={0.5} alignSelf="start">
        <Button variant="outlined" size="small" onClick={onMoveUp}>
          ↑
        </Button>
        <Button variant="outlined" size="small" onClick={onMoveDown}>
          ↓
        </Button>
        <Button variant="outlined" size="small" color="inherit" onClick={onRemove} disabled={!canRemove}>
          削除
        </Button>
      </Stack>
    </Box>
  );
}
