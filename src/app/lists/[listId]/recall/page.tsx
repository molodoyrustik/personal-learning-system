import { getListById } from "@/entities/list/api/list-api";
import { getWordsByListId } from "@/entities/word/api/word-api";
import { RecallMode } from "@/features/word-recall";
import { notFound } from "next/navigation";

type RecallPageProps = {
  params: Promise<{ listId: string }>;
};

export default async function RecallPage({ params }: RecallPageProps) {
  const { listId } = await params;
  const [list, words] = await Promise.all([
    getListById(listId),
    getWordsByListId(listId),
  ]);
  if (!list) notFound();
  return <RecallMode list={list} initialWords={words} />;
}
