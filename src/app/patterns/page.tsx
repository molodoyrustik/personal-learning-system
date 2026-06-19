import { getPatterns, getSentenceCountsByPatternIds } from "@/entities/pattern/api/pattern-api";
import { Patterns } from "@/features/patterns";

export default async function PatternsPage() {
  const patterns = await getPatterns();
  const sentenceCounts = await getSentenceCountsByPatternIds(patterns.map((p) => p.id));
  return <Patterns patterns={patterns} sentenceCounts={sentenceCounts} />;
}
