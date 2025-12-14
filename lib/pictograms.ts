import MiniSearch from "minisearch";
import aacPictograms from "./aac-pictograms.json";
import { Symbol } from "@/types/symbol";

export interface ArasaacPictogram {
  _id: number;
  keywords: Array<{
    keyword: string;
    type: number;
    plural?: string;
  }>;
  categories?: string[];
  tags?: string[];
}

const pictograms = aacPictograms as ArasaacPictogram[];

// Build a searchable index with all keywords flattened
interface SearchDocument {
  id: string; // unique id for the document (pictogramId-keywordIndex)
  pictogramId: number;
  keyword: string;
  plural: string;
  isFirstKeyword: boolean; // boost primary keywords
}

// Create flattened documents for indexing
const searchDocuments: SearchDocument[] = pictograms.flatMap((p) =>
  p.keywords.map((k, idx) => ({
    id: `${p._id}-${idx}`,
    pictogramId: p._id,
    keyword: k.keyword,
    plural: k.plural ?? "",
    isFirstKeyword: idx === 0,
  }))
);

// Initialize MiniSearch with French-optimized settings
const miniSearch = new MiniSearch<SearchDocument>({
  fields: ["keyword", "plural"], // fields to index for search
  storeFields: ["pictogramId", "keyword", "isFirstKeyword"], // fields to return in results
  searchOptions: {
    boost: { keyword: 2 }, // boost keyword matches over plural
    fuzzy: 0.2, // allow ~20% character differences for typo tolerance
    prefix: true, // enable prefix matching ("mang" finds "manger")
  },
  // Normalize accents/diacritics for French
  processTerm: (term) => {
    return term
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, ""); // strip accents
  },
});

// Index all documents
miniSearch.addAll(searchDocuments);

// 16 most common conversation starter symbols for AAC in French
export const STARTER_WORDS = [
  "moi",
  "toi",
  "oui",
  "non",
  "vouloir",
  "aider",
  "finir",
  "aller",
  "manger",
  "boire",
  "quoi",
  "maison",
  "maintenant",
  "mal",
  "salut",
  "au revoir",
];

// Create a map for O(1) lookup by ID
const pictogramById = new Map(pictograms.map((p) => [p._id, p]));

/**
 * Search for pictograms matching a word using full-text search.
 * Uses TF-IDF scoring, fuzzy matching, and prefix search.
 */
export function searchPictogram(word: string): ArasaacPictogram | null {
  const normalizedWord = word.trim();
  if (!normalizedWord) return null;

  // Search with MiniSearch
  const results = miniSearch.search(normalizedWord, {
    // For short queries, be more strict to avoid noise
    fuzzy: normalizedWord.length <= 3 ? 0.1 : 0.2,
    prefix: true,
    // Boost exact matches heavily
    boostDocument: (docId, term, storedFields) => {
      const keyword = (storedFields?.keyword as string)?.toLowerCase() ?? "";
      const searchTerm = normalizedWord.toLowerCase();

      // Exact match gets highest boost
      if (keyword === searchTerm) return 10;

      // First keyword (primary meaning) gets a boost
      if (storedFields?.isFirstKeyword) return 1.5;

      return 1;
    },
  });

  if (results.length === 0) return null;

  // Return the best match
  const bestMatch = results[0];
  return pictogramById.get(bestMatch.pictogramId) ?? null;
}

/**
 * Search for multiple pictograms matching a query, ranked by relevance.
 */
export function searchPictograms(
  query: string,
  limit = 10
): ArasaacPictogram[] {
  const normalizedWord = query.trim();
  if (!normalizedWord) return [];

  const results = miniSearch.search(normalizedWord, {
    fuzzy: normalizedWord.length <= 3 ? 0.1 : 0.2,
    prefix: true,
    filter: (result) => result.score >= 1,
    boostDocument: (docId, term, storedFields) => {
      const keyword = (storedFields?.keyword as string)?.toLowerCase() ?? "";
      const searchTerm = normalizedWord.toLowerCase();
      if (keyword === searchTerm) return 10;
      if (storedFields?.isFirstKeyword) return 1.5;
      return 1;
    },
  });

  results.sort((a, b) => b.score - a.score);
  console.log(`[MiniSearch: searchPictograms for "${query}"]`, results.map(r => r.id));

  // Deduplicate by pictogram ID (same pictogram may match multiple keywords)
  const seen = new Set<number>();
  const pictogramResults: ArasaacPictogram[] = [];

  for (const result of results) {
    if (seen.has(result.pictogramId)) continue;
    seen.add(result.pictogramId);

    const pictogram = pictogramById.get(result.pictogramId);
    if (pictogram) {
      pictogramResults.push(pictogram);
      if (pictogramResults.length >= limit) break;
    }
  }

  return pictogramResults;
}

export function getPictogramImageUrl(pictogramId: number): string {
  return `https://static.arasaac.org/pictograms/${pictogramId}/${pictogramId}_500.png`;
}

export function wordToSymbol(word: string): Symbol | null {
  const pictogram = searchPictogram(word);

  if (!pictogram) {
    console.error(`Pictogram not found for word: ${word}`);
    return null;
  }

  return {
    id: `${pictogram._id}-${word}`,
    name: pictogram.keywords?.[0]?.keyword || word,
    imageUrl: getPictogramImageUrl(pictogram._id),
    label: word,
  };
}

export function wordsToSymbols(words: string[]): Symbol[] {
  return words.map(wordToSymbol).filter((s): s is Symbol => s !== null);
}
