import { persist } from "zustand/middleware";
import { createStore } from "zustand/vanilla";
import type { Course } from "@/entities/course";
import type { Lesson } from "@/entities/lesson";
import { nowISO } from "@/shared/lib/date";
import { generateId } from "@/shared/lib/ids";

export type CoursesStoreState = {
  courses: Course[];
  lessons: Lesson[];
};

type CoursesStoreActions = {
  createCourse: (input: { title: string; description?: string }) => string;
  updateCourse: (id: string, patch: { title?: string; description?: string | null }) => void;
  deleteCourse: (id: string) => void;
  getCourseById: (id: string) => Course | undefined;

  createLesson: (input: { courseId: string; title: string; description?: string }) => string;
  updateLesson: (id: string, patch: { title?: string; description?: string | null }) => void;
  deleteLesson: (id: string) => void;
  getLessonById: (id: string) => Lesson | undefined;
  getLessonsByCourseId: (courseId: string) => Lesson[];
  reorderLessons: (courseId: string, lessonIds: string[]) => void;

  addWordListToLesson: (lessonId: string, listId: string) => void;
  removeWordListFromLesson: (lessonId: string, listId: string) => void;
  addPatternListToLesson: (lessonId: string, patternId: string) => void;
  removePatternListFromLesson: (lessonId: string, patternId: string) => void;
};

export type CoursesStore = CoursesStoreState & CoursesStoreActions;
export type CoursesStoreApi = ReturnType<typeof createCoursesStore>;

function patchLesson(
  lessons: Lesson[],
  lessonId: string,
  updater: (l: Lesson) => Lesson,
): Lesson[] {
  return lessons.map((l) => (l.id === lessonId ? updater(l) : l));
}

export function createCoursesStore() {
  return createStore<CoursesStore>()(
    persist(
      (set, get) => ({
        courses: [],
        lessons: [],

        createCourse: (input) => {
          const id = generateId();
          const now = nowISO();
          const course: Course = {
            id,
            title: input.title,
            description: input.description ?? null,
            createdAt: now,
            updatedAt: now,
          };
          set((s) => ({ courses: [...s.courses, course] }));
          return id;
        },

        updateCourse: (id, patch) => {
          set((s) => ({
            courses: s.courses.map((c) =>
              c.id === id ? { ...c, ...patch, id: c.id, updatedAt: nowISO() } : c,
            ),
          }));
        },

        deleteCourse: (id) => {
          set((s) => ({
            courses: s.courses.filter((c) => c.id !== id),
            lessons: s.lessons.filter((l) => l.courseId !== id),
          }));
        },

        getCourseById: (id) => get().courses.find((c) => c.id === id),

        createLesson: (input) => {
          const id = generateId();
          const now = nowISO();
          const siblings = get().lessons.filter((l) => l.courseId === input.courseId);
          const order = siblings.length;
          const lesson: Lesson = {
            id,
            courseId: input.courseId,
            title: input.title,
            description: input.description ?? null,
            order,
            wordListIds: [],
            patternIds: [],
            createdAt: now,
            updatedAt: now,
          };
          set((s) => ({ lessons: [...s.lessons, lesson] }));
          return id;
        },

        updateLesson: (id, patch) => {
          set((s) => ({
            lessons: patchLesson(s.lessons, id, (l) => ({
              ...l,
              ...patch,
              id: l.id,
              updatedAt: nowISO(),
            })),
          }));
        },

        deleteLesson: (id) => {
          set((s) => ({ lessons: s.lessons.filter((l) => l.id !== id) }));
        },

        getLessonById: (id) => get().lessons.find((l) => l.id === id),

        getLessonsByCourseId: (courseId) =>
          get()
            .lessons.filter((l) => l.courseId === courseId)
            .sort((a, b) => a.order - b.order),

        reorderLessons: (courseId, lessonIds) => {
          set((s) => ({
            lessons: s.lessons.map((l) => {
              if (l.courseId !== courseId) return l;
              const idx = lessonIds.indexOf(l.id);
              return idx === -1 ? l : { ...l, order: idx, updatedAt: nowISO() };
            }),
          }));
        },

        addWordListToLesson: (lessonId, listId) => {
          set((s) => ({
            lessons: patchLesson(s.lessons, lessonId, (l) =>
              l.wordListIds.includes(listId)
                ? l
                : { ...l, wordListIds: [...l.wordListIds, listId], updatedAt: nowISO() },
            ),
          }));
        },

        removeWordListFromLesson: (lessonId, listId) => {
          set((s) => ({
            lessons: patchLesson(s.lessons, lessonId, (l) => ({
              ...l,
              wordListIds: l.wordListIds.filter((id) => id !== listId),
              updatedAt: nowISO(),
            })),
          }));
        },

        addPatternListToLesson: (lessonId, patternId) => {
          set((s) => ({
            lessons: patchLesson(s.lessons, lessonId, (l) =>
              l.patternIds.includes(patternId)
                ? l
                : { ...l, patternIds: [...l.patternIds, patternId], updatedAt: nowISO() },
            ),
          }));
        },

        removePatternListFromLesson: (lessonId, patternId) => {
          set((s) => ({
            lessons: patchLesson(s.lessons, lessonId, (l) => ({
              ...l,
              patternIds: l.patternIds.filter((id) => id !== patternId),
              updatedAt: nowISO(),
            })),
          }));
        },
      }),
      { name: "pls-courses-store" },
    ),
  );
}
