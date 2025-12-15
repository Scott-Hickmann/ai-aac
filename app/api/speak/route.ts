import { NextRequest } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { CartesiaClient } from "@cartesia/cartesia-js";
import { GEMINI_MODELS } from "@/lib/gemini";
import type { Symbol } from "@/types/symbol";

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
const cartesia = new CartesiaClient({ apiKey: process.env.CARTESIA_API_KEY! });

export async function POST(request: NextRequest) {
  try {
    const { selectedSymbols } = (await request.json()) as {
      selectedSymbols: Symbol[];
    };

    if (!selectedSymbols || selectedSymbols.length === 0) {
      return new Response("No symbols provided", { status: 400 });
    }

    // Build context from full symbol data
    const symbolsContext = selectedSymbols
      .map((s) => s.wordSense)
      .join(" ");

    // Use Gemini to rephrase icons into a full sentence
    const geminiResponse = await genai.models.generateContent({
      model: GEMINI_MODELS.Easy,
      contents: `Tu es chargé de comprendre ce qu'un patient sans capacités de parole essaie de dire. Il utilise un tableau de CAA (Communication Améliorée et Alternative).

Il a cliqué sur les icônes suivantes dans l'ordre: ${symbolsContext}

Génère la phrase en français la plus probable pour ce qu'il essaie de dire. Retourne UNIQUEMENT la phrase, sans guillemets ni explications.`,
    });

    const sentence =
      geminiResponse.text?.trim();
    if (!sentence) {
      return new Response("No sentence generated", { status: 500 });
    }
    console.log("[Gemini: rephrase-icons]", sentence);

    // Call Cartesia API to generate speech with streaming
    const voiceId = "4849a5ff-c22d-425e-a3e1-eef4794b74e5";
    console.log("Calling Cartesia TTS...");

    const audioStream = await cartesia.tts.bytes({
      modelId: "sonic-3",
      transcript: sentence,
      voice: {
        mode: "id",
        id: voiceId,
      },
      language: "fr",
      outputFormat: {
        container: "mp3",
        bitRate: 128000,
        sampleRate: 44100,
      },
    });

    console.log("Streaming Cartesia response...");

    // Create a ReadableStream from the async iterable using pull-based approach
    const iterator = audioStream[Symbol.asyncIterator]();
    const webStream = new ReadableStream({
      async pull(controller) {
        const { value, done } = await iterator.next();
        if (done) {
          controller.close();
        } else {
          controller.enqueue(value);
        }
      },
    });

    return new Response(webStream, {
      headers: {
        "Content-Type": "audio/mpeg",
        "X-Generated-Sentence": encodeURIComponent(sentence),
      },
    });
  } catch (error) {
    console.error("Error in speak route:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
