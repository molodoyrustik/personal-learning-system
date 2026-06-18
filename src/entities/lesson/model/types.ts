export type Lesson = {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  order: number;
  wordListIds: string[];
  patternIds: string[];
  createdAt: string;
  updatedAt: string;
};
