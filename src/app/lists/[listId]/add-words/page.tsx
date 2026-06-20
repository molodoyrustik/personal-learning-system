import { notFound } from "next/navigation";
import { getListById } from "@/entities/list/api/list-api";
import { AddWordsToList } from "@/features/add-words-to-list";

type AddWordsPageProps = {
  params: Promise<{ listId: string }>;
};

export default async function AddWordsPage({ params }: AddWordsPageProps) {
  const { listId } = await params;
  const list = await getListById(listId);
  if (!list) notFound();
  return <AddWordsToList list={list} />;
}
