import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";

import type {
    Item,
    PartAssignSettings,
} from "@/features/types/partAssignTypes";

const STORAGE_KEY = "part-assign-tool:settings";
const URL_STATE_PARAM_KEY = "state";

export type UrlStateLoadStatus = "none" | "success" | "error";

type UrlStateLoadResult = {
    settings: PartAssignSettings | null;
    status: UrlStateLoadStatus;
};

// 値がオブジェクト型かどうかを判定する型ガード
const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null;

// 値が Item 型かどうかを判定する型ガード
const isItem = (value: unknown): value is Item =>
    isRecord(value) && typeof value.id === "string" && typeof value.name === "string";

// 値が文字列配列かどうかを判定する型ガード
const isStringArray = (value: unknown): value is string[] =>
    Array.isArray(value) && value.every((entry) => typeof entry === "string");

// 値が有限数の数値配列かどうかを判定する型ガード
const isNumberArray = (value: unknown): value is number[] =>
    Array.isArray(value) && value.every((entry) => typeof entry === "number" && Number.isFinite(entry));

// 値が希望設定（文字列配列の Record）かどうかを判定する型ガード
const isPreferences = (value: unknown): value is Record<string, string[]> => {
    if (!isRecord(value)) return false;
    return Object.values(value).every((row) => isStringArray(row));
};

// 値が PartAssignSettings 型かどうかを判定する型ガード
const isPartAssignSettings = (value: unknown): value is PartAssignSettings => {
    if (!isRecord(value)) return false;
    if (!Array.isArray(value.participants) || !value.participants.every((item) => isItem(item))) {
        return false;
    }
    if (!Array.isArray(value.parts) || !value.parts.every((item) => isItem(item))) {
        return false;
    }
    if (typeof value.rankCount !== "number") return false;
    if (!Number.isInteger(value.rankCount) || value.rankCount < 1) return false;
    if (typeof value.unrankedPenalty !== "number" || !Number.isFinite(value.unrankedPenalty)) return false;
    if (!isNumberArray(value.weights)) {
        return false;
    }
    return isPreferences(value.preferences);
};

// localStorage から設定を読み込んでバリデーションする
export const loadPartAssignSettings = (): PartAssignSettings | null => {
    if (typeof window === "undefined") return null;

    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed: unknown = JSON.parse(raw);
        if (!isPartAssignSettings(parsed)) return null;
        return {
            participants: parsed.participants,
            parts: parsed.parts,
            rankCount: parsed.rankCount,
            weights: parsed.weights,
            unrankedPenalty: parsed.unrankedPenalty,
            preferences: parsed.preferences,
        };
    } catch {
        return null;
    }
};

// URL クエリから設定を読み込んでバリデーションする
export const loadPartAssignSettingsFromUrl = (): UrlStateLoadResult => {
    if (typeof window === "undefined") {
        return { settings: null, status: "none" };
    }

    const params = new URLSearchParams(window.location.search);
    const encoded = params.get(URL_STATE_PARAM_KEY);
    if (encoded === null) {
        return { settings: null, status: "none" };
    }

    try {
        const json = decompressFromEncodedURIComponent(encoded);
        if (!json) {
            return { settings: null, status: "error" };
        }

        const parsed: unknown = JSON.parse(json);
        if (!isPartAssignSettings(parsed)) {
            return { settings: null, status: "error" };
        }

        return {
            settings: {
                participants: parsed.participants,
                parts: parsed.parts,
                rankCount: parsed.rankCount,
                weights: parsed.weights,
                unrankedPenalty: parsed.unrankedPenalty,
                preferences: parsed.preferences,
            },
            status: "success",
        };
    } catch {
        return { settings: null, status: "error" };
    }
};

// 現在の設定を共有用 URL に変換する
export const createPartAssignShareUrl = (settings: PartAssignSettings): string => {
    if (typeof window === "undefined") return "";

    const serialized = JSON.stringify(settings);
    const compressed = compressToEncodedURIComponent(serialized);
    return `${window.location.origin}${window.location.pathname}?${URL_STATE_PARAM_KEY}=${compressed}`;
};

// 現在の設定を localStorage に保存する
export const savePartAssignSettings = (settings: PartAssignSettings) => {
    if (typeof window === "undefined") return;

    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
        // Ignore quota and JSON errors to avoid blocking UI interactions.
    }
};

// localStorage から設定を削除する
export const clearPartAssignSettings = () => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(STORAGE_KEY);
};