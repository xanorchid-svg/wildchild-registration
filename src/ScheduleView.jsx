// ScheduleView.jsx — Wild Child Nosara
// Programs: Wild Roots (5–8) | Earth Leaders (9–12)
// Wild Roots:    Jun W1 (Jun 8–12) | Jun W2 (Jun 15–19) | Jun W3/Jul/Aug (shared)
// Earth Leaders: Jun W1 (Jun 8–12) | Jun W2 (Jun 15–19) | Jun W3/Jul/Aug (shared)

import { useState, useEffect } from "react";
import logo from "./assets/logo1.svg";
import { supabase } from "./supabase";

// ── Brand colours ─────────────────────────────────────────────────────────────
const OLIVE      = "#6b7a3f";
const OLIVE_DARK = "#4d5a2c";
const NAVY       = "#0f1f5c";
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
  leo:      { bg:"#ffd8b0", border:"#e07830", text:"#3a1000" },
  snack:    { bg:"#fdf4dc", border:"#d8b840", text:"#3a2800" },
  blue:     { bg:"#d0e4f8", border:"#5080c0", text:"#0a1f48" },
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
  if (t.includes("leo"))      return C.leo;
  if (t.includes("gustavo"))  return C.daniel;
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
  // Schedule runs 8am–2pm. Any value under 8*60 (480) is a pm time that needs +12h
  if (start < 8 * 60) start += 12 * 60;
  if (end   < 8 * 60) end   += 12 * 60;
  if (end  <= start)  end   += 12 * 60;
  return { start, end, duration: end - start };
}

// ── Shared block constants ────────────────────────────────────────────────────
const CIRCLE    = { time:"8:00 – 8:50 am",    name:"Circle Time & Gardening",       nameEs:"Círculo de la mañana y jardinería",           type:"circle"   };
const FREE_PLAY = { time:"8:50 – 9:20 am",    name:"Free Play",                     nameEs:"Juego libre",                                  teacher:"Dunnia", type:"activity" };
const SNACK     = { time:"10:00 – 10:30 am",  name:"Hand-washing & Organic Snack",  nameEs:"Ritual de lavado de manos y merienda orgánica", type:"snack"    };
const OUT_PLAY  = { time:"10:30 – 11:00 am",  name:"Outside Movement & Play",       nameEs:"Movimiento y juego al aire libre",             teacher:"Carina", type:"activity" };
const OUT_PLAY_D= { time:"10:30 – 11:00 am",  name:"Outside Movement & Play",       nameEs:"Movimiento y juego al aire libre",             teacher:"Dunnia", type:"activity" };
const LUNCH     = { time:"12:00 – 12:30 pm",  name:"Hand-washing, Wholesome Lunch & Outdoor Play", nameEs:"Lavado de manos, almuerzo saludable y juego exterior", type:"lunch" };
const OUT_PLAY2 = { time:"12:30 – 1:00 pm",  name:"Outside Movement & Play",       nameEs:"Movimiento y juego al aire libre",             teacher:"Carina", type:"activity" };
const OUT_PLAY2_D={ time:"12:30 – 1:00 pm",  name:"Outside Movement & Play",       nameEs:"Movimiento y juego al aire libre",             teacher:"Dunnia", type:"activity" };

// Thursday: Storytelling spans 8:00–9:20 (no free play slot, just one big block)
const THU_STORY = { time:"8:00 – 9:20 am",   name:"Storytelling & Reading @ Bookstore", nameEs:"Narración de cuentos y lectura en la librería", teacher:"Jenne & Carina", type:"activity" };
// Friday: Tree Planting spans 8:00–9:20
const FRI_TREE  = { time:"8:00 – 9:20 am",   name:"Tree Planting",                 nameEs:"Plantación de árboles",                       teacher:"Carina", type:"activity" };

// ── Wild Roots (5–8) — June Week 1 (Jun 8–12) ────────────────────────────────
const WR_JUN1 = {
  MON: [
    CIRCLE,
    FREE_PLAY,
    { time:"9:20 – 10:00 am",  name:"Permaculture",              nameEs:"Permacultura",                        teacher:"Jenne",   type:"activity" },
    SNACK,
    OUT_PLAY,
    { time:"11:00 – 12:00 pm", name:"Boxing",                    nameEs:"Boxeo",                               teacher:"Carina",  type:"activity" },
    LUNCH,
    OUT_PLAY2,
    { time:"1:00 – 2:00 pm",   name:"Project with Dunnia",       nameEs:"Proyecto con Dunnia",                 teacher:"Dunnia",  type:"activity" },
  ],
  TUE: [
    { time:"8:00 – 9:20 am",   name:"Drumming",                  nameEs:"Percusión",                           teacher:"Ruben",   type:"activity" },
    FREE_PLAY,
    { time:"9:20 – 10:00 am",  name:"Capoeira",                  nameEs:"Capoeira",                            teacher:"Jenne",   type:"activity" },
    SNACK,
    OUT_PLAY_D,
    { time:"11:00 – 12:00 pm", name:"Cosmic Education & Numeracy", nameEs:"Educación Cósmica y Matemáticas",   teacher:"Victoria", type:"activity" },
    LUNCH,
    OUT_PLAY2,
    { time:"1:00 – 2:00 pm",   name:"Leadership",                nameEs:"Liderazgo",                           teacher:"Carina",  type:"activity" },
  ],
  WED: [
    CIRCLE,
    FREE_PLAY,
    { time:"9:20 – 10:00 am",  name:"Nature Walk",               nameEs:"Caminata por la naturaleza",          teacher:"Dunnia",  type:"activity" },
    SNACK,
    OUT_PLAY,
    { time:"11:00 – 12:00 pm", name:"Cosmic Education & Numeracy", nameEs:"Educación Cósmica y Matemáticas",   teacher:"Victoria", type:"activity" },
    LUNCH,
    OUT_PLAY2,
    { time:"1:00 – 2:00 pm",   name:"Boxing",                    nameEs:"Boxeo",                               teacher:"Carina",  type:"activity" },
  ],
  THU: [
    THU_STORY,
    { time:"9:20 – 10:00 am",  name:"Free Play",                 nameEs:"Juego libre",                         teacher:"Dunnia",  type:"activity" },
    SNACK,
    OUT_PLAY_D,
    { time:"11:00 – 12:00 pm", name:"Cosmic Education & Numeracy", nameEs:"Educación Cósmica y Matemáticas",   teacher:"Victoria", type:"activity" },
    LUNCH,
    OUT_PLAY2,
    { time:"1:00 – 2:00 pm",   name:"Pottery",                   nameEs:"Alfarería",                           teacher:"Daniel",  type:"activity" },
  ],
  FRI: [
    FRI_TREE,
    { time:"9:20 – 10:00 am",  name:"Free Play",                 nameEs:"Juego libre",                         teacher:"Dunnia",  type:"activity" },
    SNACK,
    OUT_PLAY,
    { time:"11:00 – 12:00 pm", name:"Acro",                      nameEs:"Acrobacias",                          teacher:"Leo",     type:"activity" },
    LUNCH,
    OUT_PLAY2_D,
    { time:"1:00 – 2:00 pm",   name:"Project with Dunnia",       nameEs:"Proyecto con Dunnia",                 teacher:"Dunnia",  type:"activity" },
  ],
};

// ── Wild Roots (5–8) — June Week 2 (Jun 15–19) ───────────────────────────────
const WR_JUN2 = {
  MON: [
    CIRCLE,
    FREE_PLAY,
    { time:"9:20 – 10:00 am",  name:"Permaculture",              nameEs:"Permacultura",                        teacher:"Jenne",   type:"activity" },
    SNACK,
    OUT_PLAY,
    { time:"11:00 – 12:00 pm", name:"Boxing",                    nameEs:"Boxeo",                               teacher:"Carina",  type:"activity" },
    LUNCH,
    OUT_PLAY2,
    { time:"1:00 – 2:00 pm",   name:"Project with Dunnia",       nameEs:"Proyecto con Dunnia",                 teacher:"Dunnia",  type:"activity" },
  ],
  TUE: [
    CIRCLE,
    FREE_PLAY,
    { time:"9:20 – 10:00 am",  name:"Capoeira",                  nameEs:"Capoeira",                            teacher:"Jenne",   type:"activity" },
    SNACK,
    OUT_PLAY_D,
    { time:"11:00 – 12:00 pm", name:"Leadership with Carina",    nameEs:"Liderazgo con Carina",                teacher:"Carina",  type:"activity" },
    LUNCH,
    OUT_PLAY2,
    { time:"1:00 – 2:00 pm",   name:"Woodwork",                  nameEs:"Carpintería",                         teacher:"Gustavo", type:"activity" },
  ],
  WED: [
    CIRCLE,
    FREE_PLAY,
    { time:"9:20 – 10:00 am",  name:"Nature Walk",               nameEs:"Caminata por la naturaleza",          teacher:"Dunnia",  type:"activity" },
    SNACK,
    OUT_PLAY,
    { time:"11:00 – 12:00 pm", name:"Maths / Phonics / Independent Reading", nameEs:"Matemáticas / Fonética / Lectura independiente", teacher:"Carina",  type:"activity" },
    LUNCH,
    OUT_PLAY2,
    { time:"1:00 – 2:00 pm",   name:"Boxing",                    nameEs:"Boxeo",                               teacher:"Carina",  type:"activity" },
  ],
  THU: [
    THU_STORY,
    { time:"9:20 – 10:00 am",  name:"Free Play",                 nameEs:"Juego libre",                         teacher:"Dunnia",  type:"activity" },
    SNACK,
    OUT_PLAY_D,
    { time:"11:00 – 12:00 pm", name:"Music & Singing with Ruben", nameEs:"Música y canto con Ruben",           teacher:"Ruben",   type:"activity" },
    LUNCH,
    OUT_PLAY2,
    { time:"1:00 – 2:00 pm",   name:"Pottery",                   nameEs:"Alfarería",                           teacher:"Daniel",  type:"activity" },
  ],
  FRI: [
    FRI_TREE,
    { time:"9:20 – 10:00 am",  name:"Free Play",                 nameEs:"Juego libre",                         teacher:"Dunnia",  type:"activity" },
    SNACK,
    OUT_PLAY,
    { time:"11:00 – 12:00 pm", name:"Acro",                      nameEs:"Acrobacias",                          teacher:"Leo",     type:"activity" },
    LUNCH,
    OUT_PLAY2,
    { time:"1:00 – 2:00 pm",   name:"Project with Dunnia",       nameEs:"Proyecto con Dunnia",                 teacher:"Dunnia",  type:"activity" },
  ],
};

// ── Wild Roots & Earth Leaders — July / August (shared) ──────────────────────
const JUL_AUG = {
  MON: [
    CIRCLE,
    FREE_PLAY,
    { time:"9:20 – 10:00 am",  name:"Permaculture",              nameEs:"Permacultura",                        teacher:"Jenne",   type:"activity" },
    SNACK,
    OUT_PLAY,
    { time:"11:00 – 12:00 pm", name:"Dunnia Project",            nameEs:"Proyecto con Dunnia",                 teacher:"Dunnia",  type:"activity" },
    LUNCH,
    OUT_PLAY2_D,
    { time:"1:00 – 2:00 pm",   name:"Project with Dunnia",       nameEs:"Proyecto con Dunnia",                 teacher:"Dunnia",  type:"activity" },
  ],
  TUE: [
    CIRCLE,
    FREE_PLAY,
    { time:"9:20 – 10:00 am",  name:"Capoeira",                  nameEs:"Capoeira",                            teacher:"Jenne",   type:"activity" },
    SNACK,
    OUT_PLAY_D,
    { time:"11:00 – 12:00 pm", name:"Numeracy & Phonics with Carina", nameEs:"Numeración y fonética con Carina", teacher:"Carina", type:"activity" },
    LUNCH,
    OUT_PLAY2_D,
    { time:"1:00 – 2:00 pm",   name:"Woodwork",                  nameEs:"Carpintería",                         teacher:"Gustavo", type:"activity" },
  ],
  WED: [
    { time:"8:00 – 10:00 am",  name:"Leadership Project with Carina", nameEs:"Proyecto de liderazgo con Carina (reunirse en la playa / otros lugares)", teacher:"Carina", type:"activity" },
    SNACK,
    OUT_PLAY,
    { time:"11:00 – 12:00 pm", name:"Boxing with Carina",        nameEs:"Boxeo con Carina",                    teacher:"Carina",  type:"activity" },
    LUNCH,
    OUT_PLAY2,
    { time:"1:00 – 2:00 pm",   name:"Woodwork",                  nameEs:"Carpintería",                         teacher:"Gustavo", type:"activity" },
  ],
  THU: [
    THU_STORY,
    { time:"9:20 – 10:00 am",  name:"Free Play",                 nameEs:"Juego libre",                         teacher:"Dunnia",  type:"activity" },
    SNACK,
    OUT_PLAY,
    { time:"11:00 – 12:00 pm", name:"Music & Singing with Ruben", nameEs:"Música y canto con Ruben",           teacher:"Ruben",   type:"activity" },
    LUNCH,
    OUT_PLAY2,
    { time:"1:00 – 2:00 pm",   name:"Pottery",                   nameEs:"Alfarería",                           teacher:"Daniel",  type:"activity" },
  ],
  FRI: [
    CIRCLE,
    FREE_PLAY,
    { time:"9:20 – 10:00 am",  name:"Drumming",                  nameEs:"Percusión",                           teacher:"Ruben",   type:"activity" },
    SNACK,
    OUT_PLAY_D,
    { time:"11:00 – 12:00 pm", name:"Acro",                      nameEs:"Acrobacias",                          teacher:"Leo",     type:"activity" },
    LUNCH,
    OUT_PLAY2_D,
    { time:"1:00 – 2:00 pm",   name:"Project with Dunnia",       nameEs:"Proyecto con Dunnia",                 teacher:"Dunnia",  type:"activity" },
  ],
};

// ── Earth Leaders (9–12) — June Week 1 (Jun 8–12) ────────────────────────────
const EL_JUN1 = {
  MON: [
    CIRCLE,
    FREE_PLAY,
    { time:"9:20 – 10:00 am",  name:"Permaculture",              nameEs:"Permacultura",                        teacher:"Jenne",   type:"activity" },
    SNACK,
    OUT_PLAY,
    { time:"11:00 – 12:00 pm", name:"Boxing",                    nameEs:"Boxeo",                               teacher:"Carina",  type:"activity" },
    LUNCH,
    OUT_PLAY2,
    { time:"1:00 – 2:00 pm",   name:"Activism",                  nameEs:"Activismo",                           teacher:"Carina",  type:"activity" },
  ],
  TUE: [
    { time:"8:00 – 8:50 am",   name:"Drumming",                  nameEs:"Percusión",                           teacher:"Ruben",   type:"activity" },
    FREE_PLAY,
    { time:"9:20 – 10:00 am",  name:"Capoeira",                  nameEs:"Capoeira",                            teacher:"Jenne",   type:"activity" },
    SNACK,
    OUT_PLAY_D,
    { time:"11:00 – 12:00 pm", name:"Leadership Lab",            nameEs:"Laboratorio de liderazgo",            teacher:"Carina",  type:"activity" },
    LUNCH,
    OUT_PLAY2,
    { time:"1:00 – 2:00 pm",   name:"Leadership",                nameEs:"Liderazgo",                           teacher:"Carina",  type:"activity" },
  ],
  WED: [
    CIRCLE,
    FREE_PLAY,
    { time:"9:20 – 10:00 am",  name:"Nature Walk",               nameEs:"Caminata por la naturaleza",          teacher:"Dunnia",  type:"activity" },
    SNACK,
    OUT_PLAY,
    { time:"11:00 – 12:00 pm", name:"Leadership Lab",            nameEs:"Laboratorio de liderazgo",            teacher:"Carina",  type:"activity" },
    LUNCH,
    OUT_PLAY2,
    { time:"1:00 – 2:00 pm",   name:"Boxing",                    nameEs:"Boxeo",                               teacher:"Carina",  type:"activity" },
  ],
  THU: [
    THU_STORY,
    { time:"9:20 – 10:00 am",  name:"Free Play",                 nameEs:"Juego libre",                         teacher:"Dunnia",  type:"activity" },
    SNACK,
    OUT_PLAY_D,
    { time:"11:00 – 12:00 pm", name:"Leadership with Carina",    nameEs:"Liderazgo con Carina",                teacher:"Carina",  type:"activity" },
    LUNCH,
    OUT_PLAY2_D,
    { time:"1:00 – 2:00 pm",   name:"Pottery",                   nameEs:"Alfarería",                           teacher:"Daniel",  type:"activity" },
  ],
  FRI: [
    FRI_TREE,
    { time:"9:20 – 10:00 am",  name:"Free Play",                 nameEs:"Juego libre",                         teacher:"Dunnia",  type:"activity" },
    SNACK,
    OUT_PLAY,
    { time:"11:00 – 12:00 pm", name:"Acro",                      nameEs:"Acrobacias",                          teacher:"Leo",     type:"activity" },
    LUNCH,
    OUT_PLAY2_D,
    { time:"1:00 – 2:00 pm",   name:"Project with Dunnia",       nameEs:"Proyecto con Dunnia",                 teacher:"Dunnia",  type:"activity" },
  ],
};

// ── Earth Leaders (9–12) — June Week 2 (Jun 15–19) ───────────────────────────
const EL_JUN2 = {
  MON: [
    CIRCLE,
    FREE_PLAY,
    { time:"9:20 – 10:00 am",  name:"Permaculture",              nameEs:"Permacultura",                        teacher:"Jenne",   type:"activity" },
    SNACK,
    OUT_PLAY,
    { time:"11:00 – 12:00 pm", name:"Boxing",                    nameEs:"Boxeo",                               teacher:"Carina",  type:"activity" },
    LUNCH,
    OUT_PLAY2,
    { time:"1:00 – 2:00 pm",   name:"Activism",                  nameEs:"Activismo",                           teacher:"Carina",  type:"activity" },
  ],
  TUE: [
    CIRCLE,
    FREE_PLAY,
    { time:"9:20 – 10:00 am",  name:"Capoeira",                  nameEs:"Capoeira",                            teacher:"Jenne",   type:"activity" },
    SNACK,
    OUT_PLAY_D,
    { time:"11:00 – 12:00 pm", name:"Leadership Lab",            nameEs:"Laboratorio de liderazgo",            teacher:"Carina",  type:"activity" },
    LUNCH,
    OUT_PLAY2,
    { time:"1:00 – 2:00 pm",   name:"Woodwork",                  nameEs:"Carpintería",                         teacher:"Gustavo", type:"activity" },
  ],
  WED: [
    CIRCLE,
    FREE_PLAY,
    { time:"9:20 – 10:00 am",  name:"Nature Walk",               nameEs:"Caminata por la naturaleza",          teacher:"Dunnia",  type:"activity" },
    SNACK,
    OUT_PLAY,
    { time:"11:00 – 12:00 pm", name:"Independent Reading",       nameEs:"Lectura independiente",               teacher:"Carina",  type:"activity" },
    LUNCH,
    OUT_PLAY2,
    { time:"1:00 – 2:00 pm",   name:"Boxing",                    nameEs:"Boxeo",                               teacher:"Carina",  type:"activity" },
  ],
  THU: [
    THU_STORY,
    { time:"9:20 – 10:00 am",  name:"Free Play",                 nameEs:"Juego libre",                         teacher:"Dunnia",  type:"activity" },
    SNACK,
    OUT_PLAY_D,
    { time:"11:00 – 12:00 pm", name:"Music & Singing with Ruben", nameEs:"Música y canto con Ruben",           teacher:"Ruben",   type:"activity" },
    LUNCH,
    OUT_PLAY2_D,
    { time:"1:00 – 2:00 pm",   name:"Pottery",                   nameEs:"Alfarería",                           teacher:"Daniel",  type:"activity" },
  ],
  FRI: [
    CIRCLE,
    FREE_PLAY,
    { time:"9:20 – 10:00 am",  name:"Drumming",                  nameEs:"Percusión",                           teacher:"Ruben",   type:"activity" },
    SNACK,
    OUT_PLAY_D,
    { time:"11:00 – 12:00 pm", name:"Acro",                      nameEs:"Acrobacias",                          teacher:"Leo",     type:"activity" },
    LUNCH,
    OUT_PLAY2,
    { time:"1:00 – 2:00 pm",   name:"Project with Dunnia",       nameEs:"Proyecto con Dunnia",                 teacher:"Dunnia",  type:"activity" },
  ],
};

// ── Schedule map ──────────────────────────────────────────────────────────────
const SCHEDULES = {
  // Wild Roots
  "wr-jun1": { label:"Jun 8–12",  monthLabel:"June", data: WR_JUN1 },
  "wr-jun2": { label:"Jun 15–19", monthLabel:"June", data: WR_JUN2 },
  "wr-jun3": { label:"Jun 22–26", monthLabel:"June", data: JUL_AUG },
  "wr-jul":  { label:"July",      monthLabel:"July",  data: JUL_AUG },
  "wr-aug":  { label:"August",    monthLabel:"August",data: JUL_AUG },
  // Earth Leaders
  "el-jun1": { label:"Jun 8–12",  monthLabel:"June",  data: EL_JUN1 },
  "el-jun2": { label:"Jun 15–19", monthLabel:"June",  data: EL_JUN2 },
  "el-jun3": { label:"Jun 22–26", monthLabel:"June",  data: JUL_AUG },
  "el-jul":  { label:"July",      monthLabel:"July",  data: JUL_AUG },
  "el-aug":  { label:"August",    monthLabel:"August",data: JUL_AUG },
};

// Month groups for tab navigation
const MONTH_GROUPS = {
  wr: [
    { month:"June",   keys:["wr-jun1","wr-jun2","wr-jun3"], year:2026, m:6 },
    { month:"July",   keys:["wr-jul"],                      year:2026, m:7 },
    { month:"August", keys:["wr-aug"],                      year:2026, m:8 },
  ],
  el: [
    { month:"June",   keys:["el-jun1","el-jun2","el-jun3"], year:2026, m:6 },
    { month:"July",   keys:["el-jul"],                      year:2026, m:7 },
    { month:"August", keys:["el-aug"],                      year:2026, m:8 },
  ],
};

const DAYS      = ["MON","TUE","WED","THU","FRI"];
const DAY_FULL  = { MON:"Monday",TUE:"Tuesday",WED:"Wednesday",THU:"Thursday",FRI:"Friday" };
const DAY_SHORT = { MON:"Mon",   TUE:"Tue",    WED:"Wed",      THU:"Thu",     FRI:"Fri"    };
const HOURS     = [8,9,10,11,12,13,14];
const HOUR_LBLS = ["8am","9am","10am","11am","12pm","1pm","2pm"];

// ── Smart calendar helpers ────────────────────────────────────────────────────
function isMonthAvailable({ year, m }) {
  const now = new Date();
  const lastDay = new Date(year, m, 0);
  return lastDay >= now;
}

function todayDayKey() {
  const dow = new Date().getDay();
  const map = { 1:"MON", 2:"TUE", 3:"WED", 4:"THU", 5:"FRI" };
  return map[dow] || "MON";
}

function getDefaultSelections(program) {
  const groups = MONTH_GROUPS[program].filter(isMonthAvailable);
  if (groups.length === 0) return { monthGroup: MONTH_GROUPS[program][MONTH_GROUPS[program].length - 1], weekKey: null };
  const group = groups[0];
  // For June (multi-week), pick the appropriate week based on today's date
  let weekKey = group.keys[0];
  if (group.keys.length > 1) {
    const now = new Date();
    const nowY = now.getFullYear();
    const nowM = now.getMonth() + 1;
    if (nowY === group.year && nowM === group.m) {
      const day = now.getDate();
      if (day <= 12)      weekKey = group.keys[0];
      else if (day <= 19) weekKey = group.keys[1];
      else                weekKey = group.keys[2];
    }
  }
  return { monthGroup: group, weekKey };
}

// ── Block rendering ───────────────────────────────────────────────────────────
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
        {block.name}
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
      {/* Harmony Co-Op Saturday */}
      <div style={{ margin:"12px 0 0", borderRadius:"12px", overflow:"hidden", border:"1px solid #b0c8d0", background:"linear-gradient(135deg, #e8f4f8 0%, #d4eaf0 100%)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"14px", padding:"14px 18px" }}>
          <span style={{ fontSize:"22px", flexShrink:0 }}>🌿</span>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:"bold", fontSize:"14px", color:"#427889" }}>Wild Child at Harmony Co-Op</div>
            <div style={{ fontSize:"12px", color:"#5a8a99", marginTop:"2px" }}>Every Saturday · 8:30 – 11:30 am · Harmony Co-Op Playground</div>
          </div>
          <a href="/harmony" style={{ background:"#427889", color:"#fff", borderRadius:"8px", padding:"7px 14px", fontSize:"12px", textDecoration:"none", fontFamily:"Georgia,serif", whiteSpace:"nowrap", flexShrink:0 }}>Book →</a>
        </div>
      </div>
      <p style={{ fontSize:"10px", color:TEXT_LIGHT, textAlign:"center", marginTop:"10px", fontStyle:"italic" }}>
        *Schedule may flow and adjust based on the group's energy and natural rhythm
      </p>
    </div>
  );
}

function Legend({ program }) {
  const items = [
    { label:"Circle / Gardening", c:C.circle   },
    { label:"Jenne",              c:C.jenne    },
    { label:"Dunnia",             c:C.dunnia   },
    { label:"Victoria",           c:C.victoria },
    { label:"Ruben",              c:C.ruben    },
    { label:"Daniel",             c:C.daniel   },
    { label:"Carina",             c:C.carina   },
    { label:"Leo",                c:C.leo      },
    { label:"Snack & Lunch",      c:C.snack    },
    { label:"Gustavo",            c:C.daniel   },
  ];
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
  const [program,     setProgram]     = useState("wr");
  const [viewMode,    setViewMode]    = useState("day");
  const [selectedDay, setSelectedDay] = useState(todayDayKey);

  // monthGroup = one of the MONTH_GROUPS entries (June/July/August)
  // weekKey    = the specific schedule key (e.g. "wr-jun1")
  const defaults = getDefaultSelections("wr");
  const [monthGroup, setMonthGroup] = useState(defaults.monthGroup);
  const [weekKey,    setWeekKey]    = useState(defaults.weekKey || defaults.monthGroup.keys[0]);

  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      const { data: staff } = await supabase.from("staff").select("id").eq("id", session.user.id).maybeSingle();
      if (staff) setIsAdmin(true);
    });
  }, []);

  function switchProgram(p) {
    setProgram(p);
    const d = getDefaultSelections(p);
    setMonthGroup(d.monthGroup);
    setWeekKey(d.weekKey || d.monthGroup.keys[0]);
  }

  function selectMonthGroup(grp) {
    setMonthGroup(grp);
    setWeekKey(grp.keys[0]);
  }

  const isJune = monthGroup.keys.length > 1;
  const schedule = SCHEDULES[weekKey].data;
  const groups = MONTH_GROUPS[program].filter(isMonthAvailable);

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
        <a href={isAdmin ? "/admin" : "/portal"} style={{ position:"relative", zIndex:2, textDecoration:"none", background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.25)", borderRadius:"8px", padding:"8px 14px", color:"#fff", fontSize:"12px", fontFamily:"Georgia,serif", letterSpacing:"0.5px", whiteSpace:"nowrap" }}>
          {isAdmin ? "← Admin" : "← Portal"}
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
            {program === "wr" ? "Ages 5–8 · Wild Roots" : "Ages 9–12 · Earth Leaders"}
          </p>
        </div>
        {/* Program selector */}
        <div style={{ display:"flex", background:"rgba(255,255,255,0.1)", borderRadius:"8px", overflow:"hidden", border:"1px solid rgba(255,255,255,0.2)" }}>
          {[
            { id:"wr", label:"Wild Roots",    sub:"Ages 5–8"  },
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

        {/* Month tabs */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:"8px", marginBottom:"8px", flexWrap:"wrap" }}>
          <div style={{ display:"flex", gap:"4px", flexWrap:"wrap" }}>
            {groups.map(grp => {
              const active = grp.month === monthGroup.month;
              return (
                <button key={grp.month} onClick={() => selectMonthGroup(grp)} style={{
                  background:  active ? OLIVE : "#fff",
                  color:       active ? "#fff" : TEXT_MID,
                  border:      `1.5px solid ${active ? OLIVE : CREAM_DARK}`,
                  borderRadius:"7px", padding:"6px 14px", fontSize:"12px",
                  fontFamily:"Georgia, serif", cursor:"pointer",
                  fontWeight:  active ? 700 : 400,
                  transition:"all .15s", whiteSpace:"nowrap",
                }}>
                  {grp.month}
                </button>
              );
            })}
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

        {/* Week tabs — only shown for June */}
        {isJune && (
          <div style={{ display:"flex", gap:"4px", marginBottom:"12px", flexWrap:"wrap" }}>
            {monthGroup.keys.map((key, i) => {
              const active = key === weekKey;
              const weekLabels = ["Week 1 · Jun 8–12", "Week 2 · Jun 15–19", "Week 3 · Jun 22–26"];
              return (
                <button key={key} onClick={() => setWeekKey(key)} style={{
                  background:  active ? "#e8f0e0" : "#fff",
                  color:       active ? OLIVE_DARK : TEXT_LIGHT,
                  border:      `1.5px solid ${active ? OLIVE : CREAM_DARK}`,
                  borderRadius:"6px", padding:"5px 12px", fontSize:"11px",
                  fontFamily:"Georgia, serif", cursor:"pointer",
                  fontWeight:  active ? 700 : 400,
                  transition:"all .15s", whiteSpace:"nowrap",
                }}>
                  {weekLabels[i]}
                </button>
              );
            })}
          </div>
        )}

        <Legend program={program} />

        {viewMode === "week"
          ? <WeekView schedule={schedule} />
          : <DayView  schedule={schedule} selectedDay={selectedDay} onSelectDay={setSelectedDay} />
        }

      </div>
    </div>
  );
}
