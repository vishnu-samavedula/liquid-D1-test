"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, CircleAlert, Clock3, ExternalLink, Orbit, Radio, Satellite, Terminal } from "lucide-react";

import { DemoShell } from "@/app/demo-shell";
import { SwarmSimulation } from "@/app/demos/space-satellites/ground-pass-triage/swarm-simulation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Answer = {
  type?: "choice" | "score" | "noul";
  choice?: string;
  score?: number;
  noul?: number;
  confidence?: number;
  probabilities?: Record<string, number>;
  legend?: Record<string, string>;
};
type ModelResult = {
  ok: boolean;
  error?: string;
  data?: {
    model?: string;
    provider?: string;
    answers?: Record<string, Answer>;
    usage?: { input_tokens?: number; output_tokens?: number } | null;
    latency_ms?: number;
    raw?: unknown;
  };
};
type TriageResponse = { d1?: ModelResult; jev?: ModelResult; error?: string };

const presets = [
  {
    label: "ECLIPSE EXIT / POWER",
    value: "MISSION: LEO-IMAGER-07\nNEXT CONTACT: 11 minutes\nPASS DURATION: 7 minutes 40 seconds\n\nTELEMETRY\n- Battery bus voltage is 6% below its 30-day eclipse-exit baseline.\n- State of charge is 48% and recovering at the expected rate.\n- Two attitude-control acknowledgements arrived 1.8 seconds late.\n- Thermal readings are within nominal limits.\n- The redundant flight computer reports healthy.\n- No fault protection action has fired.\n\nRECENT OPERATIONS\n- Payload calibration completed 43 minutes ago.\n- No command rejects in the last 24 hours.\n- The next imaging task begins 26 minutes after contact ends.",
  },
  {
    label: "THERMAL RISE / PAYLOAD",
    value: "MISSION: EO-SCOUT-12\nNEXT CONTACT: 6 minutes\nPASS DURATION: 5 minutes 10 seconds\n\nTELEMETRY\n- Payload electronics temperature rose 8.2°C over 14 minutes and is 1.4°C below the caution limit.\n- The radiator loop pump current is 19% above baseline.\n- Bus voltage, attitude control, and flight computers are nominal.\n- One payload reset occurred two orbits ago and recovered automatically.\n- No safe-mode trigger has fired.\n\nRECENT OPERATIONS\n- A high-duty imaging sequence ended 18 minutes ago.\n- Another high-duty sequence is scheduled immediately after the pass.\n- Operators can defer that sequence during contact.",
  },
  {
    label: "COMMAND DELAY / ADCS",
    value: "MISSION: WEATHER-CUBE-04\nNEXT CONTACT: 3 minutes\nPASS DURATION: 4 minutes 20 seconds\n\nTELEMETRY\n- Four attitude-control acknowledgements were delayed by 4–7 seconds.\n- Star tracker solution quality dropped twice but recovered.\n- Reaction wheel momentum is at 86% of the operational limit.\n- Battery and thermal subsystems are nominal.\n- A momentum-dump opportunity is available during the next pass.\n\nRECENT OPERATIONS\n- The previous pass ended before the final diagnostic packet arrived.\n- No redundant sensor disagreement is present.\n- The next scheduled imaging slew begins 12 minutes after contact.",
  },
];

const questionMeta = [
  { id: "action", label: "PASS ACTION", type: "CHOICE" },
  { id: "urgency", label: "OPS PRIORITY", type: "SCORE" },
  { id: "safe_mode_review", label: "SAFE-MODE REVIEW", type: "NOUL" },
] as const;

function answerValue(answer?: Answer) {
  if (!answer) return "—";
  if (answer.type === "choice") return (answer.choice || "—").replaceAll("_", " ").toUpperCase();
  if (answer.type === "score") return typeof answer.score === "number" ? answer.score.toFixed(2) : "—";
  if (typeof answer.noul === "number") return answer.noul >= 0.5 ? "YES" : "NO";
  return "—";
}

function probabilityRows(answer?: Answer) {
  if (!answer) return [];
  if (answer.type === "noul" && typeof answer.noul === "number") return [{ label: "YES", value: answer.noul }, { label: "NO", value: 1 - answer.noul }];
  return Object.entries(answer.probabilities || {}).map(([key, value]) => ({ label: answer.legend?.[key] || key, value }));
}

function ModelCell({ result, questionId }: { result?: ModelResult; questionId: string }) {
  if (!result) return <div className="mission-empty">Awaiting run</div>;
  if (!result.ok) return <div className="mission-error"><CircleAlert size={16} />{result.error || "Request failed"}</div>;
  const answer = result.data?.answers?.[questionId];
  const rows = probabilityRows(answer);
  return (
    <div className="mission-answer">
      <strong className={answerValue(answer).length > 16 ? "long" : ""}>{answerValue(answer)}</strong>
      <span className="mission-confidence">{typeof answer?.confidence === "number" ? `${(answer.confidence * 100).toFixed(1)}% confidence` : answer?.type === "noul" && typeof answer.noul === "number" ? `${(answer.noul * 100).toFixed(1)}% yes` : "Probability output"}</span>
      <div className="mission-probs">{rows.map((row) => <div key={row.label}><span title={row.label}>{row.label}</span><b>{(row.value * 100).toFixed(1)}%</b></div>)}</div>
    </div>
  );
}

export default function GroundPassTriagePage() {
  const [telemetry, setTelemetry] = useState(presets[0].value);
  const [result, setResult] = useState<TriageResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const agreements = useMemo(() => {
    if (!result?.d1?.ok || !result?.jev?.ok) return null;
    return questionMeta.reduce((total, question) => {
      const d1 = result.d1?.data?.answers?.[question.id];
      const jev = result.jev?.data?.answers?.[question.id];
      if (question.id === "action") return total + (d1?.choice === jev?.choice ? 1 : 0);
      if (question.id === "safe_mode_review") return total + ((d1?.noul ?? 0) >= 0.5 === ((jev?.noul ?? 0) >= 0.5) ? 1 : 0);
      return total + (Math.round(d1?.score ?? -99) === Math.round(jev?.score ?? -98) ? 1 : 0);
    }, 0);
  }, [result]);

  async function runTriage(event: FormEvent) {
    event.preventDefault();
    if (!telemetry.trim() || loading) return;
    setLoading(true);
    setResult(null);
    setError("");
    try {
      const response = await fetch("/api/space-triage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ telemetry }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || `Triage failed (${response.status}).`);
      setResult(payload);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Ground-pass triage failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <DemoShell section="SAT / MISSION OPERATIONS" title="GROUND-PASS TRIAGE">
      <div className="compare-back"><Link href="/demos/space-satellites"><ArrowLeft size={15} /> SPACE + SATELLITES</Link></div>
      <SwarmSimulation />
      <section className="mission-workspace">
        <form className="mission-input" onSubmit={runTriage}>
          <div className="panel-heading"><span>02 / CONTACT WINDOW</span><Satellite size={18} /></div>
          <p className="compare-intro">D1 and pinned JEV 1.13 receive the same synthetic telemetry and answer three native decision questions in one pass. No spacecraft command is sent.</p>
          <div className="mission-status-strip"><span><Radio size={14} /> NEXT PASS</span><strong>SIMULATION</strong><span>HUMAN IN COMMAND</span></div>
          <div className="preset-buttons">{presets.map((preset, index) => <Button key={preset.label} type="button" variant="ghost" onClick={() => setTelemetry(preset.value)}>{String(index + 1).padStart(2, "0")} / {preset.label}</Button>)}</div>
          <label htmlFor="telemetry-case">MISSION STATE + TELEMETRY</label>
          <Textarea id="telemetry-case" value={telemetry} onChange={(event) => setTelemetry(event.target.value)} className="retro-control mission-textarea" />
          {error && <p className="error-copy"><CircleAlert size={16} />{error}</p>}
          <Button type="submit" className="run-button h-14 w-full" disabled={loading || !telemetry.trim()}>{loading ? "EVALUATING CONTACT WINDOW…" : "RUN GROUND-PASS TRIAGE"}{!loading && <ArrowRight size={19} />}</Button>
        </form>

        <section className="mission-output" aria-label="Ground-pass comparison results">
          <div className="comparison-status"><span>03 / LIVE MODEL DECISIONS</span>{agreements != null && <div className="agreement yes"><Check size={15} />{agreements} / 3 ALIGNED</div>}</div>
          <div className="mission-model-head"><div>DECISION CONTRACT</div><div><span>LIQUID</span>D1</div><div><span>OPENROUTER / TYPESAFE</span>JEV 1.13</div></div>
          {questionMeta.map((question, index) => (
            <article className="triage-question" key={question.id}>
              <div className="triage-label"><span>0{index + 1} / {question.type}</span><h3>{question.label}</h3></div>
              <ModelCell result={result?.d1} questionId={question.id} />
              <ModelCell result={result?.jev} questionId={question.id} />
            </article>
          ))}
          <div className="mission-run-footer">
            <div><Clock3 size={14} /><span>D1 {result?.d1?.data?.latency_ms != null ? `${result.d1.data.latency_ms} ms` : "—"}</span><span>JEV {result?.jev?.data?.latency_ms != null ? `${result.jev.data.latency_ms} ms` : "—"}</span></div>
            {result && <details className="mission-raw"><summary><Terminal size={14} /> RAW PAYLOADS</summary><pre>{JSON.stringify({ d1: result.d1?.data?.raw, jev: result.jev?.data?.raw }, null, 2)}</pre></details>}
          </div>
        </section>
      </section>
      <div className="mission-boundary"><Orbit size={18} /><div><strong>ADVISORY ONLY</strong><span>Flight controllers review every recommendation. This demo cannot transmit commands, change spacecraft configuration, or initiate safe mode.</span></div></div>
      <section className="domain-truth" aria-labelledby="domain-truth-heading">
        <div className="domain-truth-heading"><div><span className="log-kicker">04 / EVIDENCE BOUNDARY</span><h2 id="domain-truth-heading">PUBLIC TRUTH vs. PROPOSED LAYER</h2></div><p>The replay combines documented constellation practices with a clearly labeled decision-avionics hypothesis. It does not claim access to proprietary flight software.</p></div>
        <div className="truth-grid">
          <article><span>DOCUMENTED / NASA</span><h3>STARLING</h3><p>Distributed task allocation, reactive operations, crosslink coordination, passive safety ellipses, and automated traffic coordination have been demonstrated in orbit.</p><a href="https://www.nasa.gov/smallspacecraft/what-is-starling/" target="_blank" rel="noreferrer">PRIMARY SOURCE <ExternalLink size={13} /></a></article>
          <article><span>DOCUMENTED / OPERATORS</span><h3>LEO CONSTELLATIONS</h3><p>Starlink documents autonomous avoidance and ephemeris sharing; Amazon Leo documents active propulsion and disposal; OneWeb documents passive separation and automated ground screening.</p><div className="truth-links"><a href="https://docs.space-safety.starlink.com/docs/" target="_blank" rel="noreferrer">STARLINK <ExternalLink size={13} /></a><a href="https://www.aboutamazon.com/news/innovation-at-amazon/amazon-project-kuiper-space-safety" target="_blank" rel="noreferrer">AMAZON LEO <ExternalLink size={13} /></a><a href="https://www.eutelsat.com/group/sustainability-esg/responsible-space" target="_blank" rel="noreferrer">ONEWEB <ExternalLink size={13} /></a></div></article>
          <article className="truth-proposed"><span>PROPOSED / DECISION LAB</span><h3>DECISION AVIONICS</h3><p>D1 or JEV converts derived telemetry into bounded operational guidance, probabilities, and escalation flags. Deterministic avionics still validates and executes every permitted response.</p><strong>THIS IS THE INVENTION</strong></article>
        </div>
      </section>
    </DemoShell>
  );
}
