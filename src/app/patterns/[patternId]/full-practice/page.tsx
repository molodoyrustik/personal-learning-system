import { getSentencesByPatternId } from "@/entities/pattern/api/pattern-api";
import { FullPracticeMode } from "@/features/pattern-full-practice";

type FullPracticePageProps = {
  params: Promise<{ patternId: string }>;
};

export default async function FullPracticePage({ params }: FullPracticePageProps) {
  const { patternId } = await params;
  const sentences = await getSentencesByPatternId(patternId);
  return <FullPracticeMode patternId={patternId} initialSentences={sentences} />;
}
