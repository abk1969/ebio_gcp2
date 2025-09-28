import { GoogleGenAI } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

export const GEMINI_MODEL = "gemini-2.0-flash-exp";

export const getAiClient = (): GoogleGenAI => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("La clé API Gemini n'est pas configurée (variable d'environnement API_KEY manquante).");
  }

  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }

  return aiClient;
};
