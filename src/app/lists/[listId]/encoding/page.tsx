import { getListById } from "@/entities/list/api/list-api";
import { getWordsByListId } from "@/entities/word/api/word-api";
import { EncodingMode } from "@/features/word-encoding";
import { notFound } from "next/navigation";

type EncodingPageProps = {
  params: Promise<{ listId: string }>;
};

export default async function EncodingPage({ params }: EncodingPageProps) {
  const { listId } = await params;
  const [list, words] = await Promise.all([getListById(listId), getWordsByListId(listId)]);
  if (!list) notFound();
  return <EncodingMode list={list} initialWords={words} />;
}
