import { Button, Paper, Stack, Typography } from "@mui/material";
import { Controller } from "react-hook-form";

import { EditableNameRow } from "@/components/EditableNameRow";

import type { Item } from "@/features/types/partAssignTypes";
import type { PartAssignForm } from "@/features/usePartAssignForm";

interface ParticipantsSectionProps {
  control: PartAssignForm["control"];
  participants: Item[];
  participantIssuesById: Record<string, string[]>;
  onAddParticipant: () => void;
  onMoveParticipant: (id: string, direction: -1 | 1) => void;
  onRemoveParticipant: (id: string) => void;
  onUpdateParticipantName: (id: string, value: string) => void;
  onPersistSettings: () => void;
}

export function ParticipantsSection({
  control,
  participants,
  participantIssuesById,
  onAddParticipant,
  onMoveParticipant,
  onRemoveParticipant,
  onUpdateParticipantName,
  onPersistSettings,
}: ParticipantsSectionProps) {
  return (
    <Paper variant="outlined" sx={{ p: 2.5 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6">参加者設定</Typography>
        <Button variant="contained" onClick={onAddParticipant}>
          参加者追加
        </Button>
      </Stack>
      <Stack spacing={1.5}>
        {participants.map((participant, index) => {
          const participantIssues = participantIssuesById[participant.id] ?? [];
          return (
            <Controller
              key={participant.id}
              control={control}
              name={`participants.${index}.name` as const}
              render={({ field }) => (
                <EditableNameRow
                  value={field.value}
                  index={index}
                  placeholderPrefix="参加者"
                  issues={participantIssues}
                  canRemove={participants.length > 1}
                  onChange={(value) => {
                    field.onChange(value);
                    onUpdateParticipantName(participant.id, value);
                  }}
                  onBlur={() => {
                    field.onBlur();
                    onPersistSettings();
                  }}
                  onMoveUp={() => onMoveParticipant(participant.id, -1)}
                  onMoveDown={() => onMoveParticipant(participant.id, 1)}
                  onRemove={() => onRemoveParticipant(participant.id)}
                />
              )}
            />
          );
        })}
      </Stack>
    </Paper>
  );
}
