import type { AnswerResult, AnsweredQuestion, ItemHistory, LessonStat, MemoryData, MemoryEntry } from "@/types";
import { accuracyPct, computeLessonBreakdown } from "@/lib/helpers";

/** Adds one answer to a word's history (creates the history if there is none yet). */
export function bumpHistory(prev: ItemHistory | undefined, result: AnswerResult, today: string): ItemHistory {
  const h: ItemHistory = prev
    ? { ...prev }
    : { correctCount: 0, incorrectCount: 0, skippedCount: 0, totalAttempts: 0, lastResult: result, lastTestedDate: today };
  h.totalAttempts += 1;
  h.lastResult = result;
  h.lastTestedDate = today;
  if (result === "correct") h.correctCount += 1;
  else if (result === "incorrect") h.incorrectCount += 1;
  else h.skippedCount += 1;
  return h;
}

/**
 * Words enter Memory when answered wrong or skipped, and stay until the user deletes them.
 * A new entry is seeded with the word's lifetime history (`priorStats`), so earlier correct
 * answers are counted too. Correct answers on words already in Memory are recorded, never removed.
 */
export function applyAnswersToMemory(
  memory: MemoryData,
  answers: AnsweredQuestion[],
  priorStats: Record<string, ItemHistory>,
  today: string
): MemoryData {
  const entries: Record<string, MemoryEntry> = { ...memory.entries };
  for (const a of answers) {
    const { vocabId, lesson } = a.question;
    const existing = entries[vocabId];
    if (existing) {
      entries[vocabId] = { ...existing, history: bumpHistory(existing.history, a.result, today) };
    } else if (a.result !== "correct") {
      entries[vocabId] = { vocabId, lesson, addedDate: today, history: bumpHistory(priorStats[vocabId], a.result, today) };
    }
  }
  return { entries };
}

export function applyLessonStats(
  prev: Record<number, LessonStat>,
  answers: AnsweredQuestion[],
  dateISO: string
): Record<number, LessonStat> {
  const out = { ...prev };
  for (const [lessonStr, b] of Object.entries(computeLessonBreakdown(answers))) {
    const lesson = Number(lessonStr);
    const acc = accuracyPct(b.correct, b.total);
    const old = out[lesson];
    const attempts = (old?.attempts ?? 0) + 1;
    out[lesson] = {
      lesson,
      attempts,
      bestScore: Math.max(old?.bestScore ?? 0, acc),
      lastScore: acc,
      previousScore: old ? old.lastScore : acc,
      correct: (old?.correct ?? 0) + b.correct,
      incorrect: (old?.incorrect ?? 0) + b.incorrect,
      skipped: (old?.skipped ?? 0) + b.skipped,
      totalAnswered: (old?.totalAnswered ?? 0) + b.total,
      avgTimeSec: Math.round(((old?.avgTimeSec ?? 0) * (old?.attempts ?? 0) + b.timeSec) / attempts),
      history: [...(old?.history ?? []), { date: dateISO, accuracy: acc }].slice(-20),
    };
  }
  return out;
}
