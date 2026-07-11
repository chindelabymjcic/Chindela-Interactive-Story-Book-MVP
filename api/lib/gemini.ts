import { TRPCError } from "@trpc/server";
import { env } from "./env";

type TutorFeedback = {
  positiveFeedback: string;
  reflectionGuidance: string;
  encouragement: string;
  safeSuggestions: string;
  characterName: string;
};

const MAX_ENTRY_LENGTH = 4_000;

export async function generateTutorFeedback(entryText: string, childName: string, characterName: string): Promise<TutorFeedback> {
  if (!env.geminiApiKey) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "The AI tutor is not configured. Please ask an administrator to configure Gemini." });
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(env.geminiModel)}:generateContent?key=${encodeURIComponent(env.geminiApiKey)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: "You are a warm, child-safe teacher for an interactive storybook. Give specific encouragement, gently explain one improvement if helpful, ask one reflection question, and offer one practical next step. Never shame, diagnose, request personal information, or give unsafe advice. Keep every field under 280 characters. Return only valid JSON with positiveFeedback, reflectionGuidance, encouragement, safeSuggestions, and characterName." }],
        },
        generationConfig: { responseMimeType: "application/json", temperature: 0.4, maxOutputTokens: 450 },
        contents: [{ role: "user", parts: [{ text: `Child name: ${childName.slice(0, 80)}\nCharacter: ${characterName.slice(0, 80)}\nDiary entry: ${entryText.slice(0, MAX_ENTRY_LENGTH)}` }] }],
      }),
    },
  );
  if (!response.ok) {
    throw new TRPCError({ code: "BAD_GATEWAY", message: "The AI tutor is temporarily unavailable. Please try again later." });
  }
  const payload = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new TRPCError({ code: "BAD_GATEWAY", message: "The AI tutor returned an invalid response. Please try again later." });
  try {
    const result = JSON.parse(text) as Partial<TutorFeedback>;
    if (![result.positiveFeedback, result.reflectionGuidance, result.encouragement, result.safeSuggestions].every((value) => typeof value === "string" && value.trim())) throw new Error("Incomplete tutor response");
    return {
      positiveFeedback: result.positiveFeedback!.trim().slice(0, 500),
      reflectionGuidance: result.reflectionGuidance!.trim().slice(0, 500),
      encouragement: result.encouragement!.trim().slice(0, 500),
      safeSuggestions: result.safeSuggestions!.trim().slice(0, 500),
      characterName: (result.characterName || characterName || "Chindela").trim().slice(0, 100),
    };
  } catch {
    throw new TRPCError({ code: "BAD_GATEWAY", message: "The AI tutor returned an invalid response. Please try again later." });
  }
}
