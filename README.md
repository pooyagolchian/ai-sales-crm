# AI Sales CRM — Notion MCP Challenge

An AI-powered Sales CRM where **Notion is the sole data layer** and **Google Gemini 2.5 Flash** acts as an autonomous sales assistant. The AI agent decides which Notion MCP tools to call at runtime — no hardcoded API calls.

Built for the [Notion MCP Challenge](https://dev.to/challenges/notion-2026-03-04).

## Features

- **AI Sales Assistant** — Chat with your CRM using natural language. The AI autonomously queries, creates, and updates records in Notion via MCP tools.
- **Pipeline Kanban Board** — Drag-and-drop deals between stages (Lead → Qualified → Proposal → Negotiation → Closed Won/Lost). Changes sync to Notion in real-time.
- **AI Lead Scoring** — AI analyzes contacts and assigns a 0-100 score with reasoning, written back to Notion.
- **Pre-Call Briefing** — AI generates structured talking points, objections, and relationship history for any deal.
- **Email Ghostwriter** — AI drafts personalized sales emails based on deal context and stage.
- **Live Dashboard** — Pipeline metrics, win rate, top deals, recent activity — all from Notion.

## Architecture

```
Browser → Next.js 15 (App Router)
            ↓ API routes (Node.js runtime)
     MCP Client (SDK) ←→ Notion MCP Server (HTTP, :3001)
            ↓ mcpToTool()
       Gemini 2.5 Flash (autonomous tool selection)
```

The key innovation: `mcpToTool()` from `@google/genai` exposes all 22 Notion MCP tools to Gemini as function declarations. Gemini decides at runtime which tools to call based on the user's request — querying databases, creating pages, updating fields — without any hardcoded logic.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router), TypeScript (strict) |
| UI | Tailwind CSS v4, shadcn/ui, Lucide icons |
| AI | Google Gemini 2.5 Flash via `@google/genai` |
| Data | Notion (4 databases) via MCP protocol |
| MCP | `@notionhq/notion-mcp-server` (HTTP mode) + `@modelcontextprotocol/sdk` |
| DnD | `@dnd-kit/core` + `@dnd-kit/sortable` |
| Linting | Biome |

## Notion Databases

| Database | Key Fields |
|----------|-----------|
| **Contacts** | Name, Email, Company, Role, Lead Score, Source |
| **Deals** | Name, Contact (relation), Stage, Value, Close Date, Priority, Next Action |
| **Activities** | Type, Date, Deal (relation), Summary, Raw Notes |
| **Companies** | Name, Industry, Size, Website |

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- A [Notion Integration](https://developers.notion.com/) with access to your workspace
- A [Google Gemini API key](https://aistudio.google.com/apikey)

### Setup

1. Clone the repo:
   ```bash
   git clone https://github.com/YOUR_USERNAME/ai-sales-crm.git
   cd ai-sales-crm
   pnpm install
   ```

2. Copy the environment file and fill in your keys:
   ```bash
   cp .env.example .env.local
   ```

3. Create 4 Notion databases (Contacts, Deals, Activities, Companies) in your workspace and add their IDs to `.env.local`.

4. Start both the Next.js dev server and the Notion MCP server:
   ```bash
   pnpm dev:all
   ```

5. Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

```
GEMINI_API_KEY=           # Google Gemini API key
NOTION_TOKEN=             # Notion integration token
MCP_SERVER_URL=           # MCP server URL (default: http://localhost:3001/mcp)
NOTION_CONTACTS_DB_ID=    # Contacts database ID
NOTION_DEALS_DB_ID=       # Deals database ID
NOTION_ACTIVITIES_DB_ID=  # Activities database ID
NOTION_COMPANIES_DB_ID=   # Companies database ID
NOTION_CONTACTS_DS_ID=    # Contacts data source ID
NOTION_DEALS_DS_ID=       # Deals data source ID
NOTION_ACTIVITIES_DS_ID=  # Activities data source ID
NOTION_COMPANIES_DS_ID=   # Companies data source ID
```

> **Note:** `DB_ID` (database IDs) are used for creating pages. `DS_ID` (data source IDs) are used for querying. These are different in Notion MCP v2+.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start Next.js dev server |
| `pnpm mcp` | Start Notion MCP server on port 3001 |
| `pnpm dev:all` | Start both concurrently |
| `pnpm build` | Production build |
| `pnpm lint` | Run Biome linter |

## License

MIT
