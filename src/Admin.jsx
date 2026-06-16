// Admin.jsx — Wild Child Nosara
// Tabs: By Week | Calendar | Saturdays | Change Requests | Kids

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "./assets/logo1.svg";
import { supabase } from "./supabase";

const OLIVE_DARK = "#4d5a2c";
const OLIVE      = "#6b7a3f";
const NAVY       = "#0f1f5c";
const ORANGE     = "#c4682a";
const CREAM      = "#f5f0e8";
const CREAM_DARK = "#e0d8c8";
const GREEN      = "#5a7a3a";
const TEAL       = "#427889";

function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
function formatWeekLabel(monday) {
  return monday.toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" });
}
function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday:"short", month:"short", day:"numeric" });
}
function formatSaturdayDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric", year:"numeric" });
}
function isThisWeek(monday) {
  return monday.toDateString() === getMonday(new Date()).toDateString();
}
function isPastWeek(monday) {
  return monday < getMonday(new Date());
}
function groupByWeek(registrations) {
  const weeks = {};
  registrations.forEach((reg) => {
    if (!reg.selected_days || reg.selected_days.length === 0) return;
    reg.selected_days.forEach((day) => {
      const monday = getMonday(new Date(day + "T00:00:00"));
      const key = monday.toISOString();
      if (!weeks[key]) weeks[key] = { monday, registrations: [] };
      if (!weeks[key].registrations.find((r) => r.id === reg.id)) weeks[key].registrations.push(reg);
    });
  });
  return Object.values(weeks).sort((a, b) => a.monday - b.monday);
}
function getDaysInMonth(year, month) { return new Date(year, month + 1, 0).getDate(); }
function getFirstDayOfMonth(year, month) { return new Date(year, month, 1).getDay(); }
function calcAge(dob) {
  if (!dob) return "—";
  const birth = new Date(dob + "T00:00:00");
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

const TIER_LABELS = {
  harmony:   { label:"Harmony Member",       color:GREEN  },
  wildchild: { label:"Wild Child Family",    color:OLIVE  },
  local:     { label:"Costa Rican Family",   color:TEAL   },
  general:   { label:"Open to All",          color:NAVY   },
};

const S = {
  page: { minHeight:"100vh", background:CREAM, fontFamily:"'Georgia', serif" },
  header: { background:OLIVE_DARK, height:72, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 20px", position:"sticky", top:0, zIndex:100 },
  headerBtn: { background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.25)", borderRadius:8, padding:"8px 14px", color:"#fff", fontSize:12, fontFamily:"'Georgia', serif", cursor:"pointer" },
  tabBar: { background:NAVY, display:"flex", padding:"0 20px", gap:4, flexWrap:"wrap" },
  tab: (active) => ({ padding:"12px 16px", color:active?"#fff":"rgba(255,255,255,0.55)", background:active?"rgba(255,255,255,0.12)":"transparent", border:"none", borderBottom:active?`2px solid ${ORANGE}`:"2px solid transparent", cursor:"pointer", fontFamily:"'Georgia', serif", fontSize:13, letterSpacing:"0.03em", whiteSpace:"nowrap" }),
  card: { background:"#fff", borderRadius:12, border:`1px solid ${CREAM_DARK}`, marginBottom:12, overflow:"hidden" },
  weekHeader: (isCurrent, isPast) => ({ background:isCurrent?OLIVE:isPast?"#888":NAVY, borderRadius:10, padding:"12px 18px", display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer", marginBottom:8 }),
  regRow: { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 18px", borderBottom:`1px solid ${CREAM_DARK}`, cursor:"pointer" },
  badge: (color) => ({ background:color, color:"#fff", borderRadius:20, padding:"2px 10px", fontSize:11 }),
  modal: { position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:16 },
  modalCard: { background:"#fff", borderRadius:16, padding:28, maxWidth:500, width:"100%", maxHeight:"85vh", overflowY:"auto" },
  modalLabel: { fontSize:11, letterSpacing:"0.12em", textTransform:"uppercase", color:OLIVE, marginBottom:4 },
  modalValue: { fontSize:15, marginBottom:16, color:"#2a2a2a" },
  satCard: (u) => ({ background:"#fff", borderRadius:12, border:`2px solid ${u?TEAL:CREAM_DARK}`, marginBottom:16, overflow:"hidden" }),
  satHeader: (u) => ({ background:u?`${TEAL}15`:"#f8f8f8", padding:"14px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:`1px solid ${u?TEAL+"30":CREAM_DARK}` }),
};

function WeekRow({ week, onSelectReg }) {
  const isCurrent = isThisWeek(week.monday);
  const isPast = isPastWeek(week.monday);
  const [open, setOpen] = useState(isCurrent);
  return (
    <div style={{ marginBottom:16 }}>
      <div style={S.weekHeader(isCurrent, isPast)} onClick={() => setOpen(!open)}>
        <div>
          <span style={{ color:"#fff", fontSize:15 }}>Week of {formatWeekLabel(week.monday)}</span>
          {isCurrent && <span style={{ marginLeft:10, background:ORANGE, color:"#fff", borderRadius:10, padding:"2px 8px", fontSize:11 }}>This Week</span>}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ color:"rgba(255,255,255,0.7)", fontSize:13 }}>{week.registrations.length} enrolled</span>
          <span style={{ color:"#fff", fontSize:12 }}>{open?"▲":"▼"}</span>
        </div>
      </div>
      {open && (
        <div style={S.card}>
          {week.registrations.map((reg) => (
            <div key={reg.id} style={S.regRow} onClick={() => onSelectReg(reg)}>
              <div>
                <div style={{ fontWeight:"bold", fontSize:14 }}>{reg.child_first_name} {reg.child_last_name}</div>
                <div style={{ fontSize:12, color:"#888", marginTop:2 }}>{reg.program_name} · {reg.parent_name}</div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                {reg.lunch && <span style={S.badge(GREEN)}>Lunch</span>}
                <span style={S.badge(reg.payment_status==="paid"?GREEN:ORANGE)}>{reg.payment_status||"pending"}</span>
                <span style={{ color:"#ccc" }}>›</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RegModal({ reg, onClose }) {
  const [installments, setInstallments] = useState([]);

  useEffect(() => {
    if (reg.payment_plan && reg.payment_plan !== "full") {
      supabase.from("payment_installments")
        .select("*")
        .eq("registration_id", reg.id)
        .order("due_date", { ascending: true })
        .then(({ data }) => setInstallments(data || []));
    }
  }, [reg.id]);

  const statusColor = (s) => s === "paid" ? GREEN : s === "failed" ? "#c00" : ORANGE;

  return (
    <div style={S.modal} onClick={onClose}>
      <div style={S.modalCard} onClick={e => e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <h3 style={{ margin:0, color:OLIVE_DARK, fontSize:18 }}>Enrollment Details</h3>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:24, cursor:"pointer", color:"#999" }}>×</button>
        </div>
        <div style={S.modalLabel}>Child</div><div style={S.modalValue}>{reg.child_first_name} {reg.child_last_name}</div>
        <div style={S.modalLabel}>Program</div><div style={S.modalValue}>{reg.program_name}</div>
        <div style={S.modalLabel}>Parent</div><div style={S.modalValue}>{reg.parent_name}<br/><span style={{ fontSize:13, color:"#888" }}>{reg.parent_email} · {reg.parent_phone}</span></div>
        <div style={S.modalLabel}>Selected Days</div><div style={S.modalValue}>{(reg.selected_days||[]).map(formatDate).join(", ")}</div>
        <div style={S.modalLabel}>Lunch</div><div style={S.modalValue}>{reg.lunch?"Yes":"No"}</div>
        <div style={S.modalLabel}>Total</div><div style={S.modalValue}>${reg.grand_total}</div>
        <div style={S.modalLabel}>Payment Status</div>
        <div style={{ marginBottom:16 }}><span style={{ ...S.badge(reg.payment_status==="paid"?GREEN:ORANGE), fontSize:13 }}>{reg.payment_status||"pending"}</span></div>
        {reg.discount_code && <><div style={S.modalLabel}>Discount</div><div style={S.modalValue}>{reg.discount_code} ({reg.discount_pct}% off)</div></>}
        {reg.payment_plan && reg.payment_plan!=="full" && (
          <>
            <div style={S.modalLabel}>Payment Plan</div>
            <div style={S.modalValue}>{reg.payment_plan === "biweekly" ? "Bi-Weekly" : "Monthly"}</div>
            {installments.length > 0 && (
              <>
                <div style={S.modalLabel}>Installment Schedule</div>
                <div style={{ marginBottom:16 }}>
                  {/* First installment — charged at enrollment */}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 10px", borderRadius:6, background:"#f0f4e8", marginBottom:4 }}>
                    <div>
                      <span style={{ fontSize:13, color:OLIVE_DARK, fontWeight:"bold" }}>Instalment 1</span>
                      <span style={{ fontSize:11, color:"#888", marginLeft:8 }}>Charged at enrollment</span>
                    </div>
                    <span style={{ ...S.badge(GREEN), fontSize:11 }}>paid</span>
                  </div>
                  {installments.map((inst, i) => (
                    <div key={inst.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 10px", borderRadius:6, background: inst.status==="paid"?"#f0f4e8": inst.status==="failed"?"#fff0f0":"#fafafa", marginBottom:4, border:`1px solid ${inst.status==="failed"?"#fca5a5":CREAM_DARK}` }}>
                      <div>
                        <span style={{ fontSize:13, color:OLIVE_DARK, fontWeight:"bold" }}>Instalment {i+2}</span>
                        <span style={{ fontSize:11, color:"#888", marginLeft:8 }}>
                          {new Date(inst.due_date + "T00:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}
                        </span>
                        {inst.error_message && <div style={{ fontSize:11, color:"#c00", marginTop:2 }}>{inst.error_message}</div>}
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:13, fontWeight:"bold", color:OLIVE_DARK, marginBottom:3 }}>${inst.amount}</div>
                        <span style={{ ...S.badge(statusColor(inst.status)), fontSize:11 }}>{inst.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
        <div style={S.modalLabel}>Registered</div><div style={S.modalValue}>{new Date(reg.created_at).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}</div>
      </div>
    </div>
  );
}

function HarmonyModal({ booking, onClose }) {
  const tierInfo = TIER_LABELS[booking.tier] || { label:booking.tier, color:NAVY };
  const kids = Array.isArray(booking.children) ? booking.children : [];
  return (
    <div style={S.modal} onClick={onClose}>
      <div style={S.modalCard} onClick={e => e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <h3 style={{ margin:0, color:TEAL, fontSize:18 }}>🌿 Saturday Booking</h3>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:24, cursor:"pointer", color:"#999" }}>×</button>
        </div>
        <div style={S.modalLabel}>Date</div><div style={S.modalValue}>{formatSaturdayDate(booking.session_date)} · 8–11am</div>
        <div style={S.modalLabel}>Children</div><div style={S.modalValue}>{kids.map((c,i)=><div key={i}>{c.name}{c.age?`, age ${c.age}`:""}</div>)}</div>
        <div style={S.modalLabel}>Parent</div><div style={S.modalValue}>{booking.parent_name}<br/><span style={{ fontSize:13, color:"#888" }}>{booking.parent_email} · {booking.parent_phone}</span></div>
        <div style={S.modalLabel}>Tier</div><div style={{ marginBottom:16 }}><span style={{ ...S.badge(tierInfo.color), fontSize:13 }}>{tierInfo.label}</span></div>
        <div style={S.modalLabel}>Amount</div><div style={S.modalValue}>{booking.price_paid===0?"Free":`$${booking.price_paid}`}</div>
        <div style={S.modalLabel}>Payment Status</div><div style={{ marginBottom:16 }}><span style={{ ...S.badge(booking.payment_status==="paid"||booking.payment_status==="free"?GREEN:ORANGE), fontSize:13 }}>{booking.payment_status}</span></div>
        {booking.member_code && <><div style={S.modalLabel}>Code Used</div><div style={S.modalValue}>{booking.member_code}</div></>}
        <div style={S.modalLabel}>Waiver Signed</div><div style={S.modalValue}>{booking.waiver_signature||"—"}</div>
        <div style={S.modalLabel}>Booked</div><div style={S.modalValue}>{new Date(booking.created_at).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}</div>
      </div>
    </div>
  );
}

// ── Kids detail modal ─────────────────────────────────────────────────────────
function KidModal({ child, onClose }) {
  const age = calcAge(child.dob);
  const dob = child.dob ? new Date(child.dob + "T00:00:00").toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"}) : "—";
  return (
    <div style={S.modal} onClick={onClose}>
      <div style={S.modalCard} onClick={e => e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <h3 style={{ margin:0, color:OLIVE_DARK, fontSize:18 }}>{child.first_name} {child.last_name}</h3>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:24, cursor:"pointer", color:"#999" }}>×</button>
        </div>
        <div style={S.modalLabel}>Program</div>
        <div style={S.modalValue}>{child.program_name || "—"}</div>
        <div style={S.modalLabel}>Date of Birth</div>
        <div style={S.modalValue}>{dob} {age !== "—" ? `(age ${age})` : ""}</div>
        <div style={S.modalLabel}>Total Weeks Enrolled</div>
        <div style={S.modalValue}>{child.total_weeks_enrolled || 0} week{child.total_weeks_enrolled !== 1 ? "s" : ""}</div>
        <div style={S.modalLabel}>Allergies</div>
        <div style={S.modalValue}>{child.allergies || "None"}</div>
        <div style={S.modalLabel}>Medical Notes</div>
        <div style={S.modalValue}>{child.medical_notes || "—"}</div>
        <div style={S.modalLabel}>Parent</div>
        <div style={S.modalValue}>{child.parent_name || "—"}<br/><span style={{ fontSize:13, color:"#888" }}>{child.parent_email || ""}</span></div>
        <div style={S.modalLabel}>Enrolled Since</div>
        <div style={S.modalValue}>{child.created_at ? new Date(child.created_at).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"}) : "—"}</div>
      </div>
    </div>
  );
}

export default function Admin() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("week");
  const [registrations, setRegistrations] = useState([]);
  const [harmonyBookings, setHarmonyBookings] = useState([]);
  const [changeRequests, setChangeRequests] = useState([]);
  const [allChildren, setAllChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReg, setSelectedReg] = useState(null);
  const [selectedHarmony, setSelectedHarmony] = useState(null);
  const [selectedKid, setSelectedKid] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [calMonth, setCalMonth] = useState(new Date());
  const [calSelectedDay, setCalSelectedDay] = useState(null);
  const [saturdayFilter, setSaturdayFilter] = useState("upcoming");
  const [crFilter, setCrFilter] = useState("pending");
  const [approvingId, setApprovingId] = useState(null);
  const [kidSearch, setKidSearch] = useState("");
  const [kidSort, setKidSort] = useState("name");
  const [familySearch, setFamilySearch] = useState("");
  const [expandedFamily, setExpandedFamily] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { navigate("/login"); return; }
      const { data:staff } = await supabase.from("staff").select("id").eq("id", session.user.id).maybeSingle();
      if (!staff) { navigate("/login"); return; }
    });
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const [regRes, harmonyRes, crRes, childrenRes] = await Promise.all([
      supabase.from("registrations").select("*").order("created_at", { ascending:false }),
      supabase.from("harmony_bookings").select("*").order("session_date", { ascending:true }),
      supabase.from("enrollment_change_requests").select("*").order("created_at", { ascending:false }),
      supabase.from("children").select("*, parent_profiles(full_name, email)").order("first_name", { ascending:true }),
    ]);
    setRegistrations(regRes.data || []);
    setHarmonyBookings(harmonyRes.data || []);
    setChangeRequests(crRes.data || []);

    // Start with children table rows (account holders)
    const fromChildren = (childrenRes.data || []).map(c => ({
      ...c,
      parent_name:  c.parent_profiles?.full_name || "—",
      parent_email: c.parent_profiles?.email || "",
      source: "children",
    }));

    // Build a dedup key set from children table
    const childKeys = new Set(fromChildren.map(c =>
      `${c.first_name?.toLowerCase()}|${c.last_name?.toLowerCase()}`
    ));

    // Pull guest enrollments from registrations (no parent_user_id = guest)
    // Also catch account holders whose children row may not exist yet
    const regs = regRes.data || [];
    const fromRegs = [];
    const seenFromRegs = new Set();

    regs.forEach(r => {
      const key = `${r.child_first_name?.toLowerCase()}|${r.child_last_name?.toLowerCase()}`;
      if (childKeys.has(key)) return;        // already in children table
      if (seenFromRegs.has(key)) return;     // already added from another registration
      seenFromRegs.add(key);
      // Sum weeks across all registrations for this child name
      const totalWeeks = regs
        .filter(x =>
          x.child_first_name?.toLowerCase() === r.child_first_name?.toLowerCase() &&
          x.child_last_name?.toLowerCase()  === r.child_last_name?.toLowerCase()
        )
        .reduce((sum, x) => sum + (x.weeks_total || 0), 0);
      fromRegs.push({
        id:                   r.id,
        first_name:           r.child_first_name,
        last_name:            r.child_last_name,
        dob:                  r.child_dob || null,
        allergies:            r.child_allergies || null,
        medical_notes:        r.child_medical_notes || null,
        program_id:           r.program_id,
        program_name:         r.program_name,
        total_weeks_enrolled: totalWeeks,
        created_at:           r.created_at,
        parent_name:          r.parent_name || "—",
        parent_email:         r.parent_email || "",
        source:               "registrations",
      });
    });

    const merged = [...fromChildren, ...fromRegs]
      .sort((a, b) => `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`));

    setAllChildren(merged);
    setLoading(false);
  }

  async function approveRequest(req) {
    setApprovingId(req.id);
    try {
      await supabase.from("enrollment_change_requests").update({ status:"approved" }).eq("id", req.id);
      const { data:profile } = await supabase.from("parent_profiles").select("account_credit").eq("id", req.parent_user_id).maybeSingle();
      const currentCredit = profile?.account_credit || 0;
      await supabase.from("parent_profiles").update({ account_credit: currentCredit + req.credit_value }).eq("id", req.parent_user_id);
      await fetchData();
    } catch(e) {
      alert("Error approving request: " + e.message);
    } finally {
      setApprovingId(null);
    }
  }

  async function declineRequest(req) {
    if (!window.confirm("Decline this request?")) return;
    await supabase.from("enrollment_change_requests").update({ status:"declined" }).eq("id", req.id);
    await fetchData();
  }

  const signOut = async () => { await supabase.auth.signOut(); navigate("/login"); };

  const weeks = groupByWeek(registrations);
  const currentWeeks = weeks.filter(w => !isPastWeek(w.monday));
  const pastWeeks = weeks.filter(w => isPastWeek(w.monday));

  const calYear = calMonth.getFullYear();
  const calMonthIdx = calMonth.getMonth();
  const daysInMonth = getDaysInMonth(calYear, calMonthIdx);
  const firstDay = getFirstDayOfMonth(calYear, calMonthIdx);

  function getRegsForDay(day) {
    const dateStr = `${calYear}-${String(calMonthIdx+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    return registrations.filter(r => r.selected_days && r.selected_days.includes(dateStr));
  }
  function getHarmonyForDay(day) {
    const dateStr = `${calYear}-${String(calMonthIdx+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    return harmonyBookings.filter(b => b.session_date === dateStr);
  }

  const today = new Date(); today.setHours(0,0,0,0);
  const groupedSaturdays = harmonyBookings.reduce((acc,b) => { if(!acc[b.session_date]) acc[b.session_date]=[]; acc[b.session_date].push(b); return acc; }, {});
  const filteredSaturdayDates = Object.keys(groupedSaturdays).sort().filter(ds => {
    const d = new Date(ds+"T00:00:00");
    if (saturdayFilter==="upcoming") return d >= today;
    if (saturdayFilter==="past") return d < today;
    return true;
  });

  const pendingCRs = changeRequests.filter(r => r.status === "pending").length;
  const filteredCRs = changeRequests.filter(r => crFilter === "all" ? true : r.status === crFilter);

  // ── Families grouping ────────────────────────────────────────────────────────
  const families = (() => {
    // Group by last name. Use parent_profiles data from registrations as source of truth.
    const map = {};
    // From registrations — covers guests + account holders
    registrations.forEach(r => {
      const lastName = r.child_last_name?.trim() || "Unknown";
      const key = lastName.toLowerCase();
      if (!map[key]) {
        map[key] = {
          lastName,
          parents: {},   // keyed by email to dedup
          children: [],
          childKeys: new Set(),
        };
      }
      // Parent info
      if (r.parent_email) {
        map[key].parents[r.parent_email.toLowerCase()] = {
          name:  r.parent_name  || "—",
          email: r.parent_email || "—",
          phone: r.parent_phone || "—",
        };
      }
      // Child dedup by first+last
      const ck = `${r.child_first_name?.toLowerCase()}|${r.child_last_name?.toLowerCase()}`;
      if (!map[key].childKeys.has(ck)) {
        map[key].childKeys.add(ck);
        map[key].children.push({
          firstName:   r.child_first_name,
          lastName:    r.child_last_name,
          dob:         r.child_dob,
          program:     r.program_name,
          allergies:   r.child_allergies,
          medicalNotes:r.child_medical_notes,
        });
      }
    });
    // Also pull from children table (account holders) for any missing info
    allChildren.forEach(ch => {
      const lastName = ch.last_name?.trim() || "Unknown";
      const key = lastName.toLowerCase();
      if (!map[key]) {
        map[key] = { lastName, parents: {}, children: [], childKeys: new Set() };
      }
      if (ch.parent_email) {
        map[key].parents[ch.parent_email.toLowerCase()] = {
          name:  ch.parent_name  || "—",
          email: ch.parent_email || "—",
          phone: "—",  // children table doesn't store phone
        };
      }
      const ck = `${ch.first_name?.toLowerCase()}|${ch.last_name?.toLowerCase()}`;
      if (!map[key].childKeys.has(ck)) {
        map[key].childKeys.add(ck);
        map[key].children.push({
          firstName:    ch.first_name,
          lastName:     ch.last_name,
          dob:          ch.dob,
          program:      ch.program_name,
          allergies:    ch.allergies,
          medicalNotes: ch.medical_notes,
        });
      }
    });
    return Object.values(map)
      .map(f => ({ ...f, parents: Object.values(f.parents) }))
      .sort((a, b) => a.lastName.localeCompare(b.lastName))
      .filter(f => !familySearch.trim() || f.lastName.toLowerCase().includes(familySearch.toLowerCase()) ||
        f.parents.some(p => p.name.toLowerCase().includes(familySearch.toLowerCase()))
      );
  })();

  // ── Kids filtering + sorting ──────────────────────────────────────────────
  const filteredKids = allChildren
    .filter(c => {
      if (!kidSearch.trim()) return true;
      const q = kidSearch.toLowerCase();
      return (
        `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) ||
        (c.program_name || "").toLowerCase().includes(q) ||
        (c.parent_name || "").toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (kidSort === "name")    return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
      if (kidSort === "age")     return (a.dob || "").localeCompare(b.dob || "");
      if (kidSort === "program") return (a.program_name || "").localeCompare(b.program_name || "");
      if (kidSort === "weeks")   return (b.total_weeks_enrolled || 0) - (a.total_weeks_enrolled || 0);
      return 0;
    });

  return (
    <div style={S.page}>
      <div style={S.header}>
        <button style={S.headerBtn} onClick={() => navigate("/schedule")}>📅 Schedule</button>
        <div style={{ position:"absolute", left:"50%", transform:"translateX(-50%)" }}>
          <img src={logo} alt="Wild Child Nosara" style={{ height:160, objectFit:"contain" }} />
        </div>
        <button style={S.headerBtn} onClick={signOut}>Sign Out</button>
      </div>

      <div style={S.tabBar}>
        <button style={S.tab(tab==="week")} onClick={() => setTab("week")}>By Week</button>
        <button style={S.tab(tab==="calendar")} onClick={() => setTab("calendar")}>Calendar</button>
        <button style={S.tab(tab==="saturdays")} onClick={() => setTab("saturdays")}>
          🌿 Saturdays{harmonyBookings.length>0&&<span style={{ background:TEAL, color:"#fff", borderRadius:10, padding:"1px 7px", fontSize:11, marginLeft:6 }}>{harmonyBookings.length}</span>}
        </button>
        <button style={S.tab(tab==="changes")} onClick={() => setTab("changes")}>
          Change Requests{pendingCRs>0&&<span style={{ background:ORANGE, color:"#fff", borderRadius:10, padding:"1px 7px", fontSize:11, marginLeft:6 }}>{pendingCRs}</span>}
        </button>
        <button style={S.tab(tab==="kids")} onClick={() => setTab("kids")}>
          🧒 Kids{allChildren.length>0&&<span style={{ background:OLIVE, color:"#fff", borderRadius:10, padding:"1px 7px", fontSize:11, marginLeft:6 }}>{allChildren.length}</span>}
        </button>
        <button style={S.tab(tab==="families")} onClick={() => setTab("families")}>
          🏠 Families
        </button>
        <button style={S.tab(tab==="menu")} onClick={() => setTab("menu")}>
          🍽️ Menu
        </button>

      </div>

      {loading ? (
        <div style={{ textAlign:"center", padding:60, color:"#888", fontSize:15 }}>Loading…</div>
      ) : (
        <div style={{ maxWidth:900, margin:"0 auto", padding:"24px 16px" }}>

          {/* BY WEEK */}
          {tab==="week" && (
            <>
              {currentWeeks.length===0 && <div style={{ textAlign:"center", padding:40, color:"#888" }}>No upcoming enrollments.</div>}
              {currentWeeks.map(week => <WeekRow key={week.monday.toISOString()} week={week} onSelectReg={setSelectedReg} />)}
              <div style={{ textAlign:"center", margin:"24px 0" }}>
                <button onClick={() => setShowHistory(!showHistory)} style={{ background:"none", border:`1px solid ${CREAM_DARK}`, borderRadius:8, padding:"10px 20px", color:"#888", cursor:"pointer", fontFamily:"'Georgia', serif", fontSize:13 }}>
                  {showHistory?"Hide":"Show"} registration history ({pastWeeks.length} past weeks)
                </button>
              </div>
              {showHistory && pastWeeks.map(week => <WeekRow key={week.monday.toISOString()} week={week} onSelectReg={setSelectedReg} />)}
            </>
          )}

          {/* CALENDAR */}
          {tab==="calendar" && (
            <>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
                <button onClick={() => setCalMonth(new Date(calYear,calMonthIdx-1,1))} style={{ background:"none", border:`1px solid ${CREAM_DARK}`, borderRadius:8, padding:"8px 14px", cursor:"pointer", fontFamily:"'Georgia',serif" }}>← Prev</button>
                <span style={{ fontSize:17, color:OLIVE_DARK }}>{calMonth.toLocaleDateString("en-US",{month:"long",year:"numeric"})}</span>
                <button onClick={() => setCalMonth(new Date(calYear,calMonthIdx+1,1))} style={{ background:"none", border:`1px solid ${CREAM_DARK}`, borderRadius:8, padding:"8px 14px", cursor:"pointer", fontFamily:"'Georgia',serif" }}>Next →</button>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4, marginBottom:16 }}>
                {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=><div key={d} style={{ textAlign:"center", fontSize:11, color:"#999", padding:"4px 0" }}>{d}</div>)}
                {Array(firstDay).fill(null).map((_,i)=><div key={`e${i}`}/>)}
                {Array.from({length:daysInMonth},(_,i)=>i+1).map(day => {
                  const regs=getRegsForDay(day); const harmony=getHarmonyForDay(day);
                  const isToday=new Date().getDate()===day&&new Date().getMonth()===calMonthIdx&&new Date().getFullYear()===calYear;
                  const isSelected=calSelectedDay===day;
                  const isSat=new Date(calYear,calMonthIdx,day).getDay()===6;
                  return (
                    <div key={day} onClick={()=>setCalSelectedDay(calSelectedDay===day?null:day)}
                      style={{ borderRadius:8, padding:"6px 4px", textAlign:"center", cursor:"pointer", border:isToday?`2px solid ${ORANGE}`:isSelected?`2px solid ${OLIVE}`:`1px solid ${CREAM_DARK}`, background:isSelected?`${OLIVE}10`:isSat?`${TEAL}08`:"#fff", minHeight:52 }}>
                      <div style={{ fontSize:13, fontWeight:isToday?"bold":"normal", color:isToday?ORANGE:"#333", marginBottom:3 }}>{day}</div>
                      {regs.length>0&&<div style={{ background:OLIVE, color:"#fff", borderRadius:10, fontSize:10, padding:"1px 5px", marginBottom:2 }}>{regs.length}</div>}
                      {harmony.length>0&&<div style={{ background:TEAL, color:"#fff", borderRadius:10, fontSize:10, padding:"1px 5px" }}>🌿{harmony.length}</div>}
                    </div>
                  );
                })}
              </div>
              {calSelectedDay&&(()=>{
                const regs=getRegsForDay(calSelectedDay); const harmony=getHarmonyForDay(calSelectedDay);
                return (
                  <div style={S.card}>
                    <div style={{ padding:"14px 18px", borderBottom:`1px solid ${CREAM_DARK}`, fontWeight:"bold", color:OLIVE_DARK }}>
                      {new Date(calYear,calMonthIdx,calSelectedDay).toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}
                    </div>
                    {regs.length===0&&harmony.length===0&&<div style={{ padding:"20px 18px", color:"#888", fontSize:14 }}>No enrollments this day.</div>}
                    {regs.map(reg=>(
                      <div key={reg.id} style={S.regRow} onClick={()=>setSelectedReg(reg)}>
                        <div><div style={{ fontWeight:"bold", fontSize:14 }}>{reg.child_first_name} {reg.child_last_name}</div><div style={{ fontSize:12, color:"#888" }}>{reg.program_name} · {reg.parent_name}</div></div>
                        <span style={{ color:"#ccc" }}>›</span>
                      </div>
                    ))}
                    {harmony.map(b=>(
                      <div key={b.id} style={{ ...S.regRow, background:`${TEAL}08` }} onClick={()=>setSelectedHarmony(b)}>
                        <div><div style={{ fontWeight:"bold", fontSize:14, color:TEAL }}>🌿 {Array.isArray(b.children)?b.children.map(c=>c.name).join(", "):"—"}</div><div style={{ fontSize:12, color:"#888" }}>Harmony Co-Op · {b.parent_name}</div></div>
                        <span style={{ color:"#ccc" }}>›</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </>
          )}

          {/* SATURDAYS */}
          {tab==="saturdays" && (
            <>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
                <h2 style={{ margin:0, color:TEAL, fontSize:20, fontWeight:"normal" }}>🌿 Harmony Co-Op Saturdays</h2>
                <div style={{ display:"flex", gap:6 }}>
                  {["upcoming","past","all"].map(f=>(
                    <button key={f} onClick={()=>setSaturdayFilter(f)} style={{ padding:"6px 14px", borderRadius:20, border:`1px solid ${saturdayFilter===f?TEAL:CREAM_DARK}`, background:saturdayFilter===f?TEAL:"#fff", color:saturdayFilter===f?"#fff":"#666", cursor:"pointer", fontFamily:"'Georgia',serif", fontSize:12, textTransform:"capitalize" }}>{f}</button>
                  ))}
                </div>
              </div>
              {filteredSaturdayDates.length===0&&<div style={{ textAlign:"center", padding:60, color:"#888" }}>No {saturdayFilter==="all"?"":""+saturdayFilter+" "}Saturday bookings yet.</div>}
              {filteredSaturdayDates.map(dateStr=>{
                const bookings=groupedSaturdays[dateStr];
                const d=new Date(dateStr+"T00:00:00"); const isUpcoming=d>=today;
                const totalRevenue=bookings.reduce((sum,b)=>sum+(b.price_paid||0),0);
                const tierCounts=bookings.reduce((acc,b)=>{acc[b.tier]=(acc[b.tier]||0)+1;return acc;},{});
                return (
                  <div key={dateStr} style={S.satCard(isUpcoming)}>
                    <div style={S.satHeader(isUpcoming)}>
                      <div>
                        <div style={{ fontWeight:"bold", fontSize:16, color:isUpcoming?TEAL:"#666" }}>{formatSaturdayDate(dateStr)}</div>
                        <div style={{ fontSize:12, color:"#888", marginTop:2 }}>8:00 – 11:00 am · Harmony Co-Op Playground</div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontWeight:"bold", color:OLIVE_DARK, fontSize:16 }}>{bookings.length} booking{bookings.length!==1?"s":""}</div>
                        <div style={{ fontSize:12, color:"#888" }}>${totalRevenue} collected</div>
                      </div>
                    </div>
                    <div style={{ padding:"10px 20px", borderBottom:`1px solid ${CREAM_DARK}`, display:"flex", gap:10, flexWrap:"wrap" }}>
                      {Object.entries(tierCounts).map(([tier,count])=>{
                        const info=TIER_LABELS[tier]||{label:tier,color:NAVY};
                        return <span key={tier} style={{ ...S.badge(info.color), fontSize:12, padding:"3px 10px" }}>{info.label}: {count}</span>;
                      })}
                    </div>
                    {bookings.map(b=>{
                      const kids=Array.isArray(b.children)?b.children:[];
                      const tierInfo=TIER_LABELS[b.tier]||{label:b.tier,color:NAVY};
                      return (
                        <div key={b.id} style={S.regRow} onClick={()=>setSelectedHarmony(b)}>
                          <div><div style={{ fontWeight:"bold", fontSize:14 }}>{kids.map(c=>c.name).join(", ")||"—"}</div><div style={{ fontSize:12, color:"#888", marginTop:2 }}>{b.parent_name} · {b.parent_email}</div></div>
                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                            <span style={S.badge(tierInfo.color)}>{tierInfo.label}</span>
                            <span style={{ fontSize:13, color:OLIVE_DARK, fontWeight:"bold" }}>{b.price_paid===0?"Free":`$${b.price_paid}`}</span>
                            <span style={{ color:"#ccc" }}>›</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </>
          )}

          {/* CHANGE REQUESTS */}
          {tab==="changes" && (
            <>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
                <h2 style={{ margin:0, color:OLIVE_DARK, fontSize:20, fontWeight:"normal" }}>Enrollment Change Requests</h2>
                <div style={{ display:"flex", gap:6 }}>
                  {["pending","approved","declined","all"].map(f=>(
                    <button key={f} onClick={()=>setCrFilter(f)} style={{ padding:"6px 14px", borderRadius:20, border:`1px solid ${crFilter===f?OLIVE_DARK:CREAM_DARK}`, background:crFilter===f?OLIVE_DARK:"#fff", color:crFilter===f?"#fff":"#666", cursor:"pointer", fontFamily:"'Georgia',serif", fontSize:12, textTransform:"capitalize" }}>{f}</button>
                  ))}
                </div>
              </div>

              {filteredCRs.length===0&&<div style={{ textAlign:"center", padding:60, color:"#888" }}>No {crFilter==="all"?"":crFilter+" "}requests.</div>}

              {filteredCRs.map(req=>{
                const weeks=Array.isArray(req.weeks_to_cancel)?req.weeks_to_cancel:[];
                const isPending=req.status==="pending";
                const isApproved=req.status==="approved";
                return (
                  <div key={req.id} style={{ background:"#fff", borderRadius:12, border:`2px solid ${isPending?ORANGE:isApproved?GREEN:CREAM_DARK}`, marginBottom:16, overflow:"hidden" }}>
                    <div style={{ background:isPending?`${ORANGE}10`:isApproved?`${GREEN}10`:"#f8f8f8", padding:"14px 20px", borderBottom:`1px solid ${isPending?ORANGE+"30":isApproved?GREEN+"30":CREAM_DARK}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                      <div>
                        <div style={{ fontWeight:"bold", fontSize:16, color:OLIVE_DARK }}>{req.child_name}</div>
                        <div style={{ fontSize:12, color:"#888", marginTop:2 }}>Requested {new Date(req.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</div>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <span style={{ fontWeight:"bold", color:isApproved?GREEN:OLIVE_DARK, fontSize:16 }}>${req.credit_value} credit</span>
                        <span style={{ ...S.badge(isPending?ORANGE:isApproved?GREEN:"#888"), fontSize:12 }}>{req.status}</span>
                      </div>
                    </div>
                    <div style={{ padding:"16px 20px" }}>
                      <div style={{ fontSize:11, letterSpacing:"0.1em", textTransform:"uppercase", color:"#999", marginBottom:8 }}>Weeks to cancel</div>
                      {weeks.map((w,i)=>(
                        <div key={i} style={{ fontSize:14, color:"#444", marginBottom:4 }}>
                          · Week of {w.weekOf} ({w.days?.length||0} day{w.days?.length!==1?"s":""})
                        </div>
                      ))}
                      {req.parent_note && (
                        <div style={{ marginTop:12, padding:"10px 14px", background:`${CREAM_DARK}50`, borderRadius:8, fontSize:13, color:"#555", fontStyle:"italic" }}>
                          "{req.parent_note}"
                        </div>
                      )}
                      {isPending && (
                        <div style={{ display:"flex", gap:10, marginTop:16 }}>
                          <button onClick={()=>approveRequest(req)} disabled={approvingId===req.id}
                            style={{ flex:1, padding:"11px", background:approvingId===req.id?"#ccc":GREEN, color:"#fff", border:"none", borderRadius:8, cursor:"pointer", fontFamily:"'Georgia',serif", fontSize:14 }}>
                            {approvingId===req.id?"Approving…":`✓ Approve · Add $${req.credit_value} credit`}
                          </button>
                          <button onClick={()=>declineRequest(req)}
                            style={{ padding:"11px 18px", background:"none", border:`1px solid #f87171`, color:"#b91c1c", borderRadius:8, cursor:"pointer", fontFamily:"'Georgia',serif", fontSize:14 }}>
                            Decline
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* KIDS */}
          {tab==="kids" && (
            <>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20, flexWrap:"wrap", gap:12 }}>
                <h2 style={{ margin:0, color:OLIVE_DARK, fontSize:20, fontWeight:"normal" }}>
                  🧒 All Children
                  <span style={{ marginLeft:10, fontSize:14, color:"#888", fontWeight:"normal" }}>({filteredKids.length} of {allChildren.length})</span>
                </h2>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  <input
                    value={kidSearch}
                    onChange={e => setKidSearch(e.target.value)}
                    placeholder="Search name, program, parent…"
                    style={{ padding:"8px 12px", border:`1px solid ${CREAM_DARK}`, borderRadius:8, fontSize:13, fontFamily:"'Georgia',serif", width:220, outline:"none" }}
                  />
                  <select value={kidSort} onChange={e => setKidSort(e.target.value)}
                    style={{ padding:"8px 12px", border:`1px solid ${CREAM_DARK}`, borderRadius:8, fontSize:13, fontFamily:"'Georgia',serif", background:"#fff", cursor:"pointer", outline:"none" }}>
                    <option value="name">Sort: Name</option>
                    <option value="age">Sort: Age</option>
                    <option value="program">Sort: Program</option>
                    <option value="weeks">Sort: Weeks (most first)</option>
                  </select>
                </div>
              </div>

              {filteredKids.length === 0 && (
                <div style={{ textAlign:"center", padding:60, color:"#888" }}>No children found.</div>
              )}

              <div style={{ background:"#fff", borderRadius:12, border:`1px solid ${CREAM_DARK}`, overflow:"hidden" }}>
                {/* Table header */}
                <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1.5fr 0.7fr 2fr 2fr", gap:0, background:OLIVE_DARK, padding:"10px 16px" }}>
                  {["Name","Age","Program","Weeks","Allergies","Medical Notes"].map(h => (
                    <div key={h} style={{ fontSize:11, letterSpacing:"0.08em", textTransform:"uppercase", color:"rgba(255,255,255,0.8)", fontFamily:"'Georgia',serif" }}>{h}</div>
                  ))}
                </div>

                {filteredKids.map((child, idx) => {
                  const age = calcAge(child.dob);
                  const isLast = idx === filteredKids.length - 1;
                  return (
                    <div
                      key={child.id}
                      onClick={() => setSelectedKid(child)}
                      style={{
                        display:"grid", gridTemplateColumns:"2fr 1fr 1.5fr 0.7fr 2fr 2fr",
                        gap:0, padding:"12px 16px", cursor:"pointer",
                        alignItems:"start",
                        borderBottom: isLast ? "none" : `1px solid ${CREAM_DARK}`,
                        background: idx % 2 === 0 ? "#fff" : "#fdfcfa",
                        transition:"background 0.1s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "#f0f4e8"}
                      onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? "#fff" : "#fdfcfa"}
                    >
                      <div>
                        <div style={{ fontWeight:"bold", fontSize:14, color:OLIVE_DARK, wordBreak:"break-word" }}>{child.first_name} {child.last_name}</div>
                        <div style={{ fontSize:11, color:"#999", marginTop:2 }}>{child.parent_name}</div>
                      </div>
                      <div style={{ fontSize:14, color:"#444", paddingTop:2 }}>
                        {age !== "—" ? `${age} yrs` : "—"}
                      </div>
                      <div style={{ fontSize:13, color:"#555", paddingTop:2 }}>
                        {child.program_name || "—"}
                      </div>
                      <div style={{ fontSize:14, fontWeight:"bold", color:OLIVE, paddingTop:2 }}>
                        {child.total_weeks_enrolled || 0}
                      </div>
                      <div style={{ fontSize:12, color:"#666", paddingTop:2, paddingRight:8, wordBreak:"break-word" }}>
                        {child.allergies || <span style={{ color:"#bbb" }}>None</span>}
                      </div>
                      <div style={{ fontSize:12, color:"#666", paddingTop:2, wordBreak:"break-word" }}>
                        {child.medical_notes || <span style={{ color:"#bbb" }}>—</span>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary stats */}
              <div style={{ display:"flex", gap:16, marginTop:20, flexWrap:"wrap" }}>
                {["tiny-roots","little-roots","wild-roots","earth-leaders"].map(pid => {
                  const count = allChildren.filter(c => c.program_id === pid).length;
                  const label = { "tiny-roots":"Tiny Roots","little-roots":"Little Roots","wild-roots":"Wild Roots","earth-leaders":"Earth Leaders" }[pid];
                  if (count === 0) return null;
                  return (
                    <div key={pid} style={{ background:"#fff", border:`1px solid ${CREAM_DARK}`, borderRadius:10, padding:"12px 18px", textAlign:"center", minWidth:100 }}>
                      <div style={{ fontSize:22, fontWeight:"bold", color:OLIVE_DARK }}>{count}</div>
                      <div style={{ fontSize:12, color:"#888", marginTop:2 }}>{label}</div>
                    </div>
                  );
                })}
              </div>
            </>
          )}


          {/* MENU */}
          {tab==="menu" && (
            <>
              <h2 style={{ margin:"0 0 8px", color:"#4d5a2c", fontSize:20, fontWeight:"normal" }}>🍽️ Weekly Menu</h2>
              <p style={{ fontSize:13, color:"#888", marginBottom:20, fontFamily:"'Georgia',serif" }}>
                Fresh, locally sourced meals prepared daily. Natural electrolytes on Monday, Wednesday and Friday.
              </p>
              <img
                src="/weekly-menu.jpg"
                alt="Wild Child Nosara Weekly Menu"
                style={{ width:"100%", borderRadius:12, border:"1px solid #e0d8c8", display:"block" }}
              />
            </>
          )}

          {/* FAMILIES */}
          {tab==="families" && (
            <>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20, flexWrap:"wrap", gap:12 }}>
                <h2 style={{ margin:0, color:OLIVE_DARK, fontSize:20, fontWeight:"normal" }}>
                  🏠 Families
                  <span style={{ marginLeft:10, fontSize:14, color:"#888", fontWeight:"normal" }}>({families.length} famil{families.length===1?"y":"ies"})</span>
                </h2>
                <input
                  value={familySearch}
                  onChange={e => setFamilySearch(e.target.value)}
                  placeholder="Search by last name or parent…"
                  style={{ padding:"8px 12px", border:`1px solid ${CREAM_DARK}`, borderRadius:8, fontSize:13, fontFamily:"'Georgia',serif", width:240, outline:"none" }}
                />
              </div>

              {families.length === 0 && (
                <div style={{ textAlign:"center", padding:60, color:"#888" }}>No families found.</div>
              )}

              {families.map(family => {
                const isOpen = expandedFamily === family.lastName.toLowerCase();
                return (
                  <div key={family.lastName} style={{ background:"#fff", borderRadius:12, border:`1px solid ${CREAM_DARK}`, marginBottom:12, overflow:"hidden" }}>
                    {/* Family header — click to expand */}
                    <div
                      onClick={() => setExpandedFamily(isOpen ? null : family.lastName.toLowerCase())}
                      style={{ padding:"14px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer", background: isOpen ? "#f0f4e8" : "#fff" }}
                    >
                      <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                        <div style={{ width:40, height:40, borderRadius:"50%", background:OLIVE_DARK, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:16, fontWeight:"bold", flexShrink:0 }}>
                          {family.lastName[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight:"bold", fontSize:16, color:OLIVE_DARK }}>
                            {family.lastName} Family
                          </div>
                          <div style={{ fontSize:12, color:"#888", marginTop:2 }}>
                            {family.children.length} child{family.children.length !== 1 ? "ren" : ""}
                            {family.parents.length > 0 && ` · ${family.parents.map(p => p.name).join(", ")}`}
                          </div>
                        </div>
                      </div>
                      <span style={{ color:"#999", fontSize:18 }}>{isOpen ? "▲" : "▼"}</span>
                    </div>

                    {isOpen && (
                      <div style={{ borderTop:`1px solid ${CREAM_DARK}` }}>

                        {/* Parent info */}
                        {family.parents.map((p, pi) => (
                          <div key={pi} style={{ padding:"14px 20px", borderBottom:`1px solid ${CREAM_DARK}`, background:"#fafaf8" }}>
                            <div style={{ fontSize:11, letterSpacing:"0.1em", textTransform:"uppercase", color:OLIVE, marginBottom:8 }}>
                              Parent {family.parents.length > 1 ? pi + 1 : ""}
                            </div>
                            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
                              <div>
                                <div style={{ fontSize:11, color:"#aaa", marginBottom:2 }}>Name</div>
                                <div style={{ fontSize:14, color:"#333", fontWeight:"bold" }}>{p.name}</div>
                              </div>
                              <div>
                                <div style={{ fontSize:11, color:"#aaa", marginBottom:2 }}>Email</div>
                                <a href={`mailto:${p.email}`} style={{ fontSize:14, color:OLIVE, textDecoration:"none" }}>{p.email}</a>
                              </div>
                              <div>
                                <div style={{ fontSize:11, color:"#aaa", marginBottom:2 }}>Phone / WhatsApp</div>
                                <div style={{ fontSize:14, color:"#333" }}>{p.phone}</div>
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Children */}
                        <div style={{ padding:"12px 20px 4px" }}>
                          <div style={{ fontSize:11, letterSpacing:"0.1em", textTransform:"uppercase", color:OLIVE, marginBottom:10 }}>Children</div>
                          {family.children.map((ch, ci) => {
                            const age = calcAge(ch.dob);
                            return (
                              <div key={ci} style={{ display:"grid", gridTemplateColumns:"2fr 0.8fr 1.5fr 2fr 2fr", gap:12, padding:"10px 0", borderTop: ci > 0 ? `1px solid ${CREAM_DARK}` : "none", alignItems:"start" }}>
                                <div>
                                  <div style={{ fontWeight:"bold", fontSize:14, color:OLIVE_DARK }}>{ch.firstName} {ch.lastName}</div>
                                  {age !== "—" && <div style={{ fontSize:12, color:"#888", marginTop:2 }}>Age {age}</div>}
                                </div>
                                <div style={{ fontSize:13, color:"#555", paddingTop:2 }}>{ch.program || "—"}</div>
                                <div>
                                  <div style={{ fontSize:11, color:"#aaa", marginBottom:2 }}>Allergies</div>
                                  <div style={{ fontSize:13, color:"#555", wordBreak:"break-word" }}>{ch.allergies || <span style={{ color:"#bbb" }}>None</span>}</div>
                                </div>
                                <div>
                                  <div style={{ fontSize:11, color:"#aaa", marginBottom:2 }}>Medical Notes</div>
                                  <div style={{ fontSize:13, color:"#555", wordBreak:"break-word" }}>{ch.medicalNotes || <span style={{ color:"#bbb" }}>—</span>}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div style={{ height:8 }}/>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}

        </div>
      )}

      {selectedReg && <RegModal reg={selectedReg} onClose={()=>setSelectedReg(null)} />}
      {selectedHarmony && <HarmonyModal booking={selectedHarmony} onClose={()=>setSelectedHarmony(null)} />}
      {selectedKid && <KidModal child={selectedKid} onClose={()=>setSelectedKid(null)} />}
    </div>
  );
}
