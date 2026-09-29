const LIQUID_ORIGIN = "https://console.liquid.ai";
const OPENROUTER_ORIGIN = "https://openrouter.ai/api/v1";
const DEFAULT_JEV_MODEL = "typesafe/jev-router";

type CompareBody = { transaction?: unknown };

const options = {
  pass: "Allow normal processing with standard monitoring",
  step_up: "Require additional customer verification before processing",
  review: "Place in the human transaction review queue",
};

function parseJsonObject(value: string) {
  const cleaned = value.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try { return JSON.parse(cleaned); } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
    throw new Error("JEV did not return a JSON object.");
  }
}

async function runD1(transaction: string, apiKey: string) {
  const started = Date.now();
  const response = await fetch(`${LIQUID_ORIGIN}/typesafe/v1/systemone`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "LiquidAI/d1",
      state: transaction,
      questions: {
        decision: {
          type: "choice",
          instructions: "Choose the appropriate operational routing for this incoming financial transaction. This is queue triage, not a final fraud or payment decision.",
          criteria: options,
        },
      },
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.detail || payload?.error || `D1 returned ${response.status}.`);
  const answer = payload?.answers?.decision || {};
  return {
    model: payload?.model || "LiquidAI/d1",
    decision: answer.choice || null,
    confidence: answer.confidence ?? null,
    probabilities: answer.probabilities || {},
    legend: answer.legend || {},
    latency_ms: Date.now() - started,
    usage: payload?.usage || null,
    raw: payload,
  };
}

async function runJev(transaction: string, apiKey: string, model: string) {
  const started = Date.now();
  const response = await fetch(`${OPENROUTER_ORIGIN}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "X-Title": "Liquid D1 Decision Lab",
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      max_tokens: 320,
      messages: [
        {
          role: "system",
          content: "You are a transaction-operations routing model. Return only valid JSON. Do not approve, decline, freeze funds, accuse a customer, or invent missing facts.",
        },
        {
          role: "user",
          content: `Route the synthetic transaction below to exactly one queue: pass, step_up, or review.\n\nDefinitions:\n- pass: ${options.pass}\n- step_up: ${options.step_up}\n- review: ${options.review}\n\nReturn JSON with exactly these fields: decision (one of pass, step_up, review), confidence (number 0 to 1), risk_score (integer 0 to 100), and rationale (one concise sentence).\n\nTransaction:\n${transaction}`,
        },
      ],
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error?.message || payload?.error || `OpenRouter returned ${response.status}.`);
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== "string") throw new Error("JEV returned no text response.");
  const parsed = parseJsonObject(content);
  return {
    model: payload?.model || model,
    decision: typeof parsed.decision === "string" ? parsed.decision : null,
    confidence: typeof parsed.confidence === "number" ? parsed.confidence : null,
    risk_score: typeof parsed.risk_score === "number" ? parsed.risk_score : null,
    rationale: typeof parsed.rationale === "string" ? parsed.rationale : null,
    latency_ms: Date.now() - started,
    usage: payload?.usage || null,
    raw: parsed,
  };
}

export async function POST(request: Request) {
  const liquidKey = process.env.LIQUID_API_KEY;
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const jevModel = process.env.OPENROUTER_JEV_MODEL || DEFAULT_JEV_MODEL;
  if (!liquidKey || !openRouterKey) {
    return Response.json({ error: "Both LIQUID_API_KEY and OPENROUTER_API_KEY must be configured server-side." }, { status: 500 });
  }

  let body: CompareBody;
  try { body = await request.json(); } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  const transaction = typeof body.transaction === "string" ? body.transaction.trim() : "";
  if (!transaction) return Response.json({ error: "A transaction case is required." }, { status: 400 });
  if (transaction.length > 12_000) return Response.json({ error: "Keep the test case under 12,000 characters." }, { status: 400 });

  const [d1, jev] = await Promise.allSettled([
    runD1(transaction, liquidKey),
    runJev(transaction, openRouterKey, jevModel),
  ]);
  const normalize = (result: PromiseSettledResult<unknown>) => result.status === "fulfilled"
    ? { ok: true, data: result.value }
    : { ok: false, error: result.reason instanceof Error ? result.reason.message : "Request failed." };
  const d1Result = normalize(d1);
  const jevResult = normalize(jev);
  const d1Decision = d1.status === "fulfilled" ? d1.value.decision : null;
  const jevDecision = jev.status === "fulfilled" ? jev.value.decision : null;

  return Response.json({
    d1: d1Result,
    jev: jevResult,
    comparison: {
      agreement: d1Decision && jevDecision ? d1Decision.toLowerCase() === jevDecision.toLowerCase() : null,
      note: "One case is a product comparison, not a model benchmark.",
    },
  });
}
