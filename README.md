# Vision-to-Workflow UI Navigator

**Google Gemini Live Agent Challenge** — Demo-ready submission

## What It Does

1. **Voice Goal Input** — User speaks a workflow goal (e.g., "Find a product under $50, add to cart, apply coupon, checkout in guest mode")
2. **Screen Understanding** — Captures screen, uses Gemini Vision to analyze UI elements
3. **Plan & Annotate** — Shows proposed actions with bounding box overlays + audio summary
4. **Execute** — Runs step-by-step via Playwright with real-time highlighting
5. **Artifacts** — Generates:
   - Annotated summary screenshot
   - Replayable Playwright script
   - Execution run logs

## Tech Stack

- **Frontend**: React + Vite + TypeScript
- **AI/Vision**: Gemini 2.0 Flash (vision + planning)
- **Automation**: Playwright (execution + script generation)
- **Voice**: Web Speech API (STT) + Google TTS
- **UI**: Tailwind CSS, bounding box overlays

## Quick Start

```bash
npm install
npm run dev
```

## Demo Flow

1. Open http://localhost:5173
2. Click "Start Demo" to load sample e-commerce site in iframe
3. Speak or type: "Find a product under $50, add to cart, apply coupon SAVE20, checkout as guest"
4. Watch agent:
   - Analyze screen with Gemini
   - Show bounding boxes + plan
   - Execute actions step-by-step
   - Generate artifacts

## Project Structure

```
/src
  /components
    - AgentView.tsx       # Main agent interface
    - ScreenCapture.tsx   # Screen/iframe capture
    - BoundingBox.tsx     # Visual overlays
    - ArtifactPanel.tsx  # Generated artifacts
  /lib
    - gemini.ts           # Gemini Vision API
    - playwright runner.ts # Execution engine
    - speech.ts           # Voice I/O
  /types
    - index.ts
```

## Why It Wins

- ✅ **Visual Precision** — Not blind clicking; sees and validates targets
- ✅ **Grounded Execution** — Every action mapped to screen elements
- ✅ **Demo-Ready** — 4-minute friendly flow with cool artifacts
- ✅ **Production-Ready Code** — Playwright scripts are actually reusable
