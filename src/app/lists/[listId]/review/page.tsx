import { Container } from "@mui/material";
import { getDueReviewWordsByListId } from "@/entities/word/api/word-actions";
import { DailyReview } from "@/features/word-review/ui/DailyReview";

type ReviewPageProps = {
  params: Promise<{ listId: string }>;
};

export default async function ListReviewPage({ params }: ReviewPageProps) {
  const { listId } = await params;
  const words = await getDueReviewWordsByListId(listId);
  return (
    <Container sx={{ py: 4 }}>
      <DailyReview listId={listId} initialWords={words} />
    </Container>
  );
}
