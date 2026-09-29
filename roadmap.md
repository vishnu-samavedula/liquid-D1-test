# Decision Lab Demo Roadmap

This roadmap tracks the industry demos in the local D1 decision lab. Every operational demo is advisory: high-consequence actions remain with a qualified human.

## Status key

- **Working** — runnable end-to-end against live model APIs
- **Designed** — product brief and decision contract are defined
- **Planned** — concept is captured; implementation has not started
- **Placeholder** — track reserved while the use case is being reconsidered

## Industry tracks

| Track | Demo | Modes | Status | Route / next milestone |
| --- | --- | --- | --- | --- |
| Financial Services | Transaction Pulse | Choice | **Working** | `/demos/financial-services/transaction-pulse` — D1 vs pinned JEV 1.13 |
| Financial Services | Chargeback Evidence Desk | Vision, Choice, Score | Designed | Add multimodal evidence intake and completeness scoring |
| Defense + Public Sector | Fleet Readiness Triage | Choice, Score | Designed | Add synthetic fault-code stream and maintenance queue |
| Defense + Public Sector | Disaster Response Desk | Vision, Choice, Score | Designed | Add incident-report and scene-image routing |
| Ecommerce | Return Router | Vision, Choice | Designed | Add product-damage upload and policy-aware routing |
| Ecommerce | Catalog Integrity Monitor | Vision, Noul, Choice | Designed | Add listing/spec/image consistency checks |
| Retail | Shelf Availability Watch | Vision, Choice, Score | Designed | Add shelf image, planogram, and inventory state |
| Retail | Store Ops Queue | Noul, Choice, Score | Designed | Add refrigeration, checkout, spill, and staffing events |
| Healthcare + Life Sciences | Clinical Trial Site Monitor | Choice, Score | Designed | Add document and protocol-deviation queue |
| Healthcare + Life Sciences | Assay QC Desk | Vision, Choice, Score | Designed | Add control metrics, plate map, and microscopy review |
| Game / Fun | Decision Arena | Choice, Score | Designed | Build a visible turn-based agent match |
| Game / Fun | Vault Guard | Noul, Score | Designed | Build a fictional persuasion-resistance challenge |
| Space + Satellites | Streaming use case — TBD | TBD | **Placeholder** | Brainstorm a genuinely streaming, stateful decision problem before rebuilding |

## Near-term build order

1. Harden Transaction Pulse with a labeled replay set.
2. Brainstorm a streaming use case where D1 responds to changing state over time.
3. Build Decision Arena to make probability changes visible over time.
4. Add one operational workflow each for retail and healthcare/life sciences.

## Evaluation notes

- Use identical state, instructions, and criteria when comparing D1 and JEV.
- Pin JEV to `typesafe/jev-1.13` for reproducible runs.
- Record model version, provider, latency, token usage, full probability distributions, and agreement.
- Treat a single case as a product demonstration, not an accuracy benchmark.
- Establish thresholds from a labeled domain-specific dataset before automating any action.
