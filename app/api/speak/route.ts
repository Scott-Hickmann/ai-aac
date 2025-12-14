import { NextRequest } from "next/server";
import { GoogleGenAI } from "@google/genai";

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(request: NextRequest) {
  try {
    const { selectedWords } = await request.json();

    if (!selectedWords || selectedWords.length === 0) {
      return new Response("No words provided", { status: 400 });
    }

    // Use Gemini to rephrase icons into a full sentence
    const geminiResponse = await genai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Tu es chargé de comprendre ce qu'un patient sans capacités de parole essaie de dire. Il utilise un tableau de CAA (Communication Améliorée et Alternative).

Il a cliqué sur les icônes suivantes dans l'ordre: "${selectedWords.join(", ")}"

Génère la phrase la plus probable pour ce qu'il essaie de dire. Retourne UNIQUEMENT la phrase, sans guillemets ni explications.`,
    });

    const sentence = geminiResponse.text?.trim() ?? selectedWords.join(" ");
    console.log("Generated sentence:", sentence);

    // Call ElevenLabs API to generate speech
    const voiceId = "KS86D70D80LXhwxvWQr3"; // Lily - French voice
    const elevenLabsResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": process.env.ELEVENLABS_API_KEY!,
        },
        body: JSON.stringify({
          text: sentence,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!elevenLabsResponse.ok) {
      const error = await elevenLabsResponse.text();
      console.error("ElevenLabs error:", error);
      return new Response("Failed to generate speech", { status: 500 });
    }

    // Stream the audio response back to the client
    return new Response(elevenLabsResponse.body, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("Error in speak route:", error);
    return new Response("Internal server error", { status: 500 });
  }
}

