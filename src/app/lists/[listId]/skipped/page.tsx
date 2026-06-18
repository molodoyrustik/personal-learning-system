import { getWordsByListId } from "@/entities/word/api/word-api";
import { SkippedMode } from "@/features/word-skipped";

type SkippedPageProps = {
  params: Promise<{ listId: string }>;
};

export default async function SkippedPage({ params }: SkippedPageProps) {
  const { listId } = await params;
  const words = await getWordsByListId(listId);
  return <SkippedMode listId={listId} initialWords={words} />;
}
