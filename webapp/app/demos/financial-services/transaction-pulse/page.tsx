"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, CircleAlert, Clock3, Scale, Terminal } from "lucide-react";

import { DemoShell } from "@/app/demo-shell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type ModelResult = {
  ok: boolean;
  error?: string;
  data?: {
    model?: string;
    decision?: string | null;
    confidence?: number | null;
    probabilities?: Record<string, number>;
    legend?: Record<string, string>;
    provider?: string;
    latency_ms?: number;
    usage?: { input_tokens?: number; output_tokens?: number } | null;
    raw?: unknown;
  };
};

type CompareResponse = {
  d1?: ModelResult;
  jev?: ModelResult;
  comparison?: { agreement?: boolean | null; note?: string };
  error?: string;
};

const presets = [
  {
    label: "NEW VENDOR / KNOWN DEVICE",
    value: "An established small-business customer initiates a $7,800 ACH payment to a new vendor. The device and location match prior activity, invoice metadata is present, and the amount is 3.5× the customer’s normal outgoing payment. There are no recent password resets or failed login spikes.",
  },
  {
    label: "TRAVEL PURCHASE / VELOCITY SPIKE",
    value: "A consumer card shows a $1,240 electronics purchase in Lisbon, 38 minutes after a $14 transit purchase in the same city. The customer enabled a Portugal travel notice yesterday. The device is known, but five merchant attempts occurred in the last ten minutes and two were declined for incorrect CVV.",
  },
];

function decisionLabel(value?: string | null) {
  return value ? value.replaceAll("_", " ").toUpperCase() : "—";
}

function ResultCard({ name, eyebrow, result }: { name: string; eyebrow: string; result?: ModelResult }) {
  const probabilityRows = Object.entries(result?.data?.probabilities || {});
  return (
    <article className="compare-result-card">
      <div className="compare-card-heading"><div><span>{eyebrow}</span><h3>{name}</h3></div><span className="source-tag">NATIVE DECISION</span></div>
      {!result ? (
        <div className="compare-empty">Run the case to see this model&apos;s output.</div>
      ) : !result.ok ? (
        <div className="compare-error"><CircleAlert size={18} /><span>{result.error || "Request failed."}</span></div>
      ) : (
        <>
          <div className="compare-decision">{decisionLabel(result.data?.decision)}</div>
          <div className="compare-metrics">
            <div><span>CONFIDENCE</span><strong>{typeof result.data?.confidence === "number" ? `${(result.data.confidence * 100).toFixed(1)}%` : "—"}</strong></div>
            <div><span>OUTPUT TOKENS</span><strong>{result.data?.usage?.output_tokens ?? "—"}</strong></div>
            <div><span>LATENCY</span><strong>{result.data?.latency_ms != null ? `${result.data.latency_ms} ms` : "—"}</strong></div>
          </div>
          {probabilityRows.length > 0 && <div className="compare-probabilities">{probabilityRows.map(([key, value]) => <div key={key}><span>{result.data?.legend?.[key] || key}</span><strong>{(value * 100).toFixed(1)}%</strong></div>)}</div>}
          <details className="compare-raw"><summary><Terminal size={14} /> RAW OUTPUT</summary><pre>{JSON.stringify(result.data?.raw, null, 2)}</pre></details>
        </>
      )}
    </article>
  );
}

export default function TransactionPulsePage() {
  const [transaction, setTransaction] = useState(presets[0].value);
  const [result, setResult] = useState<CompareResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const agreement = useMemo(() => result?.comparison?.agreement, [result]);

  async function compare(event: FormEvent) {
    event.preventDefault();
    if (!transaction.trim() || loading) return;
    setLoading(true);
    setResult(null);
    setError("");
    try {
      const response = await fetch("/api/compare", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ transaction }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || `Comparison failed (${response.status}).`);
      setResult(payload);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Comparison failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <DemoShell section="FIN / TRANSACTION PULSE" title="D1 vs. JEV">
      <div className="compare-back"><Link href="/demos/financial-services"><ArrowLeft size={15} /> FINANCIAL SERVICES</Link></div>
      <section className="compare-workspace">
        <form className="compare-input" onSubmit={compare}>
          <div className="panel-heading"><span>01 / SYNTHETIC TRANSACTION</span><Scale size={18} /></div>
          <p className="compare-intro">Give both decision models the same case, instructions, and three routing choices. D1 and pinned JEV 1.13 each return native structured probabilities—no chat model or generated prose in the middle.</p>
          <div className="preset-buttons">
            {presets.map((preset, index) => <Button key={preset.label} type="button" variant="ghost" onClick={() => setTransaction(preset.value)}>{String(index + 1).padStart(2, "0")} / {preset.label}</Button>)}
          </div>
          <label htmlFor="transaction-case">TRANSACTION CASE</label>
          <Textarea id="transaction-case" value={transaction} onChange={(event) => setTransaction(event.target.value)} className="retro-control compare-textarea" />
          <div className="routing-legend"><span><strong>PASS</strong> standard monitoring</span><span><strong>STEP-UP</strong> verify first</span><span><strong>REVIEW</strong> human queue</span></div>
          {error && <p className="error-copy"><CircleAlert size={16} />{error}</p>}
          <Button type="submit" className="run-button h-14 w-full" disabled={loading || !transaction.trim()}>{loading ? "RUNNING BOTH MODELS…" : "COMPARE D1 + JEV"}{!loading && <ArrowRight size={19} />}</Button>
        </form>

        <section className="compare-output" aria-label="Model comparison results">
          <div className="comparison-status">
            <span>02 / SIDE-BY-SIDE OUTPUT</span>
            {result && <div className={agreement ? "agreement yes" : "agreement no"}>{agreement ? <Check size={15} /> : <Scale size={15} />}{agreement ? "SAME ROUTE" : "DIFFERENT ROUTE"}</div>}
          </div>
          <div className="compare-grid">
            <ResultCard name="D1" eyebrow="LIQUID / SYSTEM ONE" result={result?.d1} />
            <ResultCard name="JEV 1.13" eyebrow="OPENROUTER / TYPESAFE" result={result?.jev} />
          </div>
          <div className="comparison-note"><Clock3 size={15} /><span>{result?.comparison?.note || "Latency is wall-clock time from the local server. Run several varied cases before drawing conclusions."}</span></div>
        </section>
      </section>
    </DemoShell>
  );
}
