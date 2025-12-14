"use client";

import { useEffect, useCallback, useMemo } from "react";
import { MessageBar, SymbolGrid, Footer } from "@/components/aac";
import { useSymbols } from "@/hooks/useSymbols";
import { useSelectedSymbols } from "@/hooks/useSelectedSymbols";

export default function Home() {
  const { symbols, loading, error, fetchSymbols, fetchSuggestions } =
    useSymbols();

  const handleSelectionChange = useCallback(
    (words: string[]) => {
      fetchSuggestions(words);
    },
    [fetchSuggestions]
  );

  const selectionOptions = useMemo(
    () => ({ onSelectionChange: handleSelectionChange }),
    [handleSelectionChange]
  );

  const {
    selectedSymbols,
    addSymbol,
    removeSymbol,
    clearSelection,
    speakSelection,
    isSpeaking,
  } = useSelectedSymbols(selectionOptions);

  // Load initial starter symbols
  useEffect(() => {
    fetchSymbols();
  }, [fetchSymbols]);

  const handleRefresh = useCallback(() => {
    if (selectedSymbols.length > 0) {
      fetchSuggestions(selectedSymbols.map((s) => s.label));
    } else {
      fetchSymbols();
    }
  }, [selectedSymbols, fetchSuggestions, fetchSymbols]);

  return (
    <div className="min-h-screen bg-background">
      <MessageBar
        selectedSymbols={selectedSymbols}
        onRemoveSymbol={removeSymbol}
        onSpeak={speakSelection}
        onClear={clearSelection}
        isSpeaking={isSpeaking}
      />

      <SymbolGrid
        symbols={symbols}
        loading={loading}
        error={error}
        onSymbolClick={addSymbol}
        onRefresh={handleRefresh}
      />

      <Footer />
    </div>
  );
}
