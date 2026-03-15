import type { Route } from "@/routes/+types/PartAssignPage";

import { usePartAssign } from "@/features/usePartAssign";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "パート割り当てツール" },
    { name: "description", content: "優先順位から総当りで計算してパートの割当を行う。" },
  ];
}

export default function PartAssignPage() {
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
    maxTieResults,
    maxSearchSize,
  } = usePartAssign();

  return (
    <main className="min-h-screen bg-white px-4 py-6 text-neutral-900 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="border border-neutral-800 bg-white p-6">
          <h1 className="text-3xl font-semibold tracking-tight">パート割り当てツール</h1>
          <p className="mt-2 text-sm text-neutral-600">
            参加者が回答した優先順位を元に、誰がどのパートを担当するのが最適かを計算するツールです。
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="border border-neutral-300 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">パート設定</h2>
              <button
                type="button"
                className="border border-neutral-900 bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-800"
                onClick={addPart}
              >
                パート追加
              </button>
            </div>
            <div className="space-y-2">
              {parts.map((part, index) => {
                const partIssues = partIssuesById[part.id] ?? [];

                return (
                  <div key={part.id} className="grid grid-cols-[1fr_auto] gap-2">
                    <div>
                      <input
                        value={part.name}
                        onChange={(event) => updatePartName(part.id, event.target.value)}
                        onBlur={persistSettings}
                        className={`w-full border px-3 py-2 text-sm focus:outline-none ${partIssues.length > 0 ? "border-red-500 focus:border-red-600" : "border-neutral-400 focus:border-neutral-900"}`}
                        placeholder={`パート${index + 1}`}
                        aria-invalid={partIssues.length > 0}
                      />
                      {partIssues.length > 0 && (
                        <ul className="mt-1 space-y-1 text-xs text-red-700">
                          {partIssues.map((issue, issueIndex) => (
                            <li key={`${part.id}-${issue}-${issueIndex}`}>{issue}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="flex gap-1 self-start">
                      <button
                        type="button"
                        className="border border-neutral-400 px-2 py-1 text-xs hover:bg-neutral-100"
                        onClick={() => movePart(part.id, -1)}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="border border-neutral-400 px-2 py-1 text-xs hover:bg-neutral-100"
                        onClick={() => movePart(part.id, 1)}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className="border border-neutral-500 px-2 py-1 text-xs text-neutral-700 hover:bg-neutral-100"
                        onClick={() => removePart(part.id)}
                        disabled={parts.length <= 1}
                      >
                        削除
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border border-neutral-300 bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">参加者設定</h2>
              <button
                type="button"
                className="border border-neutral-900 bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-800"
                onClick={addParticipant}
              >
                参加者追加
              </button>
            </div>
            <div className="space-y-2">
              {participants.map((participant, index) => {
                const participantIssues = participantIssuesById[participant.id] ?? [];

                return (
                  <div key={participant.id} className="grid grid-cols-[1fr_auto] gap-2">
                    <div>
                      <input
                        value={participant.name}
                        onChange={(event) => updateParticipantName(participant.id, event.target.value)}
                        onBlur={persistSettings}
                        className={`w-full border px-3 py-2 text-sm focus:outline-none ${participantIssues.length > 0 ? "border-red-500 focus:border-red-600" : "border-neutral-400 focus:border-neutral-900"}`}
                        placeholder={`参加者${index + 1}`}
                        aria-invalid={participantIssues.length > 0}
                      />
                      {participantIssues.length > 0 && (
                        <ul className="mt-1 space-y-1 text-xs text-red-700">
                          {participantIssues.map((issue, issueIndex) => (
                            <li key={`${participant.id}-${issue}-${issueIndex}`}>{issue}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="flex gap-1 self-start">
                      <button
                        type="button"
                        className="border border-neutral-400 px-2 py-1 text-xs hover:bg-neutral-100"
                        onClick={() => moveParticipant(participant.id, -1)}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="border border-neutral-400 px-2 py-1 text-xs hover:bg-neutral-100"
                        onClick={() => moveParticipant(participant.id, 1)}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className="border border-neutral-500 px-2 py-1 text-xs text-neutral-700 hover:bg-neutral-100"
                        onClick={() => removeParticipant(participant.id)}
                        disabled={participants.length <= 1}
                      >
                        削除
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border border-neutral-300 bg-white p-5">
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <label className="mb-1 block text-sm font-medium text-neutral-700">希望数</label>
            <input
              type="number"
              min={1}
              max={Math.max(parts.length, 1)}
              value={rankCount}
              onChange={(event) => updateRankCount(Number(event.target.value))}
              onBlur={persistSettings}
              className="w-24 border border-neutral-400 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
            />
            <div className="flex flex-wrap gap-2">
              {rankOptions.map((rank, index) => (
                <label key={rank} className="flex items-center gap-2 border border-neutral-300 px-2 py-1 text-xs">
                  {rank}位
                  <input
                    type="number"
                    value={weights[index] ?? 0}
                    onChange={(event) => updateWeight(index, Number(event.target.value))}
                    onBlur={persistSettings}
                    className="w-14 border border-neutral-400 px-2 py-1 text-xs"
                  />
                </label>
              ))}
                <label className="flex items-center gap-2 border border-neutral-300 px-2 py-1 text-xs">
                  圏外
                  <input
                    type="number"
                    value={unrankedPenalty}
                    readOnly
                    className="w-14 border border-neutral-400 px-2 py-1 text-xs"
                  />
                </label>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-neutral-300 text-left text-neutral-700">
                  <th className="px-2 py-2 font-medium">参加者</th>
                  {rankOptions.map((rank) => (
                    <th key={rank} className="px-2 py-2 font-medium">第{rank}希望</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {participants.map((participant) => (
                  <tr key={participant.id} className="border-b border-neutral-200 align-top">
                    <td className="px-2 py-2 font-medium">{participant.name || "未命名参加者"}</td>
                    {rankOptions.map((_, rankIndex) => {
                      const preferenceIssues =
                        preferenceIssuesByKey[createPreferenceIssueKey(participant.id, rankIndex)] ?? [];

                      return (
                        <td key={`${participant.id}-${rankIndex}`} className="px-2 py-2 align-top">
                          <select
                            value={preferences[participant.id]?.[rankIndex] ?? ""}
                            onChange={(event) =>
                              updatePreference(participant.id, rankIndex, event.target.value)
                            }
                            onBlur={persistSettings}
                            className={`w-full border px-2 py-2 text-sm focus:outline-none ${preferenceIssues.length > 0 ? "border-red-500 focus:border-red-600" : "border-neutral-400 focus:border-neutral-900"}`}
                            aria-invalid={preferenceIssues.length > 0}
                          >
                            <option value="">選択してください</option>
                            {parts.map((part) => (
                              <option key={part.id} value={part.id}>
                                {part.name || "未命名パート"}
                              </option>
                            ))}
                          </select>
                          {preferenceIssues.length > 0 && (
                            <ul className="mt-1 space-y-1 text-xs text-red-700">
                              {preferenceIssues.map((issue, issueIndex) => (
                                <li key={`${participant.id}-${rankIndex}-${issue}-${issueIndex}`}>{issue}</li>
                              ))}
                            </ul>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="border border-neutral-300 bg-white p-5">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={solve}
              disabled={!canSolve}
              className="border border-neutral-900 bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:border-neutral-300 disabled:bg-neutral-300"
            >
              最適割り当てを計算
            </button>
            <button
              type="button"
              onClick={resetAll}
              className="border border-neutral-400 px-4 py-2 text-sm font-medium hover:bg-neutral-100"
            >
              初期化
            </button>
            <span className="text-xs text-neutral-500">
              探索対象: {participants.length}! 通り / 上限: {maxSearchSize}人
            </span>
          </div>

          {globalIssues.length > 0 ? (
            <ul className="mt-4 space-y-1 border border-neutral-500 bg-neutral-100 p-3 text-sm text-neutral-800">
              {globalIssues.map((issue, index) => (
                <li key={`${issue}-${index}`}>• {issue}</li>
              ))}
            </ul>
          ) : !canSolve ? (
            <p className="mt-4 border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              入力欄のエラーを修正すると計算できます。
            </p>
          ) : (
            <p className="mt-4 border border-neutral-500 bg-neutral-100 p-3 text-sm text-neutral-800">
              入力は有効です。計算を実行できます。
            </p>
          )}
        </section>

        <section className="border border-neutral-300 bg-white p-5">
          <h2 className="text-lg font-semibold">結果</h2>
          {result.totalBestScore === null ? (
            <p className="mt-3 text-sm text-neutral-600">まだ計算結果はありません。</p>
          ) : (
            <div className="mt-3 space-y-4">
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <span className="border border-neutral-300 bg-neutral-100 px-2 py-1">
                  最高得点: {result.totalBestScore}
                </span>
                <span className="border border-neutral-300 bg-neutral-100 px-2 py-1">
                  表示候補: {result.candidates.length}件
                </span>
                <span className="border border-neutral-300 bg-neutral-100 px-2 py-1">
                  探索件数: {result.searchedCount.toLocaleString()}通り
                </span>
              </div>

              {result.overflowCount > 0 && (
                <p className="border border-neutral-500 bg-neutral-100 p-3 text-sm text-neutral-800">
                  同点候補が多数あるため、上位{maxTieResults}件を表示中です。未表示: {result.overflowCount}件
                </p>
              )}

              <div className="grid gap-3">
                {result.candidates.map((candidate, index) => (
                  <article key={`${candidate.totalScore}-${index}`} className="border border-neutral-300 p-3">
                    <h3 className="mb-2 text-sm font-semibold">候補 {index + 1}</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full border-collapse text-sm">
                        <thead>
                          <tr className="border-b border-neutral-300 text-left text-neutral-700">
                            <th className="px-2 py-2">参加者</th>
                            <th className="px-2 py-2">担当パート</th>
                            <th className="px-2 py-2">達成希望</th>
                            <th className="px-2 py-2">得点</th>
                          </tr>
                        </thead>
                        <tbody>
                          {candidate.lines.map((line) => (
                            <tr key={line.participantId} className="border-b border-neutral-200">
                              <td className="px-2 py-2">{line.participantName}</td>
                              <td className="px-2 py-2">{line.partName}</td>
                              <td className="px-2 py-2">
                                {line.rank === null ? "圏外" : `第${line.rank}希望`}
                              </td>
                              <td className="px-2 py-2">{line.score}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
