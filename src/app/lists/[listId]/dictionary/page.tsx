import { getWordsByListId } from "@/entities/word/api/word-api";
import { DictionaryMode } from "@/features/word-dictionary";

type DictionaryPageProps = {
  params: Promise<{ listId: string }>;
};

export default async function DictionaryPage({ params }: DictionaryPageProps) {
  const { listId } = await params;
  const words = await getWordsByListId(listId);
  return <DictionaryMode listId={listId} initialWords={words} />;
}
