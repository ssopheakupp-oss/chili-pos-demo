# Chili POS

Chili POS frontend for the Express API and SQL Server database. The published website uses the real sign-in flow and loads its data from the API.

## Run locally

```sh
cd client
npm install
npm run dev
```

Create `client/.env.local` from `.env.example` and set `VITE_API_URL` to the API base URL (for example, `http://localhost:5000/api`). The Vite development server proxies `/api` to `http://localhost:5000` when no URL is configured.

## Deployment and database

For a full local installation, create the database from `database/schema.sql`, then configure `server/.env` from `server/.env.example`. SQL Server Authentication is supported; on Windows, `DB_TRUSTED_CONNECTION=true` uses the Windows account running Node instead. Install the server dependencies with `cd server && npm install`, then start it with `npm start`. Start the Vite client with `cd client && npm run dev`; the local Vite server proxies `/api` to port 5000.

The API seeds the `admin`, `floyd`, and `arlene` accounts (`admin123`, `floyd123`, and `arlene123`) only when the database has no users. Change seeded passwords before using the app with real restaurant data.

GitHub Pages hosts only the frontend. To use the hosted site, deploy the Express API separately on a secure HTTPS host that can reach SQL Server, set database credentials on that host, and allow the Pages origin in `CLIENT_ORIGIN`. Never expose SQL Server directly to the internet.

Set the `POS_API_URL` Actions repository variable to the HTTPS API base URL ending in `/api` (for example, `https://pos-api.example.com/api`). The Pages workflow builds the frontend with that URL. Until a public API URL is configured, the hosted sign-in remains unavailable; the local full app runs against the configured SQL Server. Never commit `.env` files or database credentials.
