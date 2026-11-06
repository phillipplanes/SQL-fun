# 🎮 SQL-fun — Classroom Tools

Three live classroom apps sharing one site (two share a Supabase project):

```
/                     Landing page — pick an activity
/quiz/                SQL Royale — live classroom quiz (single static HTML file)
/sql-quiz/            SQL Practice Quiz — name-seeded, auto-graded solo quiz (static HTML + proprint.sql)
/value-chain/         ProImprint Value Chain Builder (ECON3120) — built React app
/econ3120-value-chain/  Source for the value-chain app (Vite + React)
```

Deployed via **GitHub Pages** from this repo's `main` branch at
<https://phillipplanes.github.io/SQL-fun/> — no build step; the value-chain app is
pre-built and its output is committed at `/value-chain/`.

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

### 🔗 ProImprint Value Chain Builder (ECON3120)

Classroom app for the database-design unit: five entity teams (Customer, Sales Rep,
ProImprint Operations, Supplier, Management) build out their "database" fields by
role-playing a ProImprint order from purchase to delivery. ProImprint is the
distributor — it sources suppliers, prints on the goods, and ships to the customer.
A live Teacher Mode board (`/value-chain/#teacher`)
shows any two teams' owned and needed fields side by side and lets the teacher lock contracts
between them.

- Stack: React (Vite) + Supabase (Postgres tables + Realtime).
- Uses the same Supabase project as the quiz — two tables (`team_fields`, `contracts`) that
  the quiz never touches, so the two apps can run at the same time.

### 📝 SQL Practice Quiz — Proprint Order System

Take-home / lab-style solo quiz. A student enters their name, then answers **10 questions of
identical types for the whole class** — basic SELECT → WHERE → ORDER BY + LIMIT → LIKE/NULL →
aggregates → GROUP BY → JOIN → JOIN + GROUP BY → multi-join + GROUP BY — but the **details are
seeded from the student's name**, so each person gets different products, cities, statuses and
thresholds to look up. Same name always regenerates the same quiz (it's the seed).

- Each question shows the **exact result the query must return** (as a data table) and the student
  writes the query: "Write a query that returns exactly this result." The app runs their SQL
  in-browser (SQLite via WebAssembly from a CDN) and tells them if the values match — row order,
  column order and column names don't matter; only the returned values do. Queries that don't
  read from a real table (e.g., retyping the shown result with UNIONs of literals) are rejected.
- Pressing **Submit** inserts one row in the `sql_quiz_submissions` Supabase table: the student's
  name, their questions, their query per question with attempts and a **solved flag**, plus the
  expected result for grading disputes — the dashboard shows scores at a glance.
- **Answer key:** open `/sql-quiz/dashboard.html` (bookmark it — it's not linked from any
  student-facing page), enter your instructor passcode, and use the "Answer key" card: type a
  student's name exactly as they entered it to see their questions with a reference query
  for each.
- Files: `sql-quiz/index.html` (student app), `sql-quiz/dashboard.html` (instructor app —
  progress/answers plus answer key), `sql-quiz/quiz-engine.js` (shared question engine +
  result grading), `sql-quiz/proprint.sql` (schema + dummy data, fetched by the app and handy
  for practicing locally), `sql-quiz/schema.sql` (Supabase table + passcode-gated functions).
  Edit the question builders in `quiz-engine.js` to change what the class is asked; expected
  answers live in the `DATA` object (verified against the data by the test harness pattern in
  git history).

---

## 🚀 Setup

### 1. One Supabase project for all three apps

The Supabase URL + anon key are already baked into all three apps. If you ever point them at a
new project:

- **Quizzes:** edit `SUPABASE_URL` / `SUPABASE_ANON_KEY` near the top of `quiz/index.html` and `sql-quiz/index.html`.
- **Value chain:** edit the defaults in `econ3120-value-chain/src/lib/supabase.js`, then
  rebuild (see below).

### 2. Create the database tables (one time)

The live classroom quiz needs no tables. The other two apps do — run each schema once in the
Supabase dashboard (**SQL Editor**):

- **SQL Practice Quiz:** run the whole of `sql-quiz/schema.sql` → creates
  `sql_quiz_submissions` (students can only insert) plus `sql_quiz_config` and two
  passcode-gated functions that the instructor dashboard uses to read/clear submissions
  (direct table reads stay blocked for students). **Then set your instructor passcode:**
  `update public.sql_quiz_config set instructor_passcode = 'your-secret-here';`
  For a fresh start each class, run the `delete from` line at the bottom (or press
  "Clear all submissions" on the dashboard).
- **Value chain:** run the whole of `econ3120-value-chain/supabase/schema.sql`.
  This creates `team_fields` and `contracts`, permissive classroom policies (no login
  required), and enables realtime updates.

  For a fresh start each class, run the two `delete from` lines at the bottom of schema.sql.

### 3. Deploy

GitHub Pages serves this repo's `main` branch as-is (Settings → Pages → deploy from
branch, root) — that's how the current site runs. Pushes go live in a minute or two.
The site is a plain static folder tree, so it can also be hosted anywhere that serves
files as-is (Netlify drop, Cloudflare Pages, etc.). The join-QR code encodes your
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

## 📝 Running the SQL practice quiz

1. Students open `/sql-quiz/`, type their name, and get their 10 seeded questions. Each question
   shows the result the query must return; the student writes the query (in the page or in their
   own SQLite client with `proprint.sql`), presses **Run & check**, and iterates until it matches.
   Progress and queries are saved in their browser across sessions.
2. On the last question they press **Submit my answers** — one row lands in `sql_quiz_submissions`
   with their questions, their query per question with attempts and a solved flag, and the
   expected result for each question.
3. To grade, open `/sql-quiz/dashboard.html` (bookmark it — no student-facing page links to
   it) — enter your instructor passcode for a live table of every student (score, attempts,
   submission time), a per-question breakdown of their queries with expected results and
   solved flags, earlier attempts, a CSV export, a reset button, and the answer-key card
   for disputes (enter the student's name exactly as they typed it).

## ✏️ Customizing

- **Live quiz questions:** edit the `MODULES` object at the top of `quiz/index.html`. Each key
  becomes a module in the teacher's dropdown. Question shape:
  `{ q, options: [4], answer: 0-3, explain, code? }`.
- **Practice quiz questions:** edit the `q1…q10` builder functions in `sql-quiz/index.html`.
  Each builder picks its seeded details from the candidate lists right above them (the lists
  are pre-checked against the dummy data — every choice yields a non-empty, sensible result).
- **Value-chain app:** edit `econ3120-value-chain/src/`, then rebuild and refresh the
  committed output:

  ```bash
  cd econ3120-value-chain
  npm install
  npm run build
  rm -rf ../value-chain && cp -R dist ../value-chain
  ```

## 🔒 Privacy notes

- The live quiz writes nothing to the database — game state lives only in the teacher's browser
  and is relayed over Realtime channels. Close the teacher tab and the room is gone.
- The practice quiz stores the student's name, their questions, and their SQL answers in
  Supabase — that's the point (it's how you receive submissions). Students can only insert:
  the anon key cannot read or modify anyone's answers. The instructor dashboard reads
  submissions through a passcode-gated function (not the anon RLS policy), so anyone with
  the passcode — and only with the passcode — can view or clear them.
- The value-chain app stores team field lists and teacher-locked contracts only — no
  student names. Nicknames in the live quiz are visible to the class; don't use real names if
  your school requires it.
