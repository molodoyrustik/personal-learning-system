import { getPatternById } from "@/entities/pattern/api/pattern-api";
import { EditPattern } from "@/features/edit-pattern";
import { notFound } from "next/navigation";

type EditPatternPageProps = {
  params: Promise<{ patternId: string }>;
  searchParams: Promise<{ lessonId?: string; courseId?: string }>;
};

export default async function EditPatternPage({ params, searchParams }: EditPatternPageProps) {
  const { patternId } = await params;
  const { lessonId, courseId } = await searchParams;
  const pattern = await getPatternById(patternId);
  if (!pattern) notFound();
  return <EditPattern pattern={pattern} lessonId={lessonId} courseId={courseId} />;
}
