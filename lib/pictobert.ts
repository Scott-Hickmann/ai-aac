/**
 * PictoBERT integration for next pictogram prediction.
 *
 * Uses the PictoBERT transformer model instead of fuzzy search + Gemini.
 * See: https://github.com/jayralencar/pictoBERT
 */

import { Symbol } from "@/types/symbol";
import { getPictogramImageUrl, pictogramById } from "./pictograms";

const PICTOBERT_URL = process.env.PICTOBERT_URL || "http://localhost:8000";

interface PictoBERTPrediction {
  word_sense: string;
  probability: number;
  pictogram_id: number | null;
}

interface PredictResponse {
  predictions: PictoBERTPrediction[];
}

export function wordSenseToLabel(wordSense: string): string {
  return wordSense.split("%")[0].replace("_", " ");
}

/**
 * Convert a PictoBERT prediction to a Symbol.
 */
function predictionToSymbol(prediction: PictoBERTPrediction): Symbol | null {
  // If we have a pictogram ID from the mapping, use it directly
  if (!prediction.pictogram_id) {
    return null;
  }
  const pictogram = pictogramById.get(prediction.pictogram_id);
  if (!pictogram) {
    console.warn(`Pictogram not found for ID: ${prediction.pictogram_id}`);
    return null;
  }
  return {
    key: prediction.word_sense,
    imageUrl: getPictogramImageUrl(prediction.pictogram_id),
    pictogram,
    wordSense: prediction.word_sense,
    label: wordSenseToLabel(prediction.word_sense),
  };
}

/**
 * Get next pictogram suggestions using PictoBERT.
 */
export async function suggestSymbolsWithPictoBERT(
  selectedSymbols: Symbol[],
  topK: number = 40
): Promise<Symbol[]> {
  try {
    // Convert selected symbols to word-senses
    const wordSenses = selectedSymbols.map((symbol) => symbol.wordSense);

    console.log("[PictoBERT] Requesting predictions for:", wordSenses);

    const response = await fetch(`${PICTOBERT_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        selected_word_senses: wordSenses,
        top_k: topK,
      }),
    });

    if (!response.ok) {
      throw new Error(`PictoBERT request failed: ${response.status}`);
    }

    const data: PredictResponse = await response.json();
    console.log("[PictoBERT] Received predictions:", data);

    // Convert predictions to symbols, filtering out nulls
    const symbols: Symbol[] = [];
    const seenIds = new Set<number>();

    for (const prediction of data.predictions) {
      const symbol = predictionToSymbol(prediction);
      if (symbol) {
        const pictogramId = symbol.pictogram._id;
        if (!seenIds.has(pictogramId)) {
          seenIds.add(pictogramId);
          symbols.push(symbol);
        }
      }
    }

    return symbols;
  } catch (error) {
    console.error("[PictoBERT] Error:", error);
    throw error;
  }
}

