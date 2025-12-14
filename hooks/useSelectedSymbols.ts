"use client";

import { useState, useCallback, useRef } from "react";
import { Symbol } from "@/types/symbol";

export function useSelectedSymbols() {
  const [selectedSymbols, setSelectedSymbols] = useState<Symbol[]>([]);
  const [conversationHistory, setConversationHistory] = useState<string[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const addSymbol = useCallback((symbol: Symbol) => {
    setSelectedSymbols((prev) => [
      ...prev,
      { ...symbol, id: `${symbol.id}-${Date.now()}` },
    ]);
  }, []);

  const removeSymbol = useCallback((index: number) => {
    setSelectedSymbols((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedSymbols([]);
  }, []);

  const speakSelection = useCallback(async () => {
    if (selectedSymbols.length === 0) return;

    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    setIsSpeaking(true);

    // Store the sentence to add to history after playback completes
    let generatedSentence = selectedSymbols.map((s) => s.label).join(" ");

    const cleanup = () => {
      setIsSpeaking(false);
      if (audioRef.current) {
        URL.revokeObjectURL(audioRef.current.src);
        audioRef.current = null;
      }
    };

    const onPlaybackComplete = () => {
      cleanup();
      // Only add to conversation history after successful playback
      setConversationHistory((prev) => [...prev, generatedSentence]);
    };

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

      // Get the generated sentence from the header
      const sentenceHeader = response.headers.get("X-Generated-Sentence");
      if (sentenceHeader) {
        generatedSentence = decodeURIComponent(sentenceHeader);
      }

      // Stream audio using MediaSource for immediate playback
      const mediaSource = new MediaSource();
      const audio = new Audio();
      audio.src = URL.createObjectURL(mediaSource);
      audioRef.current = audio;

      audio.onended = onPlaybackComplete;
      audio.onerror = cleanup;

      mediaSource.addEventListener("sourceopen", async () => {
        try {
          const sourceBuffer = mediaSource.addSourceBuffer("audio/mpeg");
          const reader = response.body?.getReader();

          if (!reader) {
            throw new Error("No response body");
          }

          // Start playing as soon as we have some data
          let started = false;

          const pump = async (): Promise<void> => {
            const { done, value } = await reader.read();

            if (done) {
              // Wait for any pending updates before ending stream
              if (sourceBuffer.updating) {
                await new Promise((resolve) =>
                  sourceBuffer.addEventListener("updateend", resolve, {
                    once: true,
                  })
                );
              }
              if (mediaSource.readyState === "open") {
                mediaSource.endOfStream();
              }
              return;
            }

            // Wait for the buffer to be ready before appending
            if (sourceBuffer.updating) {
              await new Promise((resolve) =>
                sourceBuffer.addEventListener("updateend", resolve, {
                  once: true,
                })
              );
            }

            sourceBuffer.appendBuffer(value);

            // Start playing after first chunk
            if (!started) {
              started = true;
              audio.play().catch(console.error);
            }

            // Wait for this append to complete
            await new Promise((resolve) =>
              sourceBuffer.addEventListener("updateend", resolve, { once: true })
            );

            return pump();
          };

          await pump();
        } catch (error) {
          console.error("Error in sourceopen:", error);
          cleanup();
        }
      });
    } catch (error) {
      console.error("Error speaking:", error);
      cleanup();
    }
  }, [selectedSymbols]);

  return {
    selectedSymbols,
    conversationHistory,
    addSymbol,
    removeSymbol,
    clearSelection,
    speakSelection,
    isSpeaking,
  };
}
