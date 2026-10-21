# ECON3120 — Proprint Value Chain Builder

Classroom app for the database-design unit: five entity teams (Customer, Sales Rep,
Distributor, Supplier, Management) build out their "database" fields by role-playing a
Proprint order from purchase to drop-ship. A live Teacher Mode board shows any two teams'
owned and needed fields side by side and lets the teacher lock contracts between them.

Stack: React (Vite) + Supabase (Postgres + Realtime).

This app lives inside the **SQL-fun** repo and shares its Supabase project with the
SQL Royale quiz. The built output is committed at `/value-chain/` and served statically
by GitHub Pages at <https://phillipplanes.github.io/SQL-fun/value-chain/> — no server,
no secrets.

## 1. Supabase setup (one time)

The app is already pointed at the shared SQL Royale project
(`https://bnncmkwzuduimpkjniur.supabase.co`) — `src/lib/supabase.js` holds the
URL and anon key as defaults.

1. Open the Supabase dashboard for that project → **SQL Editor** and run the whole of
   `supabase/schema.sql`.
   - This creates the `team_fields` and `contracts` tables, permissive classroom
     policies (no login required), and enables realtime updates.
2. Done. The quiz uses only Realtime channels (no tables), so the two apps never collide
   and can run at the same time.

> The anon key is safe to ship for this use case: there is no personal or sensitive data,
> and the schema restricts teams to the five known entity IDs. For a fresh start each
> class, run the two `delete from` lines at the bottom of schema.sql.

## 2. Hosting / rebuilding

The deployed site is the committed `/value-chain/` folder — build output, not source.
After editing anything in this folder:

```bash
npm install
npm run build
rm -rf ../value-chain && cp -R dist ../value-chain
```

Commit both the source change and the refreshed `/value-chain/` output; GitHub Pages
picks it up on push. `vite.config.js` uses a relative `base: "./"`, so the built app
works at any subpath or custom domain.

## 3. Using it in class

- Students open the site on laptop/phone and pick their entity team (their choice is
  remembered on their device via localStorage).
- Everything they record syncs to Supabase automatically — no codes, no export/paste.
- You open the same site and click **🧑‍🏫 Teacher Mode** (or visit
  `.../#teacher`) — project it at the front of the room. It shows every team that has
  connected, with field counts, updating live.
- Pick a team on the left ⟷ a team on the right. Check a field to lock the contract —
  the needing team sees it appear as 🔒 in their app in real time.
- "Needs" sections only show requests aimed at the team on the other side, so
  unmatched requests are easy to spot and discuss.

## Local development

```bash
npm install
npm run dev
```

Optional: `cp .env.example .env` to point at a different Supabase project — the shared
project's URL + anon key are baked in as defaults in `src/lib/supabase.js`.
