# TALVIORA TECH: AI Career Intelligence Platform

> **Implementation status:** This README and the bundled QA/security reports are archived source material, not current test evidence. The workbook/checklist explicitly leaves feature definitions 12–18 pending, while this README supplies conflicting names for them. The app keeps those entries as unconfirmed scaffolds. See [`docs/IMPLEMENTATION_AUDIT.md`](docs/IMPLEMENTATION_AUDIT.md) for the current verified state.

[![Next.js](https://img.shields.io/badge/Next.js-15.1.0-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-blue?logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4.0.0-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.0-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%26%20Auth-3ecf8e?logo=supabase)](https://supabase.com/)
[![Google Gemini](https://img.shields.io/badge/AI-Google%20Gemini-orange?logo=google)](https://ai.google.dev/)

An advanced, research-oriented AI Career Intelligence Platform designed to transform technology education, skill evaluation, and career progression. TALVIORA TECH combines sophisticated analytics, AI-driven mentorship, interactive simulation, algorithmic mastery tracking, and portfolio verification into a unified ecosystem.

---

## Table of Contents

1. [Executive Overview & Pedagogical Model](#executive-overview--pedagogical-model)
2. [Brand Identity & Design System](#brand-identity--design-system)
3. [Core Feature Architecture (31 Features)](#core-feature-architecture-31-features)
4. [Technology Stack](#technology-stack)
5. [Project Directory Structure](#project-directory-structure)
6. [Prerequisites & Installation](#prerequisites--installation)
7. [Environment Configuration](#environment-configuration)
8. [Running in Development & Production](#running-in-development--production)
9. [API Architecture & Endpoints](#api-architecture--endpoints)
10. [Database & External Services Setup](#database--external-services-setup)
11. [Security & Compliance](#security--compliance)

---

## Executive Overview & Pedagogical Model

TALVIORA TECH rejects shallow AI chatbots and static course catalogs in favor of an **Active Career Mastery Framework**. The platform guides learners and engineers through an iterative 6-stage lifecycle:

```
[ Discover ] ──► [ Understand ] ──► [ Practise ] ──► [ Build ] ──► [ Prove ] ──► [ Apply ]
```

1. **Discover**: Baseline diagnostic assessment across 6 core tech domains (Frontend, Backend, AI/ML, DevOps, Systems, Data).
2. **Understand**: Live market wage intelligence, demand forecasting, and skill-gap delta calculation.
3. **Practise**: Curated topic catalogue, live code execution, and algorithmic problem tracking with spaced repetition.
4. **Build**: Guided project blueprints, interactive Kanban sprint planner, and production architecture guides.
5. **Prove**: Realistic AI interview simulations (Behavioral, Technical, System Design) and verified proof-of-work portfolio generation.
6. **Apply**: Automated resume scoring, targeted job opportunity matching, and tailored application strategies.

---

## Brand Identity & Design System

### Aesthetic Philosophy
- **Modern European Coffee-House Palette**: Warm, intellectual, welcoming, and luxurious without pretension.
- **Glassmorphism with Restraint**: Subtle translucent backdrops with frosted acrylic borders (`rgba(200, 179, 154, 0.2)`).
- **Refined Editorial Typography**: DM Serif Display / Cormorant Garamond headings paired with Inter / Manrope sans-serif body copy and JetBrains Mono code blocks.
- **Accessibility**: Light and dark themes and several visible focus styles are present; full-site WCAG conformance has not been audited.

### Official Brand Palette Tokens

| Token Name | Hex Code | Purpose |
| :--- | :--- | :--- |
| **Warm Ivory** | `#FFF9F0` | Primary bright background, card base in light mode |
| **Crème Latte** | `#F5EBDD` | Secondary neutral surface, page canvas |
| **Velvet Beige** | `#C8B39A` | Subtle dividers, card accents, borders |
| **Cocoa Sand** | `#B59A83` | Muted labels, secondary interactive controls |
| **Soft Olive** | `#96977A` | Positive statuses, healthy metrics, success badges |
| **Mauve Madness** | `#A77C91` | Secondary chart series, topic tags, indicators |
| **Dusty Rose** | `#C58F98` | Highlights, active navigation states, callouts |
| **Flowering Chestnut** | `#8D514B` | Warnings, intermediate metric tiers |
| **Burgundy** | `#6F1737` | Primary brand accent, headings, critical CTAs |
| **Decadent Chocolate**| `#3B2527` | Dark mode panel surfaces, card contrast layers |
| **Deep Espresso** | `#241A1A` | Dark mode background, primary high-contrast text |

---

## Core Feature Architecture (31 Features)

All 31 features are tracked in [`docs/FEATURE_CHECKLIST.md`](docs/FEATURE_CHECKLIST.md) and mapped to active routes:

| Feature # | Feature Name | Route / Page | Purpose & Scope |
| :---: | :--- | :--- | :--- |
| **01** | Landing & Hero Ecosystem | `/welcome` | Value proposition, pedagogical loop showcase, entry CTAs |
| **02** | Interactive User Onboarding | `/welcome` & `/assessment` | Career ambition selection, baseline profile initialization |
| **03** | Diagnostic Skill Assessment | `/assessment` | Multi-category diagnostic quiz with real-time scoring |
| **04** | Assessment Results & Radar | `/results` | 6-axis SVG radar chart, domain breakdown, readiness tier |
| **05** | Role Matching Engine | `/career-match` | Compatibility scoring for SWE, AI Engineer, DevOps, etc. |
| **06** | Skill Gap Delta Visualizer | `/skill-gap` | Role requirement vs. user skill delta analysis |
| **07** | Live Tech Market Intelligence | `/market` | Real-time salaries, hiring trends, hot vs. declining skills |
| **08** | Dynamic Career Roadmaps | `/roadmap` | Milestones, weekly deliverables, prerequisite chains |
| **09** | Topic Catalogue & Syllabus | `/catalogue` | Structured computer science & engineering curricula |
| **10** | Interactive Learning Studio | `/learning` | Multi-lesson reader, in-browser code runner, note taking |
| **11** | Algorithmic DSA Tracker | `/dsa-tracker` | LeetCode/NeetCode style tracker with confidence levels |
| **12** | Production Project Blueprints| `/ai-blueprint` | Architectural specs, tech stacks, component breakdowns |
| **13** | Guided Project Sandbox | `/projects` | Production project guides with step-by-step milestones |
| **14** | Kanban Sprint Planner | `/sprint-planner` | Drag-and-drop task workflow (Backlog, In Progress, Done) |
| **15** | Verified Portfolio Builder | `/portfolio` | Live preview showcase of projects, skills, and credentials |
| **16** | AI Voice & Chat Career Mentor | `/mentor` | Context-aware AI advisory powered by Google Gemini |
| **17** | Interview Simulator | `/simulator` | Mock interviews (Technical, Behavioral, System Design) |
| **18** | Resume ATS Intelligence | `/resume` | Section-by-section ATS scoring and bullet optimizer |
| **19** | Career Readiness Index | `/readiness` | Composite readiness score (0–100%) with actionable tips |
| **20** | Curated Job Board | `/opportunities` | Filterable opportunities with match scores and direct apply |
| **21** | Platform Analytics & Velocity | `/analytics` | Study hour velocity, completion rates, skill heatmaps |
| **22** | Resource Bookmarks | `/bookmarks` | Saved roadmaps, problems, blueprints, and articles |
| **23** | User Profile & Preferences | `/profile` | Experience level, target roles, notification preferences |
| **24** | Central Intelligence Dashboard| `/` (`/dashboard`) | High-level KPI cards, recent activity, roadmap progress |
| **25** | Global Command Palette | `Ctrl+K` / `Cmd+K` | Quick navigation across all pages and actions |
| **26** | Adaptive Dark/Light Mode | Global Component | Persistent theme switching using European Coffee palette |
| **27** | Authentication & RBAC | `/auth` | Supabase Auth (Sign Up, Sign In, Social, Password Reset) |
| **28** | Terms of Service | `/terms` | Platform legal agreement, acceptable use, disclaimers |
| **29** | Privacy Policy | `/privacy` | Data governance, telemetry, user rights transparency |
| **30** | Accessibility Statement | `/accessibility` | WCAG 2.1 AA compliance standards, keyboard accessibility |
| **31** | System Architecture Guide | `/architecture` | Detailed full-stack architecture diagram and data flows |

---

## Technology Stack

- **Framework**: [Next.js 15.1.0](https://nextjs.org/) (React 19, App Router, React Server Components & Client Components)
- **Styling**: [Tailwind CSS v4.0.0](https://tailwindcss.com/) with PostCSS
- **Icons**: [Lucide React](https://lucide.dev/)
- **AI Core**: [Google GenAI SDK (`@google/genai`)](https://ai.google.dev/gemini-api/docs/libraries) with a configurable Gemini model. Current text model default: `gemini-3.8-flash`.
- **Database & Auth**: [Supabase JS Client (`@supabase/supabase-js`)](https://supabase.com/docs/reference/javascript/introduction) (PostgreSQL, Row Level Security)
- **Type Safety**: [TypeScript 5.7](https://www.typescriptlang.org/) with strict mode

---

## Project Directory Structure

```
├── app/                              # Next.js 15 App Router Routes
│   ├── accessibility/page.tsx        # Feature 30: Accessibility Statement
│   ├── ai-blueprint/page.tsx         # Feature 12: Production Project Blueprints
│   ├── analytics/page.tsx            # Feature 21: Velocity & Activity Analytics
│   ├── api/                          # REST API Handlers
│   │   ├── assessment/route.ts       # Diagnostic quiz scoring & persistence
│   │   ├── interview/route.ts        # Gemini AI mock interview logic
│   │   ├── market/route.ts           # Tech compensation & trend intelligence
│   │   ├── portfolio/route.ts        # Proof-of-work portfolio export
│   │   ├── profile/route.ts          # User profile state & preferences
│   │   ├── projects/route.ts         # Project blueprint repository
│   │   └── roadmap/route.ts          # Personalized milestone generation
│   ├── architecture/page.tsx         # Feature 31: Platform Architecture Guide
│   ├── assessment/page.tsx           # Feature 03: Diagnostic Skill Assessment
│   ├── auth/page.tsx                 # Feature 27: Supabase Authentication
│   ├── bookmarks/page.tsx            # Feature 22: Resource Bookmarks
│   ├── career-match/page.tsx         # Feature 05: Role Matching Engine
│   ├── catalogue/page.tsx            # Feature 09: Topic Syllabus & Catalog
│   ├── dashboard/page.tsx            # Feature 24: Dashboard Alias
│   ├── dsa-tracker/page.tsx          # Feature 11: Algorithmic DSA Tracker
│   ├── learning/page.tsx             # Feature 10: Interactive Learning Studio
│   ├── market/page.tsx               # Feature 07: Live Tech Market Intelligence
│   ├── mentor/page.tsx               # Feature 16: AI Career Mentor Chat
│   ├── opportunities/page.tsx        # Feature 20: Curated Job Opportunities
│   ├── portfolio/page.tsx            # Feature 15: Verified Portfolio Builder
│   ├── privacy/page.tsx              # Feature 29: Privacy Policy
│   ├── profile/page.tsx              # Feature 23: Profile Management
│   ├── projects/page.tsx             # Feature 13: Guided Project Sandbox
│   ├── readiness/page.tsx            # Feature 19: Career Readiness Index
│   ├── results/page.tsx              # Feature 04: Assessment Radar Results
│   ├── resume/page.tsx               # Feature 18: Resume ATS Intelligence
│   ├── roadmap/page.tsx              # Feature 08: Dynamic Career Roadmaps
│   ├── simulator/page.tsx            # Feature 17: Interview Simulator
│   ├── skill-gap/page.tsx            # Feature 06: Skill Gap Visualizer
│   ├── sprint-planner/page.tsx       # Feature 14: Kanban Sprint Planner
│   ├── terms/page.tsx                # Feature 28: Terms of Service
│   ├── welcome/page.tsx              # Feature 01 & 02: Landing & Onboarding
│   ├── globals.css                   # Global Tailwind CSS styles & coffee tokens
│   ├── layout.tsx                    # Root HTML layout with Navigation & Footer
│   └── page.tsx                      # Feature 24: Central Dashboard (Home)
├── components/                       # Reusable UI & Visualization Components
│   ├── BarChart.tsx                  # Accessible CSS/SVG Bar Chart
│   ├── Breadcrumbs.tsx               # Structured navigation breadcrumbs
│   ├── CommandPalette.tsx            # Global Ctrl+K Command Palette
│   ├── Footer.tsx                    # Platform footer with legal links
│   ├── Navbar.tsx                    # Top navigation with status and search
│   ├── RadarChart.tsx                # 6-Axis SVG skill radar chart
│   ├── Sidebar.tsx                   # Collapsible navigation drawer
│   ├── StatCard.tsx                  # Standard KPI metric card
│   └── ThemeToggle.tsx               # Light/Dark mode toggler
├── docs/                             # Project Documentation & Trackers
│   ├── FEATURE_CHECKLIST.md          # 31-Feature status, routes, and testing
│   ├── TALVIORA_TECH_31_Feature_Progress_Tracker.xlsx # Master Excel Tracker
│   └── TALVIORA_TECH_31_Feature_Progress_Tracker.xlsx.xlsx
├── lib/                              # Core Utilities, AI & Database Clients
│   ├── career-data.ts                # Curriculum datasets, roadmaps, questions
│   ├── gemini.ts                     # Google Gemini AI SDK client & helpers
│   ├── supabase.ts                   # Supabase PostgreSQL client & auth helpers
│   └── types.ts                      # Shared TypeScript models and interfaces
├── .env.example                      # Template for environment credentials
├── .gitignore                        # Git exclusion rules
├── next.config.mjs                   # Next.js configuration
├── package.json                      # Dependencies and npm scripts
├── postcss.config.mjs                # PostCSS configuration
└── tsconfig.json                     # TypeScript compiler configuration
```

---

## Prerequisites & Installation

### System Requirements
- **Node.js**: `v18.18.0` or later (`v20.x` LTS recommended)
- **Package Manager**: `npm` (v9+), `pnpm`, or `yarn`
- **Git** (optional, for version control)

### Step 1: Extract or Clone the Project
If working from the exported ZIP archive:
```bash
# Unzip the archive into your target directory
tar -xf TALVIORA_TECH_COMPLETE_SOURCE_CODE.zip
# or using Windows PowerShell:
# Expand-Archive -Path "TALVIORA_TECH_COMPLETE_SOURCE_CODE.zip" -DestinationPath "TALVIORA_TECH"
cd TALVIORA_TECH
```

### Step 2: Install Node Dependencies
```bash
npm install
```

---

## Environment Configuration

Create a local environment file by copying `.env.example`:

```bash
cp .env.example .env.local
```

Open `.env.local` in your editor and configure the credentials:

```ini
# Supabase Configuration (Database & Authentication)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Google Gemini API Key (AI Mentor & Interview Simulator)
GEMINI_API_KEY=your_gemini_api_key_here

# Application Base URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **Security Notice**: Never commit `.env` or `.env.local` to GitHub. The project's `.gitignore` automatically prevents sensitive files from being tracked.

---

## Running in Development & Production

### Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser. The app runs with full Fast Refresh enabled.

### Build for Production
```bash
npm run build
```
This generates an optimized static and server-rendered production build in the `.next` folder.

### Run Production Server
```bash
npm run start
```

---

## API Architecture & Endpoints

All endpoints are built using Next.js 15 Route Handlers:

- **`POST /api/assessment`**: Accepts user assessment answers, evaluates domain proficiencies, and saves results.
- **`POST /api/interview`**: Connects to the Google Gemini model to conduct dynamic, responsive technical/behavioral interview turns.
- **`GET /api/market`**: Returns real-time salary metrics, top in-demand skills, and growth trends across tech disciplines.
- **`GET /api/projects`**: Retrieves production blueprints, architectural milestones, and skill tags.
- **`POST /api/roadmap`**: Generates a custom weekly milestone path tailored to target roles and diagnostic scores.
- **`GET /api/profile` & `POST /api/profile`**: Manages user career profiles, skill records, and preferences in Supabase.
- **`POST /api/portfolio`**: Packages verified user credentials and projects into an exportable portfolio structure.

---

## Database & External Services Setup

### 1. Setting up Supabase
1. Create a free project at [supabase.com](https://supabase.com).
2. Under **Project Settings > API**, copy the `Project URL` and `anon public` key.
3. Paste them into `.env.local` as `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. (Optional) Run user authentication via the built-in Supabase Auth provider on `/auth`.

### 2. Setting up Google Gemini AI
1. Visit [Google AI Studio](https://aistudio.google.com/) and generate an API key.
2. Add the key to `.env.local` as `GEMINI_API_KEY`.
3. The platform uses this key for the **AI Mentor** (`/mentor`) and **Interview Simulator** (`/simulator`).
4. *Graceful Fallback*: If the API key is not configured, the platform displays an informative status banner and supplies high-fidelity offline simulated responses so testing remains uninterrupted.

---

## Security & Compliance

- **Secrets Handling**: Zero credentials are baked into client bundles or source files.
- **Client/Server Boundary**: Server-only operations (Gemini API calls, secure DB operations) are isolated within Next.js Route Handlers.
- **Accessibility**: High-contrast ratios, focus rings, ARIA roles, and screen-reader support audited on all interactive routes.
- **Data Privacy**: Full transparency provided in the built-in [Privacy Policy](/privacy) and [Terms of Service](/terms).

---

*Developed for TALVIORA TECH: AI Career Intelligence Platform.*
