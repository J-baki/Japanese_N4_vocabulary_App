import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Badge, Button, Card } from "@/components/ui";
import { formatDuration } from "@/lib/helpers";
import { splitOptionText } from "@/lib/quizEngine";
import { CheckIcon, DownloadIcon, SkipIcon, XIcon } from "@/components/icons";

export function ExamResultPage() {
  const { lastResult, navigate, startMemoryPractice, exportData } = useApp();
  const [view, setView] = useState<"none" | "incorrect" | "skipped">("none");
  const [saved, setSaved] = useState(false);

  if (!lastResult) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
        <p className="text-slate-500 dark:text-slate-400">No exam result to show.</p>
        <Button onClick={() => navigate("home")}>Return Home</Button>
      </div>
    );
  }

  const incorrectAnswers = lastResult.answers.filter((a) => a.result === "incorrect");
  const skippedAnswers = lastResult.answers.filter((a) => a.result === "skipped");
  const accuracyTone = lastResult.accuracy >= 80 ? "text-emerald-500" : lastResult.accuracy >= 50 ? "text-amber-500" : "text-rose-500";

  function handlePracticeMistakes() {
    const lessons = Array.from(new Set(lastResult!.lessons));
    startMemoryPractice(lessons, "mixed");
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Card className="mb-6 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-500">Exam Complete</p>
        <p className="mt-2 text-4xl font-extrabold text-slate-900 dark:text-white">
          {lastResult.correct} / {lastResult.total}
        </p>
        <p className={`mt-1 text-lg font-bold ${accuracyTone}`}>{lastResult.accuracy}% Accuracy</p>

        <div className="mt-6 grid grid-cols-3 gap-3 text-sm">
          <div className="rounded-xl bg-emerald-50 py-3 dark:bg-emerald-500/10">
            <p className="text-lg font-bold text-emerald-600">{lastResult.correct}</p>
            <p className="text-xs text-emerald-600/80">Correct</p>
          </div>
          <div className="rounded-xl bg-rose-50 py-3 dark:bg-rose-500/10">
            <p className="text-lg font-bold text-rose-600">{lastResult.incorrect}</p>
            <p className="text-xs text-rose-600/80">Incorrect</p>
          </div>
          <div className="rounded-xl bg-amber-50 py-3 dark:bg-amber-500/10">
            <p className="text-lg font-bold text-amber-600">{lastResult.skipped}</p>
            <p className="text-xs text-amber-600/80">Skipped</p>
          </div>
        </div>

        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Time: {formatDuration(lastResult.durationSec)}</p>
      </Card>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Button variant="outline" onClick={() => setView(view === "incorrect" ? "none" : "incorrect")} disabled={incorrectAnswers.length === 0}>
          Review Incorrect ({incorrectAnswers.length})
        </Button>
        <Button variant="outline" onClick={() => setView(view === "skipped" ? "none" : "skipped")} disabled={skippedAnswers.length === 0}>
          Review Skipped ({skippedAnswers.length})
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            exportData();
            setSaved(true);
          }}
        >
          <DownloadIcon className="h-4 w-4" /> {saved ? "Saved!" : "Save Results"}
        </Button>
        <Button variant="secondary" onClick={handlePracticeMistakes} disabled={incorrectAnswers.length + skippedAnswers.length === 0}>
          Practice Mistakes
        </Button>
        <Button onClick={() => navigate("examSetup")}>New Exam</Button>
        <Button variant="ghost" onClick={() => navigate("home")}>
          Return to Home
        </Button>
      </div>

      {view !== "none" && (
        <Card>
          <h3 className="mb-3 font-semibold text-slate-800 dark:text-slate-100">
            {view === "incorrect" ? "Incorrect Answers" : "Skipped Questions"}
          </h3>
          <div className="space-y-3">
            {(view === "incorrect" ? incorrectAnswers : skippedAnswers).map((a) => {
              const q = splitOptionText(a.question.questionText);
              const correct = splitOptionText(a.question.correctAnswer);
              const selected = a.selected ? splitOptionText(a.selected) : null;
              return (
                <div key={a.question.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <Badge tone="indigo">Lesson {a.question.lesson}</Badge>
                    {view === "incorrect" ? (
                      <XIcon className="h-4 w-4 text-rose-500" />
                    ) : (
                      <SkipIcon className="h-4 w-4 text-amber-500" />
                    )}
                  </div>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Question</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">
                    {q.main} {q.sub && <span className="text-slate-400">/ {q.sub}</span>}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-1.5">
                      <CheckIcon className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-slate-600 dark:text-slate-300">
                        {correct.main} {correct.sub && <span className="text-slate-400">/ {correct.sub}</span>}
                      </span>
                    </div>
                    {selected && (
                      <div className="flex items-center gap-1.5">
                        <XIcon className="h-3.5 w-3.5 text-rose-500" />
                        <span className="text-slate-600 dark:text-slate-300">
                          {selected.main} {selected.sub && <span className="text-slate-400">/ {selected.sub}</span>}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
