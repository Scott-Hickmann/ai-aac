import { NextResponse } from "next/server";
import { wordsToSymbols } from "@/lib/pictograms";

// 16 most common conversation starter symbols for AAC in French
const STARTER_WORDS = [
  "je",
  "vouloir",
  "besoin",
  "aider",
  "oui",
  "non",
  "bonjour",
  "au revoir",
  "s'il vous plaît",
  "merci",
  "encore",
  "arrêter",
  "aller",
  "manger",
  "boire",
  "toilettes",
];

export async function POST() {
  const symbols = wordsToSymbols(STARTER_WORDS);
  if (symbols.length !== STARTER_WORDS.length) {
    throw new Error("Starter symbols not all found");
  }
  return NextResponse.json({ symbols });
}
