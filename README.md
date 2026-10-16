# Chili POS

Chili POS frontend for the Express API and SQL Server database. The published website uses the real sign-in flow; it does not include demo users or browser-only sample data.

## Run locally

```sh
cd client
npm install
npm run dev
```

Create `client/.env.local` from `.env.example` and set `VITE_API_URL` to the API base URL (for example, `http://localhost:5000/api`). The Vite development server proxies `/api` to `http://localhost:5000` when no URL is configured.

## Deployment and database

GitHub Pages hosts only the frontend. The Node/Express API and SQL Server still need to be deployed and configured separately: host the API over HTTPS where it can reach SQL Server, configure database credentials on that host, and allow the Pages origin in `CLIENT_ORIGIN`. Never expose SQL Server directly to the internet.

Set the `POS_API_URL` Actions repository variable to the HTTPS API base URL ending in `/api` (for example, `https://pos-api.example.com/api`). The Pages workflow builds the frontend with that URL and publishes it on pushes to `main`. Until that variable is set, the sign-in page reports that the API URL is not configured.

The API and SQL schema are not included in this frontend-only repository; deploy them from the original POS package. Never commit `.env` files or database credentials.
