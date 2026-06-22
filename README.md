# AI Productivity Suite

A modern, AI-powered productivity web application that combines a **Smart Email Generator**, **Meeting Note Summarizer**, and **AI Task Planner** into a single seamless platform. Built with TanStack Start, React 19, Tailwind CSS, and Lovable Cloud.

## Features

- **Smart Email Generator** — Turn bullet points, context, and tone preferences into polished, ready-to-send professional emails.
- **Meeting Note Summarizer** — Convert raw meeting notes into structured summaries with action items, decisions, and deadlines.
- **AI Task Planner** — Generate prioritized, time-blocked task plans from goals and constraints.
- **Modern Dashboard** — View usage stats, recent activity, and quick-start shortcuts at a glance.
- **Cloud History** — Every generation is saved to your account so you can review, edit, and reuse past outputs.
- **Export Options** — Copy to clipboard, download as **PDF**, **TXT**, or **DOCX**.
- **Responsive SaaS UI** — Linear-style dark interface that works on desktop, tablet, and mobile.
- **Authentication** — Secure user accounts powered by Lovable Cloud.

## Tech Stack

- **Framework:** [TanStack Start](https://tanstack.com/start) (full-stack React framework with SSR/SSG)
- **Frontend:** React 19, TanStack Router, TanStack Query
- **Styling:** Tailwind CSS v4, shadcn/ui components
- **Backend:** Lovable Cloud (Supabase) — auth, database, storage
- **AI:** Lovable AI Gateway (`ai`, `@ai-sdk/openai-compatible`)
- **Document Exports:** `jspdf` (PDF), `docx` (DOCX), native Blob download (TXT)
- **Build Tool:** Vite 8
- **Language:** TypeScript 5 with strict mode

## Project Structure

```text
src/
  components/          # Reusable UI components (shadcn + custom)
  components/ui/       # shadcn/ui primitive components
  hooks/               # Custom React hooks
  integrations/        # Lovable Cloud / Supabase clients and auth
  lib/                 # Business logic, AI gateway, exports, formatting
  routes/              # TanStack Start file-based routes
  router.tsx           # Router configuration
  start.ts             # TanStack Start instance setup
  styles.css           # Global styles and Tailwind theme tokens
  server.ts            # Server entry
public/                # Static assets
supabase/
  config.toml          # Supabase local config
  migrations/          # Database migrations
```

## Available Scripts

```bash
# Start the dev server
bun dev

# Build for production
bun run build

# Build in development mode
bun run build:dev

# Preview the production build
bun run preview

# Lint the codebase
bun run lint

# Format with Prettier
bun run format
```

## Getting Started

1. **Install dependencies**

   ```bash
   bun install
   ```

2. **Environment variables**

   The project uses Lovable-managed environment variables for Supabase/Cloud:

   ```env
   VITE_SUPABASE_URL=
   VITE_SUPABASE_PUBLISHABLE_KEY=
   ```

   These are injected automatically in Lovable Cloud environments.

3. **Run the development server**

   ```bash
   bun dev
   ```

   The app runs locally (typically on `http://localhost:8080`).

## Core Routes

| Route           | Description                              |
| --------------- | ---------------------------------------- |
| `/`             | Redirects to `/dashboard`                |
| `/auth`         | Sign-in / sign-up page                   |
| `/dashboard`    | Overview stats and recent activity       |
| `/email`        | Smart Email Generator                    |
| `/summarizer`   | Meeting Note Summarizer                  |
| `/planner`      | AI Task Planner                          |
| `/history`      | Saved records with search and filters    |
| `/settings`     | Account preferences and responsible AI   |

## AI & Prompting

Structured prompts guide the LLM to produce consistent, high-quality output:

- **Email:** role, recipient, purpose, tone, key points, optional CTA.
- **Summary:** notes, output style (bullets/paragraph), include action items/decisions.
- **Planner:** goal, available hours, deadline, priority, constraints.

All AI calls are routed through `src/lib/ai-gateway.server.ts` using the Lovable AI Gateway.

## Exports

Generated outputs can be exported in multiple formats from the output toolbar:

- **Copy** — one-click clipboard copy
- **PDF** — rendered with `jspdf`
- **DOCX** — generated with `docx`
- **TXT** — plain text download

## Database

The app stores generated items in a `public.items` table with Row Level Security (RLS) enabled. Each user can only read and manage their own records. Authentication is handled by Lovable Cloud.

## Responsible AI

- Outputs are clearly labeled as AI-generated.
- Users must review and edit all content before professional, legal, financial, medical, or business use.
- History is editable so users can correct and refine AI outputs.

## License

This project is provided as-is for the AI Productivity Suite build. See `AGENTS.md` for contributor guidelines.
