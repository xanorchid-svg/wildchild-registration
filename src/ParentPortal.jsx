import { useState, useEffect } from "react";
import { useNavigate as useRouterNavigate } from "react-router-dom";
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
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
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

function generateReferralCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "WC-";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
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

// ── Referral Card — receives accountCredit as prop ────────────────────────────
function ReferralCard({ profile, userId, accountCredit, onCodeGenerated }) {
  const [copied, setCopied]   = useState(false);
  const [generating, setGen]  = useState(false);
  const code = profile?.referral_code;
  const hasCreditPending = profile?.referral_credit_pending === true;

  const handleCopy = () => {
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleGenerate = async () => {
    setGen(true);
    const newCode = generateReferralCode();
    await supabase.from("parent_profiles").update({ referral_code: newCode }).eq("id", userId);
    onCodeGenerated(newCode);
    setGen(false);
  };

  return (
    <>
      {/* Account Credit — shown above referral card if credit > 0 */}
      {accountCredit > 0 && (
        <div style={{ background:"#f0f7f0", border:"1px solid #b8d4b8", borderRadius:10, padding:"14px 18px", marginBottom:16, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <p style={{ fontSize:11, letterSpacing:"1px", textTransform:"uppercase", color:GREEN, margin:"0 0 4px" }}>Account Credit</p>
            <p style={{ fontSize:22, fontWeight:"bold", color:GREEN, margin:0, fontFamily:"Georgia,serif" }}>${accountCredit.toFixed(2)}</p>
          </div>
          <div style={{ fontSize:12, color:"#7a9a7a", maxWidth:160, textAlign:"right", lineHeight:1.5 }}>Applied automatically at your next enrollment checkout</div>
        </div>
      )}

      <div style={{ background:"linear-gradient(135deg, #4d5a2c 0%, #6b7a3f 100%)", borderRadius:"14px", padding:"22px", marginBottom:"16px", color:"#fff" }}>
        <div style={{ display:"flex", alignItems:"flex-start", gap:"14px", marginBottom:"16px" }}>
          <span style={{ fontSize:"28px", lineHeight:1 }}>🌿</span>
          <div>
            <p style={{ fontSize:"15px", fontWeight:500, margin:"0 0 4px", color:"#fff" }}>Bring a Friend to Wild Child</p>
            <p style={{ fontSize:"13px", color:"rgba(255,255,255,0.78)", margin:0, lineHeight:1.5 }}>
              Share your code with a family — they get 5% off their first enrollment, and you'll earn a 5% credit on your next one.
            </p>
          </div>
        </div>

        {hasCreditPending && (
          <div style={{ background:"rgba(255,255,255,0.15)", borderRadius:"8px", padding:"10px 14px", marginBottom:"14px", display:"flex", alignItems:"center", gap:"8px" }}>
            <span style={{ fontSize:"16px" }}>🎉</span>
            <p style={{ fontSize:"13px", color:"#fff", margin:0 }}>
              <strong>You have a referral credit waiting!</strong> 5% off your next enrollment — applied automatically at checkout.
            </p>
          </div>
        )}

        {code ? (
          <div>
            <p style={{ fontSize:"10px", letterSpacing:"1.5px", textTransform:"uppercase", color:"rgba(255,255,255,0.6)", margin:"0 0 8px" }}>Your referral code</p>
            <div style={{ display:"flex", gap:"10px", alignItems:"center" }}>
              <div style={{ flex:1, background:"rgba(255,255,255,0.15)", borderRadius:"8px", padding:"12px 16px", letterSpacing:"3px", fontSize:"18px", fontFamily:"monospace", color:"#fff", border:"1px solid rgba(255,255,255,0.25)" }}>
                {code}
              </div>
              <button
                onClick={handleCopy}
                style={{ background:copied?"rgba(255,255,255,0.3)":"rgba(255,255,255,0.18)", border:"1px solid rgba(255,255,255,0.3)", borderRadius:"8px", padding:"12px 16px", color:"#fff", fontSize:"13px", cursor:"pointer", fontFamily:"Georgia,serif", whiteSpace:"nowrap", transition:"all .2s" }}>
                {copied ? "Copied ✓" : "Copy"}
              </button>
            </div>
            <p style={{ fontSize:"12px", color:"rgba(255,255,255,0.6)", margin:"12px 0 0", lineHeight:1.5 }}>
              Share via WhatsApp, text, or email. Your friend enters this code at Step 3 of enrollment.
            </p>
          </div>
        ) : (
          <div>
            <p style={{ fontSize:"13px", color:"rgba(255,255,255,0.8)", margin:"0 0 12px" }}>
              Generate your personal referral code to start sharing.
            </p>
            <button
              onClick={handleGenerate}
              disabled={generating}
              style={{ background:"rgba(255,255,255,0.2)", border:"1px solid rgba(255,255,255,0.35)", borderRadius:"8px", padding:"11px 20px", color:"#fff", fontSize:"13px", cursor:"pointer", fontFamily:"Georgia,serif", transition:"all .2s" }}>
              {generating ? "Generating..." : "Get My Referral Code"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

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
                  opacity: inMonth ? 1 : 0.5 }}>
                <div style={{ fontSize:"9px", opacity:0.7, marginBottom:"1px" }}>{d.toLocaleDateString("en-US",{month:"short"})}</div>
                <div style={{ fontSize:"13px" }}>{d.getDate()}</div>
                {isEnrolled && hasLunch && <div style={{ fontSize:"8px", marginTop:"1px", opacity:0.85 }}>🥗</div>}
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

// ── Change Request Modal ──────────────────────────────────────────────────────
function ChangeRequestModal({ reg, session, onClose, onSubmitted }) {
  function getMonday(date) {
    const d = new Date(date);
    const daysFromMonday = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - daysFromMonday);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  function parseLocalKey(key) {
    const [y, m, d] = key.split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  const today = new Date(); today.setHours(0,0,0,0);
  const futureDays = (reg.selected_days || []).filter(dk => parseLocalKey(dk) >= today);

  const weekMap = {};
  futureDays.forEach(dk => {
    const mon = getMonday(parseLocalKey(dk));
    const key = mon.toISOString();
    if (!weekMap[key]) weekMap[key] = { monday: mon, days: [] };
    weekMap[key].days.push(dk);
  });
  const weeks = Object.values(weekMap).sort((a,b) => a.monday - b.monday);

  const [selectedWeeks, setSelectedWeeks] = useState([]);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function toggleWeek(key) {
    setSelectedWeeks(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  }

  const uniqueWeeks = [...new Set((reg.selected_days||[]).map(dk => getMonday(parseLocalKey(dk)).toISOString()))].length;
  const weeklyRate = reg.subtotal_tuition / Math.max(1, uniqueWeeks);
  const creditValue = selectedWeeks.length * weeklyRate;

  async function handleSubmit() {
    if (selectedWeeks.length === 0) { setError("Please select at least one week to cancel."); return; }
    setSubmitting(true);
    setError("");
    try {
      const weeksData = selectedWeeks.map(key => {
        const w = weekMap[key];
        return {
          weekOf: w.monday.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          days: w.days,
        };
      });
      const { error: dbErr } = await supabase.from("enrollment_change_requests").insert({
        parent_user_id: session.user.id,
        registration_id: reg.id,
        child_name: `${reg.child_first_name} ${reg.child_last_name}`,
        weeks_to_cancel: weeksData,
        credit_value: Math.round(creditValue * 100) / 100,
        parent_note: note.trim() || null,
        status: "pending",
      });
      if (dbErr) throw dbErr;
      onSubmitted();
      onClose();
    } catch(e) {
      setError(e.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:300, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }} onClick={onClose}>
      <div style={{ background:"#fff", borderRadius:16, padding:28, maxWidth:480, width:"100%", maxHeight:"85vh", overflowY:"auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <h3 style={{ margin:0, color:OLIVE_DARK, fontSize:18, fontFamily:"Georgia,serif" }}>Request a Change</h3>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:24, cursor:"pointer", color:"#999" }}>×</button>
        </div>

        <div style={{ background:`${ORANGE}10`, border:`1px solid ${ORANGE}30`, borderRadius:8, padding:"12px 14px", marginBottom:20, fontSize:13, color:ORANGE, lineHeight:1.5 }}>
          ℹ️ Cancelled weeks are non-refundable but the value will be added as <strong>account credit</strong> once approved by Wild Child staff. Credit applies automatically to your next enrollment.
        </div>

        <p style={{ fontSize:11, letterSpacing:"0.1em", textTransform:"uppercase", color:TEXT_LIGHT, marginBottom:12 }}>Select weeks to cancel</p>

        {weeks.length === 0 && (
          <p style={{ color:"#888", fontSize:14, marginBottom:16 }}>No upcoming weeks found for this enrollment.</p>
        )}

        {weeks.map(w => {
          const key = w.monday.toISOString();
          const selected = selectedWeeks.includes(key);
          return (
            <div key={key} onClick={() => toggleWeek(key)}
              style={{ border:`2px solid ${selected ? OLIVE : CREAM_DARK}`, borderRadius:10, padding:"12px 16px", marginBottom:8, cursor:"pointer", background: selected ? `${OLIVE}10` : "#fff", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div>
                <div style={{ fontWeight:"bold", fontSize:14, fontFamily:"Georgia,serif" }}>
                  Week of {w.monday.toLocaleDateString("en-US", { month:"short", day:"numeric" })}
                </div>
                <div style={{ fontSize:12, color:"#888", marginTop:2 }}>{w.days.length} day{w.days.length !== 1 ? "s" : ""}</div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:13, color:OLIVE, fontWeight:"bold" }}>${Math.round(weeklyRate)}</span>
                <div style={{ width:20, height:20, borderRadius:"50%", border:`2px solid ${selected ? OLIVE : CREAM_DARK}`, background: selected ? OLIVE : "transparent", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {selected && <span style={{ color:"#fff", fontSize:11 }}>✓</span>}
                </div>
              </div>
            </div>
          );
        })}

        {selectedWeeks.length > 0 && (
          <div style={{ background:`${GREEN}10`, border:`1px solid ${GREEN}30`, borderRadius:8, padding:"12px 16px", marginTop:8, marginBottom:16, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:14, color:GREEN }}>Credit if approved</span>
            <span style={{ fontSize:18, fontWeight:"bold", color:GREEN }}>${Math.round(creditValue)}</span>
          </div>
        )}

        <div style={{ marginBottom:16 }}>
          <label style={{ display:"block", fontSize:11, letterSpacing:"0.1em", textTransform:"uppercase", color:TEXT_LIGHT, marginBottom:6 }}>Note to Wild Child team (optional)</label>
          <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. travelling for 2 weeks, will be back in June" rows={3}
            style={{ width:"100%", padding:"11px 13px", border:`1px solid ${CREAM_DARK}`, borderRadius:8, fontSize:14, fontFamily:"Georgia,serif", resize:"vertical", boxSizing:"border-box", outline:"none" }} />
        </div>

        {error && <div style={{ background:"#fef2f2", border:"1px solid #fca5a5", borderRadius:8, padding:"10px 14px", color:"#b91c1c", fontSize:13, marginBottom:12 }}>{error}</div>}

        <button onClick={handleSubmit} disabled={submitting || selectedWeeks.length === 0}
          style={{ width:"100%", padding:"14px", background: submitting || selectedWeeks.length === 0 ? "#ccc" : OLIVE_DARK, color:"#fff", border:"none", borderRadius:10, fontSize:15, fontFamily:"Georgia,serif", cursor: submitting || selectedWeeks.length === 0 ? "not-allowed" : "pointer" }}>
          {submitting ? "Submitting…" : `Submit Request${selectedWeeks.length > 0 ? ` · $${Math.round(creditValue)} credit` : ""}`}
        </button>
      </div>
    </div>
  );
}

export default function ParentPortal() {
  const routerNavigate = useRouterNavigate();
  const [user, setUser]                   = useState(null);
  const [session, setSession]             = useState(null);
  const [profile, setProfile]             = useState({ full_name:"", phone:"", email:"" });
  const [children, setChildren]           = useState([]);
  const [registrations, setRegs]          = useState([]);
  const [accountCredit, setAccountCredit] = useState(0);
  const [changeRequests, setChangeRequests] = useState([]);
  const [showChangeModal, setShowChangeModal] = useState(null);
  const [loading, setLoading]             = useState(true);
  const [activeSection, setSection]       = useState("children");
  const [activeChildIdx, setChildIdx]     = useState(0);
  const [childView, setChildView]         = useState("info");
  const [editingProfile, setEditingProfile] = useState(false);
  const [editProfile, setEditProfile]     = useState({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [menuOpen, setMenuOpen]           = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const { data:{ session: sess } } = await supabase.auth.getSession();
        if (!sess) { window.location.href="/login"; return; }
        setUser(sess.user);
        setSession(sess);
        const { data:p } = await supabase.from("parent_profiles").select("*").eq("id",sess.user.id).maybeSingle();
        if (p) {
          setProfile({...p, email:sess.user.email});
          setEditProfile({...p, email:sess.user.email});
          setAccountCredit(p.account_credit || 0);
        } else {
          setProfile(prev=>({...prev, email:sess.user.email}));
          setEditProfile({ full_name:"", phone:"", email:sess.user.email });
          setAccountCredit(0);
        }
        const { data:ch } = await supabase.from("children").select("*").eq("parent_id",sess.user.id).order("created_at");
        setChildren(ch||[]);
        const { data:regs } = await supabase.from("registrations").select("*").eq("parent_email",sess.user.email).order("created_at",{ascending:false});
        setRegs(regs||[]);
        const { data:crData } = await supabase.from("enrollment_change_requests").select("*").eq("parent_user_id",sess.user.id).order("created_at",{ascending:false});
        if (crData) setChangeRequests(crData);
      } catch(e) {
        console.error("Portal load error:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const signOut = async () => { await supabase.auth.signOut(); window.location.href="/login"; };

  const saveProfile = async () => {
    setSavingProfile(true);
    await supabase.from("parent_profiles").upsert({
      id: user.id,
      full_name: editProfile.full_name,
      phone: editProfile.phone,
      email: editProfile.email,
      updated_at: new Date().toISOString()
    });
    setProfile(editProfile);
    setEditingProfile(false);
    setSavingProfile(false);
  };

  const removeChild = async (ch) => {
    if (!window.confirm(`Remove ${ch.first_name} from your account? Existing enrollments won't be affected.`)) return;
    await supabase.from("children").delete().eq("id",ch.id);
    setChildren(prev=>prev.filter(c=>c.id!==ch.id));
    setChildIdx(0);
  };

  const handleCodeGenerated = (newCode) => {
    setProfile(prev => ({ ...prev, referral_code: newCode }));
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
    setMenuOpen(false); window.scrollTo(0,0);
  };

  if (loading) return (
    <div style={{ fontFamily:"Georgia,serif", background:CREAM, minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <p style={{ color:OLIVE }}>Loading your portal...</p>
    </div>
  );

  // ── Contact links (reused in sidebar + mobile + footer) ───────────────────
  const ContactLinks = ({ style = {} }) => (
    <div style={style}>
      <a href="mailto:info@dandelionwildschooling.com"
        style={{ display:"flex", alignItems:"center", gap:"8px", padding:"8px 20px", fontSize:"13px", color:TEXT_MID, textDecoration:"none", fontFamily:"Georgia,serif" }}>
        <span style={{ fontSize:"15px" }}>✉️</span>
        <span>info@dandelionwildschooling.com</span>
      </a>
      <a href="https://wa.me/50661640827" target="_blank" rel="noopener noreferrer"
        style={{ display:"flex", alignItems:"center", gap:"8px", padding:"8px 20px", fontSize:"13px", color:TEXT_MID, textDecoration:"none", fontFamily:"Georgia,serif" }}>
        <span style={{ fontSize:"15px" }}>💬</span>
        <span>WhatsApp us</span>
      </a>
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
        <button onClick={()=>routerNavigate('/register')} style={{ display:"block", width:"100%", textAlign:"left", background:"none", border:"none", padding:"8px 20px", fontSize:"12px", color:ORANGE, cursor:"pointer", fontFamily:"Georgia,serif" }}>+ Enroll a child</button>
      </div>

      <div style={{ height:"1px", background:CREAM_DARK, margin:"10px 0" }}/>

      {[{id:"general",label:"My Information"},{id:"payments",label:"Payments"},{id:"menu",label:"🍽️ Weekly Menu"}].map(item=>(
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
          color:TEXT_DARK, textDecoration:"none", fontFamily:"Georgia,serif", borderLeft:"3px solid transparent" }}>
        📅 Schedule
      </a>
      <a href="/harmony" onClick={()=>setMenuOpen(false)}
        style={{ display:"block", width:"100%", textAlign:"left", padding:"9px 20px", fontSize:"14px",
          color:TEXT_DARK, textDecoration:"none", fontFamily:"Georgia,serif", borderLeft:"3px solid transparent" }}>
        🌿 Saturday Co-Op
      </a>
    </>
  );

  return (
    <div style={{ fontFamily:"Georgia,serif", background:CREAM, height:"100vh", overflow:"hidden", color:TEXT_DARK, display:"flex", flexDirection:"column" }}>
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
          {profile.referral_credit_pending && (
            <span style={{ marginLeft:"10px", background:ORANGE, color:"#fff", fontSize:"11px", padding:"2px 8px", borderRadius:"10px", verticalAlign:"middle" }}>
              🎉 Referral credit waiting
            </span>
          )}
        </p>
        <button onClick={()=>routerNavigate('/register')} style={{ background:ORANGE, color:"#fff", border:"none", borderRadius:"8px", padding:"8px 16px", fontSize:"12px", letterSpacing:"1px", textTransform:"uppercase", fontFamily:"Georgia,serif", whiteSpace:"nowrap", cursor:"pointer" }}>
          + Enroll More Weeks
        </button>
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
            <div style={{ paddingTop:"12px" }}><SidebarContent/></div>
            <div style={{ borderTop:`1px solid ${CREAM_DARK}`, margin:"12px 0 0", padding:"12px 0" }}>
              <a href="https://wildchildnosara.com" target="_blank" rel="noopener noreferrer"
                style={{ display:"block", padding:"9px 20px", fontSize:"13px", color:TEXT_LIGHT, textDecoration:"none", fontFamily:"Georgia,serif" }}>
                Our Website ↗
              </a>
              <a href="mailto:info@dandelionwildschooling.com"
                style={{ display:"flex", alignItems:"center", gap:"8px", padding:"8px 20px", fontSize:"13px", color:TEXT_MID, textDecoration:"none", fontFamily:"Georgia,serif" }}>
                <span>✉️</span><span>info@dandelionwildschooling.com</span>
              </a>
              <a href="https://wa.me/50661640827" target="_blank" rel="noopener noreferrer"
                style={{ display:"flex", alignItems:"center", gap:"8px", padding:"8px 20px", fontSize:"13px", color:TEXT_MID, textDecoration:"none", fontFamily:"Georgia,serif" }}>
                <span>💬</span><span>WhatsApp us</span>
              </a>
              <button onClick={signOut}
                style={{ width:"100%", background:"transparent", border:"none", borderTop:`1px solid ${CREAM_DARK}`, padding:"12px 20px", color:TEXT_LIGHT, fontSize:"14px", fontFamily:"Georgia,serif", cursor:"pointer", textAlign:"left", marginTop:"8px" }}>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Body: sidebar + main */}
      <div style={{ display:"flex", flex:1, overflow:"hidden" }}>

        {/* Desktop sidebar */}
        <div className="portal-sidebar" style={{ width:"240px", flexShrink:0, borderRight:`1px solid ${CREAM_DARK}`, background:"#fff", position:"sticky", top:0, height:"calc(100vh - 184px)", display:"flex", flexDirection:"column" }}>
          <div style={{ flex:1, overflowY:"auto", paddingTop:"24px" }}>
            <SidebarContent/>
          </div>
          <div style={{ borderTop:`1px solid ${CREAM_DARK}`, paddingTop:"8px", paddingBottom:"12px", flexShrink:0 }}>
            <a href="https://wildchildnosara.com" target="_blank" rel="noopener noreferrer"
              style={{ display:"block", padding:"8px 20px", fontSize:"13px", color:TEXT_LIGHT, textDecoration:"none", fontFamily:"Georgia,serif" }}>
              Our Website ↗
            </a>
            <button onClick={signOut}
              style={{ width:"100%", textAlign:"left", background:"transparent", border:"none", padding:"8px 20px", cursor:"pointer", fontSize:"14px", color:TEXT_LIGHT, fontFamily:"Georgia,serif" }}>
              Sign Out
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="portal-main" style={{ flex:1, padding:activeSection==="menu"?"0":"28px 32px", minWidth:0, maxWidth:activeSection==="menu"?"none":"700px", overflowY:"auto", position:"relative" }}>

          {/* ── Children ── */}
          {activeSection==="children"&&(
            children.length===0
              ? <div style={{ textAlign:"center", padding:"60px 20px", color:TEXT_LIGHT }}>
                  <p style={{ fontSize:"15px", marginBottom:"16px" }}>No children added yet.</p>
                  <button onClick={()=>routerNavigate('/register')} style={{ background:ORANGE, color:"#fff", border:"none", borderRadius:"8px", padding:"10px 24px", fontSize:"13px", letterSpacing:"1px", textTransform:"uppercase", fontFamily:"Georgia,serif", cursor:"pointer" }}>Enroll Your First Child</button>
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
                        <button onClick={()=>routerNavigate(`/register?prefill=true&childId=${ch.id}`)} style={{ background:OLIVE, color:"#fff", border:"none", borderRadius:"8px", padding:"8px 14px", fontSize:"12px", letterSpacing:"1px", textTransform:"uppercase", fontFamily:"Georgia,serif", whiteSpace:"nowrap", cursor:"pointer" }}>Enroll More Weeks</button>
                        <button onClick={()=>removeChild(ch)}
                          style={{ background:"transparent", border:`1px solid #f5c6c6`, borderRadius:"8px", padding:"8px 14px", fontSize:"12px", color:"#c0392b", cursor:"pointer", fontFamily:"Georgia,serif", whiteSpace:"nowrap" }}>Remove</button>
                      </div>
                    </div>

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
                        <InfoRow label="Medical Notes" value={ch.medical_notes||"None"}/>
                      </SectionCard>
                    )}

                    {childView==="enrollments"&&(
                      <div>
                        {upcomingRegs.length===0&&pastRegs.length===0&&(
                          <div style={{ textAlign:"center", padding:"40px 20px", color:TEXT_LIGHT }}>
                            <p style={{ fontSize:"15px", marginBottom:"16px" }}>No enrollments yet for {ch.first_name}.</p>
                            <button onClick={()=>routerNavigate('/register')} style={{ background:ORANGE, color:"#fff", border:"none", borderRadius:"8px", padding:"10px 24px", fontSize:"13px", letterSpacing:"1px", textTransform:"uppercase", fontFamily:"Georgia,serif", cursor:"pointer" }}>Enroll Now</button>
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
                                  return (
                                    <div key={reg.id} style={{ background:"#fff", border:`1px solid ${CREAM_DARK}`, borderRadius:"10px", padding:"16px", marginBottom:"12px" }}>
                                      {wkEntries.map(wk=>{
                                        const n=wk.days.length;
                                        const dayNames=wk.days.map(dk=>parseLocalKey(dk).toLocaleDateString("en-US",{weekday:"short"})).sort().join(", ");
                                        return (
                                          <div key={wk.monday.toISOString()} style={{ marginBottom:"8px" }}>
                                            <div style={{ display:"flex", justifyContent:"space-between", fontSize:"14px", color:TEXT_DARK }}>
                                              <span>Wk of {wk.monday.toLocaleDateString("en-US",{month:"short",day:"numeric"})}</span>
                                            </div>
                                            <div style={{ fontSize:"12px", color:TEXT_LIGHT, marginTop:"3px" }}>
                                              {dayNames} · {n} days{reg.lunch?" · Lunch":""}
                                            </div>
                                          </div>
                                        );
                                      })}
                                      <div style={{ borderTop:`1px solid ${CREAM_DARK}`, paddingTop:"8px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                                        <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
                                          <StatusBadge status={reg.payment_status}/>
                                          {(reg.selected_days||[]).some(dk=>parseLocalKey(dk)>=today) && (
                                            <button onClick={()=>setShowChangeModal(reg)}
                                              style={{ background:"none", border:`1px solid ${CREAM_DARK}`, borderRadius:6, padding:"4px 10px", fontSize:11, color:TEXT_LIGHT, cursor:"pointer", fontFamily:"Georgia,serif" }}>
                                              Request a change
                                            </button>
                                          )}
                                        </div>
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

              {/* Pass accountCredit as prop — fixes the white-screen bug */}
              <ReferralCard
                profile={profile}
                userId={user?.id}
                accountCredit={accountCredit}
                onCodeGenerated={handleCodeGenerated}
              />

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
                  ? <p style={{ fontSize:"13px", color:TEXT_LIGHT }}>No children yet. <button onClick={()=>routerNavigate('/register')} style={{ background:"none", border:"none", color:ORANGE, cursor:"pointer", fontFamily:"Georgia,serif", fontSize:"13px", padding:0 }}>Enroll →</button></p>
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

              {/* Leave a Review */}
              <div style={{ background:"linear-gradient(135deg, #0f1f5c 0%, #2a3a7a 100%)", borderRadius:"14px", padding:"22px", marginBottom:"16px", color:"#fff" }}>
                <div style={{ display:"flex", alignItems:"flex-start", gap:"14px", marginBottom:"16px" }}>
                  <span style={{ fontSize:"28px", lineHeight:1 }}>⭐</span>
                  <div>
                    <p style={{ fontSize:"15px", fontWeight:500, margin:"0 0 4px", color:"#fff" }}>Enjoying Wild Child?</p>
                    <p style={{ fontSize:"13px", color:"rgba(255,255,255,0.78)", margin:0, lineHeight:1.5 }}>
                      Your review helps other families find us. It only takes a minute and means the world to our community.
                    </p>
                  </div>
                </div>
                <a
                  href="https://g.page/r/YOUR_GOOGLE_REVIEW_LINK/review"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display:"inline-block", background:"rgba(255,255,255,0.18)", border:"1px solid rgba(255,255,255,0.35)", borderRadius:"8px", padding:"11px 20px", color:"#fff", fontSize:"13px", textDecoration:"none", fontFamily:"Georgia,serif" }}>
                  Leave a Review ↗
                </a>
              </div>
            </div>
          )}

          {/* menu-weekly */}{activeSection==="menu"&&(<div style={{padding:"28px 32px"}}><h2 style={{fontSize:"22px",fontWeight:400,marginBottom:"8px",fontFamily:"Georgia,serif"}}>Weekly Menu</h2><p style={{fontSize:"13px",color:"#7a7a9a",marginBottom:"16px",fontFamily:"Georgia,serif"}}>Fresh, locally sourced meals daily. Natural electrolytes Mon, Wed and Fri.</p><img src="/weekly-menu.jpg" alt="Weekly Menu" style={{width:"100%",height:"auto",borderRadius:"12px",border:"1px solid #e0d8c8",display:"block"}}/></div>)}{/* ── Payments ── */}
          {activeSection==="payments"&&(
            <div>
              <h2 style={{ fontSize:"22px", fontWeight:400, marginBottom:"20px" }}>Payments</h2>
              <SectionCard title="Payment Method">
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0" }}>
                  <div>
                    <p style={{ fontSize:"14px", color:TEXT_DARK, margin:"0 0 3px" }}>Credit or debit card</p>
                    <p style={{ fontSize:"12px", color:TEXT_LIGHT, margin:0 }}>Payments are processed securely via Stripe at checkout. Your card details are never stored.</p>
                  </div>
                  <span style={{ fontSize:"20px" }}>💳</span>
                </div>
              </SectionCard>
              <SectionCard title="Payment History">
                {registrations.length===0
                  ? <p style={{ fontSize:"13px", color:TEXT_LIGHT }}>No payment history yet.</p>
                  : registrations.map((reg,i)=>(
                    <div key={reg.id} style={{ padding:"10px 0", borderBottom:i<registrations.length-1?`1px solid ${CREAM_DARK}`:"none" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:"8px" }}>
                        <div>
                          <p style={{ fontSize:"14px", color:TEXT_DARK, margin:"0 0 3px" }}>{reg.child_first_name} {reg.child_last_name}</p>
                          <p style={{ fontSize:"12px", color:TEXT_LIGHT, margin:0 }}>{weekLabel(reg.selected_days)} · {formatDate(reg.created_at)}</p>
                        </div>
                        <div style={{ textAlign:"right" }}>
                          <p style={{ fontSize:"15px", color:OLIVE, margin:"0 0 4px" }}>${reg.grand_total}</p>
                          <StatusBadge status={reg.payment_status}/>
                        </div>
                      </div>
                    </div>
                  ))
                }
              </SectionCard>
            </div>
          )}

        </div>
      </div>

      {/* ── Footer — compact one-liner ── */}
      <div className="portal-footer" style={{ borderTop:`1px solid ${CREAM_DARK}`, background:"#fff", padding:"8px 20px", textAlign:"center" }}>
        <span style={{ fontSize:"11px", color:TEXT_LIGHT, fontFamily:"Georgia,serif" }}>Wild Child Nosara · Nosara, Costa Rica</span>
      </div>

      {/* Change request modal */}
      {showChangeModal && session && (
        <ChangeRequestModal
          reg={showChangeModal}
          session={session}
          onClose={()=>setShowChangeModal(null)}
          onSubmitted={()=>{}}
        />
      )}
    </div>
  );
}
