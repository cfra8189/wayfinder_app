# Local Development Setup (SQLite Migration)

Since no PostgreSQL database was available, this project has been migrated to use **SQLite** for local development.

## Database

The database is a single file: `sqlite.db` located in `wayfinder_app-v2`.

-   It uses `better-sqlite3` driver.
-   Schema is managed by Drizzle ORM (`drizzle` folder).
-   Session store uses `better-sqlite3-session-store`.

## Running the App

To start the development server (client + server):

```bash
npm run dev
```

This starts:
-   **Backend**: `http://localhost:3000` (API)
-   **Frontend**: `http://localhost:5000` (Vite)

## Resetting the Database

If you need to reset the database:

1.  Stop the server (`Ctrl+C`).
2.  Delete `sqlite.db` file.
3.  Run the manual migration script:
    ```bash
    node --no-warnings scripts/migrate.js
    ```
4.  Start the server again: `npm run dev`

## Authentication

Replit Auth (OIDC) is bypassed locally by setting `REPL_ID=dev` in `.env`.
Use the **Email/Password** registration and login forms in the application.
