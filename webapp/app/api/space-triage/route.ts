const LIQUID_ORIGIN = "https://console.liquid.ai";
const OPENROUTER_ORIGIN = "https://openrouter.ai/api";
const JEV_MODEL = "typesafe/jev-1.13";

type RequestBody = { telemetry?: unknown };

const questions = {
  action: {
    type: "choice",
    instructions: "Choose the mission-operations action to prioritize during the next ground-station pass. This is advisory triage; do not imply that any command has been transmitted.",
    criteria: {
      monitor: "Keep the nominal pass plan and continue routine monitoring",
      focused_check: "Use the pass for targeted subsystem checks and additional telemetry",
      operator_investigation: "Assign an operator and prioritize real-time anomaly investigation",
      safe_mode_review: "Pause nonessential operations and begin human review of the predefined safe-mode procedure",
    },
  },
  urgency: {
    type: "score",
    instructions: "Rate the priority of this case for mission-operations attention during the next ground pass.",
    criteria: [
      "Routine — nominal monitoring is sufficient",
      "Elevated — add focused checks to the next pass",
      "Urgent — assign an operator for immediate investigation",
      "Critical — begin human review of the predefined safe-mode procedure",
    ],
  },
  safe_mode_review: {
    type: "noul",
    instructions: "Should mission operations initiate human review of the predefined safe-mode procedure before the next contact window ends?",
    criteria: {
      true: "Initiate human safe-mode review",
      false: "Continue without initiating safe-mode review",
    },
  },
};

async function callDecisionApi(url: string, apiKey: string, model: string, telemetry: string, provider?: string) {
  const started = Date.now();
  const response = await fetch(url, {
    method: "POST",
    signal: AbortSignal.timeout(30_000),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(provider ? { "X-Title": "Liquid D1 Decision Lab" } : {}),
    },
    body: JSON.stringify({ model, state: telemetry, questions }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.detail || payload?.error?.message || payload?.error || `${provider || "Decision API"} returned ${response.status}.`);
  return {
    model: payload?.model || model,
    provider: payload?.provider || provider || "Liquid",
    answers: payload?.answers || {},
    usage: payload?.usage || null,
    latency_ms: Date.now() - started,
    raw: payload,
  };
}

export async function POST(request: Request) {
  const liquidKey = process.env.LIQUID_API_KEY;
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  if (!liquidKey || !openRouterKey) {
    return Response.json({ error: "Both decision API keys must be configured server-side." }, { status: 500 });
  }

  let body: RequestBody;
  try { body = await request.json(); } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  const telemetry = typeof body.telemetry === "string" ? body.telemetry.trim() : "";
  if (!telemetry) return Response.json({ error: "A telemetry case is required." }, { status: 400 });
  if (telemetry.length > 12_000) return Response.json({ error: "Keep the telemetry case under 12,000 characters." }, { status: 400 });

  const [d1, jev] = await Promise.allSettled([
    callDecisionApi(`${LIQUID_ORIGIN}/typesafe/v1/systemone`, liquidKey, "LiquidAI/d1", telemetry),
    callDecisionApi(`${OPENROUTER_ORIGIN}/alpha/decisions`, openRouterKey, JEV_MODEL, telemetry, "TypeSafe"),
  ]);
  const normalize = (result: PromiseSettledResult<unknown>) => result.status === "fulfilled"
    ? { ok: true, data: result.value }
    : { ok: false, error: result.reason instanceof Error ? result.reason.message : "Request failed." };

  return Response.json({ d1: normalize(d1), jev: normalize(jev) });
}
