import { NextRequest, NextResponse } from "next/server";

// 16 most common conversation starter symbols for AAC in French
const STARTER_WORDS = [
  "je",
  "veux",
  "besoin",
  "aide",
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

async function fetchSymbol(word: string) {
  try {
    const response = await fetch(
      `https://www.opensymbols.org/api/v1/symbols/search?q=${encodeURIComponent(word)}&locale=fr`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data && data.length > 0) {
      const symbol = data.find((s: { image_url?: string }) => s.image_url);
      if (symbol) {
        return {
          id: symbol.id,
          name: symbol.name || word,
          imageUrl: symbol.image_url,
          label: word,
        };
      }
    }
    return null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const wordsParam = searchParams.get("words");

    // Use provided words or default to starter words
    const words = wordsParam ? wordsParam.split(",") : STARTER_WORDS;

    const symbolPromises = words.map(fetchSymbol);
    const symbols = (await Promise.all(symbolPromises)).filter(Boolean);

    return NextResponse.json({ symbols });
  } catch (error) {
    console.error("Error fetching symbols:", error);
    return NextResponse.json(
      { error: "Failed to fetch symbols" },
      { status: 500 }
    );
  }
}
