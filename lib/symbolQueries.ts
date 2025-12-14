import { genai, GEMINI_MODELS } from "./gemini";
import { searchPictograms, getPictogramImageUrl } from "./pictograms";
import { Symbol } from "@/types/symbol";

const QUERIES_COUNT = 40;
const MAX_SYMBOLS_PER_QUERY = 3;

interface SuggestQueriesParams {
  selectedWords: string[];
  conversationHistory?: string[];
}

function buildHistoryContext(conversationHistory: string[]): string {
  if (conversationHistory.length === 0) return "";

  return `Phrases précédentes dites par l'utilisateur:
${conversationHistory.map((sentence, i) => `${i + 1}. "${sentence}"`).join("\n")}

`;
}

function buildCurrentContext(selectedWords: string[]): string {
  return selectedWords.length > 0
    ? `Mots actuellement sélectionnés: ${selectedWords.join(", ")}`
    : "L'utilisateur commence un nouveau message.";
}

function buildPrompt(historyContext: string, currentContext: string): string {
  return `Tu aides avec un tableau de CAA (Communication Améliorée et Alternative) en français.

${historyContext}

${currentContext}

Suggère exactement ${QUERIES_COUNT} requêtes de différents mots clés susceptibles de venir à la suite des mots actuellement sélectionnés.`;
}

export async function suggestQueries({
  selectedWords,
  conversationHistory = [],
}: SuggestQueriesParams): Promise<string[]> {
  const historyContext = buildHistoryContext(conversationHistory);
  const currentContext = buildCurrentContext(selectedWords);
  const prompt = buildPrompt(historyContext, currentContext);

  console.log("[Gemini: suggest-queries]", prompt);

  const response = await genai.models.generateContent({
    model: GEMINI_MODELS.Easy,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          queries: {
            type: "array",
            items: { type: "string" },
            description: `Liste de ${QUERIES_COUNT} requêtes suggérées en français (un à quelques mots)`,
          },
        },
        required: ["queries"],
      },
    },
  });

  const content = response.text ?? "{}";
  console.log("[Gemini: suggest-queries]", content);

  const parsed = JSON.parse(content);
  const queries: string[] = parsed.queries ?? [];

  return queries;
}

export function searchSymbols(query: string, limit: number): Symbol[] {
  const pictograms = searchPictograms(query, limit);

  return pictograms.map((pictogram) => {
    const name = pictogram.keywords[0].keyword;
    return {
      id: `${pictogram._id}-${query}`,
      name: name,
      imageUrl: getPictogramImageUrl(pictogram._id),
      label: name,
    };
  });
}

export function suggestSymbols(queries: string[]): Symbol[] {
  const seen = new Set<number>();
  const symbols: Symbol[] = [];

  for (const query of queries) {
    for (const symbol of searchSymbols(query, MAX_SYMBOLS_PER_QUERY)) {
      const pictogramId = parseInt(symbol.id.split("-")[0], 10);
      if (seen.has(pictogramId)) continue;

      seen.add(pictogramId);
      symbols.push(symbol);
    }
  }

  return symbols;
}
