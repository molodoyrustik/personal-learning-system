import { getListById } from "@/entities/list/api/list-api";
import { getWordsByListId } from "@/entities/word/api/word-api";
import { RecallMode } from "@/features/word-recall";
import { notFound } from "next/navigation";

type RecallPageProps = {
  params: Promise<{ listId: string }>;
  searchParams: Promise<{ run?: string }>;
};

export default async function RecallPage({ params, searchParams }: RecallPageProps) {
  const { listId } = await params;
  const run = Number((await searchParams).run ?? 0);
  const [list, words] = await Promise.all([
    getListById(listId),
    getWordsByListId(listId),
  ]);
  if (!list) notFound();
  return <RecallMode key={run} list={list} initialWords={words} run={run} />;
}
