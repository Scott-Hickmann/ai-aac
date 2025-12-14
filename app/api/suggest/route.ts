import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(request: NextRequest) {
  try {
    const { selectedWords } = await request.json();

    if (!selectedWords || selectedWords.length === 0) {
      return NextResponse.json({ words: [] });
    }

    const response = await genai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Tu aides avec un tableau de CAA (Communication Améliorée et Alternative) en français.
          
L'utilisateur a déjà sélectionné ces mots/symboles dans l'ordre: ${selectedWords.join(", ")}

Basé sur ce message partiel, suggère exactement 16 mots clés en français qui seraient les plus susceptibles de venir ensuite ou d'être utiles pour compléter sa pensée.

Retourne UNIQUEMENT une liste JSON de 16 éléments simples en français, sans explications.`,
    });

    // Parse the response
    const content = response.text ?? "";
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

    // Ensure we have exactly 16 words
    words = words.slice(0, 16);

    console.log("Words:", words);

    return NextResponse.json({ words });
  } catch (error) {
    console.error("Error getting AI suggestions:", error);
    return NextResponse.json(
      { error: "Failed to get suggestions" },
      { status: 500 }
    );
  }
}
