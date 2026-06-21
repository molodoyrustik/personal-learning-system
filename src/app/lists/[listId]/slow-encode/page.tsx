import { getListById } from "@/entities/list/api/list-api";
import { getWordsByListId } from "@/entities/word/api/word-api";
import { SlowEncodeMode } from "@/features/word-slow-encode";
import { notFound } from "next/navigation";

type SlowEncodePageProps = {
  params: Promise<{ listId: string }>;
};

export default async function SlowEncodePage({ params }: SlowEncodePageProps) {
  const { listId } = await params;
  const [list, words] = await Promise.all([getListById(listId), getWordsByListId(listId)]);
  if (!list) notFound();
  return <SlowEncodeMode list={list} initialWords={words} />;
}
