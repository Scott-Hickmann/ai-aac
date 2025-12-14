"use client";

import { useQuery } from "@tanstack/react-query";
import { Symbol } from "@/types/symbol";

interface SuggestResponse {
  symbols: Symbol[];
  error?: string;
}

async function fetchSuggestions(
  selectedWords: string[],
  conversationHistory: string[]
): Promise<Symbol[]> {
  const isStarterSymbols =
    selectedWords.length === 0 && conversationHistory.length === 0;

  const response = await fetch(
    isStarterSymbols ? "/api/starter-symbols" : "/api/suggest",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selectedWords, conversationHistory }),
    }
  );

  const data: SuggestResponse = await response.json();

  if (data.error) {
    throw new Error(data.error);
  }

  return data.symbols ?? [];
}

export function useSymbols(
  selectedWords: string[],
  conversationHistory: string[]
) {
  const query = useQuery({
    // Only selectedWords in key - conversationHistory changes shouldn't trigger refetch
    queryKey: ["suggestions", selectedWords, conversationHistory],
    queryFn: () => fetchSuggestions(selectedWords, conversationHistory),
  });

  return {
    symbols: query.data ?? [],
    loading: query.isPending,
    error: query.error?.message ?? null,
    refetch: query.refetch,
  };
}
