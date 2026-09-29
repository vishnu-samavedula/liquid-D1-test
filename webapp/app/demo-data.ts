export type DemoExample = {
  title: string;
  subtitle: string;
  problem: string;
  inputs: string[];
  outputs: string[];
  modes: string[];
  guardrail: string;
};

export type DemoCategory = {
  slug: string;
  code: string;
  title: string;
  navTitle: string;
  description: string;
  examples: DemoExample[];
};

export const demoCategories: DemoCategory[] = [
  {
    slug: "financial-services",
    code: "FIN",
    title: "FINANCIAL SERVICES",
    navTitle: "Financial services",
    description: "Decision support for high-volume money movement, evidence intake, and operations queues.",
    examples: [
      {
        title: "TRANSACTION PULSE",
        subtitle: "Realtime payment review",
        problem: "Stream synthetic card or account-to-account events through a visible risk desk. D1 explains which cases can pass, need step-up verification, or belong in a human review queue.",
        inputs: ["Amount, merchant, device, velocity", "Customer and counterparty history", "Policy-specific exception signals"],
        outputs: ["PASS / STEP-UP / REVIEW", "Risk score and confidence", "Ranked reason probabilities"],
        modes: ["CHOICE", "SCORE"],
        guardrail: "Demo recommends queue placement only; it never autonomously freezes funds or denies a customer.",
      },
      {
        title: "CHARGEBACK EVIDENCE DESK",
        subtitle: "Multimodal dispute intake",
        problem: "Review receipts, delivery photos, order metadata, and written claims to determine whether a dispute packet is ready for a specialist.",
        inputs: ["Claim narrative", "Receipt and delivery images", "Order and shipment timeline"],
        outputs: ["COMPLETE / REQUEST MORE / REVIEW", "Evidence-completeness score", "Missing-evidence checklist"],
        modes: ["VISION", "CHOICE", "SCORE"],
        guardrail: "No fraud accusation or final chargeback decision; a specialist owns the outcome.",
      },
    ],
  },
  {
    slug: "defense-public-sector",
    code: "DPS",
    title: "DEFENSE + PUBLIC SECTOR",
    navTitle: "Defense + public",
    description: "Human-supervised readiness and civil-response workflows—not targeting or weapons decisions.",
    examples: [
      {
        title: "FLEET READINESS TRIAGE",
        subtitle: "Maintenance queue prioritization",
        problem: "Combine equipment telemetry, maintenance history, and operator notes to prioritize inspections across a mixed fleet.",
        inputs: ["Fault codes and telemetry", "Maintenance history", "Technician observations"],
        outputs: ["KEEP IN SERVICE / INSPECT / HOLD", "Readiness-impact score", "Likely fault-family probabilities"],
        modes: ["CHOICE", "SCORE"],
        guardrail: "Advisory maintenance triage only; authorized personnel make every operational disposition.",
      },
      {
        title: "DISASTER RESPONSE DESK",
        subtitle: "Civil incident routing",
        problem: "Turn incoming field reports and responder imagery into a shared priority queue for fire, medical, utilities, or logistics teams.",
        inputs: ["911 or field report text", "Scene photographs", "Location and resource status"],
        outputs: ["Agency or team routing", "Urgency score", "Uncertainty and missing details"],
        modes: ["VISION", "CHOICE", "SCORE"],
        guardrail: "Supports dispatch coordination; it does not replace incident commanders or emergency judgment.",
      },
    ],
  },
  {
    slug: "ecommerce",
    code: "ECM",
    title: "ECOMMERCE",
    navTitle: "Ecommerce",
    description: "Fast, inspectable decisions across returns, catalog quality, and customer operations.",
    examples: [
      {
        title: "RETURN ROUTER",
        subtitle: "Visual return operations",
        problem: "Use an order record, customer explanation, and damage photos to choose the least-friction next step for a return request.",
        inputs: ["Order and policy context", "Customer description", "Product and packaging images"],
        outputs: ["REPLACE / RETURN / TROUBLESHOOT / REVIEW", "Confidence distribution", "Policy exception indicator"],
        modes: ["VISION", "CHOICE"],
        guardrail: "Low-confidence and policy-exception cases route to a human rather than silently rejecting a customer.",
      },
      {
        title: "CATALOG INTEGRITY MONITOR",
        subtitle: "Listing mismatch detection",
        problem: "Compare a product title, specifications, and images to catch conflicting color, quantity, compatibility, or pack-size claims before publication.",
        inputs: ["Listing copy and structured specs", "Product imagery", "Category rules"],
        outputs: ["PUBLISH / HOLD / CORRECT / REVIEW", "Consistency score", "Suspected mismatch category"],
        modes: ["VISION", "NOUL", "CHOICE"],
        guardrail: "The system flags inconsistencies; a merchant or catalog operator approves material changes.",
      },
    ],
  },
  {
    slug: "retail",
    code: "RTL",
    title: "RETAIL",
    navTitle: "Retail",
    description: "Store-floor decisions that join visual conditions with inventory and operational signals.",
    examples: [
      {
        title: "SHELF AVAILABILITY WATCH",
        subtitle: "On-shelf action queue",
        problem: "Compare shelf imagery with planogram and inventory data to decide whether a location needs restocking, verification, or a count correction.",
        inputs: ["Shelf image", "Planogram location", "On-hand and backroom quantity"],
        outputs: ["RESTOCK / VERIFY / RECOUNT / OK", "Shelf-availability score", "Visual evidence confidence"],
        modes: ["VISION", "CHOICE", "SCORE"],
        guardrail: "Recommendations create associate tasks; inventory records are not overwritten automatically.",
      },
      {
        title: "STORE OPS QUEUE",
        subtitle: "Cross-signal incident prioritization",
        problem: "Merge refrigeration alarms, checkout outages, spill reports, and staffing signals into one explainable operations queue.",
        inputs: ["IoT alarms", "Associate reports", "Store traffic and staffing"],
        outputs: ["Responsible team", "Operational priority", "Escalation yes/no"],
        modes: ["NOUL", "CHOICE", "SCORE"],
        guardrail: "Safety-critical alerts remain governed by existing alarms and procedures; the model helps sequence response.",
      },
    ],
  },
  {
    slug: "hls",
    code: "HLS",
    title: "HEALTHCARE + LIFE SCIENCES",
    navTitle: "Healthcare + LS",
    description: "Non-diagnostic quality and administrative workflows with explicit expert review points.",
    examples: [
      {
        title: "CLINICAL TRIAL SITE MONITOR",
        subtitle: "Study operations quality queue",
        problem: "Review document completeness and protocol-deviation signals across study sites, then prioritize routine follow-up, data queries, or quality review.",
        inputs: ["Site document checklist", "Visit and query status", "Protocol-deviation metadata"],
        outputs: ["ROUTINE / QUERY / QUALITY REVIEW", "Follow-up priority", "Missing-artifact list"],
        modes: ["CHOICE", "SCORE"],
        guardrail: "Administrative quality support only; no diagnosis, treatment, or subject eligibility decision.",
      },
      {
        title: "ASSAY QC DESK",
        subtitle: "Research-use run disposition",
        problem: "Combine control results, duplicate variability, plate artifacts, and microscopy images into an auditable recommendation for scientists.",
        inputs: ["Control and CV metrics", "Plate-map context", "Microscopy or well images"],
        outputs: ["ACCEPT / FLAG / REPEAT / EXPERT REVIEW", "QC score", "Artifact probabilities"],
        modes: ["VISION", "CHOICE", "SCORE"],
        guardrail: "Research-use-only demonstration; a qualified scientist owns validation and release.",
      },
    ],
  },
  {
    slug: "game-fun",
    code: "FUN",
    title: "GAME / FUN",
    navTitle: "Game / fun",
    description: "Playful ways to expose probabilities, consistency, strategy, and adversarial pressure.",
    examples: [
      {
        title: "DECISION ARENA",
        subtitle: "Live agent strategy match",
        problem: "Put two agents into a compact survival, negotiation, or resource-allocation game and expose each move, confidence, and probability shift in real time.",
        inputs: ["Game state", "Available moves", "Opponent history"],
        outputs: ["Selected move", "Danger or utility score", "Full probability distribution"],
        modes: ["CHOICE", "SCORE"],
        guardrail: "A sandboxed game with synthetic state, designed for observability rather than real-world control.",
      },
      {
        title: "VAULT GUARD",
        subtitle: "Persuasion-resistance challenge",
        problem: "Players try to convince an AI gatekeeper to release a fictional prize while its decision boundary and manipulation score remain visible.",
        inputs: ["Player message", "Vault policy", "Conversation history"],
        outputs: ["OPEN / KEEP LOCKED", "Manipulation score", "Policy-grounding confidence"],
        modes: ["NOUL", "SCORE"],
        guardrail: "Uses fictional assets and policies; no real credentials, money, or security controls are connected.",
      },
    ],
  },
];

export function getDemoCategory(slug: string) {
  return demoCategories.find((category) => category.slug === slug);
}
