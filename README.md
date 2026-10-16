# Chili POS browser demo

An interactive GitHub Pages demo of the Chili POS frontend. The demo includes sample menu items, tables, reservations, orders, delivery, accounting, and settings.

## Run locally

```sh
cd client
npm install
npm run dev:demo
```

## Demo data and deployment

The GitHub Pages build opens directly into the POS with a browser-only demo API; no login is required. Use the **Reset demo** button in the yellow banner to restore sample data. Changes are stored in that browser's local storage and are not shared with other users or synced to a server.

The Pages site does not connect to SQL Server and is not suitable for real payments or production restaurant operations. The frontend can use the Express API when built without `VITE_DEMO_MODE=true` and configured with `VITE_API_URL`; the API and database must be deployed separately.

GitHub Actions builds the frontend and deploys `client/dist` to GitHub Pages on pushes to `main`.
