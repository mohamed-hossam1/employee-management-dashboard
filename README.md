# Employee Management Dashboard

### A production-minded, multi-workspace HR platform — built end-to-end with Angular 22 & Supabase

> **Not a toy CRUD demo.** A full-stack product with real authentication, Postgres + Row Level Security, multi-tenant workspaces, charts, accessibility, and a component system designed like a design system — not a pile of one-off screens.

[![Angular](https://img.shields.io/badge/Angular-22-DD0031?style=for-the-badge&logo=angular&logoColor=white)](https://angular.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20Postgres-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Vitest](https://img.shields.io/badge/Tests-Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev)

**[Live repo](https://github.com/mohamed-hossam1/employee-management-dashboard)** · **Demo login in 1 click** (see below)

---

## Why this project exists

Recruiters and hiring managers see hundreds of “Todo apps” and Material table clones. This project answers a harder question:

> *Can this engineer ship a coherent product — architecture, security, UX, and maintainability — not just a tutorial stack?*

**Employee Management Dashboard** is a multi-project (workspace) system for managing people operations: employees, departments, attendance, analytics, and account settings. It was designed with:

| Signal for hiring teams | How it shows up here |
|-------------------------|----------------------|
| **Product thinking** | Multi-workspace model, role-ready profiles, activity feed, empty states, skeletons |
| **Modern Angular** | Standalone components, signals, lazy routes, functional guards & interceptors |
| **Real backend** | Supabase Auth + Postgres REST — **no mock/in-memory API** |
| **Security awareness** | RLS policies, anon key only in the client, owner-scoped data access |
| **UI craft** | Custom Tailwind design system (no Material bloat), light/dark themes |
| **Engineering process** | Spec-driven delivery (`specs/` phases 001–012), clear domain boundaries |
| **Quality bar** | Accessibility (ARIA, focus), unit tests (Vitest), responsive shell |

---

## Preview

![Employee Management Dashboard UI](./image.png)

*Clean admin shell: project switcher, data tables, filters, pagination, and status badges — built for real HR workflows.*

---

## Try it in under 2 minutes

```bash
git clone https://github.com/mohamed-hossam1/employee-management-dashboard.git
cd employee-management-dashboard
npm install
npm start
```

Open **[http://localhost:4200](http://localhost:4200)** → click **Continue with demo account**.

| | Credentials |
|---|-------------|
| **Email** | `mohamedhossamv8@gmail.com` |
| **Password** | same as email |

The demo account is pre-seeded with projects, departments, employees, and attendance so reviewers can explore the full product without setup friction.

> Prefer your own Supabase project? See [Configuration](#configuration) below.

---

## Product features

| Module | What users can do |
|--------|-------------------|
| **Auth** | Register, login, session restore, logout, password change — plus one-click demo login |
| **Workspaces** | Create, edit, delete, and switch **projects** (multi-tenant style scoping) |
| **Dashboard** | KPI stats, recent hires, activity feed, attendance charts (Chart.js) |
| **Employees** | Full CRUD, filters, detail views, CSV tooling for import/export workflows |
| **Departments** | Card grid, detail pages, manager assignment, headcount context |
| **Attendance** | Check-in / check-out, history filters, monthly report, statistics |
| **Profile** | Name, email, phone, bio, avatar, password |
| **Settings** | Light/dark theme, notification preferences, account export / delete |
| **Shell UX** | Responsive layout, sidebar project switcher, toasts, skeletons, empty states, 404 & unauthorized pages |

---

## Tech stack at a glance

| Layer | Choice | Why it matters |
|-------|--------|----------------|
| **Frontend** | Angular 22 | Latest standalone + signals model — not legacy NgModules |
| **Language** | TypeScript (strict) | Type-safe domain models end-to-end |
| **Styling** | Tailwind CSS v4 + design tokens | Full visual control, lean CSS, light/dark themes |
| **Charts** | Chart.js + ng2-charts | Dashboard & attendance analytics |
| **Backend** | Supabase (Auth + Postgres + PostgREST) | Production-grade BaaS with real security model |
| **State** | Angular signals | Predictable, fine-grained UI updates |
| **HTTP** | `HttpClient` + auth/error interceptors | Clean cross-cutting concerns |
| **Tests** | Vitest | Fast unit coverage on auth & core state |
| **Tooling** | npm 11, Prettier, Angular CLI | Modern, reproducible developer experience |

---

## Architecture that scales

```
src/app/
├── core/           # Auth, API, guards, interceptors, models, theme, global state
├── environments/   # Supabase URL + publishable key
├── features/       # Lazy-loaded product areas
│   ├── auth/
│   ├── projects/
│   ├── dashboard/
│   ├── employees/
│   ├── departments/
│   ├── attendance/
│   ├── profile/
│   └── settings/
├── layouts/        # Auth shell + main app shell (sidebar + navbar)
├── pages/          # 404, unauthorized, component gallery
└── shared/         # Design-system primitives (table, toast, skeleton, …)

supabase/migrations/   # Schema, RLS, triggers, account RPC
```

### How data flows

1. **Auth** → Supabase GoTrue (`/auth/v1`) for signup, login, refresh, logout  
2. **API** → `ApiService` maps camelCase ↔ snake_case and talks to PostgREST (`/rest/v1`)  
3. **Guards** → `authGuard` protects the app; `projectGuard` enforces workspace scope  
4. **RLS** → Users only see rows for projects they own  

### Route map

| Path | Purpose |
|------|---------|
| `/auth/login`, `/auth/register` | Public authentication |
| `/projects` | Workspace selector |
| `/p/:projectId/dashboard` | Project dashboard |
| `/p/:projectId/employees` | Employee management |
| `/p/:projectId/departments` | Department management |
| `/p/:projectId/attendance` | Attendance tracking |
| `/profile`, `/settings` | Account & preferences |

---

## Data model (backend)

```
auth.users
    └── profiles (1:1)
    └── projects (1:N, owned by user)
            ├── departments
            ├── employees  → department
            ├── attendance → employee + date (unique)
            └── activity
```

| Table | Responsibility |
|-------|----------------|
| `profiles` | Display name, avatar, settings JSON, role |
| `projects` | Workspaces (color, icon, description) |
| `departments` | Org units per project |
| `employees` | Staff records (`active` / `inactive` / `on-leave`) |
| `attendance` | Daily presence (`present` / `late` / `absent`) |
| `activity` | Project activity feed |

On **register**, a database trigger creates a profile and a default workspace (`My Workspace`).

---

## Engineering highlights (what strong candidates demonstrate)

- **Feature-first structure** — each domain owns routes, services, state, and UI  
- **Signal-based state** — `AuthState`, `ProjectState`, and feature states without NgRx ceremony  
- **Cross-cutting HTTP** — token attachment + centralized error → toast UX  
- **Security by default** — RLS on all tables; **never** a service-role key in the browser  
- **Custom UI kit** — avatar, badge, data-table, filters, pagination, dialogs, skeleton, empty states  
- **Accessibility** — focus-visible controls, ARIA on dialogs/nav, WCAG-minded contrast via theme tokens  
- **Performance** — lazy-loaded feature routes for smaller initial bundles  
- **Spec-driven delivery** — phased specs under `specs/` (001–012) + architecture plan  

---

## Configuration

### Prerequisites

- Node.js **20+** (Node 24 tested)
- npm **10+**
- A [Supabase](https://supabase.com) project (optional if you only use the shared demo account)

### Environment

Edit:

- `src/app/environments/environment.development.ts` — local `ng serve`
- `src/app/environments/environment.ts` — production builds

```ts
export const environment = {
  production: false,
  supabaseUrl: 'https://YOUR_PROJECT_REF.supabase.co',
  supabasePublishableKey: 'YOUR_PUBLISHABLE_OR_ANON_KEY',
  featureFlags: {
    csvExport: false,
    i18n: false
  }
};
```

> **Never** put the Supabase **service_role** key in the Angular app. Only the publishable/anon key belongs in the browser.

### Database

Run the migration in the Supabase SQL Editor (or CLI):

```text
supabase/migrations/20260716_initial_schema.sql
```

Creates tables, triggers, RLS policies, and `delete_my_account()` RPC.

For instant local demos, disable **Confirm email** under Supabase → Authentication → Email (or use the demo account).

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Dev server |
| `npm run build` | Production build → `dist/` |
| `npm run watch` | Rebuild on change |
| `npm test` | Unit tests (Vitest) |

---

## Security notes

- **RLS** enabled on public tables (included in migration)
- Client uses **anon/publishable** key only
- Authorization is **project-owner** based (`projects.user_id = auth.uid()`)
- Passwords live in **Supabase Auth** — never stored on `profiles`

---

## Built for hiring conversations

This repository is a strong conversation starter for roles involving:

**Angular / TypeScript · Frontend architecture · Full-stack with BaaS · SaaS multi-tenancy patterns · Design systems · Accessibility · Auth & data security · Spec-driven delivery**

If you are a recruiter or hiring manager evaluating this work:

1. Clone and use **Continue with demo account**
2. Switch workspaces, open employees & attendance, toggle theme
3. Browse `src/app/core` and one feature folder — notice the boundaries
4. Skim `supabase/migrations` for RLS and trigger design

---

## Author

**Mohamed Hossam**  
Frontend / Angular engineer · building polished, production-minded web apps  

- GitHub: [mohamed-hossam1](https://github.com/mohamed-hossam1)  
- Repository: [employee-management-dashboard](https://github.com/mohamed-hossam1/employee-management-dashboard)

---

## License

Private project (`"private": true` in `package.json`). Contact the author before redistribution.

---

## Resources

- [Angular documentation](https://angular.dev)
- [Supabase documentation](https://supabase.com/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [PostgREST filters](https://postgrest.org/en/stable/references/api/tables_views.html)
- [Tailwind CSS v4](https://tailwindcss.com)
