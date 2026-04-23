import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import logo from "./assets/logo1.svg";

// ── Brand colors ──────────────────────────────────────────────────────────────
const OLIVE       = "#6b7a3f";
const OLIVE_DARK  = "#4d5a2c";
const OLIVE_LIGHT = "#eef1e6";
const NAVY        = "#0f1f5c";
const NAVY_MID    = "#2a3a7a";
const SAGE        = "#8fa88a";
const ORANGE      = "#c4682a";
const CREAM       = "#f5f0e8";
const CREAM_DARK  = "#e0d8c8";
const TEXT_DARK   = "#1a1a2e";
const TEXT_MID    = "#3d3d5c";
const TEXT_LIGHT  = "#7a7a9a";
const GREEN       = "#5a7a3a";
const TEAL = OLIVE; const TEAL_DARK = OLIVE_DARK; const TEAL_LIGHT = OLIVE_LIGHT;
const TEAL_MID = SAGE; const SAND = ORANGE;

// ── Pricing ───────────────────────────────────────────────────────────────────
const PRICE_3 = 260; const PRICE_5 = 420; const PRICE_4TH = 85; const LUNCH_PER_DAY = 10;
const WEEKDAYS = ["Mon","Tue","Wed","Thu","Fri"];

function weekPrice(n) {
  if (n <= 0) return 0;
  if (n <= 3) return PRICE_3;
  if (n === 4) return PRICE_3 + PRICE_4TH;
  return PRICE_5;
}

// ── Date helpers ──────────────────────────────────────────────────────────────
function getMonday(date) {
  const d = new Date(date); const day = d.getDay();
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1)); d.setHours(0,0,0,0); return d;
}
function addDays(date, n) { const d = new Date(date); d.setDate(d.getDate()+n); return d; }
function formatDate(date) { return date.toLocaleDateString("en-US",{month:"short",day:"numeric"}); }
function weekKey(monday) { return monday.toISOString().split("T")[0]; }
function dayKey(date) { return date.toISOString().split("T")[0]; }
function getWeeksForMonth(year, month) {
  const weeks = []; const firstDay = new Date(year, month, 1);
  let monday = getMonday(firstDay);
  if (monday > firstDay) monday = addDays(monday, -7);
  for (let i = 0; i < 7; i++) {
    const wStart = addDays(monday, i*7); const wEnd = addDays(wStart, 4);
    if (wStart.getMonth() <= month && wEnd.getMonth() >= month) weeks.push(wStart);
  }
  return weeks;
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const PROGRAMS = [
  { id:"lwo", name:"Little Wild Ones", age:"Ages 1–4", desc:"Sensory play, nature connection, creative movement, storytelling, music, and social-emotional development.", color:OLIVE },
  { id:"we",  name:"Wild Explorers",   age:"Ages 5–9", desc:"Outdoor learning, creative expression, mindfulness, movement, and academics — math, reading, writing, geography, and science.", color:NAVY },
];
const STEPS = ["Account","Family","Children","Schedule","Payment","Waiver","Confirmation"];

// ── Styles ────────────────────────────────────────────────────────────────────
const inp = { width:"100%", padding:"12px 14px", border:`1px solid ${CREAM_DARK}`, borderRadius:"8px", fontSize:"15px", fontFamily:"Georgia,serif", background:"#fff", color:TEXT_DARK, marginBottom:"14px", outline:"none", boxSizing:"border-box" };
const lbl = { display:"block", fontSize:"11px", letterSpacing:"1px", textTransform:"uppercase", color:TEXT_LIGHT, marginBottom:"6px", fontFamily:"Georgia,serif" };

// ── Calendar component ────────────────────────────────────────────────────────
function ChildCalendar({ childName, days, setDays, lunch, setLunch, today }) {
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const weeks = getWeeksForMonth(calYear, calMonth);

  const toggleDay = (date) => {
    if (date < today) return;
    const key = dayKey(date);
    const wk = weekKey(getMonday(date));
    setDays(prev => {
      const n = new Set(prev);
      if (n.has(key)) { n.delete(key); }
      else {
        const count = Array.from(n).filter(dk => weekKey(getMonday(new Date(dk))) === wk).length;
        if (count >= 5) return prev;
        n.add(key);
      }
      return n;
    });
  };

  // Compute week groups for summary
  const weekGroups = {};
  Array.from(days).forEach(dk => {
    const mon = getMonday(new Date(dk)); const wk = weekKey(mon);
    if (!weekGroups[wk]) weekGroups[wk] = { monday:mon, days:[] };
    weekGroups[wk].days.push(dk);
  });
  const weekEntries = Object.values(weekGroups).sort((a,b)=>a.monday-b.monday);
  const tuition = weekEntries.reduce((s,wk)=>s+weekPrice(wk.days.length),0);
  const lunchCost = lunch ? Array.from(days).length * LUNCH_PER_DAY : 0;

  return (
    <div>
      {/* Lunch toggle */}
      <div onClick={()=>setLunch(!lunch)}
        style={{ background:lunch?GREEN:"#fff", border:`1.5px solid ${lunch?GREEN:CREAM_DARK}`, borderRadius:"10px", padding:"14px 16px", cursor:"pointer", display:"flex", alignItems:"center", gap:"14px", marginBottom:"20px", transition:"all .2s" }}>
        <div style={{ flex:1 }}>
          <p style={{ fontSize:"14px", color:lunch?"#fff":TEXT_DARK, marginBottom:"2px", margin:"0 0 2px" }}>Add Organic Snack & Lunch</p>
          <p style={{ fontSize:"12px", color:lunch?"rgba(255,255,255,0.75)":TEXT_LIGHT, margin:0, lineHeight:1.4 }}>All organic, locally sourced, made with love. $10/day</p>
        </div>
        <div style={{ width:"20px", height:"20px", borderRadius:"50%", border:`2px solid ${lunch?"#fff":CREAM_DARK}`, background:lunch?"#fff":"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          {lunch && <div style={{ width:"10px", height:"10px", borderRadius:"50%", background:GREEN }}/>}
        </div>
      </div>

      {/* Calendar */}
      <div style={{ background:"#fff", border:`1px solid ${CREAM_DARK}`, borderRadius:"12px", padding:"16px", marginBottom:"8px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"14px" }}>
          <button onClick={()=>{ if(calMonth===0){setCalYear(y=>y-1);setCalMonth(11);}else setCalMonth(m=>m-1); }}
            style={{ background:"none", border:"none", cursor:"pointer", fontSize:"20px", color:TEXT_MID, padding:"2px 10px", lineHeight:1 }}>‹</button>
          <p style={{ fontSize:"15px", color:TEXT_DARK, margin:0 }}>{MONTHS[calMonth]} {calYear}</p>
          <button onClick={()=>{ if(calMonth===11){setCalYear(y=>y+1);setCalMonth(0);}else setCalMonth(m=>m+1); }}
            style={{ background:"none", border:"none", cursor:"pointer", fontSize:"20px", color:TEXT_MID, padding:"2px 10px", lineHeight:1 }}>›</button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:"4px", marginBottom:"8px", textAlign:"center" }}>
          {WEEKDAYS.map(d=><div key={d} style={{ fontSize:"11px", color:TEXT_LIGHT }}>{d}</div>)}
        </div>
        {weeks.map(monday=>{
          const wk = weekKey(monday);
          const wkDays = Array.from(days).filter(dk=>weekKey(getMonday(new Date(dk)))===wk);
          const count = wkDays.length;
          const isValid = count===0||count>=3; const isFull = count>=5;
          return (
            <div key={wk}>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:"4px", marginBottom:"3px" }}>
                {[0,1,2,3,4].map(offset=>{
                  const d = addDays(monday,offset);
                  const key = dayKey(d); const isSel = days.has(key);
                  const isPast = d<today; const inMonth = d.getMonth()===calMonth;
                  const isBlocked = !isSel&&isFull;
                  return (
                    <div key={offset} onClick={()=>!isPast&&!isBlocked&&toggleDay(d)}
                      style={{ textAlign:"center", padding:"8px 2px", borderRadius:"8px", transition:"all .15s",
                        background:isSel?OLIVE:(inMonth?CREAM:CREAM_DARK),
                        color:isSel?"#fff":(inMonth?TEXT_DARK:TEXT_LIGHT),
                        opacity:isPast?0.3:isBlocked?0.35:1,
                        cursor:isPast||isBlocked?"not-allowed":"pointer",
                        border:isSel?`1.5px solid ${OLIVE_DARK}`:"1.5px solid transparent" }}>
                      <div style={{ fontSize:"9px", opacity:0.7, marginBottom:"1px" }}>{d.toLocaleDateString("en-US",{month:"short"})}</div>
                      <div style={{ fontSize:"13px" }}>{d.getDate()}</div>
                    </div>
                  );
                })}
              </div>
              {count>0&&(
                <div style={{ textAlign:"right", marginBottom:"4px" }}>
                  <span style={{ fontSize:"10px", padding:"2px 8px", borderRadius:"10px", color:"#fff",
                    background:!isValid?"#e08c00":isFull?OLIVE:GREEN }}>
                    {count}/5 days{!isValid?" · select at least 3":isFull?" · full week ✓":count===4?" · 4-day week ✓":" · 3-day week ✓"}
                  </span>
                </div>
              )}
              {count===0&&<div style={{ marginBottom:"4px" }}/>}
            </div>
          );
        })}
        <p style={{ fontSize:"11px", color:TEXT_LIGHT, marginTop:"10px", textAlign:"center", margin:"10px 0 0" }}>Min 3 · max 5 days per week</p>
      </div>

      {/* Weekly summary */}
      {weekEntries.length>0&&(
        <div style={{ background:"#fff", border:`1px solid ${CREAM_DARK}`, borderRadius:"10px", padding:"14px", marginTop:"8px" }}>
          <p style={{ fontSize:"11px", letterSpacing:"1px", textTransform:"uppercase", color:TEXT_LIGHT, marginBottom:"10px", margin:"0 0 10px" }}>{childName} — Schedule Summary</p>
          {weekEntries.map(wk=>{
            const n=wk.days.length; const p=weekPrice(n); const lc=lunch?n*LUNCH_PER_DAY:0;
            const dayNames=wk.days.map(dk=>new Date(dk).toLocaleDateString("en-US",{weekday:"short"})).join(", ");
            return (
              <div key={weekKey(wk.monday)} style={{ display:"flex", justifyContent:"space-between", fontSize:"13px", padding:"5px 0", borderBottom:`1px solid ${CREAM_DARK}`, color:TEXT_MID }}>
                <span>Wk of {formatDate(wk.monday)} · {n}d ({dayNames}){lunch?` + lunch`:""}</span>
                <span style={{ color:TEXT_DARK, flexShrink:0, marginLeft:"8px" }}>${p+lc}</span>
              </div>
            );
          })}
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:"14px", paddingTop:"8px", color:TEXT_DARK }}>
            <span>Subtotal</span><span style={{ color:OLIVE }}>${tuition+lunchCost}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function WildChildRegistration() {
  const today = new Date(); today.setHours(0,0,0,0);

  const [step, setStep]     = useState(0);
  const [session, setSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);

  // Step 0 — Account
  const [authMode, setAuthMode] = useState("signup"); // signup | login
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [authError, setAuthError] = useState(null);
  const [authBusy, setAuthBusy] = useState(false);

  // Step 1 — Parent info
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");

  // Step 2 — Children (array, each: {fn,ln,dob,allergies,prog,days:Set,lunch})
  const [children, setChildren] = useState([
    { fn:"", ln:"", dob:"", allergies:"", prog:null, days:new Set(), lunch:false }
  ]);
  const [activeChild, setActiveChild] = useState(0); // for schedule tabs

  const [card, setCard] = useState({ num:"", exp:"", cvc:"" });
  const [w, setW] = useState({ liab:false, med:false, mediaY:false, mediaN:false, excY:false, excN:false });
  const [sig, setSig] = useState("");
  const [busy, setBusy] = useState(false);
  const [errs, setErrs] = useState({});

  // Load session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (s) {
        setSession(s);
        setEmail(s.user.email || "");
        // Load parent profile
        supabase.from("parent_profiles").select("*").eq("id", s.user.id).single()
          .then(({ data }) => {
            if (data) { setParentName(data.full_name||""); setParentPhone(data.phone||""); }
          });
        setStep(1); // skip account step if already logged in
      }
      setLoadingSession(false);
    });
  }, []);

  // Computed totals
  const grandTotal = children.reduce((sum, ch) => {
    const wg = {};
    Array.from(ch.days).forEach(dk => {
      const mon = getMonday(new Date(dk)); const wk = weekKey(mon);
      if (!wg[wk]) wg[wk] = { monday:mon, days:[] }; wg[wk].days.push(dk);
    });
    const tuit = Object.values(wg).reduce((s,wk)=>s+weekPrice(wk.days.length),0);
    const lnch = ch.lunch ? Array.from(ch.days).length * LUNCH_PER_DAY : 0;
    return sum + tuit + lnch;
  }, 0);

  // Child helpers
  const updateChild = (i, field, value) =>
    setChildren(prev => prev.map((c,idx)=>idx===i?{...c,[field]:value}:c));
  const addChild = () => {
    if (children.length >= 5) return;
    setChildren(prev => [...prev, { fn:"", ln:"", dob:"", allergies:"", prog:null, days:new Set(), lunch:false }]);
  };
  const removeChild = (i) => {
    setChildren(prev => prev.filter((_,idx)=>idx!==i));
    if (activeChild >= i && activeChild > 0) setActiveChild(activeChild-1);
  };
  const setChildDays = (i, days) => updateChild(i, "days", days);
  const setChildLunch = (i, lunch) => updateChild(i, "lunch", lunch);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleAuth = async () => {
    setAuthError(null); setAuthBusy(true);
    if (authMode === "signup") {
      if (password !== confirmPw) { setAuthError("Passwords don't match."); setAuthBusy(false); return; }
      if (password.length < 6) { setAuthError("Password must be at least 6 characters."); setAuthBusy(false); return; }
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) { setAuthError(error.message); setAuthBusy(false); return; }
      setSession(data.session);
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setAuthError("Incorrect email or password."); setAuthBusy(false); return; }
      setSession(data.session);
      setEmail(data.user.email || "");
      // Load existing profile
      const { data: profile } = await supabase.from("parent_profiles").select("*").eq("id", data.user.id).single();
      if (profile) { setParentName(profile.full_name||""); setParentPhone(profile.phone||""); }
      // Load existing children
      const { data: savedChildren } = await supabase.from("children").select("*").eq("parent_id", data.user.id);
      if (savedChildren && savedChildren.length > 0) {
        setChildren(savedChildren.map(c=>({ fn:c.first_name, ln:c.last_name, dob:c.dob||"", allergies:c.allergies||"", prog:c.program_id, days:new Set(), lunch:false })));
      }
    }
    setAuthBusy(false);
    setStep(1);
  };

  const saveProfile = async () => {
    if (!session) return;
    await supabase.from("parent_profiles").upsert({
      id: session.user.id, email, full_name: parentName, phone: parentPhone, updated_at: new Date().toISOString()
    });
  };

  const saveChildren = async () => {
    if (!session) return;
    for (const ch of children) {
      await supabase.from("children").upsert({
        parent_id: session.user.id,
        first_name: ch.fn, last_name: ch.ln,
        dob: ch.dob, allergies: ch.allergies,
        program_id: ch.prog,
        program_name: PROGRAMS.find(p=>p.id===ch.prog)?.name,
      }, { onConflict: "parent_id,first_name,last_name" });
    }
  };

  const handleSubmit = async () => {
    setBusy(true);
    await saveProfile();
    await saveChildren();
    const parentUserId = session?.user?.id || null;
    for (const ch of children) {
      const wg = {};
      Array.from(ch.days).forEach(dk => {
        const mon = getMonday(new Date(dk)); const wk = weekKey(mon);
        if (!wg[wk]) wg[wk] = { monday:mon, days:[] }; wg[wk].days.push(dk);
      });
      const wkEntries = Object.values(wg);
      const tuit = wkEntries.reduce((s,wk)=>s+weekPrice(wk.days.length),0);
      const lnch = ch.lunch ? Array.from(ch.days).length * LUNCH_PER_DAY : 0;
      const sp = PROGRAMS.find(p=>p.id===ch.prog);
      await supabase.from("registrations").insert({
        program_id: ch.prog, program_name: sp?.name,
        child_first_name: ch.fn, child_last_name: ch.ln,
        child_dob: ch.dob, child_allergies: ch.allergies,
        parent_name: parentName, parent_email: email, parent_phone: parentPhone,
        selected_days: Array.from(ch.days), lunch: ch.lunch,
        subtotal_tuition: tuit, subtotal_lunch: lnch, grand_total: tuit+lnch,
        waiver_liability: w.liab, waiver_medical: w.med,
        waiver_media: w.mediaY?"yes":w.mediaN?"no":null,
        waiver_excursion: w.excY?"yes":w.excN?"no":null,
        waiver_signature: sig, waiver_date: new Date().toISOString(),
        payment_status: "pending", parent_user_id: parentUserId,
      });
    }
    setBusy(false);
    setStep(6);
  };

  const next = async () => {
    if (step === 0) { await handleAuth(); return; }
    if (step === 5) { await handleSubmit(); return; }
    if (step === 1) await saveProfile();
    setStep(s=>s+1); window.scrollTo(0,0);
  };

  if (loadingSession) return (
    <div style={{ fontFamily:"Georgia,serif", background:CREAM, minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <p style={{ color:OLIVE, fontSize:"14px" }}>Loading...</p>
    </div>
  );

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily:"Georgia,serif", background:CREAM, minHeight:"100vh", color:TEXT_DARK, WebkitTextSizeAdjust:"100%" }}>
      <style>{`
        * { box-sizing: border-box; }
        input, button, textarea { font-family: Georgia, serif; -webkit-appearance: none; }
        @media (max-width: 480px) {
          .name-row { flex-direction: column !important; gap: 0 !important; }
          .step-label { font-size: 10px !important; min-width: 44px !important; padding: 8px 1px !important; }
          .pricing-row { flex-direction: column !important; }
          .pay-row { flex-direction: column !important; gap: 0 !important; }
          .nav-row { flex-wrap: wrap !important; }
          .confirm-inner { max-width: 100% !important; width: 100% !important; }
        }
      `}</style>

      {/* Header */}
      <div style={{ background:OLIVE_DARK, overflow:"hidden", position:"relative", height:"90px", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 20px" }}>
        <div style={{ position:"absolute", left:"50%", top:"50%", transform:"translate(-50%, -40%)" }}>
          <img src={logo} alt="Wild Child Nosara" style={{ height:"180px", objectFit:"contain" }} />
        </div>
        <div style={{ width:"80px" }}/>
        {session
          ? <a href="/portal" style={{ position:"relative", zIndex:1, textDecoration:"none", background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.25)", borderRadius:"8px", padding:"8px 14px", fontSize:"12px", letterSpacing:"1px", color:"rgba(255,255,255,0.9)", textTransform:"uppercase", whiteSpace:"nowrap" }}>My Portal</a>
          : <a href="/login" style={{ position:"relative", zIndex:1, textDecoration:"none", background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.25)", borderRadius:"8px", padding:"8px 14px", fontSize:"12px", letterSpacing:"1px", color:"rgba(255,255,255,0.9)", textTransform:"uppercase", whiteSpace:"nowrap" }}>Sign In</a>
        }
      </div>

      {/* Step bar */}
      <div style={{ display:"flex", background:NAVY, overflowX:"auto" }}>
        {STEPS.map((s,i)=>(
          <div key={s} onClick={()=>i<step&&setStep(i)} className="step-label"
            style={{ flex:1, padding:"10px 2px", textAlign:"center", fontSize:"11px", whiteSpace:"nowrap", minWidth:"56px",
              color:i===step?"#fff":i<step?"rgba(255,255,255,0.65)":"rgba(255,255,255,0.3)",
              borderBottom:i===step?`2px solid ${ORANGE}`:"2px solid transparent", cursor:i<step?"pointer":"default" }}>
            {i<step?"✓ ":""}{s}
          </div>
        ))}
      </div>

      <div style={{ maxWidth:"600px", margin:"0 auto", padding:"28px 16px 100px", width:"100%" }}>

        {/* ── STEP 0 — Account ── */}
        {step===0 && (
          <div>
            <h2 style={{ fontSize:"21px", fontWeight:400, marginBottom:"5px" }}>
              {authMode==="signup" ? "Create Your Account" : "Welcome Back"}
            </h2>
            <p style={{ fontSize:"14px", color:TEXT_MID, marginBottom:"24px", lineHeight:1.6 }}>
              {authMode==="signup"
                ? "Your account keeps your children's info saved so future enrollments take just a few taps."
                : "Sign in to load your saved family info and enroll quickly."}
            </p>

            {authError && (
              <div style={{ background:"#fdecea", border:"1px solid #f5c6c6", borderRadius:"8px", padding:"12px 14px", marginBottom:"18px", fontSize:"13px", color:"#a32d2d" }}>
                {authError}
              </div>
            )}

            <div style={{ background:"#fff", borderRadius:"12px", padding:"24px", border:`1px solid ${CREAM_DARK}` }}>
              <span style={lbl}>Email</span>
              <input style={inp} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="your@email.com"/>
              <span style={lbl}>Password</span>
              <input style={inp} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••"/>
              {authMode==="signup" && <>
                <span style={lbl}>Confirm Password</span>
                <input style={inp} type="password" value={confirmPw} onChange={e=>setConfirmPw(e.target.value)} placeholder="••••••••"/>
              </>}
            </div>

            <div style={{ height:"1px", background:CREAM_DARK, margin:"20px 0" }}/>
            <p style={{ textAlign:"center", fontSize:"13px", color:TEXT_LIGHT }}>
              {authMode==="signup" ? "Already have an account? " : "New here? "}
              <button onClick={()=>{setAuthMode(authMode==="signup"?"login":"signup");setAuthError(null);}}
                style={{ background:"none", border:"none", color:ORANGE, cursor:"pointer", fontSize:"13px", padding:0 }}>
                {authMode==="signup" ? "Sign in instead" : "Create an account"}
              </button>
            </p>
          </div>
        )}

        {/* ── STEP 1 — Parent Info ── */}
        {step===1 && (
          <div>
            <h2 style={{ fontSize:"21px", fontWeight:400, marginBottom:"5px" }}>Your Information</h2>
            <p style={{ fontSize:"14px", color:TEXT_MID, marginBottom:"22px", lineHeight:1.5 }}>
              This is saved to your account and pre-fills automatically for future enrollments.
            </p>
            <div style={{ background:"#fff", borderRadius:"12px", padding:"24px", border:`1px solid ${CREAM_DARK}` }}>
              <span style={lbl}>Full Name</span>
              <input style={inp} value={parentName} onChange={e=>setParentName(e.target.value)} placeholder="Your full name"/>
              <span style={lbl}>Email</span>
              <input style={inp} type="email" value={email} readOnly style={{ ...inp, background:CREAM, color:TEXT_LIGHT, cursor:"default" }}/>
              <span style={lbl}>Phone / WhatsApp</span>
              <input style={inp} value={parentPhone} onChange={e=>setParentPhone(e.target.value)} placeholder="+1 555 000 0000"/>
            </div>
          </div>
        )}

        {/* ── STEP 2 — Children ── */}
        {step===2 && (
          <div>
            <h2 style={{ fontSize:"21px", fontWeight:400, marginBottom:"5px" }}>Your Children</h2>
            <p style={{ fontSize:"14px", color:TEXT_MID, marginBottom:"22px", lineHeight:1.5 }}>
              Add each child you'd like to enroll. Their info is saved to your account.
            </p>

            {children.map((ch, i) => (
              <div key={i} style={{ background:"#fff", border:`1.5px solid ${i===0?CREAM_DARK:OLIVE}`, borderRadius:"12px", padding:"20px", marginBottom:"16px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px" }}>
                  <p style={{ fontSize:"12px", letterSpacing:"1px", textTransform:"uppercase", color:i===0?TEXT_LIGHT:OLIVE, margin:0 }}>Child {i+1}</p>
                  {i>0 && (
                    <button onClick={()=>removeChild(i)}
                      style={{ background:"none", border:"none", color:TEXT_LIGHT, cursor:"pointer", fontSize:"13px" }}>Remove</button>
                  )}
                </div>

                <div className="name-row" style={{ display:"flex", gap:"12px" }}>
                  <div style={{ flex:1 }}><span style={lbl}>First Name</span><input style={inp} value={ch.fn} onChange={e=>updateChild(i,"fn",e.target.value)} placeholder="First name"/></div>
                  <div style={{ flex:1 }}><span style={lbl}>Last Name</span><input style={inp} value={ch.ln} onChange={e=>updateChild(i,"ln",e.target.value)} placeholder="Last name"/></div>
                </div>
                <span style={lbl}>Date of Birth</span>
                <input style={inp} type="date" value={ch.dob} onChange={e=>updateChild(i,"dob",e.target.value)}/>
                <span style={lbl}>Allergies / Dietary Notes</span>
                <input style={inp} value={ch.allergies} onChange={e=>updateChild(i,"allergies",e.target.value)} placeholder="None, or describe..."/>

                {/* Program selector */}
                <span style={{ ...lbl, marginTop:"4px" }}>Program</span>
                <div style={{ display:"flex", gap:"10px" }}>
                  {PROGRAMS.map(p=>(
                    <div key={p.id} onClick={()=>updateChild(i,"prog",p.id)}
                      style={{ flex:1, background:ch.prog===p.id?p.color:"#fff", border:`1.5px solid ${ch.prog===p.id?p.color:CREAM_DARK}`, borderRadius:"10px", padding:"14px 12px", cursor:"pointer", transition:"all .2s" }}>
                      <p style={{ fontSize:"11px", letterSpacing:"1px", textTransform:"uppercase", color:ch.prog===p.id?"rgba(255,255,255,0.8)":TEXT_LIGHT, marginBottom:"3px", margin:"0 0 3px" }}>{p.name}</p>
                      <p style={{ fontSize:"16px", fontWeight:400, color:ch.prog===p.id?"#fff":TEXT_DARK, margin:"0 0 6px" }}>{p.age}</p>
                      <p style={{ fontSize:"12px", color:ch.prog===p.id?"rgba(255,255,255,0.8)":TEXT_LIGHT, lineHeight:1.4, margin:0 }}>{p.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {children.length < 5 && (
              <button onClick={addChild}
                style={{ width:"100%", background:"transparent", border:`1.5px dashed ${CREAM_DARK}`, borderRadius:"10px", padding:"14px", color:TEXT_LIGHT, fontSize:"13px", cursor:"pointer", marginBottom:"8px", letterSpacing:"0.5px" }}>
                + Add Another Child {children.length > 0 ? `(${children.length+1} of 5)` : ""}
              </button>
            )}
          </div>
        )}

        {/* ── STEP 3 — Schedule ── */}
        {step===3 && (
          <div>
            <h2 style={{ fontSize:"21px", fontWeight:400, marginBottom:"5px" }}>Choose Your Rhythm</h2>
            <p style={{ fontSize:"14px", color:TEXT_MID, marginBottom:"20px", lineHeight:1.6 }}>
              Weekly enrollment of 3 or 5 days, with an optional 4th day (+$85). Tap days to build each child's schedule.
            </p>

            {/* Pricing reference */}
            <div className="pricing-row" style={{ display:"flex", gap:"8px", marginBottom:"20px" }}>
              {[{l:"3 Days/wk",p:`$${PRICE_3}`},{l:"4th Day",p:`+$${PRICE_4TH}`},{l:"5 Days/wk",p:`$${PRICE_5}`}].map(o=>(
                <div key={o.l} style={{ flex:1, background:"#fff", border:`1px solid ${CREAM_DARK}`, borderRadius:"8px", padding:"10px", textAlign:"center" }}>
                  <p style={{ fontSize:"12px", color:TEXT_MID, margin:"0 0 3px" }}>{o.l}</p>
                  <p style={{ fontSize:"15px", color:OLIVE, margin:0 }}>{o.p}<span style={{ fontSize:"10px", color:TEXT_LIGHT }}>/wk</span></p>
                </div>
              ))}
            </div>

            {/* Child tabs */}
            {children.length > 1 && (
              <div style={{ display:"flex", gap:"8px", marginBottom:"20px", flexWrap:"wrap" }}>
                {children.map((ch,i)=>(
                  <button key={i} onClick={()=>setActiveChild(i)}
                    style={{ flex:"0 0 auto", background:activeChild===i?OLIVE:"#fff", color:activeChild===i?"#fff":TEXT_MID,
                      border:`1.5px solid ${activeChild===i?OLIVE:CREAM_DARK}`, borderRadius:"8px",
                      padding:"9px 16px", fontSize:"13px", cursor:"pointer" }}>
                    {ch.fn||`Child ${i+1}`}
                  </button>
                ))}
              </div>
            )}

            {/* Active child's name + program */}
            <div style={{ background:OLIVE_LIGHT, borderRadius:"8px", padding:"10px 14px", marginBottom:"16px" }}>
              <p style={{ fontSize:"13px", color:OLIVE_DARK, margin:0 }}>
                <strong>{children[activeChild]?.fn||`Child ${activeChild+1}`}</strong>
                {" · "}{PROGRAMS.find(p=>p.id===children[activeChild]?.prog)?.name||"No program selected"}
              </p>
            </div>

            <ChildCalendar
              key={activeChild}
              childName={children[activeChild]?.fn||`Child ${activeChild+1}`}
              days={children[activeChild]?.days||new Set()}
              setDays={(d)=>setChildDays(activeChild,d)}
              lunch={children[activeChild]?.lunch||false}
              setLunch={(l)=>setChildLunch(activeChild,l)}
              today={today}
            />
          </div>
        )}

        {/* ── STEP 4 — Payment ── */}
        {step===4 && (
          <div>
            <h2 style={{ fontSize:"21px", fontWeight:400, marginBottom:"5px" }}>Payment</h2>
            <p style={{ fontSize:"14px", color:TEXT_MID, marginBottom:"20px" }}>Full amount due today.</p>

            <div style={{ background:"#fff", border:`1px solid ${CREAM_DARK}`, borderRadius:"10px", padding:"16px", marginBottom:"20px" }}>
              <p style={{ fontSize:"11px", letterSpacing:"1px", textTransform:"uppercase", color:TEXT_LIGHT, margin:"0 0 10px" }}>Order Summary</p>
              {children.map((ch,i)=>{
                const wg = {}; Array.from(ch.days).forEach(dk=>{
                  const mon=getMonday(new Date(dk)); const wk=weekKey(mon);
                  if(!wg[wk])wg[wk]={monday:mon,days:[]}; wg[wk].days.push(dk);
                });
                const wkEntries=Object.values(wg).sort((a,b)=>a.monday-b.monday);
                if(wkEntries.length===0)return null;
                const tuit=wkEntries.reduce((s,wk)=>s+weekPrice(wk.days.length),0);
                const lnch=ch.lunch?Array.from(ch.days).length*LUNCH_PER_DAY:0;
                return (
                  <div key={i} style={{ marginBottom:"10px" }}>
                    {children.length>1&&<p style={{ fontSize:"11px", color:OLIVE, margin:"8px 0 4px", textTransform:"uppercase", letterSpacing:"1px" }}>{ch.fn||`Child ${i+1}`}</p>}
                    {wkEntries.map(wk=>{
                      const n=wk.days.length; const p=weekPrice(n); const lc=ch.lunch?n*LUNCH_PER_DAY:0;
                      return (
                        <div key={weekKey(wk.monday)} style={{ display:"flex", justifyContent:"space-between", fontSize:"13px", padding:"4px 0", borderBottom:`1px solid ${CREAM_DARK}`, color:TEXT_MID }}>
                          <span>Wk of {formatDate(wk.monday)} · {n} day{n>1?"s":""}{ch.lunch?" + lunch":""}</span>
                          <span style={{ color:TEXT_DARK, flexShrink:0, marginLeft:"8px" }}>${p+lc}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:"17px", paddingTop:"10px", color:TEXT_DARK }}>
                <span>Total Due</span><span style={{ color:OLIVE }}>${grandTotal}</span>
              </div>
            </div>

            <div style={{ background:OLIVE_LIGHT, border:`1px solid ${SAGE}`, borderRadius:"8px", padding:"11px 14px", marginBottom:"20px", display:"flex", gap:"9px", alignItems:"center" }}>
              <span>🔒</span>
              <p style={{ fontSize:"12px", color:OLIVE_DARK, margin:0, lineHeight:1.5 }}>Demo mode — connects to Stripe in production. Any 16-digit number works.</p>
            </div>

            <span style={lbl}>Card Number</span>
            <input style={inp} value={card.num} onChange={e=>{const v=e.target.value.replace(/\D/g,"").slice(0,16);setCard({...card,num:v.replace(/(.{4})/g,"$1 ").trim()})}} placeholder="1234 5678 9012 3456" maxLength={19}/>
            <div className="pay-row" style={{ display:"flex", gap:"14px" }}>
              <div style={{ flex:1 }}>
                <span style={lbl}>Expiry</span>
                <input style={inp} value={card.exp} onChange={e=>{let v=e.target.value.replace(/\D/g,"").slice(0,4);if(v.length>2)v=v.slice(0,2)+"/"+v.slice(2);setCard({...card,exp:v})}} placeholder="MM/YY" maxLength={5}/>
              </div>
              <div style={{ flex:1 }}>
                <span style={lbl}>CVC</span>
                <input style={inp} value={card.cvc} onChange={e=>setCard({...card,cvc:e.target.value.replace(/\D/g,"").slice(0,4)})} placeholder="123" maxLength={4}/>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 5 — Waiver ── */}
        {step===5 && (
          <div>
            <h2 style={{ fontSize:"21px", fontWeight:400, marginBottom:"5px" }}>Waiver & Consent</h2>
            <p style={{ fontSize:"14px", color:TEXT_MID, marginBottom:"22px" }}>Please read and complete each section.</p>

            {[
              { key:"liab", title:"1. Assumption of Risk & Release of Liability",
                text:"Wild Child Playgarden & Wildschooling Nosara is a nature-based, outdoor educational program. Activities include outdoor play, gardening, forest and beach exploration, physical movement, water play, and exposure to uneven terrain, insects, plants, wildlife, and weather. I knowingly assume all risks and release Wild Child and its staff from all claims arising from my child's participation.",
                checkLabel:"I agree to the Assumption of Risk and Release of Liability." },
              { key:"med", title:"2. Medical & Emergency Consent",
                text:"I authorize Wild Child to seek emergency medical care for my child if I cannot be reached. I consent to examination, diagnosis, treatment, and/or hospital care deemed necessary by a licensed physician. All medical expenses are my responsibility.",
                checkLabel:"I agree to Medical & Emergency Care Consent." },
            ].map(s=>(
              <div key={s.key} style={{ background:"#fff", border:`1px solid ${CREAM_DARK}`, borderRadius:"10px", padding:"18px", marginBottom:"14px" }}>
                <p style={{ fontSize:"11px", letterSpacing:"1px", textTransform:"uppercase", color:TEXT_LIGHT, margin:"0 0 9px" }}>{s.title}</p>
                <p style={{ fontSize:"13px", lineHeight:1.7, color:TEXT_MID, margin:"0 0 12px" }}>{s.text}</p>
                <label style={{ display:"flex", gap:"8px", alignItems:"flex-start", cursor:"pointer" }}>
                  <input type="checkbox" checked={w[s.key]} onChange={e=>setW({...w,[s.key]:e.target.checked})} style={{ marginTop:"3px", accentColor:OLIVE }}/>
                  <span style={{ fontSize:"13px", color:TEXT_DARK, lineHeight:1.5 }}>{s.checkLabel}</span>
                </label>
              </div>
            ))}

            {[
              { key:"media", title:"3. Media Release", text:"Photos/videos may be taken during activities and used for educational documentation and promotional purposes including the Wild Child website and social media.",
                opts:[{id:"mediaY",checked:w.mediaY,onChange:()=>setW({...w,mediaY:true,mediaN:false}),label:"YES – I grant permission"},
                      {id:"mediaN",checked:w.mediaN,onChange:()=>setW({...w,mediaY:false,mediaN:true}),label:"NO – I do not grant permission"}] },
              { key:"exc", title:"4. Excursion Permission", text:"Wild Child may organize supervised local outings: neighborhood walks, beaches, farms, and community spaces.",
                opts:[{id:"excY",checked:w.excY,onChange:()=>setW({...w,excY:true,excN:false}),label:"YES – I grant permission"},
                      {id:"excN",checked:w.excN,onChange:()=>setW({...w,excY:false,excN:true}),label:"NO – I do not grant permission"}] },
            ].map(s=>(
              <div key={s.key} style={{ background:"#fff", border:`1px solid ${CREAM_DARK}`, borderRadius:"10px", padding:"18px", marginBottom:"14px" }}>
                <p style={{ fontSize:"11px", letterSpacing:"1px", textTransform:"uppercase", color:TEXT_LIGHT, margin:"0 0 9px" }}>{s.title}</p>
                <p style={{ fontSize:"13px", lineHeight:1.7, color:TEXT_MID, margin:"0 0 12px" }}>{s.text}</p>
                {s.opts.map(o=>(
                  <label key={o.id} style={{ display:"flex", gap:"8px", cursor:"pointer", marginBottom:"8px" }}>
                    <input type="radio" name={s.key} checked={o.checked} onChange={o.onChange} style={{ marginTop:"3px", accentColor:OLIVE }}/>
                    <span style={{ fontSize:"13px", color:TEXT_DARK }}>{o.label}</span>
                  </label>
                ))}
              </div>
            ))}

            <div style={{ background:"#fff", border:`1px solid ${CREAM_DARK}`, borderRadius:"10px", padding:"18px", marginBottom:"14px" }}>
              <p style={{ fontSize:"11px", letterSpacing:"1px", textTransform:"uppercase", color:TEXT_LIGHT, margin:"0 0 9px" }}>5. Signature</p>
              <p style={{ fontSize:"13px", color:TEXT_MID, margin:"0 0 12px", lineHeight:1.5 }}>
                By signing, I confirm I am the legal parent/guardian of {children.map((c,i)=>c.fn||`Child ${i+1}`).join(", ")} and all information is accurate.
              </p>
              <span style={lbl}>Digital Signature — type your full name</span>
              <input style={{ ...inp, fontStyle:"italic", fontSize:"17px" }} value={sig} onChange={e=>setSig(e.target.value)} placeholder="Your full name"/>
              <p style={{ fontSize:"11px", color:TEXT_LIGHT, margin:0 }}>Date: {new Date().toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}</p>
            </div>
          </div>
        )}

        {/* ── STEP 6 — Confirmation ── */}
        {step===6 && (
          <div style={{ textAlign:"center", padding:"16px 0" }}>
            <div style={{ width:"68px", height:"68px", borderRadius:"50%", background:OLIVE, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px", fontSize:"28px" }}>🌿</div>
            <h2 style={{ fontSize:"26px", fontWeight:400, marginBottom:"8px" }}>Welcome to the Wild!</h2>
            <p style={{ fontSize:"14px", color:TEXT_MID, maxWidth:"420px", margin:"0 auto 24px", lineHeight:1.6 }}>
              {children.map((c,i)=>c.fn||`Child ${i+1}`).join(" and ")} {children.length>1?"are":"is"} enrolled at Wild Child Nosara.
            </p>

            <div className="confirm-inner" style={{ background:"#fff", border:`1px solid ${CREAM_DARK}`, borderRadius:"10px", padding:"18px", maxWidth:"400px", margin:"0 auto 20px", textAlign:"left", width:"100%" }}>
              <p style={{ fontSize:"11px", letterSpacing:"1px", textTransform:"uppercase", color:TEXT_LIGHT, margin:"0 0 12px" }}>Enrollment Summary</p>
              {children.map((ch,i)=>{
                const sp=PROGRAMS.find(p=>p.id===ch.prog);
                const wg={}; Array.from(ch.days).forEach(dk=>{
                  const mon=getMonday(new Date(dk));const wk=weekKey(mon);
                  if(!wg[wk])wg[wk]={monday:mon,days:[]};wg[wk].days.push(dk);
                });
                const wkEntries=Object.values(wg).sort((a,b)=>a.monday-b.monday);
                return (
                  <div key={i} style={{ marginBottom:"12px", paddingBottom:"12px", borderBottom:`1px solid ${CREAM_DARK}` }}>
                    <p style={{ fontSize:"13px", color:OLIVE, margin:"0 0 4px", fontWeight:500 }}>{ch.fn||`Child ${i+1}`} — {sp?.name||"—"}</p>
                    <p style={{ fontSize:"12px", color:TEXT_LIGHT, margin:0 }}>{wkEntries.length} week{wkEntries.length!==1?"s":""} · {Array.from(ch.days).length} days{ch.lunch?" · Lunch":""}</p>
                  </div>
                );
              })}
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:"16px", color:TEXT_DARK }}>
                <span>Total Paid</span><span style={{ color:OLIVE }}>${grandTotal}</span>
              </div>
            </div>

            <div className="confirm-inner" style={{ background:OLIVE_LIGHT, border:`1px solid ${SAGE}`, borderRadius:"10px", padding:"14px 18px", maxWidth:"400px", margin:"0 auto 20px", textAlign:"left", width:"100%" }}>
              <p style={{ fontSize:"13px", color:OLIVE_DARK, margin:"0 0 5px", fontWeight:"bold" }}>What happens next</p>
              <p style={{ fontSize:"13px", color:OLIVE_DARK, lineHeight:1.6, margin:0 }}>
                A confirmation has been sent to {email}. Our team at info@dandelionwildschooling.com has been notified. Pura vida! 🌺
              </p>
            </div>

            <a href="/portal" style={{ display:"inline-block", background:NAVY, color:"#fff", textDecoration:"none", borderRadius:"8px", padding:"13px 28px", fontSize:"13px", letterSpacing:"1px", textTransform:"uppercase", marginBottom:"16px" }}>
              View My Portal
            </a>
            <br/>
            <p style={{ fontSize:"12px", color:TEXT_LIGHT }}>Questions? <a href="mailto:info@dandelionwildschooling.com" style={{ color:OLIVE }}>info@dandelionwildschooling.com</a></p>
          </div>
        )}

        {/* ── Nav buttons ── */}
        {step<6 && (
          <div className="nav-row" style={{ display:"flex", justifyContent:"space-between", marginTop:"32px", gap:"12px" }}>
            {step>0
              ? <button onClick={()=>setStep(s=>s-1)} style={{ background:"transparent", color:TEXT_MID, border:`1px solid ${CREAM_DARK}`, borderRadius:"8px", padding:"13px 22px", fontSize:"13px", letterSpacing:"1px", cursor:"pointer", textTransform:"uppercase" }}>← Back</button>
              : <div/>}
            <button onClick={next} disabled={busy||authBusy}
              style={{ background:(busy||authBusy)?"#aaa":ORANGE, color:"#fff", border:"none", borderRadius:"8px", padding:"13px 28px", fontSize:"13px", letterSpacing:"1px", cursor:(busy||authBusy)?"not-allowed":"pointer", textTransform:"uppercase", transition:"background .2s", flexShrink:0 }}>
              {busy||authBusy ? "Please wait..." : step===5 ? "Submit & Complete ✓" : step===4 ? `Pay $${grandTotal} →` : step===0 ? (authMode==="signup"?"Create Account →":"Sign In →") : "Continue →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
