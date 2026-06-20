import { notFound } from "next/navigation";
import { getCourseById } from "@/entities/course/api/course-api";
import { EditCourse } from "@/features/edit-course/ui/EditCourse";

type EditCoursePageProps = {
  params: Promise<{ courseId: string }>;
};

export default async function EditCoursePage({ params }: EditCoursePageProps) {
  const { courseId } = await params;
  const course = await getCourseById(courseId);
  if (!course) notFound();
  return <EditCourse course={course} />;
}
