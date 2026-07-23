import { getDueReviewSentencesByPatternId } from "@/entities/pattern/api/pattern-api";
import { PatternSpacedReview } from "@/features/pattern-spaced-review";

type SpacedReviewPageProps = {
  params: Promise<{ patternId: string }>;
};

export default async function SpacedReviewPage({ params }: SpacedReviewPageProps) {
  const { patternId } = await params;
  const sentences = await getDueReviewSentencesByPatternId(patternId);
  return <PatternSpacedReview patternId={patternId} initialSentences={sentences} />;
}
