# Chili POS

Chili POS frontend with an Express API and SQL Server database. GitHub Pages runs an interactive browser-only demo; local development uses the real API and database.

## Run locally

```sh
cd client
npm install
npm run dev
```

Create `client/.env.local` from `.env.example` and set `VITE_API_URL` to the API base URL (for example, `http://localhost:5000/api`). The Vite development server proxies `/api` to `http://localhost:5000` when no URL is configured.

## Deployment and database

For a full local installation, create the database from `database/schema.sql`, then configure `server/.env` from `server/.env.example`. SQL Server Authentication is supported; on Windows, `DB_TRUSTED_CONNECTION=true` uses the Windows account running Node instead. Install the server dependencies with `cd server && npm install`, then start it with `npm start`. Start the Vite client with `cd client && npm run dev`; the local Vite server proxies `/api` to port 5000.

The API seeds the `admin`, `floyd`, and `arlene` accounts (`admin123`, `floyd123`, and `arlene123`) only when the database has no users. Each user can change their own password in Settings; new passwords must be at least 12 characters. Change all seeded passwords before using the app with real restaurant data or copying it to a public cloud.

The GitHub Pages site is an interactive demo with sample menu, tables, orders, and reservations. Demo changes are saved only in that browser's local storage; it does not sign in to or modify the restaurant database. The Pages workflow enables this mode at build time. Local development remains connected to the Express API.

GitHub Pages hosts only the frontend. For a public production deployment connected to a real database, deploy the Express API separately on a secure HTTPS host that can reach SQL Server, configure its database credentials, and allow the Pages origin in `CLIENT_ORIGIN`. Never expose SQL Server directly to the internet or commit `.env` files and database credentials.
