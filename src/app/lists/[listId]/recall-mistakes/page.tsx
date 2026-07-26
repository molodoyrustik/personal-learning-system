import { getListById } from "@/entities/list/api/list-api";
import { getWordsByListId } from "@/entities/word/api/word-api";
import { RecallMistakesMode } from "@/features/word-recall-mistakes";
import { notFound } from "next/navigation";

type RecallMistakesPageProps = {
  params: Promise<{ listId: string }>;
};

export default async function RecallMistakesPage({ params }: RecallMistakesPageProps) {
  const { listId } = await params;
  const [list, words] = await Promise.all([
    getListById(listId),
    getWordsByListId(listId),
  ]);
  if (!list) notFound();
  return <RecallMistakesMode list={list} initialWords={words} />;
}
