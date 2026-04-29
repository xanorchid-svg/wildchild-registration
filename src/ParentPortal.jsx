import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import logo from "./assets/logo1.svg";

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

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
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
function dayKey(date) { return localDateKey(date); }
function getMonday(date) {
  const d = new Date(date);
  const daysFromMonday = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - daysFromMonday);
  d.setHours(0, 0, 0, 0);
  return d;
}
function addDays(date, n) { const d = new Date(date); d.setDate(d.getDate() + n); return d; }
function weekLabel(days) {
  if (!days || days.length === 0) return "—";
  const sorted = [...days].sort();
  const mon = getMonday(parseLocalKey(sorted[0]));
  const fri = addDays(mon, 4);
  return `${mon.toLocaleDateString("en-US",{month:"short",day:"numeric"})} – ${fri.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}`;
}
const MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];
const WEEKDAYS_SHORT=["Mon","Tue","Wed","Thu","Fri"];
function getWeeksForMonth(year, month) {
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

const inp = { width:"100%", padding:"11px 13px", border:`1px solid ${CREAM_DARK}`, borderRadius:"8px", fontSize:"15px", fontFamily:"Georgia,serif", background:"#fff", color:TEXT_DARK, marginBottom:"14px", outline:"none", boxSizing:"border-box" };
const lbl = { display:"block", fontSize:"11px", letterSpacing:"1px", textTransform:"uppercase", color:TEXT_LIGHT, marginBottom:"6px", fontFamily:"Georgia,serif" };

function StatusBadge({ status }) {
  const paid=status==="paid";
  return <span style={{ fontSize:"11px", padding:"3px 10px", borderRadius:"20px", color:"#fff", background:paid?GREEN:ORANGE, whiteSpace:"nowrap" }}>{paid?"Paid":"Pending"}</span>;
}
function SectionCard({ title, children }) {
  return (
    <div style={{ background:"#fff", border:`1px solid ${CREAM_DARK}`, borderRadius:"12px", padding:"20px", marginBottom:"16px" }}>
      <p style={{ fontSize:"11px", letterSpacing:"1px", textTransform:"uppercase", color:TEXT_LIGHT, margin:"0 0 16px" }}>{title}</p>
      {children}
    </div>
  );
}
function InfoRow({ label, value }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:`1px solid ${CREAM_DARK}`, fontSize:"14px" }}>
      <span style={{ color:TEXT_LIGHT }}>{label}</span>
      <span style={{ color:TEXT_DARK }}>{value||"—"}</span>
    </div>
  );
}

// ── Enrollment Calendar (parent view) ────────────────────────────────────────
function EnrollmentCalendar({ enrolledDays, hasLunch }) {
  const today = new Date(); today.setHours(0,0,0,0);
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const enrolledSet = new Set(enrolledDays.map(d => dayKey(d)));
  const weeks = getWeeksForMonth(calYear, calMonth);

  return (
    <div style={{ background:"#fff", border:`1px solid ${CREAM_DARK}`, borderRadius:"12px", padding:"16px", marginBottom:"16px" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"14px" }}>
        <button onClick={()=>{ if(calMonth===0){setCalYear(y=>y-1);setCalMonth(11);}else setCalMonth(m=>m-1); }}
          style={{ background:"none", border:"none", cursor:"pointer", fontSize:"20px", color:TEXT_LIGHT, padding:"2px 10px", lineHeight:1 }}>‹</button>
        <p style={{ fontSize:"14px", color:TEXT_DARK, margin:0 }}>{MONTHS[calMonth]} {calYear}</p>
        <button onClick={()=>{ if(calMonth===11){setCalYear(y=>y+1);setCalMonth(0);}else setCalMonth(m=>m+1); }}
          style={{ background:"none", border:"none", cursor:"pointer", fontSize:"20px", color:TEXT_LIGHT, padding:"2px 10px", lineHeight:1 }}>›</button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:"4px", marginBottom:"8px", textAlign:"center" }}>
        {WEEKDAYS_SHORT.map(d=><div key={d} style={{ fontSize:"11px", color:TEXT_LIGHT }}>{d}</div>)}
      </div>

      {weeks.map(monday=>(
        <div key={monday.toISOString()} style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:"4px", marginBottom:"4px" }}>
          {[0,1,2,3,4].map(offset=>{
            const d = addDays(monday, offset);
            const key = dayKey(d);
            const isEnrolled = enrolledSet.has(key);
            const isPast = d < today;
            const inMonth = d.getMonth()===calMonth;
            return (
              <div key={offset}
                style={{ textAlign:"center", padding:"7px 2px", borderRadius:"7px",
                  background: isEnrolled ? (isPast ? "#8fa88a" : OLIVE) : (inMonth ? CREAM : CREAM_DARK),
                  color: isEnrolled ? "#fff" : (inMonth ? TEXT_DARK : TEXT_LIGHT),
                  opacity: inMonth ? 1 : 0.5,
                  position:"relative" }}>
                <div style={{ fontSize:"9px", opacity:0.7, marginBottom:"1px" }}>{d.toLocaleDateString("en-US",{month:"short"})}</div>
                <div style={{ fontSize:"13px" }}>{d.getDate()}</div>
                {isEnrolled && hasLunch && (
                  <div style={{ fontSize:"8px", marginTop:"1px", opacity:0.85 }}>🥗</div>
                )}
              </div>
            );
          })}
        </div>
      ))}

      <div style={{ display:"flex", gap:"12px", marginTop:"12px", flexWrap:"wrap" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"5px" }}>
          <div style={{ width:"12px", height:"12px", borderRadius:"3px", background:OLIVE }}/>
          <span style={{ fontSize:"11px", color:TEXT_LIGHT }}>Enrolled (upcoming)</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:"5px" }}>
          <div style={{ width:"12px", height:"12px", borderRadius:"3px", background:"#8fa88a" }}/>
          <span style={{ fontSize:"11px", color:TEXT_LIGHT }}>Enrolled (past)</span>
        </div>
        {hasLunch && <div style={{ display:"flex", alignItems:"center", gap:"5px" }}>
          <span style={{ fontSize:"12px" }}>🥗</span>
          <span style={{ fontSize:"11px", color:TEXT_LIGHT }}>Lunch included</span>
        </div>}
      </div>
    </div>
  );
}

export default function ParentPortal() {
  const [user, setUser]           = useState(null);
  const [profile, setProfile]     = useState({ full_name:"", phone:"", email:"" });
  const [children, setChildren]   = useState([]);
  const [registrations, setRegs]  = useState([]);
  const [loading, setLoading]     = useState(true);
  const [activeSection, setSection] = useState("children");
  const [activeChildIdx, setChildIdx] = useState(0);
  const [childView, setChildView] = useState("info");
  const [editingProfile, setEditingProfile] = useState(false);
  const [editProfile, setEditProfile] = useState({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);

  useEffect(() => {
    async function load() {
      const { data:{ session } } = await supabase.auth.getSession();
      if (!session) { window.location.href="/login"; return; }
      setUser(session.user);
      const { data:p } = await supabase.from("parent_profiles").select("*").eq("id",session.user.id).single();
      if (p) { setProfile({...p,email:session.user.email}); setEditProfile({...p,email:session.user.email}); }
      else { setProfile(prev=>({...prev,email:session.user.email})); setEditProfile({full_name:"",phone:"",email:session.user.email}); }
      const { data:ch } = await supabase.from("children").select("*").eq("parent_id",session.user.id).order("created_at");
      setChildren(ch||[]);
      const { data:regs } = await supabase.from("registrations").select("*").eq("parent_email",session.user.email).order("created_at",{ascending:false});
      setRegs(regs||[]);
      setLoading(false);
    }
    load();
  }, []);

  const signOut = async () => { await supabase.auth.signOut(); window.location.href="/login"; };
  const saveProfile = async () => {
    setSavingProfile(true);
    await supabase.from("parent_profiles").upsert({ id:user.id, full_name:editProfile.full_name, phone:editProfile.phone, email:editProfile.email, updated_at:new Date().toISOString() });
    setProfile(editProfile); setEditingProfile(false); setSavingProfile(false);
  };
  const removeChild = async (ch) => {
    if (!window.confirm(`Remove ${ch.first_name} from your account? Existing enrollments won't be affected.`)) return;
    await supabase.from("children").delete().eq("id",ch.id);
    setChildren(prev=>prev.filter(c=>c.id!==ch.id));
    setChildIdx(0);
  };

  const childRegs = (ch) => registrations.filter(r=>
    r.child_first_name?.toLowerCase()===ch.first_name?.toLowerCase()&&
    r.child_last_name?.toLowerCase()===ch.last_name?.toLowerCase()
  );
  const today=new Date(); today.setHours(0,0,0,0);
  const upcoming=(regs)=>regs.filter(r=>(r.selected_days||[]).some(dk=>parseLocalKey(dk)>=today));
  const past=(regs)=>regs.filter(r=>(r.selected_days||[]).length>0&&(r.selected_days||[]).every(dk=>parseLocalKey(dk)<today));

  const navigate = (section, childIdx=0, view="info") => {
    setSection(section); setChildIdx(childIdx); setChildView(view);
    setMenuOpen(false);
    window.scrollTo(0,0);
  };

  if (loading) return (
    <div style={{ fontFamily:"Georgia,serif", background:CREAM, minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <p style={{ color:OLIVE }}>Loading your portal...</p>
    </div>
  );

  const SidebarContent = () => (
    <>
      <div style={{ marginBottom:"8px" }}>
        <p style={{ fontSize:"10px", letterSpacing:"1.5px", textTransform:"uppercase", color:TEXT_LIGHT, padding:"0 20px", margin:"0 0 6px" }}>Children</p>
        {children.length===0
          ? <p style={{ fontSize:"13px", color:TEXT_LIGHT, padding:"0 20px" }}>No children yet.</p>
          : children.map((ch,i)=>(
            <button key={ch.id} onClick={()=>navigate("children",i,"info")}
              style={{ width:"100%", textAlign:"left", background:activeSection==="children"&&activeChildIdx===i?"rgba(107,122,63,0.1)":"transparent",
                border:"none", padding:"9px 20px", cursor:"pointer", fontSize:"14px",
                color:activeSection==="children"&&activeChildIdx===i?OLIVE:TEXT_DARK,
                borderLeft:activeSection==="children"&&activeChildIdx===i?`3px solid ${OLIVE}`:"3px solid transparent",
                fontFamily:"Georgia,serif", display:"block" }}>
              {ch.first_name} {ch.last_name}
            </button>
          ))
        }
        <a href="/" onClick={()=>setMenuOpen(false)} style={{ display:"block", padding:"8px 20px", fontSize:"12px", color:ORANGE, textDecoration:"none" }}>+ Enroll a child</a>
      </div>
      <div style={{ height:"1px", background:CREAM_DARK, margin:"10px 0" }}/>
      {[{id:"general",label:"My Information"},{id:"payments",label:"Payments"}].map(item=>(
        <button key={item.id} onClick={()=>navigate(item.id)}
          style={{ width:"100%", textAlign:"left", background:activeSection===item.id?"rgba(107,122,63,0.1)":"transparent",
            border:"none", padding:"9px 20px", cursor:"pointer", fontSize:"14px",
            color:activeSection===item.id?OLIVE:TEXT_DARK,
            borderLeft:activeSection===item.id?`3px solid ${OLIVE}`:"3px solid transparent",
            fontFamily:"Georgia,serif" }}>
          {item.label}
        </button>
      ))}
      <div style={{ height:"1px", background:CREAM_DARK, margin:"10px 0" }}/>
      <a href="/schedule" onClick={()=>setMenuOpen(false)}
        style={{ display:"block", width:"100%", textAlign:"left", padding:"9px 20px", fontSize:"14px",
          color:TEXT_DARK, textDecoration:"none", fontFamily:"Georgia,serif",
          borderLeft:"3px solid transparent",
          background:"transparent" }}>
        📅 Schedule
      </a>
    </>
  );

  return (
    <div style={{ fontFamily:"Georgia,serif", background:CREAM, minHeight:"100vh", color:TEXT_DARK }}>
      <style>{`
        html, body, #root { margin:0; padding:0; width:100%; }
        * { box-sizing: border-box; }
        input[type="checkbox"],input[type="radio"] { width:18px; height:18px; cursor:pointer; accent-color:${OLIVE}; flex-shrink:0; }
        @media (max-width:700px) {
          .portal-sidebar { display: none !important; }
          .portal-main { padding: 16px 14px !important; }
          .info-row { flex-direction: column !important; align-items: flex-start !important; gap: 4px !important; }
        }
        @media (min-width:701px) {
          .hamburger-btn { display: none !important; }
          .mobile-menu-overlay { display: none !important; }
        }
      `}</style>

      {/* Header */}
      <div style={{ background:OLIVE_DARK, height:"90px", overflow:"hidden", position:"relative", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 20px" }}>
        <button className="hamburger-btn" onClick={()=>setMenuOpen(true)}
          style={{ position:"relative", zIndex:2, background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.25)", borderRadius:"8px", padding:"9px 11px", cursor:"pointer", display:"flex", flexDirection:"column", gap:"4px", flexShrink:0 }}>
          <div style={{ width:"18px", height:"2px", background:"#fff", borderRadius:"1px" }}/>
          <div style={{ width:"18px", height:"2px", background:"#fff", borderRadius:"1px" }}/>
          <div style={{ width:"18px", height:"2px", background:"#fff", borderRadius:"1px" }}/>
        </button>
        <div style={{ position:"absolute", left:"50%", top:"50%", transform:"translate(-50%,-40%)" }}>
          <img src={logo} alt="Wild Child Nosara" style={{ height:"180px", objectFit:"contain" }}/>
        </div>
        <div style={{ width:"44px" }}/>
      </div>

      {/* Welcome bar */}
      <div style={{ background:NAVY, padding:"12px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:"10px" }}>
        <p style={{ color:"rgba(255,255,255,0.85)", fontSize:"13px", margin:0 }}>
          Welcome, <strong style={{ color:"#fff" }}>{profile.full_name||user?.email}</strong>
        </p>
        <a href="/" style={{ background:ORANGE, color:"#fff", textDecoration:"none", borderRadius:"8px", padding:"8px 16px", fontSize:"12px", letterSpacing:"1px", textTransform:"uppercase", fontFamily:"Georgia,serif", whiteSpace:"nowrap" }}>
          + Enroll More Weeks
        </a>
      </div>

      {/* Mobile menu overlay */}
      {menuOpen&&(
        <div className="mobile-menu-overlay" onClick={()=>setMenuOpen(false)}
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", zIndex:200 }}>
          <div onClick={e=>e.stopPropagation()}
            style={{ position:"absolute", left:0, top:0, bottom:0, width:"280px", background:"#fff", overflowY:"auto", paddingTop:"20px", boxShadow:"4px 0 20px rgba(0,0,0,0.15)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"0 20px 16px", borderBottom:`1px solid ${CREAM_DARK}` }}>
              <p style={{ fontSize:"14px", color:TEXT_DARK, margin:0, fontWeight:500 }}>Menu</p>
              <button onClick={()=>setMenuOpen(false)}
                style={{ background:"none", border:"none", fontSize:"20px", cursor:"pointer", color:TEXT_LIGHT, lineHeight:1 }}>✕</button>
            </div>
            <div style={{ paddingTop:"12px" }}>
              <SidebarContent/>
            </div>
            <div style={{ borderTop:`1px solid ${CREAM_DARK}`, margin:"12px 0 0", padding:"12px 20px" }}>
              <button onClick={signOut}
                style={{ width:"100%", background:"transparent", border:`1px solid ${CREAM_DARK}`, borderRadius:"8px", padding:"11px", color:TEXT_MID, fontSize:"14px", fontFamily:"Georgia,serif", cursor:"pointer", textAlign:"left" }}>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Layout */}
      <div style={{ display:"flex", minHeight:"calc(100vh - 130px)" }}>

        {/* Desktop sidebar */}
        <div className="portal-sidebar" style={{ width:"240px", flexShrink:0, borderRight:`1px solid ${CREAM_DARK}`, paddingTop:"24px", background:"#fff", position:"sticky", top:0, alignSelf:"flex-start", minHeight:"calc(100vh - 130px)" }}>
          <SidebarContent/>
          <div style={{ borderTop:`1px solid ${CREAM_DARK}`, margin:"16px 0 0", padding:"12px 0" }}>
            <button onClick={signOut}
              style={{ width:"100%", textAlign:"left", background:"transparent", border:"none", padding:"9px 20px", cursor:"pointer", fontSize:"14px", color:TEXT_LIGHT, fontFamily:"Georgia,serif" }}>
              Sign Out
            </button>
          </div>
        </div>

        {/* Main */}
        <div className="portal-main" style={{ flex:1, padding:"28px 32px", minWidth:0, maxWidth:"700px" }}>

          {/* ── Children ── */}
          {activeSection==="children"&&(
            children.length===0
              ? <div style={{ textAlign:"center", padding:"60px 20px", color:TEXT_LIGHT }}>
                  <p style={{ fontSize:"15px", marginBottom:"16px" }}>No children added yet.</p>
                  <a href="/" style={{ background:ORANGE, color:"#fff", textDecoration:"none", borderRadius:"8px", padding:"10px 24px", fontSize:"13px", letterSpacing:"1px", textTransform:"uppercase" }}>Enroll Your First Child</a>
                </div>
              : (() => {
                const ch=children[activeChildIdx];
                if(!ch) return null;
                const regs=childRegs(ch);
                const upcomingRegs=upcoming(regs); const pastRegs=past(regs);
                const prog=ch.program_name||ch.program_id||"—";
                const dob=ch.dob?new Date(ch.dob).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"}):"—";
                return (
                  <div>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"20px", flexWrap:"wrap", gap:"10px" }}>
                      <div>
                        <h2 style={{ fontSize:"22px", fontWeight:400, color:TEXT_DARK, margin:"0 0 4px" }}>{ch.first_name} {ch.last_name}</h2>
                        <p style={{ fontSize:"13px", color:TEXT_LIGHT, margin:0 }}>{prog}</p>
                      </div>
                      <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
                        <a href="/" style={{ background:OLIVE, color:"#fff", textDecoration:"none", borderRadius:"8px", padding:"8px 14px", fontSize:"12px", letterSpacing:"1px", textTransform:"uppercase", fontFamily:"Georgia,serif", whiteSpace:"nowrap" }}>Enroll More Weeks</a>
                        <button onClick={()=>removeChild(ch)}
                          style={{ background:"transparent", border:`1px solid #f5c6c6`, borderRadius:"8px", padding:"8px 14px", fontSize:"12px", color:"#c0392b", cursor:"pointer", fontFamily:"Georgia,serif", whiteSpace:"nowrap" }}>Remove</button>
                      </div>
                    </div>

                    {/* Sub-tabs */}
                    <div style={{ display:"flex", gap:"0", marginBottom:"24px", borderBottom:`1px solid ${CREAM_DARK}` }}>
                      {["info","enrollments"].map(v=>(
                        <button key={v} onClick={()=>setChildView(v)}
                          style={{ background:"none", border:"none", borderBottom:childView===v?`2px solid ${OLIVE}`:"2px solid transparent",
                            padding:"8px 20px", fontSize:"13px", cursor:"pointer", color:childView===v?OLIVE:TEXT_LIGHT,
                            fontFamily:"Georgia,serif", textTransform:"capitalize", marginBottom:"-1px" }}>
                          {v}
                        </button>
                      ))}
                    </div>

                    {childView==="info"&&(
                      <SectionCard title="Child Information">
                        <InfoRow label="Full Name" value={`${ch.first_name} ${ch.last_name}`}/>
                        <InfoRow label="Date of Birth" value={dob}/>
                        <InfoRow label="Program" value={prog}/>
                        <InfoRow label="Allergies / Notes" value={ch.allergies||"None"}/>
                      </SectionCard>
                    )}

                    {childView==="enrollments"&&(
                      <div>
                        {upcomingRegs.length===0&&pastRegs.length===0&&(
                          <div style={{ textAlign:"center", padding:"40px 20px", color:TEXT_LIGHT }}>
                            <p style={{ fontSize:"15px", marginBottom:"16px" }}>No enrollments yet for {ch.first_name}.</p>
                            <a href="/" style={{ background:ORANGE, color:"#fff", textDecoration:"none", borderRadius:"8px", padding:"10px 24px", fontSize:"13px", letterSpacing:"1px", textTransform:"uppercase" }}>Enroll Now</a>
                          </div>
                        )}
                        {[...upcomingRegs,...pastRegs].length>0&&(()=>{
                          const allDays=[...upcomingRegs,...pastRegs].flatMap(r=>r.selected_days||[]);
                          const hasLunch=[...upcomingRegs,...pastRegs].some(r=>r.lunch);
                          return (
                            <>
                              <EnrollmentCalendar enrolledDays={allDays} hasLunch={hasLunch}/>

                              {upcomingRegs.length>0&&<>
                                <p style={{ fontSize:"12px", letterSpacing:"1px", textTransform:"uppercase", color:TEXT_LIGHT, marginBottom:"12px" }}>Upcoming</p>
                                {upcomingRegs.map(reg=>{
                                  const wg={};
                                  (reg.selected_days||[]).forEach(dk=>{
                                    const mon=getMonday(parseLocalKey(dk)); const wk=localDateKey(mon);
                                    if(!wg[wk])wg[wk]={monday:mon,days:[]};wg[wk].days.push(dk);
                                  });
                                  const wkEntries=Object.values(wg).sort((a,b)=>a.monday-b.monday);
                                  const PRICE_3=260,PRICE_5=420,PRICE_4TH=85,LUNCH=10;
                                  const weekPrice=n=>n<3?0:n===3?PRICE_3:n===4?PRICE_3+PRICE_4TH:PRICE_5;
                                  return (
                                    <div key={reg.id} style={{ background:"#fff", border:`1px solid ${CREAM_DARK}`, borderRadius:"10px", padding:"16px", marginBottom:"12px" }}>
                                      {wkEntries.map(wk=>{
                                        const n=wk.days.length; const p=weekPrice(n); const lc=reg.lunch?n*LUNCH:0;
                                        const dayNames=wk.days.map(dk=>parseLocalKey(dk).toLocaleDateString("en-US",{weekday:"short"})).sort().join(", ");
                                        return (
                                          <div key={wk.monday.toISOString()} style={{ marginBottom:"8px" }}>
                                            <div style={{ display:"flex", justifyContent:"space-between", fontSize:"14px", color:TEXT_DARK }}>
                                              <span>Wk of {wk.monday.toLocaleDateString("en-US",{month:"short",day:"numeric"})}</span>
                                              <span style={{ color:OLIVE }}>${p+lc}</span>
                                            </div>
                                            <div style={{ fontSize:"12px", color:TEXT_LIGHT, marginTop:"3px", display:"flex", gap:"5px", flexWrap:"wrap" }}>
                                              <span>{dayNames}</span>
                                              <span>· tuition ${p}</span>
                                              {reg.lunch&&<span style={{ color:GREEN }}>+ lunch ${lc} ({n}×$10)</span>}
                                            </div>
                                          </div>
                                        );
                                      })}
                                      <div style={{ borderTop:`1px solid ${CREAM_DARK}`, paddingTop:"8px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                                        <StatusBadge status={reg.payment_status}/>
                                        <span style={{ fontSize:"15px", color:OLIVE }}>${reg.grand_total} total</span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </>}

                              {pastRegs.length>0&&<>
                                <p style={{ fontSize:"12px", letterSpacing:"1px", textTransform:"uppercase", color:TEXT_LIGHT, margin:"20px 0 12px" }}>Past</p>
                                {pastRegs.map(reg=>(
                                  <div key={reg.id} style={{ background:"#fff", border:`1px solid ${CREAM_DARK}`, borderRadius:"10px", padding:"14px 16px", marginBottom:"10px", opacity:0.7 }}>
                                    <div style={{ display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:"8px" }}>
                                      <div>
                                        <p style={{ fontSize:"13px", color:TEXT_DARK, margin:"0 0 4px" }}>
                                          {(reg.selected_days||[]).map(dk=>parseLocalKey(dk).toLocaleDateString("en-US",{weekday:"short"})).sort().join(", ")}
                                        </p>
                                        <p style={{ fontSize:"12px", color:TEXT_LIGHT, margin:0 }}>{(reg.selected_days||[]).length} days{reg.lunch?" · Lunch":""}</p>
                                      </div>
                                      <div style={{ textAlign:"right" }}>
                                        <p style={{ fontSize:"14px", color:TEXT_MID, margin:"0 0 4px" }}>${reg.grand_total}</p>
                                        <StatusBadge status={reg.payment_status}/>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </>}
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                );
              })()
          )}

          {/* ── My Information ── */}
          {activeSection==="general"&&(
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px" }}>
                <h2 style={{ fontSize:"22px", fontWeight:400, margin:0 }}>My Information</h2>
                {!editingProfile&&<button onClick={()=>setEditingProfile(true)}
                  style={{ background:"transparent", border:`1px solid ${CREAM_DARK}`, borderRadius:"8px", padding:"8px 16px", fontSize:"12px", color:TEXT_MID, cursor:"pointer", letterSpacing:"0.5px", textTransform:"uppercase", fontFamily:"Georgia,serif" }}>Edit</button>}
              </div>
              <SectionCard title="General">
                {editingProfile ? <>
                  <span style={lbl}>Full Name</span>
                  <input style={inp} value={editProfile.full_name||""} onChange={e=>setEditProfile({...editProfile,full_name:e.target.value})} placeholder="Your full name"/>
                  <span style={lbl}>Email</span>
                  <input style={{ ...inp, background:CREAM, color:TEXT_LIGHT }} value={editProfile.email||""} readOnly/>
                  <span style={lbl}>Phone / WhatsApp</span>
                  <input style={inp} value={editProfile.phone||""} onChange={e=>setEditProfile({...editProfile,phone:e.target.value})} placeholder="+1 555 000 0000"/>
                  <div style={{ display:"flex", gap:"10px", marginTop:"4px" }}>
                    <button onClick={saveProfile} disabled={savingProfile}
                      style={{ background:savingProfile?"#aaa":OLIVE, color:"#fff", border:"none", borderRadius:"8px", padding:"11px 20px", fontSize:"13px", cursor:"pointer", fontFamily:"Georgia,serif", textTransform:"uppercase" }}>
                      {savingProfile?"Saving...":"Save Changes"}
                    </button>
                    <button onClick={()=>{setEditingProfile(false);setEditProfile(profile);}}
                      style={{ background:"transparent", border:`1px solid ${CREAM_DARK}`, borderRadius:"8px", padding:"11px 20px", fontSize:"13px", color:TEXT_MID, cursor:"pointer", fontFamily:"Georgia,serif" }}>Cancel</button>
                  </div>
                </> : <>
                  <InfoRow label="Full Name" value={profile.full_name}/>
                  <InfoRow label="Email" value={profile.email}/>
                  <InfoRow label="Phone / WhatsApp" value={profile.phone}/>
                </>}
              </SectionCard>
              <SectionCard title="Children on Account">
                {children.length===0
                  ? <p style={{ fontSize:"13px", color:TEXT_LIGHT }}>No children yet. <a href="/" style={{ color:ORANGE }}>Enroll →</a></p>
                  : children.map((ch,i)=>(
                    <div key={ch.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:i<children.length-1?`1px solid ${CREAM_DARK}`:"none", fontSize:"14px" }}>
                      <div>
                        <span style={{ color:TEXT_DARK }}>{ch.first_name} {ch.last_name}</span>
                        <span style={{ color:TEXT_LIGHT, fontSize:"12px", marginLeft:"8px" }}>{ch.program_name||"—"}</span>
                      </div>
                      <button onClick={()=>removeChild(ch)}
                        style={{ background:"none", border:"none", color:"#c0392b", cursor:"pointer", fontSize:"12px", fontFamily:"Georgia,serif" }}>Remove</button>
                    </div>
                  ))
                }
              </SectionCard>
            </div>
          )}

          {/* ── Payments ── */}
          {activeSection==="payments"&&(
            <div>
              <h2 style={{ fontSize:"22px", fontWeight:400, marginBottom:"20px" }}>Payments</h2>
              <SectionCard title="Payment Method">
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0" }}>
                  <div>
                    <p style={{ fontSize:"14px", color:TEXT_DARK, margin:"0 0 3px" }}>Stripe integration coming soon</p>
                    <p style={{ fontSize:"12px", color:TEXT_LIGHT, margin:0 }}>You'll be able to save a card for faster enrollment</p>
                  </div>
                  <span style={{ fontSize:"20px" }}>💳</span>
                </div>
              </SectionCard>
              <SectionCard title="Payment History">
                {registrations.length===0
                  ? <p style={{ fontSize:"13px", color:TEXT_LIGHT }}>No payment history yet.</p>
                  : registrations.map((reg,i)=>(
                    <div key={reg.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:i<registrations.length-1?`1px solid ${CREAM_DARK}`:"none", flexWrap:"wrap", gap:"8px" }}>
                      <div>
                        <p style={{ fontSize:"14px", color:TEXT_DARK, margin:"0 0 3px" }}>{reg.child_first_name} {reg.child_last_name}</p>
                        <p style={{ fontSize:"12px", color:TEXT_LIGHT, margin:0 }}>{weekLabel(reg.selected_days)} · {formatDate(reg.created_at)}</p>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <p style={{ fontSize:"15px", color:OLIVE, margin:"0 0 4px" }}>${reg.grand_total}</p>
                        <StatusBadge status={reg.payment_status}/>
                      </div>
                    </div>
                  ))
                }
              </SectionCard>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
