import { useEffect, useRef, useState } from "react";
import { useApp } from "@/context/AppContext";
import { Button, Card, ProgressBar } from "@/components/ui";
import { splitOptionText } from "@/lib/quizEngine";
import { cn } from "@/utils/cn";
import { ArrowRightIcon, CheckIcon, SkipIcon, XIcon } from "@/components/icons";

const OPTION_LETTERS = ["A", "B", "C", "D"];
/** A correct answer moves on by itself after this long. */
const AUTO_ADVANCE_MS = 700;

type Outcome = "correct" | "incorrect" | "skipped";

export function ExamPlayPage() {
  const { currentExam, currentQuestion, answerCurrent, navigate } = useApp();
  const [selected, setSelected] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  // "open" -> waiting for an answer, "revealed" -> answer shown, "advanced" -> already moved on
  const phase = useRef<"open" | "revealed" | "advanced">("open");
  const shownAt = useRef(Date.now());
  const answerMs = useRef(0);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    setSelected(null);
    setOutcome(null);
    phase.current = "open";
    shownAt.current = Date.now();
    return () => {
      if (timer.current !== null) {
        window.clearTimeout(timer.current);
        timer.current = null;
      }
    };
  }, [currentQuestion?.id]);

  function reveal(option: string | null) {
    if (!currentQuestion || phase.current !== "open") return;
    phase.current = "revealed";
    const result: Outcome =
      option === null ? "skipped" : option === currentQuestion.correctAnswer ? "correct" : "incorrect";
    answerMs.current = Date.now() - shownAt.current;
    setSelected(option);
    setOutcome(result);
    // Correct: next question appears automatically. Wrong/skipped: stay until the learner is ready.
    if (result === "correct") {
      timer.current = window.setTimeout(() => {
        phase.current = "advanced";
        answerCurrent(option, answerMs.current);
      }, AUTO_ADVANCE_MS);
    }
  }

  function next() {
    if (phase.current !== "revealed" || outcome === null || outcome === "correct") return;
    phase.current = "advanced";
    answerCurrent(selected, answerMs.current);
  }

  // Keyboard on PC: 1-4 or A-D to answer, S to skip, Enter / Space / → for the next question.
  const latest = useRef({ reveal, next, options: currentQuestion?.options ?? [] });
  latest.current = { reveal, next, options: currentQuestion?.options ?? [] };
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const { reveal, next, options } = latest.current;
      const k = e.key.toLowerCase();
      const idx = ["1", "2", "3", "4"].indexOf(k) !== -1 ? ["1", "2", "3", "4"].indexOf(k) : ["a", "b", "c", "d"].indexOf(k);
      if (idx >= 0 && options[idx] !== undefined) reveal(options[idx]);
      else if (k === "s") reveal(null);
      else if (k === "enter" || k === " " || k === "arrowright") {
        e.preventDefault();
        next();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!currentExam || !currentQuestion) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
        <p className="text-slate-500 dark:text-slate-400">No exam in progress.</p>
        <Button onClick={() => navigate("examSetup")}>Go to Exam Selection</Button>
      </div>
    );
  }

  const revealed = outcome !== null;
  const total = currentExam.questions.length;
  const index = currentExam.currentIndex;
  const progressPct = (index / total) * 100;
  const questionParts = splitOptionText(currentQuestion.questionText);
  const correctParts = splitOptionText(currentQuestion.correctAnswer);
  const isBnToJp = currentQuestion.direction === "bn-jp";
  const isLast = index + 1 === total;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
        <span>
          Question {index + 1} of {total}
          {currentExam.mode === "memory" && " · Memory practice"}
        </span>
        <span>Lesson {currentQuestion.lesson}</span>
      </div>
      <ProgressBar value={progressPct} className="mb-6" />

      <Card className="mb-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-indigo-500">
          {isBnToJp ? "Bengali → Japanese" : "Japanese → Bengali"}
        </p>
        <p className="mb-1 text-xs text-slate-400">Question:</p>
        {isBnToJp ? (
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{questionParts.main}</p>
        ) : (
          <div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{questionParts.main}</p>
            {questionParts.sub && <p className="mt-1 text-lg text-slate-400">{questionParts.sub}</p>}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {currentQuestion.options.map((option, i) => {
          const parts = splitOptionText(option);
          const isCorrectOption = option === currentQuestion.correctAnswer;
          const isSelectedOption = option === selected;
          let stateClasses =
            "border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 dark:border-slate-700 dark:hover:bg-indigo-500/10";
          if (revealed) {
            if (isCorrectOption) {
              stateClasses = "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10";
            } else if (isSelectedOption) {
              stateClasses = "border-rose-500 bg-rose-50 dark:bg-rose-500/10";
            } else {
              stateClasses = "border-slate-200 opacity-50 dark:border-slate-700";
            }
          }
          return (
            <button
              key={i}
              onClick={() => reveal(option)}
              disabled={revealed}
              className={cn(
                "flex min-h-14 items-start gap-3 rounded-xl border p-4 text-left transition-colors disabled:cursor-default",
                stateClasses
              )}
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                {OPTION_LETTERS[i]}
              </span>
              <span>
                <span className="block font-semibold text-slate-800 dark:text-slate-100">{parts.main}</span>
                {parts.sub && <span className="block text-xs text-slate-400">{parts.sub}</span>}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-5" aria-live="polite">
        {!revealed && (
          <div className="flex flex-col items-center gap-1">
            <Button variant="ghost" onClick={() => reveal(null)}>
              <SkipIcon className="h-4 w-4" /> Skip this question
            </Button>
            <p className="hidden text-xs text-slate-400 sm:block">Keys: 1–4 to answer · S to skip · Enter for next</p>
          </div>
        )}

        {outcome === "correct" && (
          <p className="flex items-center justify-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckIcon className="h-4 w-4" /> Correct! {isLast ? "Finishing…" : "Next question…"}
          </p>
        )}

        {(outcome === "incorrect" || outcome === "skipped") && (
          <div
            className={cn(
              "rounded-xl border p-4",
              outcome === "incorrect"
                ? "border-rose-200 bg-rose-50 dark:border-rose-500/30 dark:bg-rose-500/10"
                : "border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10"
            )}
          >
            <p
              className={cn(
                "flex items-center gap-2 text-sm font-semibold",
                outcome === "incorrect" ? "text-rose-600 dark:text-rose-400" : "text-amber-600 dark:text-amber-400"
              )}
            >
              {outcome === "incorrect" ? <XIcon className="h-4 w-4" /> : <SkipIcon className="h-4 w-4" />}
              {outcome === "incorrect" ? "Not quite" : "Skipped"} — saved to Memory
            </p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Correct answer: <span className="font-semibold text-slate-800 dark:text-slate-100">{correctParts.main}</span>
              {correctParts.sub && <span className="text-slate-400"> / {correctParts.sub}</span>}
            </p>
            <Button className="mt-3 w-full sm:w-auto" onClick={next}>
              {isLast ? "See results" : "Next question"} <ArrowRightIcon className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
