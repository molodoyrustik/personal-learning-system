import { getPatternById } from "@/entities/pattern/api/pattern-api";
import { EditPattern } from "@/features/edit-pattern";
import { notFound } from "next/navigation";

type EditPatternPageProps = {
  params: Promise<{ patternId: string }>;
};

export default async function EditPatternPage({ params }: EditPatternPageProps) {
  const { patternId } = await params;
  const pattern = await getPatternById(patternId);
  if (!pattern) notFound();
  return <EditPattern pattern={pattern} />;
}
