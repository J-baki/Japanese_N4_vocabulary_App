// Core vocabulary types
export interface VocabItem {
  id: string;
  lesson: number;
  reading: string;
  kanji?: string;
  meaning: string;
}

export type QuizDirection = "bn-jp" | "jp-bn";

export type LessonSelectionMode = "single" | "multiple" | "all";

export interface QuizQuestion {
  id: string;
  vocabId: string;
  lesson: number;
  direction: QuizDirection;
  questionText: string;
  correctAnswer: string;
  options: string[]; // 4 options, texts
  correctIndex: number;
}

export type AnswerResult = "correct" | "incorrect" | "skipped";

export interface AnsweredQuestion {
  question: QuizQuestion;
  result: AnswerResult;
  selected?: string;
  timeMs: number;
}

export interface ExamRecord {
  id: string;
  date: string; // ISO
  lessons: number[];
  direction: QuizDirection;
  total: number;
  correct: number;
  incorrect: number;
  skipped: number;
  accuracy: number;
  durationSec: number;
  answers: AnsweredQuestion[];
}

export interface MemoryEntryHistory {
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
  history: MemoryEntryHistory;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
  lastCheckIn: string | null; // date string YYYY-MM-DD
  activeDates: string[];
}

export interface LessonStat {
  lesson: number;
  attempts: number;
  bestScore: number; // percentage
  lastScore: number;
  previousScore: number;
  correct: number;
  incorrect: number;
  skipped: number;
  totalAnswered: number;
  avgTimeSec: number;
  history: { date: string; accuracy: number }[];
}

export type ThemeMode = "light" | "dark";

export interface UserPreferences {
  theme: ThemeMode;
  lastDirection: QuizDirection;
}

export interface ProgressData {
  examHistory: ExamRecord[];
  streak: StreakData;
  lessonStats: Record<number, LessonStat>;
}

export interface AppConfigData {
  preferences: UserPreferences;
}

export interface MemoryData {
  entries: Record<string, MemoryEntry>; // keyed by vocabId
}
