"use client";

import { useQuery } from "@tanstack/react-query";
import { Symbol } from "@/types/symbol";

interface SuggestResponse {
  symbols: Symbol[];
  error?: string;
}

async function fetchSuggestions(
  selectedSymbols: Symbol[],
  conversationHistory: string[]
): Promise<Symbol[]> {
  const isStarterSymbols =
    selectedSymbols.length === 0;

  const response = await fetch(
    // isStarterSymbols ? "/api/starter-symbols" : "/api/suggest",
    "/api/suggest",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selectedSymbols }),
    }
  );

  const data: SuggestResponse = await response.json();

  if (data.error) {
    throw new Error(data.error);
  }

  return data.symbols ?? [];
}

export function useSymbols(
  selectedSymbols: Symbol[],
  conversationHistory: string[]
) {
  // Use symbol IDs for query key to properly detect changes
  const symbolWordSenses = selectedSymbols.map((s) => s.wordSense);

  const query = useQuery({
    queryKey: ["suggestions", symbolWordSenses, conversationHistory],
    queryFn: () => fetchSuggestions(selectedSymbols, conversationHistory),
  });

  return {
    symbols: query.data ?? [],
    loading: query.isPending,
    error: query.error?.message ?? null,
    refetch: query.refetch,
  };
}
