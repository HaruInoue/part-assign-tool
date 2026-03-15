import { useCallback, useEffect, useMemo, useState } from "react";
import { useFieldArray } from "react-hook-form";

import {
    clearPartAssignSettings,
    savePartAssignSettings,
} from "@/features/partAssignStorage";
import {
    clampRankCount,
    createDefaultPreferences,
    createDefaultWeights,
    createId,
    defaultParticipants,
    defaultParts,
    getInitialPartAssignSettings,
    normalizePreferences,
    normalizeWeightsByRankCount,
} from "@/features/usePartAssignForm";

import type {
    Item,
    AssignmentLine,
    AssignmentCandidate,
    SolveResult,
} from "@/features/types/partAssignTypes";
import type { PartAssignForm } from "@/features/usePartAssignForm";

const MAX_TIE_RESULTS = 100;
const MAX_SEARCH_SIZE = 30;

// 空の計算結果オブジェクトを生成する
const createEmptyResult = (): SolveResult => ({
    totalBestScore: null,
    candidates: [],
    overflowCount: 0,
    searchedCount: 0,
});

// n! を計算して全探索数を返す
const calcSearchCount = (n: number) => {
    let value = 1;
    for (let i = 2; i <= n; i += 1) value *= i;
    return value;
};

// 希望入力セルを一意に識別するキーを生成する
const createPreferenceIssueKey = (participantId: string, rankIndex: number) =>
    `${participantId}:${rankIndex}`;

type IssueFieldError = {
    message?: string;
    _errors?: string[];
};

const extractIssueMessages = (error: IssueFieldError | undefined): string[] => {
    if (!error) return [];
    const messages = error._errors ?? [];
    if (messages.length > 0) return messages;
    return error.message ? [error.message] : [];
};

// パート割り当てロジックをフォーム状態と結合して提供するカスタムフック
export function usePartAssign(form: PartAssignForm) {
    const { control, getValues, setValue, watch, reset, formState, getFieldState, trigger } = form;
    const [result, setResult] = useState<SolveResult>(createEmptyResult());

    const participantsFieldArray = useFieldArray({
        control,
        name: "participants",
        keyName: "fieldKey",
    });
    const partsFieldArray = useFieldArray({
        control,
        name: "parts",
        keyName: "fieldKey",
    });

    const participants = watch("participants") ?? [];
    const parts = watch("parts") ?? [];
    const rankCountValue = watch("rankCount");
    const weightsValue = watch("weights");
    const preferencesValue = watch("preferences");

    const rankCount = typeof rankCountValue === "number" ? rankCountValue : 1;
    const weights = Array.isArray(weightsValue) ? weightsValue : [];
    const preferences = preferencesValue ?? {};

    // 計算結果をリセットする
    const clearResult = () => {
        setResult(createEmptyResult());
    };

    // パート数を上限としてクランプしたランク数
    const normalizedRankCount = useMemo(() => {
        return clampRankCount(rankCount, parts.length);
    }, [parts.length, rankCount]);

    // ランク数に合わせて正規化した重み配列
    const normalizedWeights = useMemo(() => {
        return normalizeWeightsByRankCount(weights, normalizedRankCount);
    }, [normalizedRankCount, weights]);

    // 希望外パートに割り当てられたときのペナルティスコア
    const unrankedPenalty = -parts.length;

    // 現在の設定を localStorage に永続化する
    const persistSettings = useCallback(() => {
        const values = getValues();
        savePartAssignSettings({
            participants: values.participants ?? [],
            parts: values.parts ?? [],
            rankCount: clampRankCount(values.rankCount ?? 1, (values.parts ?? []).length),
            weights: normalizeWeightsByRankCount(
                values.weights ?? [],
                clampRankCount(values.rankCount ?? 1, (values.parts ?? []).length),
            ),
            preferences: normalizePreferences(
                values.preferences ?? {},
                values.participants ?? [],
                values.parts ?? [],
                clampRankCount(values.rankCount ?? 1, (values.parts ?? []).length),
            ),
        });
    }, [getValues]);

    useEffect(() => {
        const subscription = watch(() => {
            persistSettings();
        });
        return () => subscription.unsubscribe();
    }, [persistSettings, watch]);

    const canSolve = formState.isValid;

    // 全体制約に関するエラーメッセージのみを抽出する
    const globalIssues = useMemo(() => {
        const rootErrors = (formState.errors as { root?: Record<string, { message?: string }> }).root ?? {};
        return Object.values(rootErrors)
            .map((error) => error?.message)
            .filter((message): message is string => Boolean(message));
    }, [formState.errors]);

    // 参加者IDごとに名前入力エラーをまとめる
    const participantIssuesById = useMemo(() => {
        const next: Record<string, string[]> = {};
        participants.forEach((participant, index) => {
            const messages = extractIssueMessages(
                formState.errors.participants?.[index]?.name as IssueFieldError | undefined,
            );
            if (messages.length === 0) return;
            next[participant.id] = [...(next[participant.id] ?? []), ...messages];
        });
        return next;
    }, [formState.errors.participants, participants]);

    // パートIDごとに名前入力エラーをまとめる
    const partIssuesById = useMemo(() => {
        const next: Record<string, string[]> = {};
        parts.forEach((part, index) => {
            const messages = extractIssueMessages(
                formState.errors.parts?.[index]?.name as IssueFieldError | undefined,
            );
            if (messages.length === 0) return;
            next[part.id] = [...(next[part.id] ?? []), ...messages];
        });
        return next;
    }, [formState.errors.parts, parts]);

    // 希望入力セルごとにエラーメッセージをまとめる
    const preferenceIssuesByKey = useMemo(() => {
        const next: Record<string, string[]> = {};
        participants.forEach((participant) => {
            const rowErrors = (formState.errors.preferences?.[participant.id] ?? []) as Array<{ message?: string }>;
            const rowFieldPath = `preferences.${participant.id}` as const;
            const rowTouched = getFieldState(rowFieldPath, formState).isTouched;
            for (let rankIndex = 0; rankIndex < normalizedRankCount; rankIndex += 1) {
                if (!rowTouched) continue;

                const message = rowErrors[rankIndex]?.message;
                if (!message) continue;

                const key = createPreferenceIssueKey(participant.id, rankIndex);
                next[key] = [...(next[key] ?? []), message];
            }
        });
        return next;
    }, [formState, getFieldState, normalizedRankCount, participants]);

    // 希望設定の行数をランク数や参加者変化に合わせて同期する
    const syncPreferenceRows = (nextParticipants: Item[], nextRankCount: number) => {
        const current = getValues("preferences") ?? {};
        const next: Record<string, string[]> = {};
        nextParticipants.forEach((participant) => {
            const prevRow = current[participant.id] ?? [];
            const row = prevRow.slice(0, nextRankCount);
            while (row.length < nextRankCount) row.push("");
            next[participant.id] = row;
        });
        setValue("preferences", next, { shouldDirty: true, shouldValidate: true });
    };

    // ランク数を更新して関連する重みと希望設定をリセットする
    const updateRankCount = (value: number) => {
        const nextRankCount = clampRankCount(value, parts.length);
        setValue("rankCount", nextRankCount, { shouldDirty: true, shouldValidate: true });
        setValue("weights", createDefaultWeights(nextRankCount), { shouldDirty: true, shouldValidate: true });
        syncPreferenceRows(participants, nextRankCount);
        clearResult();
    };

    // 参加者の名前を更新する
    const updateParticipantName = (id: string, value: string) => {
        const next = participants.map((participant) =>
            participant.id === id ? { ...participant, name: value } : participant,
        );
        setValue("participants", next, { shouldDirty: true, shouldValidate: true });
        clearResult();
    };

    // 参加者を末尾に追加する
    const addParticipant = () => {
        const nextParticipant = { id: createId(), name: `参加者${participants.length + 1}` };
        participantsFieldArray.append(nextParticipant);

        const nextPreferences = {
            ...(getValues("preferences") ?? {}),
            [nextParticipant.id]: Array.from({ length: normalizedRankCount }, () => ""),
        };
        setValue("preferences", nextPreferences, { shouldDirty: true, shouldValidate: true });
        void trigger();
        clearResult();
    };

    // 参加者を削除する（最低 1 名は残す）
    const removeParticipant = (id: string) => {
        if (participants.length <= 1) return;
        const index = participants.findIndex((participant) => participant.id === id);
        if (index < 0) return;

        participantsFieldArray.remove(index);
        const currentPreferences = getValues("preferences") ?? {};
        const { [id]: _removed, ...rest } = currentPreferences;
        setValue("preferences", rest, { shouldDirty: true, shouldValidate: true });
        void trigger();
        clearResult();
    };

    // 参加者を上下に移動する（順序入れ替え）
    const moveParticipant = (id: string, direction: -1 | 1) => {
        const index = participants.findIndex((participant) => participant.id === id);
        const target = index + direction;
        if (index < 0 || target < 0 || target >= participants.length) return;
        participantsFieldArray.move(index, target);
        void trigger();
        clearResult();
    };

    // パートの名前を更新する
    const updatePartName = (id: string, value: string) => {
        const next = parts.map((part) => (part.id === id ? { ...part, name: value } : part));
        setValue("parts", next, { shouldDirty: true, shouldValidate: true });
        clearResult();
    };

    // パートを末尾に追加する
    const addPart = () => {
        partsFieldArray.append({ id: createId(), name: `パート${parts.length + 1}` });
        void trigger();
        clearResult();
    };

    // パートを削除する（最低 1 件は残す）
    const removePart = (id: string) => {
        if (parts.length <= 1) return;
        const index = parts.findIndex((part) => part.id === id);
        if (index < 0) return;

        const nextParts = parts.filter((part) => part.id !== id);
        partsFieldArray.remove(index);

        const current = getValues("preferences") ?? {};
        const copy: Record<string, string[]> = {};
        participants.forEach((participant) => {
            const row = (current[participant.id] ?? []).map((partId) => (partId === id ? "" : partId));
            copy[participant.id] = row.slice(0, Math.min(normalizedRankCount, nextParts.length));
            while (copy[participant.id].length < Math.min(normalizedRankCount, nextParts.length)) {
                copy[participant.id].push("");
            }
        });
        setValue("preferences", copy, { shouldDirty: true, shouldValidate: true });

        const maxRank = Math.max(nextParts.length, 1);
        if (rankCount > maxRank) {
            updateRankCount(maxRank);
        }
        void trigger();
        clearResult();
    };

    // パートを上下に移動する（順序入れ替え）
    const movePart = (id: string, direction: -1 | 1) => {
        const index = parts.findIndex((part) => part.id === id);
        const target = index + direction;
        if (index < 0 || target < 0 || target >= parts.length) return;
        partsFieldArray.move(index, target);
        void trigger();
        clearResult();
    };

    // 特定参加者の指定ランクの希望パートを更新する
    const updatePreference = (participantId: string, rankIndex: number, partId: string) => {
        const current = getValues("preferences") ?? {};
        const row = [...(current[participantId] ?? [])];
        while (row.length < normalizedRankCount) row.push("");
        row[rankIndex] = partId;
        setValue("preferences", { ...current, [participantId]: row }, { shouldDirty: true, shouldValidate: true, shouldTouch: true });
        clearResult();
    };

    // 指定ランクの配点重みを更新する
    const updateWeight = (rankIndex: number, value: number) => {
        const next = [...(getValues("weights") ?? [])];
        while (next.length < normalizedRankCount) next.push(0);
        next[rankIndex] = value;
        setValue("weights", next, { shouldDirty: true, shouldValidate: true });
        clearResult();
    };

    // 希望入力セルを touched としてマークする
    const touchPreference = (participantId: string, rankIndex: number) => {
        const fieldPath = `preferences.${participantId}` as const;
        const currentRow = [...(getValues(fieldPath) ?? [])];
        while (currentRow.length < normalizedRankCount) currentRow.push("");
        if (currentRow[rankIndex] === undefined) currentRow[rankIndex] = "";
        setValue(fieldPath, currentRow, { shouldTouch: true, shouldValidate: true });
    };

    // 全設定をデフォルト値に戻してストレージも削除する
    const resetAll = () => {
        const nextParticipants = defaultParticipants();
        const nextParts = defaultParts();
        const nextRankCount = 3;
        clearPartAssignSettings();
        reset({
            participants: nextParticipants,
            parts: nextParts,
            rankCount: nextRankCount,
            weights: createDefaultWeights(nextRankCount),
            preferences: createDefaultPreferences(nextParticipants, nextRankCount),
        });
        setResult(createEmptyResult());
    };

    // フォーム値を初期設定で再初期化する
    const resetByInitialSettings = () => {
        reset(getInitialPartAssignSettings());
        setResult(createEmptyResult());
    };

    // 全探索でベストなパート割り当てを計算する
    const solve = () => {
        if (!canSolve) {
            setResult(createEmptyResult());
            return;
        }

        const n = participants.length;
        const scoreMatrix: number[][] = participants.map((participant) => {
            const row = preferences[participant.id] ?? [];
            return parts.map((part) => {
                const rankIndex = row.findIndex((partId) => partId === part.id);
                if (rankIndex === -1) return unrankedPenalty;
                return normalizedWeights[rankIndex] ?? 0;
            });
        });

        const used = Array.from({ length: n }, () => false);
        const currentAssignment = Array.from({ length: n }, () => -1);
        const candidates: AssignmentCandidate[] = [];
        let bestScore = Number.NEGATIVE_INFINITY;
        let tieCount = 0;

        // 現在の割り当て状態から AssignmentCandidate オブジェクトを構築する
        const buildCandidate = (totalScore: number): AssignmentCandidate => {
            const lines: AssignmentLine[] = participants.map((participant, participantIndex) => {
                const partIndex = currentAssignment[participantIndex];
                const part = parts[partIndex];
                const row = preferences[participant.id] ?? [];
                const rankIndex = row.findIndex((partId) => partId === part.id);
                return {
                    participantId: participant.id,
                    participantName: participant.name,
                    partId: part.id,
                    partName: part.name,
                    rank: rankIndex >= 0 ? rankIndex + 1 : null,
                    score: scoreMatrix[participantIndex][partIndex],
                };
            });
            return { totalScore, lines };
        };

        // 深さ優先探索で全割り当てパターンを探索する
        const dfs = (depth: number, score: number) => {
            if (depth === n) {
                if (score > bestScore) {
                    bestScore = score;
                    tieCount = 1;
                    candidates.length = 0;
                    candidates.push(buildCandidate(score));
                } else if (score === bestScore) {
                    tieCount += 1;
                    if (candidates.length < MAX_TIE_RESULTS) {
                        candidates.push(buildCandidate(score));
                    }
                }
                return;
            }

            for (let partIndex = 0; partIndex < n; partIndex += 1) {
                if (used[partIndex]) continue;
                used[partIndex] = true;
                currentAssignment[depth] = partIndex;
                dfs(depth + 1, score + scoreMatrix[depth][partIndex]);
                used[partIndex] = false;
            }
        };

        dfs(0, 0);

        setResult({
            totalBestScore: Number.isFinite(bestScore) ? bestScore : null,
            candidates,
            overflowCount: Math.max(tieCount - MAX_TIE_RESULTS, 0),
            searchedCount: calcSearchCount(n),
        });
    };

    return {
        participants,
        parts,
        rankCount: normalizedRankCount,
        rankOptions: Array.from({ length: normalizedRankCount }, (_, index) => index + 1),
        weights: normalizedWeights,
        unrankedPenalty,
        preferences,
        result,
        globalIssues,
        participantIssuesById,
        partIssuesById,
        preferenceIssuesByKey,
        canSolve,
        createPreferenceIssueKey,
        touchPreference,
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
        updateWeight,
        persistSettings,
        solve,
        resetAll,
        resetByInitialSettings,
        maxTieResults: MAX_TIE_RESULTS,
        maxSearchSize: MAX_SEARCH_SIZE,
    };
}
