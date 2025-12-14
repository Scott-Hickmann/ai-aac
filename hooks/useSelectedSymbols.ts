"use client";

import { useState, useCallback, useRef } from "react";
import { Symbol } from "@/types/symbol";

export function useSelectedSymbols() {
  const [selectedSymbols, setSelectedSymbols] = useState<Symbol[]>([]);
  const [conversationHistory, setConversationHistory] = useState<string[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [pendingSentence, setPendingSentence] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioBlobUrlRef = useRef<string | null>(null);

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

  // Confirm the spoken sentence - add to history and clear selection
  const confirmSpeech = useCallback(() => {
    if (pendingSentence) {
      setConversationHistory((prev) => [...prev, pendingSentence]);
      setPendingSentence(null);
      setSelectedSymbols([]);
      // Clean up stored audio
      if (audioBlobUrlRef.current) {
        URL.revokeObjectURL(audioBlobUrlRef.current);
        audioBlobUrlRef.current = null;
      }
    }
  }, [pendingSentence]);

  // Reject the spoken sentence - let user revise
  const rejectSpeech = useCallback(() => {
    setPendingSentence(null);
    // Clean up stored audio
    if (audioBlobUrlRef.current) {
      URL.revokeObjectURL(audioBlobUrlRef.current);
      audioBlobUrlRef.current = null;
    }
  }, []);

  // Replay the stored audio
  const replaySpeech = useCallback(() => {
    if (!audioBlobUrlRef.current) return;

    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
    }

    setIsSpeaking(true);

    const audio = new Audio(audioBlobUrlRef.current);
    audioRef.current = audio;

    audio.onended = () => setIsSpeaking(false);
    audio.onerror = () => setIsSpeaking(false);

    audio.play().catch((err) => {
      console.error("Error replaying:", err);
      setIsSpeaking(false);
    });
  }, []);

  const speakSelection = useCallback(async () => {
    if (selectedSymbols.length === 0) return;

    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // Clean up any previous stored audio
    if (audioBlobUrlRef.current) {
      URL.revokeObjectURL(audioBlobUrlRef.current);
      audioBlobUrlRef.current = null;
    }

    setIsSpeaking(true);

    // Store the sentence to show in confirmation
    let generatedSentence = selectedSymbols.map((s) => s.label).join(" ");

    // Collect audio chunks for replay
    const audioChunks: BlobPart[] = [];

    const cleanup = () => {
      setIsSpeaking(false);
      if (audioRef.current) {
        URL.revokeObjectURL(audioRef.current.src);
        audioRef.current = null;
      }
    };

    const onPlaybackComplete = () => {
      setIsSpeaking(false);
      if (audioRef.current) {
        URL.revokeObjectURL(audioRef.current.src);
        audioRef.current = null;
      }
      // Store the audio blob for replay
      const blob = new Blob(audioChunks, { type: "audio/mpeg" });
      audioBlobUrlRef.current = URL.createObjectURL(blob);
      // Show confirmation dialog
      setPendingSentence(generatedSentence);
    };

    try {
      const response = await fetch("/api/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedSymbols,
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

            // Store chunk for replay
            audioChunks.push(value);

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
    pendingSentence,
    confirmSpeech,
    rejectSpeech,
    replaySpeech,
  };
}
