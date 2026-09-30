# Liquid Decision Workbench

A local-first demonstration of [Liquid decision models](https://docs.liquid.ai/lfm/models/decision-models) through the System One API. The application is designed to make model decisions inspectable: a user supplies state, defines a bounded decision rule, and sees the selected outcome together with its probability distribution, confidence, latency, usage, and raw API response.

This is a decision-model demo—not a chatbot. It focuses on choosing, scoring, and evaluating explicit outcomes without generated prose in the middle.

For the public model specification and API examples, see the [Liquid Decision Models documentation](https://docs.liquid.ai/lfm/models/decision-models).

## What the demo shows

### Configurable D1 workbench

The main workbench lets a user configure:

- A decision model exposed by the Liquid model registry
- Text or structured JSON state
- A typed decision question
- The allowed criteria or outcomes
- Optional images when the selected decision model supports vision input

The supported decision contracts are:

- **Choice** — select one outcome from a bounded set
- **Score** — rate the state against ordered levels
- **Noul** — return a probabilistic yes/no decision

The UI presents the decision and full structured response rather than turning it into generated narrative. A clear event log records local request and response activity for demonstration and debugging.

### Transaction Pulse

Transaction Pulse sends the same synthetic financial-operations case and the same three routing options to:

- Liquid D1 through the native System One endpoint
- TypeSafe JEV 1.13 through OpenRouter

The models choose between normal processing, step-up verification, and human review. The page exposes agreement, probabilities, latency, usage, and raw payloads.

This is an API and product-behavior comparison. A single case is not an accuracy benchmark, and the output is queue triage—not a final fraud determination or payment decision.

## How D1 is used

The server sends three elements to the decision API:

```text
state + typed question + permitted criteria
                       ↓
            structured probabilities
                       ↓
              bounded decision
```

Unlike a conventional generative model flow, the demo does not ask a chat model to write an answer and then parse that prose. The System One response directly represents the configured decision contract.

## Current routes

- `/` — configurable decision workbench
- `/demos/financial-services/transaction-pulse` — D1 and pinned JEV comparison
- `/demos` — industry-demo catalog and future concepts

The accompanying [`roadmap.md`](./roadmap.md) tracks proposed demos. Concepts marked as planned, designed, or placeholder are not implemented product capabilities.

## Architecture

```text
Browser
  │
  │ state, question, criteria, optional images
  ▼
Local server routes
  │
  ├── Liquid System One API
  └── OpenRouter decision API (comparison demo only)

Credentials remain on the server and are never returned to browser code.
```

The web application lives in `webapp/` and uses Next.js-compatible Vinext, React, and TypeScript. API routes proxy authorized model requests so credentials do not enter the client bundle.

## Local setup

Requirements:

- Node.js 22 or newer
- Authorized Liquid API access
- An OpenRouter key only if using Transaction Pulse

Create the local environment file:

```bash
cp .env.example .env
```

Configure the required credential and the optional comparison credential:

```dotenv
LIQUID_API_KEY=your_liquid_key
OPENROUTER_API_KEY=your_openrouter_key
OPENROUTER_JEV_MODEL=typesafe/jev-1.13
```

Install and start the application:

```bash
cd webapp
npm ci
npm run dev
```

Open `http://localhost:5173`.

## Safety and evaluation boundaries

- All included presets are synthetic demonstration cases.
- Model outputs are advisory and require an appropriate human owner in consequential workflows.
- The workbench does not transmit spacecraft commands, approve payments, diagnose patients, or take other real-world actions.
- Choice probabilities are useful for inspection, but they are not proof of real-world calibration without a representative labeled evaluation set.
- Comparisons should use identical state, instructions, criteria, and pinned model versions.
- Customer, financial, healthcare, classified, or otherwise sensitive data must not be submitted without explicit authorization.

## Security

The following local materials are deliberately excluded from Git:

- `.env` files and API credentials
- Local API reference documents
- Local key files
- Dependencies, build artifacts, and runtime state

Use `.env.example` only as a variable-name template. Never place real credentials in it.

## License

The demo source code is available under the [MIT License](./LICENSE). Model access, credentials, API documentation, model artifacts, and third-party services are not included in that license.
