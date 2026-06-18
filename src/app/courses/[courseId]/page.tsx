import { notFound } from "next/navigation";
import { getCourseById } from "@/entities/course/api/course-api";
import { getLessonsByCourseId } from "@/entities/lesson/api/lesson-api";
import { CourseDetails } from "@/features/course-details";

type CoursePageProps = {
  params: Promise<{ courseId: string }>;
};

export default async function CoursePage({ params }: CoursePageProps) {
  const { courseId } = await params;
  const [course, lessons] = await Promise.all([
    getCourseById(courseId),
    getLessonsByCourseId(courseId),
  ]);
  if (!course) notFound();
  return <CourseDetails course={course} lessons={lessons} />;
}
