"use client";

import { useState, useCallback, useRef } from "react";
import { Symbol } from "@/types/symbol";

interface UseSelectedSymbolsOptions {
  onSelectionChange?: (words: string[]) => void;
}

export function useSelectedSymbols(options?: UseSelectedSymbolsOptions) {
  const [selectedSymbols, setSelectedSymbols] = useState<Symbol[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  const speakSelection = useCallback(async () => {
    if (selectedSymbols.length === 0) return;

    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    setIsSpeaking(true);

    try {
      const response = await fetch("/api/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedWords: selectedSymbols.map((s) => s.label),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate speech");
      }

      // Create a blob from the streamed response
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Create and play the audio
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      };

      audio.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      };

      await audio.play();
    } catch (error) {
      console.error("Error speaking:", error);
      setIsSpeaking(false);
    }
  }, [selectedSymbols]);

  return {
    selectedSymbols,
    addSymbol,
    removeSymbol,
    clearSelection,
    speakSelection,
    isSpeaking,
  };
}
