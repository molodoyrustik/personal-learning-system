import { Container } from "@mui/material";
import { notFound } from "next/navigation";
import { getListById } from "@/entities/list/api/list-api";
import { getReviewWordsByListId } from "@/entities/word/api/word-actions";
import { DailyReview } from "@/features/word-review/ui/DailyReview";

type ReviewPageProps = {
  params: Promise<{ listId: string }>;
};

export default async function ListReviewPage({ params }: ReviewPageProps) {
  const { listId } = await params;
  const [list, words] = await Promise.all([
    getListById(listId),
    getReviewWordsByListId(listId),
  ]);
  if (!list) notFound();
  return (
    <Container sx={{ py: 4 }}>
      <DailyReview
        listId={listId}
        sourceLanguage={list.sourceLanguage}
        targetLanguage={list.targetLanguage}
        initialWords={words}
      />
    </Container>
  );
}
