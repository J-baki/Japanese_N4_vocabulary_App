import { useMemo, useState } from "react";
import { useApp } from "@/context/AppContext";
import { LESSON_NUMBERS, vocabByLessons } from "@/data/vocabulary";
import { Badge, Button, Card, PageHeader } from "@/components/ui";
import { cn } from "@/utils/cn";
import { CheckIcon } from "@/components/icons";

type SelectionMode = "single" | "multiple" | "all";
type DirectionOption = "bn-jp" | "jp-bn" | "mixed";

export function ExamSetupPage() {
  const { startExam, selectedLesson } = useApp();
  const [mode, setMode] = useState<SelectionMode>("single");
  const [selected, setSelected] = useState<number[]>(selectedLesson ? [selectedLesson] : [1]);
  const [direction, setDirection] = useState<DirectionOption>("bn-jp");
  const [count, setCount] = useState<number | "all">(20);
  const [error, setError] = useState<string | null>(null);

  const activeLessons = useMemo(() => {
    if (mode === "all") return LESSON_NUMBERS;
    return selected;
  }, [mode, selected]);

  const poolSize = useMemo(() => vocabByLessons(activeLessons).length, [activeLessons]);

  function toggleLesson(lesson: number) {
    if (mode === "single") {
      setSelected([lesson]);
    } else {
      setSelected((prev) => (prev.includes(lesson) ? prev.filter((l) => l !== lesson) : [...prev, lesson]));
    }
  }

  function handleStart() {
    if (activeLessons.length === 0) {
      setError("Please select at least one lesson.");
      return;
    }
    if (poolSize < 4) {
      setError("Not enough vocabulary in the selected lessons to build a quiz (need at least 4 words).");
      return;
    }
    const actualCount = count === "all" ? poolSize : count;
    const ok = startExam({ lessons: activeLessons, direction, count: actualCount });
    if (!ok) setError("Could not start the exam. Try selecting more lessons.");
  }

  return (
    <div>
      <PageHeader title="Exam Selection" subtitle="Choose lessons and question direction before starting your exam." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <h2 className="mb-3 font-semibold text-slate-800 dark:text-slate-100">1. Select Lessons</h2>
            <div className="mb-4 flex gap-2">
              {(
                [
                  ["single", "Single Lesson"],
                  ["multiple", "Multiple Lessons"],
                  ["all", "All Lessons"],
                ] as [SelectionMode, string][]
              ).map(([m, label]) => (
                <button
                  key={m}
                  onClick={() => {
                    setMode(m);
                    setError(null);
                    if (m === "single" && selected.length !== 1) setSelected([selected[0] ?? 1]);
                  }}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                    mode === m
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {mode === "all" ? (
              <p className="rounded-xl bg-indigo-50 px-4 py-3 text-sm text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                All {LESSON_NUMBERS.length} lessons selected ({vocabByLessons(LESSON_NUMBERS).length} words total).
              </p>
            ) : (
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
                {LESSON_NUMBERS.map((lesson) => {
                  const isSelected = selected.includes(lesson);
                  return (
                    <button
                      key={lesson}
                      onClick={() => toggleLesson(lesson)}
                      className={cn(
                        "relative rounded-lg border py-2 text-sm font-medium transition-colors",
                        isSelected
                          ? "border-indigo-500 bg-indigo-600 text-white"
                          : "border-slate-200 text-slate-600 hover:border-indigo-300 dark:border-slate-700 dark:text-slate-300"
                      )}
                    >
                      {lesson}
                      {isSelected && <CheckIcon className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full bg-white text-indigo-600" />}
                    </button>
                  );
                })}
              </div>
            )}
          </Card>

          <Card>
            <h2 className="mb-3 font-semibold text-slate-800 dark:text-slate-100">2. Question Language Direction</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <DirectionCard
                active={direction === "bn-jp"}
                onClick={() => setDirection("bn-jp")}
                title="Bengali → Japanese"
                example={{ q: "শিক্ষক", a: "せんせい / 先生" }}
              />
              <DirectionCard
                active={direction === "jp-bn"}
                onClick={() => setDirection("jp-bn")}
                title="Japanese → Bengali"
                example={{ q: "せんせい / 先生", a: "শিক্ষক" }}
              />
              <DirectionCard
                active={direction === "mixed"}
                onClick={() => setDirection("mixed")}
                title="Mixed (Random)"
                example={{ q: "Random each question", a: "Both directions" }}
              />
            </div>
          </Card>

          <Card>
            <h2 className="mb-3 font-semibold text-slate-800 dark:text-slate-100">3. Number of Questions</h2>
            <div className="flex flex-wrap gap-2">
              {[10, 20, 30, 50].map((n) => (
                <button
                  key={n}
                  onClick={() => setCount(n)}
                  className={cn(
                    "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                    count === n
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                  )}
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => setCount("all")}
                className={cn(
                  "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  count === "all"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                )}
              >
                All ({poolSize})
              </button>
            </div>
          </Card>
        </div>

        <div>
          <Card className="sticky top-6">
            <h2 className="mb-3 font-semibold text-slate-800 dark:text-slate-100">Exam Summary</h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-slate-500 dark:text-slate-400">Selected Lessons</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {activeLessons.length === 0 && <span className="text-slate-400">None selected</span>}
                  {activeLessons.slice(0, 12).map((l) => (
                    <Badge key={l} tone="indigo">
                      Lesson {l}
                    </Badge>
                  ))}
                  {activeLessons.length > 12 && <Badge>+{activeLessons.length - 12} more</Badge>}
                </div>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Vocabulary Pool</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">{poolSize} words</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Direction</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {direction === "bn-jp" ? "Bengali → Japanese" : direction === "jp-bn" ? "Japanese → Bengali" : "Mixed"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Questions</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">{count === "all" ? poolSize : count}</span>
              </div>
            </div>

            {error && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">{error}</p>}

            <Button className="mt-4 w-full" size="lg" onClick={handleStart}>
              Start Quiz
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}

function DirectionCard({
  active,
  onClick,
  title,
  example,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  example: { q: string; a: string };
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-xl border p-4 text-left transition-colors",
        active
          ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10"
          : "border-slate-200 hover:border-indigo-300 dark:border-slate-700"
      )}
    >
      <p className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</p>
      <p className="text-xs text-slate-400">Q: {example.q}</p>
      <p className="text-xs text-slate-400">A: {example.a}</p>
    </button>
  );
}
