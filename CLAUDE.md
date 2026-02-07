# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Gym Tracker (GRIT)** — A gym workout tracking web app with AI-powered progressive overload objectives. Users log workouts and an AI agent (Gemini via CopilotKit) suggests weight/rep targets based on real progress.

The app is in early development (SLC/MVP strategy). The Supabase schema is deployed but most features are still pending implementation.

## Commands

```bash
pnpm dev          # Start dev server (localhost:3000)
pnpm build        # Production build
pnpm lint         # ESLint (Next.js core-web-vitals + typescript rules)

# Add shadcn components
pnpm dlx shadcn@latest add [component-name]

# Generate Supabase types (replace PROJECT_ID)
npx supabase gen types typescript --project-id PROJECT_ID > types/database.types.ts
```

## Tech Stack

- **Framework:** Next.js 16 (App Router, React 19, TypeScript)
- **Package manager:** pnpm
- **Styling:** Tailwind CSS v4 + shadcn/ui (new-york style, zinc base, CSS variables)
- **Backend/Auth:** Supabase (PostgreSQL + Auth with magic links via OTP)
- **AI:** Google Gemini (via `@google/generative-ai`) + CopilotKit (`@copilotkit/react-core`, `@copilotkit/react-ui`, `@copilotkit/runtime`)
- **Forms:** react-hook-form + zod
- **Path alias:** `@/*` maps to project root

## Architecture

### Authentication Flow
- Supabase Auth with **magic link (OTP)** — no passwords
- `middleware.ts` enforces auth: unauthenticated users are redirected from `/dashboard` to `/login`, authenticated users are redirected from `/login` to `/dashboard`
- Auth callback goes to `/auth/callback`
- Supabase clients: `lib/supabase.ts` (browser), `lib/supabase-server.ts` (server)
- RLS enabled on all tables; auto-profile creation via trigger

### CopilotKit + Gemini Integration
- API endpoint at `app/api/copilotkit/route.ts` — connects CopilotKit runtime with Gemini adapter
- `CopilotProvider` wraps the app in root layout
- IA uses `useCopilotAction` for executing functions (create routines, log sets, adjust targets)
- IA reads context via `useCopilotReadable` (current routine, last workout, progress, preferences)
- Key actions: `createRoutine`, `adjustTargets`, `analyzeProgress`, `logWorkoutSet`, `adjustRestTime`, `generateProgressChart`, `generateInsight`

### Progressive Overload Logic
Supabase function `calculate_next_target(exercise_id)` analyzes last 3 sessions:
- RIR avg ≥ 3 + completion ≥ 90% → +2.5kg
- RIR avg ≥ 2 + completion ≥ 85% → +1.25kg
- RIR avg ≥ 1 + completion ≥ 75% → maintain
- Otherwise → -10% (deload)

### Database Tables
Core tables: `profiles`, `routines`, `routine_days`, `exercises` (with target fields for AI objectives), `workout_sessions`, `workout_logs`, `exercise_targets_history` (tracks who set target: ai/user + reasoning).

### Key Screens (planned)
1. **Login/Signup** — magic link auth (partially implemented at `app/login/page.tsx`)
2. **Onboarding** — CopilotChat to create routine via conversation + live preview
3. **Rutinas (Home)** — day cards with AI context
4. **Workout Activo** — exercise logging with floating AI assistant
5. **Celebración** — post-workout AI analysis + next objectives
6. **Stats** — calendar + charts with AI narrative insights
7. **Perfil** — settings + personal AI chat

### Project Structure Conventions
- `components/ui/` — shadcn primitives (auto-generated, don't edit manually)
- `components/copilot/` — CopilotKit wrappers (CopilotProvider, AIAssistant)
- `components/features/` — feature-specific components grouped by screen
- `lib/` — Supabase clients, Gemini client, utilities
- `hooks/` — custom React hooks (useWorkout, useTargets, useAuth, useCopilotActions)
- `types/` — TypeScript types including generated `database.types.ts`
- `utils/` — pure helpers (progressionCalculator, aiPrompts, dateHelpers)

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
GEMINI_API_KEY
COPILOT_CLOUD_API_KEY          # optional
NEXT_PUBLIC_APP_URL             # defaults to http://localhost:3000
```

## Language

The app UI and code comments are in **Spanish**. Keep this convention.
