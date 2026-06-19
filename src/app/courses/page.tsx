import { getCourses, getLessonCountsByCourseIds } from "@/entities/course/api/course-api";
import { Courses } from "@/features/courses";

export default async function CoursesPage() {
  const courses = await getCourses();
  const lessonCounts = await getLessonCountsByCourseIds(courses.map((c) => c.id));
  return <Courses courses={courses} lessonCounts={lessonCounts} />;
}
