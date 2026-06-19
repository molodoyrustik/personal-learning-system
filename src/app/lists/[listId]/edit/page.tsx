import { notFound } from "next/navigation";
import { getListById } from "@/entities/list/api/list-api";
import { AddWordsToList } from "@/features/add-words-to-list";

type EditListPageProps = {
  params: Promise<{ listId: string }>;
};

export default async function EditListPage({ params }: EditListPageProps) {
  const { listId } = await params;
  const list = await getListById(listId);
  if (!list) notFound();
  return <AddWordsToList list={list} />;
}
