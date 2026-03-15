import { useCallback, useEffect, useMemo, useState } from "react";

import {
  clearPartAssignSettings,
  loadPartAssignSettings,
  savePartAssignSettings,
} from "@/features/partAssignStorage";

const MAX_TIE_RESULTS = 100;
const MAX_SEARCH_SIZE = 30;

import type {
  Item,
  AssignmentLine,
  AssignmentCandidate,
  SolveResult,
  PartAssignSettings,
  ValidationIssue,
} from "@/features/types/partAssignTypes";

// 空の計算結果オブジェクトを生成する
const createEmptyResult = (): SolveResult => ({
  totalBestScore: null,
  candidates: [],
  overflowCount: 0,
  searchedCount: 0,
});

// ユニークな ID を生成する
const createId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

// デフォルト参加者リスト（3名）を生成する
const defaultParticipants = (): Item[] =>
  Array.from({ length: 3 }, (_, index) => ({
    id: createId(),
    name: `参加者${index + 1}`,
  }));

// デフォルトパートリスト（3件）を生成する
const defaultParts = (): Item[] =>
  Array.from({ length: 3 }, (_, index) => ({
    id: createId(),
    name: `パート${index + 1}`,
  }));

// ランク数に応じた降順のデフォルト重み配列を生成する
const createDefaultWeights = (rankCount: number): number[] =>
  Array.from({ length: rankCount }, (_, index) => rankCount - index);

// ランク数を 1 以上かつパート数以下の範囲に収める
const clampRankCount = (value: number, partCount: number) =>
  Math.min(Math.max(value, 1), Math.max(partCount, 1));

// ランク数が変わった場合に重み配列をデフォルト値で再生成する
const normalizeWeightsByRankCount = (values: number[], nextRankCount: number): number[] => {
  if (values.length !== nextRankCount) {
    return createDefaultWeights(nextRankCount);
  }
  return values.slice(0, nextRankCount);
};

// 全参加者の空希望設定（空文字列で埋めた Record）を生成する
const createDefaultPreferences = (items: Item[], nextRankCount: number): Record<string, string[]> => {
  const next: Record<string, string[]> = {};
  items.forEach((item) => {
    next[item.id] = Array.from({ length: nextRankCount }, () => "");
  });
  return next;
};

// 参加者・パート・ランク数の変化に合わせて希望設定を正規化する
const normalizePreferences = (
  source: Record<string, string[]>,
  nextParticipants: Item[],
  nextParts: Item[],
  nextRankCount: number,
): Record<string, string[]> => {
  const validPartIds = new Set(nextParts.map((part) => part.id));
  const next: Record<string, string[]> = {};

  nextParticipants.forEach((participant) => {
    const rawRow = source[participant.id] ?? [];
    const row = rawRow
      .slice(0, nextRankCount)
      .map((partId) => (validPartIds.has(partId) ? partId : ""));
    while (row.length < nextRankCount) row.push("");
    next[participant.id] = row;
  });

  return next;
};

// localStorage から初期設定を読み込む（存在しない場合はデフォルト値を返す）
const getInitialSettings = (): PartAssignSettings => {
  const fallbackParticipants = defaultParticipants();
  const fallbackParts = defaultParts();
  const fallbackRankCount = 3;
  const fallbackSettings: PartAssignSettings = {
    participants: fallbackParticipants,
    parts: fallbackParts,
    rankCount: fallbackRankCount,
    weights: createDefaultWeights(fallbackRankCount),
    preferences: createDefaultPreferences(fallbackParticipants, fallbackRankCount),
  };

  const stored = loadPartAssignSettings();
  if (!stored) return fallbackSettings;

  const participants = stored.participants.length > 0 ? stored.participants : fallbackParticipants;
  const parts = stored.parts.length > 0 ? stored.parts : fallbackParts;
  const rankCount = clampRankCount(stored.rankCount, parts.length);
  const weights = normalizeWeightsByRankCount(stored.weights, rankCount);
  const preferences = normalizePreferences(stored.preferences, participants, parts, rankCount);

  return { participants, parts, rankCount, weights, preferences };
};

// n! を計算して全探索数を返す
const calcSearchCount = (n: number) => {
  let value = 1;
  for (let i = 2; i <= n; i += 1) value *= i;
  return value;
};

// 希望入力セルを一意に識別するキーを生成する
const createPreferenceIssueKey = (participantId: string, rankIndex: number) =>
  `${participantId}:${rankIndex}`;

// パート割り当てロジックと状態管理を提供するカスタムフック
export function usePartAssign() {
  const initialSettings = useMemo(getInitialSettings, []);
  const [participants, setParticipants] = useState<Item[]>(initialSettings.participants);
  const [parts, setParts] = useState<Item[]>(initialSettings.parts);
  const [rankCount, setRankCount] = useState<number>(initialSettings.rankCount);
  const [weights, setWeights] = useState<number[]>(initialSettings.weights);
  const [preferences, setPreferences] = useState<Record<string, string[]>>(
    initialSettings.preferences,
  );
  const [result, setResult] = useState<SolveResult>(createEmptyResult());

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
    savePartAssignSettings({
      participants,
      parts,
      rankCount: normalizedRankCount,
      weights: normalizedWeights,
      preferences: normalizePreferences(preferences, participants, parts, normalizedRankCount),
    });
  }, [normalizedRankCount, normalizedWeights, participants, parts, preferences]);

  useEffect(() => {
    persistSettings();
  }, [persistSettings]);

  // 計算実行前のバリデーションエラー一覧
  const issues = useMemo(() => {
    const list: ValidationIssue[] = [];

    if (participants.length === 0) {
      list.push({ scope: "global", message: "参加者を1人以上登録してください。" });
    }
    if (parts.length === 0) {
      list.push({ scope: "global", message: "パートを1件以上登録してください。" });
    }
    if (participants.length !== parts.length) {
      list.push({
        scope: "global",
        message: "参加者数とパート数が一致していないため計算できません。",
      });
    }
    if (participants.length > MAX_SEARCH_SIZE) {
      list.push({
        scope: "global",
        message: `総当たり探索の上限(${MAX_SEARCH_SIZE}人)を超えています。参加者数を減らしてください。`,
      });
    }

    const participantNames = new Map<string, string[]>();
    participants.forEach((participant, index) => {
      const name = participant.name.trim();
      if (!name) {
        list.push({
          scope: "participant",
          participantId: participant.id,
          message: `参加者${index + 1}の名前を入力してください。`,
        });
      } else {
        participantNames.set(name, [...(participantNames.get(name) ?? []), participant.id]);
      }
    });

    participantNames.forEach((participantIds, name) => {
      if (participantIds.length < 2) return;
      participantIds.forEach((participantId) => {
        list.push({
          scope: "participant",
          participantId,
          message: `参加者名「${name}」が重複しています。`,
        });
      });
    });

    const partNames = new Map<string, string[]>();
    parts.forEach((part, index) => {
      const name = part.name.trim();
      if (!name) {
        list.push({
          scope: "part",
          partId: part.id,
          message: `パート${index + 1}の名前を入力してください。`,
        });
      } else {
        partNames.set(name, [...(partNames.get(name) ?? []), part.id]);
      }
    });

    partNames.forEach((partIds, name) => {
      if (partIds.length < 2) return;
      partIds.forEach((partId) => {
        list.push({
          scope: "part",
          partId,
          message: `パート名「${name}」が重複しています。`,
        });
      });
    });

    participants.forEach((participant) => {
      const row = preferences[participant.id] ?? [];
      const picked = row.slice(0, normalizedRankCount);
      while (picked.length < normalizedRankCount) picked.push("");

      picked.forEach((partId, rankIndex) => {
        if (partId) return;
        list.push({
          scope: "preference",
          participantId: participant.id,
          rankIndex,
          message: `第${rankIndex + 1}希望を選択してください。`,
        });
      });

      const selectedParts = new Map<string, number[]>();
      picked.forEach((partId, rankIndex) => {
        if (!partId) return;
        selectedParts.set(partId, [...(selectedParts.get(partId) ?? []), rankIndex]);
      });

      selectedParts.forEach((rankIndexes) => {
        if (rankIndexes.length < 2) return;
        rankIndexes.forEach((rankIndex) => {
          list.push({
            scope: "preference",
            participantId: participant.id,
            rankIndex,
            message: "同じパートが重複しています。",
          });
        });
      });
    });

    return list;
  }, [normalizedRankCount, participants, parts, preferences]);

  const canSolve = issues.length === 0;

  // 全体制約に関するエラーメッセージのみを抽出する
  const globalIssues = useMemo(
    () => issues.filter((issue) => issue.scope === "global").map((issue) => issue.message),
    [issues],
  );

  // 参加者IDごとに名前入力エラーをまとめる
  const participantIssuesById = useMemo(() => {
    const next: Record<string, string[]> = {};
    issues.forEach((issue) => {
      if (issue.scope !== "participant" || !issue.participantId) return;
      next[issue.participantId] = [...(next[issue.participantId] ?? []), issue.message];
    });
    return next;
  }, [issues]);

  // パートIDごとに名前入力エラーをまとめる
  const partIssuesById = useMemo(() => {
    const next: Record<string, string[]> = {};
    issues.forEach((issue) => {
      if (issue.scope !== "part" || !issue.partId) return;
      next[issue.partId] = [...(next[issue.partId] ?? []), issue.message];
    });
    return next;
  }, [issues]);

  // 希望入力セルごとにエラーメッセージをまとめる
  const preferenceIssuesByKey = useMemo(() => {
    const next: Record<string, string[]> = {};
    issues.forEach((issue) => {
      if (
        issue.scope !== "preference"
        || !issue.participantId
        || issue.rankIndex === undefined
      ) {
        return;
      }

      const key = createPreferenceIssueKey(issue.participantId, issue.rankIndex);
      next[key] = [...(next[key] ?? []), issue.message];
    });
    return next;
  }, [issues]);

  // 希望設定の行数をランク数や参加者変化に合わせて同期する
  const syncPreferenceRows = (nextParticipants: Item[], nextRankCount: number) => {
    setPreferences((current) => {
      const next: Record<string, string[]> = {};
      nextParticipants.forEach((participant) => {
        const prevRow = current[participant.id] ?? [];
        const row = prevRow.slice(0, nextRankCount);
        while (row.length < nextRankCount) row.push("");
        next[participant.id] = row;
      });
      return next;
    });
  };

  // ランク数を更新して関連する重みと希望設定をリセットする
  const updateRankCount = (value: number) => {
    const nextRankCount = clampRankCount(value, parts.length);
    setRankCount(nextRankCount);
    setWeights(createDefaultWeights(nextRankCount));
    syncPreferenceRows(participants, nextRankCount);
    clearResult();
  };

  // 参加者の名前を更新する
  const updateParticipantName = (id: string, value: string) => {
    setParticipants((current) =>
      current.map((participant) =>
        participant.id === id ? { ...participant, name: value } : participant,
      ),
    );
    clearResult();
  };

  // 参加者を末尾に追加する
  const addParticipant = () => {
    const next = [...participants, { id: createId(), name: `参加者${participants.length + 1}` }];
    setParticipants(next);
    syncPreferenceRows(next, normalizedRankCount);
    clearResult();
  };

  // 参加者を削除する（最低 1 名は残す）
  const removeParticipant = (id: string) => {
    if (participants.length <= 1) return;
    const next = participants.filter((participant) => participant.id !== id);
    setParticipants(next);
    syncPreferenceRows(next, normalizedRankCount);
    clearResult();
  };

  // 参加者を上下に移動する（順序入れ替え）
  const moveParticipant = (id: string, direction: -1 | 1) => {
    setParticipants((current) => {
      const index = current.findIndex((participant) => participant.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    clearResult();
  };

  // パートの名前を更新する
  const updatePartName = (id: string, value: string) => {
    setParts((current) => current.map((part) => (part.id === id ? { ...part, name: value } : part)));
    clearResult();
  };

  // パートを末尾に追加する
  const addPart = () => {
    const next = [...parts, { id: createId(), name: `パート${parts.length + 1}` }];
    setParts(next);
    const maxRank = Math.max(next.length, 1);
    if (rankCount > maxRank) updateRankCount(maxRank);
    clearResult();
  };

  // パートを削除する（最低 1 件は残す）
  const removePart = (id: string) => {
    if (parts.length <= 1) return;
    const next = parts.filter((part) => part.id !== id);
    setParts(next);
    setPreferences((current) => {
      const copy: Record<string, string[]> = {};
      participants.forEach((participant) => {
        const row = (current[participant.id] ?? []).map((partId) => (partId === id ? "" : partId));
        copy[participant.id] = row.slice(0, Math.min(normalizedRankCount, next.length));
        while (copy[participant.id].length < Math.min(normalizedRankCount, next.length)) {
          copy[participant.id].push("");
        }
      });
      return copy;
    });
    const maxRank = Math.max(next.length, 1);
    if (rankCount > maxRank) updateRankCount(maxRank);
    clearResult();
  };

  // パートを上下に移動する（順序入れ替え）
  const movePart = (id: string, direction: -1 | 1) => {
    setParts((current) => {
      const index = current.findIndex((part) => part.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    clearResult();
  };

  // 特定参加者の指定ランクの希望パートを更新する
  const updatePreference = (participantId: string, rankIndex: number, partId: string) => {
    setPreferences((current) => {
      const row = [...(current[participantId] ?? [])];
      while (row.length < normalizedRankCount) row.push("");
      row[rankIndex] = partId;
      return { ...current, [participantId]: row };
    });
    clearResult();
  };

  // 指定ランクの配点重みを更新する
  const updateWeight = (rankIndex: number, value: number) => {
    setWeights((current) => {
      const next = [...current];
      while (next.length < normalizedRankCount) next.push(0);
      next[rankIndex] = value;
      return next;
    });
    clearResult();
  };

  // 全設定をデフォルト値に戻してストレージも削除する
  const resetAll = () => {
    const nextParticipants = defaultParticipants();
    const nextParts = defaultParts();
    const nextRankCount = 3;
    clearPartAssignSettings();
    setParticipants(nextParticipants);
    setParts(nextParts);
    setRankCount(nextRankCount);
    setWeights(createDefaultWeights(nextRankCount));
    setResult(createEmptyResult());
    setPreferences(createDefaultPreferences(nextParticipants, nextRankCount));
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
    issues,
    globalIssues,
    participantIssuesById,
    partIssuesById,
    preferenceIssuesByKey,
    createPreferenceIssueKey,
    canSolve,
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
    maxTieResults: MAX_TIE_RESULTS,
    maxSearchSize: MAX_SEARCH_SIZE,
  };
}