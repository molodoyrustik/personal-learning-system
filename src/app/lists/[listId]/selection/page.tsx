import { getWordsByListId } from "@/entities/word/api/word-api";
import { SelectionMode } from "@/features/word-selection";

type SelectionPageProps = {
  params: Promise<{ listId: string }>;
};

export default async function SelectionPage({ params }: SelectionPageProps) {
  const { listId } = await params;
  const words = await getWordsByListId(listId);
  return <SelectionMode listId={listId} initialWords={words} />;
}
