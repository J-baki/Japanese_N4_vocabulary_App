import { useMemo, useState } from "react";
import { useApp } from "@/context/AppContext";
import { vocabById } from "@/data/vocabulary";
import { Badge, Button, Card, EmptyState, PageHeader } from "@/components/ui";
import { BrainIcon, TrashIcon } from "@/components/icons";
import { memoryCountByLesson } from "@/lib/derived";

export function MemoryPage() {
  const { memory, navigate, setSelectedLesson, startMemoryPractice, deleteAllMemory } = useApp();
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const byLesson = useMemo(() => memoryCountByLesson(memory), [memory]);
  const lessons = Object.keys(byLesson)
    .map(Number)
    .sort((a, b) => a - b);
  const total = Object.keys(memory.entries).length;

  return (
    <div>
      <PageHeader
        title="Memory Review"
        subtitle="Vocabulary you previously answered incorrectly or skipped, organized lesson by lesson."
        actions={
          total > 0 && (
            <>
              <Button variant="secondary" onClick={() => startMemoryPractice("all", "mixed")}>
                Practice All ({total})
              </Button>
              <Button variant="danger" onClick={() => setConfirmClearAll(true)}>
                <TrashIcon className="h-4 w-4" /> Clear All
              </Button>
            </>
          )
        }
      />

      {confirmClearAll && (
        <Card className="mb-4 border-rose-300 bg-rose-50 dark:border-rose-500/40 dark:bg-rose-500/10">
          <p className="mb-3 text-sm font-medium text-rose-700 dark:text-rose-300">
            Are you sure you want to delete ALL memory items? This cannot be undone.
          </p>
          <div className="flex gap-2">
            <Button
              variant="danger"
              onClick={() => {
                deleteAllMemory();
                setConfirmClearAll(false);
              }}
            >
              Yes, delete everything
            </Button>
            <Button variant="outline" onClick={() => setConfirmClearAll(false)}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {total === 0 ? (
        <EmptyState
          icon={<BrainIcon className="h-10 w-10 text-slate-300" />}
          title="Your memory is empty"
          subtitle="Incorrect and skipped answers from your exams will show up here so you can review them later."
          action={<Button onClick={() => navigate("examSetup")}>Start an Exam</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lessons.map((lesson) => (
            <Card key={lesson} className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">Lesson {lesson}</p>
                <Badge tone="amber">{byLesson[lesson]} items</Badge>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Words you've struggled with in this lesson.</p>
              <div className="mt-1 flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    setSelectedLesson(lesson);
                    navigate("memoryLesson");
                  }}
                >
                  Review
                </Button>
                <Button size="sm" className="flex-1" onClick={() => startMemoryPractice([lesson], "mixed")}>
                  Practice
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export function MemoryLessonPage() {
  const { selectedLesson, memory, navigate, deleteMemoryEntry, deleteMemoryLesson, startMemoryPractice } = useApp();
  const [confirmLesson, setConfirmLesson] = useState(false);

  if (selectedLesson === null) {
    navigate("memory");
    return null;
  }

  const entries = Object.values(memory.entries).filter((e) => e.lesson === selectedLesson);

  return (
    <div>
      <PageHeader
        title={`Memory · Lesson ${selectedLesson}`}
        subtitle={`${entries.length} stored items`}
        actions={
          <>
            <Button variant="outline" onClick={() => navigate("memory")}>
              Back
            </Button>
            <Button variant="secondary" onClick={() => startMemoryPractice([selectedLesson], "mixed")} disabled={entries.length === 0}>
              Practice this lesson
            </Button>
            <Button variant="danger" onClick={() => setConfirmLesson(true)} disabled={entries.length === 0}>
              Delete Lesson Memory
            </Button>
          </>
        }
      />

      {confirmLesson && (
        <Card className="mb-4 border-rose-300 bg-rose-50 dark:border-rose-500/40 dark:bg-rose-500/10">
          <p className="mb-3 text-sm font-medium text-rose-700 dark:text-rose-300">
            Delete all memory items for Lesson {selectedLesson}?
          </p>
          <div className="flex gap-2">
            <Button
              variant="danger"
              onClick={() => {
                deleteMemoryLesson(selectedLesson);
                setConfirmLesson(false);
                navigate("memory");
              }}
            >
              Yes, delete
            </Button>
            <Button variant="outline" onClick={() => setConfirmLesson(false)}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {entries.length === 0 ? (
        <EmptyState title="No memory items for this lesson" />
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => {
            const vocab = vocabById(entry.vocabId);
            if (!vocab) return null;
            return (
              <Card key={entry.vocabId} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">
                    {vocab.reading} {vocab.kanji && <span className="text-slate-400">/ {vocab.kanji}</span>}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-300">{vocab.meaning}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <Badge tone="green">Correct: {entry.history.correctCount}</Badge>
                    <Badge tone="red">Incorrect: {entry.history.incorrectCount}</Badge>
                    <Badge tone="amber">Skipped: {entry.history.skippedCount}</Badge>
                    <Badge>Attempts: {entry.history.totalAttempts}</Badge>
                    <Badge tone="indigo">Last: {entry.history.lastResult}</Badge>
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => deleteMemoryEntry(entry.vocabId)}>
                  <TrashIcon className="h-4 w-4" /> Remove
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
