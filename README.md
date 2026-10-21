# 🎮 SQL-fun — Classroom Tools

Two live classroom apps sharing one site and one Supabase project:

```
/                     Landing page — pick an activity
/quiz/                SQL Royale — live classroom quiz (single static HTML file)
/value-chain/         Proprint Value Chain Builder (ECON3120) — built React app
/econ3120-value-chain/  Source for the value-chain app (Vite + React)
```

Deployed as a static site from this repo (Cloudflare Pages, no build step — the
value-chain app is pre-built and its output is committed at `/value-chain/`).

## The two apps

### 🎯 SQL Royale — Live Classroom Quiz

Kahoot-style quiz built for SQL 101, with a twist: **Full-Class Mode**. The whole class plays
as one team. Every student must vote on every question — **not voting counts as a wrong answer**.
The class answer per question is the **majority vote**. If the class averages **≥ 75% correct**
(configurable), **homework is skipped**. 🎉

- 🖥️ **Teacher view** — runs on the projector: PIN + QR code, live vote counts, timer,
  per-question reveal with explanations, homework meter, final verdict + student leaderboard.
- 📱 **Player view** — students join from their phones: no app install, just a URL + PIN.
- ⚡ **Real time** — Supabase Realtime channels (broadcast + presence, no database tables).
- 📚 **Three lesson modules**, selected on the teacher setup screen (`/quiz/#host`):
  Day 1 (Data to Decisions), SQL 101 Basics, and Round 2 (Relational Database Basics).

### 🔗 Proprint Value Chain Builder (ECON3120)

Classroom app for the database-design unit: five entity teams (Customer, Sales Rep,
Distributor, Supplier, Management) build out their "database" fields by role-playing a
Proprint order from purchase to drop-ship. A live Teacher Mode board (`/value-chain/#teacher`)
shows any two teams' owned and needed fields side by side and lets the teacher lock contracts
between them.

- Stack: React (Vite) + Supabase (Postgres tables + Realtime).
- Uses the same Supabase project as the quiz — two tables (`team_fields`, `contracts`) that
  the quiz never touches, so the two apps can run at the same time.

---

## 🚀 Setup

### 1. One Supabase project for both apps

The Supabase URL + anon key are already baked into both apps. If you ever point them at a
new project:

- **Quiz:** edit `SUPABASE_URL` / `SUPABASE_ANON_KEY` near the top of `quiz/index.html`.
- **Value chain:** edit the defaults in `econ3120-value-chain/src/lib/supabase.js`, then
  rebuild (see below).

### 2. Create the value-chain tables (one time)

The quiz needs no tables. The value-chain app does. In the Supabase dashboard
(**SQL Editor**), run the whole of `econ3120-value-chain/supabase/schema.sql`.
This creates `team_fields` and `contracts`, permissive classroom policies (no login
required), and enables realtime updates.

For a fresh start each class, run the two `delete from` lines at the bottom of schema.sql.

### 3. Deploy

The repo is a plain static site — host it anywhere that serves files as-is
(Cloudflare Pages, Netlify drop, GitHub Pages from branch). The join-QR code encodes your
deployed URL, so the site must be online (not `file://`) for phones to join.

---

## 🕹️ Running a quiz in class

1. Open `/quiz/` on the **projector computer** → **Teacher — run the game**.
   Pick the lesson module, question count, seconds per question, and the homework-pass
   threshold, then **Create game room**. A 6-digit PIN and a QR code appear.
2. Students open the site on their phones (scan the QR) → enter the PIN and a nickname.
3. Click **Start game**. Each question: timer on both screens, students tap A/B/C/D,
   **End question & reveal** shows the answer, vote breakdown, and explanation.
   The **homework meter** tracks class accuracy vs. the threshold.
4. After the last question: **final verdict** — homework skipped or not, per-question
   breakdown, and the top-10 student leaderboard.

## 🔗 Running the value-chain exercise

- Students open `/value-chain/` and pick their entity team (remembered via localStorage).
  Everything syncs to Supabase automatically.
- Open `/value-chain/#teacher` on the projector — it shows every team live.
- Pick a team on the left ⟷ a team on the right; check a field to lock the contract.
  The needing team sees it appear as 🔒 in real time.

See `econ3120-value-chain/README.md` for full details.

## ✏️ Customizing

- **Quiz questions:** edit the `MODULES` object at the top of `quiz/index.html`. Each key
  becomes a module in the teacher's dropdown. Question shape:
  `{ q, options: [4], answer: 0-3, explain, code? }`.
- **Value-chain app:** edit `econ3120-value-chain/src/`, then rebuild and refresh the
  committed output:

  ```bash
  cd econ3120-value-chain
  npm install
  npm run build
  rm -rf ../value-chain && cp -R dist ../value-chain
  ```

## 🔒 Privacy notes

- The quiz writes nothing to the database — game state lives only in the teacher's browser
  and is relayed over Realtime channels. Close the teacher tab and the room is gone.
- The value-chain app stores team field lists and teacher-locked contracts only — no
  student names. Nicknames in the quiz are visible to the class; don't use real names if
  your school requires it.
