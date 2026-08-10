import React, { useState, useCallback } from "react";
import {
  BarChart3, Map, Table, Gauge, Shield, Radio, Cpu, AlertTriangle,
  TrendingUp, Clock, Target, Trophy, Settings, SlidersHorizontal,
  List, CheckCircle, X, TerminalSquare, Play, ArrowRight, RefreshCw,
  RotateCcw, Download, History, Train, Signal
} from "lucide-react";
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

// MOCK DATA 
const INDIAN_TRAINS = [
  { id: "T01", number: "12301", name: "Howrah Rajdhani",    origin: "Howrah",            destination: "New Delhi",          priority: "HIGH",   type: "Rajdhani" },
  { id: "T02", number: "12951", name: "Mumbai Rajdhani",    origin: "Mumbai Central",    destination: "New Delhi",          priority: "HIGH",   type: "Rajdhani" },
  { id: "T03", number: "22691", name: "Rajdhani Express",   origin: "KSR Bengaluru",     destination: "Hazrat Nizamuddin",  priority: "HIGH",   type: "Rajdhani" },
  { id: "T04", number: "12002", name: "Bhopal Shatabdi",    origin: "New Delhi",         destination: "Habibganj",          priority: "MEDIUM", type: "Shatabdi" },
  { id: "T05", number: "12009", name: "Mumbai Shatabdi",    origin: "Mumbai Central",    destination: "Ahmedabad",          priority: "MEDIUM", type: "Shatabdi" },
  { id: "T06", number: "12051", name: "Janshatabdi Exp",    origin: "Dadar",             destination: "Madgaon",            priority: "MEDIUM", type: "Shatabdi" },
  { id: "T07", number: "11001", name: "Udyan Express",      origin: "Mumbai CST",        destination: "KSR Bengaluru",      priority: "LOW",    type: "Express"  },
  { id: "T08", number: "12629", name: "Karnataka Express",  origin: "New Delhi",         destination: "KSR Bengaluru",      priority: "LOW",    type: "Express"  },
  { id: "T09", number: "12721", name: "Dakshin Express",    origin: "Hazrat Nizamuddin", destination: "Hyderabad",          priority: "LOW",    type: "Express"  },
  { id: "T10", number: "13151", name: "Kolkata Express",    origin: "Jammu Tawi",        destination: "Kolkata",            priority: "LOW",    type: "Express"  },
];

const TRACKS = ["Track-A", "Track-B", "Track-C", "Track-D", "Track-E"];

const STATION_NODES = [
  { id: "S1",  name: "New Delhi",  x: 320, y: 80  },
  { id: "S2",  name: "Mumbai",     x: 120, y: 280 },
  { id: "S3",  name: "Kolkata",    x: 560, y: 100 },
  { id: "S4",  name: "Chennai",    x: 340, y: 420 },
  { id: "S5",  name: "Bengaluru",  x: 240, y: 380 },
  { id: "S6",  name: "Hyderabad",  x: 300, y: 310 },
  { id: "S7",  name: "Ahmedabad",  x: 140, y: 170 },
  { id: "S8",  name: "Bhopal",     x: 280, y: 200 },
  { id: "S9",  name: "Nagpur",     x: 330, y: 260 },
  { id: "S10", name: "Patna",      x: 450, y: 140 },
];

const TRACK_PATHS = [
  { from: "S1",  to: "S8",  track: "Track-A" },
  { from: "S1",  to: "S10", track: "Track-B" },
  { from: "S10", to: "S3",  track: "Track-B" },
  { from: "S1",  to: "S7",  track: "Track-C" },
  { from: "S7",  to: "S2",  track: "Track-C" },
  { from: "S2",  to: "S9",  track: "Track-D" },
  { from: "S8",  to: "S9",  track: "Track-A" },
  { from: "S9",  to: "S6",  track: "Track-D" },
  { from: "S6",  to: "S5",  track: "Track-E" },
  { from: "S5",  to: "S4",  track: "Track-E" },
  { from: "S6",  to: "S4",  track: "Track-D" },
  { from: "S3",  to: "S10", track: "Track-B" },
];

// SIMULATION ENGINE
function generateSimId() {
  return "SIM-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).slice(2,5).toUpperCase();
}
function randInt(min, max)   { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randFloat(min, max) { return parseFloat((Math.random() * (max - min) + min).toFixed(1)); }

function runSimulation(history = []) {
  const simId = generateSimId();
  const schedule = INDIAN_TRAINS.map((train) => {
    const delayFactor = train.priority === "HIGH" ? 0.3 : train.priority === "MEDIUM" ? 0.5 : 0.8;
    const delay    = Math.random() < delayFactor ? randInt(0, 45) : 0;
    const track    = TRACKS[randInt(0, 4)];
    const startH   = randInt(5, 20), startM = randInt(0, 59);
    const endH     = (startH + randInt(2, 16)) % 24;
    const statusCode = delay === 0 ? "ON_TIME" : delay < 15 ? "MINOR_DELAY" : delay < 30 ? "MAJOR_DELAY" : "REASSIGNABLE";
    const nodeIdx  = randInt(0, STATION_NODES.length - 2);
    const fromNode = STATION_NODES[nodeIdx];
    const toNode   = STATION_NODES[nodeIdx + 1];
    const progress = randFloat(0.1, 0.9);
    return {
      ...train, track, delay, statusCode,
      startTime:     `${String(startH).padStart(2,"0")}:${String(startM).padStart(2,"0")}`,
      endTime:       `${String(endH).padStart(2,"0")}:${String(randInt(0,59)).padStart(2,"0")}`,
      rewardContrib: parseFloat((Math.random() * 10 - delay * 0.1).toFixed(2)),
      posX:          fromNode.x + (toNode.x - fromNode.x) * progress,
      posY:          fromNode.y + (toNode.y - fromNode.y) * progress,
    };
  });

  const trackMap = {};
  schedule.forEach(t => { if (!trackMap[t.track]) trackMap[t.track] = []; trackMap[t.track].push(t); });
  const conflicts = [];
  Object.entries(trackMap).forEach(([track, trains]) => {
    if (trains.length > 1) {
      for (let i = 0; i < trains.length - 1; i++) {
        conflicts.push({
          id: `C${i}-${Date.now()}`,
          track,
          train1: trains[i].name,   train1Id: trains[i].id,
          train2: trains[i+1].name, train2Id: trains[i+1].id,
          suggestion:     `Reassign ${trains[i+1].name} to ${TRACKS.filter(t => t !== track)[randInt(0,3)]}`,
          delayReduction: randInt(5, 25),
          throughputGain: randFloat(2, 12),
        });
      }
    }
  });

  const avgDelay    = parseFloat((schedule.reduce((s,t) => s + t.delay, 0) / schedule.length).toFixed(1));
  const onTime      = schedule.filter(t => t.delay === 0).length;
  const throughput  = parseFloat(((onTime / schedule.length) * 100).toFixed(1));
  const rewardScore = parseFloat((100 - avgDelay * 1.5 - conflicts.length * 3 + throughput * 0.5).toFixed(2));
  const prevBest    = history.length > 0 ? Math.max(...history.map(h => h.rewardScore)) : -Infinity;

  return {
    simId, schedule, conflicts, timestamp: new Date().toLocaleTimeString(),
    isBest: rewardScore > prevBest || history.length === 0,
    kpis: { rewardScore, avgDelay, maxThroughput: throughput, totalConflicts: conflicts.length,
             completionRate: parseFloat(((onTime/schedule.length)*100).toFixed(1)), onTime, delayed: schedule.length - onTime },
  };
}

// DESIGN TOKENS
const C = {
  navy:   "#0F172A", royal:  "#1E40AF", accent: "#3B82F6",
  bg:     "#F1F5F9", card:   "#FFFFFF",
  green:  "#16A34A", amber:  "#D97706", red:    "#DC2626",
  gray:   "#64748B", border: "#E2E8F0", muted:  "#94A3B8",
};

const STATUS_COLOR = {
  ON_TIME: C.green, MINOR_DELAY: C.amber, MAJOR_DELAY: C.red, REASSIGNABLE: C.navy,
};
const STATUS_LABEL = {
  ON_TIME: "On Time", MINOR_DELAY: "Minor Delay", MAJOR_DELAY: "Major Delay", REASSIGNABLE: "Reassignable",
};

// SHARED PRIMITIVES
const cardStyle = (extra = {}) => ({
  background: C.card, borderRadius: 16,
  boxShadow: "0 1px 4px rgba(15,23,42,.05), 0 4px 18px rgba(15,23,42,.07)",
  ...extra,
});

function Btn({ children, onClick, disabled, variant = "primary", size = "md", icon: Icon, fullWidth }) {
  const V = {
    primary: { bg: C.royal,  fg: "#fff",   border: "none" },
    dark:    { bg: C.navy,   fg: "#fff",   border: "none" },
    ghost:   { bg: "transparent", fg: C.gray, border: `1.5px solid ${C.border}` },
    danger:  { bg: C.red,    fg: "#fff",   border: "none" },
    success: { bg: C.green,  fg: "#fff",   border: "none" },
    warning: { bg: C.amber,  fg: "#fff",   border: "none" },
    subtle:  { bg: C.bg,     fg: C.navy,   border: `1px solid ${C.border}` },
  };
  const S = {
    sm: { p: "5px 12px",  fs: 11, is: 12 },
    md: { p: "8px 18px",  fs: 12, is: 14 },
    lg: { p: "13px 32px", fs: 14, is: 16 },
  };
  const v = V[variant]; const s = S[size];
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: v.bg, color: v.fg, border: v.border,
      borderRadius: 9, padding: s.p, fontSize: s.fs, fontWeight: 700,
      cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.45 : 1,
      display: "inline-flex", alignItems: "center", gap: 6,
      transition: "opacity .15s", width: fullWidth ? "100%" : undefined,
      justifyContent: "center", fontFamily: "inherit",
    }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.opacity = ".82"; }}
      onMouseLeave={e => { if (!disabled) e.currentTarget.style.opacity = "1"; }}>
      {Icon && <Icon size={s.is} />}{children}
    </button>
  );
}

function Badge({ children, color = C.accent }) {
  return (
    <span style={{ background: `${color}18`, color, borderRadius: 5, padding: "2px 8px",
      fontSize: 10, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase" }}>
      {children}
    </span>
  );
}

function SectionTitle({ children, icon: Icon, sub }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        {Icon && (
          <div style={{ width: 32, height: 32, borderRadius: 8, background: `${C.royal}12`,
            display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon size={16} color={C.royal} />
          </div>
        )}
        <span style={{ fontWeight: 800, fontSize: 14, color: C.navy }}>{children}</span>
      </div>
      {sub && <div style={{ fontSize: 11, color: C.muted, marginTop: 3, marginLeft: 41 }}>{sub}</div>}
    </div>
  );
}

// KPI CARD
function KPICard({ label, value, unit = "", sub, color = C.royal, icon: Icon }) {
  return (
    <div style={{ ...cardStyle({ padding: "18px 22px", flex: 1, minWidth: 140, cursor: "default",
      transition: "transform .18s, box-shadow .18s" }) }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(15,23,42,.13)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: C.gray, letterSpacing: 1, textTransform: "uppercase" }}>{label}</span>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: `${color}14`,
          display: "flex", alignItems: "center", justifyContent: "center" }}>
          {Icon && <Icon size={15} color={color} />}
        </div>
      </div>
      <div style={{ fontSize: 30, fontWeight: 900, color, lineHeight: 1, letterSpacing: -1 }}>
        {value}<span style={{ fontSize: 13, fontWeight: 500, color: C.gray, marginLeft: 3 }}>{unit}</span>
      </div>
      {sub && <div style={{ fontSize: 10, color: C.muted, marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

// TRAIN MAP
function TooltipRow({ icon: Icon, label, value, valueColor }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, marginBottom: 3 }}>
      <span style={{ display: "flex", alignItems: "center", gap: 5, color: "#93C5FD", opacity: 0.75 }}>
        <Icon size={11} />{label}
      </span>
      <span style={{ fontWeight: 700, color: valueColor || "#fff", fontFamily: "monospace" }}>{value}</span>
    </div>
  );
}

function TrainMap({ schedule, conflicts }) {
  const [tooltip, setTooltip] = useState(null);
  const conflictIds = new Set(conflicts.flatMap(c => [c.train1Id, c.train2Id]));
  const stationMap  = Object.fromEntries(STATION_NODES.map(s => [s.id, s]));

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <svg viewBox="0 0 700 500" width="100%" height="100%" style={{ display: "block" }}>
        <defs>
          <pattern id="mapgrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0L0 0 0 40" fill="none" stroke="#E2E8F0" strokeWidth="0.6" />
          </pattern>
          <filter id="stationGlow">
            <feGaussianBlur stdDeviation="2.5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <rect width="700" height="500" fill="#F8FAFC" />
        <rect width="700" height="500" fill="url(#mapgrid)" />

        {/* Track lines */}
        {TRACK_PATHS.map((p, i) => {
          const f = stationMap[p.from], t = stationMap[p.to];
          const conflict = conflicts.some(c => c.track === p.track);
          return (
            <line key={i} x1={f.x} y1={f.y} x2={t.x} y2={t.y}
              stroke={conflict ? "#FCA5A5" : "#CBD5E1"}
              strokeWidth={conflict ? 3.5 : 2}
              strokeDasharray={conflict ? "9 5" : undefined}
              opacity={0.9} />
          );
        })}

        {/* Station nodes */}
        {STATION_NODES.map(s => (
          <g key={s.id}>
            <circle cx={s.x} cy={s.y} r={12} fill={C.royal} stroke="#fff" strokeWidth={2.5} filter="url(#stationGlow)" />
            <circle cx={s.x} cy={s.y} r={5}  fill="#fff" />
            <text x={s.x} y={s.y + 24} textAnchor="middle" fontSize="8.5" fill={C.navy}
              fontWeight="700" fontFamily="monospace">{s.name}</text>
          </g>
        ))}

        {/* Train markers */}
        {schedule.map(train => {
          const color      = STATUS_COLOR[train.statusCode];
          const inConflict = conflictIds.has(train.id);
          return (
            <g key={train.id} style={{ cursor: "pointer" }}
              onMouseEnter={() => setTooltip(train)}
              onMouseLeave={() => setTooltip(null)}>
              {inConflict && (
                <circle cx={train.posX} cy={train.posY} r={14} fill="none" stroke={C.red} strokeWidth={2} opacity={0.5}>
                  <animate attributeName="r"       values="12;19;12" dur="1.6s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.6;0.1;0.6" dur="1.6s" repeatCount="indefinite" />
                </circle>
              )}
              <rect x={train.posX - 11} y={train.posY - 7} width={22} height={14} rx={4}
                fill={color} stroke="#fff" strokeWidth={1.5} />
              <text x={train.posX} y={train.posY + 4} textAnchor="middle"
                fontSize="7" fill="#fff" fontWeight="900" fontFamily="monospace">{train.id}</text>
            </g>
          );
        })}
      </svg>

      {/* Hover tooltip */}
      {tooltip && (
        <div style={{ position: "absolute", bottom: 16, left: 16, background: C.navy, color: "#fff",
          borderRadius: 12, padding: "13px 18px", fontSize: 12, pointerEvents: "none",
          maxWidth: 240, boxShadow: "0 8px 28px rgba(0,0,0,.35)", zIndex: 10, fontFamily: "inherit" }}>
          <div style={{ fontWeight: 800, color: "#93C5FD", fontSize: 13, marginBottom: 10,
            display: "flex", alignItems: "center", gap: 7, borderBottom: "1px solid #1E3A5F", paddingBottom: 8 }}>
            <Train size={13} />{tooltip.name}
          </div>
          <TooltipRow icon={FileText}    label="Number"   value={`#${tooltip.number}`} />
          <TooltipRow icon={GitBranch}   label="Track"    value={tooltip.track} />
          <TooltipRow icon={Clock}       label="Delay"
            value={tooltip.delay > 0 ? `+${tooltip.delay} min` : "On Time"}
            valueColor={tooltip.delay > 0 ? "#FCA5A5" : "#86EFAC"} />
          <TooltipRow icon={Zap}         label="Priority" value={tooltip.priority} />
          <div style={{ marginTop: 8, color: C.muted, fontSize: 10, display: "flex", alignItems: "center", gap: 5 }}>
            <Navigation size={10} />{tooltip.origin} → {tooltip.destination}
          </div>
        </div>
      )}

      {/* Legend */}
      <div style={{ position: "absolute", top: 12, right: 12, background: "rgba(255,255,255,.96)",
        borderRadius: 11, padding: "10px 14px", fontSize: 11,
        boxShadow: "0 2px 12px rgba(0,0,0,.09)", border: `1px solid ${C.border}` }}>
        <div style={{ fontWeight: 800, marginBottom: 8, fontSize: 10, color: C.gray,
          textTransform: "uppercase", letterSpacing: 1, display: "flex", alignItems: "center", gap: 5 }}>
          <Layers size={10} />Legend
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {Object.entries(STATUS_COLOR).map(([status, color]) => (
            <div key={status} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: color }} />
              <span style={{ fontSize: 10, color: C.navy, fontWeight: 600 }}>{STATUS_LABEL[status]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// AI SUGGESTIONS
function AISuggestions({ conflicts, onAccept, onReject }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {conflicts.length === 0 ? (
        <div style={{ textAlign: "center", color: C.gray, padding: "24px 16px" }}>
          <CheckCircle size={32} color={C.green} style={{ margin: "0 auto 12px" }} />
          <div style={{ fontSize: 12, fontWeight: 700, color: C.navy }}>No conflicts detected</div>
          <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>All trains running smoothly</div>
        </div>
      ) : (
        conflicts.map(conflict => (
          <div key={conflict.id} style={{ background: C.bg, borderRadius: 10, padding: "14px",
            border: `1px solid ${C.border}`, transition: "all .2s" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,.08)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.navy }}>{conflict.train1} / {conflict.train2}</div>
              <Badge color={C.red}>Conflict</Badge>
            </div>
            <div style={{ fontSize: 10, color: C.gray, marginBottom: 12, lineHeight: 1.5 }}>
              Both trains assigned to <span style={{ fontFamily: "monospace", color: C.royal, fontWeight: 600 }}>{conflict.track}</span>
            </div>
            <div style={{ background: C.card, borderRadius: 8, padding: "10px", marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.navy, marginBottom: 6 }}>AI Suggestion</div>
              <div style={{ fontSize: 10, color: C.gray, lineHeight: 1.6 }}>{conflict.suggestion}</div>
              <div style={{ display: "flex", gap: 8, marginTop: 8, fontSize: 9, color: C.muted }}>
                <span>⬇️ Delay reduction: {conflict.delayReduction} min</span>
                <span>📈 Throughput gain: {conflict.throughputGain}%</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn variant="success" size="sm" icon={CheckCircle} onClick={() => onAccept(conflict)}>Accept</Btn>
              <Btn variant="ghost" size="sm" icon={X} onClick={() => onReject(conflict)}>Reject</Btn>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// SCHEDULE TABLE
function ScheduleTable({ schedule }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: C.bg, borderBottom: `2px solid ${C.border}` }}>
            <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: C.navy, fontSize: 10 }}>Train</th>
            <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: C.navy, fontSize: 10 }}>Number</th>
            <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: C.navy, fontSize: 10 }}>Origin</th>
            <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: C.navy, fontSize: 10 }}>Destination</th>
            <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: C.navy, fontSize: 10 }}>Priority</th>
            <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: C.navy, fontSize: 10 }}>Track</th>
            <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: C.navy, fontSize: 10 }}>Start</th>
            <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: C.navy, fontSize: 10 }}>End</th>
            <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: C.navy, fontSize: 10 }}>Delay</th>
            <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: C.navy, fontSize: 10 }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {schedule.map(train => (
            <tr key={train.id} style={{ borderBottom: `1px solid ${C.border}`, transition: "background .2s" }}
              onMouseEnter={e => e.currentTarget.style.background = C.bg}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <td style={{ padding: "10px 12px", fontWeight: 600, color: C.navy }}>{train.name}</td>
              <td style={{ padding: "10px 12px", fontFamily: "monospace", color: C.gray }}>#{train.number}</td>
              <td style={{ padding: "10px 12px", color: C.gray }}>{train.origin}</td>
              <td style={{ padding: "10px 12px", color: C.gray }}>{train.destination}</td>
              <td style={{ padding: "10px 12px" }}>
                <Badge color={train.priority === "HIGH" ? C.red : train.priority === "MEDIUM" ? C.amber : C.green}>
                  {train.priority}
                </Badge>
              </td>
              <td style={{ padding: "10px 12px", fontFamily: "monospace", color: C.royal, fontWeight: 600 }}>{train.track}</td>
              <td style={{ padding: "10px 12px", fontFamily: "monospace", color: C.gray }}>{train.startTime}</td>
              <td style={{ padding: "10px 12px", fontFamily: "monospace", color: C.gray }}>{train.endTime}</td>
              <td style={{ padding: "10px 12px", fontFamily: "monospace", fontWeight: 700, 
                color: train.delay > 0 ? C.red : C.green }}>
                {train.delay > 0 ? `+${train.delay}` : "0"} min
              </td>
              <td style={{ padding: "10px 12px" }}>
                <Badge color={STATUS_COLOR[train.statusCode]}>
                  {STATUS_LABEL[train.statusCode]}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ANALYTICS
function Analytics({ history }) {
  const chartData = history.slice(0, 10).reverse().map((sim, i) => ({
    run: i + 1,
    rewardScore: sim.rewardScore,
    throughput: sim.maxThroughput,
    conflicts: sim.totalConflicts,
    avgDelay: sim.avgDelay,
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={cardStyle({ padding: "20px" })}>
        <SectionTitle icon={BarChart3} sub={`${history.length} simulation runs`}>Performance Trends</SectionTitle>
        <div style={{ height: 250 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="run" stroke={C.gray} fontSize={10} />
              <YAxis stroke={C.gray} fontSize={10} />
              <Tooltip contentStyle={{ background: C.navy, border: 'none', borderRadius: 8 }} />
              <Legend />
              <Line type="monotone" dataKey="rewardScore" stroke={C.royal} strokeWidth={2} dot={{ fill: C.royal, r: 3 }} name="Reward Score" />
              <Line type="monotone" dataKey="throughput" stroke={C.green} strokeWidth={2} dot={{ fill: C.green, r: 3 }} name="Throughput %" />
              <Line type="monotone" dataKey="conflicts" stroke={C.red} strokeWidth={2} dot={{ fill: C.red, r: 3 }} name="Conflicts" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        <div style={cardStyle({ padding: "16px" })}>
          <SectionTitle icon={Trophy} sub="Best performing run">Best Score</SectionTitle>
          <div style={{ fontSize: 24, fontWeight: 900, color: C.royal, marginTop: 8 }}>
            {history.length > 0 ? Math.max(...history.map(h => h.rewardScore)).toFixed(1) : "—"}
          </div>
        </div>
        <div style={cardStyle({ padding: "16px" })}>
          <SectionTitle icon={TrendingUp} sub="Average throughput">Avg Throughput</SectionTitle>
          <div style={{ fontSize: 24, fontWeight: 900, color: C.green, marginTop: 8 }}>
            {history.length > 0 ? (history.reduce((sum, h) => sum + h.maxThroughput, 0) / history.length).toFixed(1) : "—"}%
          </div>
        </div>
        <div style={cardStyle({ padding: "16px" })}>
          <SectionTitle icon={AlertTriangle} sub="Average conflicts per run">Avg Conflicts</SectionTitle>
          <div style={{ fontSize: 24, fontWeight: 900, color: C.red, marginTop: 8 }}>
            {history.length > 0 ? (history.reduce((sum, h) => sum + h.totalConflicts, 0) / history.length).toFixed(1) : "—"}
          </div>
        </div>
      </div>
    </div>
  );
}

// ADMIN PANEL
function AdminPanel({ schedule, onOverride, actionLog }) {
  const [form, setForm] = useState({ trainId: "", trainName: "", oldTrack: "", newTrack: "", holdTime: 5, note: "" });
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.trainId && form.newTrack) {
      onOverride({
        ...form,
        time: new Date().toLocaleTimeString()
      });
      setForm({ trainId: "", trainName: "", oldTrack: "", newTrack: "", holdTime: 5, note: "" });
      setShowForm(false);
    }
  };

  return (
    <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
      <div style={cardStyle({ flex: 1, minWidth: 300, padding: "20px" })}>
        <SectionTitle icon={Settings} sub="Manual track reassignment">Manual Override</SectionTitle>
        {!showForm ? (
          <Btn variant="primary" icon={Settings} onClick={() => setShowForm(true)}>Create Override</Btn>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: C.gray, marginBottom: 4 }}>Train ID</label>
                <input type="text" value={form.trainId} onChange={e => setForm({...form, trainId: e.target.value})}
                  style={{ padding: "6px 10px", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 12 }} />
              </div>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: C.gray, marginBottom: 4 }}>New Track</label>
                <select value={form.newTrack} onChange={e => setForm({...form, newTrack: e.target.value})}
                  style={{ padding: "6px 10px", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 12 }}>
                  <option value="">Select track</option>
                  {TRACKS.map(track => <option key={track} value={track}>{track}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: C.gray, marginBottom: 4 }}>Hold Time (minutes)</label>
              <input type="number" min="0" max="60" value={form.holdTime} onChange={e => setForm({...form, holdTime: parseInt(e.target.value)})}
                style={{ padding: "6px 10px", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 12 }} />
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: C.gray, marginBottom: 4 }}>Note</label>
              <input type="text" value={form.note} onChange={e => setForm({...form, note: e.target.value})}
                style={{ padding: "6px 10px", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 12 }} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn variant="primary" type="submit">Apply Override</Btn>
              <Btn variant="ghost" type="button" onClick={() => setShowForm(false)}>Cancel</Btn>
            </div>
          </form>
        )}
      </div>

      <div style={cardStyle({ flex: 1, minWidth: 300, padding: "20px" })}>
        <SectionTitle icon={History} sub={`${actionLog.length} actions logged`}>Action Log</SectionTitle>
        <div style={{ maxHeight: 300, overflowY: "auto" }}>
          {actionLog.length === 0 ? (
            <div style={{ textAlign: "center", color: C.gray, padding: "40px 20px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.navy, marginBottom: 8 }}>No actions logged</div>
              <div style={{ fontSize: 10, color: C.muted }}>Manual actions will appear here</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {actionLog.slice(0, 10).map((log, i) => (
                <div key={i} style={{ background: C.bg, borderRadius: 8, padding: "10px", border: `1px solid ${C.border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <Badge color={log.type === "ACCEPT" ? C.green : log.type === "REJECT" ? C.red : C.royal}>
                      {log.type}
                    </Badge>
                    <span style={{ fontSize: 9, color: C.muted, fontFamily: "monospace" }}>{log.time}</span>
                  </div>
                  <div style={{ fontSize: 10, color: C.gray, lineHeight: 1.5 }}>{log.description}</div>
                  {log.note && <div style={{ fontSize: 9, color: C.muted, marginTop: 4, fontStyle: "italic" }}>Note: {log.note}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// LANDING PAGE
function LandingPage({ onLaunch }) {
  const stats = [
    { label: "Trains Optimized", value: "250+", color: C.royal },
    { label: "Avg Delay Reduced", value: "45%", color: C.green },
    { label: "Conflicts Resolved", value: "98%", color: C.amber },
    { label: "Network Efficiency", value: "92%", color: C.accent },
  ];

  const features = [
    { title: "AI-Powered Scheduling", desc: "Reinforcement learning optimizes train schedules in real-time", Icon: Cpu },
    { title: "Conflict Detection", desc: "Automatic identification and resolution of track conflicts", Icon: AlertTriangle },
    { title: "Live Network View", desc: "Interactive map showing real-time train positions", Icon: Map },
    { title: "Performance Analytics", desc: "Comprehensive metrics and trend analysis", Icon: BarChart3 },
    { title: "Manual Override", desc: "Human operators can override AI decisions when needed", Icon: Settings },
    { title: "Historical Tracking", desc: "Complete log of all decisions and system actions", Icon: History },
  ];

  const [selectedRole, setSelectedRole] = useState(null);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    onLaunch(role);
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "inherit" }}>
      {/* Hero */}
      <section style={{ maxWidth: 920, margin: "0 auto", padding: "100px 40px 72px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 7,
          background: "linear-gradient(90deg, #DBEAFE, #D1FAE5)", borderRadius: 20,
          padding: "6px 18px", fontSize: 12, fontWeight: 700, color: C.royal,
          marginBottom: 28, letterSpacing: 0.3 }}>
          <Signal size={12} />AI-Powered Railway Intelligence Platform
        </div>
        <h1 style={{ fontSize: "clamp(30px, 5vw, 56px)", fontWeight: 900, color: C.navy,
          lineHeight: 1.1, marginBottom: 22, letterSpacing: -2 }}>
          RailOptima – AI Powered<br />
          <span style={{ color: C.royal }}>Real-Time Railway</span> Optimization
        </h1>
        <p style={{ fontSize: 18, color: C.gray, maxWidth: 600, margin: "0 auto 44px", lineHeight: 1.75 }}>
          Harness reinforcement learning to schedule trains with zero conflicts,
          maximum throughput, and adaptive real-time adjustments across complex rail networks.
        </p>

        {/* Role Selection */}
        <div style={{ marginBottom: 60 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: C.navy, marginBottom: 30 }}>
            Select Your Role
          </h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 20,
            maxWidth: 700,
            margin: "0 auto"
          }}>
            {/* Admin Role */}
            <button
              onClick={() => handleRoleSelect('admin')}
              style={{
                background: "linear-gradient(135deg, #ef4444, #dc2626)",
                color: "white",
                border: "none",
                borderRadius: 16,
                padding: "32px 24px",
                cursor: "pointer",
                transition: "all 0.2s",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
                boxShadow: "0 8px 25px rgba(239, 68, 68, 0.15)"
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 12px 35px rgba(239, 68, 68, 0.25)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 8px 25px rgba(239, 68, 68, 0.15)";
              }}
            >
              <span style={{ fontSize: 40 }}>👑</span>
              <div style={{ fontSize: 18, fontWeight: 700 }}>Administrator</div>
              <div style={{ fontSize: 13, opacity: 0.9 }}>Full System Access</div>
            </button>

            {/* Operator Role */}
            <button
              onClick={() => handleRoleSelect('operator')}
              style={{
                background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                color: "white",
                border: "none",
                borderRadius: 16,
                padding: "32px 24px",
                cursor: "pointer",
                transition: "all 0.2s",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
                boxShadow: "0 8px 25px rgba(59, 130, 246, 0.15)"
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 12px 35px rgba(59, 130, 246, 0.25)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 8px 25px rgba(59, 130, 246, 0.15)";
              }}
            >
              <span style={{ fontSize: 40 }}>🚂</span>
              <div style={{ fontSize: 18, fontWeight: 700 }}>Operator</div>
              <div style={{ fontSize: 13, opacity: 0.9 }}>Train Management</div>
            </button>

            {/* Analyst Role */}
            <button
              onClick={() => handleRoleSelect('analyst')}
              style={{
                background: "linear-gradient(135deg, #10b981, #059669)",
                color: "white",
                border: "none",
                borderRadius: 16,
                padding: "32px 24px",
                cursor: "pointer",
                transition: "all 0.2s",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
                boxShadow: "0 8px 25px rgba(16, 185, 129, 0.15)"
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 12px 35px rgba(16, 185, 129, 0.25)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 8px 25px rgba(16, 185, 129, 0.15)";
              }}
            >
              <span style={{ fontSize: 40 }}>📊</span>
              <div style={{ fontSize: 18, fontWeight: 700 }}>Analyst</div>
              <div style={{ fontSize: 13, opacity: 0.9 }}>Analytics & Reports</div>
            </button>
          </div>
        </div>

        <button onClick={() => handleRoleSelect('operator')} style={{
          background: `linear-gradient(135deg, ${C.royal}, ${C.accent})`,
          color: "#fff", border: "none", borderRadius: 14, padding: "16px 48px",
          fontSize: 15, fontWeight: 800, cursor: "pointer",
          boxShadow: `0 8px 32px ${C.royal}55`, transition: "transform .2s, box-shadow .2s",
          display: "inline-flex", alignItems: "center", gap: 10, fontFamily: "inherit",
        }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 14px 40px ${C.royal}80`; }}
          onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = `0 8px 32px ${C.royal}55`; }}
        >
          <Play size={16} />Launch Simulation<ArrowRight size={16} />
        </button>
      </section>

      {/* Stats bar */}
      <section style={{ background: C.navy, padding: "48px 60px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex",
          justifyContent: "space-around", gap: 24, flexWrap: "wrap" }}>
          {stats.map(s => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "clamp(28px,4vw,46px)", fontWeight: 900,
                color: s.color, fontFamily: "monospace", letterSpacing: -1 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "#475569",
                textTransform: "uppercase", letterSpacing: 1.2, marginTop: 6 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ maxWidth: 1040, margin: "0 auto", padding: "80px 40px" }}>
        <h2 style={{ textAlign: "center", fontSize: 30, fontWeight: 800,
          color: C.navy, marginBottom: 48, letterSpacing: -1 }}>Platform Capabilities</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 22 }}>
          {features.map(f => (
            <div key={f.title} style={{ background: C.card, borderRadius: 20, padding: "28px 26px",
              boxShadow: "0 4px 20px rgba(0,0,0,.06)", transition: "transform .2s, box-shadow .2s", cursor: "default" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 36px rgba(0,0,0,.12)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,.06)"; }}>
              <div style={{ width: 46, height: 46, borderRadius: 13, background: `${C.royal}10`,
                display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
                <f.Icon size={22} color={C.royal} />
              </div>
              <div style={{ fontWeight: 800, fontSize: 15, color: C.navy, marginBottom: 8 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: C.gray, lineHeight: 1.65 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: `linear-gradient(135deg, ${C.royal}, #1E3A8A)`,
        padding: "72px 40px", textAlign: "center" }}>
        <h2 style={{ color: "#fff", fontSize: 30, fontWeight: 900, marginBottom: 14, letterSpacing: -1 }}>
          Ready to Optimize Your Network?
        </h2>
        <p style={{ color: "rgba(255,255,255,.7)", marginBottom: 34, fontSize: 16, lineHeight: 1.7 }}>
          Run your first AI-powered simulation in seconds. No configuration required.
        </p>
        <button onClick={onLaunch} style={{
          background: "#fff", color: C.royal, border: "none", borderRadius: 12,
          padding: "14px 44px", fontSize: 15, fontWeight: 800, cursor: "pointer",
          boxShadow: "0 4px 20px rgba(0,0,0,.2)", transition: "transform .2s",
          display: "inline-flex", alignItems: "center", gap: 9, fontFamily: "inherit",
        }}
          onMouseEnter={e => e.currentTarget.style.transform = "scale(1.04)"}
          onMouseLeave={e => e.currentTarget.style.transform = ""}>
          <Play size={15} />Launch Simulation
        </button>
      </section>

      {/* Footer */}
      <footer style={{ background: C.navy, padding: "20px 60px",
        display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <Train size={16} color={C.accent} />
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>RailOptima</span>
        </div>
        <span style={{ color: "#475569", fontSize: 12 }}>AI-Powered Railway Optimization Platform</span>
      </footer>
    </div>
  );
}

// DASHBOARD
const Dashboard = ({ initialSim, userRole, onReset }) => {
  const [sim,       setSim]       = useState(initialSim);
  const [history,   setHistory]   = useState(initialSim ? [initialSim] : []);
  const [actionLog, setActionLog] = useState([]);
  const [activeTab, setActiveTab] = useState("map");
  const [isRunning, setIsRunning] = useState(false);

  const handleLogoClick = () => {
    onReset(); // This will call the reset function which navigates back to landing
  };

  const addToHistory = useCallback((newSim, prev) => {
    const updated = [...prev, newSim];
    const bestScore = Math.max(...updated.map(h => h.kpis.rewardScore));
    return updated.map(h => ({ ...h, isBest: h.kpis.rewardScore === bestScore }));
  }, []);

  const runSim = useCallback(() => {
    setIsRunning(true);
    setTimeout(() => {
      setHistory(prev => {
        const newSim  = runSimulation(prev);
        const updated = addToHistory(newSim, prev);
        setSim(updated.find(h => h.simId === newSim.simId));
        setIsRunning(false);
        return updated;
      });
    }, 1100);
  }, [addToHistory]);

  const rerunSim = useCallback(() => {
    if (!sim) return;
    setIsRunning(true);
    setTimeout(() => {
      setHistory(prev => {
        const newSim  = runSimulation(prev);
        const updated = addToHistory(newSim, prev);
        setSim(updated.find(h => h.simId === newSim.simId));
        setIsRunning(false);
        return updated;
      });
    }, 800);
  }, [sim, addToHistory]);

  const handleAccept = useCallback((conflict) => {
    setSim(prev => {
      if (!prev) return prev;
      
      // Parse suggestion to extract new track: "Reassign [train name] to [Track-X]"
      const match = conflict.suggestion.match(/to\s+(Track-\w+)/i);
      const newTrack = match ? match[1] : conflict.train2Id;
      
      // Update the schedule with new track assignment
      const updatedSchedule = prev.schedule.map(train =>
        train.id === conflict.train2Id ? { ...train, track: newTrack } : train
      );
      
      // Recalculate conflicts with updated schedule
      const trackMap = {};
      updatedSchedule.forEach(t => {
        if (!trackMap[t.track]) trackMap[t.track] = [];
        trackMap[t.track].push(t);
      });
      
      const conflicts = [];
      Object.entries(trackMap).forEach(([track, trains]) => {
        if (trains.length > 1) {
          for (let i = 0; i < trains.length - 1; i++) {
            conflicts.push({
              id: `C${i}-${Date.now()}`,
              track,
              train1: trains[i].name,   train1Id: trains[i].id,
              train2: trains[i+1].name, train2Id: trains[i+1].id,
              suggestion: `Reassign ${trains[i+1].name} to ${TRACKS.filter(t => t !== track)[Math.floor(Math.random()*4)]}`,
              delayReduction: Math.floor(Math.random() * 20 + 5),
              throughputGain: parseFloat((Math.random() * 10 + 2).toFixed(1)),
            });
          }
        }
      });
      
      // Recalculate KPIs
      const avgDelay = parseFloat((updatedSchedule.reduce((s, t) => s + t.delay, 0) / updatedSchedule.length).toFixed(1));
      const onTime = updatedSchedule.filter(t => t.delay === 0).length;
      const throughput = parseFloat(((onTime / updatedSchedule.length) * 100).toFixed(1));
      const rewardScore = parseFloat((100 - avgDelay * 1.5 - conflicts.length * 3 + throughput * 0.5).toFixed(2));
      
      return {
        ...prev,
        schedule: updatedSchedule,
        conflicts,
        kpis: {
          ...prev.kpis,
          rewardScore,
          avgDelay,
          maxThroughput: throughput,
          totalConflicts: conflicts.length,
        },
      };
    });
    
    setActionLog(prev => [...prev, {
      type: "ACCEPT",
      time: new Date().toLocaleTimeString(),
      description: `Accepted: ${conflict.suggestion}`,
      note: "",
    }]);
  }, []);

  const handleReject = useCallback((conflict) => {
    setActionLog(prev => [...prev, {
      type: "REJECT",
      time: new Date().toLocaleTimeString(),
      description: `Rejected AI suggestion for ${conflict.train1} / ${conflict.train2} on ${conflict.track}`,
      note: "",
    }]);
  }, []);

  const handleOverride = useCallback(({ trainId, trainName, oldTrack, newTrack, holdTime, note, time }) => {
    setSim(prev => prev
      ? { ...prev, schedule: prev.schedule.map(t => t.id === trainId ? { ...t, track: newTrack } : t) }
      : prev);
    setActionLog(prev => [...prev, {
      type: "OVERRIDE", time,
      description: `Reassigned ${trainName} from ${oldTrack} → ${newTrack}. Hold: ${holdTime} min.`,
      note,
    }]);
  }, []);

  const TABS = [
    { id: "map",       label: "Live Map",  Icon: Map,      roles: ["admin", "operator", "analyst"] },
    { id: "schedule",  label: "Schedule",  Icon: Table,    roles: ["admin", "operator", "analyst"] },
    { id: "analytics", label: "Analytics", Icon: BarChart2, roles: ["admin", "operator", "analyst"] },
    { id: "admin",     label: "Admin",     Icon: Settings, roles: ["admin", "operator"] },
  ];

  // Filter tabs based on user role
  const availableTabs = TABS.filter(tab => tab.roles.includes(userRole));

  const kpis = sim?.kpis;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "inherit" }}>

      {/* Header */}
      <header style={{ background: C.navy, padding: "0 28px", height: 62,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 16px rgba(0,0,0,.35)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button 
            onClick={handleLogoClick}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 14,
              borderRadius: 9,
              transition: "all 0.2s"
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = "scale(1.05)";
              e.currentTarget.style.background = "rgba(255,255,255,0.1)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.background = "none";
            }}
            title="Click to switch role profile"
          >
            <div style={{ width: 34, height: 34, background: `linear-gradient(135deg, ${C.accent}, ${C.royal})`,
              borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Train size={17} color="#fff" />
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 0 }}>
              <span style={{ fontWeight: 900, fontSize: 17, color: "#fff", letterSpacing: -0.5 }}>Rail</span>
              <span style={{ fontWeight: 900, fontSize: 17, color: C.accent, letterSpacing: -0.5 }}>Optima</span>
            </div>
          </button>
          {userRole && (
            <div style={{
              marginLeft: 4, background: userRole === 'admin' ? "rgba(239, 68, 68, 0.13)" : 
                             userRole === 'operator' ? "rgba(59, 130, 246, 0.13)" : 
                             "rgba(16, 185, 129, 0.13)",
              borderRadius: 6, padding: "3px 10px", fontSize: 11, fontFamily: "monospace",
              color: userRole === 'admin' ? "#93C5FD" : 
                     userRole === 'operator' ? "#93C5FD" : 
                     "#93C5FD", border: "1px solid rgba(59,130,246,.27)",
              display: "flex", alignItems: "center", gap: 5 }}>
              <TerminalSquare size={10} />
              {userRole === 'admin' ? '👑 Admin' : userRole === 'operator' ? '🚂 Operator' : '📊 Analyst'}
            </div>
          )}
          {sim && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%",
                background: C.accent, animation: "pulse 1s infinite" }} />
              <span style={{ fontSize: 11, color: "#93C5FD" }}>Running simulation…</span>
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {userRole === 'admin' && <Btn variant="primary" icon={Play} onClick={runSim} disabled={isRunning}>Run Simulation</Btn>}
          {userRole === 'operator' && <Btn variant="primary" icon={Play} onClick={runSim} disabled={isRunning}>Run Simulation</Btn>}
          {userRole === 'analyst' && <Btn variant="dark" icon={Play} onClick={runSim} disabled={isRunning}>View Simulation</Btn>}
          {userRole !== 'analyst' && <Btn variant="dark" icon={RefreshCw} onClick={rerunSim} disabled={!sim || isRunning}>Re-run</Btn>}
          <Btn variant="ghost" icon={RotateCcw} onClick={onReset}>Reset</Btn>
        </div>
      </header>

      <main style={{ maxWidth: 1600, margin: "0 auto", padding: "24px 24px 48px" }}>

        {/* KPI cards */}
        <div style={{ display: "flex", gap: 14, marginBottom: 24, flexWrap: "wrap" }}>
          <KPICard label="Reward Score"   value={kpis?.rewardScore   ?? "—"}         icon={Trophy}        color={C.royal}                                         sub="RL optimizer score" />
          <KPICard label="Avg Delay"      value={kpis?.avgDelay      ?? "—"} unit="min" icon={Clock}      color={kpis?.avgDelay > 10 ? C.red : C.green}           sub="Per train average" />
          <KPICard label="Max Throughput" value={kpis?.maxThroughput ?? "—"} unit="%"  icon={TrendingUp}  color={C.green}                                         sub="On-time train rate" />
          <KPICard label="Conflicts"      value={kpis?.totalConflicts ?? "—"}         icon={AlertTriangle} color={kpis?.totalConflicts > 2 ? C.red : C.amber}     sub="Active track conflicts" />
          <KPICard label="Completion"     value={kpis?.completionRate ?? "—"} unit="%" icon={Target}      color={C.green}
            sub={kpis ? `${kpis.onTime} on-time · ${kpis.delayed} delayed` : ""} />
        </div>

        {/* Empty state */}
        {!sim ? (
          <div style={cardStyle({ padding: "80px 40px", textAlign: "center" })}>
            <div style={{ width: 72, height: 72, borderRadius: 20, background: `${C.royal}10`,
              display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <Train size={36} color={C.royal} />
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.navy, marginBottom: 10 }}>
              No Simulation Running
            </div>
            <div style={{ fontSize: 14, color: C.gray, marginBottom: 30, lineHeight: 1.65 }}>
              Click "Run Simulation" to start the AI-powered scheduling engine<br />
              and visualize the railway network in real time.
            </div>
            <Btn variant="primary" icon={Play} size="lg" onClick={runSim}>Run Simulation</Btn>
          </div>
        ) : (
          <>
            {/* Tab bar */}
            <div style={{ display: "flex", gap: 4, marginBottom: 20,
              background: C.card, borderRadius: 13, padding: 5, width: "fit-content",
              boxShadow: "0 1px 6px rgba(0,0,0,.06)", border: `1px solid ${C.border}` }}>
              {availableTabs.map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                  background: activeTab === t.id ? C.royal : "transparent",
                  color:      activeTab === t.id ? "#fff" : C.gray,
                  border: "none", borderRadius: 9, padding: "8px 18px", fontSize: 12,
                  fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center",
                  gap: 7, transition: "all .18s", fontFamily: "inherit",
                }}>
                  <t.Icon size={13} />{t.label}
                </button>
              ))}
            </div>

            {/* Live Map tab */}
            {activeTab === "map" && (
              <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
                <div style={cardStyle({ flex: 2, minWidth: 340, padding: 18, minHeight: 530 })}>
                  <div style={{ display: "flex", justifyContent: "space-between",
                    alignItems: "center", marginBottom: 14 }}>
                    <SectionTitle icon={Map} sub={`${sim.schedule.length} trains active · ${sim.conflicts.length} conflicts detected`}>
                      Live Railway Network
                    </SectionTitle>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.green,
                        boxShadow: `0 0 0 3px ${C.green}30` }} />
                      <span style={{ fontSize: 11, color: C.green, fontWeight: 700 }}>LIVE</span>
                    </div>
                  </div>
                  <div style={{ height: 470 }}>
                    <TrainMap schedule={sim.schedule} conflicts={sim.conflicts} />
                  </div>
                </div>

                <div style={cardStyle({ flex: 1, minWidth: 290, padding: 18, display: "flex", flexDirection: "column" })}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                    <SectionTitle icon={Cpu} sub={`${sim.conflicts.length} active suggestions`}>
                      {userRole === 'analyst' ? 'AI Analysis' : 'AI Suggestions'}
                    </SectionTitle>
                    {sim.conflicts.length > 0 && <Badge color={C.red}>{sim.conflicts.length} Active</Badge>}
                  </div>
                  <div style={{ flex: 1, overflowY: "auto", maxHeight: 480 }}>
                    {userRole === 'analyst' ? (
                      <div style={{ padding: "20px", textAlign: "center", color: C.gray }}>
                        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>📊 Analysis View Only</div>
                        <div style={{ fontSize: 12, lineHeight: 1.6 }}>
                          As an Analyst, you can view conflicts and recommendations<br />
                          but cannot modify the schedule. Contact an Operator<br />
                          or Administrator to implement changes.
                        </div>
                        <div style={{ marginTop: 16, padding: "12px", background: C.bg, borderRadius: 8 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: C.navy, marginBottom: 8 }}>
                            Current Conflicts: {sim.conflicts.length}
                          </div>
                          {sim.conflicts.slice(0, 3).map((conflict, i) => (
                            <div key={i} style={{ fontSize: 10, color: C.gray, marginBottom: 4 }}>
                              • {conflict.train1} / {conflict.train2} on {conflict.track}
                            </div>
                          ))}
                          {sim.conflicts.length > 3 && (
                            <div style={{ fontSize: 10, color: C.muted }}>
                              ... and {sim.conflicts.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <AISuggestions conflicts={sim.conflicts} onAccept={handleAccept} onReject={handleReject} />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Schedule tab */}
            {activeTab === "schedule" && (
              <div style={cardStyle({ padding: "22px 26px" })}>
                <SectionTitle icon={Table} sub={`${sim.simId} · ${sim.schedule.length} trains scheduled`}>AI Schedule Table</SectionTitle>
                <ScheduleTable schedule={sim.schedule} />
              </div>
            )}

            {/* Analytics tab */}
            {activeTab === "analytics" && <Analytics history={history} />}

            {/* Admin tab */}
            {activeTab === "admin" && (
              <div>
                <SectionTitle icon={Settings} sub="Manual track assignments and override history">Admin Control Panel</SectionTitle>
                <AdminPanel schedule={sim.schedule} onOverride={handleOverride} actionLog={actionLog} />
              </div>
            )}
          </>
        )}
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,700;0,9..40,800;0,9..40,900;1,9..40,400&family=DM+Mono:wght@400;500;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body, #root { font-family: 'DM Sans', system-ui, sans-serif; }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: .35; transform: scale(1.7); }
        }
        ::-webkit-scrollbar       { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: #F1F5F9; }
        ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 4px; }
      `}</style>
    </div>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("landing");
  const [initialSim, setInitialSim] = useState(null);
  const [userRole, setUserRole] = useState(null);

  const handleLaunch = (role) => {
    setUserRole(role);
    setInitialSim(runSimulation([]));
    setPage("dashboard");
  };

  return page === "landing"
    ? <LandingPage onLaunch={handleLaunch} />
    : <Dashboard initialSim={initialSim} userRole={userRole} onReset={() => { setInitialSim(null); setUserRole(null); setPage("landing"); }} />;
}
