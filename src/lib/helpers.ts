import type { AnsweredQuestion, StreakData } from "@/types";

/** Local calendar date as YYYY-MM-DD (not UTC, so streaks roll over at the user's midnight). */
export function todayStr(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Whole days from `from` to `to` (both YYYY-MM-DD). */
export function daysBetween(from: string, to: string): number {
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86_400_000);
}

export function accuracyPct(correct: number, total: number): number {
  return total > 0 ? Math.round((correct / total) * 100) : 0;
}

export function formatDuration(totalSec: number): string {
  const sec = Math.max(0, Math.round(totalSec));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) return `${s} sec`;
  if (s === 0) return `${m} min`;
  return `${m} min ${s} sec`;
}

/** ~10 seconds per word, at least 1 minute. */
export function estimateLessonMinutes(wordCount: number): number {
  return Math.max(1, Math.ceil((wordCount * 10) / 60));
}

export interface LessonBreakdown {
  correct: number;
  incorrect: number;
  skipped: number;
  total: number;
  timeSec: number;
}

export function computeLessonBreakdown(answers: AnsweredQuestion[]): Record<number, LessonBreakdown> {
  const out: Record<number, LessonBreakdown> = {};
  for (const a of answers) {
    const l = a.question.lesson;
    const b = (out[l] ??= { correct: 0, incorrect: 0, skipped: 0, total: 0, timeSec: 0 });
    b[a.result] += 1;
    b.total += 1;
    b.timeSec += a.timeMs / 1000;
  }
  return out;
}

export function emptyStreak(): StreakData {
  return { currentStreak: 0, longestStreak: 0, totalActiveDays: 0, lastCheckIn: null, activeDates: [] };
}

/** Pure. Never increases the streak twice on the same day. */
export function performCheckIn(streak: StreakData, today: string = todayStr()): { streak: StreakData; alreadyCheckedIn: boolean } {
  if (streak.lastCheckIn === today) return { streak, alreadyCheckedIn: true };
  const continued = streak.lastCheckIn !== null && daysBetween(streak.lastCheckIn, today) === 1;
  const currentStreak = continued ? streak.currentStreak + 1 : 1;
  const activeDates = streak.activeDates.includes(today) ? streak.activeDates : [...streak.activeDates, today];
  return {
    alreadyCheckedIn: false,
    streak: {
      currentStreak,
      longestStreak: Math.max(streak.longestStreak, currentStreak),
      totalActiveDays: activeDates.length,
      lastCheckIn: today,
      activeDates,
    },
  };
}

/** If the user missed a day, the running streak is 0 until the next check-in. */
export function expireStreak(streak: StreakData, today: string = todayStr()): StreakData {
  if (streak.lastCheckIn && daysBetween(streak.lastCheckIn, today) > 1 && streak.currentStreak !== 0) {
    return { ...streak, currentStreak: 0 };
  }
  return streak;
}
