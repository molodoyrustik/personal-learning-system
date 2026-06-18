import { getSentencesByPatternId } from "@/entities/pattern/api/pattern-api";
import { FirstPassMode } from "@/features/pattern-first-pass";

type FirstPassPageProps = {
  params: Promise<{ patternId: string }>;
};

export default async function FirstPassPage({ params }: FirstPassPageProps) {
  const { patternId } = await params;
  const sentences = await getSentencesByPatternId(patternId);
  return <FirstPassMode patternId={patternId} initialSentences={sentences} />;
}
