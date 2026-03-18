import { useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
    loadPartAssignSettings,
    loadPartAssignSettingsFromUrl,
    savePartAssignSettings,
} from "@/features/partAssignPersistence";

import type { Item, PartAssignSettings } from "@/features/types/partAssignTypes";
import type { UrlStateLoadStatus } from "@/features/partAssignPersistence";
import type { UseFormReturn } from "react-hook-form";

export const NO_PREFERENCE = "__NO_PREFERENCE__";

let initialUrlLoadStatus: UrlStateLoadStatus = "none";

export const getInitialUrlLoadStatus = () => initialUrlLoadStatus;

// ユニークな ID を生成する
export const createId = () => {
    const alphabet = "0123456789abcdefghijklmnopqrstuvwxyz";
    if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
        const bytes = new Uint8Array(7);
        crypto.getRandomValues(bytes);
        return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
    }
    return Math.random().toString(36).slice(2, 9).padEnd(7, "0");
};

// デフォルト参加者リスト（3名）を生成する
export const defaultParticipants = (): Item[] =>
    Array.from({ length: 3 }, (_, index) => ({
        id: createId(),
        name: `参加者${index + 1}`,
    }));

// デフォルトパートリスト（3件）を生成する
export const defaultParts = (): Item[] =>
    Array.from({ length: 3 }, (_, index) => ({
        id: createId(),
        name: `パート${index + 1}`,
    }));

// ランク数に応じた降順のデフォルト重み配列を生成する
export const createDefaultWeights = (rankCount: number): number[] =>
    Array.from({ length: rankCount }, (_, index) => rankCount - index);

// ランク数を 1 以上かつパート数以下の範囲に収める
export const clampRankCount = (value: number, partCount: number) =>
    Math.min(Math.max(value, 1), Math.max(partCount, 1));

// ランク数が変わった場合に重み配列をデフォルト値で再生成する
export const normalizeWeightsByRankCount = (values: number[], nextRankCount: number): number[] => {
    if (values.length !== nextRankCount) {
        return createDefaultWeights(nextRankCount);
    }
    return values.slice(0, nextRankCount);
};

// 全参加者の空希望設定（空文字列で埋めた Record）を生成する
export const createDefaultPreferences = (
    items: Item[],
    nextRankCount: number,
): Record<string, string[]> => {
    const next: Record<string, string[]> = {};
    items.forEach((item) => {
        next[item.id] = Array.from({ length: nextRankCount }, () => "");
    });
    return next;
};

// 参加者・パート・ランク数の変化に合わせて希望設定を正規化する
export const normalizePreferences = (
    source: Record<string, string[]>,
    nextParticipants: Item[],
    nextParts: Item[],
    nextRankCount: number,
): Record<string, string[]> => {
    const validPartIds = new Set(nextParts.map((part) => part.id));
    const isValidPreferenceValue = (partId: string) =>
        partId === NO_PREFERENCE || validPartIds.has(partId);
    const next: Record<string, string[]> = {};

    nextParticipants.forEach((participant) => {
        const rawRow = source[participant.id] ?? [];
        const row = rawRow
            .slice(0, nextRankCount)
            .map((partId) => (isValidPreferenceValue(partId) ? partId : ""));
        while (row.length < nextRankCount) row.push("");
        next[participant.id] = row;
    });

    return next;
};

// localStorage から初期設定を読み込む（存在しない場合はデフォルト値を返す）
export const getInitialPartAssignSettings = (): PartAssignSettings => {
    const fallbackParticipants = defaultParticipants();
    const fallbackParts = defaultParts();
    const fallbackRankCount = 3;
    const fallbackSettings: PartAssignSettings = {
        participants: fallbackParticipants,
        parts: fallbackParts,
        rankCount: fallbackRankCount,
        weights: createDefaultWeights(fallbackRankCount),
        unrankedPenalty: -fallbackParts.length,
        preferences: createDefaultPreferences(fallbackParticipants, fallbackRankCount),
    };

    const normalizeSettings = (source: PartAssignSettings) => {
        const participants = source.participants.length > 0 ? source.participants : fallbackParticipants;
        const parts = source.parts.length > 0 ? source.parts : fallbackParts;
        const rankCount = clampRankCount(source.rankCount, parts.length);
        const weights = normalizeWeightsByRankCount(source.weights, rankCount);
        const unrankedPenalty = source.unrankedPenalty;
        const preferences = normalizePreferences(source.preferences, participants, parts, rankCount);

        return { participants, parts, rankCount, weights, unrankedPenalty, preferences };
    };

    const urlLoadResult = loadPartAssignSettingsFromUrl();
    initialUrlLoadStatus = urlLoadResult.status;

    if (urlLoadResult.settings) {
        const normalized = normalizeSettings(urlLoadResult.settings);
        savePartAssignSettings(normalized);
        return normalized;
    }

    const stored = loadPartAssignSettings();
    if (!stored) return fallbackSettings;

    return normalizeSettings(stored);
};

// PartAssignSettings の Zod スキーマを定義する
const partAssignSchema = z
    .object({
        participants: z.array(
            z.object({
                id: z.string(),
                name: z.string().trim().min(1, "名前を入力してください。"),
            }),
        ),
        parts: z.array(
            z.object({
                id: z.string(),
                name: z.string().trim().min(1, "名前を入力してください。"),
            }),
        ),
        rankCount: z.number().int().min(1),
        weights: z.array(z.number()),
        unrankedPenalty: z.number(),
        preferences: z.record(z.string(), z.array(z.string())),
    })
    .superRefine((value, context) => {
        if (value.participants.length === 0) {
            context.addIssue({
                code: "custom",
                path: ["root", "participantCount"],
                message: "参加者を1人以上登録してください。",
            });
        }

        if (value.parts.length === 0) {
            context.addIssue({
                code: "custom",
                path: ["root", "partCount"],
                message: "パートを1件以上登録してください。",
            });
        }

        if (value.participants.length !== value.parts.length) {
            context.addIssue({
                code: "custom",
                path: ["root", "countMismatch"],
                message: "参加者数とパート数が一致していないため計算できません。",
            });
        }

        if (value.participants.length > 30) {
            context.addIssue({
                code: "custom",
                path: ["root", "searchLimit"],
                message: "総当たり探索の上限(30人)を超えています。参加者数を減らしてください。",
            });
        }

        const participantNameMap = new Map<string, number[]>();
        value.participants.forEach((participant, index) => {
            const name = participant.name.trim();
            if (!name) return;
            participantNameMap.set(name, [...(participantNameMap.get(name) ?? []), index]);
        });

        participantNameMap.forEach((indexes, name) => {
            if (indexes.length < 2) return;
            indexes.forEach((index) => {
                context.addIssue({
                    code: "custom",
                    path: ["participants", index, "name"],
                    message: `参加者名「${name}」が重複しています。`,
                });
            });
        });

        const partNameMap = new Map<string, number[]>();
        value.parts.forEach((part, index) => {
            const name = part.name.trim();
            if (!name) return;
            partNameMap.set(name, [...(partNameMap.get(name) ?? []), index]);
        });

        partNameMap.forEach((indexes, name) => {
            if (indexes.length < 2) return;
            indexes.forEach((index) => {
                context.addIssue({
                    code: "custom",
                    path: ["parts", index, "name"],
                    message: `パート名「${name}」が重複しています。`,
                });
            });
        });

        const normalizedRankCount = clampRankCount(value.rankCount, value.parts.length);
        const validPartIds = new Set(value.parts.map((part) => part.id));

        value.participants.forEach((participant) => {
            const row = (value.preferences[participant.id] ?? []).slice(0, normalizedRankCount);
            while (row.length < normalizedRankCount) row.push("");

            row.forEach((partId, rankIndex) => {
                if (partId && (partId === NO_PREFERENCE || validPartIds.has(partId))) return;
                context.addIssue({
                    code: "custom",
                    path: ["preferences", participant.id, rankIndex],
                    message: `第${rankIndex + 1}希望を選択してください。`,
                });
            });

            const selectedPartMap = new Map<string, number[]>();
            row.forEach((partId, rankIndex) => {
                if (!partId || partId === NO_PREFERENCE) return;
                selectedPartMap.set(partId, [...(selectedPartMap.get(partId) ?? []), rankIndex]);
            });

            selectedPartMap.forEach((rankIndexes) => {
                if (rankIndexes.length < 2) return;
                rankIndexes.forEach((rankIndex) => {
                    context.addIssue({
                        code: "custom",
                        path: ["preferences", participant.id, rankIndex],
                        message: "同じパートが重複しています。",
                    });
                });
            });
        });
    });

export type PartAssignForm = UseFormReturn<PartAssignSettings>;

// React Hook Form のフォーム定義を初期化して返す
export function usePartAssignForm(): PartAssignForm {
    const defaultValues = useMemo(getInitialPartAssignSettings, []);

    return useForm<PartAssignSettings>({
        defaultValues,
        mode: "onChange",
        resolver: zodResolver(partAssignSchema),
        criteriaMode: "all",
    });
}
