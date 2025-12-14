"use client";

import { useState, useCallback } from "react";
import { Symbol } from "@/types/symbol";

interface UseSelectedSymbolsOptions {
  onSelectionChange?: (words: string[]) => void;
}

export function useSelectedSymbols(options?: UseSelectedSymbolsOptions) {
  const [selectedSymbols, setSelectedSymbols] = useState<Symbol[]>([]);

  const addSymbol = useCallback(
    (symbol: Symbol) => {
      setSelectedSymbols((prev) => {
        const newSymbols = [
          ...prev,
          { ...symbol, id: `${symbol.id}-${Date.now()}` },
        ];
        // Notify about selection change
        options?.onSelectionChange?.(newSymbols.map((s) => s.label));
        return newSymbols;
      });
    },
    [options]
  );

  const removeSymbol = useCallback(
    (index: number) => {
      setSelectedSymbols((prev) => {
        const newSymbols = prev.filter((_, i) => i !== index);
        // Notify about selection change
        options?.onSelectionChange?.(newSymbols.map((s) => s.label));
        return newSymbols;
      });
    },
    [options]
  );

  const clearSelection = useCallback(() => {
    setSelectedSymbols([]);
    options?.onSelectionChange?.([]);
  }, [options]);

  const speakSelection = useCallback(() => {
    if (selectedSymbols.length === 0) return;
    const text = selectedSymbols.map((s) => s.label).join(" ");
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    speechSynthesis.speak(utterance);
  }, [selectedSymbols]);

  return {
    selectedSymbols,
    addSymbol,
    removeSymbol,
    clearSelection,
    speakSelection,
  };
}
