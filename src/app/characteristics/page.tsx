import { getCharacteristics } from "@/entities/characteristic/api/characteristic-api";
import { Characteristics } from "@/features/characteristics/ui/Characteristics";

export default async function CharacteristicsPage() {
  const characteristics = await getCharacteristics();
  return <Characteristics characteristics={characteristics} />;
}
