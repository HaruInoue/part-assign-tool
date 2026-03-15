// 参加者またはパートを表す汎用アイテム
export interface Item {
    id: string;
    name: string;
}

// 割り当て結果の1行（参加者1人分のパート・スコア情報）
export interface AssignmentLine {
    participantId: string;
    participantName: string;
    partId: string;
    partName: string;
    rank: number | null;
    score: number;
}

// 1つの割り当て候補（全参加者分の割り当てセット）
export interface AssignmentCandidate {
    totalScore: number;
    lines: AssignmentLine[];
}

// パート割り当て全体の計算結果
export interface SolveResult {
    totalBestScore: number | null;
    candidates: AssignmentCandidate[];
    overflowCount: number;
    searchedCount: number;
}

// アプリ設定（参加者・パート・希望・重みを含む）の保存形式
export interface PartAssignSettings {
    participants: Item[];
    parts: Item[];
    rankCount: number;
    weights: number[];
    preferences: Record<string, string[]>;
}

// バリデーションエラーの表示対象スコープ種別
export type ValidationIssueScope = "global" | "participant" | "part" | "preference";

// 入力項目に紐づけるバリデーションエラー情報
export interface ValidationIssue {
    scope: ValidationIssueScope;
    message: string;
    participantId?: string;
    partId?: string;
    rankIndex?: number;
}
