# Liquid Decision Workbench

A local demonstration interface for testing Liquid decision models through the System One API. It supports text/JSON decisions with `choice`, `score`, and `noul` outputs, plus image-based testing for compatible vision-language decision models.

## Important

This repository is private and currently targets unreleased model capabilities. Do not publish model identifiers, API behavior, outputs, screenshots, or access details without authorization from Liquid AI.

The source code is MIT-licensed. Model access, credentials, private API documentation, and model artifacts are not included in that license or in this repository.

## Features

- Configurable text or structured-JSON input
- `choice`, `score`, and `noul` decision rules
- Model-specific text and vision presets
- Multi-image input for compatible VL decision models
- Structured probabilities, confidence, latency, usage, and raw responses
- Clear local event log
- Server-side credential handling so the API key never reaches browser code

## Local setup

Requirements: Node.js 22 or newer and authorized Liquid API access.

```bash
cp .env.example .env
```

Add your credential to `.env`:

```dotenv
LIQUID_API_KEY=your_key_here
```

Then start the app:

```bash
cd webapp
npm ci
npm run dev
```

Open `http://localhost:5173`.

## Security

- Never commit `.env` or API keys.
- Rotate any credential shared through chat, logs, screenshots, or another communication channel.
- Avoid uploading sensitive customer, financial, healthcare, or proprietary images unless their transmission to the API is explicitly approved.
- Keep the repository private while it contains references to unreleased models.
