export type ThemeMode = "light" | "dark";
export type QuizDirection = "bn-jp" | "jp-bn";
export type AnswerResult = "correct" | "incorrect" | "skipped";

export interface VocabItem {
  id: string;
  lesson: number;
  /** Japanese reading (hiragana / katakana) */
  reading: string;
  /** Kanji spelling, when the word has one */
  kanji?: string;
  /** Bengali meaning */
  meaning: string;
}

export interface QuizQuestion {
  id: string;
  vocabId: string;
  lesson: number;
  direction: QuizDirection;
  /** Japanese text is "reading\nkanji" (kanji line optional) */
  questionText: string;
  options: string[];
  correctAnswer: string;
}

export interface AnsweredQuestion {
  question: QuizQuestion;
  result: AnswerResult;
  selected?: string;
  timeMs: number;
}

export interface ExamRecord {
  id: string;
  date: string;
  mode: "normal" | "memory";
  lessons: number[];
  direction: QuizDirection | "mixed";
  total: number;
  correct: number;
  incorrect: number;
  skipped: number;
  accuracy: number;
  durationSec: number;
  answers: AnsweredQuestion[];
}

/** Complete performance history of one vocabulary item. */
export interface ItemHistory {
  correctCount: number;
  incorrectCount: number;
  skippedCount: number;
  totalAttempts: number;
  lastResult: AnswerResult;
  lastTestedDate: string;
}

export interface MemoryEntry {
  vocabId: string;
  lesson: number;
  addedDate: string;
  history: ItemHistory;
}

export interface MemoryData {
  entries: Record<string, MemoryEntry>;
}

export interface LessonStat {
  lesson: number;
  attempts: number;
  bestScore: number;
  lastScore: number;
  previousScore: number;
  correct: number;
  incorrect: number;
  skipped: number;
  totalAnswered: number;
  avgTimeSec: number;
  history: { date: string; accuracy: number }[];
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
  lastCheckIn: string | null;
  activeDates: string[];
}

export interface ProgressData {
  examHistory: ExamRecord[];
  /** Normal exams only, so memory practice never skews improvement numbers. */
  lessonStats: Record<number, LessonStat>;
  /** Lifetime per-word history (every answer, in every mode). */
  vocabStats: Record<string, ItemHistory>;
  streak: StreakData;
}

export interface AppConfigData {
  version: number;
  preferences: {
    theme: ThemeMode;
    lastDirection: QuizDirection;
  };
}
