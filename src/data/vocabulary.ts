import raw from "./vocabulary.json";
import type { VocabItem } from "@/types";

export const vocabulary: VocabItem[] = raw as VocabItem[];

const byId = new Map<string, VocabItem>(vocabulary.map((v) => [v.id, v]));

export const LESSON_NUMBERS: number[] = Array.from(new Set(vocabulary.map((v) => v.lesson))).sort((a, b) => a - b);

export const lessonWordCounts: Record<number, number> = vocabulary.reduce<Record<number, number>>((acc, v) => {
  acc[v.lesson] = (acc[v.lesson] ?? 0) + 1;
  return acc;
}, {});

export function vocabById(id: string): VocabItem | undefined {
  return byId.get(id);
}

export function vocabByLesson(lesson: number): VocabItem[] {
  return vocabulary.filter((v) => v.lesson === lesson);
}

export function vocabByLessons(lessons: number[]): VocabItem[] {
  const set = new Set(lessons);
  return vocabulary.filter((v) => set.has(v.lesson));
}
