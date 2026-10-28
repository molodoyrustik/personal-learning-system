import { getListById } from "@/entities/list/api/list-api";
import { getWordsByListId } from "@/entities/word/api/word-api";
import { SkippedMode } from "@/features/word-skipped";
import { notFound } from "next/navigation";

type SkippedPageProps = {
  params: Promise<{ listId: string }>;
  searchParams: Promise<{ run?: string }>;
};

export default async function SkippedPage({ params, searchParams }: SkippedPageProps) {
  const { listId } = await params;
  const run = Number((await searchParams).run ?? 0);
  const [list, words] = await Promise.all([getListById(listId), getWordsByListId(listId)]);
  if (!list) notFound();
  return <SkippedMode key={run} list={list} initialWords={words} run={run} />;
}
