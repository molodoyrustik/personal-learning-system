import { getWordsByListId } from "@/entities/word/api/word-api";
import { SlowEncodeMode } from "@/features/word-slow-encode";

type SlowEncodePageProps = {
  params: Promise<{ listId: string }>;
};

export default async function SlowEncodePage({ params }: SlowEncodePageProps) {
  const { listId } = await params;
  const words = await getWordsByListId(listId);
  return <SlowEncodeMode listId={listId} initialWords={words} />;
}
