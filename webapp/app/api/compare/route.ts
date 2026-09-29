const LIQUID_ORIGIN = "https://console.liquid.ai";
const OPENROUTER_ORIGIN = "https://openrouter.ai/api";
const DEFAULT_JEV_MODEL = "typesafe/jev-1.13";

type CompareBody = { transaction?: unknown };

const options = {
  pass: "Allow normal processing with standard monitoring",
  step_up: "Require additional customer verification before processing",
  review: "Place in the human transaction review queue",
};

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
  const response = await fetch(`${OPENROUTER_ORIGIN}/alpha/decisions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "X-Title": "Liquid D1 Decision Lab",
    },
    body: JSON.stringify({
      model,
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
  if (!response.ok) throw new Error(payload?.error?.message || payload?.error || `OpenRouter returned ${response.status}.`);
  const answer = payload?.answers?.decision || {};
  return {
    model: payload?.model || model,
    provider: payload?.provider || "TypeSafe",
    decision: answer.choice || null,
    confidence: answer.confidence ?? null,
    probabilities: answer.probabilities || {},
    legend: answer.legend || {},
    latency_ms: Date.now() - started,
    usage: payload?.usage || null,
    raw: payload,
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
