import { useApp } from "@/context/AppContext";
import { LESSON_NUMBERS, lessonWordCounts, vocabByLesson } from "@/data/vocabulary";
import { Badge, Button, Card, PageHeader, ProgressBar } from "@/components/ui";
import { ArrowRightIcon, BookIcon, ClockIcon } from "@/components/icons";
import { estimateLessonMinutes } from "@/lib/helpers";

export function LessonsPage() {
  const { navigate, setSelectedLesson, progress } = useApp();

  return (
    <div>
      <PageHeader title="Lessons" subtitle="Browse vocabulary lesson by lesson and see estimated study time." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {LESSON_NUMBERS.map((lesson) => {
          const count = lessonWordCounts[lesson];
          const minutes = estimateLessonMinutes(count);
          const stat = progress.lessonStats[lesson];
          return (
            <Card key={lesson} className="flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">Lesson {lesson}</p>
                  <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{count} words</p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                  <BookIcon className="h-4 w-4" />
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <ClockIcon className="h-3.5 w-3.5" />
                Estimated time: {minutes} minutes
              </div>

              {stat && (
                <div>
                  <div className="mb-1 flex justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>Best score</span>
                    <span>{stat.bestScore}%</span>
                  </div>
                  <ProgressBar value={stat.bestScore} tone={stat.bestScore >= 80 ? "green" : stat.bestScore >= 50 ? "amber" : "red"} />
                </div>
              )}

              <div className="mt-1 flex items-center justify-between">
                {stat ? <Badge tone="indigo">{stat.attempts} attempts</Badge> : <Badge>Not started</Badge>}
                <button
                  onClick={() => {
                    setSelectedLesson(lesson);
                    navigate("lessonDetail");
                  }}
                  className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  View <ArrowRightIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export function LessonDetailPage() {
  const { selectedLesson, navigate } = useApp();
  if (selectedLesson === null) {
    navigate("lessons");
    return null;
  }
  const words = vocabByLesson(selectedLesson);
  const minutes = estimateLessonMinutes(words.length);

  return (
    <div>
      <PageHeader
        title={`Lesson ${selectedLesson}`}
        subtitle={`${words.length} words · Estimated time: ${minutes} minutes`}
        actions={
          <>
            <Button variant="outline" onClick={() => navigate("lessons")}>
              Back to Lessons
            </Button>
            <Button
              onClick={() => {
                navigate("examSetup");
              }}
            >
              Practice this lesson
            </Button>
          </>
        }
      />
      <Card className="overflow-hidden !p-0">
        <div className="max-h-[70vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Japanese</th>
                <th className="px-4 py-3 font-medium">Bengali Meaning</th>
              </tr>
            </thead>
            <tbody>
              {words.map((w, idx) => (
                <tr key={w.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-3 text-slate-400">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800 dark:text-slate-100">{w.reading}</p>
                    {w.kanji && <p className="text-xs text-slate-400">{w.kanji}</p>}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{w.meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
