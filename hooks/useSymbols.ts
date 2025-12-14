"use client";

import { useState, useCallback } from "react";
import { Symbol } from "@/types/symbol";

export function useSymbols() {
  const [symbols, setSymbols] = useState<Symbol[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSymbols = useCallback(async (words?: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const url = words
        ? `/api/symbols?words=${encodeURIComponent(words.join(","))}`
        : "/api/symbols";

      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setSymbols(data.symbols);
    } catch (err) {
      setError("Échec du chargement des symboles. Veuillez réessayer.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSuggestions = useCallback(
    async (selectedWords: string[]) => {
      if (selectedWords.length === 0) {
        // Reset to starter symbols
        await fetchSymbols();
        return;
      }

      setLoading(true);
      setError(null);
      try {
        // Get AI suggestions
        const suggestResponse = await fetch("/api/suggest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ selectedWords }),
        });

        const suggestData = await suggestResponse.json();

        if (suggestData.error) {
          throw new Error(suggestData.error);
        }

        if (suggestData.words && suggestData.words.length > 0) {
          // Fetch symbols for suggested words
          await fetchSymbols(suggestData.words);
        }
      } catch (err) {
        setError("Échec des suggestions. Veuillez réessayer.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [fetchSymbols]
  );

  return { symbols, loading, error, fetchSymbols, fetchSuggestions };
}
