# AI Sales CRM — Copilot Instructions

## Project Overview

This is an **AI Sales CRM** built for the [Notion MCP Challenge](https://dev.to/challenges/notion-2026-03-04). It uses Notion as the data layer (via MCP protocol) and Google Gemini 2.5 Flash as the AI brain. The app is a Next.js 15 App Router application with TypeScript.

## Tech Stack

- **Framework:** Next.js 15 (App Router) with TypeScript (strict mode)
- **Styling:** Tailwind CSS v4 + shadcn/ui components
- **Linter/Formatter:** Biome (NOT ESLint — do not generate ESLint configs or rules)
- **AI:** Google Gemini 2.5 Flash via `@google/genai` SDK
- **Data Layer:** Notion via MCP protocol (`@notionhq/notion-mcp-server` in HTTP mode)
- **MCP Client:** `@modelcontextprotocol/sdk` with `StreamableHTTPClientTransport`
- **DnD:** `@dnd-kit/core` for Kanban board drag-and-drop

## Architecture Rules

### API Routes
- All API routes MUST use `export const runtime = 'nodejs'` (never Edge — MCP needs Node.js APIs)
- Use the MCP client singleton from `@/lib/mcp-client` — never create new MCP connections per request
- For AI features, use the Gemini helper from `@/lib/gemini` with `mcpToTool()` wiring
- API routes live in `src/app/api/` following Next.js App Router conventions

### MCP Client
- The MCP client is a module-level singleton in `src/lib/mcp-client.ts`
- It uses `StreamableHTTPClientTransport` to connect to the Notion MCP server at `process.env.MCP_SERVER_URL`
- The MCP server exposes 22 Notion tools (search, query DB, create/update pages, etc.)
- Since v2.0.0, database operations use `data_source_id` (not `database_id`) for queries
- **IMPORTANT**: `database_id` and `data_source_id` are DIFFERENT IDs:
  - `NOTION_DB.*` = database IDs → used for `API-post-page` (`parent: { database_id }`)
  - `NOTION_DS.*` = data source IDs → used for `API-query-data-source` (`data_source_id`)
- Always handle reconnection on errors

### Gemini AI
- Use `@google/genai` package (NOT the deprecated `@google/generative-ai`)
- Model: `gemini-2.5-flash`
- For agentic features, use `mcpToTool(mcpClient)` to auto-map MCP tools to Gemini function declarations
- Always validate AI outputs before sending to the client

### Notion Database Schema
- **Contacts DB** (`NOTION_CONTACTS_DB_ID`): Name (title), Email (email), Company (rich_text), Role (rich_text), Lead Score (number), Lead Score Notes (rich_text), Source (select)
- **Deals DB** (`NOTION_DEALS_DB_ID`): Name (title), Contact (relation → Contacts), Stage (select: Lead/Qualified/Proposal/Negotiation/Closed Won/Closed Lost), Value (number), Close Date (date), Priority (select: Low/Medium/High), Next Action (rich_text)
- **Activities DB** (`NOTION_ACTIVITIES_DB_ID`): Type (select: call/email/meeting/note), Date (date), Deal (relation → Deals), Summary (title), Raw Notes (rich_text)
- **Companies DB** (`NOTION_COMPANIES_DB_ID`): Name (title), Industry (select), Size (select), Website (url)

## Code Style Rules

### TypeScript
- Use strict TypeScript — no `any` unless absolutely unavoidable (and add a comment explaining why)
- Prefer `interface` over `type` for object shapes
- Use `const` assertions and discriminated unions where appropriate
- Export types from `@/types/` directory

### React / Next.js
- Default to Server Components — only use `"use client"` when the component needs interactivity (event handlers, hooks, browser APIs)
- Use `async` Server Components for data fetching
- Prefer Server Actions for mutations when possible (over API routes), but use API routes for complex MCP operations
- Use the `Suspense` boundary pattern with loading.tsx files
- Wrap the app with `TooltipProvider` in the root layout

### Styling
- Use Tailwind CSS utility classes exclusively — no inline styles, no CSS modules
- Use shadcn/ui components from `@/components/ui/` — never build custom versions of components that shadcn provides
- Use `cn()` from `@/lib/utils` for conditional class names
- Responsive design: mobile-first with `sm:`, `md:`, `lg:` breakpoints
- Use CSS variables from the shadcn theme (e.g., `text-muted-foreground`, `bg-card`)

### File Organization
```
src/
├── app/                    # Next.js App Router pages and API routes
│   ├── (dashboard)/        # Route group for main app pages
│   │   ├── layout.tsx      # Dashboard layout with sidebar
│   │   ├── page.tsx        # Dashboard home
│   │   ├── pipeline/       # Kanban pipeline board
│   │   ├── leads/          # Contacts/leads list
│   │   └── assistant/      # AI assistant chat page
│   ├── api/                # API routes
│   │   ├── deals/          # Deal CRUD
│   │   ├── contacts/       # Contact CRUD
│   │   ├── activities/     # Activity CRUD
│   │   └── ai/             # AI endpoints (chat, score, briefing)
│   ├── layout.tsx          # Root layout
│   └── globals.css         # Global styles + shadcn theme
├── components/
│   ├── ui/                 # shadcn/ui components (auto-generated)
│   ├── kanban/             # Pipeline board components
│   ├── ai-chat/            # AI assistant chat components
│   └── shared/             # Shared app components (sidebar, nav, etc.)
├── lib/
│   ├── mcp-client.ts       # MCP singleton client
│   ├── gemini.ts           # Gemini AI helper with mcpToTool
│   ├── notion-schema.ts    # Notion DB IDs and field constants
│   └── utils.ts            # shadcn cn() utility
└── types/
    └── index.ts            # All TypeScript types/interfaces
```

### Naming Conventions
- Files: `kebab-case.ts` or `kebab-case.tsx`
- Components: `PascalCase` function names, `kebab-case` file names
- Types/Interfaces: `PascalCase` with descriptive names (e.g., `DealStage`, `ContactWithScore`)
- API routes: RESTful naming (`/api/deals`, `/api/deals/[id]`, `/api/ai/chat`)
- Constants: `UPPER_SNAKE_CASE` for env-derived values, `camelCase` for others

### Error Handling
- API routes: return proper HTTP status codes with `{ error: string }` JSON bodies
- Client components: use `sonner` toast for user-facing errors
- MCP errors: catch and provide meaningful fallback messages
- AI errors: never expose raw AI errors to the user

### Imports
- Use `@/` alias for all internal imports (e.g., `@/lib/mcp-client`, `@/components/ui/button`)
- Biome handles import sorting — imports will be auto-organized
- Prefer named exports over default exports (except for page/layout components)

## Environment Variables

All environment variables are server-side only (never prefixed with `NEXT_PUBLIC_`):

```
GEMINI_API_KEY=           # Google Gemini API key
NOTION_TOKEN=             # Notion integration token (ntn_...)
MCP_SERVER_URL=           # Notion MCP server URL (http://localhost:3001/mcp)
NOTION_CONTACTS_DB_ID=    # Contacts database ID (for creating pages)
NOTION_DEALS_DB_ID=       # Deals database ID
NOTION_ACTIVITIES_DB_ID=  # Activities database ID
NOTION_COMPANIES_DB_ID=   # Companies database ID
NOTION_CONTACTS_DS_ID=    # Contacts data source ID (for querying)
NOTION_DEALS_DS_ID=       # Deals data source ID
NOTION_ACTIVITIES_DS_ID=  # Activities data source ID
NOTION_COMPANIES_DS_ID=   # Companies data source ID
```

## Common Patterns

### Querying Notion via MCP
```typescript
import { getMcpClient } from "@/lib/mcp-client";
import { NOTION_DS } from "@/lib/notion-schema";

const client = await getMcpClient();
const result = await client.callTool({
  name: "API-query-data-source",
  arguments: {
    data_source_id: NOTION_DS.deals,
    filter: { property: "Stage", select: { equals: "Proposal" } },
  },
});
```

### AI with MCP Tools
```typescript
import { generateWithTools } from "@/lib/gemini";

const response = await generateWithTools(
  "List all deals in Proposal stage and summarize their status"
);
```

### shadcn Component Usage
```typescript
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
```
