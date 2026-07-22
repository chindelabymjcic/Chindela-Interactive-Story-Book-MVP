import { TRPCError } from "@trpc/server";
import { env } from "./env";

export type TutorFeedback = {
  positiveFeedback: string;
  mistakesExplained: string;
  hints: string;
  reflectionGuidance: string;
  encouragement: string;
  safeSuggestions: string;
  characterName: string;
};

export type PriorAttempt = {
  attemptNumber: number;
  submittedText: string;
  reflectionGuidance?: string | null;
  hints?: string | null;
};

const MAX_ENTRY_LENGTH = 4_000;
const MAX_PRIOR_ATTEMPTS_IN_PROMPT = 3;

const SYSTEM_INSTRUCTION = `You are a warm, patient, child-safe tutor for an interactive storybook diary. For every submission:
- Point out something specific done well (positiveFeedback).
- If there's a mistake or something confusing in what they wrote, gently explain what it is (mistakesExplained) -- leave this empty if there's nothing to correct.
- Explain briefly WHY it matters or why a change would help (fold this into mistakesExplained).
- Give one concrete, actionable hint for how to improve or continue (hints).
- Ask one reflection question to deepen their thinking (reflectionGuidance).
- Offer genuine encouragement (encouragement).
- Suggest one safe, practical next step or improvement (safeSuggestions).
If prior attempts are provided, acknowledge concrete improvement between attempts where honest, and don't repeat the same hint twice.
Never shame, diagnose, request personal information, discuss unsafe topics, or give medical/legal advice. Keep every field under 280 characters.
Return only valid JSON with keys: positiveFeedback, mistakesExplained, hints, reflectionGuidance, encouragement, safeSuggestions, characterName.`;

function buildPromptText(params: {
  childName: string;
  characterName: string;
  entryText: string;
  previousAttempts?: PriorAttempt[];
}): string {
  const lines = [
    `Child name: ${params.childName.slice(0, 80)}`,
    `Character: ${params.characterName.slice(0, 80)}`,
  ];
  const history = (params.previousAttempts ?? []).slice(-MAX_PRIOR_ATTEMPTS_IN_PROMPT);
  if (history.length) {
    lines.push("Previous attempts (oldest first):");
    for (const attempt of history) {
      lines.push(
        `  Attempt ${attempt.attemptNumber}: "${attempt.submittedText.slice(0, 300)}" -- hint given: ${attempt.hints?.slice(0, 150) ?? "none"}`,
      );
    }
  }
  lines.push(`Current attempt (#${history.length + 1}) diary entry: ${params.entryText.slice(0, MAX_ENTRY_LENGTH)}`);
  return lines.join("\n");
}

const MAX_INLINE_MEDIA_BYTES = 8_000_000; // Gemini inline_data payload guidance

const EXTENSION_MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".m4a": "audio/mp4",
  ".weba": "audio/webm",
};

export function guessMimeTypeFromUrl(url: string): string | undefined {
  const match = /\.[a-z0-9]+$/i.exec(new URL(url, "http://placeholder").pathname);
  return match ? EXTENSION_MIME_TYPES[match[0].toLowerCase()] : undefined;
}

// Fetches a same-request media asset (image/audio a child attached to their
// entry) and base64-encodes it for Gemini's multimodal input. Best-effort: a
// fetch failure should never block the tutor from giving text-only feedback.
export async function fetchMediaAsBase64(url: string, mimeType: string): Promise<{ base64Data: string; mimeType: string } | undefined> {
  try {
    const response = await fetch(url);
    if (!response.ok) return undefined;
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > MAX_INLINE_MEDIA_BYTES) return undefined;
    return { base64Data: Buffer.from(buffer).toString("base64"), mimeType };
  } catch {
    return undefined;
  }
}

const MAX_ATTEMPTS = 2; // one retry -- LLM structured output occasionally comes back malformed even with responseMimeType: "application/json"

async function callGemini(params: {
  entryText: string;
  childName: string;
  characterName: string;
  previousAttempts?: PriorAttempt[];
  media?: Array<{ base64Data: string; mimeType: string }>;
}): Promise<TutorFeedback> {
  const parts: Array<{ text: string } | { inline_data: { mime_type: string; data: string } }> = [
    { text: buildPromptText(params) },
  ];
  for (const media of params.media ?? []) {
    parts.push({ inline_data: { mime_type: media.mimeType, data: media.base64Data } });
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(env.geminiModel)}:generateContent?key=${encodeURIComponent(env.geminiApiKey)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        // thinkingBudget: 0 disables extended "thinking" tokens -- this is a
        // structured single-turn JSON response, not a task that benefits from
        // multi-step reasoning, and thinking tokens were otherwise consuming
        // most of maxOutputTokens and truncating the JSON before it completed.
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.4,
          maxOutputTokens: 1024,
          // "gemini-flash-latest" is a Google-maintained alias that moves to newer
          // model generations over time -- the current target rejects the older
          // numeric thinkingBudget field entirely (400 INVALID_ARGUMENT) and
          // expects thinkingLevel instead. "LOW" keeps this a fast, low-latency
          // structured JSON call rather than an extended multi-step reasoning one.
          thinkingConfig: { thinkingLevel: "LOW" },
        },
        contents: [{ role: "user", parts }],
      }),
    },
  );
  if (!response.ok) {
    throw new Error(`Gemini HTTP ${response.status}`);
  }
  const payload = (await response.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Empty Gemini response");

  const result = JSON.parse(text) as Partial<TutorFeedback>;
  if (![result.positiveFeedback, result.reflectionGuidance, result.encouragement, result.safeSuggestions].every((value) => typeof value === "string" && value.trim())) {
    throw new Error("Incomplete tutor response");
  }
  return {
    positiveFeedback: result.positiveFeedback!.trim().slice(0, 500),
    mistakesExplained: (result.mistakesExplained ?? "").trim().slice(0, 500),
    hints: (result.hints ?? "").trim().slice(0, 500),
    reflectionGuidance: result.reflectionGuidance!.trim().slice(0, 500),
    encouragement: result.encouragement!.trim().slice(0, 500),
    safeSuggestions: result.safeSuggestions!.trim().slice(0, 500),
    characterName: (result.characterName || params.characterName || "Chindela").trim().slice(0, 100),
  };
}

export async function generateTutorFeedback(params: {
  entryText: string;
  childName: string;
  characterName: string;
  previousAttempts?: PriorAttempt[];
  media?: Array<{ base64Data: string; mimeType: string }>;
}): Promise<TutorFeedback> {
  if (!env.geminiApiKey) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "The AI tutor is not configured. Please ask an administrator to configure Gemini." });
  }

  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await callGemini(params);
    } catch (err) {
      lastError = err;
    }
  }
  console.error("[gemini] tutor feedback failed after retry:", lastError);
  throw new TRPCError({ code: "BAD_GATEWAY", message: "The AI tutor is temporarily unavailable. Please try again later." });
}
