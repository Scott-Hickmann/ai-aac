import arasaacMapping from "./arasaac-pictograms.json";
import { ArasaacPictogram } from "@/types/symbol";

export type { ArasaacPictogram };

const pictograms = arasaacMapping as ArasaacPictogram[];

// Create a map for O(1) lookup by ID
export const pictogramById = new Map(pictograms.map((p) => [p._id, p]));

export function getPictogramImageUrl(pictogramId: number): string {
  return `https://static.arasaac.org/pictograms/${pictogramId}/${pictogramId}_500.png`;
}
