import { getListById } from "@/entities/list/api/list-api";
import { getWordsByListId } from "@/entities/word/api/word-api";
import { SkippedMode } from "@/features/word-skipped";
import { notFound } from "next/navigation";

type SkippedPageProps = {
  params: Promise<{ listId: string }>;
};

export default async function SkippedPage({ params }: SkippedPageProps) {
  const { listId } = await params;
  const [list, words] = await Promise.all([getListById(listId), getWordsByListId(listId)]);
  if (!list) notFound();
  return <SkippedMode list={list} initialWords={words} />;
}
