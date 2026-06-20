import {
  getPatternById,
  getRunsByPatternId,
  getSentencesByPatternId,
} from "@/entities/pattern/api/pattern-api";
import { PatternDetails } from "@/features/pattern-details";
import { notFound } from "next/navigation";

type PatternDetailPageProps = {
  params: Promise<{ patternId: string }>;
  searchParams: Promise<{ lessonId?: string; courseId?: string }>;
};

export default async function PatternDetailPage({ params, searchParams }: PatternDetailPageProps) {
  const { patternId } = await params;
  const { lessonId, courseId } = await searchParams;
  const lessonHref = lessonId && courseId ? `/courses/${courseId}/lessons/${lessonId}` : undefined;
  const [pattern, sentences, runs] = await Promise.all([
    getPatternById(patternId),
    getSentencesByPatternId(patternId),
    getRunsByPatternId(patternId),
  ]);
  if (!pattern) notFound();
  return <PatternDetails pattern={pattern} sentences={sentences} runs={runs} lessonHref={lessonHref} />;
}
