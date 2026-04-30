import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import logo from "./assets/logo1.svg";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const OLIVE      = "#6b7a3f";
const OLIVE_DARK = "#4d5a2c";
const OLIVE_LIGHT= "#eef1e6";
const NAVY       = "#0f1f5c";
const ORANGE     = "#c4682a";
const SAGE       = "#8fa88a";
const CREAM      = "#f5f0e8";
const CREAM_DARK = "#e0d8c8";
const TEXT_DARK  = "#1a1a2e";
const TEXT_MID   = "#3d3d5c";
const TEXT_LIGHT = "#7a7a9a";
const GREEN      = "#5a7a3a";

const LUNCH_PER_DAY = 10;
const WEEKDAYS = ["Mon","Tue","Wed","Thu","Fri"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const PROGRAMS = [
  { id:"lwo", name:"Little Wild Ones", age:"Ages 1–4", desc:"Sensory play, nature connection, creative movement, storytelling, music, and social-emotional development.", color:OLIVE },
  { id:"we",  name:"Wild Explorers",   age:"Ages 5–9", desc:"Outdoor learning, creative expression, mindfulness, movement, and academics — math, reading, writing, geography, and science.", color:NAVY },
];

// ─────────────────────────────────────────────────────────────────────────────
// PRICING
// Standard weekly rates by day count
const STANDARD_PRICE = { 3: 260, 4: 345, 5: 420 };
// 18+ week flat rates by day count
const LONGTERM_PRICE  = { 3: 180, 4: 230, 5: 275 };

// Returns the base weekly price for n days, given total weeks enrolled for that child.
// 18+ weeks → flat rate. Otherwise standard rate.
function baseWeekPrice(nDays, totalWeeks) {
  if (nDays < 3 || nDays > 5) return 0;
  if (totalWeeks >= 18) return LONGTERM_PRICE[nDays] || 0;
  return STANDARD_PRICE[nDays] || 0;
}

// Volume discount % on tuition (not applied when 18+ since that's already a flat deal).
// Returns a fraction e.g. 0.05, 0.15, or 0.
function volumeDiscountRate(totalWeeks) {
  if (totalWeeks >= 18) return 0;   // flat rate already
  if (totalWeeks >= 12) return 0.15;
  if (totalWeeks >= 4)  return 0.05;
  return 0;
}

// Compute the full tuition for one child (no sibling/referral yet).
// Returns { baseTuition, volumeDiscount, tuitionAfterVolume }
function calcChildTuition(weekGroups) {
  const validWeeks = weekGroups.filter(wk => weekValid(wk.days.length));
  const totalWeeks = validWeeks.length;
  const vRate = volumeDiscountRate(totalWeeks);
  let baseTuition = 0;
  validWeeks.forEach(wk => {
    baseTuition += baseWeekPrice(wk.days.length, totalWeeks);
  });
  const volumeDiscount = Math.round(baseTuition * vRate * 100) / 100;
  const tuitionAfterVolume = baseTuition - volumeDiscount;
  return { baseTuition, volumeDiscount, tuitionAfterVolume, totalWeeks, vRate };
}

function weekValid(n) { return n >= 3 && n <= 5; }

// ─────────────────────────────────────────────────────────────────────────────
// DISCOUNT LABEL HELPERS
function pct(rate) { return Math.round(rate * 100) + "%"; }
function volumeLabel(totalWeeks) {
  if (totalWeeks >= 18) return "18+ week flat rate";
  if (totalWeeks >= 12) return "15% volume discount (12+ wks)";
  if (totalWeeks >= 4)  return "5% volume discount (4+ wks)";
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// TIMEZONE-IMMUNE DATE UTILITIES (Sakamoto algorithm)
function ymdKey(y, m, d) {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
function parseKey(key) {
  const parts = key.split("-").map(Number);
  return { y: parts[0], m: parts[1], d: parts[2] };
}
function dowOf(y, m, d) {
  const t = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4];
  let yr = y;
  if (m < 3) yr--;
  return (yr + Math.floor(yr/4) - Math.floor(yr/100) + Math.floor(yr/400) + t[m-1] + d) % 7;
}
function daysInMonth(y, m) { return new Date(y, m, 0).getDate(); }
function addDaysYmd(ymd, n) {
  let { y, m, d } = ymd;
  d += n;
  while (d > daysInMonth(y, m)) { d -= daysInMonth(y, m); m++; if (m > 12) { m = 1; y++; } }
  while (d < 1) { m--; if (m < 1) { m = 12; y--; } d += daysInMonth(y, m); }
  return { y, m, d };
}
function mondayOf(ymd) {
  const dow = dowOf(ymd.y, ymd.m, ymd.d);
  const daysBack = dow === 0 ? 6 : dow - 1;
  return addDaysYmd(ymd, -daysBack);
}
function weekKeyOf(ymd) { const mon = mondayOf(ymd); return ymdKey(mon.y, mon.m, mon.d); }
function formatYmd(ymd) { return new Date(ymd.y, ymd.m - 1, ymd.d).toLocaleDateString("en-US", { month: "short", day: "numeric" }); }
function weekdayName(ymd) { return new Date(ymd.y, ymd.m - 1, ymd.d).toLocaleDateString("en-US", { weekday: "short" }); }
function ymdBefore(a, b) { if (a.y !== b.y) return a.y < b.y; if (a.m !== b.m) return a.m < b.m; return a.d < b.d; }
function isBeforeToday(ymd, todayYmd) { return ymdBefore(ymd, todayYmd); }
function inMonth(ymd, y, m) { return ymd.y === y && ymd.m === m; }
function getWeeksForMonth(year, month) {
  const firstDay = { y: year, m: month, d: 1 };
  const lastDay  = { y: year, m: month, d: daysInMonth(year, month) };
  const weeks = [];
  let monday = mondayOf(firstDay);
  for (let i = 0; i < 6; i++) {
    const wStart = addDaysYmd(monday, i * 7);
    const wEnd   = addDaysYmd(wStart, 4);
    if (!ymdBefore(wEnd, firstDay) && !ymdBefore(lastDay, wStart)) weeks.push(wStart);
  }
  return weeks;
}

// ─────────────────────────────────────────────────────────────────────────────

const inp = {
  width:"100%", padding:"12px 14px", border:`1px solid ${CREAM_DARK}`,
  borderRadius:"8px", fontSize:"15px", fontFamily:"Georgia,serif",
  background:"#fff", color:TEXT_DARK, marginBottom:"14px", outline:"none", boxSizing:"border-box"
};
const lbl = {
  display:"block", fontSize:"11px", letterSpacing:"1px", textTransform:"uppercase",
  color:TEXT_LIGHT, marginBottom:"6px", fontFamily:"Georgia,serif"
};

// ── Calendar ──────────────────────────────────────────────────────────────────
function ChildCalendar({ childName, days, setDays, lunch, setLunch, todayYmd, siblingIndex }) {
  const [calYear,  setCalYear]  = useState(todayYmd.y);
  const [calMonth, setCalMonth] = useState(todayYmd.m);

  const weeks = getWeeksForMonth(calYear, calMonth);

  const toggleDay = (dayYmd) => {
    if (isBeforeToday(dayYmd, todayYmd)) return;
    const key = ymdKey(dayYmd.y, dayYmd.m, dayYmd.d);
    const wk  = weekKeyOf(dayYmd);
    setDays(prev => {
      const n = new Set(prev);
      if (n.has(key)) {
        n.delete(key);
      } else {
        const count = Array.from(n).filter(dk => weekKeyOf(parseKey(dk)) === wk).length;
        if (count >= 5) return prev;
        n.add(key);
      }
      return n;
    });
  };

  const weekGroups = {};
  Array.from(days).forEach(dk => {
    const ymd = parseKey(dk);
    const wk  = weekKeyOf(ymd);
    const mon = mondayOf(ymd);
    if (!weekGroups[wk]) weekGroups[wk] = { monday: mon, wk, days: [] };
    weekGroups[wk].days.push(dk);
  });
  const weekEntries = Object.values(weekGroups).sort((a, b) => a.wk < b.wk ? -1 : a.wk > b.wk ? 1 : 0);
  const validWeekEntries = weekEntries.filter(wk => weekValid(wk.days.length));
  const totalWeeks = validWeekEntries.length;
  const { baseTuition, volumeDiscount, tuitionAfterVolume, vRate } = calcChildTuition(weekEntries);
  const sibDiscount = siblingIndex > 0 ? Math.round(tuitionAfterVolume * 0.10 * 100) / 100 : 0;
  const tuitionFinal = tuitionAfterVolume - sibDiscount;
  const lunchCost = lunch ? Array.from(days).length * LUNCH_PER_DAY : 0;
  const vLabel = volumeLabel(totalWeeks);

  const prevMonth = () => { if (calMonth === 1) { setCalYear(y => y - 1); setCalMonth(12); } else setCalMonth(m => m - 1); };
  const nextMonth = () => { if (calMonth === 12) { setCalYear(y => y + 1); setCalMonth(1); } else setCalMonth(m => m + 1); };

  return (
    <div>
      {/* Lunch toggle */}
      <div onClick={() => setLunch(!lunch)}
        style={{ background:lunch?GREEN:"#fff", border:`1.5px solid ${lunch?GREEN:CREAM_DARK}`,
          borderRadius:"10px", padding:"14px 16px", cursor:"pointer", display:"flex",
          alignItems:"center", gap:"14px", marginBottom:"20px", transition:"all .2s" }}>
        <div style={{ flex:1 }}>
          <p style={{ fontSize:"14px", color:lunch?"#fff":TEXT_DARK, margin:"0 0 2px" }}>Add Organic Snack & Lunch</p>
          <p style={{ fontSize:"12px", color:lunch?"rgba(255,255,255,0.75)":TEXT_LIGHT, margin:0, lineHeight:1.4 }}>
            All organic, locally sourced, made with love. $10/day (flat rate, always)
          </p>
        </div>
        <div style={{ width:"22px", height:"22px", borderRadius:"50%", border:`2px solid ${lunch?"#fff":CREAM_DARK}`,
          background:lunch?"#fff":"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          {lunch && <div style={{ width:"12px", height:"12px", borderRadius:"50%", background:GREEN }}/>}
        </div>
      </div>

      {/* Sibling notice */}
      {siblingIndex > 0 && (
        <div style={{ background:"#fff7f0", border:`1px solid #e8c4a0`, borderRadius:"8px", padding:"10px 14px", marginBottom:"16px" }}>
          <p style={{ fontSize:"13px", color:ORANGE, margin:0 }}>
            🌿 <strong>Sibling discount:</strong> 10% off tuition for this child
          </p>
        </div>
      )}

      {/* Calendar */}
      <div style={{ background:"#fff", border:`1px solid ${CREAM_DARK}`, borderRadius:"12px", padding:"16px", marginBottom:"8px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"14px" }}>
          <button onClick={prevMonth}
            style={{ background:"none", border:"none", cursor:"pointer", fontSize:"20px", color:TEXT_MID, padding:"2px 10px", lineHeight:1 }}>‹</button>
          <p style={{ fontSize:"15px", color:TEXT_DARK, margin:0 }}>{MONTHS[calMonth - 1]} {calYear}</p>
          <button onClick={nextMonth}
            style={{ background:"none", border:"none", cursor:"pointer", fontSize:"20px", color:TEXT_MID, padding:"2px 10px", lineHeight:1 }}>›</button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:"4px", marginBottom:"8px", textAlign:"center" }}>
          {WEEKDAYS.map(d => <div key={d} style={{ fontSize:"11px", color:TEXT_LIGHT }}>{d}</div>)}
        </div>
        {weeks.map(monday => {
          const wk = ymdKey(monday.y, monday.m, monday.d);
          const wkDays = Array.from(days).filter(dk => weekKeyOf(parseKey(dk)) === wk);
          const count = wkDays.length;
          const isValid = count === 0 || count >= 3;
          const isFull  = count >= 5;
          return (
            <div key={wk}>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:"4px", marginBottom:"3px" }}>
                {[0,1,2,3,4].map(offset => {
                  const dayYmd = addDaysYmd(monday, offset);
                  const key    = ymdKey(dayYmd.y, dayYmd.m, dayYmd.d);
                  const isSel  = days.has(key);
                  const isPast = isBeforeToday(dayYmd, todayYmd);
                  const inCurMonth = inMonth(dayYmd, calYear, calMonth);
                  const isBlocked  = !isSel && isFull;
                  return (
                    <div key={offset}
                      onClick={() => !isPast && !isBlocked && toggleDay(dayYmd)}
                      style={{
                        textAlign:"center", padding:"8px 2px", borderRadius:"8px", transition:"all .15s",
                        background: isSel ? OLIVE : (inCurMonth ? CREAM : CREAM_DARK),
                        color: isSel ? "#fff" : (inCurMonth ? TEXT_DARK : TEXT_LIGHT),
                        opacity: isPast ? 0.3 : isBlocked ? 0.35 : 1,
                        cursor: isPast || isBlocked ? "not-allowed" : "pointer",
                        border: isSel ? `1.5px solid ${OLIVE_DARK}` : "1.5px solid transparent",
                      }}>
                      <div style={{ fontSize:"9px", opacity:0.7, marginBottom:"1px" }}>{MONTHS[dayYmd.m - 1].slice(0, 3)}</div>
                      <div style={{ fontSize:"13px" }}>{dayYmd.d}</div>
                    </div>
                  );
                })}
              </div>
              {count > 0 && (
                <div style={{ textAlign:"right", marginBottom:"4px" }}>
                  <span style={{ fontSize:"10px", padding:"2px 8px", borderRadius:"10px", color:"#fff",
                    background: !isValid ? "#e08c00" : isFull ? OLIVE : GREEN }}>
                    {count}/5 days{!isValid ? " · select at least 3" : isFull ? " · full ✓" : count === 4 ? " · 4-day ✓" : " · 3-day ✓"}
                  </span>
                </div>
              )}
              {count === 0 && <div style={{ marginBottom:"4px" }}/>}
            </div>
          );
        })}
        <p style={{ fontSize:"11px", color:TEXT_LIGHT, margin:"10px 0 0", textAlign:"center" }}>
          Min 3 · max 5 days per week
        </p>
      </div>

      {/* Discount badges */}
      {totalWeeks > 0 && (vLabel || siblingIndex > 0) && (
        <div style={{ display:"flex", gap:"8px", flexWrap:"wrap", marginTop:"10px", marginBottom:"4px" }}>
          {vLabel && (
            <span style={{ fontSize:"11px", background: totalWeeks >= 18 ? NAVY : OLIVE, color:"#fff", padding:"4px 10px", borderRadius:"20px" }}>
              {vLabel}
            </span>
          )}
          {siblingIndex > 0 && (
            <span style={{ fontSize:"11px", background:ORANGE, color:"#fff", padding:"4px 10px", borderRadius:"20px" }}>
              Sibling −10%
            </span>
          )}
        </div>
      )}

      {/* Summary */}
      {weekEntries.length > 0 && (
        <div style={{ background:"#fff", border:`1px solid ${CREAM_DARK}`, borderRadius:"10px", padding:"14px", marginTop:"8px" }}>
          <p style={{ fontSize:"11px", letterSpacing:"1px", textTransform:"uppercase", color:TEXT_LIGHT, margin:"0 0 10px" }}>
            {childName} — Summary
          </p>
          {weekEntries.map(wkEntry => {
            const n   = wkEntry.days.length;
            const valid = weekValid(n);
            const p   = baseWeekPrice(n, totalWeeks);
            const lc  = lunch && valid ? n * LUNCH_PER_DAY : 0;
            const dayNames = wkEntry.days.map(dk => weekdayName(parseKey(dk))).sort().join(", ");
            return (
              <div key={wkEntry.wk} style={{ padding:"8px 0", borderBottom:`1px solid ${CREAM_DARK}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:"13px", color:valid?TEXT_DARK:"#c0392b" }}>
                  <span>Wk of {formatYmd(wkEntry.monday)}</span>
                  <span style={{ flexShrink:0, marginLeft:"8px" }}>{valid ? `$${p}` : "⚠ Need 3+"}</span>
                </div>
                {valid && (
                  <div style={{ fontSize:"12px", color:TEXT_LIGHT, marginTop:"3px", display:"flex", gap:"6px", flexWrap:"wrap" }}>
                    <span>{dayNames}</span>
                    <span style={{ color:CREAM_DARK }}>·</span>
                    <span style={{ color:OLIVE }}>${p}/wk</span>
                    {lunch && (<><span style={{ color:CREAM_DARK }}>·</span><span style={{ color:GREEN }}>+ ${lc} lunch ({n}×$10)</span></>)}
                  </div>
                )}
              </div>
            );
          })}

          {/* Discount breakdown */}
          <div style={{ paddingTop:"10px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:"13px", color:TEXT_DARK, paddingBottom:"4px" }}>
              <span>Base tuition</span><span>${baseTuition}</span>
            </div>
            {volumeDiscount > 0 && (
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:"13px", color:GREEN, paddingBottom:"4px" }}>
                <span>Volume discount ({pct(vRate)})</span><span>−${volumeDiscount}</span>
              </div>
            )}
            {totalWeeks >= 18 && (
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:"13px", color:NAVY, paddingBottom:"4px" }}>
                <span>18+ week flat rate applied</span><span>✓</span>
              </div>
            )}
            {sibDiscount > 0 && (
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:"13px", color:ORANGE, paddingBottom:"4px" }}>
                <span>Sibling discount (10%)</span><span>−${sibDiscount}</span>
              </div>
            )}
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:"14px", borderTop:`1px solid ${CREAM_DARK}`, paddingTop:"8px", color:TEXT_DARK }}>
              <span>Tuition subtotal</span>
              <div style={{ textAlign:"right" }}>
                {lunch && <div style={{ fontSize:"11px", color:TEXT_LIGHT }}>+ ${lunchCost} lunch</div>}
                <span style={{ color:OLIVE }}>${tuitionFinal + lunchCost}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Waiver sections ───────────────────────────────────────────────────────────
const WAIVER_SECTIONS = [
  { key:"liab", title:"1. Assumption of Risk & Release of Liability",
    text:"Wild Child Playgarden & Wildschooling Nosara is a nature-based, outdoor educational program. Activities include outdoor play, gardening, forest and beach exploration, physical movement, water play, and exposure to uneven terrain, insects, plants, wildlife, and weather. I knowingly assume all risks and release Wild Child and its staff from all claims arising from my child's participation.",
    checkLabel:"I agree to the Assumption of Risk and Release of Liability." },
  { key:"med", title:"2. Medical & Emergency Consent",
    text:"I authorize Wild Child to seek emergency medical care for my child if I cannot be reached. I consent to examination, diagnosis, treatment, and/or hospital care deemed necessary by a licensed physician. All medical expenses are my responsibility.",
    checkLabel:"I agree to Medical & Emergency Care Consent." },
];

// ── Stripe payment form ───────────────────────────────────────────────────────
function StripePaymentForm({ onSuccess, busy, setBusy }) {
  const stripe   = useStripe();
  const elements = useElements();
  const [err, setErr] = useState("");

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setBusy(true); setErr("");
    const { error } = await stripe.confirmPayment({ elements, redirect:"if_required" });
    if (error) { setErr(error.message); setBusy(false); }
    else { onSuccess(); }
  };

  return (
    <div>
      <PaymentElement options={{ layout:"tabs" }}/>
      {err && <p style={{ color:"#c0392b", fontSize:"13px", marginTop:"12px" }}>{err}</p>}
      <button onClick={handlePay} disabled={busy || !stripe}
        style={{ width:"100%", background:busy?"#aaa":ORANGE, color:"#fff", border:"none",
          borderRadius:"8px", padding:"14px", fontSize:"14px", letterSpacing:"1px",
          fontFamily:"Georgia,serif", cursor:busy?"not-allowed":"pointer",
          textTransform:"uppercase", marginTop:"20px", transition:"background .2s" }}>
        {busy ? "Processing..." : "Pay Now"}
      </button>
    </div>
  );
}

// ── Helper: build week groups from a child's days Set ────────────────────────
function buildWeekGroups(daysSet) {
  const wg = {};
  Array.from(daysSet).forEach(dk => {
    const ymd = parseKey(dk);
    const wk  = weekKeyOf(ymd);
    const mon = mondayOf(ymd);
    if (!wg[wk]) wg[wk] = { monday: mon, wk, days: [] };
    wg[wk].days.push(dk);
  });
  return Object.values(wg).sort((a, b) => a.wk < b.wk ? -1 : a.wk > b.wk ? 1 : 0);
}

// ── Generate referral code ────────────────────────────────────────────────────
function generateReferralCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "WC-";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// ── Compute totals for all children with all discounts ────────────────────────
// referralRate: 0 or 0.05
function computeAllTotals(children, referralRate = 0) {
  return children.map((ch, i) => {
    const weekGroups = buildWeekGroups(ch.days);
    const { baseTuition, volumeDiscount, tuitionAfterVolume } = calcChildTuition(weekGroups);
    const sibRate = i > 0 ? 0.10 : 0;
    const sibDiscount = Math.round(tuitionAfterVolume * sibRate * 100) / 100;
    const afterSib = tuitionAfterVolume - sibDiscount;
    const refDiscount = Math.round(afterSib * referralRate * 100) / 100;
    const tuitionFinal = afterSib - refDiscount;
    const lunchCost = ch.lunch ? Array.from(ch.days).length * LUNCH_PER_DAY : 0;
    return {
      baseTuition, volumeDiscount, sibDiscount, refDiscount,
      tuitionFinal, lunchCost, total: tuitionFinal + lunchCost,
      weekGroups
    };
  });
}

// ── Main component ────────────────────────────────────────────────────────────
export default function WildChildRegistration() {
  const now = new Date();
  const todayYmd = { y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() };

  const [session,        setSession]        = useState(null);
  const [loadingSession, setLoading]        = useState(true);
  const [profile,        setProfile]        = useState(null);
  const [savedChildren,  setSavedChildren]  = useState([]);

  const [step, setStep] = useState(0);

  const [children, setChildren] = useState([
    { fn:"", ln:"", dob:"", allergies:"", prog:null, days:new Set(), lunch:false, savedId:null }
  ]);
  const [activeChild, setActiveChild] = useState(0);

  const [parentName,  setParentName]  = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [createAcct,  setCreateAcct]  = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPw,   setConfirmPw]   = useState("");

  // Referral code state
  const [referralCodeInput, setReferralCodeInput] = useState("");
  const [referralStatus,    setReferralStatus]    = useState(null); // null | "checking" | "valid" | "invalid"
  const [referralProfile,   setReferralProfile]   = useState(null); // the referring parent's profile row

  const [clientSecret, setClientSecret] = useState("");
  const [w, setW] = useState({ liab:false, med:false, mediaY:false, mediaN:false, excY:false, excN:false });
  const [sig, setSig]   = useState("");
  const [busy, setBusy] = useState(false);
  const [err,  setErr]  = useState("");

  // Load session + profile + saved children
  useEffect(() => {
    async function load() {
      const { data:{ session: s } } = await supabase.auth.getSession();
      if (s) {
        setSession(s);
        setParentEmail(s.user.email || "");
        const { data: p } = await supabase.from("parent_profiles").select("*").eq("id", s.user.id).single();
        if (p) {
          setProfile(p);
          setParentName(p.full_name || "");
          setParentPhone(p.phone    || "");
          if (p.waiver_signature) {
            setW({ liab:true, med:true, mediaY:true, mediaN:false, excY:true, excN:false });
            setSig(p.waiver_signature || "");
          }
        }
        const { data: ch } = await supabase.from("children").select("*").eq("parent_id", s.user.id).order("created_at");
        if (ch && ch.length > 0) {
          setSavedChildren(ch);
          setChildren(ch.map(c => ({
            fn: c.first_name, ln: c.last_name, dob: c.dob || "",
            allergies: c.allergies || "", prog: c.program_id,
            days: new Set(), lunch: false, savedId: c.id
          })));
        }
      }
      setLoading(false);
    }
    load();
  }, []);

  // ── Referral code validation ─────────────────────────────────────────────────
  const checkReferralCode = async (code) => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) { setReferralStatus(null); setReferralProfile(null); return; }
    setReferralStatus("checking");
    const { data } = await supabase
      .from("parent_profiles")
      .select("id, full_name, referral_code")
      .eq("referral_code", trimmed)
      .single();
    if (data) {
      // Make sure they're not referring themselves
      if (session && data.id === session.user.id) {
        setReferralStatus("invalid");
        setReferralProfile(null);
      } else {
        setReferralStatus("valid");
        setReferralProfile(data);
      }
    } else {
      setReferralStatus("invalid");
      setReferralProfile(null);
    }
  };

  const referralRate = referralStatus === "valid" ? 0.05 : 0;
  const childTotals  = computeAllTotals(children, referralRate);
  const grandTotal   = Math.round(childTotals.reduce((s, ct) => s + ct.total, 0) * 100) / 100;

  // ── Child helpers ────────────────────────────────────────────────────────────
  const updateChild  = (i, field, val) =>
    setChildren(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: val } : c));
  const setChildDays = (i, updater) =>
    setChildren(prev => prev.map((c, idx) => {
      if (idx !== i) return c;
      const newDays = typeof updater === "function" ? updater(c.days) : updater;
      return { ...c, days: newDays };
    }));
  const setChildLunch = (i, val) => updateChild(i, "lunch", val);
  const addChild = () => {
    if (children.length >= 5) return;
    setChildren(prev => [...prev, { fn:"", ln:"", dob:"", allergies:"", prog:null, days:new Set(), lunch:false, savedId:null }]);
  };
  const removeChild = (i) => {
    setChildren(prev => prev.filter((_, idx) => idx !== i));
    if (activeChild >= i && activeChild > 0) setActiveChild(activeChild - 1);
  };

  // ── Step / waiver logic ──────────────────────────────────────────────────────
  const waiverAlreadySigned = !!profile?.waiver_signature;
  const STEPS = waiverAlreadySigned
    ? ["Children","Schedule","Your Info","Payment","Confirmation"]
    : ["Children","Schedule","Your Info","Payment","Waiver","Confirmation"];
  const totalSteps  = STEPS.length;
  const confirmStep = totalSteps - 1;
  const waiverStep  = waiverAlreadySigned ? -1 : totalSteps - 2;

  // ── Save children to DB ──────────────────────────────────────────────────────
  const saveChildrenToDB = async (uid) => {
    for (const ch of children) {
      if (!ch.fn || !ch.ln) continue;
      const payload = {
        parent_id: uid, first_name: ch.fn, last_name: ch.ln,
        dob: ch.dob, allergies: ch.allergies,
        program_id: ch.prog, program_name: PROGRAMS.find(p => p.id === ch.prog)?.name
      };
      if (ch.savedId) {
        await supabase.from("children").update(payload).eq("id", ch.savedId);
      } else {
        const { data: existing } = await supabase.from("children").select("id")
          .eq("parent_id", uid).eq("first_name", ch.fn).eq("last_name", ch.ln).single();
        if (existing) await supabase.from("children").update(payload).eq("id", existing.id);
        else          await supabase.from("children").insert(payload);
      }
    }
  };

  // ── handleNext ───────────────────────────────────────────────────────────────
  const handleNext = async () => {
    setErr("");

    if (step === 2 && createAcct && !session) {
      if (newPassword !== confirmPw) { setErr("Passwords don't match."); return; }
      if (newPassword.length < 6)   { setErr("Password must be at least 6 characters."); return; }
      setBusy(true);
      const { data, error } = await supabase.auth.signUp({ email: parentEmail, password: newPassword });
      if (error) { setErr(error.message); setBusy(false); return; }
      setSession(data.session);
      setBusy(false);
    }

    if (step === 2) {
      setBusy(true);
      try {
        const { data, error } = await supabase.functions.invoke("create-payment-intent", {
          body: {
            amount: grandTotal, currency: "usd",
            metadata: { parent_email: parentEmail, children: children.map(c => c.fn).join(", ") }
          }
        });
        if (error || !data?.clientSecret) throw new Error(error?.message || "Failed to create payment");
        setClientSecret(data.clientSecret);
      } catch (e) {
        setErr("Payment setup failed: " + e.message);
        setBusy(false);
        return;
      }
      setBusy(false);
    }

    if (step === totalSteps - 2) {
      setBusy(true);
      await saveRegistrations();
      setBusy(false);
      setStep(confirmStep);
      window.scrollTo(0, 0);
      return;
    }

    setStep(s => s + 1);
    window.scrollTo(0, 0);
  };

  // ── saveRegistrations ────────────────────────────────────────────────────────
  const saveRegistrations = async () => {
    const uid = session?.user?.id || null;

    // Generate referral code for new accounts
    let myReferralCode = profile?.referral_code || null;
    if (uid && !myReferralCode) {
      myReferralCode = generateReferralCode();
    }

    if (uid) {
      await supabase.from("parent_profiles").upsert({
        id: uid, full_name: parentName, phone: parentPhone, email: parentEmail,
        referral_code: myReferralCode,
        waiver_signature: waiverAlreadySigned ? profile.waiver_signature : sig,
        waiver_signed_at: waiverAlreadySigned ? profile.waiver_signed_at : new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      await saveChildrenToDB(uid);
    }

    // Apply referral credit to referring parent
    if (referralStatus === "valid" && referralProfile) {
      await supabase.from("parent_profiles")
        .update({ referral_credit_pending: true })
        .eq("id", referralProfile.id);
    }

    const savedRegs = [];
    for (let i = 0; i < children.length; i++) {
      const ch = children[i];
      const ct = childTotals[i];
      const sp = PROGRAMS.find(p => p.id === ch.prog);
      const reg = {
        program_id: ch.prog, program_name: sp?.name,
        child_first_name: ch.fn, child_last_name: ch.ln,
        child_dob: ch.dob, child_allergies: ch.allergies,
        parent_name: parentName, parent_email: parentEmail, parent_phone: parentPhone,
        selected_days: Array.from(ch.days), lunch: ch.lunch,
        subtotal_tuition: ct.tuitionFinal,
        subtotal_lunch: ct.lunchCost,
        grand_total: ct.total,
        discount_volume: ct.volumeDiscount,
        discount_sibling: ct.sibDiscount,
        discount_referral: ct.refDiscount,
        referred_by_code: referralStatus === "valid" ? referralCodeInput.trim().toUpperCase() : null,
        waiver_liability: w.liab, waiver_medical: w.med,
        waiver_media:     w.mediaY ? "yes" : w.mediaN ? "no" : null,
        waiver_excursion: w.excY   ? "yes" : w.excN   ? "no" : null,
        waiver_signature: waiverAlreadySigned ? profile?.waiver_signature : sig,
        waiver_date:      waiverAlreadySigned ? profile?.waiver_signed_at : new Date().toISOString(),
        payment_status: "paid", parent_user_id: uid,
      };
      await supabase.from("registrations").insert(reg);
      savedRegs.push(reg);
    }

    await supabase.functions.invoke("send-enrollment-notification", {
      body: { children: savedRegs, parentName, parentEmail, parentPhone, grandTotal }
    });
  };

  // ── Loading screen ───────────────────────────────────────────────────────────
  if (loadingSession) return (
    <div style={{ fontFamily:"Georgia,serif", background:CREAM, minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <p style={{ color:OLIVE }}>Loading...</p>
    </div>
  );

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily:"Georgia,serif", background:CREAM, minHeight:"100vh", color:TEXT_DARK, WebkitTextSizeAdjust:"100%" }}>
      <style>{`
        html, body, #root { margin:0; padding:0; width:100%; }
        * { box-sizing: border-box; }
        input[type="text"],input[type="email"],input[type="password"],input[type="date"],input[type="tel"],button,textarea { font-family: Georgia,serif; }
        input[type="checkbox"],input[type="radio"] { width:18px; height:18px; cursor:pointer; accent-color:${OLIVE}; flex-shrink:0; margin-top:2px; }
        input[type="date"] { display:block; width:100%; -webkit-appearance:none; appearance:none; text-align:left; }
        input[type="date"]::-webkit-date-and-time-value { text-align:left; }
        @media (max-width:480px) {
          .name-row { flex-direction:column !important; gap:0 !important; }
          .step-lbl { font-size:9px !important; min-width:40px !important; padding:8px 1px !important; }
          .price-cards { flex-direction:column !important; }
          .prog-cards { flex-direction:column !important; }
          .header-logo { height:110px !important; }
          .header-logo-wrap { transform:translate(-50%,-35%) !important; }
        }
      `}</style>

      {/* Header */}
      <div style={{ background:OLIVE_DARK, overflow:"hidden", position:"relative", height:"90px",
        display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 20px" }}>
        <div style={{ width:"44px" }}/>
        <div className="header-logo-wrap" style={{ position:"absolute", left:"50%", top:"50%", transform:"translate(-50%,-40%)" }}>
          <img className="header-logo" src={logo} alt="Wild Child Nosara" style={{ height:"180px", objectFit:"contain" }}/>
        </div>
        {session
          ? <a href="/portal" style={{ position:"relative", zIndex:2, textDecoration:"none", display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.25)", borderRadius:"50%", width:"40px", height:"40px", flexShrink:0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" fill="rgba(255,255,255,0.9)"/><path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round"/></svg>
            </a>
          : <a href="/login" style={{ position:"relative", zIndex:2, textDecoration:"none", display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.25)", borderRadius:"50%", width:"40px", height:"40px", flexShrink:0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" fill="rgba(255,255,255,0.9)"/><path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round"/></svg>
            </a>
        }
      </div>

      {/* Step bar */}
      <div style={{ display:"flex", background:NAVY, overflowX:"auto" }}>
        {STEPS.map((s, i) => (
          <div key={s} className="step-lbl" onClick={() => i < step && setStep(i)}
            style={{ flex:1, padding:"10px 2px", textAlign:"center", fontSize:"11px", whiteSpace:"nowrap", minWidth:"56px",
              color: i === step ? "#fff" : i < step ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.3)",
              borderBottom: i === step ? `2px solid ${ORANGE}` : "2px solid transparent",
              cursor: i < step ? "pointer" : "default" }}>
            {i < step ? "✓ " : ""}{s}
          </div>
        ))}
      </div>

      <div style={{ maxWidth:"600px", margin:"0 auto", padding:"28px 16px 100px", width:"100%" }}>

        {/* ── STEP 0 — Children ── */}
        {step === 0 && (
          <div>
            <h2 style={{ fontSize:"21px", fontWeight:400, marginBottom:"5px" }}>
              {session && savedChildren.length > 0 ? "Your Children" : "Add Your Child"}
            </h2>
            <p style={{ fontSize:"14px", color:TEXT_MID, marginBottom:"22px", lineHeight:1.5 }}>
              {session && savedChildren.length > 0
                ? "Your saved children are pre-filled. Add new ones or update info below."
                : "Tell us about your child. You can add more below."}
            </p>

            {children.map((ch, i) => (
              <div key={i} style={{ background:"#fff", border:`1.5px solid ${i===0?CREAM_DARK:OLIVE}`, borderRadius:"12px", padding:"20px", marginBottom:"16px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px" }}>
                  <div>
                    <p style={{ fontSize:"12px", letterSpacing:"1px", textTransform:"uppercase", color:i===0?TEXT_LIGHT:OLIVE, margin:0 }}>
                      Child {i + 1}
                    </p>
                    {i > 0 && (
                      <p style={{ fontSize:"11px", color:ORANGE, margin:"3px 0 0" }}>🌿 10% sibling discount applies</p>
                    )}
                  </div>
                  {i > 0 && (
                    <button onClick={() => removeChild(i)}
                      style={{ background:"none", border:"none", color:"#c0392b", cursor:"pointer", fontSize:"13px" }}>Remove</button>
                  )}
                </div>
                <div className="name-row" style={{ display:"flex", gap:"12px" }}>
                  <div style={{ flex:1 }}><span style={lbl}>First Name</span><input style={inp} value={ch.fn} onChange={e => updateChild(i,"fn",e.target.value)} placeholder="First name"/></div>
                  <div style={{ flex:1 }}><span style={lbl}>Last Name</span><input style={inp} value={ch.ln} onChange={e => updateChild(i,"ln",e.target.value)} placeholder="Last name"/></div>
                </div>
                <span style={lbl}>Date of Birth</span>
                <input style={inp} type="date" value={ch.dob} onChange={e => updateChild(i,"dob",e.target.value)}/>
                <span style={lbl}>Allergies / Dietary Notes</span>
                <input style={inp} value={ch.allergies} onChange={e => updateChild(i,"allergies",e.target.value)} placeholder="None, or describe..."/>
                <span style={{ ...lbl, marginTop:"4px" }}>Program</span>
                <div className="prog-cards" style={{ display:"flex", gap:"10px" }}>
                  {PROGRAMS.map(p => (
                    <div key={p.id} onClick={() => updateChild(i,"prog",p.id)}
                      style={{ flex:1, background:ch.prog===p.id?p.color:"#fff", border:`1.5px solid ${ch.prog===p.id?p.color:CREAM_DARK}`, borderRadius:"10px", padding:"14px 12px", cursor:"pointer", transition:"all .2s" }}>
                      <p style={{ fontSize:"11px", letterSpacing:"1px", textTransform:"uppercase", color:ch.prog===p.id?"rgba(255,255,255,0.8)":TEXT_LIGHT, margin:"0 0 3px" }}>{p.name}</p>
                      <p style={{ fontSize:"16px", fontWeight:400, color:ch.prog===p.id?"#fff":TEXT_DARK, margin:"0 0 6px" }}>{p.age}</p>
                      <p style={{ fontSize:"12px", color:ch.prog===p.id?"rgba(255,255,255,0.8)":TEXT_LIGHT, lineHeight:1.4, margin:0 }}>{p.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {children.length < 5 && (
              <button onClick={addChild}
                style={{ width:"100%", background:"transparent", border:`1.5px dashed ${CREAM_DARK}`, borderRadius:"10px", padding:"14px", color:TEXT_LIGHT, fontSize:"13px", cursor:"pointer", letterSpacing:"0.5px" }}>
                + Add Another Child {children.length > 0 ? `(${children.length + 1} of 5)` : ""}
              </button>
            )}
          </div>
        )}

        {/* ── STEP 1 — Schedule ── */}
        {step === 1 && (
          <div>
            <h2 style={{ fontSize:"21px", fontWeight:400, marginBottom:"5px" }}>Choose Your Rhythm</h2>
            <p style={{ fontSize:"14px", color:TEXT_MID, marginBottom:"20px", lineHeight:1.6 }}>
              Tap individual days to build each child's schedule. The more weeks you commit, the better the rate.
            </p>

            {/* Pricing tiers reference */}
            <div style={{ background:"#fff", border:`1px solid ${CREAM_DARK}`, borderRadius:"10px", padding:"14px", marginBottom:"20px" }}>
              <p style={{ fontSize:"11px", letterSpacing:"1px", textTransform:"uppercase", color:TEXT_LIGHT, margin:"0 0 10px" }}>Weekly Rates</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:"6px", textAlign:"center" }}>
                <div style={{ fontSize:"10px", color:TEXT_LIGHT, paddingBottom:"4px", borderBottom:`1px solid ${CREAM_DARK}` }}></div>
                <div style={{ fontSize:"10px", color:TEXT_LIGHT, paddingBottom:"4px", borderBottom:`1px solid ${CREAM_DARK}` }}>3 days</div>
                <div style={{ fontSize:"10px", color:TEXT_LIGHT, paddingBottom:"4px", borderBottom:`1px solid ${CREAM_DARK}` }}>4 days</div>
                <div style={{ fontSize:"10px", color:TEXT_LIGHT, paddingBottom:"4px", borderBottom:`1px solid ${CREAM_DARK}` }}>5 days</div>
                <div style={{ fontSize:"11px", color:TEXT_MID, padding:"5px 0" }}>Standard</div>
                <div style={{ fontSize:"12px", color:OLIVE, padding:"5px 0" }}>$260</div>
                <div style={{ fontSize:"12px", color:OLIVE, padding:"5px 0" }}>$345</div>
                <div style={{ fontSize:"12px", color:OLIVE, padding:"5px 0" }}>$420</div>
                <div style={{ fontSize:"11px", color:NAVY, padding:"5px 0" }}>18+ wks</div>
                <div style={{ fontSize:"12px", color:NAVY, padding:"5px 0" }}>$180</div>
                <div style={{ fontSize:"12px", color:NAVY, padding:"5px 0" }}>$230</div>
                <div style={{ fontSize:"12px", color:NAVY, padding:"5px 0" }}>$275</div>
              </div>
              <div style={{ marginTop:"10px", paddingTop:"10px", borderTop:`1px solid ${CREAM_DARK}` }}>
                <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
                  <span style={{ fontSize:"11px", background:OLIVE_LIGHT, color:OLIVE_DARK, padding:"3px 8px", borderRadius:"12px" }}>4–11 wks: −5%</span>
                  <span style={{ fontSize:"11px", background:OLIVE_LIGHT, color:OLIVE_DARK, padding:"3px 8px", borderRadius:"12px" }}>12–17 wks: −15%</span>
                  <span style={{ fontSize:"11px", background:"#e8eaf6", color:NAVY, padding:"3px 8px", borderRadius:"12px" }}>18+ wks: flat rate</span>
                  <span style={{ fontSize:"11px", background:"#fff3eb", color:ORANGE, padding:"3px 8px", borderRadius:"12px" }}>Sibling: −10% each</span>
                </div>
              </div>
            </div>

            {children.length > 1 && (
              <div style={{ display:"flex", gap:"8px", marginBottom:"20px", flexWrap:"wrap" }}>
                {children.map((ch, i) => (
                  <button key={i} onClick={() => setActiveChild(i)}
                    style={{ flex:"0 0 auto", background:activeChild===i?OLIVE:"#fff", color:activeChild===i?"#fff":TEXT_MID,
                      border:`1.5px solid ${activeChild===i?OLIVE:CREAM_DARK}`, borderRadius:"8px", padding:"9px 16px", fontSize:"13px", cursor:"pointer" }}>
                    {ch.fn || `Child ${i + 1}`}{i > 0 ? " 🌿" : ""}
                  </button>
                ))}
              </div>
            )}

            <div style={{ background:OLIVE_LIGHT, borderRadius:"8px", padding:"10px 14px", marginBottom:"16px" }}>
              <p style={{ fontSize:"13px", color:OLIVE_DARK, margin:0 }}>
                <strong>{children[activeChild]?.fn || `Child ${activeChild + 1}`}</strong>
                {" · "}{PROGRAMS.find(p => p.id === children[activeChild]?.prog)?.name || "No program selected"}
                {activeChild > 0 ? " · 🌿 Sibling discount" : ""}
              </p>
            </div>

            <ChildCalendar
              key={activeChild}
              childName={children[activeChild]?.fn || `Child ${activeChild + 1}`}
              days={children[activeChild]?.days instanceof Set ? children[activeChild].days : new Set()}
              setDays={u => setChildDays(activeChild, u)}
              lunch={children[activeChild]?.lunch || false}
              setLunch={l => setChildLunch(activeChild, l)}
              todayYmd={todayYmd}
              siblingIndex={activeChild}
            />
          </div>
        )}

        {/* ── STEP 2 — Parent Info ── */}
        {step === 2 && (
          <div>
            <h2 style={{ fontSize:"21px", fontWeight:400, marginBottom:"5px" }}>Your Information</h2>
            <p style={{ fontSize:"14px", color:TEXT_MID, marginBottom:"22px", lineHeight:1.5 }}>
              {session ? "Confirm your details — saved from your account." : "Tell us how to reach you."}
            </p>
            <div style={{ background:"#fff", borderRadius:"12px", padding:"24px", border:`1px solid ${CREAM_DARK}` }}>
              <span style={lbl}>Full Name</span>
              <input style={inp} value={parentName} onChange={e => setParentName(e.target.value)} placeholder="Your full name"/>
              <span style={lbl}>Email Address</span>
              <input style={inp} type="email" value={parentEmail} onChange={e => setParentEmail(e.target.value)} placeholder="your@email.com" readOnly={!!session}/>
              <span style={lbl}>Phone / WhatsApp</span>
              <input style={inp} value={parentPhone} onChange={e => setParentPhone(e.target.value)} placeholder="+1 555 000 0000"/>
            </div>

            {/* Referral code */}
            <div style={{ background:"#fff", border:`1px solid ${CREAM_DARK}`, borderRadius:"12px", padding:"20px", marginTop:"16px" }}>
              <p style={{ fontSize:"13px", color:TEXT_DARK, margin:"0 0 4px" }}>🌿 Have a referral code?</p>
              <p style={{ fontSize:"12px", color:TEXT_LIGHT, margin:"0 0 14px", lineHeight:1.5 }}>
                Enter a friend's Wild Child code for 5% off your tuition.
              </p>
              <div style={{ display:"flex", gap:"8px" }}>
                <input
                  style={{ ...inp, marginBottom:0, flex:1, textTransform:"uppercase", letterSpacing:"2px" }}
                  value={referralCodeInput}
                  onChange={e => {
                    setReferralCodeInput(e.target.value);
                    setReferralStatus(null);
                    setReferralProfile(null);
                  }}
                  placeholder="WC-XXXXXX"
                />
                <button
                  onClick={() => checkReferralCode(referralCodeInput)}
                  disabled={referralStatus === "checking" || !referralCodeInput.trim()}
                  style={{ background:OLIVE, color:"#fff", border:"none", borderRadius:"8px", padding:"0 16px",
                    fontSize:"13px", cursor:"pointer", fontFamily:"Georgia,serif", whiteSpace:"nowrap",
                    opacity: !referralCodeInput.trim() ? 0.5 : 1 }}>
                  {referralStatus === "checking" ? "..." : "Apply"}
                </button>
              </div>
              {referralStatus === "valid" && (
                <div style={{ display:"flex", alignItems:"center", gap:"8px", marginTop:"10px", padding:"10px 12px", background:"#f0f7ec", borderRadius:"8px", border:`1px solid ${SAGE}` }}>
                  <span style={{ fontSize:"16px" }}>✅</span>
                  <div>
                    <p style={{ fontSize:"13px", color:GREEN, margin:"0 0 2px" }}>Code applied — 5% off your tuition!</p>
                    <p style={{ fontSize:"11px", color:TEXT_LIGHT, margin:0 }}>Referred by {referralProfile?.full_name || "a Wild Child family"}</p>
                  </div>
                </div>
              )}
              {referralStatus === "invalid" && (
                <p style={{ fontSize:"12px", color:"#c0392b", marginTop:"8px" }}>Code not found. Please check and try again.</p>
              )}
            </div>

            {!session && (
              <div style={{ background:"#fff", border:`1px solid ${CREAM_DARK}`, borderRadius:"12px", padding:"20px", marginTop:"16px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"4px", cursor:"pointer" }} onClick={() => setCreateAcct(!createAcct)}>
                  <input type="checkbox" checked={createAcct} onChange={e => setCreateAcct(e.target.checked)}/>
                  <span style={{ fontSize:"14px", color:TEXT_DARK }}>Save my info for faster future enrollments</span>
                </div>
                <p style={{ fontSize:"12px", color:TEXT_LIGHT, margin:"4px 0 0 28px", lineHeight:1.5 }}>
                  Creates a free account. Next time, your children's info and waiver are already on file. You'll also get a referral code to share.
                </p>
                {createAcct && (
                  <div style={{ marginTop:"16px" }}>
                    <span style={lbl}>Create Password</span>
                    <input style={inp} type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="At least 6 characters"/>
                    <span style={lbl}>Confirm Password</span>
                    <input style={inp} type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Repeat password"/>
                  </div>
                )}
              </div>
            )}
            {err && <p style={{ color:"#c0392b", fontSize:"13px", marginTop:"12px" }}>{err}</p>}
          </div>
        )}

        {/* ── STEP 3 — Payment ── */}
        {step === 3 && (
          <div>
            <h2 style={{ fontSize:"21px", fontWeight:400, marginBottom:"5px" }}>Payment</h2>
            <p style={{ fontSize:"14px", color:TEXT_MID, marginBottom:"20px" }}>Full amount due today.</p>

            {/* Order summary */}
            <div style={{ background:"#fff", border:`1px solid ${CREAM_DARK}`, borderRadius:"10px", padding:"16px", marginBottom:"20px" }}>
              <p style={{ fontSize:"11px", letterSpacing:"1px", textTransform:"uppercase", color:TEXT_LIGHT, margin:"0 0 10px" }}>Order Summary</p>

              {children.map((ch, i) => {
                const ct = childTotals[i];
                const wkEntries = ct.weekGroups;
                if (wkEntries.length === 0) return null;
                const validWks = wkEntries.filter(wk => weekValid(wk.days.length));
                const totalWeeks = validWks.length;
                return (
                  <div key={i} style={{ marginBottom:"12px", paddingBottom:"12px", borderBottom:`1px solid ${CREAM_DARK}` }}>
                    {children.length > 1 && (
                      <p style={{ fontSize:"11px", color:OLIVE, margin:"0 0 6px", textTransform:"uppercase", letterSpacing:"1px" }}>
                        {ch.fn || `Child ${i + 1}`}{i > 0 ? " (sibling)" : ""}
                      </p>
                    )}
                    {wkEntries.map(wk => {
                      const n  = wk.days.length;
                      const p  = baseWeekPrice(n, totalWeeks);
                      const lc = ch.lunch ? n * LUNCH_PER_DAY : 0;
                      const dayNames = wk.days.map(dk => weekdayName(parseKey(dk))).sort().join(", ");
                      return (
                        <div key={wk.wk} style={{ padding:"5px 0", borderBottom:`1px solid ${CREAM_DARK}` }}>
                          <div style={{ display:"flex", justifyContent:"space-between", fontSize:"13px", color:TEXT_DARK }}>
                            <span>Wk of {formatYmd(wk.monday)}</span>
                            <span>${p}{ch.lunch ? ` + $${lc}` : ""}</span>
                          </div>
                          <div style={{ fontSize:"12px", color:TEXT_LIGHT, marginTop:"2px" }}>
                            {dayNames}{ch.lunch ? ` · $${lc} lunch (${n}×$10)` : ""}
                          </div>
                        </div>
                      );
                    })}

                    {/* Per-child discount breakdown */}
                    <div style={{ paddingTop:"8px" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", fontSize:"12px", color:TEXT_LIGHT, paddingBottom:"3px" }}>
                        <span>Base tuition</span><span>${ct.baseTuition}</span>
                      </div>
                      {ct.volumeDiscount > 0 && (
                        <div style={{ display:"flex", justifyContent:"space-between", fontSize:"12px", color:GREEN, paddingBottom:"3px" }}>
                          <span>{volumeLabel(totalWeeks)}</span><span>−${ct.volumeDiscount}</span>
                        </div>
                      )}
                      {totalWeeks >= 18 && (
                        <div style={{ display:"flex", justifyContent:"space-between", fontSize:"12px", color:NAVY, paddingBottom:"3px" }}>
                          <span>18+ week flat rate</span><span>✓</span>
                        </div>
                      )}
                      {ct.sibDiscount > 0 && (
                        <div style={{ display:"flex", justifyContent:"space-between", fontSize:"12px", color:ORANGE, paddingBottom:"3px" }}>
                          <span>Sibling discount (−10%)</span><span>−${ct.sibDiscount}</span>
                        </div>
                      )}
                      {ct.refDiscount > 0 && (
                        <div style={{ display:"flex", justifyContent:"space-between", fontSize:"12px", color:GREEN, paddingBottom:"3px" }}>
                          <span>Referral discount (−5%)</span><span>−${ct.refDiscount}</span>
                        </div>
                      )}
                      {ct.lunchCost > 0 && (
                        <div style={{ display:"flex", justifyContent:"space-between", fontSize:"12px", color:GREEN, paddingBottom:"3px" }}>
                          <span>Lunch ({Array.from(ch.days).length} days × $10)</span><span>${ct.lunchCost}</span>
                        </div>
                      )}
                      <div style={{ display:"flex", justifyContent:"space-between", fontSize:"13px", color:OLIVE, paddingTop:"4px", borderTop:`1px solid ${CREAM_DARK}`, fontWeight:500 }}>
                        <span>Child subtotal</span><span>${ct.total}</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div style={{ display:"flex", justifyContent:"space-between", fontSize:"17px", paddingTop:"10px", color:TEXT_DARK }}>
                <span>Total Due</span><span style={{ color:OLIVE }}>${grandTotal}</span>
              </div>
            </div>

            {clientSecret ? (
              <Elements stripe={stripePromise} options={{ clientSecret, appearance:{ theme:"flat", variables:{ colorPrimary:OLIVE, fontFamily:"Georgia, serif", borderRadius:"8px" } } }}>
                <StripePaymentForm busy={busy} setBusy={setBusy}
                  onSuccess={async () => {
                    setBusy(true);
                    await saveRegistrations();
                    setBusy(false);
                    setStep(waiverAlreadySigned ? confirmStep : 4);
                    window.scrollTo(0, 0);
                  }}
                />
              </Elements>
            ) : (
              <div style={{ textAlign:"center", padding:"30px", color:TEXT_LIGHT }}>
                <p style={{ fontSize:"14px" }}>Setting up payment...</p>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 4 — Waiver ── */}
        {!waiverAlreadySigned && step === 4 && (
          <div>
            <h2 style={{ fontSize:"21px", fontWeight:400, marginBottom:"5px" }}>Waiver & Consent</h2>
            <p style={{ fontSize:"14px", color:TEXT_MID, marginBottom:"22px" }}>
              Please read and complete each section. Once signed, this is saved to your account.
            </p>

            {WAIVER_SECTIONS.map(s => (
              <div key={s.key} style={{ background:"#fff", border:`1px solid ${CREAM_DARK}`, borderRadius:"10px", padding:"18px", marginBottom:"14px" }}>
                <p style={{ fontSize:"11px", letterSpacing:"1px", textTransform:"uppercase", color:TEXT_LIGHT, margin:"0 0 9px" }}>{s.title}</p>
                <p style={{ fontSize:"13px", lineHeight:1.7, color:TEXT_MID, margin:"0 0 12px" }}>{s.text}</p>
                <label style={{ display:"flex", gap:"10px", alignItems:"flex-start", cursor:"pointer" }}>
                  <input type="checkbox" checked={w[s.key]} onChange={e => setW({ ...w, [s.key]: e.target.checked })}/>
                  <span style={{ fontSize:"13px", color:TEXT_DARK, lineHeight:1.5 }}>{s.checkLabel}</span>
                </label>
              </div>
            ))}

            {[
              { key:"media", title:"3. Media Release",
                text:"Photos/videos may be taken during activities and used for educational documentation and promotional purposes.",
                opts:[
                  { id:"mediaY", checked:w.mediaY, onChange:()=>setW({...w,mediaY:true,mediaN:false}),  label:"YES – I grant permission" },
                  { id:"mediaN", checked:w.mediaN, onChange:()=>setW({...w,mediaY:false,mediaN:true}),  label:"NO – I do not grant permission" },
                ] },
              { key:"exc", title:"4. Excursion Permission",
                text:"Wild Child may organize supervised local outings: neighborhood walks, beaches, farms, and community spaces.",
                opts:[
                  { id:"excY", checked:w.excY, onChange:()=>setW({...w,excY:true,excN:false}),  label:"YES – I grant permission" },
                  { id:"excN", checked:w.excN, onChange:()=>setW({...w,excY:false,excN:true}),  label:"NO – I do not grant permission" },
                ] },
            ].map(s => (
              <div key={s.key} style={{ background:"#fff", border:`1px solid ${CREAM_DARK}`, borderRadius:"10px", padding:"18px", marginBottom:"14px" }}>
                <p style={{ fontSize:"11px", letterSpacing:"1px", textTransform:"uppercase", color:TEXT_LIGHT, margin:"0 0 9px" }}>{s.title}</p>
                <p style={{ fontSize:"13px", lineHeight:1.7, color:TEXT_MID, margin:"0 0 12px" }}>{s.text}</p>
                {s.opts.map(o => (
                  <label key={o.id} style={{ display:"flex", gap:"10px", cursor:"pointer", marginBottom:"10px", alignItems:"flex-start" }}>
                    <input type="radio" name={s.key} checked={o.checked} onChange={o.onChange}/>
                    <span style={{ fontSize:"13px", color:TEXT_DARK }}>{o.label}</span>
                  </label>
                ))}
              </div>
            ))}

            <div style={{ background:"#fff", border:`1px solid ${CREAM_DARK}`, borderRadius:"10px", padding:"18px", marginBottom:"14px" }}>
              <p style={{ fontSize:"11px", letterSpacing:"1px", textTransform:"uppercase", color:TEXT_LIGHT, margin:"0 0 9px" }}>5. Signature</p>
              <p style={{ fontSize:"13px", color:TEXT_MID, margin:"0 0 12px", lineHeight:1.5 }}>
                By signing, I confirm I am the legal parent/guardian of {children.map((c, i) => c.fn || `Child ${i+1}`).join(", ")} and all information is accurate.
              </p>
              <span style={lbl}>Digital Signature — type your full name</span>
              <input style={{ ...inp, fontStyle:"italic", fontSize:"17px" }} value={sig} onChange={e => setSig(e.target.value)} placeholder="Your full name"/>
              <p style={{ fontSize:"11px", color:TEXT_LIGHT, margin:0 }}>
                Date: {new Date().toLocaleDateString("en-US", { month:"long", day:"numeric", year:"numeric" })}
              </p>
            </div>
          </div>
        )}

        {/* ── Confirmation ── */}
        {step === confirmStep && (
          <div style={{ textAlign:"center", padding:"16px 0" }}>
            <div style={{ width:"68px", height:"68px", borderRadius:"50%", background:OLIVE, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px", fontSize:"28px" }}>🌿</div>
            <h2 style={{ fontSize:"26px", fontWeight:400, marginBottom:"8px" }}>Welcome to the Wild!</h2>
            <p style={{ fontSize:"14px", color:TEXT_MID, maxWidth:"420px", margin:"0 auto 24px", lineHeight:1.6 }}>
              {children.map((c, i) => c.fn || `Child ${i+1}`).join(" and ")} {children.length > 1 ? "are" : "is"} enrolled. We're so excited to welcome your family!
            </p>

            <div style={{ background:"#fff", border:`1px solid ${CREAM_DARK}`, borderRadius:"10px", padding:"18px", maxWidth:"420px", margin:"0 auto 20px", textAlign:"left", width:"100%" }}>
              <p style={{ fontSize:"11px", letterSpacing:"1px", textTransform:"uppercase", color:TEXT_LIGHT, margin:"0 0 12px" }}>Enrollment Summary</p>
              {children.map((ch, i) => {
                const sp = PROGRAMS.find(p => p.id === ch.prog);
                const ct = childTotals[i];
                const wkEntries = ct.weekGroups;
                return (
                  <div key={i} style={{ marginBottom:"10px", paddingBottom:"10px", borderBottom:`1px solid ${CREAM_DARK}` }}>
                    <p style={{ fontSize:"13px", color:OLIVE, margin:"0 0 3px", fontWeight:500 }}>{ch.fn || `Child ${i+1}`} — {sp?.name || "—"}</p>
                    <p style={{ fontSize:"12px", color:TEXT_LIGHT, margin:"0 0 2px" }}>
                      {wkEntries.filter(wk => weekValid(wk.days.length)).length} week{wkEntries.length !== 1 ? "s" : ""} · {Array.from(ch.days).length} days{ch.lunch ? " · Lunch" : ""}
                    </p>
                    {(ct.volumeDiscount > 0 || ct.sibDiscount > 0 || ct.refDiscount > 0) && (
                      <p style={{ fontSize:"11px", color:GREEN, margin:0 }}>
                        Discounts applied: {[
                          ct.volumeDiscount > 0 ? `−$${ct.volumeDiscount} volume` : null,
                          ct.sibDiscount    > 0 ? `−$${ct.sibDiscount} sibling`   : null,
                          ct.refDiscount    > 0 ? `−$${ct.refDiscount} referral`  : null,
                        ].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                );
              })}
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:"16px", color:TEXT_DARK }}>
                <span>Total Paid</span><span style={{ color:OLIVE }}>${grandTotal}</span>
              </div>
            </div>

            <div style={{ background:OLIVE_LIGHT, border:`1px solid ${SAGE}`, borderRadius:"10px", padding:"14px 18px", maxWidth:"420px", margin:"0 auto 20px", textAlign:"left", width:"100%" }}>
              <p style={{ fontSize:"13px", color:OLIVE_DARK, margin:"0 0 5px", fontWeight:"bold" }}>What happens next</p>
              <p style={{ fontSize:"13px", color:OLIVE_DARK, lineHeight:1.6, margin:0 }}>
                Confirmation sent to {parentEmail}. Our team at info@dandelionwildschooling.com has been notified. Pura vida! 🌺
              </p>
            </div>

            {session
              ? <a href="/portal" style={{ display:"inline-block", background:NAVY, color:"#fff", textDecoration:"none", borderRadius:"8px", padding:"13px 28px", fontSize:"13px", letterSpacing:"1px", textTransform:"uppercase", marginBottom:"16px" }}>View My Portal →</a>
              : <div style={{ background:"#fff", border:`1px solid ${CREAM_DARK}`, borderRadius:"10px", padding:"18px", maxWidth:"420px", margin:"0 auto 20px", width:"100%" }}>
                  <p style={{ fontSize:"14px", color:TEXT_DARK, margin:"0 0 6px" }}>Track your enrollments anytime</p>
                  <p style={{ fontSize:"12px", color:TEXT_LIGHT, margin:"0 0 14px", lineHeight:1.5 }}>Create a free account to see your schedule, history, and easily enroll in more weeks. You'll also get a referral code to share with friends.</p>
                  <a href="/login" style={{ display:"block", background:NAVY, color:"#fff", textDecoration:"none", borderRadius:"8px", padding:"12px", fontSize:"13px", letterSpacing:"1px", textTransform:"uppercase", textAlign:"center" }}>Create Account / Sign In</a>
                </div>
            }
            <p style={{ fontSize:"12px", color:TEXT_LIGHT }}>Questions? <a href="mailto:info@dandelionwildschooling.com" style={{ color:OLIVE }}>info@dandelionwildschooling.com</a></p>
          </div>
        )}

        {/* Nav buttons */}
        {step !== confirmStep && step !== 3 && (
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:"32px", gap:"12px", flexWrap:"wrap" }}>
            {step > 0
              ? <button onClick={() => setStep(s => s - 1)} style={{ background:"transparent", color:TEXT_MID, border:`1px solid ${CREAM_DARK}`, borderRadius:"8px", padding:"13px 22px", fontSize:"13px", letterSpacing:"1px", cursor:"pointer", textTransform:"uppercase" }}>← Back</button>
              : <div/>}
            <button onClick={handleNext} disabled={busy}
              style={{ background:busy?"#aaa":ORANGE, color:"#fff", border:"none", borderRadius:"8px", padding:"13px 28px",
                fontSize:"13px", letterSpacing:"1px", cursor:busy?"not-allowed":"pointer",
                textTransform:"uppercase", transition:"background .2s", flexShrink:0 }}>
              {busy ? "Please wait..." : step === waiverStep ? "Submit & Complete ✓" : "Continue →"}
            </button>
          </div>
        )}

        {step === 3 && (
          <div style={{ marginTop:"16px" }}>
            <button onClick={() => setStep(2)} style={{ background:"transparent", color:TEXT_MID, border:`1px solid ${CREAM_DARK}`, borderRadius:"8px", padding:"11px 22px", fontSize:"13px", letterSpacing:"1px", cursor:"pointer", textTransform:"uppercase" }}>← Back</button>
          </div>
        )}

      </div>
    </div>
  );
}
