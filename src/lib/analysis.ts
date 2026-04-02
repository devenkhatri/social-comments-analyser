import { AnalysisResult } from "@/lib/types";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

const SYSTEM_PROMPT = `You are a social media comment analyst. Analyze the given comment and return a JSON object with exactly these fields:
- "sentiment": "positive", "negative", or "neutral"
- "intent": "question", "complaint", "praise", "feedback", "spam", or "other"
- "urgency": "spam", "low", "medium", "high", or "critical"
- "needs_attention": boolean (true if urgency is high or critical)
- "reason": one sentence explaining the analysis

Urgency rules:
- critical: legal threats, threats of violence, mentions of lawyers/suing/crash/hack, crisis language
- high: strong complaint, negative sentiment with demands, mentions of refund/scam/fraud
- medium: question needing answer, mild complaint, concern about product/service
- low: neutral observation or mild feedback
- spam: promotional content, bot-like, irrelevant links, pure self-promotion

Respond with ONLY the raw JSON object, no markdown fences, no explanation.`;

function buildBatchPrompt(
  comments: Array<{ id: number; text: string }>
): string {
  const lines = comments.map(
    (c, i) => `[${i + 1}] Comment ID: ${c.id}\nText: "${c.text}"`
  );
  return `Analyze each comment below. Return a JSON array with one object per comment (same order), each containing: "comment_id" (number), "sentiment", "intent", "urgency", "needs_attention" (boolean), "reason" (string).

Comments:
${lines.join("\n\n")}

Respond with ONLY the JSON array.`;
}

const defaultResult: AnalysisResult = {
  sentiment: "neutral",
  intent: "other",
  urgency: "low",
  needs_attention: false,
  reason: "AI analysis failed, defaulting to low urgency",
};

export async function analyzeComment(
  text: string,
  apiKey: string,
  model: string
): Promise<AnalysisResult> {
  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://comment-dashboard.local",
      "X-Title": "Comment Dashboard",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Analyze this comment: "${text}"` },
      ],
      temperature: 0,
      max_tokens: 300,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter error (${response.status})`);
  }

  const data = await response.json();
  const content: string = data?.choices?.[0]?.message?.content ?? "";

  try {
    const cleaned = content
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    const parsed = JSON.parse(cleaned) as Record<string, unknown>;
    return normalizeResult(parsed);
  } catch {
    return defaultResult;
  }
}

export async function analyzeBatch(
  comments: Array<{ id: number; text: string }>,
  apiKey: string,
  model: string,
  concurrency = 3
): Promise<Array<{ id: number; result: AnalysisResult }>> {
  const results: Array<{ id: number; result: AnalysisResult }> = [];

  for (let i = 0; i < comments.length; i += concurrency) {
    const chunk = comments.slice(i, i + concurrency);

    if (chunk.length > 1) {
      const batchResult = await analyzeBatchTogether(chunk, apiKey, model);
      results.push(...batchResult);
    } else {
      const single = chunk[0];
      try {
        const result = await analyzeComment(single.text, apiKey, model);
        results.push({ id: single.id, result });
      } catch {
        results.push({ id: single.id, result: defaultResult });
      }
    }
  }

  return results;
}

async function analyzeBatchTogether(
  comments: Array<{ id: number; text: string }>,
  apiKey: string,
  model: string
): Promise<Array<{ id: number; result: AnalysisResult }>> {
  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://comment-dashboard.local",
        "X-Title": "Comment Dashboard",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildBatchPrompt(comments) },
        ],
        temperature: 0,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter error (${response.status})`);
    }

    const data = await response.json();
    const content: string = data?.choices?.[0]?.message?.content ?? "";
    const cleaned = content
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    const parsed = JSON.parse(cleaned) as Array<{
      comment_id: number;
      sentiment: string;
      intent: string;
      urgency: string;
      needs_attention: boolean;
      reason: string;
    }>;

    return parsed.map((p) => ({
      id: p.comment_id,
      result: normalizeResult({
        sentiment: p.sentiment,
        intent: p.intent,
        urgency: p.urgency,
        needs_attention: p.needs_attention,
        reason: p.reason,
      }),
    }));
  } catch {
    return comments.map((c) => ({ id: c.id, result: defaultResult }));
  }
}

function normalizeResult(raw: Record<string, unknown>): AnalysisResult {
  const validSentiments = ["positive", "negative", "neutral"];
  const validIntents = [
    "question",
    "complaint",
    "praise",
    "feedback",
    "spam",
    "other",
  ];
  const validUrgencies = ["spam", "low", "medium", "high", "critical"];

  return {
    sentiment: validSentiments.includes(raw.sentiment as string)
      ? (raw.sentiment as AnalysisResult["sentiment"])
      : "neutral",
    intent: validIntents.includes(raw.intent as string)
      ? (raw.intent as AnalysisResult["intent"])
      : "other",
    urgency: validUrgencies.includes(raw.urgency as string)
      ? (raw.urgency as AnalysisResult["urgency"])
      : "low",
    needs_attention: Boolean(raw.needs_attention),
    reason: typeof raw.reason === "string" ? raw.reason : "No analysis",
  };
}
