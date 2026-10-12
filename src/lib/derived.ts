import type { ExamRecord, LessonStat, MemoryData, ProgressData } from "@/types";
import { accuracyPct } from "@/lib/helpers";

export function memoryCount(memory: MemoryData): number {
  return Object.keys(memory.entries).length;
}

export function memoryCountByLesson(memory: MemoryData): Record<number, number> {
  const out: Record<number, number> = {};
  for (const e of Object.values(memory.entries)) out[e.lesson] = (out[e.lesson] ?? 0) + 1;
  return out;
}

/** Accuracy over all normal exams. */
export function overallAccuracy(progress: ProgressData): number {
  const stats = Object.values(progress.lessonStats);
  const correct = stats.reduce((s, l) => s + l.correct, 0);
  const total = stats.reduce((s, l) => s + l.totalAnswered, 0);
  return accuracyPct(correct, total);
}

/** Words whose most recent answer was correct. */
export function vocabularyLearnedCount(progress: ProgressData): number {
  return Object.values(progress.vocabStats).filter((h) => h.lastResult === "correct").length;
}

export function lastExam(progress: ProgressData): ExamRecord | null {
  return progress.examHistory[0] ?? null;
}

export interface ImprovementRow extends LessonStat {
  improvement: number;
}

/** Lessons attempted at least twice, most recently practised first. */
export function improvementList(progress: ProgressData): ImprovementRow[] {
  return Object.values(progress.lessonStats)
    .filter((s) => s.attempts > 1)
    .map((s) => ({ ...s, improvement: s.lastScore - s.previousScore }))
    .sort((a, b) => (b.history.at(-1)?.date ?? "").localeCompare(a.history.at(-1)?.date ?? ""));
}
