// ScheduleView.jsx
// Wild Child Nosara — Weekly Schedule Viewer
// Drop into src/ and add route /schedule in main.jsx
// Usage: <ScheduleView /> — no props needed

import { useState } from "react";
import logo from "./assets/logo1.svg";
import { supabase } from "./supabase";

// ── Brand colours (matches the rest of the app) ──────────────────────────────
const OLIVE      = "#6b7a3f";
const OLIVE_DARK = "#4d5a2c";
const NAVY       = "#0f1f5c";
const ORANGE     = "#c4682a";
const CREAM      = "#f5f0e8";
const CREAM_DARK = "#e0d8c8";
const TEXT_DARK  = "#1a1a2e";
const TEXT_MID   = "#3d3d5c";
const TEXT_LIGHT = "#7a7a9a";
const GREEN      = "#5a7a3a";

// ── Day theme colours (from the original schedule poster) ────────────────────
const DAY_THEMES = {
  MON: { bg: "#3d5a52", light: "#e8f0ee", label: "Moon Day · Lunes",    element: "Water · Agua",    feeling: "Belonging, Caring · Pertenecer, Cuidar" },
  TUE: { bg: "#b85c2a", light: "#faeee6", label: "Mars Day · Martes",   element: "Fire · Fuego",    feeling: "Strength, Will, Boundaries · Fuerza, Voluntad, Límites" },
  WED: { bg: "#6b8f71", light: "#eaf2eb", label: "Mercury Day · Miércoles", element: "Mineral",    feeling: "Creativity, Language, Connection · Creatividad, Lenguaje, Conexión" },
  THU: { bg: "#1a2a4a", light: "#e6eaf2", label: "Jupiter Day · Jueves", element: "Air · Aire",     feeling: "Wisdom, Trust, Ancestral Skills · Sabiduría, Confianza, Tradición" },
  FRI: { bg: "#c4784a", light: "#faeee8", label: "Venus Day · Viernes",  element: "Earth · Tierra", feeling: "Beauty, Love, Community · Belleza, Amor, Comunidad" },
};

// ── Activity colour palette (by teacher/type) ────────────────────────────────
const ACT_COLORS = {
  circle:    { bg: "#dce8f0", border: "#9bbdd4", text: TEXT_DARK },
  jenne:     { bg: "#d6e8d6", border: "#88b888", text: "#2a4a2a" },
  dunnia:    { bg: "#e8e0d6", border: "#c4a882", text: "#4a3820" },
  victoria:  { bg: "#f0dce8", border: "#c89ab8", text: "#4a1a38" },
  ruben:     { bg: "#fae8d0", border: "#d4a060", text: "#4a2800" },
  daniel:    { bg: "#f0e8c8", border: "#c8a840", text: "#3a2800" },
  carina:    { bg: "#e8d8f0", border: "#a870c8", text: "#2a0a40" },
  snack:     { bg: "#fdf6e8", border: "#e0cc88", text: "#4a3800" },
  lunch:     { bg: "#fdf6e8", border: "#e0cc88", text: "#4a3800" },
  pottery:   { bg: "#f0e8d0", border: "#c8a060", text: "#3a2000" },
};

function actColor(teacher) {
  if (!teacher) return ACT_COLORS.snack;
  const t = teacher.toLowerCase();
  if (t.includes("jenne"))    return ACT_COLORS.jenne;
  if (t.includes("dunnia"))   return ACT_COLORS.dunnia;
  if (t.includes("victoria")) return ACT_COLORS.victoria;
  if (t.includes("ruben"))    return ACT_COLORS.ruben;
  if (t.includes("daniel"))   return ACT_COLORS.daniel;
  if (t.includes("carina"))   return ACT_COLORS.carina;
  return ACT_COLORS.circle;
}

// ── Schedule data ─────────────────────────────────────────────────────────────
// Each block: { time, timeEs, name, nameEs, teacher, type }
// type: "circle"|"activity"|"snack"|"lunch"|"project"

const SHARED_CIRCLE = {
  time: "8:00 – 9:00 am", name: "Circle Time & Gardening",
  nameEs: "Círculo de la mañana y jardinería", type: "circle",
};
const SHARED_SNACK = {
  time: "10:00 – 10:30 am", name: "Snack & Hand-washing ritual",
  nameEs: "Merienda · Ritual de lavado de manos y merienda orgánica", type: "snack",
};
const SHARED_LUNCH = {
  time: "11:45 am – 12:30 pm", name: "Wholesome Lunch & Outdoor Play",
  nameEs: "Almuerzo saludable y juego exterior", type: "lunch",
};

const SCHEDULES = {
  may: {
    label: "May 2026",
    MON: [
      SHARED_CIRCLE,
      { time: "9:00 – 10:00 am", name: "Permaculture", nameEs: "Permacultura", teacher: "Jenne", type: "activity" },
      SHARED_SNACK,
      { time: "10:30 – 11:45 am", name: "Storytelling", nameEs: "Narración de cuentos", teacher: "Dunnia", type: "activity" },
      SHARED_LUNCH,
      { time: "12:30 – 2:00 pm", name: "Dunnia Project", nameEs: "Proyecto con Dunnia", teacher: "Dunnia", type: "project" },
    ],
    TUE: [
      SHARED_CIRCLE,
      { time: "9:00 – 10:00 am", name: "Capoeira", nameEs: "Capoeira", teacher: "Jenne", type: "activity" },
      SHARED_SNACK,
      { time: "10:30 – 11:45 am", name: "Cosmic Education & Numeracy", nameEs: "Educación Cósmica y Matemáticas", teacher: "Victoria", type: "activity" },
      SHARED_LUNCH,
      { time: "12:30 – 2:00 pm", name: "Dunnia Project", nameEs: "Proyecto con Dunnia", teacher: "Dunnia", type: "project" },
    ],
    WED: [
      SHARED_CIRCLE,
      { time: "9:00 – 10:00 am", name: "Nature Walk", nameEs: "Caminata por la naturaleza", teacher: "Dunnia", type: "activity" },
      SHARED_SNACK,
      { time: "10:30 – 11:45 am", name: "Cosmic Education & Numeracy", nameEs: "Educación Cósmica y Matemáticas", teacher: "Victoria", type: "activity" },
      SHARED_LUNCH,
      { time: "12:30 – 2:00 pm", name: "Dunnia Project", nameEs: "Proyecto con Dunnia", teacher: "Dunnia", type: "project" },
    ],
    THU: [
      SHARED_CIRCLE,
      { time: "9:00 – 10:00 am", name: "Baking & Nutrition", nameEs: "Horneado y nutrición", teacher: "Jenne", type: "activity" },
      SHARED_SNACK,
      { time: "10:30 – 11:45 am", name: "Storytelling", nameEs: "Narración de cuentos", teacher: "Dunnia", type: "activity" },
      SHARED_LUNCH,
      { time: "12:30 – 2:00 pm", name: "Pottery", nameEs: "Alfarería", teacher: "Daniel", type: "activity" },
    ],
    FRI: [
      SHARED_CIRCLE,
      { time: "9:00 – 10:00 am", name: "Drumming", nameEs: "Percusión", teacher: "Ruben", type: "activity" },
      SHARED_SNACK,
      { time: "10:30 – 11:45 am", name: "Botany & Geography", nameEs: "Botánica y Geografía", teacher: "Victoria", type: "activity" },
      SHARED_LUNCH,
      { time: "12:30 – 2:00 pm", name: "Dunnia Project", nameEs: "Proyecto con Dunnia", teacher: "Dunnia", type: "project" },
    ],
  },
  jun: {
    label: "June 2026",
    MON: [
      SHARED_CIRCLE,
      { time: "9:00 – 10:00 am", name: "Permaculture", nameEs: "Permacultura", teacher: "Jenne", type: "activity" },
      SHARED_SNACK,
      { time: "10:30 – 11:15 am", name: "Music & Singing", nameEs: "Música y canto", teacher: "Ruben", type: "activity" },
      { time: "11:15 – 11:45 am", name: "Storytelling", nameEs: "Narración de cuentos", teacher: "Dunnia", type: "activity" },
      SHARED_LUNCH,
      { time: "12:30 – 2:00 pm", name: "Project with Dunnia", nameEs: "Proyecto con Dunnia", teacher: "Dunnia", type: "project" },
    ],
    TUE: [
      SHARED_CIRCLE,
      { time: "9:00 – 10:00 am", name: "Capoeira", nameEs: "Capoeira", teacher: "Jenne", type: "activity" },
      SHARED_SNACK,
      { time: "10:30 – 11:45 am", name: "Cosmic Education & Numeracy", nameEs: "Educación Cósmica y Matemáticas", teacher: "Victoria", type: "activity" },
      SHARED_LUNCH,
      { time: "12:30 – 2:00 pm", name: "Leadership", nameEs: "Liderazgo", teacher: "Carina", type: "activity" },
    ],
    WED: [
      SHARED_CIRCLE,
      { time: "9:00 – 10:00 am", name: "Nature Walk", nameEs: "Caminata por la naturaleza", teacher: "Dunnia", type: "activity" },
      SHARED_SNACK,
      { time: "10:30 – 11:45 am", name: "Cosmic Education & Numeracy", nameEs: "Educación Cósmica y Matemáticas", teacher: "Victoria", type: "activity" },
      SHARED_LUNCH,
      { time: "12:30 – 2:00 pm", name: "Leadership", nameEs: "Liderazgo", teacher: "Carina", type: "activity" },
    ],
    THU: [
      SHARED_CIRCLE,
      { time: "9:00 – 10:00 am", name: "Baking & Nutrition", nameEs: "Horneado y nutrición", teacher: "Jenne", type: "activity" },
      SHARED_SNACK,
      { time: "10:30 – 11:15 am", name: "Music & Singing", nameEs: "Música y canto", teacher: "Ruben", type: "activity" },
      { time: "11:15 – 11:45 am", name: "Storytelling", nameEs: "Narración de cuentos", teacher: "Dunnia", type: "activity" },
      SHARED_LUNCH,
      { time: "12:30 – 2:00 pm", name: "Pottery", nameEs: "Alfarería", teacher: "Daniel", type: "activity" },
    ],
    FRI: [
      SHARED_CIRCLE,
      { time: "9:00 – 10:00 am", name: "Drumming", nameEs: "Percusión", teacher: "Ruben", type: "activity" },
      SHARED_SNACK,
      { time: "10:30 – 11:45 am", name: "Cosmic Education & Numeracy", nameEs: "Educación Cósmica y Matemáticas", teacher: "Victoria", type: "activity" },
      SHARED_LUNCH,
      { time: "12:30 – 2:00 pm", name: "Project with Dunnia", nameEs: "Proyecto con Dunnia", teacher: "Dunnia", type: "project" },
    ],
  },
};

const DAYS = ["MON","TUE","WED","THU","FRI"];
const DAY_FULL = { MON:"Monday",TUE:"Tuesday",WED:"Wednesday",THU:"Thursday",FRI:"Friday" };

// ── Sub-components ────────────────────────────────────────────────────────────

function ActivityBlock({ block, compact }) {
  const isSnackOrLunch = block.type === "snack" || block.type === "lunch";
  const colors = isSnackOrLunch ? ACT_COLORS.snack : actColor(block.teacher);

  return (
    <div style={{
      background: colors.bg,
      border: `1.5px solid ${colors.border}`,
      borderRadius: "10px",
      padding: compact ? "8px 10px" : "11px 13px",
      marginBottom: "6px",
    }}>
      <div style={{ fontSize: compact ? "10px" : "11px", color: TEXT_LIGHT, marginBottom: "2px", letterSpacing: "0.3px" }}>
        {block.time}
      </div>
      <div style={{ fontSize: compact ? "12px" : "13px", color: colors.text, fontWeight: 500, lineHeight: 1.3 }}>
        {block.name}
      </div>
      {block.nameEs && !isSnackOrLunch && (
        <div style={{ fontSize: compact ? "10px" : "11px", color: colors.text, opacity: 0.7, fontStyle: "italic", marginTop: "1px" }}>
          {block.nameEs}
        </div>
      )}
      {block.teacher && (
        <div style={{ fontSize: compact ? "10px" : "11px", color: colors.text, opacity: 0.75, marginTop: "3px" }}>
          with {block.teacher}
        </div>
      )}
    </div>
  );
}

function DayHeader({ day, compact }) {
  const theme = DAY_THEMES[day];
  return (
    <div style={{
      background: theme.bg,
      borderRadius: "10px 10px 0 0",
      padding: compact ? "10px 10px 8px" : "12px 14px 10px",
      marginBottom: "8px",
      color: "#fff",
    }}>
      <div style={{ fontSize: compact ? "11px" : "12px", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "2px" }}>
        {DAY_FULL[day]}
      </div>
      <div style={{ fontSize: compact ? "10px" : "11px", opacity: 0.85, marginBottom: "2px" }}>
        {theme.label}
      </div>
      {!compact && (
        <>
          <div style={{ fontSize: "10px", opacity: 0.75, marginTop: "4px" }}>
            🌿 {theme.element}
          </div>
          <div style={{ fontSize: "10px", opacity: 0.65, marginTop: "2px", fontStyle: "italic", lineHeight: 1.3 }}>
            {theme.feeling}
          </div>
        </>
      )}
    </div>
  );
}

// ── Week view — all 5 days side by side ──────────────────────────────────────
function WeekView({ schedule }) {
  return (
    <div style={{ overflowX: "auto", paddingBottom: "8px" }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, minmax(160px, 1fr))",
        gap: "10px",
        minWidth: "820px",
      }}>
        {DAYS.map(day => (
          <div key={day}>
            <DayHeader day={day} compact />
            <div style={{ paddingTop: "2px" }}>
              {schedule[day].map((block, i) => (
                <ActivityBlock key={i} block={block} compact />
              ))}
            </div>
          </div>
        ))}
      </div>
      <p style={{ fontSize: "11px", color: TEXT_LIGHT, textAlign: "center", marginTop: "16px", fontStyle: "italic" }}>
        *Schedule may flow and adjust based on the group's energy and natural rhythm
        / El horario puede fluir y ajustarse según la energía del grupo y el ritmo natural
      </p>
    </div>
  );
}

// ── Day view — single day, expanded ──────────────────────────────────────────
function DayView({ schedule, selectedDay, onSelectDay }) {
  const theme = DAY_THEMES[selectedDay];
  return (
    <div>
      {/* Day picker tabs */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "16px", flexWrap: "wrap" }}>
        {DAYS.map(day => {
          const t = DAY_THEMES[day];
          const active = day === selectedDay;
          return (
            <button key={day} onClick={() => onSelectDay(day)}
              style={{
                flex: "1 1 auto",
                background: active ? t.bg : "#fff",
                color: active ? "#fff" : TEXT_MID,
                border: `1.5px solid ${active ? t.bg : CREAM_DARK}`,
                borderRadius: "8px",
                padding: "8px 10px",
                fontSize: "12px",
                fontFamily: "Georgia, serif",
                cursor: "pointer",
                fontWeight: active ? 600 : 400,
                transition: "all .15s",
                minWidth: "80px",
              }}>
              {DAY_FULL[day].slice(0, 3)}
            </button>
          );
        })}
      </div>

      {/* Expanded day card */}
      <div style={{
        background: "#fff",
        border: `1px solid ${CREAM_DARK}`,
        borderRadius: "12px",
        overflow: "hidden",
      }}>
        {/* Full day header */}
        <div style={{ background: theme.bg, padding: "20px 22px", color: "#fff" }}>
          <div style={{ fontSize: "20px", fontWeight: 700, marginBottom: "4px" }}>
            {DAY_FULL[selectedDay]}
          </div>
          <div style={{ fontSize: "14px", opacity: 0.9, marginBottom: "8px" }}>
            {theme.label}
          </div>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            <div style={{ fontSize: "12px", opacity: 0.8 }}>🌿 Element: {theme.element}</div>
          </div>
          <div style={{ fontSize: "12px", opacity: 0.7, marginTop: "4px", fontStyle: "italic", lineHeight: 1.5 }}>
            {theme.feeling}
          </div>
        </div>

        {/* Activities list */}
        <div style={{ padding: "16px" }}>
          {schedule[selectedDay].map((block, i) => (
            <ActivityBlock key={i} block={block} compact={false} />
          ))}
          <p style={{ fontSize: "11px", color: TEXT_LIGHT, textAlign: "center", marginTop: "12px", fontStyle: "italic" }}>
            *Schedule may flow and adjust based on the group's energy and natural rhythm
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Legend ────────────────────────────────────────────────────────────────────
function Legend() {
  const items = [
    { label: "Jenne",    color: ACT_COLORS.jenne },
    { label: "Dunnia",   color: ACT_COLORS.dunnia },
    { label: "Victoria", color: ACT_COLORS.victoria },
    { label: "Ruben",    color: ACT_COLORS.ruben },
    { label: "Daniel",   color: ACT_COLORS.daniel },
    { label: "Carina",   color: ACT_COLORS.carina },
    { label: "Snack / Lunch", color: ACT_COLORS.snack },
    { label: "Circle Time",   color: ACT_COLORS.circle },
  ];
  return (
    <div style={{
      display: "flex", flexWrap: "wrap", gap: "8px",
      padding: "12px 14px", background: "#fff",
      border: `1px solid ${CREAM_DARK}`, borderRadius: "10px", marginBottom: "16px",
    }}>
      <span style={{ fontSize: "11px", color: TEXT_LIGHT, letterSpacing: "1px", textTransform: "uppercase", width: "100%", marginBottom: "4px" }}>
        Teachers & Activities
      </span>
      {items.map(({ label, color }) => (
        <div key={label} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <div style={{
            width: "12px", height: "12px", borderRadius: "3px",
            background: color.bg, border: `1.5px solid ${color.border}`,
          }}/>
          <span style={{ fontSize: "11px", color: TEXT_MID }}>{label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Kids Moon Club note ───────────────────────────────────────────────────────
function MoonClubBanner() {
  return (
    <div style={{
      background: "linear-gradient(135deg, #f5e6c8 0%, #faf0e0 100%)",
      border: `1.5px solid #d4a860`,
      borderRadius: "10px",
      padding: "12px 16px",
      marginBottom: "16px",
      display: "flex",
      alignItems: "center",
      gap: "12px",
    }}>
      <span style={{ fontSize: "22px" }}>🌙</span>
      <div>
        <p style={{ fontSize: "13px", color: "#4a3000", fontWeight: 600, margin: "0 0 2px" }}>
          Kids Moon Club — Before & After Care
        </p>
        <p style={{ fontSize: "12px", color: "#7a5000", margin: 0, lineHeight: 1.4 }}>
          Available on demand every day · 4–7pm or 5–8pm · Weekend options available
        </p>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function ScheduleView() {
  const [month, setMonth]       = useState("may");   // "may" | "jun"
  const [viewMode, setViewMode] = useState("week");  // "week" | "day"
  const [selectedDay, setSelectedDay] = useState("MON");

  const schedule = SCHEDULES[month];

  const signOut = async () => { await supabase.auth.signOut(); window.location.href = "/login"; };

  return (
    <div style={{ fontFamily: "Georgia, serif", background: CREAM, minHeight: "100vh", color: TEXT_DARK }}>
      <style>{`
        html, body, #root { margin:0; padding:0; width:100%; }
        * { box-sizing: border-box; }
        @media (max-width: 600px) {
          .schedule-header-actions { flex-direction: column !important; align-items: flex-start !important; }
        }
      `}</style>

      {/* Header */}
      <div style={{ background: OLIVE_DARK, height: "90px", overflow: "hidden", position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px" }}>
        <a href="/portal" style={{ position: "relative", zIndex: 2, textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: "8px", padding: "8px 14px", color: "#fff", fontSize: "12px", fontFamily: "Georgia,serif", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>
          ← Portal
        </a>
        <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-40%)" }}>
          <img src={logo} alt="Wild Child Nosara" style={{ height: "180px", objectFit: "contain" }}/>
        </div>
        <button onClick={signOut} style={{ position: "relative", zIndex: 2, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: "8px", padding: "8px 14px", color: "#fff", fontSize: "12px", fontFamily: "Georgia,serif", cursor: "pointer", letterSpacing: "0.5px" }}>
          Sign Out
        </button>
      </div>

      {/* Page title bar */}
      <div style={{ background: NAVY, padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <p style={{ color: "#fff", fontSize: "16px", margin: "0 0 2px", fontWeight: 400 }}>Weekly Schedule</p>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px", margin: 0 }}>Ages 5–9 · Wild Explorers</p>
        </div>
        <a href="/" style={{ background: ORANGE, color: "#fff", textDecoration: "none", borderRadius: "8px", padding: "8px 16px", fontSize: "12px", letterSpacing: "1px", textTransform: "uppercase", fontFamily: "Georgia,serif", whiteSpace: "nowrap" }}>
          + Enroll More Weeks
        </a>
      </div>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "24px 16px 80px", width: "100%" }}>

        <MoonClubBanner />

        {/* Controls: month picker + view toggle */}
        <div className="schedule-header-actions" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>

          {/* Month tabs */}
          <div style={{ display: "flex", gap: "6px" }}>
            {[{key:"may",label:"May 2026"},{key:"jun",label:"June 2026"}].map(opt => (
              <button key={opt.key} onClick={() => setMonth(opt.key)}
                style={{
                  background: month === opt.key ? OLIVE : "#fff",
                  color: month === opt.key ? "#fff" : TEXT_MID,
                  border: `1.5px solid ${month === opt.key ? OLIVE : CREAM_DARK}`,
                  borderRadius: "8px",
                  padding: "9px 18px",
                  fontSize: "13px",
                  fontFamily: "Georgia, serif",
                  cursor: "pointer",
                  fontWeight: month === opt.key ? 600 : 400,
                  transition: "all .15s",
                }}>
                {opt.label}
              </button>
            ))}
          </div>

          {/* View toggle */}
          <div style={{ display: "flex", background: "#fff", border: `1px solid ${CREAM_DARK}`, borderRadius: "8px", overflow: "hidden" }}>
            {[{key:"week",label:"📅 Week"},{key:"day",label:"☀️ Day"}].map(opt => (
              <button key={opt.key} onClick={() => setViewMode(opt.key)}
                style={{
                  background: viewMode === opt.key ? CREAM_DARK : "#fff",
                  color: viewMode === opt.key ? TEXT_DARK : TEXT_LIGHT,
                  border: "none",
                  padding: "8px 16px",
                  fontSize: "13px",
                  fontFamily: "Georgia, serif",
                  cursor: "pointer",
                  fontWeight: viewMode === opt.key ? 600 : 400,
                  transition: "all .15s",
                }}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <Legend />

        {/* Schedule view */}
        {viewMode === "week"
          ? <WeekView schedule={schedule} />
          : <DayView schedule={schedule} selectedDay={selectedDay} onSelectDay={setSelectedDay} />
        }

      </div>
    </div>
  );
}
