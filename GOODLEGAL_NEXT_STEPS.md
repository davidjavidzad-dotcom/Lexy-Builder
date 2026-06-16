# GoodLegal / Lexy Next Steps

## What David Needs To Do

1. Create a production database.
   - Supabase or Neon are good options.
   - Create a Postgres database.
   - Copy the database connection string.

2. Choose where the app will live.
   - Easiest for now: keep using Replit if you want the least domain hassle.
   - Better long-term: Render or Railway for the full GoodLegal app.

3. Point `goodlegal.ai` to the deployed app.
   - The hosting service will give DNS instructions.
   - Add those records wherever `goodlegal.ai` is registered.

## What The App Can Do Now

- Lexy renders the JSON legal intake flows.
- Users can answer Lexy questions and submit an intake.
- The backend can store lawyers and intakes.
- Without a database, the app saves data to `.local/goodlegal-data.json`.
- With `DATABASE_URL`, the app uses Postgres.
- Admin can review intakes, change status, and save notes.

## Production Environment Variables

```bash
DATABASE_URL=postgres://...
NODE_ENV=production
PORT=5000
HOST=0.0.0.0
```

Optional local fallback:

```bash
GOODLEGAL_DATA_FILE=.local/goodlegal-data.json
```

## MVP Priority

1. Make Lexy intake excellent.
2. Store submissions permanently.
3. Make Admin useful for follow-up.
4. Connect lawyer matching.
5. Add login.
6. Add payments.
