import { notFound } from "next/navigation";
import { getCharacteristicById } from "@/entities/characteristic/api/characteristic-api";
import { EditCharacteristicForm } from "./EditCharacteristicForm";

type EditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditCharacteristicPage({ params }: EditPageProps) {
  const { id } = await params;
  const item = await getCharacteristicById(id);
  if (!item) notFound();
  return <EditCharacteristicForm item={item} />;
}
