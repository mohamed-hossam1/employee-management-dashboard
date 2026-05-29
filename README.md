# Employee Management Dashboard

A multi-workspace **Employee Management System** built with **Angular 22** and **Supabase**.  
Manage projects (workspaces), employees, departments, attendance, and personal settings from a modern dark/light UI.

There is **no mock/in-memory API** — all auth and data go to Supabase (Auth + Postgres/PostgREST).

---

## Features

| Area | What you get |
|------|----------------|
| **Auth** | Register, login, session restore, logout, password change |
| **Demo login** | One-click demo account on the login page |
| **Projects** | Create / edit / delete workspaces; switch active project |
| **Dashboard** | Stats, recent employees, activity, attendance charts |
| **Employees** | CRUD, filters, detail view, CSV import/export tooling |
| **Departments** | Cards, detail, manager assignment, employee counts |
| **Attendance** | Check-in/out, history filters, monthly report, statistics |
| **Profile** | Name, email, phone, bio, avatar, password |
| **Settings** | Theme (light/dark), notification preferences, account export/delete |
| **UX** | Responsive shell, sidebar project switcher, toasts, skeletons, empty states |

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Framework | [Angular](https://angular.dev) 22 (standalone components, signals) |
| Language | TypeScript 6 |
| Styling | Tailwind CSS v4 + CSS custom properties (theme tokens) |
| Charts | Chart.js + ng2-charts |
| Backend | [Supabase](https://supabase.com) Auth + Postgres REST (`/rest/v1`) |
| State | Angular signals (`AuthState`, `ProjectState`, feature states) |
| HTTP | `HttpClient` + auth/error interceptors |
| Tests | Vitest via Angular unit-test builder |
| Package manager | npm 11 |

---

## Architecture

```
src/app/
├── core/                 # Auth, API, guards, interceptors, models, theme, global state
├── environments/         # Supabase URL + publishable key
├── features/             # Lazy-loaded feature areas
│   ├── auth/
│   ├── projects/
│   ├── dashboard/
│   ├── employees/
│   ├── departments/
│   ├── attendance/
│   ├── profile/
│   └── settings/
├── layouts/              # Auth layout + main app shell (sidebar + navbar)
├── pages/                # 404, unauthorized, components gallery
└── shared/               # Reusable UI (table, pagination, filters, toasts, …)

supabase/migrations/      # Postgres schema, RLS, triggers
```

### Data flow

1. **Auth** → Supabase GoTrue (`/auth/v1`) for signup, login, refresh, logout.
2. **API** → `ApiService` maps camelCase ↔ snake_case and calls PostgREST tables under `/rest/v1`.
3. **Guards** → `authGuard` protects app routes; `projectGuard` ensures a valid project scope.
4. **RLS** → Row Level Security: users only access rows for projects they own.

### Main routes

| Path | Description |
|------|-------------|
| `/auth/login`, `/auth/register` | Public auth |
| `/projects` | Workspace selector |
| `/p/:projectId/dashboard` | Project dashboard |
| `/p/:projectId/employees` | Employees |
| `/p/:projectId/departments` | Departments |
| `/p/:projectId/attendance` | Attendance |
| `/profile`, `/settings` | Account |

---

## Prerequisites

- **Node.js** 20+ (Node 24 tested)
- **npm** 10+
- A **Supabase** project (Auth + Postgres)

---

## Getting started

### 1. Install

```bash
git clone <your-repo-url>
cd employee-management-dashboard
npm install
```

### 2. Configure Supabase

Edit the environment files:

- `src/app/environments/environment.development.ts` (local `ng serve`)
- `src/app/environments/environment.ts` (production builds)

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

### 3. Apply the database schema

In the Supabase SQL Editor (or CLI), run the migration:

```text
supabase/migrations/20260716_initial_schema.sql
```

This creates:

- `profiles`, `projects`, `departments`, `employees`, `attendance`, `activity`
- Triggers (profile + default workspace on signup, `updated_at`)
- RLS policies for owner-scoped access
- `delete_my_account()` RPC

### 4. Auth settings (recommended for local demo)

In Supabase Dashboard → **Authentication** → **Providers** → **Email**:

- Disable **Confirm email** if you want instant login after register (or use the demo account below).

### 5. Run the app

```bash
npm start
# same as: ng serve
```

Open [http://localhost:4200](http://localhost:4200).

---

## Demo login

On the login page, use **Continue with demo account**, or sign in manually:

| Field | Value |
|--------|--------|
| **Email** | `mohamedhossamv8@gmail.com` |
| **Password** | `mohamedhossamv8@gmail.com` (same as email) |

The demo account is pre-seeded with sample **projects**, **departments**, **employees**, and **attendance** data in the linked Supabase project.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Dev server (development configuration) |
| `npm run build` | Production build → `dist/` |
| `npm run watch` | Rebuild on change (development) |
| `npm test` | Unit tests (Vitest) |

---

## Supabase data model (summary)

```
auth.users
    └── profiles (1:1)
    └── projects (1:N, owned by user)
            ├── departments (N)
            ├── employees (N, department_id → department)
            ├── attendance (N, employee_id + date unique)
            └── activity (N)
```

| Table | Purpose |
|-------|---------|
| `profiles` | Display name, avatar, settings JSON, role |
| `projects` | Workspaces (color, icon, description) |
| `departments` | Per-project org units |
| `employees` | Staff records (status: active / inactive / on-leave) |
| `attendance` | Daily presence (present / late / absent) |
| `activity` | Project activity feed |

On **register**, a trigger creates a profile and a default project (`My Workspace`).

---

## Key frontend services

| Service | Role |
|---------|------|
| `AuthService` | Supabase auth + profile sync |
| `ApiService` | Generic REST client for PostgREST |
| `ProjectService` | Project CRUD + active project |
| `EmployeeService` / `DepartmentService` / `AttendanceService` | Feature CRUD & filters |
| `ThemeService` | Light/dark theme (DOM `class` + profile preference) |
| `NotificationService` | Toast messages |

---

## Security notes

- Enable **RLS** on all public tables (included in the migration).
- Use only the **publishable/anon** key in the client.
- Authorization is project-owner based (`projects.user_id = auth.uid()`).
- Passwords are handled only by Supabase Auth — never stored in `profiles`.

---

## Project status / specs

Feature work was planned under `specs/` (phases 001–012) and `plan.md`.  
Runtime code is the source of truth when docs still mention an older in-memory API.

---

## Accessibility & quality

- Focus-visible controls, ARIA labels on dialogs and nav
- Theme tokens for light/dark contrast
- Lazy-loaded feature routes for smaller initial bundles
- Unit tests for auth and core state (`npm test`)

---

## License

Private project (`"private": true` in `package.json`). Add a license file if you open-source it.

---

## Resources

- [Angular docs](https://angular.dev)
- [Supabase docs](https://supabase.com/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [PostgREST filters](https://postgrest.org/en/stable/references/api/tables_views.html)
