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
function getMonday(date) {
  const d=new Date(date); const day=d.getDay();
  d.setDate(d.getDate()-day+(day===0?-6:1)); d.setHours(0,0,0,0); return d;
}
function weekLabel(days) {
  if (!days||days.length===0) return "—";
  const sorted=[...days].sort();
  const mon=getMonday(new Date(sorted[0]));
  const fri=new Date(mon); fri.setDate(fri.getDate()+4);
  return `${mon.toLocaleDateString("en-US",{month:"short",day:"numeric"})} – ${fri.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}`;
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
  const upcoming=(regs)=>regs.filter(r=>(r.selected_days||[]).some(dk=>new Date(dk)>=today));
  const past=(regs)=>regs.filter(r=>(r.selected_days||[]).length>0&&(r.selected_days||[]).every(dk=>new Date(dk)<today));

  const navigate = (section, childIdx=0, view="info") => {
    setSection(section); setChildIdx(childIdx); setChildView(view);
    setMenuOpen(false);
    window.scrollTo(0,0);
  };

  const NAV = [
    { id:"children", label:"My Children" },
    { id:"general",  label:"My Information" },
    { id:"payments", label:"Payments" },
  ];

  if (loading) return (
    <div style={{ fontFamily:"Georgia,serif", background:CREAM, minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <p style={{ color:OLIVE }}>Loading your portal...</p>
    </div>
  );

  const SidebarContent = () => (
    <>
      {/* Children */}
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
                fontFamily:"Georgia,serif", display:"block", width:"100%" }}>
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
    </>
  );

  return (
    <div style={{ fontFamily:"Georgia,serif", background:CREAM, minHeight:"100vh", color:TEXT_DARK }}>
      <style>{`
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
        <div style={{ position:"absolute", left:"50%", top:"50%", transform:"translate(-50%,-40%)" }}>
          <img src={logo} alt="Wild Child Nosara" style={{ height:"180px", objectFit:"contain" }}/>
        </div>
        {/* Hamburger — mobile only */}
        <button className="hamburger-btn" onClick={()=>setMenuOpen(true)}
          style={{ position:"relative", zIndex:1, background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.25)", borderRadius:"8px", padding:"8px 12px", cursor:"pointer", display:"flex", flexDirection:"column", gap:"4px" }}>
          <div style={{ width:"18px", height:"2px", background:"#fff", borderRadius:"1px" }}/>
          <div style={{ width:"18px", height:"2px", background:"#fff", borderRadius:"1px" }}/>
          <div style={{ width:"18px", height:"2px", background:"#fff", borderRadius:"1px" }}/>
        </button>
        <div style={{ width:"80px" }} className="hamburger-btn"/>
        <div style={{ position:"relative", zIndex:1, display:"flex", gap:"10px", alignItems:"center" }}>
          <a href="/" style={{ fontSize:"11px", color:"rgba(255,255,255,0.7)", textDecoration:"none" }}>← Enroll</a>
          <button onClick={signOut} style={{ background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.25)", borderRadius:"8px", padding:"7px 12px", color:"rgba(255,255,255,0.9)", fontSize:"11px", letterSpacing:"1px", textTransform:"uppercase", cursor:"pointer", fontFamily:"Georgia,serif" }}>Sign Out</button>
        </div>
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
          </div>
        </div>
      )}

      {/* Layout */}
      <div style={{ display:"flex", minHeight:"calc(100vh - 130px)" }}>

        {/* Desktop sidebar */}
        <div className="portal-sidebar" style={{ width:"240px", flexShrink:0, borderRight:`1px solid ${CREAM_DARK}`, paddingTop:"24px", background:"#fff", position:"sticky", top:0, alignSelf:"flex-start", minHeight:"calc(100vh - 130px)" }}>
          <SidebarContent/>
        </div>

        {/* Main */}
        <div className="portal-main" style={{ flex:1, padding:"28px 32px", minWidth:0, maxWidth:"700px" }}>

          {/* Mobile section title */}
          <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"20px" }}>
            <button className="hamburger-btn" onClick={()=>setMenuOpen(true)}
              style={{ background:"#fff", border:`1px solid ${CREAM_DARK}`, borderRadius:"8px", padding:"8px 12px", cursor:"pointer", display:"flex", flexDirection:"column", gap:"3px", flexShrink:0 }}>
              <div style={{ width:"16px", height:"2px", background:TEXT_MID, borderRadius:"1px" }}/>
              <div style={{ width:"16px", height:"2px", background:TEXT_MID, borderRadius:"1px" }}/>
              <div style={{ width:"16px", height:"2px", background:TEXT_MID, borderRadius:"1px" }}/>
            </button>
            <p style={{ fontSize:"12px", color:TEXT_LIGHT, margin:0, letterSpacing:"0.5px" }}>
              {activeSection==="children"&&children[activeChildIdx] ? `${children[activeChildIdx].first_name} ${children[activeChildIdx].last_name}` : activeSection==="general"?"My Information":"Payments"}
            </p>
          </div>

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
                        {upcomingRegs.length>0&&<>
                          <p style={{ fontSize:"12px", letterSpacing:"1px", textTransform:"uppercase", color:TEXT_LIGHT, marginBottom:"12px" }}>Upcoming</p>
                          {upcomingRegs.map(reg=>(
                            <div key={reg.id} style={{ background:"#fff", border:`1px solid ${CREAM_DARK}`, borderRadius:"10px", padding:"16px", marginBottom:"12px" }}>
                              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:"8px" }}>
                                <div>
                                  <p style={{ fontSize:"14px", color:TEXT_DARK, margin:"0 0 4px" }}>{weekLabel(reg.selected_days)}</p>
                                  <p style={{ fontSize:"12px", color:TEXT_LIGHT, margin:0 }}>{(reg.selected_days||[]).length} days{reg.lunch?" · Lunch":""}</p>
                                </div>
                                <div style={{ textAlign:"right" }}>
                                  <p style={{ fontSize:"15px", color:OLIVE, margin:"0 0 6px" }}>${reg.grand_total}</p>
                                  <StatusBadge status={reg.payment_status}/>
                                </div>
                              </div>
                            </div>
                          ))}
                        </>}
                        {pastRegs.length>0&&<>
                          <p style={{ fontSize:"12px", letterSpacing:"1px", textTransform:"uppercase", color:TEXT_LIGHT, margin:"20px 0 12px" }}>Past</p>
                          {pastRegs.map(reg=>(
                            <div key={reg.id} style={{ background:"#fff", border:`1px solid ${CREAM_DARK}`, borderRadius:"10px", padding:"14px 16px", marginBottom:"10px", opacity:0.75 }}>
                              <div style={{ display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:"8px" }}>
                                <div>
                                  <p style={{ fontSize:"13px", color:TEXT_DARK, margin:"0 0 2px" }}>{weekLabel(reg.selected_days)}</p>
                                  <p style={{ fontSize:"12px", color:TEXT_LIGHT, margin:0 }}>{(reg.selected_days||[]).length} days</p>
                                </div>
                                <div style={{ textAlign:"right" }}>
                                  <p style={{ fontSize:"14px", color:TEXT_MID, margin:"0 0 4px" }}>${reg.grand_total}</p>
                                  <StatusBadge status={reg.payment_status}/>
                                </div>
                              </div>
                            </div>
                          ))}
                        </>}
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
