import {
  Container,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import type { Route } from "@/routes/+types/PartAssignPage";

import {
  ActionStatusSection,
  ParticipantsSection,
  PartsSection,
  PreferenceMatrixSection,
  RankSettingsSection,
  ResultSection,
} from "@/components";
import { usePartAssign } from "@/features/usePartAssign";
import { NO_PREFERENCE, usePartAssignForm } from "@/features/usePartAssignForm";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "パート割り当てツール" },
    { name: "description", content: "優先順位から総当りで計算してパートの割当を行う。" },
  ];
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
    updateUnrankedPenalty,
    persistSettings,
    copyShareUrl,
    copyShareUrlDone,
    solve,
    resetAll,
    urlLoadError,
    dismissUrlLoadError,
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
            <PartsSection
              control={form.control}
              parts={parts}
              partIssuesById={partIssuesById}
              onAddPart={addPart}
              onMovePart={movePart}
              onRemovePart={removePart}
              onUpdatePartName={updatePartName}
              onPersistSettings={persistSettings}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <ParticipantsSection
              control={form.control}
              participants={participants}
              participantIssuesById={participantIssuesById}
              onAddParticipant={addParticipant}
              onMoveParticipant={moveParticipant}
              onRemoveParticipant={removeParticipant}
              onUpdateParticipantName={updateParticipantName}
              onPersistSettings={persistSettings}
            />
          </Grid>
        </Grid>

        <RankSettingsSection
          control={form.control}
          parts={parts}
          rankCount={rankCount}
          rankOptions={rankOptions}
          weights={weights}
          unrankedPenalty={unrankedPenalty}
          onUpdateRankCount={updateRankCount}
          onUpdateWeight={updateWeight}
          onUpdateUnrankedPenalty={updateUnrankedPenalty}
          onPersistSettings={persistSettings}
        />

        <PreferenceMatrixSection
          control={form.control}
          participants={participants}
          parts={parts}
          rankCount={rankCount}
          rankOptions={rankOptions}
          preferences={preferences}
          noPreferenceValue={NO_PREFERENCE}
          preferenceIssuesByKey={preferenceIssuesByKey}
          createPreferenceIssueKey={createPreferenceIssueKey}
          onUpdatePreference={updatePreference}
          onTouchPreference={touchPreference}
          onPersistSettings={persistSettings}
        />

        <ActionStatusSection
          canSolve={canSolve}
          copyShareUrlDone={copyShareUrlDone}
          globalIssues={globalIssues}
          maxSearchSize={maxSearchSize}
          participantsCount={participants.length}
          urlLoadError={urlLoadError}
          onSolve={solve}
          onResetAll={resetAll}
          onCopyShareUrl={copyShareUrl}
          onDismissUrlLoadError={dismissUrlLoadError}
        />

        <ResultSection result={result} maxTieResults={maxTieResults} />
      </Stack>
    </Container>
  );
}
