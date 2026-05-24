import { useState, useRef } from "react";

const COLORS = {
  bg: "#0f1117", surface: "#1a1d27", card: "#21253a",
  red: "#ff4d6d", amber: "#ffb347", green: "#4ade80",
  blue: "#60b4ff", purple: "#b57bee", teal: "#2dd4bf",
  textPrimary: "#f0f2ff", textSecondary: "#8b8fa8", border: "#2e3250",
};

const INITIAL_CLIENTS = [
  { id: 1, name: "Marcus T.", type: "BSP Report", dueDate: "2026-05-26", status: "overdue", invoiced: false, lastSession: "2026-05-20", notes: "Draft 2 in progress", estimatedHours: 0 },
  { id: 2, name: "Priya S.", type: "Session Note", dueDate: "2026-05-25", status: "urgent", invoiced: false, lastSession: "2026-05-24", notes: "Functional assessment needed", estimatedHours: 0 },
  { id: 3, name: "Liam O.", type: "BSP Report", dueDate: "2026-05-28", status: "upcoming", invoiced: true, lastSession: "2026-05-21", notes: "", estimatedHours: 0 },
  { id: 4, name: "Danielle W.", type: "Review Meeting", dueDate: "2026-05-27", status: "urgent", invoiced: false, lastSession: "2026-05-15", notes: "Prepare agenda", estimatedHours: 0 },
  { id: 5, name: "Noah B.", type: "Invoice Due", dueDate: "2026-05-30", status: "upcoming", invoiced: false, lastSession: "2026-05-22", notes: "$1,240 outstanding", estimatedHours: 0 },
  { id: 6, name: "Aisha K.", type: "Session Note", dueDate: "2026-05-24", status: "overdue", invoiced: true, lastSession: "2026-05-23", notes: "", estimatedHours: 0 },
  { id: 7, name: "Ryan C.", type: "BSP Report", dueDate: "2026-06-02", status: "upcoming", invoiced: false, lastSession: "2026-05-19", notes: "Awaiting school data", estimatedHours: 0 },
  { id: 8, name: "Ellie M.", type: "Review Meeting", dueDate: "2026-06-05", status: "steady", invoiced: true, lastSession: "2026-05-18", notes: "", estimatedHours: 0 },
];

const STATUS_CONFIG = {
  overdue:  { label: "Overdue",  color: COLORS.red,   emoji: "🔴", priority: 0 },
  urgent:   { label: "Due Soon", color: COLORS.amber,  emoji: "🟡", priority: 1 },
  upcoming: { label: "Upcoming", color: COLORS.blue,   emoji: "🔵", priority: 2 },
  steady:   { label: "Steady",   color: COLORS.green,  emoji: "🟢", priority: 3 },
};

const TYPE_ICONS = {
  "BSP Report": "📋", "Session Note": "📝",
  "Review Meeting": "🤝", "Invoice Due": "💰",
};

const GREETINGS = [
  "Let's take this one thing at a time, Kelli.",
  "You've got this. One task at a time.",
  "No need to do it all today. Let's find your focus.",
  "Your system has your back. Here's what matters now.",
];

function getDaysUntil(dateStr) {
  const today = new Date("2026-05-24");
  const due = new Date(dateStr);
  return Math.round((due - today) / (1000 * 60 * 60 * 24));
}

function getDueDateLabel(days) {
  if (days < 0) return Math.abs(days) + "d overdue";
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return "Due in " + days + "d";
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.upcoming;
  return (
    <span style={{
      background: cfg.color + "22", color: cfg.color,
      border: "1px solid " + cfg.color + "55",
      borderRadius: 20, padding: "2px 10px",
      fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
    }}>
      {cfg.emoji} {cfg.label}
    </span>
  );
}

function ImportBanner({ onImport }) {
  const fileRef = useRef(null);
  const [flash, setFlash] = useState(null);

  function handleFile(e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(ev) {
      try {
        var data = JSON.parse(ev.target.result);
        if (!data.tasks || !data.participant) throw new Error("bad");
        onImport(data);
        setFlash("✓ " + data.participant.name + " imported — " + data.tasks.length + " task(s) added");
        setTimeout(function() { setFlash(null); }, 4000);
      } catch(err) {
        setFlash("⚠ Could not read file. Export a .bsp from the calculator first.");
        setTimeout(function() { setFlash(null); }, 4000);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  var isSuccess = flash && flash.startsWith("✓");
  var flashColor = isSuccess ? COLORS.teal : COLORS.red;

  return (
    <div
      onClick={function() { if (!flash && fileRef.current) fileRef.current.click(); }}
      style={{
        background: flash ? flashColor + "18" : COLORS.surface,
        border: "1px dashed " + (flash ? flashColor : COLORS.border),
        borderRadius: 12, padding: "12px 18px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 12, marginBottom: 16, cursor: flash ? "default" : "pointer",
        transition: "all 0.3s",
      }}
    >
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: flash ? flashColor : COLORS.textPrimary }}>
          {flash || "⬡ Import from Engagement Plan Calculator"}
        </div>
        {!flash && (
          <div style={{ fontSize: 11, color: COLORS.textSecondary, marginTop: 2 }}>
            Select a .bsp file exported from the calculator — tasks created automatically
          </div>
        )}
      </div>
      {!flash && (
        <div style={{
          background: COLORS.teal + "22", border: "1px solid " + COLORS.teal + "44",
          color: COLORS.teal, borderRadius: 8, padding: "6px 14px",
          fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
        }}>Browse file</div>
      )}
      <input ref={fileRef} type="file" accept=".bsp,.json" style={{ display: "none" }} onChange={handleFile} />
    </div>
  );
}

function CapacityBar({ clients }) {
  var counts = { overdue: 0, urgent: 0, upcoming: 0, steady: 0 };
  clients.forEach(function(c) { if (counts[c.status] !== undefined) counts[c.status]++; });
  var total = clients.length || 1;
  var totalHrs = clients.reduce(function(a, c) { return a + (parseFloat(c.estimatedHours) || 0); }, 0);
  var segments = [
    { key: "overdue",  color: COLORS.red,   label: "Overdue" },
    { key: "urgent",   color: COLORS.amber,  label: "Due soon" },
    { key: "upcoming", color: COLORS.blue,   label: "Upcoming" },
    { key: "steady",   color: COLORS.green,  label: "Steady" },
  ].filter(function(s) { return counts[s.key] > 0; });

  return (
    <div style={{
      background: COLORS.surface, borderRadius: 12,
      padding: "14px 18px", marginBottom: 16, border: "1px solid " + COLORS.border,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, alignItems: "center" }}>
        <div style={{ fontSize: 11, color: COLORS.textSecondary, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 700 }}>
          Caseload Snapshot
        </div>
        {totalHrs > 0 && (
          <div style={{ fontSize: 12, color: COLORS.purple, fontWeight: 700 }}>
            ~{totalHrs.toFixed(0)} hrs estimated
          </div>
        )}
      </div>
      <div style={{ display: "flex", borderRadius: 6, overflow: "hidden", height: 10, marginBottom: 10 }}>
        {segments.map(function(s) {
          return (
            <div key={s.key} style={{ flex: counts[s.key] / total, background: s.color, transition: "flex 0.4s" }} />
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {segments.map(function(s) {
          return (
            <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color }} />
              <span style={{ color: COLORS.textSecondary }}>{counts[s.key]} {s.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DailyBriefing({ clients }) {
  var overdue   = clients.filter(function(c) { return c.status === "overdue"; }).length;
  var urgent    = clients.filter(function(c) { return c.status === "urgent"; }).length;
  var uninvoiced = clients.filter(function(c) { return !c.invoiced; }).length;
  var greeting = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];

  var focusClient = clients
    .filter(function(c) { return c.status === "overdue" || c.status === "urgent"; })
    .sort(function(a, b) { return STATUS_CONFIG[a.status].priority - STATUS_CONFIG[b.status].priority; })[0];

  return (
    <div style={{
      background: "linear-gradient(135deg, #1e1040 0%, #1a1d27 60%, #0d2233 100%)",
      borderRadius: 18, padding: "28px 32px", marginBottom: 20,
      border: "1px solid " + COLORS.border, position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: -40, right: -40, width: 180, height: 180,
        background: "radial-gradient(circle, #b57bee33 0%, transparent 70%)", borderRadius: "50%",
      }} />
      <div style={{ fontSize: 12, color: COLORS.textSecondary, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>
        Sunday 24 May 2026
      </div>
      <div style={{ fontSize: 21, fontWeight: 800, color: COLORS.textPrimary, marginBottom: 4, fontFamily: "Georgia, serif" }}>
        {greeting}
      </div>
      <div style={{ display: "flex", gap: 14, marginTop: 20, flexWrap: "wrap" }}>
        {[
          { label: "Overdue", value: overdue, color: COLORS.red, icon: "🔴" },
          { label: "Due soon", value: urgent, color: COLORS.amber, icon: "🟡" },
          { label: "Not invoiced", value: uninvoiced, color: COLORS.purple, icon: "💜" },
        ].map(function(item) {
          return (
            <div key={item.label} style={{
              background: item.color + "15", border: "1px solid " + item.color + "33",
              borderRadius: 12, padding: "10px 18px", display: "flex", alignItems: "center", gap: 10,
            }}>
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: item.color }}>{item.value}</div>
                <div style={{ fontSize: 11, color: COLORS.textSecondary, textTransform: "uppercase", letterSpacing: 0.5 }}>{item.label}</div>
              </div>
            </div>
          );
        })}
      </div>
      {focusClient && (
        <div style={{
          marginTop: 20, background: "#ffffff08", borderRadius: 10, padding: "12px 16px",
          borderLeft: "3px solid " + STATUS_CONFIG[focusClient.status].color,
        }}>
          <div style={{ fontSize: 12, color: COLORS.textSecondary }}>🎯 SUGGESTED FOCUS RIGHT NOW</div>
          <div style={{ color: COLORS.textPrimary, fontWeight: 700, marginTop: 2 }}>
            {focusClient.name} — {focusClient.type}
            <span style={{ color: STATUS_CONFIG[focusClient.status].color, marginLeft: 10, fontWeight: 400, fontSize: 13 }}>
              {getDueDateLabel(getDaysUntil(focusClient.dueDate))}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function ClientCard({ client, onUpdate }) {
  var [expanded, setExpanded] = useState(false);
  var [editing, setEditing] = useState(false);
  var [noteVal, setNoteVal] = useState(client.notes || "");
  var days = getDaysUntil(client.dueDate);
  var cfg = STATUS_CONFIG[client.status] || STATUS_CONFIG.upcoming;

  return (
    <div
      onClick={function() { setExpanded(function(e) { return !e; }); }}
      style={{
        background: COLORS.card, borderRadius: 14, padding: "16px 20px",
        border: "1px solid " + (expanded ? cfg.color + "66" : COLORS.border),
        cursor: "pointer", transition: "all 0.2s", marginBottom: 10,
        borderLeft: "4px solid " + cfg.color,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 22 }}>{TYPE_ICONS[client.type] || "📌"}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, color: COLORS.textPrimary, fontSize: 15 }}>{client.name}</div>
          <div style={{ fontSize: 12, color: COLORS.textSecondary }}>{client.type}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <StatusBadge status={client.status} />
          <div style={{ fontSize: 12, color: cfg.color, marginTop: 4, fontWeight: 600 }}>
            {getDueDateLabel(days)}
          </div>
        </div>
      </div>

      {expanded && (
        <div
          style={{ marginTop: 16, borderTop: "1px solid " + COLORS.border, paddingTop: 14 }}
          onClick={function(e) { e.stopPropagation(); }}
        >
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: COLORS.textSecondary, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Status</div>
              <select
                value={client.status}
                onChange={function(e) { onUpdate(client.id, "status", e.target.value); }}
                style={{ background: COLORS.surface, border: "1px solid " + COLORS.border, borderRadius: 8, color: COLORS.textPrimary, padding: "6px 10px", fontSize: 13 }}
              >
                {Object.keys(STATUS_CONFIG).map(function(s) { return <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>; })}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, color: COLORS.textSecondary, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Type</div>
              <select
                value={client.type}
                onChange={function(e) { onUpdate(client.id, "type", e.target.value); }}
                style={{ background: COLORS.surface, border: "1px solid " + COLORS.border, borderRadius: 8, color: COLORS.textPrimary, padding: "6px 10px", fontSize: 13 }}
              >
                {Object.keys(TYPE_ICONS).map(function(t) { return <option key={t} value={t}>{t}</option>; })}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, color: COLORS.textSecondary, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Due Date</div>
              <input
                type="date" value={client.dueDate}
                onChange={function(e) { onUpdate(client.id, "dueDate", e.target.value); }}
                style={{ background: COLORS.surface, border: "1px solid " + COLORS.border, borderRadius: 8, color: COLORS.textPrimary, padding: "6px 10px", fontSize: 13 }}
              />
            </div>
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: COLORS.textSecondary, marginBottom: 12 }}>
            <input
              type="checkbox" checked={client.invoiced}
              onChange={function(e) { onUpdate(client.id, "invoiced", e.target.checked); }}
              style={{ accentColor: COLORS.teal, width: 16, height: 16 }}
            />
            <span style={{ color: client.invoiced ? COLORS.teal : COLORS.textSecondary }}>
              {client.invoiced ? "✅ Invoiced" : "Invoice pending"}
            </span>
          </label>

          <div>
            <div style={{ fontSize: 11, color: COLORS.textSecondary, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Notes</div>
            {editing ? (
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={noteVal}
                  onChange={function(e) { setNoteVal(e.target.value); }}
                  style={{ flex: 1, background: COLORS.surface, border: "1px solid " + COLORS.blue, borderRadius: 8, color: COLORS.textPrimary, padding: "6px 10px", fontSize: 13 }}
                  autoFocus
                />
                <button
                  onClick={function() { onUpdate(client.id, "notes", noteVal); setEditing(false); }}
                  style={{ background: COLORS.blue, border: "none", borderRadius: 8, color: "#000", padding: "6px 14px", fontWeight: 700, cursor: "pointer" }}
                >Save</button>
              </div>
            ) : (
              <div
                onClick={function() { setEditing(true); }}
                style={{
                  background: COLORS.surface, borderRadius: 8, padding: "8px 12px",
                  fontSize: 13, color: client.notes ? COLORS.textPrimary : COLORS.textSecondary,
                  cursor: "text", border: "1px solid " + COLORS.border,
                }}
              >
                {client.notes || "Click to add a note..."}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AddClientModal({ onAdd, onClose }) {
  var [form, setForm] = useState({ name: "", type: "BSP Report", dueDate: "", status: "upcoming", invoiced: false, notes: "", estimatedHours: 0 });
  function set(k, v) { setForm(function(f) { return Object.assign({}, f, { [k]: v }); }); }

  var inputStyle = {
    width: "100%", background: COLORS.surface, border: "1px solid " + COLORS.border,
    borderRadius: 8, color: COLORS.textPrimary, padding: "8px 12px", fontSize: 14,
    boxSizing: "border-box", marginBottom: 12,
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "#00000088", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onClose}
    >
      <div
        style={{ background: COLORS.surface, borderRadius: 18, padding: 28, width: "100%", maxWidth: 420, border: "1px solid " + COLORS.border }}
        onClick={function(e) { e.stopPropagation(); }}
      >
        <div style={{ fontWeight: 800, fontSize: 18, color: COLORS.textPrimary, marginBottom: 20 }}>➕ Add Client / Task</div>

        <div style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Client Name</div>
        <input value={form.name} onChange={function(e) { set("name", e.target.value); }} style={inputStyle} placeholder="e.g. Jordan M." />

        <div style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Task Type</div>
        <select value={form.type} onChange={function(e) { set("type", e.target.value); }} style={inputStyle}>
          {Object.keys(TYPE_ICONS).map(function(t) { return <option key={t}>{t}</option>; })}
        </select>

        <div style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Due Date</div>
        <input type="date" value={form.dueDate} onChange={function(e) { set("dueDate", e.target.value); }} style={inputStyle} />

        <div style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Priority</div>
        <select value={form.status} onChange={function(e) { set("status", e.target.value); }} style={inputStyle}>
          {Object.keys(STATUS_CONFIG).map(function(s) { return <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>; })}
        </select>

        <div style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Notes (optional)</div>
        <input value={form.notes} onChange={function(e) { set("notes", e.target.value); }} style={inputStyle} placeholder="e.g. Awaiting school data" />

        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <button onClick={onClose} style={{ flex: 1, background: "transparent", border: "1px solid " + COLORS.border, color: COLORS.textSecondary, borderRadius: 10, padding: "10px", cursor: "pointer", fontSize: 14 }}>Cancel</button>
          <button
            onClick={function() { if (form.name && form.dueDate) { onAdd(form); onClose(); } }}
            style={{ flex: 2, background: COLORS.purple, border: "none", color: "#fff", borderRadius: 10, padding: "10px", cursor: "pointer", fontSize: 14, fontWeight: 700 }}
          >Add Task</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  var [clients, setClients] = useState(INITIAL_CLIENTS);
  var [filter, setFilter] = useState("all");
  var [showAdd, setShowAdd] = useState(false);
  var [search, setSearch] = useState("");

  function updateClient(id, field, value) {
    setClients(function(cs) { return cs.map(function(c) { return c.id === id ? Object.assign({}, c, { [field]: value }) : c; }); });
  }

  function addClient(form) {
    setClients(function(cs) { return cs.concat([Object.assign({}, form, { id: Date.now(), lastSession: "" })]); });
  }

  function handleImport(data) {
    var newClients = data.tasks.map(function(t, i) {
      return Object.assign({}, t, { id: Date.now() + i, estimatedHours: i === 0 ? (data.totalEstimatedHours || 0) : 0, lastSession: "" });
    });
    setClients(function(cs) {
      var existing = {};
      cs.forEach(function(c) { existing[c.name + c.dueDate] = true; });
      var fresh = newClients.filter(function(c) { return !existing[c.name + c.dueDate]; });
      return cs.concat(fresh);
    });
  }

  var filtered = clients
    .filter(function(c) { return filter === "all" || c.status === filter; })
    .filter(function(c) {
      if (!search) return true;
      var s = search.toLowerCase();
      return c.name.toLowerCase().indexOf(s) !== -1 || c.type.toLowerCase().indexOf(s) !== -1;
    })
    .sort(function(a, b) { return (STATUS_CONFIG[a.status] || STATUS_CONFIG.upcoming).priority - (STATUS_CONFIG[b.status] || STATUS_CONFIG.upcoming).priority; });

  var counts = {};
  Object.keys(STATUS_CONFIG).forEach(function(s) { counts[s] = clients.filter(function(c) { return c.status === s; }).length; });

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, fontFamily: "'DM Sans', system-ui, sans-serif", color: COLORS.textPrimary, padding: "24px 20px", maxWidth: 720, margin: "0 auto" }}>
      <style>{"@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&display=swap'); * { box-sizing: border-box; } select, input { outline: none; }"}</style>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 11, color: COLORS.purple, letterSpacing: 3, textTransform: "uppercase", fontWeight: 700 }}>Kelli's</div>
          <div style={{ fontSize: 26, fontWeight: 800, fontFamily: "Georgia, serif", color: COLORS.textPrimary, lineHeight: 1.1 }}>Command Centre</div>
        </div>
        <button
          onClick={function() { setShowAdd(true); }}
          style={{ background: "linear-gradient(135deg, " + COLORS.purple + ", " + COLORS.blue + ")", border: "none", borderRadius: 12, color: "#fff", padding: "10px 18px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
        >＋ Add Task</button>
      </div>

      <DailyBriefing clients={clients} />
      <ImportBanner onImport={handleImport} />
      <CapacityBar clients={clients} />

      <input
        value={search}
        onChange={function(e) { setSearch(e.target.value); }}
        placeholder="🔍  Search client or task type..."
        style={{ width: "100%", background: COLORS.surface, border: "1px solid " + COLORS.border, borderRadius: 12, color: COLORS.textPrimary, padding: "11px 16px", fontSize: 14, marginBottom: 16 }}
      />

      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {[{ key: "all", label: "All", color: COLORS.textSecondary }].concat(
          Object.entries(STATUS_CONFIG).map(function(e) { return { key: e[0], label: e[1].label, color: e[1].color }; })
        ).map(function(tab) {
          return (
            <button
              key={tab.key}
              onClick={function() { setFilter(tab.key); }}
              style={{
                background: filter === tab.key ? tab.color + "22" : "transparent",
                border: "1px solid " + (filter === tab.key ? tab.color : COLORS.border),
                color: filter === tab.key ? tab.color : COLORS.textSecondary,
                borderRadius: 20, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer",
              }}
            >
              {tab.label}
              {tab.key !== "all" && <span style={{ marginLeft: 6, opacity: 0.7 }}>{counts[tab.key] || 0}</span>}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", color: COLORS.textSecondary, padding: 40 }}>No tasks match. You're on top of it! 🎉</div>
      ) : (
        filtered.map(function(c) { return <ClientCard key={c.id} client={c} onUpdate={updateClient} />; })
      )}

      <div style={{ marginTop: 30, textAlign: "center", fontSize: 12, color: COLORS.textSecondary, padding: "16px", background: COLORS.surface, borderRadius: 12, border: "1px solid " + COLORS.border }}>
        💡 <strong style={{ color: COLORS.textPrimary }}>Tap any card</strong> to expand and update status, dates, or notes.
      </div>

      {showAdd && <AddClientModal onAdd={addClient} onClose={function() { setShowAdd(false); }} />}
    </div>
  );
}
