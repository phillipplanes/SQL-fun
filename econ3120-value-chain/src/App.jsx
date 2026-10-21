import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase, isSupabaseConfigured } from "./lib/supabase";

// ============================================================
// ECON3120 — Proprint.com Value Chain Simulation
// Supabase-backed: each team's fields sync live to the database;
// Teacher Mode reads every team and marks contracts in real time.
// ============================================================

const ENTITIES = {
  customer: {
    name: "Customer",
    emoji: "🛍️",
    color: "bg-blue-100 border-blue-300 text-blue-900",
    accent: "bg-blue-500",
    brief:
      "You order custom printed products from Proprint by phone or website. You supply artwork and expect your order to arrive at your door — drop-shipped. You care about price, proofing your artwork, and delivery dates.",
    prompt:
      "Think through an order from YOUR side. What do you have to tell the sales rep? What do you expect back? Every answer is a field.",
  },
  salesrep: {
    name: "Sales Rep",
    emoji: "📞",
    color: "bg-amber-100 border-amber-300 text-amber-900",
    accent: "bg-amber-500",
    brief:
      "You take orders (phone & website) for Proprint. You don't make or own anything — you collect artwork, price the job, create the PO, and coordinate the distributor and supplier until the order is drop-shipped to the customer.",
    prompt:
      "Walk a call from start to finish. What do you write down? What do you have to go find out from other teams before you can promise anything?",
  },
  distributor: {
    name: "Distributor",
    emoji: "📦",
    color: "bg-violet-100 border-violet-300 text-violet-900",
    accent: "bg-violet-500",
    brief:
      "You sit between Proprint and the suppliers. You source the right supplier for each job, hold product information and inventory, and route purchase orders. You never touch the product yourself — it's drop-shipped.",
    prompt:
      "When a PO lands on your desk, what must you already know? What do you have to pass along to make the drop-ship work?",
  },
  supplier: {
    name: "Supplier",
    emoji: "🏭",
    color: "bg-emerald-100 border-emerald-300 text-emerald-900",
    accent: "bg-emerald-500",
    brief:
      "You produce the printed goods. You receive a PO, schedule production, and drop-ship the finished order directly to the end customer — you ship to an address you get from the PO, and you never see the customer.",
    prompt:
      "You can't start production on an incomplete PO. What has to be on it? What do you send back out when the truck leaves?",
  },
  management: {
    name: "Management",
    emoji: "📊",
    color: "bg-rose-100 border-rose-300 text-rose-900",
    accent: "bg-rose-500",
    brief:
      "You run Proprint. You don't touch orders, but you need reporting: revenue, margin per order, supplier performance, and on-time delivery. Every field you need must be captured somewhere by someone else.",
    prompt:
      "You're asking for a monthly report. Name every number on it — then figure out which team has to record it for you.",
  },
};

const ORDER_STEPS = [
  {
    title: "1. Order Placed",
    actor: "customer",
    desc: "A customer calls in / places an order on the website. Sales rep answers. Role-play the conversation — what gets written down?",
    question: "If nothing is recorded in this conversation, what breaks later?",
  },
  {
    title: "2. Artwork Collected",
    actor: "salesrep",
    desc: "The sales rep collects the customer's artwork and sends a proof for approval.",
    question: "What could go wrong if the artwork and its approval aren't tracked as data?",
  },
  {
    title: "3. Product Lookup & Availability",
    actor: "salesrep",
    desc: "The sales rep contacts the distributor: what product is this, and can we fulfill the quantity?",
    question: "What did the sales rep have to ask for? Could the call have been avoided with the right data in a database?",
  },
  {
    title: "4. Purchase Order Created",
    actor: "salesrep",
    desc: "The sales rep issues a PO to the distributor for the job.",
    question: "List everything that must appear on the PO for it to be actionable. Where did each item come from?",
  },
  {
    title: "5. Production & Drop-Ship",
    actor: "supplier",
    desc: "The supplier produces the job and ships it directly to the customer's door — no one else touches it.",
    question: "The supplier never talks to the customer. How does the package end up at the right address? What data makes that possible?",
  },
  {
    title: "6. Delivery Confirmed",
    actor: "customer",
    desc: "The customer receives the package; the sales rep confirms delivery and closes the order.",
    question: "How does anyone prove the order actually arrived? What would you ask for if it didn't?",
  },
  {
    title: "7. Reporting & Review",
    actor: "management",
    desc: "Management reviews how the order went: revenue, margin, supplier performance, on-time delivery.",
    question: "Which of your fields can only be computed from fields OTHER teams recorded? Did you catch them all?",
  },
];

// ============================================================
// Small UI helpers
// ============================================================

function Card({ children, className = "" }) {
  return <div className={`rounded-xl border shadow-sm p-4 ${className}`}>{children}</div>;
}

function Pill({ children, color = "bg-slate-100 text-slate-700" }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>
      {children}
    </span>
  );
}

// ============================================================
// Main App — routing between team view and teacher mode
// ============================================================

export default function App() {
  const [team, setTeam] = useState(() => localStorage.getItem("econ3120-team"));
  const [teacherMode, setTeacherMode] = useState(
    () => window.location.hash === "#teacher"
  );

  useEffect(() => {
    const onHash = () => setTeacherMode(window.location.hash === "#teacher");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const selectTeam = (id) => {
    localStorage.setItem("econ3120-team", id);
    setTeam(id);
  };

  if (teacherMode) {
    return (
      <TeacherMode
        onExit={() => {
          window.location.hash = "";
          setTeacherMode(false);
        }}
      />
    );
  }

  return (
    <TeamApp
      team={team}
      onSelect={selectTeam}
      onTeacher={() => {
        window.location.hash = "teacher";
        setTeacherMode(true);
      }}
    />
  );
}

// ============================================================
// Team view
// ============================================================

function TeamApp({ team, onSelect, onTeacher }) {
  const [tab, setTab] = useState("brief");
  const [currentStep, setCurrentStep] = useState(0);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(!!team);
  const [contracts, setContracts] = useState([]); // teacher-locked rows
  const saveTimer = useRef(null);

  // Load this team's fields + subscribe to live changes
  useEffect(() => {
    if (!team) return;
    setLoading(true);
    let mounted = true;

    supabase
      .from("team_fields")
      .select("fields")
      .eq("team", team)
      .maybeSingle()
      .then(({ data }) => {
        if (!mounted) return;
        setFields(data?.fields || []);
        setLoading(false);
      });

    const channel = supabase
      .channel(`team-${team}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "team_fields", filter: `team=eq.${team}` },
        (payload) => {
          const incoming = payload.new?.fields;
          if (incoming) setFields(incoming);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contracts" },
        () => {
          // refresh contracts (cheap table)
          supabase
            .from("contracts")
            .select("*")
            .eq("needer_team", team)
            .then(({ data }) => data && setContracts(data));
        }
      )
      .subscribe();

    supabase
      .from("contracts")
      .select("*")
      .eq("needer_team", team)
      .then(({ data }) => data && setContracts(data));

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [team]);

  // Debounced save: persist fields to Supabase whenever they change locally
  const persist = useCallback(
    (nextFields) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        supabase.from("team_fields").upsert({ team, fields: nextFields });
      }, 400);
    },
    [team]
  );

  const updateFields = (fn) => {
    setFields((prev) => {
      const next = fn(prev);
      persist(next);
      return next;
    });
  };

  const addField = (kind, field, why, from = null, stepIdx = null) => {
    const f = field.trim();
    if (!f) return;
    const id = f.toLowerCase().replace(/\s+/g, "_");
    if (fields.some((x) => x.field === id)) return;
    updateFields((prev) => [
      ...prev,
      {
        field: id,
        label: f,
        why: why.trim() || "No justification yet",
        kind,
        from,
        step: stepIdx,
        status: kind === "need" ? "proposed" : null,
      },
    ]);
  };

  const removeField = (id) => updateFields((prev) => prev.filter((c) => c.field !== id));

  const advanceNeedStatus = (id) => {
    updateFields((prev) =>
      prev.map((c) => {
        if (c.field !== id || c.kind !== "need") return c;
        const status =
          c.status === "proposed" ? "matched" : c.status === "matched" ? "locked" : "proposed";
        return { ...c, status };
      })
    );
  };

  if (!team) {
    return <TeamSelect onSelect={onSelect} onTeacher={onTeacher} />;
  }

  const entity = ENTITIES[team];
  const ownFields = fields.filter((f) => f.kind === "own");
  const needFields = fields
    .filter((f) => f.kind === "need")
    .map((f) => {
      const contract = contracts.find((c) => c.field === f.field && c.locked);
      return contract ? { ...f, status: "locked" } : f;
    });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className={`${entity.accent} text-white px-4 py-5 sticky top-0 z-10 shadow`}>
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest opacity-80">
              ECON3120 · Proprint Value Chain {!isSupabaseConfigured && "· ⚠️ offline (no Supabase env)"}
            </p>
            <h1 className="text-xl sm:text-2xl font-bold">
              {entity.emoji} {entity.name} Team {loading && <span className="text-sm font-normal">…</span>}
            </h1>
          </div>
          <button
            onClick={() => { localStorage.removeItem("econ3120-team"); onSelect(null); }}
            className="text-xs bg-white/20 hover:bg-white/30 rounded-lg px-3 py-2 font-medium transition"
          >
            Switch team
          </button>
        </div>
      </header>

      <nav className="max-w-3xl mx-auto px-4 mt-4 flex gap-2 overflow-x-auto pb-1">
        {[
          ["brief", "📋 Role Brief"],
          ["own", "🗄️ Data You Own"],
          ["need", "🔍 Data You Need"],
          ["order", "🚚 Order Walkthrough"],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium border transition ${
              tab === id
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-5 space-y-4">
        {tab === "brief" && (
          <>
            <Card className={entity.color}>
              <h2 className="font-bold text-lg mb-2">Your role in the value chain</h2>
              <p className="leading-relaxed">{entity.brief}</p>
            </Card>
            <Card>
              <h3 className="font-semibold mb-2">🤔 Your starting question</h3>
              <p className="text-sm text-slate-700 leading-relaxed">{entity.prompt}</p>
            </Card>
            <Card>
              <h3 className="font-semibold mb-2">How to play</h3>
              <ol className="text-sm text-slate-700 list-decimal ml-5 space-y-1">
                <li>No fields are given to you. Your team's database starts <b>empty</b>.</li>
                <li>Role-play the order walkthrough. Every time your team says <i>"wait, we'd need to know…"</i> — that's a field. Add it.</li>
                <li>Sort each field: do you <b>own</b> it (you're the source of truth) or do you <b>need</b> it from another team?</li>
                <li>When the teacher opens a negotiation with another team, your fields appear on the board live — and locked contracts appear here 🔒 automatically.</li>
                <li>Be ready to defend why every field exists.</li>
              </ol>
            </Card>
          </>
        )}

        {tab === "own" && <OwnTab entity={entity} ownFields={ownFields} addField={addField} removeField={removeField} />}

        {tab === "need" && (
          <NeedTab entity={entity} team={team} needFields={needFields} addField={addField} removeField={removeField} advanceNeedStatus={advanceNeedStatus} />
        )}

        {tab === "order" && (
          <OrderTab
            entity={entity}
            team={team}
            stepIdx={currentStep}
            setCurrentStep={setCurrentStep}
            fields={fields}
            addField={addField}
            removeField={removeField}
            advanceNeedStatus={advanceNeedStatus}
          />
        )}
      </main>
    </div>
  );
}

// ============================================================
// Tabs
// ============================================================

function OwnTab({ entity, ownFields, addField, removeField }) {
  const [field, setField] = useState("");
  const [why, setWhy] = useState("");
  return (
    <>
      <Card>
        <h2 className="font-bold text-lg mb-1">🗄️ Your team's database — fields you OWN</h2>
        <p className="text-sm text-slate-500 mb-3">
          You are the <b>source of truth</b> for these fields — no other team should record them.
          Start empty and add fields as your team discovers them.
        </p>
        {ownFields.length === 0 && (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-slate-400">
            No fields yet. What does your team know that nobody else does?
          </div>
        )}
        <div className="space-y-2">
          {ownFields.map((f) => (
            <FieldRow key={f.field} f={f} onRemove={() => removeField(f.field)} />
          ))}
        </div>
      </Card>
      <Card className="bg-white">
        <h3 className="font-semibold mb-2">➕ Add a field you own</h3>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={field}
            onChange={(e) => setField(e.target.value)}
            placeholder="Field name"
            className="flex-1 border rounded-lg px-3 py-2 text-sm"
          />
          <input
            value={why}
            onChange={(e) => setWhy(e.target.value)}
            placeholder="Why does your team need it?"
            className="flex-1 border rounded-lg px-3 py-2 text-sm"
          />
          <button
            onClick={() => { addField("own", field, why); setField(""); setWhy(""); }}
            className={`${entity.accent} text-white rounded-lg px-4 py-2 text-sm font-medium`}
          >
            Add
          </button>
        </div>
      </Card>
    </>
  );
}

function NeedTab({ entity, team, needFields, addField, removeField, advanceNeedStatus }) {
  const [field, setField] = useState("");
  const [why, setWhy] = useState("");
  const [from, setFrom] = useState("");
  const lockedCount = needFields.filter((f) => f.status === "locked").length;

  return (
    <>
      <Card>
        <h2 className="font-bold text-lg mb-1">🔍 Fields you NEED from other entities</h2>
        <p className="text-sm text-slate-500 mb-3">
          Fields your team can't do its job without — but that some other team has to own and
          give you. Fields the teacher marks off in a negotiation show up here as 🔒 locked
          automatically.
        </p>
        <div className="flex gap-2 mb-3 text-xs">
          <Pill>{needFields.length} total</Pill>
          <Pill color="bg-emerald-100 text-emerald-800">🔒 {lockedCount} locked by contract</Pill>
        </div>
        {needFields.length === 0 && (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-slate-400">
            No fields yet. What did you have to ask another team for during the walkthrough?
          </div>
        )}
        <div className="space-y-2">
          {needFields.map((f) => (
            <div
              key={f.field}
              className={`rounded-lg border p-3 ${
                f.status === "locked" ? "bg-emerald-50 border-emerald-300" : "bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <code className="text-sm font-semibold">
                      {f.status === "locked" ? "🔒 " : ""}{f.field}
                    </code>
                    {f.from ? (
                      <Pill color={ENTITIES[f.from].color}>
                        from {ENTITIES[f.from].emoji} {ENTITIES[f.from].name}
                      </Pill>
                    ) : (
                      <Pill>provider not chosen</Pill>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{f.why}</p>
                </div>
                <button onClick={() => removeField(f.field)} className="text-xs text-rose-600 hover:underline">
                  remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card className="bg-white">
        <h3 className="font-semibold mb-2">➕ Add a field you need</h3>
        <div className="flex flex-col gap-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={field}
              onChange={(e) => setField(e.target.value)}
              placeholder="Field name"
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
            />
            <input
              value={why}
              onChange={(e) => setWhy(e.target.value)}
              placeholder="Why?"
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500">From:</label>
            <select
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">— choose the team that owns it —</option>
              {Object.entries(ENTITIES)
                .filter(([id]) => id !== team)
                .map(([id, e]) => (
                  <option key={id} value={id}>{e.emoji} {e.name}</option>
                ))}
            </select>
            <button
              onClick={() => { addField("need", field, why, from || null); setField(""); setWhy(""); setFrom(""); }}
              className={`${entity.accent} text-white rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap`}
            >
              Add
            </button>
          </div>
        </div>
      </Card>
    </>
  );
}

function OrderTab({ entity, team, stepIdx, setCurrentStep, fields, addField, removeField, advanceNeedStatus }) {
  const step = ORDER_STEPS[stepIdx];
  const [field, setField] = useState("");
  const [why, setWhy] = useState("");
  const [kind, setKind] = useState("own");
  const [from, setFrom] = useState("");
  const stepFields = fields.filter((f) => f.step === stepIdx);

  return (
    <>
      <Card>
        <h2 className="font-bold text-lg mb-1">🚚 Order walkthrough — purchase to drop-ship</h2>
        <p className="text-sm text-slate-500 mb-3">
          Role-play each step aloud in your team. The app never tells you which fields you need —
          your team has to hit the wall yourselves.
        </p>
        <div className="flex gap-1 mb-4">
          {ORDER_STEPS.map((s, i) => (
            <button
              key={s.title}
              onClick={() => setCurrentStep(i)}
              className={`flex-1 h-2 rounded-full transition ${
                i < stepIdx ? "bg-emerald-400" : i === stepIdx ? entity.accent : "bg-slate-200"
              }`}
            />
          ))}
        </div>
        <div className={`rounded-xl border p-4 ${ENTITIES[step.actor].color}`}>
          <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
            <h3 className="font-bold">{step.title}</h3>
            <Pill color="bg-white/70">{ENTITIES[step.actor].emoji} {ENTITIES[step.actor].name} leads</Pill>
          </div>
          <p className="text-sm">{step.desc}</p>
          <div className="mt-3 rounded-lg bg-white/70 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Discussion question</p>
            <p className="text-sm italic">{step.question}</p>
          </div>
        </div>

        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mt-4 mb-2">
          Fields your team decided this step needs
        </h4>
        <div className="space-y-2">
          {stepFields.length === 0 && (
            <div className="rounded-lg border border-dashed p-4 text-center text-sm text-slate-400">
              Nothing yet. Role-play the step — what did your team have to know or write down?
            </div>
          )}
          {stepFields.map((f) => (
            <div
              key={f.field}
              className={`rounded-lg border p-3 ${
                f.status === "locked" ? "bg-emerald-50 border-emerald-300" : "bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <code className="text-sm font-semibold">
                      {f.status === "locked" ? "🔒 " : ""}{f.field}
                    </code>
                    {f.kind === "own" ? (
                      <Pill color="bg-emerald-100 text-emerald-800">you own this</Pill>
                    ) : (
                      <>
                        {f.from && (
                          <Pill color={ENTITIES[f.from].color}>from {ENTITIES[f.from].emoji} {ENTITIES[f.from].name}</Pill>
                        )}
                        {f.status === "locked" && <Pill color="bg-emerald-100 text-emerald-800">locked by contract</Pill>}
                      </>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{f.why}</p>
                </div>
                <button onClick={() => removeField(f.field)} className="text-xs text-rose-600 hover:underline">
                  remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center mt-4">
          <button
            onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
            disabled={stepIdx === 0}
            className="rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-30"
          >
            ← Previous
          </button>
          {stepIdx < ORDER_STEPS.length - 1 ? (
            <button
              onClick={() => setCurrentStep((s) => s + 1)}
              className={`${entity.accent} text-white rounded-lg px-4 py-2 text-sm font-medium`}
            >
              Next step →
            </button>
          ) : (
            <Pill color="bg-emerald-100 text-emerald-800">🎉 Order delivered — debrief time!</Pill>
          )}
        </div>
      </Card>

      <Card className="bg-white">
        <h3 className="font-semibold mb-2">➕ Add a field discovered in this step</h3>
        <div className="flex flex-col gap-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={field}
              onChange={(e) => setField(e.target.value)}
              placeholder="Field name"
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
            />
            <input
              value={why}
              onChange={(e) => setWhy(e.target.value)}
              placeholder="Why?"
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg border overflow-hidden text-sm">
              <button
                onClick={() => { setKind("own"); setFrom(""); }}
                className={`px-3 py-2 font-medium ${kind === "own" ? "bg-slate-900 text-white" : "bg-white"}`}
              >
                We own it
              </button>
              <button
                onClick={() => setKind("need")}
                className={`px-3 py-2 font-medium ${kind === "need" ? "bg-slate-900 text-white" : "bg-white"}`}
              >
                Need it from…
              </button>
            </div>
            {kind === "need" && (
              <select
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm"
              >
                <option value="">— which team? —</option>
                {Object.entries(ENTITIES)
                  .filter(([id]) => id !== team)
                  .map(([id, e]) => (
                    <option key={id} value={id}>{e.emoji} {e.name}</option>
                  ))}
              </select>
            )}
            <button
              onClick={() => { addField(kind, field, why, kind === "need" ? from || null : null, stepIdx); setField(""); setWhy(""); setFrom(""); }}
              className={`${entity.accent} text-white rounded-lg px-4 py-2 text-sm font-medium ml-auto`}
            >
              Add
            </button>
          </div>
        </div>
      </Card>

      <Card className="bg-amber-50 border-amber-200">
        <h3 className="font-semibold mb-1">💡 Debrief questions for class</h3>
        <ul className="text-sm text-slate-700 list-disc ml-5 space-y-1">
          <li>Which step stalled because nobody had recorded a field? What was it?</li>
          <li>Which entity had to ask for the most fields — and why?</li>
          <li>Did two teams claim the same field? Who should really own it?</li>
          <li>What would you change in the database so the order flows without phone calls?</li>
        </ul>
      </Card>
    </>
  );
}

function FieldRow({ f, onRemove }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border bg-white p-3">
      <div>
        <code className="text-sm font-semibold">{f.field}</code>
        <p className="text-xs text-slate-500 mt-0.5">{f.why}</p>
      </div>
      <button onClick={onRemove} className="text-xs text-rose-600 hover:underline whitespace-nowrap">
        remove
      </button>
    </div>
  );
}

// ============================================================
// Team selection
// ============================================================

function TeamSelect({ onSelect, onTeacher }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-6">
          <p className="text-xs uppercase tracking-widest text-slate-400">ECON3120 · Database Design Unit</p>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1">Proprint.com Value Chain Builder</h1>
          <p className="text-sm text-slate-500 mt-2">
            Pick your entity team. Your database starts empty — you'll discover what data you own
            and what you need from other teams by role-playing a full order from purchase to
            drop-ship delivery.
          </p>
        </div>
        <div className="grid gap-3">
          {Object.entries(ENTITIES).map(([id, e]) => (
            <button
              key={id}
              onClick={() => onSelect(id)}
              className={`text-left rounded-xl border-2 p-4 hover:scale-[1.01] hover:shadow-md transition ${e.color}`}
            >
              <div className="font-bold text-lg">{e.emoji} {e.name}</div>
              <div className="text-sm mt-1 opacity-80 leading-snug">{e.brief.split(".")[0]}.</div>
            </button>
          ))}
        </div>
        <p className="text-center text-xs text-slate-400 mt-6">~5 teams of 3 · each team on one laptop or phone</p>
        <div className="text-center mt-4">
          <button
            onClick={onTeacher}
            className="text-sm font-medium bg-slate-900 text-white rounded-lg px-5 py-2.5 hover:bg-slate-700 transition"
          >
            🧑‍🏫 Teacher Mode
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Teacher Mode — live board fed by Supabase realtime
// ============================================================

function TeacherMode({ onExit }) {
  const [pool, setPool] = useState({}); // { teamId: [fields] }
  const [contracts, setContracts] = useState([]);
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");

  useEffect(() => {
    const loadAll = async () => {
      const [{ data: rows }, { data: cs }] = await Promise.all([
        supabase.from("team_fields").select("team, fields"),
        supabase.from("contracts").select("*"),
      ]);
      const p = {};
      (rows || []).forEach((r) => (p[r.team] = r.fields || []));
      setPool(p);
      setContracts(cs || []);
    };
    loadAll();

    const channel = supabase
      .channel("teacher")
      .on("postgres_changes", { event: "*", schema: "public", table: "team_fields" }, (payload) => {
        if (payload.new) {
          const { team, fields } = payload.new;
          setPool((p) => ({ ...p, [team]: fields || [] }));
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "contracts" }, (payload) => {
        setContracts((prev) => {
          if (payload.eventType === "DELETE" || payload.old) {
            const del = payload.old || payload.previous;
            return prev.filter((c) => !(del && c.id === del.id));
          }
          const row = payload.new;
          const idx = prev.findIndex((c) => c.id === row.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = row;
            return next;
          }
          return [...prev, row];
        });
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const loadedTeams = Object.keys(pool);

  // default the selectors as teams come online
  useEffect(() => {
    if (!left && loadedTeams[0]) setLeft(loadedTeams[0]);
    if (!right && loadedTeams[1]) setRight(loadedTeams[1]);
  }, [loadedTeams.join(",")]);

  const toggleContract = async (providerTeam, field, neederTeam) => {
    const existing = contracts.find(
      (c) => c.provider_team === providerTeam && c.field === field && c.needer_team === neederTeam
    );
    if (existing) {
      await supabase.from("contracts").delete().eq("id", existing.id);
      setContracts((prev) => prev.filter((c) => c.id !== existing.id));
    } else {
      const { data } = await supabase
        .from("contracts")
        .insert({ provider_team: providerTeam, field, needer_team: neederTeam, locked: true })
        .select()
        .single();
      if (data) setContracts((prev) => [...prev, data]);
    }
  };

  const isLocked = (providerTeam, field, neederTeam) =>
    contracts.some(
      (c) => c.provider_team === providerTeam && c.field === field && c.needer_team === neederTeam
    );

  const bothSelected = left && right && left !== right;

  const renderColumn = (teamId, otherId) => {
    const e = ENTITIES[teamId];
    const fields = pool[teamId] || [];
    const own = fields.filter((f) => f.kind === "own");
    const need = fields.filter((f) => f.kind === "need" && f.from === otherId);

    return (
      <Card key={teamId} className={`${e.color} h-fit`}>
        <h3 className="font-bold mb-2">{e.emoji} {e.name}</h3>

        <h4 className="text-xs font-semibold uppercase tracking-wide mb-1">🗄️ Owns ({own.length})</h4>
        <div className="space-y-1 mb-3">
          {own.length === 0 && (
            <p className="text-xs text-slate-500 italic">No owned fields recorded yet.</p>
          )}
          {own.map((f) => {
            const locked = isLocked(teamId, f.field, otherId);
            return (
              <button
                key={f.field}
                onClick={() => toggleContract(teamId, f.field, otherId)}
                className={`w-full text-left rounded-lg p-2 border transition flex items-start gap-2 ${
                  locked ? "bg-emerald-50 border-emerald-400" : "bg-white/70 border-white hover:bg-white"
                }`}
              >
                <span className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center text-xs flex-shrink-0 ${
                  locked ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300"
                }`}>
                  {locked ? "✓" : ""}
                </span>
                <span>
                  <code className="text-sm font-semibold">{f.field}</code>
                  <span className="block text-xs text-slate-500 mt-0.5">{f.why}</span>
                </span>
              </button>
            );
          })}
        </div>

        <h4 className="text-xs font-semibold uppercase tracking-wide mb-1">
          🔍 Needs from {ENTITIES[otherId].emoji} {ENTITIES[otherId].name}
        </h4>
        <div className="space-y-1">
          {need.length === 0 && (
            <p className="text-xs text-slate-500 italic">Nothing requested from this team yet.</p>
          )}
          {need.map((f) => {
            const locked = isLocked(f.from, f.field, teamId);
            return (
              <div key={f.field} className="rounded-lg bg-white/70 p-2 border border-white">
                <div className="flex flex-wrap items-center gap-1.5">
                  <code className="text-sm font-semibold">{f.field}</code>
                  {locked ? (
                    <Pill color="bg-emerald-100 text-emerald-800">🔒 contract locked</Pill>
                  ) : (
                    <Pill>waiting on negotiation</Pill>
                  )}
                </div>
                <span className="block text-xs text-slate-500 mt-0.5">{f.why}</span>
              </div>
            );
          })}
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="bg-slate-900 text-white px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest opacity-70">ECON3120 · Teacher Mode</p>
            <h1 className="text-xl font-bold">🧑‍🏫 Team Field Board <span className="text-xs font-normal opacity-60">· live</span></h1>
          </div>
          <button onClick={onExit} className="text-xs bg-white/20 hover:bg-white/30 rounded-lg px-3 py-2 font-medium">
            Exit to team view
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-5 space-y-4">
        {loadedTeams.length === 0 && (
          <Card className="bg-white">
            <p className="text-sm text-slate-500">
              No teams have connected yet. As teams open the app and record fields, they'll appear
              here live — no codes to paste.
            </p>
          </Card>
        )}

        {loadedTeams.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {loadedTeams.map((t) => (
              <Pill key={t} color={ENTITIES[t].color}>
                {ENTITIES[t].emoji} {ENTITIES[t].name} · {(pool[t] || []).length} fields
              </Pill>
            ))}
          </div>
        )}

        {loadedTeams.length >= 2 && (
          <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
            <select
              value={left}
              onChange={(e) => {
                setLeft(e.target.value);
                if (e.target.value === right) {
                  const other = loadedTeams.find((t) => t !== e.target.value);
                  if (other) setRight(other);
                }
              }}
              className="border rounded-lg px-3 py-2 text-sm font-medium bg-white"
            >
              {loadedTeams.map((t) => (
                <option key={t} value={t}>{ENTITIES[t].emoji} {ENTITIES[t].name}</option>
              ))}
            </select>
            <span className="font-bold text-slate-400 text-lg">⟷</span>
            <select
              value={right}
              onChange={(e) => setRight(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm font-medium bg-white"
            >
              {loadedTeams.filter((t) => t !== left).map((t) => (
                <option key={t} value={t}>{ENTITIES[t].emoji} {ENTITIES[t].name}</option>
              ))}
            </select>
          </div>
        )}

        {bothSelected && (
          <div className="grid sm:grid-cols-2 gap-3 items-start">
            {renderColumn(left, right)}
            {renderColumn(right, left)}
          </div>
        )}

        {loadedTeams.length === 1 && (
          <Card className="bg-white">
            <p className="text-sm text-slate-500 mb-3">
              One team online. Their fields appear below; another team will show up here as soon
              as they open the app.
            </p>
            {renderColumn(loadedTeams[0], loadedTeams[0])}
          </Card>
        )}
      </main>
    </div>
  );
}
