import { NextRequest, NextResponse } from "next/server";
import { wordsToSymbols } from "@/lib/pictograms";
import { GoogleGenAI } from "@google/genai";

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(request: NextRequest) {
  try {
    const { selectedWords, conversationHistory = [] } = await request.json();

    if (
      (!selectedWords || selectedWords.length === 0) &&
      conversationHistory.length === 0
    ) {
      return NextResponse.json({ words: [] });
    }

    // Build conversation history context (now an array of sentences)
    let historyContext = "";
    if (conversationHistory.length > 0) {
      historyContext = `Phrases précédentes dites par l'utilisateur:
${conversationHistory.map((sentence: string, i: number) => `${i + 1}. "${sentence}"`).join("\n")}

`;
    }

    // Current message context
    const currentContext =
      selectedWords.length > 0
        ? `Mots actuellement sélectionnés: ${selectedWords.join(", ")}`
        : "L'utilisateur commence un nouveau message.";

    const response = await genai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Tu aides avec un tableau de CAA (Communication Améliorée et Alternative) en français.
          
${historyContext}${currentContext}

Basé sur le contexte de la conversation et les mots sélectionnés, suggère exactement 16 mots clés en français qui seraient les plus susceptibles de venir ensuite ou d'être utiles pour compléter sa pensée.

Retourne UNIQUEMENT une liste JSON de 16 éléments simples en français, sans explications.`,
    });

    // Parse the response
    const content = response.text ?? "";
    console.log("[Gemini: suggest-words]", content);
    let words: string[] = [];

    try {
      // Try to parse as JSON
      const match = content.match(/\[[\s\S]*\]/);
      if (match) {
        words = JSON.parse(match[0]);
      }
    } catch {
      // If parsing fails, try to extract words manually
      const wordMatches = content.match(/"([^"]+)"/g);
      if (wordMatches) {
        words = wordMatches.map((w) => w.replace(/"/g, "")).slice(0, 16);
      }
    }

    const symbols = wordsToSymbols(words);

    return NextResponse.json({ symbols });
  } catch (error) {
    console.error("Error fetching symbols:", error);
    return NextResponse.json(
      { error: "Failed to fetch symbols" },
      { status: 500 }
    );
  }
}
