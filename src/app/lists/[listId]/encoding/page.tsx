import { getWordsByListId } from "@/entities/word/api/word-api";
import { EncodingMode } from "@/features/word-encoding";

type EncodingPageProps = {
  params: Promise<{ listId: string }>;
};

export default async function EncodingPage({ params }: EncodingPageProps) {
  const { listId } = await params;
  const words = await getWordsByListId(listId);
  return <EncodingMode listId={listId} initialWords={words} />;
}
