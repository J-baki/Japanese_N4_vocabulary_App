import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  AnsweredQuestion,
  AppConfigData,
  ExamRecord,
  MemoryData,
  MemoryEntry,
  ProgressData,
  QuizDirection,
  QuizQuestion,
  ThemeMode,
} from "@/types";
import {
  applyTheme,
  defaultConfig,
  defaultMemory,
  defaultProgress,
  exportAllData,
  importAllData,
  loadConfig,
  loadMemory,
  loadProgress,
  resetAllData,
  saveConfig,
  saveMemory,
  saveProgress,
} from "@/lib/storage";
import { generateQuiz, type DistractorHistory } from "@/lib/quizEngine";
import { accuracyPct, expireStreak, performCheckIn, todayStr } from "@/lib/helpers";
import { applyAnswersToMemory, applyLessonStats, bumpHistory } from "@/lib/progressLogic";
import { vocabById, vocabByLessons, vocabulary } from "@/data/vocabulary";

export type Page =
  | "home"
  | "lessons"
  | "lessonDetail"
  | "examSetup"
  | "examPlay"
  | "examResult"
  | "memory"
  | "memoryLesson"
  | "improvement"
  | "streak"
  | "settings"
  | "scores";

export type ExamMode = "normal" | "memory";

interface ExamSession {
  questions: QuizQuestion[];
  currentIndex: number;
  answers: AnsweredQuestion[];
  startedAt: number;
  questionStartedAt: number;
  lessons: number[];
  direction: QuizDirection | "mixed";
  mode: ExamMode;
}

interface AppContextValue {
  page: Page;
  navigate: (page: Page) => void;
  selectedLesson: number | null;
  setSelectedLesson: (lesson: number | null) => void;

  config: AppConfigData;
  memory: MemoryData;
  progress: ProgressData;

  theme: ThemeMode;
  toggleTheme: () => void;

  startExam: (opts: {
    lessons: number[];
    direction: QuizDirection | "mixed";
    count: number;
  }) => boolean;
  startMemoryPractice: (lessons: number[] | "all", direction: QuizDirection | "mixed") => boolean;

  currentExam: ExamSession | null;
  currentQuestion: QuizQuestion | null;
  /** Records the answer and moves to the next question (or finishes the exam). `null` = skipped. */
  answerCurrent: (selected: string | null, timeMs?: number) => void;
  lastResult: ExamRecord | null;

  deleteMemoryEntry: (vocabId: string) => void;
  deleteMemoryLesson: (lesson: number) => void;
  deleteAllMemory: () => void;

  checkIn: () => boolean; // returns true if newly checked in

  exportData: () => void;
  importData: (json: string) => boolean;
  resetData: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [page, setPage] = useState<Page>("home");
  const [selectedLesson, setSelectedLesson] = useState<number | null>(null);

  const [config, setConfig] = useState<AppConfigData>(() => loadConfig() ?? defaultConfig());
  const [memory, setMemory] = useState<MemoryData>(() => loadMemory() ?? defaultMemory());
  const [progress, setProgress] = useState<ProgressData>(() => loadProgress() ?? defaultProgress());

  const [currentExam, setCurrentExam] = useState<ExamSession | null>(null);
  const [lastResult, setLastResult] = useState<ExamRecord | null>(null);

  // Refs give event handlers the latest state without side effects inside state updaters
  // (updaters run twice in React StrictMode, which would record an exam twice).
  const examRef = useRef<ExamSession | null>(null);
  const progressRef = useRef(progress);
  progressRef.current = progress;
  const distractorHistory = useRef<DistractorHistory>(new Map());

  const setExam = useCallback((s: ExamSession | null) => {
    examRef.current = s;
    setCurrentExam(s);
  }, []);

  // Theme is applied before paint so there is no light/dark flash, and it is saved with the config.
  useLayoutEffect(() => {
    applyTheme(config.preferences.theme);
  }, [config.preferences.theme]);

  useEffect(() => saveConfig(config), [config]);
  useEffect(() => saveMemory(memory), [memory]);
  useEffect(() => saveProgress(progress), [progress]);

  // A streak that lapsed while the app was closed shows 0 as soon as the app is opened again.
  useEffect(() => {
    setProgress((prev) => {
      const streak = expireStreak(prev.streak);
      return streak === prev.streak ? prev : { ...prev, streak };
    });
  }, []);

  const navigate = useCallback((p: Page) => setPage(p), []);

  const toggleTheme = useCallback(() => {
    setConfig((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        theme: prev.preferences.theme === "light" ? "dark" : "light",
      },
    }));
  }, []);

  const startExam = useCallback(
    (opts: { lessons: number[]; direction: QuizDirection | "mixed"; count: number }) => {
      const pool = vocabByLessons(opts.lessons);
      if (pool.length < 4) return false;
      const questions = generateQuiz(pool, vocabulary, opts.direction, opts.count, distractorHistory.current);
      if (questions.length === 0) return false;
      const now = Date.now();
      setExam({
        questions,
        currentIndex: 0,
        answers: [],
        startedAt: now,
        questionStartedAt: now,
        lessons: opts.lessons,
        direction: opts.direction,
        mode: "normal",
      });
      setConfig((prev) => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          lastDirection: opts.direction === "mixed" ? prev.preferences.lastDirection : opts.direction,
        },
      }));
      setPage("examPlay");
      return true;
    },
    [setExam]
  );

  const startMemoryPractice = useCallback(
    (lessons: number[] | "all", direction: QuizDirection | "mixed") => {
      const entries = Object.values(memory.entries);
      const filtered = lessons === "all" ? entries : entries.filter((e) => lessons.includes(e.lesson));
      const pool = filtered
        .map((e) => vocabById(e.vocabId))
        .filter((v): v is NonNullable<typeof v> => Boolean(v));
      // Wrong options are topped up from the whole vocabulary, so even one stored word can be practised.
      if (pool.length < 1) return false;
      const questions = generateQuiz(pool, vocabulary, direction, pool.length, distractorHistory.current);
      if (questions.length === 0) return false;
      const now = Date.now();
      setExam({
        questions,
        currentIndex: 0,
        answers: [],
        startedAt: now,
        questionStartedAt: now,
        lessons: Array.from(new Set(pool.map((v) => v.lesson))).sort((a, b) => a - b),
        direction,
        mode: "memory",
      });
      setPage("examPlay");
      return true;
    },
    [memory, setExam]
  );

  const finalizeExam = useCallback(
    (session: ExamSession, answers: AnsweredQuestion[]) => {
      const now = new Date();
      const today = todayStr(now);
      const durationSec = Math.round((now.getTime() - session.startedAt) / 1000);
      const correct = answers.filter((a) => a.result === "correct").length;
      const incorrect = answers.filter((a) => a.result === "incorrect").length;
      const skipped = answers.filter((a) => a.result === "skipped").length;
      const total = answers.length;

      const record: ExamRecord = {
        id: `exam-${now.getTime()}`,
        date: now.toISOString(),
        mode: session.mode,
        lessons: session.lessons,
        direction: session.direction,
        total,
        correct,
        incorrect,
        skipped,
        accuracy: accuracyPct(correct, total),
        durationSec,
        answers,
      };

      // Memory: wrong/skipped words are added (seeded with their lifetime history); words already
      // in Memory keep collecting history. Nothing is ever removed automatically.
      const priorStats = progressRef.current.vocabStats;
      setMemory((prev) => applyAnswersToMemory(prev, answers, priorStats, today));

      setProgress((prev) => {
        const vocabStats = { ...prev.vocabStats };
        for (const a of answers) {
          vocabStats[a.question.vocabId] = bumpHistory(vocabStats[a.question.vocabId], a.result, today);
        }
        return {
          ...prev,
          examHistory: [record, ...prev.examHistory].slice(0, 200),
          // Memory practice only re-tests mistakes, so it is kept out of lesson accuracy/improvement.
          lessonStats: session.mode === "normal" ? applyLessonStats(prev.lessonStats, answers, record.date) : prev.lessonStats,
          vocabStats,
          streak: performCheckIn(prev.streak, today).streak,
        };
      });

      setLastResult(record);
      setExam(null);
      setPage("examResult");
    },
    [setExam]
  );

  const answerCurrent = useCallback(
    (selected: string | null, timeMs?: number) => {
      const session = examRef.current;
      if (!session) return;
      const q = session.questions[session.currentIndex];
      if (!q) return;

      const result: AnsweredQuestion["result"] =
        selected === null ? "skipped" : selected === q.correctAnswer ? "correct" : "incorrect";
      const answered: AnsweredQuestion = {
        question: q,
        result,
        selected: selected ?? undefined,
        timeMs: timeMs ?? Date.now() - session.questionStartedAt,
      };
      const answers = [...session.answers, answered];
      const nextIndex = session.currentIndex + 1;

      if (nextIndex >= session.questions.length) {
        finalizeExam(session, answers);
        return;
      }
      setExam({ ...session, answers, currentIndex: nextIndex, questionStartedAt: Date.now() });
    },
    [finalizeExam, setExam]
  );

  const deleteMemoryEntry = useCallback((vocabId: string) => {
    setMemory((prev) => {
      const entries = { ...prev.entries };
      delete entries[vocabId];
      return { entries };
    });
  }, []);

  const deleteMemoryLesson = useCallback((lesson: number) => {
    setMemory((prev) => {
      const entries = { ...prev.entries };
      for (const key of Object.keys(entries)) {
        if (entries[key].lesson === lesson) delete entries[key];
      }
      return { entries };
    });
  }, []);

  const deleteAllMemory = useCallback(() => {
    setMemory({ entries: {} });
  }, []);

  const checkIn = useCallback(() => {
    const { alreadyCheckedIn } = performCheckIn(progressRef.current.streak);
    if (alreadyCheckedIn) return false;
    setProgress((prev) => ({ ...prev, streak: performCheckIn(prev.streak).streak }));
    return true;
  }, []);

  const exportData = useCallback(() => exportAllData(), []);
  const importData = useCallback((json: string) => {
    const ok = importAllData(json);
    if (ok) {
      setConfig(loadConfig() ?? defaultConfig());
      setMemory(loadMemory() ?? defaultMemory());
      setProgress(loadProgress() ?? defaultProgress());
    }
    return ok;
  }, []);
  const resetData = useCallback(() => {
    resetAllData();
    setExam(null);
    setConfig(defaultConfig());
    setMemory(defaultMemory());
    setProgress(defaultProgress());
  }, [setExam]);

  const currentQuestion =
    currentExam && currentExam.currentIndex < currentExam.questions.length
      ? currentExam.questions[currentExam.currentIndex]
      : null;

  const value: AppContextValue = useMemo(
    () => ({
      page,
      navigate,
      selectedLesson,
      setSelectedLesson,
      config,
      memory,
      progress,
      theme: config.preferences.theme,
      toggleTheme,
      startExam,
      startMemoryPractice,
      currentExam,
      currentQuestion,
      answerCurrent,
      lastResult,
      deleteMemoryEntry,
      deleteMemoryLesson,
      deleteAllMemory,
      checkIn,
      exportData,
      importData,
      resetData,
    }),
    [
      page,
      navigate,
      selectedLesson,
      config,
      memory,
      progress,
      toggleTheme,
      startExam,
      startMemoryPractice,
      currentExam,
      currentQuestion,
      answerCurrent,
      lastResult,
      deleteMemoryEntry,
      deleteMemoryLesson,
      deleteAllMemory,
      checkIn,
      exportData,
      importData,
      resetData,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export type { MemoryEntry };
