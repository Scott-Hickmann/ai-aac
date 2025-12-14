"use client";

import { MessageBar, SymbolGrid, Footer } from "@/components/aac";
import { useSymbols } from "@/hooks/useSymbols";
import { useSelectedSymbols } from "@/hooks/useSelectedSymbols";

export default function Home() {
  const {
    selectedSymbols,
    conversationHistory,
    addSymbol,
    removeSymbol,
    clearSelection,
    speakSelection,
    isSpeaking,
  } = useSelectedSymbols();

  const { symbols, loading, error, refetch } = useSymbols(
    selectedSymbols.map((s) => s.label),
    conversationHistory
  );

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
        isStarterSymbols={selectedSymbols.length === 0}
        symbols={symbols}
        loading={loading}
        error={error}
        onSymbolClick={addSymbol}
        onRefresh={refetch}
      />

      <Footer />
    </div>
  );
}
