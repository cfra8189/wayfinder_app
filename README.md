# Wayfinder App

## Description

A lightweight full-stack application for organizing projects, uploading media, and sharing creative work. The codebase pairs a TypeScript/Express backend with a Vite + React frontend and is configured for fast local development using SQLite.

## Table of Contents

- [Technologies Used](#technologiesused)
- [Features](#features)
- [Future Features](#nextsteps)
- [Deployed App](#deployment)
- [About The Author](#author)
- [Development Process](#development)
- [Installation & Setup](#installation)
- [Works Cited](#works-cited)

## <a name="technologiesused"></a>Technologies Used

- **Node.js / npm** — runtime and package management
- **TypeScript** — typed server and client code
- **Express** — API server and middleware
- **Vite + React** — fast development and SPA frontend
- **Drizzle ORM** — database schema and migration tooling
- **better-sqlite3** — local development database
- **Tailwind CSS** — utility-first styling
- **Uppy** — client upload UI (optional storage backends)
- **Resend (optional)** — transactional email delivery

## <a name="features"></a>Features

- **Project Management** — create, edit, and list projects and metadata
- **File Uploads** — client-side upload UI with server endpoints and pluggable storage
- **Local Auth** — email/password flows and a dev bypass for local testing
- **Admin Pages** — lightweight admin views for inspecting data
- **Responsive Frontend** — work across desktop and mobile screens
- **SQLite Local Mode** — single-file DB for quick setup and testing

**In Progress:**

- [ ] Notifications for uploads and project activity

## <a name="nextsteps"></a>Future Features

- **Third-party OAuth** — optional sign-in providers (Google, GitHub)
- **Background Processing** — queued tasks for file transforms
- **Search & Filters** — fast lookup across projects and assets
- **Analytics & Reporting** — usage dashboards and exportable reports
- **Production Storage** — S3/GCS adapter and CDN support
- **Mobile Clients** — lightweight mobile shell or PWA support

## <a name="deployment"></a>Deployed Link

- **Live Application:** Not currently deployed. Use the guide below to run locally.
- **Repository:** Push to your preferred remote host (GitHub, GitLab, etc.)

## <a name="author"></a>About The Author

- **Clarence Franklin** — project lead, design, and full-stack implementation

## <a name="development"></a>Development Process

- Feature branches and pull requests for changes
- Small, focused commits and occasional pair programming reviews
- Local-first development with rapid iteration using Vite and SQLite

## <a name="installation"></a>Installation & Setup

1. Clone the repository:

   ```bash
   git clone <your-repo-url>
   ```

2. Change into the app folder:

   ```bash
   cd "C:/Users/Clarence Franklin/Desktop/RVR/wayfinderapp-v2/wayfinder_app-v2"
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Create or update the environment file (`wayfinder_app-v2/.env`) and ensure at minimum:

   - `REPL_ID=dev` (enables local auth bypass)
   - Optional: `RESEND_API_KEY` and `RESEND_FROM_EMAIL` if you want email delivery

5. Start development servers (backend + frontend):

   ```bash
   npm run dev
   ```

   - Backend API: `http://localhost:3000`
   - Frontend (Vite): `http://localhost:5000`

6. Reset local database (optional):

   ```bash
   # stop servers first
   rm sqlite.db
   node --no-warnings scripts/migrate.js
   npm run dev
   ```

## <a name="works-cited"></a>Works Cited

- Vite — https://vitejs.dev/
- React — https://reactjs.org/
- Drizzle ORM — https://orm.drizzle.team/
- better-sqlite3 — https://github.com/WiseLibs/better-sqlite3
- Tailwind CSS — https://tailwindcss.com/
