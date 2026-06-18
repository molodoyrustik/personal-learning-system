import { getLists } from "@/entities/list/api/list-api";
import { getWordsByListId } from "@/entities/word/api/word-api";
import { Lists } from "@/features/lists";

export default async function ListsPage() {
  const lists = await getLists();
  const wordCounts = await Promise.all(
    lists.map(async (list) => {
      const words = await getWordsByListId(list.id);
      return { listId: list.id, count: words.length };
    }),
  );
  const wordCountMap = Object.fromEntries(
    wordCounts.map(({ listId, count }) => [listId, count]),
  );
  return <Lists lists={lists} wordCountMap={wordCountMap} />;
}
