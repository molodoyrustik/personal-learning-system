import { getListById } from "@/entities/list/api/list-api";
import { getWordsByListId } from "@/entities/word/api/word-api";
import { getDueReviewWordCountByListId } from "@/entities/word/api/word-actions";
import { ListDetails } from "@/features/list-details";
import { notFound } from "next/navigation";

type ListDetailPageProps = {
  params: Promise<{ listId: string }>;
  searchParams: Promise<{ lessonId?: string; courseId?: string }>;
};

export default async function ListDetailPage({ params, searchParams }: ListDetailPageProps) {
  const { listId } = await params;
  const { lessonId, courseId } = await searchParams;
  const lessonHref = lessonId && courseId ? `/courses/${courseId}/lessons/${lessonId}` : undefined;
  const [list, words, reviewCount] = await Promise.all([
    getListById(listId),
    getWordsByListId(listId),
    getDueReviewWordCountByListId(listId),
  ]);
  if (!list) notFound();
  return <ListDetails list={list} words={words} reviewCount={reviewCount} lessonHref={lessonHref} />;
}
