"use client";

import { useState } from "react";
import {
  MessageBar,
  SymbolGrid,
  Footer,
  ConfirmDialog,
} from "@/components/aac";
import { useSymbols } from "@/hooks/useSymbols";
import { useSelectedSymbols } from "@/hooks/useSelectedSymbols";

export default function Home() {
  const [showLabels, setShowLabels] = useState(false);
  const {
    selectedSymbols,
    conversationHistory,
    addSymbol,
    removeSymbol,
    clearSelection,
    speakSelection,
    isSpeaking,
    pendingSentence,
    confirmSpeech,
    rejectSpeech,
    replaySpeech,
  } = useSelectedSymbols();

  const { symbols, loading, error, refetch } = useSymbols(
    selectedSymbols,
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
        showLabels={showLabels}
      />

      {pendingSentence ? (
        <ConfirmDialog
          sentence={pendingSentence}
          onConfirm={confirmSpeech}
          onReject={rejectSpeech}
          onReplay={replaySpeech}
          isReplaying={isSpeaking}
        />
      ) : (
        <SymbolGrid
          isStarterSymbols={selectedSymbols.length === 0}
          symbols={symbols}
          loading={loading}
          error={error}
          onSymbolClick={addSymbol}
          onRefresh={refetch}
          showLabels={showLabels}
          onToggleLabels={() => setShowLabels(!showLabels)}
        />
      )}

      <Footer />
    </div>
  );
}
