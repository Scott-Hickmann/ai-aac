import { GoogleGenAI } from "@google/genai";

export const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export const GEMINI_MODELS = {
  Easy: "gemini-2.5-flash-lite",
  Medium: "gemini-2.5-flash",
}
