"use client";

import { FormEvent, type CSSProperties, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Activity, ArrowRight, Check, CircleAlert, Factory, Gamepad2, Landmark, ListTree, Map, RotateCcw, Terminal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";

type Model = { name: string; description?: string; release_date?: string };
type DecisionType = "noul" | "choice" | "score";
type LogLevel = "SYS" | "REQ" | "RES" | "ERR";
type LogEntry = { id: number; time: string; level: LogLevel; message: string };
type Answer = {
  type?: DecisionType;
  noul?: number;
  choice?: string;
  score?: number;
  confidence?: number;
  probabilities?: Record<string, number>;
  legend?: Record<string, string>;
};
type DecisionResponse = {
  model?: string;
  answers?: { decision?: Answer };
  usage?: { input_tokens?: number; output_tokens?: number };
  _meta?: { latency_ms?: number; status?: number };
};

type Example = {
  label: string;
  type: DecisionType;
  state: string;
  instructions: string;
  criteria: string;
};

const defaultCriteria: Record<DecisionType, string> = {
  noul: "true: Escalate immediately\nfalse: Keep in the standard queue",
  choice: "urgent: Requires immediate action\nstandard: Follow the normal queue\nmonitor: Watch for changes",
  score: "Low urgency\nMedium urgency\nCritical urgency",
};

const textExamples: Example[] = [
  {
    label: "01 · Manufacturing line incident",
    type: "choice",
    state: "Packaging Line 4 recorded three seal-temperature deviations in 40 minutes. Two finished cartons failed visual inspection, upstream fill weights are normal, and a maintenance technician is available now.",
    instructions: "Choose the appropriate operational response for the production supervisor.",
    criteria: "continue: Continue production with routine monitoring\ninspect: Pause briefly for targeted inspection and adjustment\nstop_line: Stop the line and begin deviation procedures\nquarantine: Stop the line and quarantine output since the last good check",
  },
  {
    label: "02 · Satellite telemetry triage",
    type: "score",
    state: "A low-Earth-orbit imaging satellite reports battery voltage 6% below its 30-day baseline during eclipse exit, two delayed attitude-control acknowledgements, stable thermal readings, and a healthy redundant flight computer. The next ground-station pass begins in 11 minutes.",
    instructions: "Rate the priority for mission-operations review during the next ground pass.",
    criteria: "Routine — continue automated monitoring\nElevated — add focused checks to the next pass\nUrgent — assign an operator for immediate investigation\nCritical — enter a predefined safe-mode procedure",
  },
  {
    label: "03 · Food cold-chain release",
    type: "noul",
    state: "A refrigerated yogurt shipment reached 7.4°C for 18 minutes during unloading. The specification is 2–6°C, the pallets remained sealed, and approved stability data covers excursions up to 8°C for 30 minutes.",
    instructions: "Should this shipment be placed on quality hold for manual review?",
    criteria: "true: Place the shipment on quality hold\nfalse: Release under the approved excursion allowance",
  },
  {
    label: "04 · Recipe substitution",
    type: "choice",
    state: "A bakery needs to replace buttermilk in a pancake recipe. The batter relies on baking soda for lift, the final flavor should stay mildly tangy, and the kitchen has whole milk, plain yogurt, lemon juice, and oat milk.",
    instructions: "Choose the substitution most likely to preserve texture and flavor.",
    criteria: "milk_lemon: Whole milk mixed with lemon juice\nyogurt_thinned: Plain yogurt thinned with water\noat_milk: Oat milk used by itself\nplain_milk: Whole milk used by itself",
  },
  {
    label: "05 · Ecommerce return routing",
    type: "choice",
    state: "A customer requests a return for headphones delivered 12 days ago. The left channel is intermittent, the serial number matches the order, photos show intact packaging, and the customer has no prior return abuse signals.",
    instructions: "Choose the best next step in the return workflow.",
    criteria: "instant_replace: Approve an immediate replacement\nstandard_return: Issue a standard return label\ntroubleshoot: Route to product troubleshooting first\nmanual_review: Send to a human fraud or policy review",
  },
  {
    label: "06 · Ecommerce replenishment",
    type: "score",
    state: "A top-selling water bottle has 420 units on hand, average sales of 95 units per day, a seven-day supplier lead time, and an active promotion expected to increase demand by 30% next week.",
    instructions: "Rate the urgency of creating a replenishment order.",
    criteria: "Low — current stock comfortably covers demand\nModerate — place an order in the normal planning cycle\nHigh — place an expedited order today\nCritical — stockout is imminent; escalate supply options",
  },
  {
    label: "07 · Fintech transaction review",
    type: "score",
    state: "An established small-business customer initiated a $7,800 payment to a new vendor. The device and location match prior activity, invoice metadata is present, but the amount is 3.5× the customer’s usual outgoing payment.",
    instructions: "Rate the priority for manual transaction review; do not make a final approval decision.",
    criteria: "Routine — process with standard monitoring\nElevated — add to the review queue\nUrgent — review before processing\nCritical — pause and escalate to the fraud team",
  },
  {
    label: "08 · Customer support escalation",
    type: "noul",
    state: "A business customer reports that payroll exports have failed three times today. A workaround did not help, payroll closes in two hours, and the account is covered by a priority-support SLA.",
    instructions: "Should this case be escalated to the incident response queue now?",
    criteria: "true: Escalate immediately to incident response\nfalse: Continue handling in the standard support queue",
  },
  {
    label: "09 · Life-sciences assay QC",
    type: "choice",
    state: "A research-use-only plate assay has controls within range, duplicate CV of 14% against a target below 10%, one edge-well artifact, and sufficient sample remains for one repeat run.",
    instructions: "Choose the appropriate QC disposition for a scientist to review.",
    criteria: "accept: Accept the run as-is\naccept_flag: Accept but flag the variability\nrepeat: Repeat the affected samples\ninvalidate: Invalidate and repeat the full plate",
  },
  {
    label: "10 · Healthcare claims routing",
    type: "choice",
    state: "A submitted outpatient claim includes the billed procedure, member identifier, service date, and provider information. The required prior-authorization reference is missing, and the payer record indicates authorization may be required.",
    instructions: "Route this claim to the appropriate administrative workflow; do not determine medical necessity.",
    criteria: "standard: Continue standard claims processing\nrequest_info: Request the missing authorization information\nmanual_review: Send to a human claims specialist\nprovider_outreach: Route to provider-services outreach",
  },
];

const visionExamples: Example[] = [
  {
    label: "01 · Manufacturing defect inspection",
    type: "choice",
    state: "Inspect the uploaded production-line image for visible surface or assembly defects. The result is advisory and will be reviewed by a quality operator.",
    instructions: "Choose the most appropriate visual QC disposition.",
    criteria: "pass: No visible defect requiring action\nrework: A visible issue appears repairable\nreject: A visible issue makes the part unsuitable\nmanual_review: Image is ambiguous or needs expert review",
  },
  {
    label: "02 · Satellite image usability",
    type: "score",
    state: "Evaluate whether the uploaded Earth-observation image is usable for downstream mapping. Consider cloud cover, haze, clipping, obstruction, and overall scene visibility.",
    instructions: "Score the image's operational usability for a human imagery analyst.",
    criteria: "Unusable — scene is substantially obscured or corrupted\nLimited — only partial analysis is possible\nUsable — adequate for the intended review\nExcellent — clear scene with strong analytical value",
  },
  {
    label: "03 · Food quality check",
    type: "noul",
    state: "Review the uploaded food image for obvious visible quality concerns such as spoilage, foreign material, severe discoloration, or damaged packaging. This is not a substitute for food-safety testing.",
    instructions: "Should this item be placed on hold for human quality inspection?",
    criteria: "true: Hold for human quality inspection\nfalse: No obvious visual reason to place on hold",
  },
  {
    label: "04 · Recipe doneness review",
    type: "choice",
    state: "Review the uploaded image of the baked item using only visible cues such as browning, rise, surface texture, and moisture appearance. Temperature and internal safety cannot be determined from the image.",
    instructions: "Choose the most useful next cooking action based on visible appearance.",
    criteria: "remove: Appearance suggests it is ready to remove\ncontinue: Continue cooking and check again soon\ncover: Cover to limit browning while cooking continues\nmanual_check: Use a thermometer or physical doneness test",
  },
  {
    label: "05 · Ecommerce damage routing",
    type: "choice",
    state: "A customer supplied the uploaded image with a damaged-item claim. Use visible evidence only; do not infer intent or fraud.",
    instructions: "Route the claim to the most appropriate operational next step.",
    criteria: "replace: Visible product damage supports replacement workflow\npackaging_only: Damage appears limited to external packaging\nrequest_more: More images or details are needed\nmanual_review: Send to a human claims specialist",
  },
  {
    label: "06 · Fintech document intake",
    type: "score",
    state: "Review the uploaded financial document image for intake quality only. Consider readability, cropping, glare, missing pages, and whether key fields are visually present. Do not approve, deny, or assess financial eligibility.",
    instructions: "Rate how ready the document is for human processing.",
    criteria: "Unusable — unreadable or substantially incomplete\nNeeds resubmission — major capture issues are visible\nReviewable — adequate for human processing\nHigh quality — clear, complete, and well captured",
  },
  {
    label: "07 · Support screenshot routing",
    type: "choice",
    state: "The uploaded screenshot came from a software support ticket. Inspect visible interface state, messages, and layout without attempting to read hidden or redacted information.",
    instructions: "Choose the support team that should review this screenshot first.",
    criteria: "account: Sign-in, permissions, or account state\nbilling: Subscription, payment, or invoice interface\ntechnical: Error, crash, or broken product behavior\nneeds_context: Screenshot alone is insufficient",
  },
  {
    label: "08 · Life-sciences microscopy QC",
    type: "choice",
    state: "Review the uploaded research-use-only microscopy image for acquisition quality. Consider focus, illumination, field coverage, debris, and obvious imaging artifacts. Do not make a diagnostic interpretation.",
    instructions: "Choose the appropriate imaging QC disposition for a scientist to review.",
    criteria: "accept: Image quality is adequate for analysis\nrefocus: Focus quality appears insufficient\nreacquire: Illumination, coverage, or artifact issues warrant reacquisition\nexpert_review: Quality is ambiguous and needs specialist review",
  },
  {
    label: "09 · Healthcare form completeness",
    type: "choice",
    state: "Review the uploaded administrative healthcare form for visible completeness and legibility only. Do not interpret clinical content or determine medical necessity.",
    instructions: "Route the document to the appropriate administrative next step.",
    criteria: "process: Required sections appear present and legible\nrequest_rescan: Image quality prevents processing\nrequest_fields: Visible required fields appear incomplete\nmanual_review: A human records specialist should inspect it",
  },
  {
    label: "10 · Industrial safety observation",
    type: "noul",
    state: "Review the uploaded workplace image for obvious visible safety concerns such as blocked access, missing barriers, unmanaged spills, or absent required protective equipment. A safety professional makes the final determination.",
    instructions: "Should this image be escalated for immediate human safety review?",
    criteria: "true: Escalate for immediate human safety review\nfalse: No obvious visual reason for immediate escalation",
  },
];

const roadmapIdeas = [
  {
    id: "demo-game",
    kind: "FUN / GAME",
    title: "Decision Arena",
    description: "Two AI-controlled pilots face the same changing world state. D1 chooses each move, scores danger, and exposes its probabilities live so spectators can predict the next action.",
    modes: ["choice", "score", "noul"],
    next: "Build first",
  },
  {
    id: "demo-payments",
    kind: "FINTECH",
    title: "Transaction Pulse",
    description: "Stream synthetic card transactions across a world map. Route each event to pass, step-up verification, or human review while plotting risk score and confidence drift.",
    modes: ["choice", "score"],
    next: "High value",
  },
  {
    id: "demo-factory",
    kind: "INDUSTRIAL",
    title: "Factory Line Commander",
    description: "Animate parts moving through an assembly line. Combine PLC error codes, sensor readings, and camera evidence to continue, inspect, rework, quarantine, or stop the line.",
    modes: ["choice", "score", "noul", "VL"],
    next: "High value",
  },
  {
    id: "demo-vault",
    kind: "FUN / SECURITY",
    title: "The Vault Guard",
    description: "Players try to persuade an AI guard to release a prize. D1 continuously scores manipulation risk and decides whether each requested action crosses the policy line.",
    modes: ["score", "noul"],
    next: "Viral demo",
  },
  {
    id: "demo-router",
    kind: "AI INFRA",
    title: "Model Traffic Controller",
    description: "Route incoming tasks to the smallest capable model. Use choice for model selection, score for complexity, and noul for whether frontier escalation is justified.",
    modes: ["choice", "score", "noul"],
    next: "Developer demo",
  },
  {
    id: "demo-satellite",
    kind: "SPACE",
    title: "Ground-Pass Triage",
    description: "Replay satellite telemetry and imagery before a short ground-station window. Prioritize commands, score anomaly severity, and decide whether safe mode is warranted.",
    modes: ["choice", "score", "noul", "VL"],
    next: "Visual demo",
  },
  {
    id: "demo-support",
    kind: "CUSTOMER OPS",
    title: "Support Control Tower",
    description: "Process a live queue of tickets, screenshots, and account context. Route ownership, score urgency, and surface only low-confidence cases for human triage.",
    modes: ["choice", "score", "VL"],
    next: "Practical demo",
  },
  {
    id: "demo-coldchain",
    kind: "LIFE SCIENCES",
    title: "Cold-Chain Watch",
    description: "Evaluate temperature excursions, packaging photos, stability windows, and shipping events to recommend release, hold, or quality review—with every uncertainty visible.",
    modes: ["choice", "score", "noul", "VL"],
    next: "Serious demo",
  },
];

const starterLogs: LogEntry[] = [
  { id: 1, time: "--:--:--", level: "SYS", message: "Console initialized. Waiting for model registry." },
];

function timestamp() {
  return new Date().toLocaleTimeString("en-US", { hour12: false });
}

function resultLabel(answer?: Answer) {
  if (!answer) return "—";
  if (answer.type === "choice") return answer.choice || "—";
  if (answer.type === "score") return typeof answer.score === "number" ? answer.score.toFixed(2) : "—";
  return typeof answer.noul === "number" ? (answer.noul >= 0.5 ? "YES" : "NO") : "—";
}

function displayType(type?: DecisionType) {
  return type?.toUpperCase() || "—";
}

function probabilityRows(answer?: Answer) {
  if (!answer) return [];
  if (answer.type === "noul" && typeof answer.noul === "number") {
    return [
      { label: "YES", value: answer.noul },
      { label: "NO", value: 1 - answer.noul },
    ];
  }
  return Object.entries(answer.probabilities || {}).map(([key, value]) => ({
    label: answer.legend?.[key] || key,
    value,
  }));
}

export default function Home() {
  const [models, setModels] = useState<Model[]>([]);
  const [model, setModel] = useState("");
  const [state, setState] = useState("A customer reports that payouts have failed for three days and needs access restored before payroll closes today.");
  const [decisionType, setDecisionType] = useState<DecisionType>("noul");
  const [instructions, setInstructions] = useState("Should this case be escalated immediately?");
  const [criteria, setCriteria] = useState(defaultCriteria.noul);
  const [selectedExample, setSelectedExample] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [imageNames, setImageNames] = useState<string[]>([]);
  const [imageError, setImageError] = useState("");
  const [imageInputKey, setImageInputKey] = useState(0);
  const [result, setResult] = useState<DecisionResponse | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>(starterLogs);
  const [loading, setLoading] = useState(false);
  const [modelError, setModelError] = useState("");
  const isVisionModel = model.includes("S1-VL");
  const activeExamples = isVisionModel ? visionExamples : textExamples;

  const addLog = (level: LogLevel, message: string) => {
    setLogs((current) => [...current, { id: Date.now() + Math.random(), time: timestamp(), level, message }]);
  };

  useEffect(() => {
    let active = true;
    async function loadModels() {
      try {
        const response = await fetch("/api/models", { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Model registry unavailable");
        if (!active) return;
        const available = Array.isArray(payload.models) ? payload.models : [];
        setModels(available);
        setModel(available[0]?.name ?? "");
        addLog("SYS", `${available.length} decision model${available.length === 1 ? "" : "s"} online.`);
      } catch (error) {
        if (!active) return;
        const message = error instanceof Error ? error.message : "Model registry unavailable";
        setModelError(message);
        addLog("ERR", message);
      }
    }
    loadModels();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    type ToolInput = { model?: string; state?: string; type?: DecisionType; instructions?: string; criteria?: string };
    type ModelContextLike = {
      registerTool: (tool: {
        name: string;
        title: string;
        description: string;
        inputSchema: object;
        annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
        execute: (input: unknown) => Promise<unknown>;
      }, options: { signal: AbortSignal }) => void | Promise<void>;
    };

    const context = (document as unknown as { modelContext?: ModelContextLike }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();

    const registration = context.registerTool({
      name: "run_d1_decision",
      title: "Run D1 decision",
      description: "Run a visible D1 decision using custom input, rule type, instructions, and criteria.",
      inputSchema: {
        type: "object",
        properties: {
          model: { type: "string" },
          state: { type: "string" },
          type: { type: "string", enum: ["noul", "choice", "score"] },
          instructions: { type: "string" },
          criteria: { type: "string" },
        },
        required: ["model", "state", "type", "instructions", "criteria"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: true },
      async execute(input: unknown) {
        const value = input as ToolInput;
        if (!value.model || !value.type || !value.instructions || typeof value.state !== "string" || typeof value.criteria !== "string") {
          throw new Error("model, state, type, instructions, and criteria are required.");
        }

        setModel(value.model);
        setState(value.state);
        setDecisionType(value.type);
        setInstructions(value.instructions);
        setCriteria(value.criteria);
        setResult(null);
        setLoading(true);
        setLogs((current) => [...current, { id: Date.now(), time: timestamp(), level: "REQ", message: `WebMCP · ${value.model} · ${value.type}` }]);

        try {
          const response = await fetch("/api/decide", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(value),
          });
          const payload = await response.json();
          if (!response.ok) throw new Error(payload.error || `Request failed (${response.status})`);
          setResult(payload);
          const returnedAnswer = payload.answers?.decision as Answer | undefined;
          setLogs((current) => [...current, { id: Date.now() + 1, time: timestamp(), level: "RES", message: `WebMCP decision=${resultLabel(returnedAnswer)}` }]);
          return { decision: resultLabel(returnedAnswer), answer: returnedAnswer, usage: payload.usage, latency_ms: payload._meta?.latency_ms };
        } catch (error) {
          const message = error instanceof Error ? error.message : "Decision request failed";
          setLogs((current) => [...current, { id: Date.now() + 2, time: timestamp(), level: "ERR", message }]);
          throw new Error(message);
        } finally {
          setLoading(false);
        }
      },
    }, { signal: lifecycle.signal });

    void Promise.resolve(registration).catch(() => undefined);
    return () => lifecycle.abort();
  }, []);

  const answer = result?.answers?.decision;
  const rows = probabilityRows(answer);
  const decision = resultLabel(answer);
  const confidence = answer?.confidence;
  const rawOutput = useMemo(
    () => (result ? JSON.stringify(result, null, 2) : "// Structured inference payload will appear here."),
    [result],
  );

  function changeDecisionType(next: DecisionType) {
    setDecisionType(next);
    setCriteria(defaultCriteria[next]);
    setResult(null);
    addLog("SYS", `Decision rule changed to ${next.toUpperCase()}.`);
  }

  function changeModel(next: string) {
    setModel(next);
    setSelectedExample("");
    setResult(null);
    if (!next.includes("S1-VL") && images.length) {
      setImages([]);
      setImageNames([]);
      setImageError("");
      setImageInputKey((current) => current + 1);
      addLog("SYS", "Vision inputs cleared after switching to a text-only model.");
    }
  }

  function loadExample(index: string) {
    setSelectedExample(index);
    if (index === "") return;
    const example = activeExamples[Number(index)];
    if (!example) return;
    setDecisionType(example.type);
    setState(example.state);
    setInstructions(example.instructions);
    setCriteria(example.criteria);
    setResult(null);
    addLog("SYS", `Loaded preset: ${example.label}.`);
  }

  async function attachImages(files: FileList | null) {
    setImageError("");
    const selected = Array.from(files || []);
    if (!selected.length) return;
    if (selected.length > 8) {
      setImageError("Attach no more than 8 images.");
      return;
    }

    const allowed = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
    if (selected.some((file) => !allowed.has(file.type))) {
      setImageError("Use JPEG, PNG, WebP, or GIF images.");
      return;
    }

    let encoded: string[];
    try {
      encoded = await Promise.all(selected.map((file) => new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
        reader.readAsDataURL(file);
      })));
    } catch (error) {
      setImageError(error instanceof Error ? error.message : "Could not read the selected images.");
      return;
    }

    if (encoded.reduce((total, image) => total + image.length, 0) > 4_200_000) {
      setImageError("Combined images are too large. Keep the encoded request under 4.2 MB.");
      return;
    }

    setImages(encoded);
    setImageNames(selected.map((file) => file.name));
    const visionModel = models.find((item) => item.name.includes("S1-VL"));
    if (visionModel) {
      setModel(visionModel.name);
      setSelectedExample("");
    }
    addLog("SYS", `${selected.length} vision input${selected.length === 1 ? "" : "s"} attached; image content is not logged.`);
  }

  function clearImages() {
    setImages([]);
    setImageNames([]);
    setImageError("");
    setImageInputKey((current) => current + 1);
    addLog("SYS", "Vision inputs cleared.");
  }

  async function runDecision(event: FormEvent) {
    event.preventDefault();
    if (!model || !instructions.trim() || loading) return;

    setLoading(true);
    setResult(null);
    addLog("REQ", `POST /typesafe/v1/systemone · ${model} · ${decisionType}`);
    const started = performance.now();

    try {
      const response = await fetch("/api/decide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, state: state.trim() || null, type: decisionType, instructions: instructions.trim(), criteria, images }),
      });
      const payload = await response.json();
      const clientLatency = Math.round(performance.now() - started);
      if (!response.ok) throw new Error(payload.error || `Request failed (${response.status})`);

      setResult(payload);
      const returnedAnswer = payload.answers?.decision as Answer | undefined;
      addLog("RES", `200 OK · ${clientLatency} ms · decision=${resultLabel(returnedAnswer)} · images=${images.length}`);
      if (payload.usage) addLog("SYS", `tokens in=${payload.usage.input_tokens ?? "—"} out=${payload.usage.output_tokens ?? "—"}`);
    } catch (error) {
      addLog("ERR", error instanceof Error ? error.message : "Decision request failed");
    } finally {
      setLoading(false);
    }
  }

  const criteriaLabel = decisionType === "choice" ? "CHOICES" : decisionType === "score" ? "SCORE LEVELS" : "YES / NO CRITERIA";
  const criteriaHelp = decisionType === "choice"
    ? "One key and description per line — e.g. urgent: Act now"
    : decisionType === "score"
      ? "One ordered level per line, from lowest to highest"
      : "Optional true and false descriptions";

  return (
    <SidebarProvider
      defaultOpen
      style={{ "--sidebar-width": "12.5rem", "--sidebar-width-icon": "3.25rem" } as CSSProperties}
    >
      <Sidebar collapsible="icon" className="demo-sidebar">
        <SidebarHeader className="nav-header">
          <div className="nav-monogram">L</div>
          <div className="nav-title"><strong>DEMO INDEX</strong><span>DECISION LAB</span></div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>WORKSPACE</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem><SidebarMenuButton asChild tooltip="Workbench" isActive><a href="#workbench"><Terminal /><span>Workbench</span></a></SidebarMenuButton></SidebarMenuItem>
                <SidebarMenuItem><SidebarMenuButton asChild tooltip="Demo roadmap"><a href="#roadmap"><Map /><span>Demo roadmap</span></a></SidebarMenuButton></SidebarMenuItem>
                <SidebarMenuItem><SidebarMenuButton asChild tooltip="Run log"><a href="#run-log"><ListTree /><span>Run log</span></a></SidebarMenuButton></SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>NEXT BUILDS</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem><SidebarMenuButton asChild tooltip="Decision Arena"><a href="#demo-game"><Gamepad2 /><span>Game</span></a></SidebarMenuButton></SidebarMenuItem>
                <SidebarMenuItem><SidebarMenuButton asChild tooltip="Transaction Pulse"><a href="#demo-payments"><Landmark /><span>Payments</span></a></SidebarMenuButton></SidebarMenuItem>
                <SidebarMenuItem><SidebarMenuButton asChild tooltip="Factory Commander"><a href="#demo-factory"><Factory /><span>Factory</span></a></SidebarMenuButton></SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="nav-footer"><span>PRIVATE DEMO</span><span>UNRELEASED</span></SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="bg-transparent">
      <div className="min-h-screen px-4 py-4 md:px-8 md:py-7">
      <div className="mx-auto max-w-[1480px]">
        <header className="masthead">
          <SidebarTrigger className="nav-trigger" />
          <div className="brand-lockup">
            <Image src="/liquid-logo-white.png" alt="Liquid AI" width={1539} height={504} priority className="liquid-logo" />
            <span className="brand-divider" aria-hidden="true" />
            <div><p className="eyebrow">DECISION SYSTEM</p><h1>WORKBENCH</h1></div>
          </div>
        </header>

        <div className="ticker" aria-hidden="true">
          <span>YOUR INPUT</span><span>DON&apos;T OVER-JEV IT. JUST LFM.</span><span>STRUCTURED PROBABILITIES</span>
        </div>

        <section id="workbench" className="workspace scroll-target" aria-label="Decision workbench">
          <form className="control-panel" onSubmit={runDecision}>
            <div className="panel-heading"><span>01 / CONFIGURE</span><Activity size={18} strokeWidth={2.4} aria-hidden="true" /></div>

            <div className="field-stack model-first">
              <Label htmlFor="model">DECISION MODEL</Label>
              <NativeSelect id="model" value={model} onChange={(event) => changeModel(event.target.value)} disabled={!models.length || loading} className="retro-control w-full" aria-describedby={modelError ? "model-error" : undefined}>
                {!models.length && <NativeSelectOption value="">Loading models…</NativeSelectOption>}
                {models.map((item) => <NativeSelectOption key={item.name} value={item.name}>{item.name}</NativeSelectOption>)}
              </NativeSelect>
              {modelError && <p id="model-error" className="error-copy"><CircleAlert size={15} />{modelError}</p>}
            </div>

            {isVisionModel && (
              <div className="field-stack vision-field">
                <div className="label-row"><Label htmlFor="vision-images">VISION INPUT</Label><span>UP TO 8 IMAGES</span></div>
                <Input
                  key={imageInputKey}
                  id="vision-images"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  onChange={(event) => void attachImages(event.target.files)}
                  disabled={loading}
                  className="retro-control file-control"
                />
                {imageError && <p className="error-copy"><CircleAlert size={15} />{imageError}</p>}
                {!!imageNames.length && (
                  <div className="attachment-row">
                    <span>{imageNames.length} ATTACHED · {imageNames.join(", ")}</span>
                    <Button type="button" variant="ghost" onClick={clearImages} className="attachment-clear">REMOVE</Button>
                  </div>
                )}
              </div>
            )}

            <div className="two-up">
              <div className="field-stack example-field">
                <div className="label-row"><Label htmlFor="example">TEST PRESET</Label><span>{isVisionModel ? "VISION" : "TEXT / JSON"}</span></div>
                <NativeSelect id="example" value={selectedExample} onChange={(event) => loadExample(event.target.value)} disabled={loading} className="retro-control w-full">
                  <NativeSelectOption value="">Choose an example…</NativeSelectOption>
                  {activeExamples.map((example, index) => <NativeSelectOption key={example.label} value={String(index)}>{example.label}</NativeSelectOption>)}
                </NativeSelect>
              </div>

              <div className="field-stack">
                <Label htmlFor="decision-type">RULE TYPE</Label>
                <NativeSelect id="decision-type" value={decisionType} onChange={(event) => changeDecisionType(event.target.value as DecisionType)} disabled={loading} className="retro-control w-full">
                  <NativeSelectOption value="noul">YES / NO</NativeSelectOption>
                  <NativeSelectOption value="choice">CHOICE</NativeSelectOption>
                  <NativeSelectOption value="score">SCORE</NativeSelectOption>
                </NativeSelect>
              </div>
            </div>

            <div className="field-stack">
              <div className="label-row"><Label htmlFor="state">INPUT / CASE STATE</Label><span>TEXT OR JSON</span></div>
              <Textarea id="state" value={state} onChange={(event) => setState(event.target.value)} className="retro-control min-h-28 resize-y" placeholder="Paste the content, record, conversation, or state to evaluate…" />
            </div>

            <div className="field-stack">
              <Label htmlFor="instructions">DECISION RULE / QUESTION</Label>
              <Textarea id="instructions" required value={instructions} onChange={(event) => setInstructions(event.target.value)} className="retro-control min-h-20 resize-y" placeholder="Describe exactly what the model should decide…" />
            </div>

            <div className="field-stack">
              <div className="label-row"><Label htmlFor="criteria">{criteriaLabel}</Label><span>{criteriaHelp}</span></div>
              <Textarea id="criteria" value={criteria} onChange={(event) => setCriteria(event.target.value)} className="retro-control criteria-control resize-y" />
            </div>

            <Button type="submit" disabled={!model || !instructions.trim() || loading} className="run-button h-14 w-full">
              {loading ? "RUNNING INFERENCE…" : "RUN DECISION"}
              {!loading && <ArrowRight size={19} strokeWidth={3} aria-hidden="true" />}
            </Button>
          </form>

          <section className="result-panel" aria-labelledby="result-heading">
            <div className="panel-heading panel-heading-dark"><span id="result-heading">02 / DECISION OUTPUT</span><span className="mode-tag">{displayType(decisionType)}</span></div>
            <div className={`decision-display ${answer ? "has-result" : ""}`}>
              <p className="decision-label">MODEL DECISION</p>
              <div className={`decision-word ${decision.length > 12 ? "decision-word-long" : ""}`} aria-live="polite">{loading ? "…" : decision}</div>
              <div className="decision-rule" />
              <div className="metric-grid">
                <div><span>RULE TYPE</span><strong>{displayType(answer?.type || decisionType)}</strong></div>
                <div><span>CONFIDENCE</span><strong>{typeof confidence === "number" ? `${(confidence * 100).toFixed(1)}%` : "—"}</strong></div>
                <div><span>LATENCY</span><strong>{result?._meta?.latency_ms != null ? `${result._meta.latency_ms} ms` : "—"}</strong></div>
              </div>
              <div className="probability-list">
                {rows.length ? rows.map((row) => (
                  <div className="probability-row" key={row.label}>
                    <div className="probability-copy"><span>{row.label}</span><strong>{(row.value * 100).toFixed(1)}%</strong></div>
                    <div className="probability-track"><span style={{ width: `${row.value * 100}%` }} /></div>
                  </div>
                )) : <p className="probability-empty">Probability distribution will render here.</p>}
              </div>
            </div>

            <div className="raw-output">
              <div className="raw-heading"><Terminal size={16} /><span>RAW INFERENCE</span></div>
              <pre>{rawOutput}</pre>
            </div>
          </section>
        </section>

        <section id="run-log" className="log-panel scroll-target" aria-labelledby="log-heading">
          <div className="log-toolbar">
            <div><span className="log-kicker">03 / EVENT STREAM</span><h2 id="log-heading">RUN LOG</h2></div>
            <Button type="button" variant="ghost" onClick={() => setLogs([])} className="clear-button" disabled={!logs.length}><RotateCcw size={15} aria-hidden="true" /> CLEAR</Button>
          </div>
          <div className="log-table" role="log" aria-live="polite">
            <div className="log-row log-header" aria-hidden="true"><span>TIME</span><span>TYPE</span><span>EVENT</span></div>
            {logs.length ? logs.map((entry) => (
              <div className="log-row" key={entry.id}><time>{entry.time}</time><span className={`log-level log-${entry.level.toLowerCase()}`}>{entry.level}</span><span>{entry.message}</span></div>
            )) : <div className="log-empty"><Check size={16} /> Log cleared.</div>}
          </div>
        </section>

        <section id="roadmap" className="roadmap-panel scroll-target" aria-labelledby="roadmap-heading">
          <div className="roadmap-heading">
            <div>
              <span className="log-kicker">04 / BUILD QUEUE</span>
              <h2 id="roadmap-heading">DEMO ROADMAP</h2>
            </div>
            <p>Game worlds, payment streams, visual operations, and model routing—each built around decisions you can watch, challenge, and measure.</p>
          </div>
          <div className="roadmap-grid">
            {roadmapIdeas.map((idea, index) => (
              <article id={idea.id} className="roadmap-card scroll-target" key={idea.id}>
                <div className="roadmap-card-top"><span>{String(index + 1).padStart(2, "0")}</span><span>{idea.kind}</span></div>
                <h3>{idea.title}</h3>
                <p>{idea.description}</p>
                <div className="mode-list">{idea.modes.map((mode) => <span key={mode}>{mode}</span>)}</div>
                <div className="roadmap-next">{idea.next}</div>
              </article>
            ))}
          </div>
        </section>

        <footer><span>LOCAL SESSION</span><span>KEY PROTECTED SERVER-SIDE</span><span>D1 / SYSTEM ONE</span></footer>
      </div>
      </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
