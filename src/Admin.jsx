import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import logo from "./assets/logo1.svg";

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

// aliases
const TEAL      = OLIVE;
const TEAL_DARK = OLIVE_DARK;
const TEAL_LIGHT = OLIVE_LIGHT;
const SAND      = ORANGE;

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric"
  });
}
function parseLocalKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function localDateKey(date) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function addDays(date, n) { const d=new Date(date); d.setDate(d.getDate()+n); d.setHours(0,0,0,0); return d; }
function dayKey(date) { return localDateKey(date); }
const MONTHS_ADM=["January","February","March","April","May","June","July","August","September","October","November","December"];
const WD_SHORT=["Mon","Tue","Wed","Thu","Fri"];
function getWeeksForMonthAdm(year, month) {
  const weeks = [];
  const firstDay = new Date(year, month, 1);
  const monday = getMonday(firstDay);
  const monthEnd = new Date(year, month + 1, 0);
  for (let i = 0; i < 6; i++) {
    const wStart = addDays(monday, i * 7);
    const wEnd = addDays(wStart, 4);
    if (wEnd >= firstDay && wStart <= monthEnd) weeks.push(wStart);
  }
  return weeks;
}

function getMonday(date) {
  const d = new Date(date);
  const daysFromMonday = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - daysFromMonday);
  d.setHours(0, 0, 0, 0);
  return d;
}

function weekLabel(mondayDate) {
  const mon = new Date(mondayDate);
  const fri = new Date(mondayDate);
  fri.setDate(fri.getDate() + 4);
  return `Week of ${mon.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${fri.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}

function groupByWeek(registrations) {
  const groups = {};
  registrations.forEach(reg => {
    const days = reg.selected_days || [];
    if (days.length === 0) {
      const key = "unscheduled";
      if (!groups[key]) groups[key] = { label: "Unscheduled", monday: null, registrations: [] };
      groups[key].registrations.push(reg);
      return;
    }
    // Find all unique weeks this registration covers
    const weekKeys = new Set(days.map(dk => {
      const mon = getMonday(parseLocalKey(dk));
      return localDateKey(mon);
    }));
    weekKeys.forEach(wk => {
      if (!groups[wk]) groups[wk] = { label: weekLabel(wk), monday: new Date(wk), registrations: [] };
      if (!groups[wk].registrations.find(r => r.id === reg.id)) {
        groups[wk].registrations.push(reg);
      }
    });
  });
  return Object.entries(groups)
    .sort(([a], [b]) => {
      if (a === "unscheduled") return 1;
      if (b === "unscheduled") return -1;
      return new Date(a) - new Date(b);
    })
    .map(([key, val]) => ({ key, ...val }));
}

function DetailModal({ reg, onClose }) {
  const days = reg.selected_days || [];
  const dayNames = days.map(dk =>
    parseLocalKey(dk).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
  ).sort();

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:"20px" }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:"#fff", borderRadius:"14px", padding:"28px", maxWidth:"520px", width:"100%", maxHeight:"85vh", overflowY:"auto", fontFamily:"Georgia,serif" }}>

        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"20px" }}>
          <div>
            <p style={{ fontSize:"11px", letterSpacing:"1px", textTransform:"uppercase", color:TEXT_LIGHT, marginBottom:"4px" }}>{reg.program_name}</p>
            <h2 style={{ fontSize:"22px", fontWeight:400, color:TEXT_DARK, margin:0 }}>{reg.child_first_name} {reg.child_last_name}</h2>
            <p style={{ fontSize:"13px", color:TEXT_MID, marginTop:"3px" }}>Parent: {reg.parent_name}</p>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:"22px", cursor:"pointer", color:TEXT_LIGHT, lineHeight:1, padding:"0 0 0 12px" }}>✕</button>
        </div>

        <div style={{ height:"1px", background:CREAM_DARK, marginBottom:"20px" }}/>

        {/* Child info */}
        <Section title="Child">
          <Row label="Full Name" value={`${reg.child_first_name} ${reg.child_last_name}`} />
          <Row label="Date of Birth" value={reg.child_dob || "—"} />
          <Row label="Allergies / Notes" value={reg.child_allergies || "None"} />
        </Section>

        {/* Parent info */}
        <Section title="Parent / Guardian">
          <Row label="Name" value={reg.parent_name || "—"} />
          <Row label="Email" value={reg.parent_email || "—"} />
          <Row label="Phone" value={reg.parent_phone || "—"} />
        </Section>

        {/* Schedule */}
        <Section title="Schedule">
          <Row label="Program" value={reg.program_name || "—"} />
          <Row label="Lunch" value={reg.lunch ? "Yes — Organic Snack & Lunch" : "No"} />
          <div style={{ marginTop:"8px" }}>
            <p style={{ fontSize:"11px", letterSpacing:"0.5px", textTransform:"uppercase", color:TEXT_LIGHT, marginBottom:"6px" }}>Selected Days</p>
            <div style={{ display:"flex", flexWrap:"wrap", gap:"6px" }}>
              {dayNames.map(d => (
                <span key={d} style={{ background:TEAL_LIGHT, color:TEAL_DARK, fontSize:"12px", padding:"3px 10px", borderRadius:"20px" }}>{d}</span>
              ))}
            </div>
          </div>
        </Section>

        {/* Payment */}
        <Section title="Payment">
          <Row label="Tuition" value={`$${reg.subtotal_tuition ?? "—"}`} />
          <Row label="Lunch" value={reg.lunch ? `$${reg.subtotal_lunch ?? 0}` : "—"} />
          <Row label="Total" value={`$${reg.grand_total ?? "—"}`} bold />
          <Row label="Status" value={
            <span style={{ background: reg.payment_status === "paid" ? GREEN : SAND, color:"#fff", fontSize:"11px", padding:"2px 10px", borderRadius:"20px" }}>
              {reg.payment_status || "pending"}
            </span>
          } />
        </Section>

        {/* Waiver */}
        <Section title="Waiver">
          <Row label="Liability" value={reg.waiver_liability ? "✓ Agreed" : "Not signed"} />
          <Row label="Medical" value={reg.waiver_medical ? "✓ Agreed" : "Not signed"} />
          <Row label="Media" value={reg.waiver_media === "yes" ? "✓ Permission granted" : reg.waiver_media === "no" ? "✗ No permission" : "—"} />
          <Row label="Excursions" value={reg.waiver_excursion === "yes" ? "✓ Permission granted" : reg.waiver_excursion === "no" ? "✗ No permission" : "—"} />
          <Row label="Signature" value={reg.waiver_signature || "—"} />
          <Row label="Signed" value={formatDate(reg.waiver_date)} />
        </Section>

        <p style={{ fontSize:"11px", color:TEXT_LIGHT, marginTop:"16px", textAlign:"right" }}>
          Registered {formatDate(reg.created_at)}
        </p>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom:"20px" }}>
      <p style={{ fontSize:"11px", letterSpacing:"1px", textTransform:"uppercase", color:TEXT_LIGHT, marginBottom:"10px" }}>{title}</p>
      <div style={{ background:CREAM, borderRadius:"8px", padding:"12px 14px" }}>{children}</div>
    </div>
  );
}

function Row({ label, value, bold }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"5px 0", borderBottom:`1px solid ${CREAM_DARK}`, fontSize:"13px" }}>
      <span style={{ color:TEXT_LIGHT }}>{label}</span>
      <span style={{ color:TEXT_DARK, fontWeight:bold?500:400, textAlign:"right", maxWidth:"60%" }}>{value}</span>
    </div>
  );
}

export default function Admin() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [expandedWeeks, setExpandedWeeks] = useState(new Set());

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("registrations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) { setError(error.message); }
      else { setRegistrations(data); }
      setLoading(false);
    }
    load();
  }, []);

  const toggleWeek = (key) => {
    setExpandedWeeks(prev => {
      const n = new Set(prev);
      n.has(key) ? n.delete(key) : n.add(key);
      return n;
    });
  };

  const [adminView, setAdminView] = useState("weeks"); // weeks | calendar
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState(null); // ISO date string

  const weeks = groupByWeek(registrations);

  return (
    <div style={{ fontFamily:"Georgia,serif", background:CREAM, minHeight:"100vh", color:TEXT_DARK }}>

      {/* Header */}
      <div style={{ background:OLIVE_DARK, height:"90px", overflow:"hidden", position:"relative", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 20px" }}>
        <div style={{ position:"absolute", left:"50%", top:"50%", transform:"translate(-50%, -40%)" }}>
          <img src={logo} alt="Wild Child Nosara" style={{ height:"180px", objectFit:"contain" }} />
        </div>
        <div style={{ width:"80px" }}/>
        <div style={{ position:"relative", zIndex:1, display:"flex", gap:"10px", alignItems:"center" }}>
          <a href="/" style={{ fontSize:"12px", color:"rgba(255,255,255,0.7)", textDecoration:"none", letterSpacing:"0.5px" }}>← Enrollment</a>
          <button onClick={async () => { const { supabase } = await import('./supabase'); await supabase.auth.signOut(); window.location.href = '/login'; }}
            style={{ background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.25)", borderRadius:"8px", padding:"8px 14px", color:"rgba(255,255,255,0.9)", fontSize:"12px", letterSpacing:"1px", textTransform:"uppercase", cursor:"pointer", fontFamily:"Georgia,serif" }}>
            Sign Out
          </button>
        </div>
      </div>

      {/* Admin label bar + view tabs */}
      <div style={{ background:NAVY, padding:"0 20px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <p style={{ color:"rgba(255,255,255,0.7)", fontSize:"12px", letterSpacing:"1px", textTransform:"uppercase", margin:0, padding:"10px 0" }}>Admin · Registrations</p>
        <div style={{ display:"flex", gap:"4px" }}>
          {["weeks","calendar"].map(v=>(
            <button key={v} onClick={()=>setAdminView(v)}
              style={{ background:adminView===v?"rgba(255,255,255,0.15)":"transparent", border:"none", borderRadius:"6px", padding:"6px 14px", color:adminView===v?"#fff":"rgba(255,255,255,0.5)", fontSize:"12px", cursor:"pointer", fontFamily:"Georgia,serif", textTransform:"capitalize", letterSpacing:"0.5px" }}>
              {v==="weeks"?"By Week":"Calendar"}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth:"700px", margin:"0 auto", padding:"32px 16px 60px" }}>

        {loading && <div style={{ textAlign:"center", padding:"60px 0", color:TEXT_LIGHT, fontSize:"14px" }}>Loading registrations...</div>}
        {error && <div style={{ background:"#fdecea", border:"1px solid #f5c6c6", borderRadius:"10px", padding:"16px", color:"#a32d2d", fontSize:"14px" }}>Error: {error}</div>}
        {!loading && !error && registrations.length===0 && (
          <div style={{ textAlign:"center", padding:"60px 0", color:TEXT_LIGHT }}>
            <p style={{ fontSize:"15px" }}>No registrations yet.</p>
          </div>
        )}

        {/* ── BY WEEK VIEW ── */}
        {!loading && adminView==="weeks" && weeks.map(week => (
          <div key={week.key} style={{ marginBottom:"16px" }}>
            <div onClick={() => toggleWeek(week.key)}
              style={{ background:NAVY, borderRadius: expandedWeeks.has(week.key) ? "10px 10px 0 0" : "10px", padding:"14px 20px", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <p style={{ fontSize:"13px", color:"rgba(255,255,255,0.75)", margin:"0 0 2px" }}>{week.label}</p>
                <p style={{ fontSize:"16px", color:"#fff", margin:0 }}>{week.registrations.length} child{week.registrations.length!==1?"ren":""}</p>
              </div>
              <span style={{ color:"rgba(255,255,255,0.8)", fontSize:"18px" }}>{expandedWeeks.has(week.key)?"▲":"▼"}</span>
            </div>
            {expandedWeeks.has(week.key)&&(
              <div style={{ background:"#fff", border:`1px solid ${CREAM_DARK}`, borderTop:"none", borderRadius:"0 0 10px 10px", overflow:"hidden" }}>
                {week.registrations.map((reg,i)=>(
                  <div key={reg.id} onClick={()=>setSelected(reg)}
                    style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 20px",
                      borderBottom:i<week.registrations.length-1?`1px solid ${CREAM_DARK}`:"none", cursor:"pointer" }}
                    onMouseEnter={e=>e.currentTarget.style.background=CREAM}
                    onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
                    <div style={{ display:"flex", alignItems:"center", gap:"14px" }}>
                      <div style={{ width:"38px", height:"38px", borderRadius:"50%", background:OLIVE_LIGHT, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"13px", color:OLIVE_DARK, fontWeight:500, flexShrink:0 }}>
                        {(reg.child_first_name?.[0]||"?")}{(reg.child_last_name?.[0]||"")}
                      </div>
                      <div>
                        <p style={{ fontSize:"15px", color:TEXT_DARK, margin:"0 0 2px" }}>{reg.child_first_name||"—"} {reg.child_last_name||""}</p>
                        <p style={{ fontSize:"12px", color:TEXT_LIGHT, margin:0 }}>
                          {reg.program_name||"—"} · {(reg.selected_days||[]).filter(dk=>localDateKey(getMonday(parseLocalKey(dk)))===week.key).length} days
                          {reg.lunch?" · 🥗 Lunch":""}
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <p style={{ fontSize:"14px", color:OLIVE, margin:"0 0 2px" }}>${reg.grand_total??""}</p>
                      <span style={{ fontSize:"10px", padding:"2px 8px", borderRadius:"20px", color:"#fff", background:reg.payment_status==="paid"?GREEN:ORANGE }}>{reg.payment_status||"pending"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* ── CALENDAR VIEW ── */}
        {!loading && adminView==="calendar" && (()=>{
          // Build a map of dayKey → registrations enrolled that day
          const dayMap={};
          registrations.forEach(reg=>{
            (reg.selected_days||[]).forEach(dk=>{
              if(!dayMap[dk]) dayMap[dk]=[];
              dayMap[dk].push(reg);
            });
          });

          const calWeeks=getWeeksForMonthAdm(calYear,calMonth);
          const dayRegs=selectedDay?dayMap[selectedDay]||[]:[];

          return (
            <div>
              {/* Calendar */}
              <div style={{ background:"#fff", border:`1px solid ${CREAM_DARK}`, borderRadius:"12px", padding:"20px", marginBottom:"16px" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"16px" }}>
                  <button onClick={()=>{if(calMonth===0){setCalYear(y=>y-1);setCalMonth(11);}else setCalMonth(m=>m-1);}}
                    style={{ background:"none", border:"none", cursor:"pointer", fontSize:"20px", color:TEXT_MID, padding:"2px 10px", lineHeight:1 }}>‹</button>
                  <p style={{ fontSize:"16px", color:TEXT_DARK, margin:0, fontWeight:400 }}>{MONTHS_ADM[calMonth]} {calYear}</p>
                  <button onClick={()=>{if(calMonth===11){setCalYear(y=>y+1);setCalMonth(0);}else setCalMonth(m=>m+1);}}
                    style={{ background:"none", border:"none", cursor:"pointer", fontSize:"20px", color:TEXT_MID, padding:"2px 10px", lineHeight:1 }}>›</button>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:"5px", marginBottom:"8px", textAlign:"center" }}>
                  {WD_SHORT.map(d=><div key={d} style={{ fontSize:"11px", color:TEXT_LIGHT }}>{d}</div>)}
                </div>
                {calWeeks.map(monday=>(
                  <div key={monday.toISOString()} style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:"5px", marginBottom:"5px" }}>
                    {[0,1,2,3,4].map(offset=>{
                      const d=addDays(monday,offset);
                      const key=dayKey(d);
                      const count=(dayMap[key]||[]).length;
                      const isSelected=selectedDay===key;
                      const inMonth=d.getMonth()===calMonth;
                      const isToday=key===dayKey(new Date());
                      return (
                        <div key={offset} onClick={()=>setSelectedDay(isSelected?null:key)}
                          style={{ textAlign:"center", padding:"8px 4px", borderRadius:"8px", cursor:"pointer", transition:"all .15s",
                            background:isSelected?NAVY:(count>0?(inMonth?OLIVE_LIGHT:CREAM_DARK):(inMonth?CREAM:CREAM_DARK)),
                            border:isSelected?`2px solid ${NAVY}`:isToday?`2px solid ${ORANGE}`:"2px solid transparent",
                            color:isSelected?"#fff":(inMonth?TEXT_DARK:TEXT_LIGHT),
                            opacity:inMonth?1:0.5 }}>
                          <div style={{ fontSize:"9px", opacity:0.7, marginBottom:"1px" }}>{d.toLocaleDateString("en-US",{month:"short"})}</div>
                          <div style={{ fontSize:"14px", fontWeight:count>0?"500":"400" }}>{d.getDate()}</div>
                          {count>0&&<div style={{ fontSize:"10px", marginTop:"2px", color:isSelected?"rgba(255,255,255,0.85)":OLIVE, fontWeight:500 }}>{count}</div>}
                        </div>
                      );
                    })}
                  </div>
                ))}
                <p style={{ fontSize:"11px", color:TEXT_LIGHT, textAlign:"center", marginTop:"12px", margin:"12px 0 0" }}>
                  Tap a day to see enrolled children · numbers show student count
                </p>
              </div>

              {/* Day detail panel */}
              {selectedDay&&(
                <div style={{ background:"#fff", border:`1px solid ${CREAM_DARK}`, borderRadius:"12px", padding:"20px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px" }}>
                    <h3 style={{ fontSize:"16px", fontWeight:400, color:TEXT_DARK, margin:0 }}>
                      {new Date(selectedDay).toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"})}
                    </h3>
                    <button onClick={()=>setSelectedDay(null)} style={{ background:"none", border:"none", fontSize:"18px", cursor:"pointer", color:TEXT_LIGHT }}>✕</button>
                  </div>

                  {dayRegs.length===0
                    ? <p style={{ fontSize:"14px", color:TEXT_LIGHT, textAlign:"center", padding:"20px 0" }}>No children enrolled this day.</p>
                    : <>
                        <p style={{ fontSize:"12px", letterSpacing:"1px", textTransform:"uppercase", color:TEXT_LIGHT, margin:"0 0 12px" }}>{dayRegs.length} child{dayRegs.length!==1?"ren":""} enrolled</p>
                        {dayRegs.map((reg,i)=>(
                          <div key={reg.id} onClick={()=>setSelected(reg)}
                            style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 14px",
                              background:i%2===0?CREAM:"#fff", borderRadius:"8px", cursor:"pointer", marginBottom:"4px" }}>
                            <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
                              <div style={{ width:"36px", height:"36px", borderRadius:"50%", background:OLIVE_LIGHT, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"13px", color:OLIVE_DARK, fontWeight:500, flexShrink:0 }}>
                                {(reg.child_first_name?.[0]||"?")}{(reg.child_last_name?.[0]||"")}
                              </div>
                              <div>
                                <p style={{ fontSize:"14px", color:TEXT_DARK, margin:"0 0 2px" }}>{reg.child_first_name} {reg.child_last_name}</p>
                                <p style={{ fontSize:"12px", color:TEXT_LIGHT, margin:0 }}>
                                  {reg.program_name||"—"}
                                  {reg.lunch&&<span style={{ color:GREEN, marginLeft:"6px" }}>🥗 Lunch</span>}
                                </p>
                              </div>
                            </div>
                            <span style={{ fontSize:"11px", color:TEXT_LIGHT }}>→</span>
                          </div>
                        ))}
                      </>
                  }
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Detail modal */}
      {selected && <DetailModal reg={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
