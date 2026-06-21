import { getListById } from "@/entities/list/api/list-api";
import { getWordsByListId } from "@/entities/word/api/word-api";
import { SelectionMode } from "@/features/word-selection";
import { notFound } from "next/navigation";

type SelectionPageProps = {
  params: Promise<{ listId: string }>;
};

export default async function SelectionPage({ params }: SelectionPageProps) {
  const { listId } = await params;
  const [list, words] = await Promise.all([getListById(listId), getWordsByListId(listId)]);
  if (!list) notFound();
  return <SelectionMode list={list} initialWords={words} />;
}
