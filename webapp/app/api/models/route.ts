const API_ORIGIN = "https://console.liquid.ai";

export async function GET() {
  const apiKey = process.env.LIQUID_API_KEY;
  if (!apiKey) return Response.json({ error: "LIQUID_API_KEY is not configured on the server." }, { status: 500 });

  try {
    const response = await fetch(`${API_ORIGIN}/typesafe/v1/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      return Response.json({ error: payload?.detail || payload?.error || `Model registry returned ${response.status}.` }, { status: response.status });
    }
    return Response.json(payload, { status: 200 });
  } catch {
    return Response.json({ error: "Could not reach the Liquid model registry." }, { status: 502 });
  }
}
