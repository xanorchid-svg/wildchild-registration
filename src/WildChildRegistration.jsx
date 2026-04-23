import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import logo from "./assets/logo1.svg";

// Brand colors — Wild Child Nosara
const OLIVE       = "#6b7a3f";  // primary — olive green
const OLIVE_DARK  = "#4d5a2c";  // darker olive
const OLIVE_LIGHT = "#eef1e6";  // light olive tint
const NAVY        = "#0f1f5c";  // navy accent
const NAVY_MID    = "#2a3a7a";  // mid navy
const SAGE        = "#8fa88a";  // sage green
const ORANGE      = "#c4682a";  // burnt orange highlight
const PINK        = "#d4867a";  // dusty pink highlight
const CREAM       = "#f5f0e8";  // cream background
const CREAM_DARK  = "#e0d8c8";  // cream border
const TEXT_DARK   = "#1a1a2e";  // near-black text
const TEXT_MID    = "#3d3d5c";  // mid text
const TEXT_LIGHT  = "#7a7a9a";  // muted text

// Keep aliases for compatibility
const TEAL      = OLIVE;
const TEAL_DARK = OLIVE_DARK;
const TEAL_LIGHT = OLIVE_LIGHT;
const TEAL_MID  = SAGE;
const SAND      = ORANGE;
const GREEN     = "#5a7a3a";

// Pricing
const PRICE_3 = 260;
const PRICE_5 = 420;
const PRICE_4TH = 85;
const LUNCH_PER_DAY = 10;
const WEEKDAYS = ["Mon","Tue","Wed","Thu","Fri"];

function calcWeekPrice(numDays) {
  if (numDays === 0) return 0;
  if (numDays <= 3) return PRICE_3;
  if (numDays === 4) return PRICE_3 + PRICE_4TH;
  return PRICE_5;
}

function WildChildLogo({ height = 80 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink"
      height={height} viewBox="0 0 810 1012.5" preserveAspectRatio="xMidYMid meet" version="1.2">
      <defs>
        <clipPath id="lcp1"><path d="M 91 361 L 794 361 L 794 466 L 91 466 Z" /></clipPath>
      </defs>
      <g>
        <g clipRule="nonzero" clipPath="url(#lcp1)">
          <g mask="url(#lmask1)" transform="matrix(0.543135,0,0,0.546605,91.143348,361.444788)">
            <image width="1296" height="192" preserveAspectRatio="xMidYMid meet"
              xlinkHref="data:image/png;base64,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" />
          </g>
          <mask id="lmask1">
            <g>
              <image width="1296" height="192" preserveAspectRatio="xMidYMid meet"
                xlinkHref="data:image/png;base64,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" />
            </g>
          </mask>
        </g>
      </g>
    </svg>
  );
}

function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
  d.setHours(0,0,0,0);
  return d;
}
function addDays(date, n) {
  const d = new Date(date); d.setDate(d.getDate() + n); return d;
}
function formatDate(date) {
  return date.toLocaleDateString("en-US", { month:"short", day:"numeric" });
}
function weekKey(monday) { return monday.toISOString().split("T")[0]; }
function dayKey(date) { return date.toISOString().split("T")[0]; }
function getWeeksForMonth(year, month) {
  const weeks = [];
  const firstDay = new Date(year, month, 1);
  let monday = getMonday(firstDay);
  if (monday > firstDay) monday = addDays(monday, -7);
  for (let i = 0; i < 7; i++) {
    const wStart = addDays(monday, i * 7);
    const wEnd = addDays(wStart, 4);
    if (wStart.getMonth() <= month && wEnd.getMonth() >= month) weeks.push(wStart);
  }
  return weeks;
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const PROGRAMS = [
  { id:"lwo", name:"Little Wild Ones", age:"Ages 1–4", schedule:"Mon–Fri · 9:00am–3:00pm", desc:"A gentle, nurturing program for our youngest explorers. Focuses on sensory play, nature connection, creative movement, storytelling, music, and social-emotional development. Through free play and soft structure, children build confidence, coordination, language, and a sense of belonging.", color:OLIVE, emoji:"🌿" },
  { id:"we",  name:"Wild Explorers",   age:"Ages 5–9", schedule:"Mon–Fri · 9:00am–3:00pm", desc:"A curiosity-led program blending outdoor learning, creative expression, mindfulness, movement, and academics. Hands-on learning across math, reading, writing, geography, and science while developing critical thinking, collaboration, and independence.", color:NAVY, emoji:"🦋" },
];
const STEPS = ["Program","Child Info","Schedule","Payment","Waiver","Confirmation"];

const inp  = { width:"100%", padding:"11px 13px", border:`1px solid ${CREAM_DARK}`, borderRadius:"8px", fontSize:"15px", fontFamily:"Georgia,serif", background:"#fff", color:TEXT_DARK, marginBottom:"14px", outline:"none", boxSizing:"border-box" };
const lbl  = { display:"block", fontSize:"11px", letterSpacing:"1px", textTransform:"uppercase", color:TEXT_LIGHT, marginBottom:"5px", fontFamily:"Georgia,serif" };
const errSt = { color:"#c0392b", fontSize:"12px", fontFamily:"Georgia,serif", marginTop:"-10px", marginBottom:"10px" };

export default function WildChildRegistration() {
  const today = new Date(); today.setHours(0,0,0,0);
  const [step, setStep]     = useState(0);
  const [prog, setProg]     = useState(null);

  // Child 1
  const [child, setChild]   = useState({ fn:"", ln:"", dob:"", allergies:"" });

  // Siblings — array of up to 4, each: { fn, ln, dob, allergies, prog, days: Set, lunch }
  const [siblings, setSiblings] = useState([]);

  // Parent
  const [parent, setParent] = useState({ name:"", email:"", phone:"" });
  const [session, setSession] = useState(null);

  // Schedule — child 1
  const [selectedDays, setSelectedDays] = useState(new Set());
  const [lunch, setLunch]   = useState(false);

  // Which child's schedule tab is active
  const [schedTab, setSchedTab] = useState(0);

  const [calYear, setCalYear]   = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [card, setCard]     = useState({ num:"", exp:"", cvc:"" });
  const [w, setW]           = useState({ liab:false, med:false, mediaY:false, mediaN:false, excY:false, excN:false });
  const [sig, setSig]       = useState("");
  const [errs, setErrs]     = useState({});
  const [busy, setBusy]     = useState(false);

  // Load session — pre-fill parent info if logged in
  useEffect(() => {
    async function loadSession() {
      const { data: { session: s } } = await supabase.auth.getSession();
      if (s) {
        setSession(s);
        setParent(prev => ({ ...prev, email: s.user.email || prev.email }));
      }
    }
    loadSession();
  }, []);

  // Sibling helpers
  const addSibling = () => {
    if (siblings.length >= 4) return;
    setSiblings(prev => [...prev, { fn:"", ln:"", dob:"", allergies:"", prog:null, days:new Set(), lunch:false }]);
  };
  const removeSibling = (i) => {
    setSiblings(prev => prev.filter((_,idx)=>idx!==i));
    if (schedTab > i) setSchedTab(schedTab - 1);
    else if (schedTab === i + 1) setSchedTab(0);
  };
  const updateSibling = (i, field, value) => {
    setSiblings(prev => prev.map((s,idx) => idx===i ? {...s,[field]:value} : s));
  };
  const toggleSibDay = (sibIdx, date) => {
    if (date < today) return;
    const key = dayKey(date);
    const wk = weekKey(getMonday(date));
    setSiblings(prev => prev.map((s, idx) => {
      if (idx !== sibIdx) return s;
      const n = new Set(s.days);
      if (n.has(key)) { n.delete(key); }
      else {
        const daysThisWeek = Array.from(n).filter(dk => weekKey(getMonday(new Date(dk))) === wk);
        if (daysThisWeek.length >= 5) return s;
        n.add(key);
      }
      return { ...s, days: n };
    }));
  };

  const sp = PROGRAMS.find(p=>p.id===prog);

  // Group selected days by week — child 1
  const weekGroups = {};
  Array.from(selectedDays).forEach(dk => {
    const d = new Date(dk);
    const mon = getMonday(d);
    const wk = weekKey(mon);
    if (!weekGroups[wk]) weekGroups[wk] = { monday: mon, days: [] };
    weekGroups[wk].days.push(dk);
  });
  const weekEntries = Object.values(weekGroups).sort((a,b)=>a.monday-b.monday);

  function weekPrice(numDays) {
    if (numDays <= 0) return 0;
    if (numDays <= 3) return PRICE_3;
    if (numDays === 4) return PRICE_3 + PRICE_4TH;
    return PRICE_5;
  }

  const subtotalTuition = weekEntries.reduce((sum, wk) => sum + weekPrice(wk.days.length), 0);
  const totalDaysWithLunch = lunch ? Array.from(selectedDays).length : 0;
  const subtotalLunch = totalDaysWithLunch * LUNCH_PER_DAY;

  // Sibling totals
  const siblingsTotal = siblings.reduce((sum, sib) => {
    const sibGroups = {};
    Array.from(sib.days).forEach(dk => {
      const mon = getMonday(new Date(dk));
      const wk = weekKey(mon);
      if (!sibGroups[wk]) sibGroups[wk] = { monday:mon, days:[] };
      sibGroups[wk].days.push(dk);
    });
    const sibEntries = Object.values(sibGroups);
    const tuit = sibEntries.reduce((s, wk) => s + weekPrice(wk.days.length), 0);
    const lnch = sib.lunch ? Array.from(sib.days).length * LUNCH_PER_DAY : 0;
    return sum + tuit + lnch;
  }, 0);

  const grandTotal = subtotalTuition + subtotalLunch + siblingsTotal;

  const toggleDay = (date) => {
    if (date < today) return;
    const key = dayKey(date);
    const wk = weekKey(getMonday(date));
    setSelectedDays(prev => {
      const n = new Set(prev);
      if (n.has(key)) { n.delete(key); }
      else {
        const daysThisWeek = Array.from(n).filter(dk => weekKey(getMonday(new Date(dk))) === wk);
        if (daysThisWeek.length >= 5) return prev;
        n.add(key);
      }
      return n;
    });
  };

  const prevMonth = () => { if(calMonth===0){setCalYear(y=>y-1);setCalMonth(11);}else setCalMonth(m=>m-1); };
  const nextMonth = () => { if(calMonth===11){setCalYear(y=>y+1);setCalMonth(0);}else setCalMonth(m=>m+1); };

  // TODO: re-enable validation before launch
  const validate = () => { setErrs({}); return true; };

  const next = async () => {
    if (!validate()) return;
    if (step === 4) {
      setBusy(true);
      const parentUserId = session?.user?.id || null;

      // Save child 1
      const reg1 = {
        program_id: prog, program_name: sp?.name,
        child_first_name: child.fn, child_last_name: child.ln,
        child_dob: child.dob, child_allergies: child.allergies,
        parent_name: parent.name, parent_email: parent.email, parent_phone: parent.phone,
        selected_days: Array.from(selectedDays), lunch,
        subtotal_tuition: subtotalTuition, subtotal_lunch: subtotalLunch,
        grand_total: subtotalTuition + subtotalLunch,
        waiver_liability: w.liab, waiver_medical: w.med,
        waiver_media: w.mediaY ? "yes" : w.mediaN ? "no" : null,
        waiver_excursion: w.excY ? "yes" : w.excN ? "no" : null,
        waiver_signature: sig, waiver_date: new Date().toISOString(),
        payment_status: "pending", parent_user_id: parentUserId,
      };

      const { error: e1 } = await supabase.from("registrations").insert(reg1);
      if (e1) { setBusy(false); alert("Error saving registration: " + e1.message); return; }

      // Save siblings
      for (const sib of siblings) {
        const sibGroups = {};
        Array.from(sib.days).forEach(dk => {
          const mon = getMonday(new Date(dk));
          const wk = weekKey(mon);
          if (!sibGroups[wk]) sibGroups[wk] = { monday:mon, days:[] };
          sibGroups[wk].days.push(dk);
        });
        const sibEntries = Object.values(sibGroups);
        const sibTuit = sibEntries.reduce((s,wk) => s + weekPrice(wk.days.length), 0);
        const sibLnch = sib.lunch ? Array.from(sib.days).length * LUNCH_PER_DAY : 0;
        const sibSp = PROGRAMS.find(p=>p.id===sib.prog);
        const regSib = {
          program_id: sib.prog, program_name: sibSp?.name,
          child_first_name: sib.fn, child_last_name: sib.ln,
          child_dob: sib.dob, child_allergies: sib.allergies,
          parent_name: parent.name, parent_email: parent.email, parent_phone: parent.phone,
          selected_days: Array.from(sib.days), lunch: sib.lunch,
          subtotal_tuition: sibTuit, subtotal_lunch: sibLnch,
          grand_total: sibTuit + sibLnch,
          waiver_liability: w.liab, waiver_medical: w.med,
          waiver_media: w.mediaY ? "yes" : w.mediaN ? "no" : null,
          waiver_excursion: w.excY ? "yes" : w.excN ? "no" : null,
          waiver_signature: sig, waiver_date: new Date().toISOString(),
          payment_status: "pending", parent_user_id: parentUserId,
        };
        const { error: eSib } = await supabase.from("registrations").insert(regSib);
        if (eSib) { setBusy(false); alert("Error saving sibling: " + eSib.message); return; }
      }

      setBusy(false);
      setStep(5);
      return;
    }
    setStep(s => s + 1);
    window.scrollTo(0, 0);
  };

  const weeks = getWeeksForMonth(calYear, calMonth);

  const btnCard = (sel, color=TEAL) => ({
    background:sel?color:"#fff", border:`1.5px solid ${sel?color:CREAM_DARK}`,
    borderRadius:"10px", padding:"14px 10px", cursor:"pointer", transition:"all .2s"
  });

  return (
    <div style={{ fontFamily:"Georgia,serif", background:CREAM, minHeight:"100vh", color:TEXT_DARK, WebkitTextSizeAdjust:"100%" }}>
      <style>{`
        * { box-sizing: border-box; }
        input, button, textarea, select { font-family: Georgia, serif; -webkit-appearance: none; }
        @media (max-width: 480px) {
          .name-row { flex-direction: column !important; gap: 0 !important; }
          .pricing-row { flex-direction: column !important; gap: 8px !important; }
          .payment-row { flex-direction: column !important; gap: 0 !important; }
          .program-age { font-size: 20px !important; }
          .step-label { font-size: 10px !important; min-width: 50px !important; padding: 10px 2px !important; }
          .content-pad { padding: 20px 14px 80px !important; }
          .sched-tabs { flex-wrap: wrap !important; }
          .sched-tab { flex: 0 0 calc(50% - 4px) !important; }
          .confirm-card { max-width: 100% !important; }
        }
      `}</style>

      {/* Header */}
      <div style={{ background:OLIVE_DARK, overflow:"hidden", position:"relative", height:"90px", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 20px" }}>
        <div style={{ position:"absolute", left:"50%", top:"50%", transform:"translate(-50%, -40%)" }}>
          <img src={logo} alt="Wild Child Nosara" style={{ height:"180px", objectFit:"contain" }} />
        </div>
        <div style={{ width:"80px" }}/>
        <a href="/login" style={{ position:"relative", zIndex:1, display:"flex", alignItems:"center", textDecoration:"none", background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.25)", borderRadius:"8px", padding:"8px 14px" }}>
          <span style={{ fontSize:"12px", letterSpacing:"1px", color:"rgba(255,255,255,0.9)", textTransform:"uppercase", whiteSpace:"nowrap", fontFamily:"Georgia,serif" }}>Sign In</span>
        </a>
      </div>

      {/* Step bar */}
      <div style={{ display:"flex", background:NAVY, overflowX:"auto" }}>
        {STEPS.map((s,i)=>(
          <div key={s} onClick={()=>i<step&&setStep(i)}
            style={{ flex:1, padding:"12px 3px", textAlign:"center", fontSize:"12px", whiteSpace:"nowrap", minWidth:"70px",
              color:i===step?"#fff":i<step?"rgba(255,255,255,0.65)":"rgba(255,255,255,0.35)",
              borderBottom:i===step?`2px solid ${ORANGE}`:"2px solid transparent", cursor:i<step?"pointer":"default" }}
            className="step-label">
            {i<step?"✓ ":""}{s}
          </div>
        ))}
      </div>

      <div className="content-pad" style={{ maxWidth:"600px", margin:"0 auto", padding:"28px 16px 80px" }}>

        {/* STEP 0 — Program */}
        {step===0 && <>
          <h2 style={{ fontSize:"21px", fontWeight:400, marginBottom:"5px" }}>Choose a Program</h2>
          <p style={{ fontSize:"14px", color:TEXT_MID, marginBottom:"22px", lineHeight:1.5 }}>Select the program that fits your child's age.</p>
          {PROGRAMS.map(p=>(
            <div key={p.id} onClick={()=>setProg(p.id)}
              style={{ background:prog===p.id?p.color:"#fff", border:`1.5px solid ${prog===p.id?p.color:CREAM_DARK}`, borderRadius:"12px", padding:"22px", marginBottom:"14px", cursor:"pointer", transition:"all .2s" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"3px" }}>
                <span style={{ fontSize:"11px", letterSpacing:"1.5px", textTransform:"uppercase", color:prog===p.id?"rgba(255,255,255,0.75)":TEXT_LIGHT }}>{p.name}</span>
              </div>
              <p style={{ fontSize:"26px", fontWeight:400, color:prog===p.id?"#fff":TEXT_DARK, marginBottom:"4px" }}>{p.age}</p>
              <p style={{ fontSize:"12px", color:prog===p.id?"rgba(255,255,255,0.7)":TEXT_LIGHT, marginBottom:"12px" }}>{p.schedule}</p>
              <p style={{ fontSize:"13px", lineHeight:1.7, color:prog===p.id?"rgba(255,255,255,0.9)":TEXT_MID }}>{p.desc}</p>
              {prog===p.id && <div style={{ marginTop:"12px", display:"flex", alignItems:"center", gap:"6px" }}>
                <div style={{ width:"16px", height:"16px", borderRadius:"50%", background:"#fff", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <div style={{ width:"8px", height:"8px", borderRadius:"50%", background:p.color }}/>
                </div>
                <span style={{ color:"#fff", fontSize:"12px" }}>Selected</span>
              </div>}
            </div>
          ))}
        </>}

        {/* STEP 1 — Child Info */}
        {step===1 && <>
          <h2 style={{ fontSize:"21px", fontWeight:400, marginBottom:"5px" }}>Child & Family Information</h2>
          <p style={{ fontSize:"14px", color:TEXT_MID, marginBottom:"22px" }}>Tell us about your child and how to reach you.</p>

          {/* Child 1 */}
          <div style={{ background:"#fff", border:`1px solid ${CREAM_DARK}`, borderRadius:"10px", padding:"18px", marginBottom:"14px" }}>
            <p style={{ fontSize:"11px", letterSpacing:"1px", textTransform:"uppercase", color:TEXT_LIGHT, marginBottom:"14px" }}>Child 1</p>
            <div className="name-row" style={{ display:"flex", gap:"12px" }}>
              <div style={{ flex:1 }}><span style={lbl}>First Name</span><input style={inp} value={child.fn} onChange={e=>setChild({...child,fn:e.target.value})} placeholder="First name"/></div>
              <div style={{ flex:1 }}><span style={lbl}>Last Name</span><input style={inp} value={child.ln} onChange={e=>setChild({...child,ln:e.target.value})} placeholder="Last name"/></div>
            </div>
            <span style={lbl}>Date of Birth</span>
            <input style={inp} type="date" value={child.dob} onChange={e=>setChild({...child,dob:e.target.value})}/>
            <span style={lbl}>Allergies / Dietary Notes</span>
            <input style={inp} value={child.allergies} onChange={e=>setChild({...child,allergies:e.target.value})} placeholder="None, or describe..."/>
          </div>

          {/* Siblings */}
          {siblings.map((sib, i) => (
            <div key={i} style={{ background:"#fff", border:`1.5px solid ${OLIVE}`, borderRadius:"10px", padding:"18px", marginBottom:"14px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"14px" }}>
                <p style={{ fontSize:"11px", letterSpacing:"1px", textTransform:"uppercase", color:OLIVE, margin:0 }}>Child {i+2}</p>
                <button onClick={()=>removeSibling(i)}
                  style={{ background:"none", border:"none", color:TEXT_LIGHT, cursor:"pointer", fontSize:"13px", fontFamily:"Georgia,serif" }}>Remove</button>
              </div>
              <div className="name-row" style={{ display:"flex", gap:"12px" }}>
                <div style={{ flex:1 }}><span style={lbl}>First Name</span><input style={inp} value={sib.fn} onChange={e=>updateSibling(i,"fn",e.target.value)} placeholder="First name"/></div>
                <div style={{ flex:1 }}><span style={lbl}>Last Name</span><input style={inp} value={sib.ln} onChange={e=>updateSibling(i,"ln",e.target.value)} placeholder="Last name"/></div>
              </div>
              <span style={lbl}>Date of Birth</span>
              <input style={inp} type="date" value={sib.dob} onChange={e=>updateSibling(i,"dob",e.target.value)}/>
              <span style={lbl}>Allergies / Dietary Notes</span>
              <input style={inp} value={sib.allergies} onChange={e=>updateSibling(i,"allergies",e.target.value)} placeholder="None, or describe..."/>
              <span style={{ ...lbl, marginTop:"4px" }}>Program</span>
              <div style={{ display:"flex", gap:"10px" }}>
                {PROGRAMS.map(p=>(
                  <div key={p.id} onClick={()=>updateSibling(i,"prog",p.id)}
                    style={{ flex:1, background:sib.prog===p.id?p.color:"#fff", border:`1.5px solid ${sib.prog===p.id?p.color:CREAM_DARK}`, borderRadius:"8px", padding:"12px", cursor:"pointer", textAlign:"center", transition:"all .2s" }}>
                    <p style={{ fontSize:"12px", color:sib.prog===p.id?"rgba(255,255,255,0.8)":TEXT_LIGHT, marginBottom:"3px" }}>{p.name}</p>
                    <p style={{ fontSize:"14px", color:sib.prog===p.id?"#fff":TEXT_DARK, margin:0 }}>{p.age}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {siblings.length < 4 && (
            <button onClick={addSibling}
              style={{ width:"100%", background:"transparent", border:`1.5px dashed ${CREAM_DARK}`, borderRadius:"10px", padding:"14px", color:TEXT_LIGHT, fontSize:"13px", fontFamily:"Georgia,serif", cursor:"pointer", marginBottom:"14px", letterSpacing:"0.5px" }}>
              + Add a Child {siblings.length > 0 ? `(${siblings.length + 1} of 5)` : ""}
            </button>
          )}

          <div style={{ height:"1px", background:CREAM_DARK, margin:"4px 0 20px" }}/>
          <p style={{ fontSize:"15px", color:TEXT_DARK, marginBottom:"14px" }}>Parent / Guardian</p>
          <span style={lbl}>Full Name</span><input style={inp} value={parent.name} onChange={e=>setParent({...parent,name:e.target.value})} placeholder="Your full name"/>
          <span style={lbl}>Email Address</span><input style={inp} type="email" value={parent.email} onChange={e=>setParent({...parent,email:e.target.value})} placeholder="your@email.com"/>
          <span style={lbl}>Phone / WhatsApp</span><input style={inp} value={parent.phone} onChange={e=>setParent({...parent,phone:e.target.value})} placeholder="+1 555 000 0000"/>
        </>}

        {/* STEP 2 — Schedule */}
        {step===2 && <>
          <h2 style={{ fontSize:"21px", fontWeight:400, marginBottom:"5px" }}>Choose Your Rhythm</h2>
          <p style={{ fontSize:"14px", color:TEXT_MID, marginBottom:"20px", lineHeight:1.7 }}>
            We offer flexibility for families and children — weekly enrollment of either 3 or 5 days, with the option to add a 4th day (+$85). Tap any individual days on the calendar below to build your schedule. Our organic snack & lunch is an additional $10/day — locally sourced and made with love.
          </p>

          {/* Child tabs — show if any siblings added */}
          {siblings.length > 0 && (
            <div className="sched-tabs" style={{ display:"flex", gap:"8px", marginBottom:"20px", overflowX:"auto" }}>
              {[child.fn||"Child 1", ...siblings.map((s,i)=>s.fn||`Child ${i+2}`)].map((name,i)=>(
                <button key={i} onClick={()=>setSchedTab(i)} className="sched-tab"
                  style={{ flex:"0 0 auto", background:schedTab===i?OLIVE:"#fff", color:schedTab===i?"#fff":TEXT_MID,
                    border:`1.5px solid ${schedTab===i?OLIVE:CREAM_DARK}`, borderRadius:"8px",
                    padding:"10px 16px", fontSize:"13px", fontFamily:"Georgia,serif", cursor:"pointer" }}>
                  {name}
                </button>
              ))}
            </div>
          )}

          {/* Pricing reference */}
          <div className="pricing-row" style={{ display:"flex", gap:"10px", marginBottom:"20px" }}>
            {[
              { label:"3 Days / Week", detail:"Any 3 days", price:`$${PRICE_3}/wk` },
              { label:"4th Day",       detail:"Add to 3-day", price:`+$${PRICE_4TH}/wk` },
              { label:"5 Days / Week", detail:"Mon – Fri",   price:`$${PRICE_5}/wk` },
            ].map(o=>(
              <div key={o.label} style={{ flex:1, background:"#fff", border:`1px solid ${CREAM_DARK}`, borderRadius:"10px", padding:"12px 10px", textAlign:"center" }}>
                <p style={{ fontSize:"12px", color:TEXT_DARK, marginBottom:"2px" }}>{o.label}</p>
                <p style={{ fontSize:"11px", color:TEXT_LIGHT, marginBottom:"6px" }}>{o.detail}</p>
                <p style={{ fontSize:"15px", color:TEAL }}>{o.price}</p>
              </div>
            ))}
          </div>

          {/* Lunch toggle */}
          {(() => {
            const isChild1 = schedTab === 0;
            const lunchActive = isChild1 ? lunch : siblings[schedTab-1]?.lunch;
            const setLunchActive = isChild1
              ? setLunch
              : (val) => updateSibling(schedTab-1, "lunch", val);
            return (
              <div onClick={()=>setLunchActive(!lunchActive)}
                style={{ background:lunchActive?GREEN:"#fff", border:`1.5px solid ${lunchActive?GREEN:CREAM_DARK}`, borderRadius:"10px", padding:"14px 16px", cursor:"pointer", display:"flex", alignItems:"center", gap:"14px", marginBottom:"28px", transition:"all .2s" }}>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:"14px", color:lunchActive?"#fff":TEXT_DARK, marginBottom:"2px" }}>Add Organic Snack & Lunch</p>
                  <p style={{ fontSize:"12px", color:lunchActive?"rgba(255,255,255,0.75)":TEXT_LIGHT, lineHeight:1.4, margin:0 }}>All organic, locally sourced, and made with love. $10/day</p>
                </div>
                <div style={{ width:"20px", height:"20px", borderRadius:"50%", border:`2px solid ${lunchActive?"#fff":CREAM_DARK}`, background:lunchActive?"#fff":"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  {lunchActive && <div style={{ width:"10px", height:"10px", borderRadius:"50%", background:GREEN }}/>}
                </div>
              </div>
            );
          })()}

          {/* Calendar — tap individual days */}
          {(() => {
            const isChild1 = schedTab === 0;
            const activeDays = isChild1 ? selectedDays : (siblings[schedTab-1]?.days || new Set());
            const activeToggle = isChild1 ? toggleDay : (d) => toggleSibDay(schedTab-1, d);
            return (
              <div style={{ background:"#fff", border:`1px solid ${CREAM_DARK}`, borderRadius:"12px", padding:"20px", marginBottom:"4px" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"16px" }}>
                  <button onClick={prevMonth} style={{ background:"none", border:"none", cursor:"pointer", fontSize:"20px", color:TEXT_MID, padding:"2px 8px", lineHeight:1 }}>‹</button>
                  <p style={{ fontSize:"15px", color:TEXT_DARK }}>{MONTHS[calMonth]} {calYear}</p>
                  <button onClick={nextMonth} style={{ background:"none", border:"none", cursor:"pointer", fontSize:"20px", color:TEXT_MID, padding:"2px 8px", lineHeight:1 }}>›</button>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:"5px", marginBottom:"8px", textAlign:"center" }}>
                  {WEEKDAYS.map(d=>(
                    <div key={d} style={{ fontSize:"11px", color:TEXT_LIGHT, letterSpacing:"0.5px" }}>{d}</div>
                  ))}
                </div>
                {weeks.map(monday=>{
                  const wk = weekKey(monday);
                  const daysThisWeek = Array.from(activeDays).filter(dk => weekKey(getMonday(new Date(dk))) === wk);
                  const count = daysThisWeek.length;
                  const isValid = count === 0 || count >= 3;
                  const isFull = count >= 5;
                  return (
                    <div key={wk}>
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:"5px", marginBottom:"3px" }}>
                        {[0,1,2,3,4].map(offset=>{
                          const d = addDays(monday, offset);
                          const key = dayKey(d);
                          const isSel = activeDays.has(key);
                          const isPast = d < today;
                          const inMonth = d.getMonth()===calMonth;
                          const isBlocked = !isSel && isFull;
                          return (
                            <div key={offset} onClick={()=>!isPast&&!isBlocked&&activeToggle(d)}
                              style={{ textAlign:"center", padding:"8px 2px", borderRadius:"8px", transition:"all .15s",
                                background: isSel ? OLIVE : (inMonth ? CREAM : CREAM_DARK),
                                color: isSel ? "#fff" : (inMonth ? TEXT_DARK : TEXT_LIGHT),
                                opacity: isPast ? 0.3 : isBlocked ? 0.35 : 1,
                                cursor: isPast || isBlocked ? "not-allowed" : "pointer",
                                border: isSel ? `1.5px solid ${OLIVE_DARK}` : "1.5px solid transparent",
                              }}>
                              <div style={{ fontSize:"9px", opacity:0.75, marginBottom:"1px" }}>{d.toLocaleDateString("en-US",{month:"short"})}</div>
                              <div style={{ fontSize:"14px" }}>{d.getDate()}</div>
                            </div>
                          );
                        })}
                      </div>
                      {count > 0 && (
                        <div style={{ textAlign:"right", marginBottom:"5px" }}>
                          <span style={{ fontSize:"10px", padding:"2px 8px", borderRadius:"10px", color:"#fff",
                            background: !isValid ? "#e08c00" : isFull ? OLIVE : GREEN }}>
                            {count}/5 days selected
                            {!isValid ? " · select at least 3" : isFull ? " · full week ✓" : count === 4 ? " · 4-day week ✓" : " · 3-day week ✓"}
                          </span>
                        </div>
                      )}
                      {count === 0 && <div style={{ marginBottom:"5px" }}/>}
                    </div>
                  );
                })}
                <p style={{ fontSize:"11px", color:TEXT_LIGHT, marginTop:"12px", textAlign:"center" }}>Minimum 3 days · maximum 5 days per week</p>
              </div>
            );
          })()}

          {/* Booking summary by week */}
          {weekEntries.length > 0 && (
            <div style={{ background:"#fff", border:`1px solid ${CREAM_DARK}`, borderRadius:"10px", padding:"16px", marginTop:"16px" }}>
              <p style={{ fontSize:"11px", letterSpacing:"1px", textTransform:"uppercase", color:TEXT_LIGHT, marginBottom:"12px" }}>Booking Summary</p>
              {weekEntries.map(wk => {
                const n = wk.days.length;
                const p = weekPrice(n);
                const lunchCost = lunch ? n * LUNCH_PER_DAY : 0;
                const dayNames = wk.days.map(dk => new Date(dk).toLocaleDateString("en-US",{weekday:"short"})).join(", ");
                return (
                  <div key={weekKey(wk.monday)} style={{ borderBottom:`1px solid ${CREAM_DARK}`, paddingBottom:"10px", marginBottom:"10px" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:"13px", color:TEXT_DARK, marginBottom:"3px" }}>
                      <span>Week of {formatDate(wk.monday)} – {formatDate(addDays(wk.monday,4))}</span>
                      <span style={{ color:OLIVE }}>${p + lunchCost}</span>
                    </div>
                    <div style={{ fontSize:"12px", color:TEXT_LIGHT }}>
                      {n} day{n>1?"s":""} ({dayNames}){lunch ? ` + lunch` : ""}
                      {n===4 && <span style={{ color:SAND, marginLeft:"6px" }}>· 4th day +${PRICE_4TH}</span>}
                    </div>
                  </div>
                );
              })}
              {siblings.length > 0 && siblings.map((sib, i) => {
                const sibGroups = {};
                Array.from(sib.days).forEach(dk => {
                  const mon = getMonday(new Date(dk));
                  const wk = weekKey(mon);
                  if (!sibGroups[wk]) sibGroups[wk] = { monday:mon, days:[] };
                  sibGroups[wk].days.push(dk);
                });
                const sibEntries = Object.values(sibGroups).sort((a,b)=>a.monday-b.monday);
                if (sibEntries.length === 0) return null;
                return (
                  <div key={i}>
                    <p style={{ fontSize:"11px", letterSpacing:"1px", textTransform:"uppercase", color:OLIVE, margin:"10px 0 8px" }}>{sib.fn||`Child ${i+2}`}</p>
                    {sibEntries.map(wk => {
                      const n=wk.days.length; const p=weekPrice(n); const lc=sib.lunch?n*LUNCH_PER_DAY:0;
                      const dayNames = wk.days.map(dk=>new Date(dk).toLocaleDateString("en-US",{weekday:"short"})).join(", ");
                      return (
                        <div key={weekKey(wk.monday)} style={{ borderBottom:`1px solid ${CREAM_DARK}`, paddingBottom:"10px", marginBottom:"10px" }}>
                          <div style={{ display:"flex", justifyContent:"space-between", fontSize:"13px", color:TEXT_DARK, marginBottom:"3px" }}>
                            <span>Week of {formatDate(wk.monday)}</span>
                            <span style={{ color:OLIVE }}>${p+lc}</span>
                          </div>
                          <div style={{ fontSize:"12px", color:TEXT_LIGHT }}>{n} day{n>1?"s":""} ({dayNames}){sib.lunch?` + lunch`:""}</div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:"16px", paddingTop:"10px", color:TEXT_DARK }}>
                <span>Family total</span>
                <span style={{ color:OLIVE }}>${grandTotal}</span>
              </div>
            </div>
          )}
        </>}

        {/* STEP 3 — Payment */}
        {step===3 && <>
          <h2 style={{ fontSize:"21px", fontWeight:400, marginBottom:"5px" }}>Payment</h2>
          <p style={{ fontSize:"14px", color:TEXT_MID, marginBottom:"20px" }}>Full amount due today for all selected weeks.</p>
          <div style={{ background:"#fff", border:`1px solid ${CREAM_DARK}`, borderRadius:"10px", padding:"16px", marginBottom:"22px" }}>
            <p style={{ fontSize:"11px", letterSpacing:"1px", textTransform:"uppercase", color:TEXT_LIGHT, marginBottom:"10px" }}>Order Summary</p>
            {siblings.length > 0 && <p style={{ fontSize:"11px", color:OLIVE, marginBottom:"6px" }}>{child.fn||"Child 1"}</p>}
            {weekEntries.map(wk=>{
              const n=wk.days.length; const p=weekPrice(n); const lc=lunch?n*LUNCH_PER_DAY:0;
              return (
                <div key={weekKey(wk.monday)} style={{ display:"flex", justifyContent:"space-between", fontSize:"13px", padding:"5px 0", borderBottom:`1px solid ${CREAM_DARK}`, color:TEXT_MID }}>
                  <span>Week of {formatDate(wk.monday)} · {n} day{n>1?"s":""}</span>
                  <span style={{ color:TEXT_DARK }}>${p+lc}</span>
                </div>
              );
            })}
            {siblings.map((sib, i) => {
              const sibGroups = {};
              Array.from(sib.days).forEach(dk => {
                const mon = getMonday(new Date(dk)); const wk = weekKey(mon);
                if (!sibGroups[wk]) sibGroups[wk] = { monday:mon, days:[] };
                sibGroups[wk].days.push(dk);
              });
              const sibEntries = Object.values(sibGroups).sort((a,b)=>a.monday-b.monday);
              if (sibEntries.length === 0) return null;
              return (
                <div key={i}>
                  <p style={{ fontSize:"11px", color:OLIVE, margin:"10px 0 6px" }}>{sib.fn||`Child ${i+2}`}</p>
                  {sibEntries.map(wk=>{
                    const n=wk.days.length; const p=weekPrice(n); const lc=sib.lunch?n*LUNCH_PER_DAY:0;
                    return (
                      <div key={weekKey(wk.monday)} style={{ display:"flex", justifyContent:"space-between", fontSize:"13px", padding:"5px 0", borderBottom:`1px solid ${CREAM_DARK}`, color:TEXT_MID }}>
                        <span>Week of {formatDate(wk.monday)} · {n} day{n>1?"s":""}</span>
                        <span style={{ color:TEXT_DARK }}>${p+lc}</span>
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
            <p style={{ fontSize:"12px", color:OLIVE_DARK, margin:0, lineHeight:1.5 }}>Demo mode — connects to Stripe in production. Enter any 16-digit number to continue.</p>
          </div>
          <span style={lbl}>Card Number</span>
          <input style={inp} value={card.num} onChange={e=>{const v=e.target.value.replace(/\D/g,"").slice(0,16);setCard({...card,num:v.replace(/(.{4})/g,"$1 ").trim()})}} placeholder="1234 5678 9012 3456" maxLength={19}/>
          <div className="payment-row" style={{ display:"flex", gap:"14px" }}>
            <div style={{ flex:1 }}>
              <span style={lbl}>Expiry</span>
              <input style={inp} value={card.exp} onChange={e=>{let v=e.target.value.replace(/\D/g,"").slice(0,4);if(v.length>2)v=v.slice(0,2)+"/"+v.slice(2);setCard({...card,exp:v})}} placeholder="MM/YY" maxLength={5}/>
            </div>
            <div style={{ flex:1 }}>
              <span style={lbl}>CVC</span>
              <input style={inp} value={card.cvc} onChange={e=>setCard({...card,cvc:e.target.value.replace(/\D/g,"").slice(0,4)})} placeholder="123" maxLength={4}/>
            </div>
          </div>
        </>}

        {/* STEP 4 — Waiver */}
        {step===4 && <>
          <h2 style={{ fontSize:"21px", fontWeight:400, marginBottom:"5px" }}>Waiver & Consent</h2>
          <p style={{ fontSize:"14px", color:TEXT_MID, marginBottom:"22px" }}>Please read and complete each section carefully.</p>
          {[
            { key:"liab", title:"1. Assumption of Risk & Release of Liability", checkLabel:"I agree to the Assumption of Risk and Release of Liability.",
              text:"I understand that Wild Child Playgarden & Wildschooling Nosara is a nature-based, outdoor educational program. Activities include outdoor play, gardening, forest and beach exploration, physical movement, water play, and exposure to uneven terrain, insects, plants, wildlife, and weather. I knowingly assume all risks and release Wild Child and its staff from all claims arising from my child's participation." },
            { key:"med", title:"2. Medical & Emergency Consent", checkLabel:"I agree to Medical & Emergency Care Consent.",
              text:"I authorize Wild Child to seek emergency medical care for my child if I cannot be reached. I consent to examination, diagnosis, treatment, and/or hospital care deemed necessary by a licensed physician. All medical expenses are my responsibility." },
          ].map(s=>(
            <div key={s.key} style={{ background:"#fff", border:`1px solid ${CREAM_DARK}`, borderRadius:"10px", padding:"18px", marginBottom:"14px" }}>
              <p style={{ fontSize:"11px", letterSpacing:"1px", textTransform:"uppercase", color:TEXT_LIGHT, marginBottom:"9px" }}>{s.title}</p>
              <p style={{ fontSize:"13px", lineHeight:1.7, color:TEXT_MID, marginBottom:"12px" }}>{s.text}</p>
              <label style={{ display:"flex", gap:"8px", alignItems:"flex-start", cursor:"pointer" }}>
                <input type="checkbox" checked={w[s.key]} onChange={e=>setW({...w,[s.key]:e.target.checked})} style={{ marginTop:"3px", accentColor:TEAL }}/>
                <span style={{ fontSize:"13px", color:TEXT_DARK, lineHeight:1.5 }}>{s.checkLabel}</span>
              </label>
            </div>
          ))}
          {[
            { key:"media", title:"3. Media Release", text:"Photos/videos may be taken during activities and used for educational documentation and promotional purposes including the Wild Child website and social media.",
              opts:[{id:"mediaY",checked:w.mediaY,onChange:()=>setW({...w,mediaY:true,mediaN:false}),label:"YES – I grant permission for photos/videos."},
                    {id:"mediaN",checked:w.mediaN,onChange:()=>setW({...w,mediaY:false,mediaN:true}),label:"NO – I do not grant permission."}] },
            { key:"exc", title:"4. Excursion Permission", text:"Wild Child may organize supervised local outings: neighborhood walks, beaches, farms, and community spaces.",
              opts:[{id:"excY",checked:w.excY,onChange:()=>setW({...w,excY:true,excN:false}),label:"YES – I grant permission for supervised outings."},
                    {id:"excN",checked:w.excN,onChange:()=>setW({...w,excY:false,excN:true}),label:"NO – I do not grant permission."}] },
          ].map(s=>(
            <div key={s.key} style={{ background:"#fff", border:`1px solid ${CREAM_DARK}`, borderRadius:"10px", padding:"18px", marginBottom:"14px" }}>
              <p style={{ fontSize:"11px", letterSpacing:"1px", textTransform:"uppercase", color:TEXT_LIGHT, marginBottom:"9px" }}>{s.title}</p>
              <p style={{ fontSize:"13px", lineHeight:1.7, color:TEXT_MID, marginBottom:"12px" }}>{s.text}</p>
              {s.opts.map(o=>(
                <label key={o.id} style={{ display:"flex", gap:"8px", cursor:"pointer", marginBottom:"8px" }}>
                  <input type="radio" name={s.key} checked={o.checked} onChange={o.onChange} style={{ marginTop:"3px", accentColor:TEAL }}/>
                  <span style={{ fontSize:"13px", color:TEXT_DARK }}>{o.label}</span>
                </label>
              ))}
            </div>
          ))}
          <div style={{ background:"#fff", border:`1px solid ${CREAM_DARK}`, borderRadius:"10px", padding:"18px", marginBottom:"14px" }}>
            <p style={{ fontSize:"11px", letterSpacing:"1px", textTransform:"uppercase", color:TEXT_LIGHT, marginBottom:"9px" }}>5. Signature</p>
            <p style={{ fontSize:"13px", color:TEXT_MID, marginBottom:"12px", lineHeight:1.5 }}>By signing below, I confirm I am the legal parent/guardian of {child.fn||"the child named above"} and all information is accurate.</p>
            <span style={lbl}>Digital Signature — type your full name</span>
            <input style={{ ...inp, fontStyle:"italic", fontSize:"17px" }} value={sig} onChange={e=>setSig(e.target.value)} placeholder="Your full name"/>
            <p style={{ fontSize:"11px", color:TEXT_LIGHT }}>Date: {new Date().toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}</p>
          </div>
        </>}

        {/* STEP 5 — Confirmation */}
        {step===5 && (
          <div style={{ textAlign:"center", padding:"16px 0" }}>
            <div style={{ width:"68px", height:"68px", borderRadius:"50%", background:OLIVE, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px", fontSize:"30px" }}>🌿</div>
            <h2 style={{ fontSize:"26px", fontWeight:400, marginBottom:"8px" }}>Welcome to the Wild!</h2>
            <p style={{ fontSize:"14px", color:TEXT_MID, maxWidth:"420px", margin:"0 auto 24px", lineHeight:1.6 }}>
              {child.fn}{siblings.length > 0 ? ` and ${siblings.map((s,i)=>s.fn||`Child ${i+2}`).join(", ")}` : ""} {siblings.length > 0 ? "are" : "is"} enrolled at Wild Child Nosara. We're so excited to welcome your family!
            </p>
            <div style={{ background:"#fff", border:`1px solid ${CREAM_DARK}`, borderRadius:"10px", padding:"18px", maxWidth:"400px", margin:"0 auto 22px", width:"100%", textAlign:"left" }}>
              <p style={{ fontSize:"11px", letterSpacing:"1px", textTransform:"uppercase", color:TEXT_LIGHT, marginBottom:"12px" }}>Enrollment Summary</p>
              {[
                ["Child 1", `${child.fn} ${child.ln}`.trim()||"—"],
                ["Program", sp?.name||"—"],
                ...siblings.map((s,i) => [`Child ${i+2}`, `${s.fn} ${s.ln}`.trim()||"—"]),
                ["Total Paid", `$${grandTotal}`],
                ["Confirmation sent to", parent.email||"your email"],
              ].filter(Boolean).map(([k,v],i,arr)=>(
                <div key={k+i} style={{ display:"flex", justifyContent:"space-between", fontSize:"13px", padding:"5px 0", borderBottom:i<arr.length-1?`1px solid ${CREAM_DARK}`:"none", color:TEXT_MID }}>
                  <span>{k}</span><span style={{ color:TEXT_DARK }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ background:OLIVE_LIGHT, border:`1px solid ${SAGE}`, borderRadius:"10px", padding:"14px 18px", maxWidth:"400px", margin:"0 auto 20px", width:"100%", textAlign:"left" }}>
              <p style={{ fontSize:"13px", color:OLIVE_DARK, marginBottom:"5px", fontWeight:"bold" }}>What happens next</p>
              <p style={{ fontSize:"13px", color:OLIVE_DARK, lineHeight:1.6, margin:0 }}>
                A confirmation email has been sent to {parent.email||"you"}. Our team at info@dandelionwildschooling.com has been notified. Pura vida! 🌺
              </p>
            </div>
            {!session && (
              <div style={{ background:"#fff", border:`1px solid ${CREAM_DARK}`, borderRadius:"10px", padding:"18px", maxWidth:"400px", margin:"0 auto 20px", width:"100%" }}>
                <p style={{ fontSize:"14px", color:TEXT_DARK, marginBottom:"6px" }}>Create an account to track your enrollments</p>
                <p style={{ fontSize:"12px", color:TEXT_LIGHT, marginBottom:"14px", lineHeight:1.5 }}>Save your info, view your schedule, and easily enroll in future weeks.</p>
                <a href="/login" style={{ display:"block", background:NAVY, color:"#fff", textDecoration:"none", borderRadius:"8px", padding:"12px", fontSize:"13px", letterSpacing:"1px", textTransform:"uppercase", fontFamily:"Georgia,serif", textAlign:"center" }}>
                  Create Account / Sign In
                </a>
              </div>
            )}
            {session && (
              <a href="/portal" style={{ display:"inline-block", background:NAVY, color:"#fff", textDecoration:"none", borderRadius:"8px", padding:"12px 24px", fontSize:"13px", letterSpacing:"1px", textTransform:"uppercase", fontFamily:"Georgia,serif", marginBottom:"16px" }}>
                View My Portal
              </a>
            )}
            <p style={{ fontSize:"12px", color:TEXT_LIGHT }}>Questions? <a href="mailto:info@dandelionwildschooling.com" style={{ color:OLIVE }}>info@dandelionwildschooling.com</a></p>
          </div>
        )}

        {/* Nav */}
        {step<5 && (
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:"32px", gap:"12px", flexWrap:"wrap" }}>
            {step>0
              ? <button onClick={()=>setStep(s=>s-1)} style={{ background:"transparent", color:TEXT_MID, border:`1px solid ${CREAM_DARK}`, borderRadius:"8px", padding:"13px 22px", fontSize:"13px", letterSpacing:"1px", fontFamily:"Georgia,serif", cursor:"pointer", textTransform:"uppercase" }}>← Back</button>
              : <div/>}
            <button onClick={next} disabled={busy}
              style={{ background:busy?"#aaa":ORANGE, color:"#fff", border:"none", borderRadius:"8px", padding:"13px 28px", fontSize:"13px", letterSpacing:"1px", fontFamily:"Georgia,serif", cursor:busy?"not-allowed":"pointer", textTransform:"uppercase", transition:"background .2s" }}>
              {busy?"Processing...":(step===4?"Submit & Complete ✓":step===3?`Pay $${grandTotal} →`:"Continue →")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
