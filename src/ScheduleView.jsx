// ScheduleView.jsx — Wild Child Nosara
// Time-proportional schedule: 8:00am – 2:00pm (360 min)
// Programs: Wild Roots (5–9) | Earth Leaders (9–12)
// Wild Roots:    May (A) | Jun/Jul/Aug (B)
// Earth Leaders: Jun (C) | Jul/Aug (C with Independent Work replacing Boxing)

import { useState } from "react";
import logo from "./assets/logo1.svg";
import { supabase } from "./supabase";

// ── Brand colours ─────────────────────────────────────────────────────────────
const OLIVE      = "#6b7a3f";
const OLIVE_DARK = "#4d5a2c";
const NAVY       = "#0f1f5c";
const ORANGE     = "#c4682a";
const CREAM      = "#f5f0e8";
const CREAM_DARK = "#e0d8c8";
const TEXT_DARK  = "#1a1a2e";
const TEXT_MID   = "#3d3d5c";
const TEXT_LIGHT = "#7a7a9a";

// ── Day themes ────────────────────────────────────────────────────────────────
const DAY_THEMES = {
  MON: { bg:"#3d5a52", label:"Moon Day · Lunes",        element:"Water · Agua",    feeling:"Belonging, Caring · Pertenecer, Cuidar" },
  TUE: { bg:"#b85c2a", label:"Mars Day · Martes",       element:"Fire · Fuego",    feeling:"Strength, Will, Boundaries · Fuerza, Voluntad, Límites" },
  WED: { bg:"#5a7a60", label:"Mercury Day · Miércoles", element:"Mineral",         feeling:"Creativity, Language, Connection · Creatividad, Lenguaje, Conexión" },
  THU: { bg:"#1e2e50", label:"Jupiter Day · Jueves",    element:"Air · Aire",      feeling:"Wisdom, Trust, Ancestral Skills · Sabiduría, Confianza, Tradición" },
  FRI: { bg:"#c4784a", label:"Venus Day · Viernes",     element:"Earth · Tierra",  feeling:"Beauty, Love, Community · Belleza, Amor, Comunidad" },
};

// ── Activity colours ──────────────────────────────────────────────────────────
const C = {
  circle:   { bg:"#d8e8f2", border:"#8ab0cc", text:"#1a3048" },
  jenne:    { bg:"#d4e8d4", border:"#7ab07a", text:"#1a3a1a" },
  dunnia:   { bg:"#e8ddd0", border:"#c0a070", text:"#3a2810" },
  victoria: { bg:"#f0d8e8", border:"#c080a8", text:"#3a0830" },
  ruben:    { bg:"#fce8cc", border:"#d09040", text:"#3a1800" },
  daniel:   { bg:"#ece8c0", border:"#b8a030", text:"#2a2000" },
  carina:   { bg:"#e0d0f0", border:"#9060c8", text:"#1a0038" },
  snack:    { bg:"#fdf4dc", border:"#d8b840", text:"#3a2800" },
  blue:     { bg:"#d0e4f8", border:"#5080c0", text:"#0a1f48" }, // Independent Work
};

function colorFor(block) {
  if (block.type === "snack" || block.type === "lunch") return C.snack;
  if (block.type === "independent") return C.blue;
  const t = (block.teacher || "").toLowerCase();
  if (t.includes("jenne"))    return C.jenne;
  if (t.includes("dunnia"))   return C.dunnia;
  if (t.includes("victoria")) return C.victoria;
  if (t.includes("ruben"))    return C.ruben;
  if (t.includes("daniel"))   return C.daniel;
  if (t.includes("carina"))   return C.carina;
  return C.circle;
}

// ── Time helpers ──────────────────────────────────────────────────────────────
const DAY_START = 8 * 60;
const DAY_SPAN  = 6 * 60;

function parseRange(str) {
  const nums = str.match(/(\d{1,2}):(\d{2})/g);
  if (!nums || nums.length < 2) return { start: DAY_START, end: DAY_START + 60, duration: 60 };
  const toMin = (s) => { const [h, m] = s.split(":").map(Number); return h * 60 + m; };
  let start = toMin(nums[0]);
  let end   = toMin(nums[1]);
  if (end < start || end <= 7 * 60) end += 12 * 60;
  return { start, end, duration: end - start };
}

// ── Schedule data — Wild Roots (5–9) ─────────────────────────────────────────
const CIRCLE_WR = { time:"8:00 – 9:00 am",      name:"Circle Time & Gardening",        nameEs:"Círculo de la mañana y jardinería",    type:"circle"   };
const SNACK_WR  = { time:"10:00 – 10:30 am",     name:"Snack & Hand-washing",           nameEs:"Merienda y ritual de lavado de manos", type:"snack"    };
const LUNCH_WR  = { time:"11:45 am – 12:30 pm",  name:"Lunch & Outdoor Play",           nameEs:"Almuerzo saludable y juego exterior",  type:"lunch"    };

// Wild Roots May
const WR_A = {
  MON: [ CIRCLE_WR,
    { time:"9:00 – 10:00 am",   name:"Permaculture",                nameEs:"Permacultura",                     teacher:"Jenne",    type:"activity" },
    SNACK_WR,
    { time:"10:30 – 11:45 am",  name:"Storytelling",                nameEs:"Narración de cuentos",             teacher:"Dunnia",   type:"activity" },
    LUNCH_WR,
    { time:"12:30 – 2:00 pm",   name:"Dunnia Project",              nameEs:"Proyecto con Dunnia",              teacher:"Dunnia",   type:"project"  },
  ],
  TUE: [ CIRCLE_WR,
    { time:"9:00 – 10:00 am",   name:"Capoeira",                    nameEs:"Capoeira",                         teacher:"Jenne",    type:"activity" },
    SNACK_WR,
    { time:"10:30 – 11:45 am",  name:"Cosmic Education & Numeracy", nameEs:"Educación Cósmica y Matemáticas",  teacher:"Victoria", type:"activity" },
    LUNCH_WR,
    { time:"12:30 – 2:00 pm",   name:"Dunnia Project",              nameEs:"Proyecto con Dunnia",              teacher:"Dunnia",   type:"project"  },
  ],
  WED: [ CIRCLE_WR,
    { time:"9:00 – 10:00 am",   name:"Nature Walk",                 nameEs:"Caminata por la naturaleza",       teacher:"Dunnia",   type:"activity" },
    SNACK_WR,
    { time:"10:30 – 11:45 am",  name:"Cosmic Education & Numeracy", nameEs:"Educación Cósmica y Matemáticas",  teacher:"Victoria", type:"activity" },
    LUNCH_WR,
    { time:"12:30 – 2:00 pm",   name:"Dunnia Project",              nameEs:"Proyecto con Dunnia",              teacher:"Dunnia",   type:"project"  },
  ],
  THU: [ CIRCLE_WR,
    { time:"9:00 – 10:00 am",   name:"Baking & Nutrition",          nameEs:"Horneado y nutrición",             teacher:"Jenne",    type:"activity" },
    SNACK_WR,
    { time:"10:30 – 11:45 am",  name:"Storytelling",                nameEs:"Narración de cuentos",             teacher:"Dunnia",   type:"activity" },
    LUNCH_WR,
    { time:"12:30 – 2:00 pm",   name:"Pottery",                     nameEs:"Alfarería",                        teacher:"Daniel",   type:"activity" },
  ],
  FRI: [ CIRCLE_WR,
    { time:"9:00 – 10:00 am",   name:"Drumming",                    nameEs:"Percusión",                        teacher:"Ruben",    type:"activity" },
    SNACK_WR,
    { time:"10:30 – 11:45 am",  name:"Botany & Geography",          nameEs:"Botánica y Geografía",             teacher:"Victoria", type:"activity" },
    LUNCH_WR,
    { time:"12:30 – 2:00 pm",   name:"Dunnia Project",              nameEs:"Proyecto con Dunnia",              teacher:"Dunnia",   type:"project"  },
  ],
};

// Wild Roots Jun/Jul/Aug
const WR_B = {
  MON: [ CIRCLE_WR,
    { time:"9:00 – 10:00 am",   name:"Permaculture",                nameEs:"Permacultura",                     teacher:"Jenne",    type:"activity" },
    SNACK_WR,
    { time:"10:30 – 11:15 am",  name:"Music & Singing",             nameEs:"Música y canto",                   teacher:"Ruben",    type:"activity" },
    { time:"11:15 – 11:45 am",  name:"Storytelling",                nameEs:"Narración de cuentos",             teacher:"Dunnia",   type:"activity" },
    LUNCH_WR,
    { time:"12:30 – 2:00 pm",   name:"Project with Dunnia",         nameEs:"Proyecto con Dunnia",              teacher:"Dunnia",   type:"project"  },
  ],
  TUE: [ CIRCLE_WR,
    { time:"9:00 – 10:00 am",   name:"Capoeira",                    nameEs:"Capoeira",                         teacher:"Jenne",    type:"activity" },
    SNACK_WR,
    { time:"10:30 – 11:45 am",  name:"Cosmic Education & Numeracy", nameEs:"Educación Cósmica y Matemáticas",  teacher:"Victoria", type:"activity" },
    LUNCH_WR,
    { time:"12:30 – 2:00 pm",   name:"Leadership",                  nameEs:"Liderazgo",                        teacher:"Carina",   type:"activity" },
  ],
  WED: [ CIRCLE_WR,
    { time:"9:00 – 10:00 am",   name:"Nature Walk",                 nameEs:"Caminata por la naturaleza",       teacher:"Dunnia",   type:"activity" },
    SNACK_WR,
    { time:"10:30 – 11:45 am",  name:"Cosmic Education & Numeracy", nameEs:"Educación Cósmica y Matemáticas",  teacher:"Victoria", type:"activity" },
    LUNCH_WR,
    { time:"12:30 – 2:00 pm",   name:"Leadership",                  nameEs:"Liderazgo",                        teacher:"Carina",   type:"activity" },
  ],
  THU: [ CIRCLE_WR,
    { time:"9:00 – 10:00 am",   name:"Baking & Nutrition",          nameEs:"Horneado y nutrición",             teacher:"Jenne",    type:"activity" },
    SNACK_WR,
    { time:"10:30 – 11:15 am",  name:"Music & Singing",             nameEs:"Música y canto",                   teacher:"Ruben",    type:"activity" },
    { time:"11:15 – 11:45 am",  name:"Storytelling",                nameEs:"Narración de cuentos",             teacher:"Dunnia",   type:"activity" },
    LUNCH_WR,
    { time:"12:30 – 2:00 pm",   name:"Pottery",                     nameEs:"Alfarería",                        teacher:"Daniel",   type:"activity" },
  ],
  FRI: [ CIRCLE_WR,
    { time:"9:00 – 10:00 am",   name:"Drumming",                    nameEs:"Percusión",                        teacher:"Ruben",    type:"activity" },
    SNACK_WR,
    { time:"10:30 – 11:45 am",  name:"Cosmic Education & Numeracy", nameEs:"Educación Cósmica y Matemáticas",  teacher:"Victoria", type:"activity" },
    LUNCH_WR,
    { time:"12:30 – 2:00 pm",   name:"Project with Dunnia",         nameEs:"Proyecto con Dunnia",              teacher:"Dunnia",   type:"project"  },
  ],
};

// ── Schedule data — Earth Leaders (9–12) ─────────────────────────────────────
const SNACK_EL  = { time:"10:00 – 10:15 am", name:"Snack & Hand-washing",           nameEs:"Merienda y ritual de lavado de manos", type:"snack"    };
const LUNCH_EL  = { time:"12:00 – 12:30 pm", name:"Lunch & Outdoor Play",           nameEs:"Almuerzo saludable y juego exterior",  type:"lunch"    };

const BOXING    = { time:"10:15 – 11:15 am", name:"Boxing",                         nameEs:"Boxeo",                                type:"activity" };
const INDEP     = { time:"10:15 – 11:15 am", name:"Independent Work",               nameEs:"Trabajo independiente",                teacher:"Dunnia", type:"independent" };
const LEADERSHIP_LAB = { time:"11:15 am – 12:00 pm", name:"Leadership Lab",         nameEs:"Laboratorio de Liderazgo",             teacher:"Carina", type:"activity" };

// Earth Leaders June (C)
const EL_C = {
  MON: [
    { time:"9:00 – 10:00 am",   name:"Permaculture",                nameEs:"Permacultura",                     teacher:"Jenne",    type:"activity" },
    SNACK_EL,
    BOXING,
    LEADERSHIP_LAB,
    LUNCH_EL,
    { time:"12:30 – 2:00 pm",   name:"Activism Session",            nameEs:"Sesión de activismo",              teacher:"Carina",   type:"activity" },
  ],
  TUE: [
    { time:"9:00 – 10:00 am",   name:"Capoeira",                    nameEs:"Capoeira",                         teacher:"Jenne",    type:"activity" },
    SNACK_EL,
    { time:"10:15 – 11:15 am",  name:"Cosmic Education & Numeracy", nameEs:"Educación Cósmica y Matemáticas",  teacher:"Victoria", type:"activity" },
    LEADERSHIP_LAB,
    LUNCH_EL,
    { time:"12:30 – 2:00 pm",   name:"Community Partnership",       nameEs:"Asociación comunitaria",           nameNote:"with 5–9 year olds", teacher:"Carina", type:"activity" },
  ],
  WED: [
    { time:"9:00 – 10:00 am",   name:"Nature Walk",                 nameEs:"Caminata por la naturaleza",       teacher:"Dunnia",   type:"activity" },
    SNACK_EL,
    BOXING,
    LEADERSHIP_LAB,
    LUNCH_EL,
    { time:"12:30 – 2:00 pm",   name:"Community Partnership",       nameEs:"Asociación comunitaria",           nameNote:"with 5–9 year olds", teacher:"Carina", type:"activity" },
  ],
  THU: [
    { time:"9:00 – 10:00 am",   name:"Baking & Nutrition",          nameEs:"Horneado y nutrición",             teacher:"Jenne",    type:"activity" },
    SNACK_EL,
    BOXING,
    LEADERSHIP_LAB,
    LUNCH_EL,
    { time:"12:30 – 2:00 pm",   name:"Activism Session",            nameEs:"Sesión de activismo",              teacher:"Carina",   type:"activity" },
  ],
  FRI: [
    { time:"9:00 – 10:00 am",   name:"Drumming",                    nameEs:"Percusión",                        teacher:"Ruben",    type:"activity" },
    SNACK_EL,
    BOXING,
    LEADERSHIP_LAB,
    LUNCH_EL,
    { time:"12:30 – 2:00 pm",   name:"Activism Session",            nameEs:"Sesión de activismo",              teacher:"Carina",   type:"activity" },
  ],
};

// Earth Leaders Jul/Aug (D) — same as C but Boxing → Independent Work (blue, supervised by Dunnia)
const EL_D = {
  MON: [
    { time:"9:00 – 10:00 am",   name:"Permaculture",                nameEs:"Permacultura",                     teacher:"Jenne",    type:"activity" },
    SNACK_EL,
    INDEP,
    LEADERSHIP_LAB,
    LUNCH_EL,
    { time:"12:30 – 2:00 pm",   name:"Activism Session",            nameEs:"Sesión de activismo",              teacher:"Carina",   type:"activity" },
  ],
  TUE: [
    { time:"9:00 – 10:00 am",   name:"Capoeira",                    nameEs:"Capoeira",                         teacher:"Jenne",    type:"activity" },
    SNACK_EL,
    { time:"10:15 – 11:15 am",  name:"Cosmic Education & Numeracy", nameEs:"Educación Cósmica y Matemáticas",  teacher:"Victoria", type:"activity" },
    LEADERSHIP_LAB,
    LUNCH_EL,
    { time:"12:30 – 2:00 pm",   name:"Community Partnership",       nameEs:"Asociación comunitaria",           nameNote:"with 5–9 year olds", teacher:"Carina", type:"activity" },
  ],
  WED: [
    { time:"9:00 – 10:00 am",   name:"Nature Walk",                 nameEs:"Caminata por la naturaleza",       teacher:"Dunnia",   type:"activity" },
    SNACK_EL,
    INDEP,
    LEADERSHIP_LAB,
    LUNCH_EL,
    { time:"12:30 – 2:00 pm",   name:"Community Partnership",       nameEs:"Asociación comunitaria",           nameNote:"with 5–9 year olds", teacher:"Carina", type:"activity" },
  ],
  THU: [
    { time:"9:00 – 10:00 am",   name:"Baking & Nutrition",          nameEs:"Horneado y nutrición",             teacher:"Jenne",    type:"activity" },
    SNACK_EL,
    INDEP,
    LEADERSHIP_LAB,
    LUNCH_EL,
    { time:"12:30 – 2:00 pm",   name:"Activism Session",            nameEs:"Sesión de activismo",              teacher:"Carina",   type:"activity" },
  ],
  FRI: [
    { time:"9:00 – 10:00 am",   name:"Drumming",                    nameEs:"Percusión",                        teacher:"Ruben",    type:"activity" },
    SNACK_EL,
    INDEP,
    LEADERSHIP_LAB,
    LUNCH_EL,
    { time:"12:30 – 2:00 pm",   name:"Activism Session",            nameEs:"Sesión de activismo",              teacher:"Carina",   type:"activity" },
  ],
};

// ── Schedule map ──────────────────────────────────────────────────────────────
const SCHEDULES = {
  "wr-may": { label:"May 2026",    data: WR_A },
  "wr-jun": { label:"June 2026",   data: WR_B },
  "wr-jul": { label:"July 2026",   data: WR_B },
  "wr-aug": { label:"August 2026", data: WR_B },
  "el-jun": { label:"June 2026",   data: EL_C },
  "el-jul": { label:"July 2026",   data: EL_D },
  "el-aug": { label:"August 2026", data: EL_D },
};

const MONTHS_WR = ["wr-may","wr-jun","wr-jul","wr-aug"];
const MONTHS_EL = ["el-jun","el-jul","el-aug"];

const DAYS      = ["MON","TUE","WED","THU","FRI"];
const DAY_FULL  = { MON:"Monday",TUE:"Tuesday",WED:"Wednesday",THU:"Thursday",FRI:"Friday" };
const DAY_SHORT = { MON:"Mon",   TUE:"Tue",    WED:"Wed",      THU:"Thu",     FRI:"Fri"    };

const HOURS     = [8,9,10,11,12,13,14];
const HOUR_LBLS = ["8am","9am","10am","11am","12pm","1pm","2pm"];

// ── Single time-proportional block ────────────────────────────────────────────
function Block({ block, ppm }) {
  const { start, end, duration } = parseRange(block.time);
  const topPx    = (start - DAY_START) * ppm;
  const heightPx = Math.max(duration * ppm - 2, 16);
  const col      = colorFor(block);
  const tiny     = heightPx < 28;
  const small    = heightPx < 44;

  return (
    <div style={{
      position:"absolute", top:topPx+"px", left:"2px", right:"2px", height:heightPx+"px",
      background:col.bg, border:`1.5px solid ${col.border}`, borderRadius:"6px",
      padding:tiny?"2px 5px":"4px 7px", overflow:"hidden",
      display:"flex", flexDirection:"column", justifyContent:"center", zIndex:1,
    }}>
      <div style={{
        fontSize:tiny?"8px":small?"10px":"11px", fontWeight:600, color:col.text,
        lineHeight:1.2, overflow:"hidden", textOverflow:"ellipsis",
        whiteSpace:tiny?"nowrap":"normal",
        display:"-webkit-box", WebkitLineClamp:tiny?1:2, WebkitBoxOrient:"vertical",
      }}>
        {block.name}{block.nameNote ? ` (${block.nameNote})` : ""}
      </div>
      {!small && block.teacher && (
        <div style={{ fontSize:"9px", color:col.text, opacity:0.72, marginTop:"1px" }}>
          {block.teacher}
        </div>
      )}
    </div>
  );
}

function DayColumn({ blocks, ppm }) {
  const totalH = DAY_SPAN * ppm;
  return (
    <div style={{ flex:1, position:"relative", height:totalH+"px", minWidth:0 }}>
      {HOURS.map(h => (
        <div key={h} style={{
          position:"absolute", top:((h*60-DAY_START)*ppm)+"px",
          left:0, right:0, height:"1px", background:"rgba(0,0,0,0.07)", zIndex:0,
        }}/>
      ))}
      {blocks.map((b,i) => <Block key={i} block={b} ppm={ppm} />)}
    </div>
  );
}

function TimeRuler({ ppm, width }) {
  const totalH = DAY_SPAN * ppm;
  return (
    <div style={{ width:width+"px", flexShrink:0, position:"relative", height:totalH+"px" }}>
      {HOURS.map((h,i) => (
        <div key={h} style={{
          position:"absolute", top:((h*60-DAY_START)*ppm)+"px", right:"4px",
          fontSize:"9px", color:TEXT_LIGHT, lineHeight:1,
          transform:"translateY(-50%)", textAlign:"right", whiteSpace:"nowrap",
        }}>{HOUR_LBLS[i]}</div>
      ))}
    </div>
  );
}

function WeekView({ schedule }) {
  const ppm = 1.9;
  return (
    <div style={{ overflowX:"auto", paddingBottom:"8px" }}>
      <div style={{ minWidth:"580px" }}>
        <div style={{ display:"flex", marginLeft:"36px", gap:"3px", marginBottom:"4px" }}>
          {DAYS.map(day => {
            const t = DAY_THEMES[day];
            return (
              <div key={day} style={{ flex:1, background:t.bg, borderRadius:"7px 7px 0 0", padding:"7px 4px 5px", textAlign:"center", color:"#fff" }}>
                <div style={{ fontSize:"10px", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.5px" }}>{DAY_SHORT[day]}</div>
                <div style={{ fontSize:"8px", opacity:0.78, marginTop:"1px", lineHeight:1.2 }}>{t.label.split("·")[0].trim()}</div>
              </div>
            );
          })}
        </div>
        <div style={{ display:"flex", gap:"3px" }}>
          <TimeRuler ppm={ppm} width={36} />
          {DAYS.map(day => (
            <div key={day} style={{ flex:1, background:"rgba(255,255,255,0.65)", borderRadius:"0 0 7px 7px", minWidth:0, overflow:"hidden" }}>
              <DayColumn blocks={schedule[day]} ppm={ppm} />
            </div>
          ))}
        </div>
        <p style={{ fontSize:"10px", color:TEXT_LIGHT, textAlign:"center", marginTop:"14px", fontStyle:"italic", lineHeight:1.5 }}>
          *Schedule may flow and adjust based on the group's energy and natural rhythm ·
          El horario puede fluir y ajustarse según la energía del grupo y el ritmo natural
        </p>
      </div>
    </div>
  );
}

function DayView({ schedule, selectedDay, onSelectDay }) {
  const theme = DAY_THEMES[selectedDay];
  const ppm   = 1.7;
  return (
    <div>
      <div style={{ display:"flex", gap:"4px", marginBottom:"12px" }}>
        {DAYS.map(day => {
          const t      = DAY_THEMES[day];
          const active = day === selectedDay;
          return (
            <button key={day} onClick={() => onSelectDay(day)} style={{
              flex:1, minWidth:0,
              background:  active ? t.bg : "#fff",
              color:       active ? "#fff" : TEXT_MID,
              border:      `1.5px solid ${active ? t.bg : CREAM_DARK}`,
              borderRadius:"8px", padding:"8px 2px", fontSize:"11px",
              fontFamily:"Georgia, serif", cursor:"pointer",
              fontWeight:active?700:400, transition:"all .15s", textAlign:"center",
            }}>{DAY_SHORT[day]}</button>
          );
        })}
      </div>
      <div style={{ background:"#fff", border:`1px solid ${CREAM_DARK}`, borderRadius:"12px", overflow:"hidden" }}>
        <div style={{ background:theme.bg, padding:"14px 18px", color:"#fff" }}>
          <div style={{ fontSize:"17px", fontWeight:700, marginBottom:"2px" }}>{DAY_FULL[selectedDay]}</div>
          <div style={{ fontSize:"12px", opacity:0.88, marginBottom:"6px" }}>{theme.label}</div>
          <div style={{ fontSize:"11px", opacity:0.75 }}>🌿 {theme.element}</div>
          <div style={{ fontSize:"11px", opacity:0.62, marginTop:"3px", fontStyle:"italic", lineHeight:1.4 }}>{theme.feeling}</div>
        </div>
        <div style={{ padding:"12px 10px 14px", display:"flex", gap:"6px" }}>
          <TimeRuler ppm={ppm} width={32} />
          <div style={{ flex:1, background:"rgba(0,0,0,0.02)", borderRadius:"6px", minWidth:0, overflow:"hidden" }}>
            <DayColumn blocks={schedule[selectedDay]} ppm={ppm} />
          </div>
        </div>
      </div>
      <p style={{ fontSize:"10px", color:TEXT_LIGHT, textAlign:"center", marginTop:"10px", fontStyle:"italic" }}>
        *Schedule may flow and adjust based on the group's energy and natural rhythm
      </p>
    </div>
  );
}

function Legend({ program }) {
  const baseItems = [
    { label:"Circle / Gardening", c:C.circle   },
    { label:"Jenne",              c:C.jenne    },
    { label:"Dunnia",             c:C.dunnia   },
    { label:"Victoria",           c:C.victoria },
    { label:"Ruben",              c:C.ruben    },
    { label:"Daniel",             c:C.daniel   },
    { label:"Carina",             c:C.carina   },
    { label:"Snack & Lunch",      c:C.snack    },
  ];
  const elItems = [
    ...baseItems,
    { label:"Independent Work (Dunnia)", c:C.blue },
  ];
  const items = program === "el" ? elItems : baseItems;
  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap:"5px 10px", padding:"10px 12px", background:"#fff", border:`1px solid ${CREAM_DARK}`, borderRadius:"10px", marginBottom:"12px" }}>
      <span style={{ fontSize:"9px", color:TEXT_LIGHT, letterSpacing:"1px", textTransform:"uppercase", width:"100%", marginBottom:"2px" }}>Teachers & Activities</span>
      {items.map(({ label, c }) => (
        <div key={label} style={{ display:"flex", alignItems:"center", gap:"4px" }}>
          <div style={{ width:"10px", height:"10px", borderRadius:"2px", background:c.bg, border:`1.5px solid ${c.border}`, flexShrink:0 }}/>
          <span style={{ fontSize:"10px", color:TEXT_MID }}>{label}</span>
        </div>
      ))}
    </div>
  );
}

function MoonClubBanner() {
  return (
    <div style={{ background:"linear-gradient(135deg,#f5e6c8,#faf0e0)", border:`1.5px solid #d4a860`, borderRadius:"10px", padding:"10px 14px", marginBottom:"12px", display:"flex", alignItems:"center", gap:"10px" }}>
      <span style={{ fontSize:"18px", flexShrink:0 }}>🌙</span>
      <div>
        <p style={{ fontSize:"12px", color:"#4a3000", fontWeight:600, margin:"0 0 1px" }}>Kids Moon Club — Before & After Care</p>
        <p style={{ fontSize:"11px", color:"#7a5000", margin:0, lineHeight:1.4 }}>On demand every day · 4–7pm or 5–8pm · Weekend options available</p>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ScheduleView() {
  const [program,     setProgram]     = useState("wr"); // "wr" | "el"
  const [month,       setMonth]       = useState("wr-may");
  const [viewMode,    setViewMode]    = useState("day");
  const [selectedDay, setSelectedDay] = useState("MON");

  const monthKeys = program === "wr" ? MONTHS_WR : MONTHS_EL;

  // When switching program, reset to first available month
  function switchProgram(p) {
    setProgram(p);
    setMonth(p === "wr" ? "wr-may" : "el-jun");
  }

  const schedule = SCHEDULES[month].data;

  const signOut = async () => { await supabase.auth.signOut(); window.location.href = "/login"; };

  return (
    <div style={{ fontFamily:"Georgia, serif", background:CREAM, minHeight:"100vh", color:TEXT_DARK }}>
      <style>{`
        html, body, #root { margin:0; padding:0; width:100%; }
        * { box-sizing: border-box; }
        .wk-toggle { display: flex; }
        @media (max-width: 600px) { .wk-toggle { display: none !important; } }
      `}</style>

      {/* Header */}
      <div style={{ background:OLIVE_DARK, height:"90px", overflow:"hidden", position:"relative", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 20px" }}>
        <a href="/portal" style={{ position:"relative", zIndex:2, textDecoration:"none", background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.25)", borderRadius:"8px", padding:"8px 14px", color:"#fff", fontSize:"12px", fontFamily:"Georgia,serif", letterSpacing:"0.5px", whiteSpace:"nowrap" }}>
          ← Portal
        </a>
        <div style={{ position:"absolute", left:"50%", top:"50%", transform:"translate(-50%,-40%)" }}>
          <img src={logo} alt="Wild Child Nosara" style={{ height:"180px", objectFit:"contain" }}/>
        </div>
        <button onClick={signOut} style={{ position:"relative", zIndex:2, background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.25)", borderRadius:"8px", padding:"8px 14px", color:"#fff", fontSize:"12px", fontFamily:"Georgia,serif", cursor:"pointer" }}>
          Sign Out
        </button>
      </div>

      {/* Title bar */}
      <div style={{ background:NAVY, padding:"11px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"8px" }}>
        <div>
          <p style={{ color:"#fff", fontSize:"15px", margin:"0 0 1px", fontWeight:400 }}>Weekly Schedule</p>
          <p style={{ color:"rgba(255,255,255,0.55)", fontSize:"11px", margin:0 }}>
            {program === "wr" ? "Ages 5–9 · Wild Roots" : "Ages 9–12 · Earth Leaders"}
          </p>
        </div>
        {/* Program selector */}
        <div style={{ display:"flex", background:"rgba(255,255,255,0.1)", borderRadius:"8px", overflow:"hidden", border:"1px solid rgba(255,255,255,0.2)" }}>
          {[
            { id:"wr", label:"Wild Roots",    sub:"Ages 5–9"  },
            { id:"el", label:"Earth Leaders", sub:"Ages 9–12" },
          ].map(opt => (
            <button key={opt.id} onClick={() => switchProgram(opt.id)} style={{
              background: program === opt.id ? "rgba(255,255,255,0.2)" : "transparent",
              border:"none", padding:"7px 14px", cursor:"pointer",
              color: program === opt.id ? "#fff" : "rgba(255,255,255,0.6)",
              fontFamily:"Georgia,serif", fontSize:"12px", fontWeight: program === opt.id ? 700 : 400,
              transition:"all .15s", whiteSpace:"nowrap",
            }}>
              {opt.label}
              <span style={{ display:"block", fontSize:"9px", opacity:0.7, marginTop:"1px" }}>{opt.sub}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth:"860px", margin:"0 auto", padding:"14px 12px 80px", width:"100%" }}>

        <MoonClubBanner />

        {/* Controls */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:"8px", marginBottom:"10px", flexWrap:"wrap" }}>
          {/* Month tabs */}
          <div style={{ display:"flex", gap:"4px", flexWrap:"wrap" }}>
            {monthKeys.map(key => (
              <button key={key} onClick={() => setMonth(key)} style={{
                background:  month === key ? OLIVE : "#fff",
                color:       month === key ? "#fff" : TEXT_MID,
                border:      `1.5px solid ${month === key ? OLIVE : CREAM_DARK}`,
                borderRadius:"7px", padding:"6px 12px", fontSize:"12px",
                fontFamily:"Georgia, serif", cursor:"pointer",
                fontWeight:  month === key ? 700 : 400,
                transition:"all .15s", whiteSpace:"nowrap",
              }}>
                {SCHEDULES[key].label.split(" ")[0]}
              </button>
            ))}
          </div>

          {/* Day/Week toggle */}
          <div className="wk-toggle" style={{ background:"#fff", border:`1px solid ${CREAM_DARK}`, borderRadius:"7px", overflow:"hidden" }}>
            {[{key:"day",label:"☀️ Day"},{key:"week",label:"📅 Week"}].map(opt => (
              <button key={opt.key} onClick={() => setViewMode(opt.key)} style={{
                background: viewMode === opt.key ? CREAM_DARK : "#fff",
                color:      viewMode === opt.key ? TEXT_DARK  : TEXT_LIGHT,
                border:"none", padding:"6px 13px", fontSize:"12px",
                fontFamily:"Georgia, serif", cursor:"pointer",
                fontWeight: viewMode === opt.key ? 700 : 400, transition:"all .15s",
              }}>{opt.label}</button>
            ))}
          </div>
        </div>

        <Legend program={program} />

        {viewMode === "week"
          ? <WeekView schedule={schedule} />
          : <DayView  schedule={schedule} selectedDay={selectedDay} onSelectDay={setSelectedDay} />
        }

      </div>
    </div>
  );
}
