import { getWordsByListId } from "@/entities/word/api/word-api";
import { RecallMode } from "@/features/word-recall";

type RecallPageProps = {
  params: Promise<{ listId: string }>;
};

export default async function RecallPage({ params }: RecallPageProps) {
  const { listId } = await params;
  const words = await getWordsByListId(listId);
  return <RecallMode listId={listId} initialWords={words} />;
}
