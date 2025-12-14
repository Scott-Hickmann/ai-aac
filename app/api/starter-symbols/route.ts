import { getPictogramImageUrl, pictogramById } from "@/lib/pictograms";
import { NextResponse } from "next/server";
import { ArasaacPictogram, Symbol } from "@/types/symbol";
import { wordSenseToLabel } from "@/lib/pictobert";

function getPictogram(id: number) {
  const pictogram = pictogramById.get(id);
  if (!pictogram) {
    throw new Error(`Pictogram not found for ID: ${id}`);
  }
  return pictogram;
}

function symbolFromPictogram(pictogram: ArasaacPictogram, wordSense: string): Symbol {
  return {
    key: wordSense,
    imageUrl: getPictogramImageUrl(pictogram._id),
    pictogram,
    wordSense,
    label: wordSenseToLabel(wordSense),
  };
}

// 16 most common conversation starter symbols for AAC in French
const STARTER_SYMBOLS: Symbol[] = [
  symbolFromPictogram(getPictogram(31807), "i"),
  symbolFromPictogram(getPictogram(5441), "feel_like%2:37:00::"),
  symbolFromPictogram(getPictogram(37160), "need%2:34:00::"),
  symbolFromPictogram(getPictogram(32648), "help%2:41:00::"),
  symbolFromPictogram(getPictogram(34521), "yes%1:10:00::"),
  symbolFromPictogram(getPictogram(34341), "no%1:10:00::"),
  symbolFromPictogram(getPictogram(34567), "hello%1:10:00::"),
  symbolFromPictogram(getPictogram(34467), "goodbye%1:10:00::"),
  symbolFromPictogram(getPictogram(8195), "please%4:02:00::"),
  symbolFromPictogram(getPictogram(31206), "thanks%1:04:00::"),
  symbolFromPictogram(getPictogram(5508), "more%3:00:01::"),
  symbolFromPictogram(getPictogram(37185), "stop%2:38:01::"),
  symbolFromPictogram(getPictogram(36473), "go%2:38:00::"),
  symbolFromPictogram(getPictogram(28641), "eat%2:34:00::"),
  symbolFromPictogram(getPictogram(29716), "drink%2:34:00::"),
  symbolFromPictogram(getPictogram(37331), "toilet%1:06:00::"),
]

export async function POST() {
  return NextResponse.json({ symbols: STARTER_SYMBOLS });
}
