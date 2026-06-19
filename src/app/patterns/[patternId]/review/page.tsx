import { getSentencesByPatternId } from "@/entities/pattern/api/pattern-api";
import { ReviewMode } from "@/features/pattern-review";

type ReviewPageProps = {
  params: Promise<{ patternId: string }>;
};

export default async function ReviewPage({ params }: ReviewPageProps) {
  const { patternId } = await params;
  const sentences = await getSentencesByPatternId(patternId);
  return <ReviewMode patternId={patternId} initialSentences={sentences} />;
}
