const API_ORIGIN = "https://console.liquid.ai";

type DecisionType = "noul" | "choice" | "score";
type RequestBody = { model?: unknown; state?: unknown; type?: unknown; instructions?: unknown; criteria?: unknown; images?: unknown };

function parseState(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;
  const text = value.trim();
  if (!text.startsWith("{") && !text.startsWith("[")) return text;
  try { return JSON.parse(text); } catch { return text; }
}

function buildCriteria(type: DecisionType, value: unknown) {
  const lines = typeof value === "string" ? value.split("\n").map((line) => line.trim()).filter(Boolean) : [];

  if (type === "score") {
    if (lines.length < 2 || lines.length > 10) throw new Error("Score rules need 2–10 ordered levels.");
    return lines;
  }

  const entries = lines.map((line) => {
    const separator = line.indexOf(":");
    if (separator < 1) return [line, null] as const;
    return [line.slice(0, separator).trim(), line.slice(separator + 1).trim() || null] as const;
  });

  if (type === "choice") {
    if (entries.length < 2 || entries.length > 255) throw new Error("Choice rules need 2–255 options, one per line.");
    return Object.fromEntries(entries);
  }

  const noul = Object.fromEntries(entries);
  return typeof noul.true === "string" && typeof noul.false === "string" ? { true: noul.true, false: noul.false } : undefined;
}

export async function POST(request: Request) {
  const apiKey = process.env.LIQUID_API_KEY;
  if (!apiKey) return Response.json({ error: "LIQUID_API_KEY is not configured on the server." }, { status: 500 });

  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const model = typeof body.model === "string" ? body.model.trim() : "";
  const instructions = typeof body.instructions === "string" ? body.instructions.trim() : "";
  const type = body.type === "choice" || body.type === "score" || body.type === "noul" ? body.type : null;
  const state = parseState(body.state);
  const images = Array.isArray(body.images) ? body.images : [];
  if (!model || !instructions || !type) return Response.json({ error: "Model, rule type, and decision instructions are required." }, { status: 400 });
  if (images.length > 8 || images.some((image) => typeof image !== "string" || !/^data:image\/(jpeg|png|webp|gif);base64,/.test(image))) {
    return Response.json({ error: "Images must be up to 8 JPEG, PNG, WebP, or GIF data URLs." }, { status: 400 });
  }

  let criteria;
  try {
    criteria = buildCriteria(type, body.criteria);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Invalid criteria." }, { status: 400 });
  }

  const started = Date.now();
  try {
    const response = await fetch(`${API_ORIGIN}/typesafe/v1/systemone`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        state: state || null,
        ...(images.length ? { images } : {}),
        questions: { decision: { type, instructions, ...(criteria ? { criteria } : {}) } },
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      return Response.json({ error: payload?.detail || payload?.error || `Liquid API returned ${response.status}.` }, { status: response.status });
    }
    return Response.json({ ...payload, _meta: { latency_ms: Date.now() - started, status: response.status } });
  } catch {
    return Response.json({ error: "Could not reach the Liquid decision API." }, { status: 502 });
  }
}
