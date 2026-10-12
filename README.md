# 🎮 SQL Royale — Live Classroom Quiz (Projector + Phones)

A Kahoot-style quiz built for SQL 101, with a twist: **Full-Class Mode**. The whole class plays
as one team. Every student must vote on every question — **not voting counts as a wrong answer**.
The class answer per question is the **majority vote**. If the class averages **≥ 75% correct**
(configurable), **homework is skipped**. 🎉

- 🖥️ **Teacher view** — runs on the projector: PIN + QR code, live vote counts, timer,
  per-question reveal with explanations, homework meter, final verdict + student leaderboard.
- 📱 **Player view** — students join from their phones: no app install, just a URL + PIN.
- ⚡ **Real time** — powered by Supabase Realtime channels (free tier, no database tables needed).
- 📚 **Two lesson modules included**, selected on the teacher setup screen:
  - **Day 1 — Data vs. Information vs. Insights** (18 questions): the data→information→insight
    pipeline using campus life — meal card swipes, dorm/building access logs, gym traffic,
    dining plans, GPA comparisons — plus data quality and privacy. 
  - **SQL 101 Basics** (18 questions): SELECT, JOINs, WHERE vs HAVING, GROUP BY, NULL, LIKE,
    aggregation, PK/FK, UPDATE dangers…  Questions are shuffled each game. Add your own in `index.html`.

---

## 🚀 Setup (about 5 minutes)

### 1. Create a free Supabase project
1. Go to [supabase.com](https://supabase.com) → sign in → **New project**.
2. Pick a name (e.g. `sql-royale`), any region, a database password (you won't need it).
3. Wait ~2 min for provisioning. The **free tier is plenty** — we only use Realtime messaging.

### 2. Get your keys
1. In the Supabase dashboard open **Project Settings → API**.
2. Copy the **Project URL** (`https://xxxx.supabase.co`) and the **anon public** key.
   > The anon key is *designed* to be public in front-end apps. We only use Realtime
   > broadcast channels, and no data is stored in the database, so there's nothing to leak.

### 3. Paste them into the app
Open `index.html` and edit the two constants near the top of the `<script>`:

```js
const SUPABASE_URL = "https://YOUR-PROJECT.supabase.co";
const SUPABASE_ANON_KEY = "YOUR-ANON-KEY";
```

### 4. Put the site online (pick one, all free)
- **Netlify (easiest):** drag-and-drop the `sql-royale` folder at [app.netlify.com/drop](https://app.netlify.com/drop).
- **Vercel:** `vercel deploy` or import the folder in the dashboard.
- **GitHub Pages:** commit the folder to a repo → Settings → Pages → deploy from branch.

The site is a single static `index.html` — no build step, no server.

> ⚠️ The join-QR code encodes your deployed URL, so the site must be online (not a `file://`
> local file) for phones to join. For a dry run you can also just open the deployed URL on
> two devices / two browser tabs.

---

## 🕹️ Running a game in class

1. Open the site on the **projector computer** → **Teacher — run the game**.
   - Pick the **lesson module** for the day, number of questions, seconds per question,
     and the homework-pass threshold.
   - Click **Create game room**. A 6-digit PIN and a QR code appear.
2. Students open the site on their phones (**scan the QR** or visit the URL) → enter the PIN
   and a nickname. Their names pop up live in the lobby.
3. Click **Start game**. Each question:
   - Timer counts down on both screens; students tap A/B/C/D.
   - Click **End question & reveal** (or let the timer run out) to show the answer, a vote
     breakdown, and the explanation.
   - The **homework meter** shows this question's class accuracy (correct votes ÷ everyone in
     the room — non-votes count as wrong) and the running class average vs. the 75% goal line.
4. After the last question: **final verdict** — homework skipped or not, per-question breakdown,
   and the top-10 student leaderboard.

## 📐 Full-Class Mode rules (as implemented)

| Rule | Implementation |
|---|---|
| Non-vote counts against the class | Class accuracy = correct voters ÷ players in the room |
| Class answer = majority vote | Host tallies votes; the majority option is highlighted ✓/✗ |
| 75% to skip homework | Running average of per-question accuracy vs. threshold (white line on the meter) |

Individual students still get Kahoot-style points (100 per correct answer) for the leaderboard,
so there's personal glory too.

## ✏️ Customizing

- **Questions:** edit the `MODULES` object at the top of `index.html`. Each key becomes a
  module in the teacher's dropdown. Each question is
  `{ q, options: [4], answer: 0-3, explain, code? }` — `code` optionally shows a
  snippet above the options. Questions are shuffled and sliced to your chosen count.
- **Threshold/timer:** configurable on the create screen.

## 🧰 Troubleshooting

- **"Supabase is not configured yet"** — you haven't replaced the placeholder keys.
- **Phones say joining but nothing happens** — check the site URL is `https://` and the keys are
  from the same project; check the browser console for Realtime errors.
- **A student's phone locked up mid-question** — they can refresh and rejoin with the same PIN;
  they'll rejoin the current question (their earlier missed vote already counted, that's the rule 😈).

## 🔒 Privacy notes

- Nothing is written to the Supabase database — game state lives only in the teacher's browser
  and is relayed over Realtime channels. Close the teacher tab and the room is gone.
- Nicknames are visible to the class; don't use real names if your school requires it.
