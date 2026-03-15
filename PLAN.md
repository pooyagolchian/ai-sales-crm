# AI Sales CRM — Notion MCP Challenge 🚀

> **Challenge:** [dev.to/challenges/notion-2026-03-04](https://dev.to/challenges/notion-2026-03-04)  
> **Stack:** Next.js 15 (App Router) · TypeScript · Google Gemini 2.5 Flash · Notion MCP · shadcn/ui

---

## What We're Building

A full CRM powered by Notion as the data layer and Gemini AI as the brain. The showpiece is an **AI Assistant chat** where you can control your entire sales pipeline in natural language — Gemini autonomously calls Notion MCP tools to create contacts, move deals, log activities, and generate reports.

---

## Architecture

```
Browser → Next.js App (App Router)
             ↓ API routes (Node.js runtime)
      MCP Client (SDK) ←→ Notion MCP Server (HTTP mode, :3001)
             ↓ mcpToTool()
        Gemini 2.5 Flash
```

- Notion MCP runs in **HTTP mode** (`--transport http`) — avoids serverless subprocess fragility
- **Module-level MCP client singleton** reuses the connection across requests
- **Gemini `mcpToTool()`** — SDK auto-maps MCP tools → Gemini function declarations and executes the agentic loop
- `export const runtime = 'nodejs'` declared on all API routes

---

## Key Packages

| Package | Purpose |
|---|---|
| `@notionhq/notion-mcp-server` | Notion MCP server (22 tools) |
| `@modelcontextprotocol/sdk` | MCP client (StreamableHTTPClientTransport) |
| `@google/genai` | Gemini 2.5 Flash + mcpToTool() |
| `@dnd-kit/core` | Drag-and-drop on the Kanban board |
| `shadcn/ui` + `tailwindcss` | UI components |

---

## Notion Database Schema

| Database | Key Fields |
|---|---|
| **Contacts** | Name, Email, Company, Role, Lead Score (number), Lead Score Notes (text), Source (select) |
| **Deals** | Name, Contact (relation), Stage (select: 6 stages), Value ($), Close Date, Priority, Next Action |
| **Activities** | Type (call/email/meeting/note), Date, Deal (relation), Summary, Raw Notes |
| **Companies** | Name, Industry, Size, Website |

---

## Implementation Plan

### Phase 1 — Foundation (Day 1 · ~7 hrs)

1. `create-next-app` with TypeScript + Tailwind + App Router
2. `shadcn/ui` init — install Card, Badge, Sheet, Dialog, ScrollArea, Avatar, DropdownMenu
3. `.env.local` setup (`GEMINI_API_KEY`, `NOTION_TOKEN`, `MCP_SERVER_URL`)
4. `lib/mcp-client.ts` — singleton `Client` + `StreamableHTTPClientTransport` with reconnect logic
5. `lib/gemini.ts` — `GoogleGenAI` instance + helper wiring `mcpToTool(client)` to Gemini calls
6. `lib/notion-schema.ts` — all Notion DB IDs and field name constants
7. App shell: sidebar nav (Dashboard, Pipeline, Leads, AI Assistant)
8. `package.json` scripts: `"mcp": "notion-mcp-server --transport http --port 3001"` + `"dev:all": "concurrently ..."` 

### Phase 2 — Pipeline Board (Day 2 · ~7 hrs)

9. TypeScript types: `Contact`, `Deal`, `Activity`
10. `GET /api/deals` → MCP query Deals DB → grouped by stage
11. `GET /api/contacts` → MCP search Contacts DB
12. Kanban board using `@dnd-kit/core` + shadcn Cards in stage columns
13. Deal card: contact name, value, close date, lead score badge, priority color
14. Deal creation modal (Dialog) + stage move on drag → `PATCH /api/deals/[id]` via MCP

### Phase 3 — Lead Intelligence (Day 3 · ~7 hrs)

15. Manual lead capture form → creates Notion contact via MCP
16. **AI Magic lead extraction** — paste any text (LinkedIn bio, email, business card) → Gemini extracts structured lead → auto-fills form → creates Notion contact via MCP
17. **AI Lead Scoring** — Gemini generates 1–100 score + written reasoning → saved to Notion contact's `Lead Score` + `Lead Score Notes` fields
18. Contacts list page, sortable by score; badge colors (🟢 green / 🟡 yellow / 🔴 red)

### Phase 4 — AI Sales Features (Days 4–5 · ~14 hrs)

19. **Pre-call Briefing** — button on deal detail → Gemini fetches deal + contact + all activities from Notion via MCP → returns structured briefing (talking points, known objections, relationship history)
20. **Follow-up Email Generator** — deal context + current stage + last activity → Gemini writes a personalized email
21. **Activity Logger** — paste raw meeting/call notes → Gemini summarizes → creates Activity in Notion, updates deal's `Next Action` field
22. **AI Assistant Chat** ⭐ — persistent sidebar, Gemini wired with `mcpToTool()`. Examples:
    - *"Move the Acme deal to Proposal stage"*
    - *"What deals are at risk of closing this month?"*
    - *"Log a 30-min call with Sarah at Salesforce, we discussed pricing"*
    - *"Create a new deal for Stripe, $80k, high priority"*
23. **Ghostwriter Mode** 🏆 *(differentiating feature)* — one button triggers Gemini to scan for deals with no activity in 7+ days → writes a personalized follow-up email draft → creates a Notion reminder page automatically. No human intervention required. (~2 extra hrs)

### Phase 5 — Dashboard & Polish (Day 6 · ~7 hrs)

23. Dashboard metrics: deals by stage, total pipeline value, win rate, weighted pipeline
24. Deal detail page with activity timeline (newest first)
25. **AI Pipeline Report** — weekly health summary (deals at risk, top opportunities, AI suggestions)
26. Loading skeletons, error boundaries, toast notifications, mobile responsiveness

### Phase 6 — Submission (Day 7 · ~5 hrs)

27. End-to-end smoke test across all features
28. Deploy: **Render.com free tier** (Notion MCP server — free, ~30s cold start is fine for demo) + **Vercel free hobby plan** (Next.js app)
29. `README.md` with architecture diagram, setup steps, feature list, screenshots
30. DEV.to submission post — include architecture explanation, real screenshots, lessons learned
31. Demo screen recording — show Gemini doing a full sales workflow autonomously in 2 minutes

---

## Key Files

| File | Purpose |
|---|---|
| `lib/mcp-client.ts` | MCP singleton client with reconnect logic |
| `lib/gemini.ts` | Gemini + `mcpToTool()` helper |
| `lib/notion-schema.ts` | DB IDs + field name constants |
| `app/api/deals/route.ts` | Deals CRUD via MCP |
| `app/api/ai/chat/route.ts` | Agentic AI assistant endpoint |
| `app/api/ai/score/route.ts` | Lead scoring endpoint |
| `components/kanban/` | Pipeline board components |
| `components/ai-chat/` | AI assistant sidebar |

---

## Time Estimate

| Phase | Days | Hours | With AI Assist |
|---|---|---|---|
| Foundation | Day 1 | 7 hrs | ~2.5 hrs |
| Pipeline Board | Day 2 | 7 hrs | ~3.0 hrs |
| Lead Intelligence | Day 3 | 7 hrs | ~3.5 hrs |
| AI Sales Features | Days 4–5 | 16 hrs | ~8.0 hrs |
| Dashboard + Polish | Day 6 | 7 hrs | ~3.5 hrs |
| Submission | Day 7 | 5 hrs | ~3.0 hrs |
| **Total** | **7 days** | **~49 hrs** | **~23 hrs (~3 days)** |

> +2 hrs added to AI Sales Features for the Ghostwriter Mode feature.

---

## AI Assistance Breakdown

| Step | AI Can Do | Human Required |
|---|---|---|
| Project setup, config, boilerplate | ✅ 90% automated | `.env` values, Notion DB IDs |
| TypeScript types and interfaces | ✅ 95% automated | Schema review |
| API routes (CRUD via MCP) | ✅ 85% automated | Testing against live Notion |
| Kanban UI components | ✅ 80% automated | UX feel, spacing tweaks |
| Gemini + MCP wiring | ✅ 75% automated | Prompt engineering, testing |
| AI feature prompts | ✅ 60% — first draft | Tuning output quality |
| Debugging MCP tool calls | ⚠️ 50% help | Log inspection, Notion schema validation |
| Deployment config | ✅ 80% automated | Environment secrets |
| README + blog post | ✅ 85% automated | Personal voice, demo screenshots |

**Short answer: Yes — AI can accelerate every single step.** The only things that genuinely require human hands are supplying secret values, clicking through Notion's UI to create databases, and recording the demo.

---

## Decisions

- **HTTP transport** over stdio — no subprocess cold start, works on Vercel/Railway
- **`@google/genai`** (not the deprecated `@google/generative-ai`, EOL Aug 2025) + Gemini 2.5 Flash
- **`mcpToTool()`** for zero-boilerplate Gemini-MCP bridge
- **Manual Notion DB setup** on Day 1 — faster to validate schema before coding
- **DnD scope**: stage changes only (no column reordering) to stay on schedule

---

## Verification Checklist

- [ ] `client.listTools()` returns 22 Notion MCP tools
- [ ] Paste a LinkedIn profile → contact appears in Notion with score
- [ ] Drag deal card between stages → Notion DB field updates
- [ ] AI chat: *"Create a deal for Acme, $50k, Proposal stage"* → appears in Notion
- [ ] Pre-call briefing reads real Notion data (not hallucinated)
- [ ] Ghostwriter Mode creates a Notion reminder page for a stale deal
- [ ] App deployed on Vercel (free), MCP server on Render.com (free)
- [ ] Total cost: $0

---

## Winning Tips (from planning)

- **Demo video is the #1 differentiator** — show Gemini doing a full workflow autonomously in under 2 minutes
- **DEV.to post quality matters** — judges read it first; include architecture diagram, screenshots, and what you learned
- **Reliability beats complexity** — a simpler working demo beats a broken feature-rich one
- **Ghostwriter Mode** is the "superpower" the challenge description asks for — lead with it in the post