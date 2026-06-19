import { getListById } from "@/entities/list/api/list-api";
import { getWordsByListId } from "@/entities/word/api/word-api";
import { getDueReviewWordCountByListId } from "@/entities/word/api/word-actions";
import { ListDetails } from "@/features/list-details";
import { notFound } from "next/navigation";

type ListDetailPageProps = {
  params: Promise<{ listId: string }>;
};

export default async function ListDetailPage({ params }: ListDetailPageProps) {
  const { listId } = await params;
  const [list, words, reviewCount] = await Promise.all([
    getListById(listId),
    getWordsByListId(listId),
    getDueReviewWordCountByListId(listId),
  ]);
  if (!list) notFound();
  return <ListDetails list={list} words={words} reviewCount={reviewCount} />;
}
