import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabase";

// ─── Brand colours ────────────────────────────────────────────────────────────
const OLIVE      = "#6b7a3f";
const OLIVE_DARK = "#4d5a2c";
const NAVY       = "#0f1f5c";
const ORANGE     = "#c4682a";
const CREAM      = "#f5f0e8";
const CREAM_DARK = "#e0d8c8";
const TEAL       = "#427889";
const SAGE       = "#8fa88a";
const GREEN      = "#5a7a3a";

// ─── Pricing tiers ────────────────────────────────────────────────────────────
const TIERS = [
  {
    id: "harmony",
    label: "Harmony Member",
    price: 0,
    description: "Free for Harmony Co-Op members",
    requiresCode: true,
    codePlaceholder: "Enter member code",
    badge: "FREE",
    badgeColor: GREEN,
  },
  {
    id: "wildchild",
    label: "Wild Child Family",
    price: 50,
    description: "Current Wild Child Nosara families",
    requiresCode: false,
    badge: "$50",
    badgeColor: OLIVE,
  },
  {
    id: "general",
    label: "Open to All",
    price: 80,
    description: "Visitors & community members",
    requiresCode: false,
    badge: "$80",
    badgeColor: NAVY,
  },
];

// ─── Upcoming Saturdays ───────────────────────────────────────────────────────
function getUpcomingSaturdays(count = 8) {
  const saturdays = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(today);
  // advance to next Saturday (or today if Saturday)
  const day = d.getDay(); // 0=Sun,6=Sat
  const daysUntilSat = day === 6 ? 0 : (6 - day);
  d.setDate(d.getDate() + daysUntilSat);
  for (let i = 0; i < count; i++) {
    saturdays.push(new Date(d));
    d.setDate(d.getDate() + 7);
  }
  return saturdays;
}

function formatDate(d) {
  return d.toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });
}

function formatDateShort(d) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function localKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ─── Waiver text ──────────────────────────────────────────────────────────────
const WAIVER_SECTIONS = [
  {
    id: "liability",
    title: "Assumption of Risk & Release of Liability",
    text: "I understand that Wild Child at Harmony Co-Op Playground is a nature-based, outdoor play session. Activities may include outdoor play, physical movement, water play, use of natural materials, and exposure to uneven terrain, insects, plants, wildlife, weather conditions, sun, heat, and rain. I acknowledge that participation involves inherent risks that cannot be completely eliminated. I knowingly and voluntarily assume all risks associated with my child's participation. To the fullest extent permitted by law, I release, waive, discharge, and hold harmless Wild Child Playgarden & Wildschooling Nosara, its founders, directors, teachers, staff, and affiliates from any and all claims arising from my child's participation.",
  },
  {
    id: "medical",
    title: "Medical & Emergency Consent",
    text: "I authorize Wild Child Playgarden & Wildschooling Nosara to seek emergency medical care for my child if I cannot be reached. I consent to examination, diagnosis, treatment, and/or hospital care deemed necessary by a licensed physician for my child's health and safety. I understand that all medical expenses are my responsibility.",
  },
  {
    id: "media",
    title: "Media Release",
    text: "I understand that photographs and/or videos may be taken of my child during this session. If permission is granted, these may be used for community or promotional purposes including the Wild Child website and social media. Children's names will not be used publicly without additional consent.",
  },
];

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepBar({ step, total }) {
  return (
    <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 32 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 4,
            flex: 1,
            maxWidth: 60,
            borderRadius: 2,
            background: i < step ? OLIVE : i === step ? ORANGE : CREAM_DARK,
            transition: "background 0.3s",
          }}
        />
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function HarmonyCoop() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // 0=date 1=children 2=details+tier 3=payment 4=waiver 5=confirm
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);

  // Form state
  const [selectedDate, setSelectedDate] = useState(null);
  const [children, setChildren] = useState([{ name: "", age: "" }]);
  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [tier, setTier] = useState(null);
  const [memberCode, setMemberCode] = useState("");
  const [memberCodeError, setMemberCodeError] = useState("");
  const [memberCodeValid, setMemberCodeValid] = useState(false);

  // Payment (Stripe)
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");

  // Waiver
  const [waivers, setWaivers] = useState({ liability: false, medical: false, media: false });
  const [mediaChoice, setMediaChoice] = useState(null); // true/false
  const [signature, setSignature] = useState("");
  const [waiverSkipped, setWaiverSkipped] = useState(false);

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [bookingId, setBookingId] = useState(null);
  const [error, setError] = useState("");

  const saturdays = getUpcomingSaturdays(12);

  // Check auth + load profile
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        supabase
          .from("parent_profiles")
          .select("*")
          .eq("id", session.user.id)
          .maybeSingle()
          .then(({ data }) => {
            if (data) {
              setProfile(data);
              setParentName(data.full_name || "");
              setParentEmail(data.email || "");
              setParentPhone(data.phone || "");
              // auto-set Wild Child tier for logged-in families
              setTier("wildchild");
              // check if waiver already signed
              if (data.waiver_signed_at) {
                setWaiverSkipped(true);
              }
            }
          });
        // Try to load children
        supabase
          .from("children")
          .select("first_name, last_name, dob")
          .eq("parent_id", session.user.id)
          .then(({ data }) => {
            if (data && data.length > 0) {
              const mapped = data.map((c) => {
                const age = c.dob
                  ? Math.floor((new Date() - new Date(c.dob)) / (365.25 * 24 * 60 * 60 * 1000))
                  : "";
                return { name: `${c.first_name} ${c.last_name}`.trim(), age: String(age) };
              });
              setChildren(mapped);
            }
          });
      }
    });
  }, []);

  const selectedTier = TIERS.find((t) => t.id === tier);
  const price = selectedTier?.price ?? null;

  // ── Validate member code ───────────────────────────────────────────────────
  async function validateMemberCode() {
    if (!memberCode.trim()) {
      setMemberCodeError("Please enter your member code.");
      return false;
    }
    const { data } = await supabase
      .from("harmony_member_codes")
      .select("*")
      .eq("code", memberCode.trim().toLowerCase())
      .eq("active", true)
      .maybeSingle();
    if (!data) {
      setMemberCodeError("Code not recognised. Please check with Harmony Co-Op staff.");
      setMemberCodeValid(false);
      return false;
    }
    setMemberCodeError("");
    setMemberCodeValid(true);
    return true;
  }

  // ── Step navigation ────────────────────────────────────────────────────────
  async function handleNext() {
    setError("");

    if (step === 0) {
      if (!selectedDate) { setError("Please select a Saturday."); return; }
      setStep(1);
    } else if (step === 1) {
      const valid = children.every((c) => c.name.trim());
      if (!valid) { setError("Please enter a name for each child."); return; }
      setStep(2);
    } else if (step === 2) {
      if (!parentName.trim() || !parentEmail.trim() || !parentPhone.trim()) {
        setError("Please fill in all contact fields.");
        return;
      }
      if (!tier) { setError("Please select a pricing tier."); return; }
      if (tier === "harmony") {
        const ok = await validateMemberCode();
        if (!ok) return;
      }
      // Skip payment for free tier
      if (price === 0) {
        setStep(waiverSkipped ? 4 : 4); // still go to waiver (step 4)
      } else {
        setStep(3);
      }
    } else if (step === 3) {
      // Payment — simplified Stripe flow
      await handlePayment();
    } else if (step === 4) {
      // Waiver
      if (!waivers.liability || !waivers.medical) {
        setError("Please accept the required waiver sections.");
        return;
      }
      if (mediaChoice === null) {
        setError("Please select your media preference.");
        return;
      }
      if (!signature.trim()) {
        setError("Please enter your digital signature.");
        return;
      }
      await handleSubmit();
    }
  }

  async function handlePayment() {
    setPaying(true);
    setPayError("");
    try {
      // Create payment intent via Supabase Edge Function
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment-intent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ amount: price * 100, currency: "usd" }),
        }
      );
      const { clientSecret, error: fnError } = await res.json();
      if (fnError) throw new Error(fnError);

      // In production you'd use Stripe.js confirmCardPayment here.
      // For now we store pending and proceed.
      setStep(waiverSkipped ? 5 : 4);
    } catch (e) {
      setPayError(e.message || "Payment failed. Please try again.");
    } finally {
      setPaying(false);
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError("");
    try {
      const dateKey = localKey(selectedDate);
      const { data, error: dbErr } = await supabase
        .from("harmony_bookings")
        .insert({
          session_date: dateKey,
          children: children.filter((c) => c.name.trim()),
          parent_name: parentName.trim(),
          parent_email: parentEmail.trim(),
          parent_phone: parentPhone.trim(),
          tier: tier,
          price_paid: price,
          member_code: tier === "harmony" ? memberCode.trim().toLowerCase() : null,
          waiver_liability: waivers.liability,
          waiver_medical: waivers.medical,
          waiver_media: mediaChoice,
          waiver_signature: signature.trim(),
          waiver_date: new Date().toISOString().split("T")[0],
          parent_user_id: session?.user?.id || null,
          payment_status: price === 0 ? "free" : "pending",
        })
        .select("id")
        .single();
      if (dbErr) throw dbErr;
      setBookingId(data.id);

      // Send confirmation email via Edge Function
      try {
        await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-enrollment-notification`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              type: "harmony",
              parentName,
              parentEmail,
              sessionDate: formatDate(selectedDate),
              children: children.filter((c) => c.name.trim()),
              tier,
              price,
            }),
          }
        );
      } catch (_) {
        // email failure is non-fatal
      }

      setStep(5);
    } catch (e) {
      setError(e.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Child helpers ──────────────────────────────────────────────────────────
  function addChild() {
    if (children.length < 5) setChildren([...children, { name: "", age: "" }]);
  }
  function removeChild(i) {
    setChildren(children.filter((_, idx) => idx !== i));
  }
  function updateChild(i, field, val) {
    setChildren(children.map((c, idx) => idx === i ? { ...c, [field]: val } : c));
  }

  // ─── Styles ────────────────────────────────────────────────────────────────
  const S = {
    page: {
      minHeight: "100vh",
      background: CREAM,
      fontFamily: "'Georgia', serif",
      color: "#2a2a2a",
    },
    header: {
      background: OLIVE_DARK,
      padding: "0 24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      height: 56,
      position: "sticky",
      top: 0,
      zIndex: 100,
    },
    headerBack: {
      color: "rgba(255,255,255,0.8)",
      background: "none",
      border: "none",
      cursor: "pointer",
      fontSize: 14,
      fontFamily: "'Georgia', serif",
      display: "flex",
      alignItems: "center",
      gap: 6,
      padding: 0,
    },
    headerTitle: {
      color: "#fff",
      fontSize: 15,
      fontWeight: "normal",
      letterSpacing: "0.04em",
    },
    hero: {
      background: `linear-gradient(135deg, ${OLIVE_DARK} 0%, ${TEAL} 100%)`,
      padding: "40px 24px 32px",
      textAlign: "center",
      color: "#fff",
    },
    heroEyebrow: {
      fontSize: 11,
      letterSpacing: "0.2em",
      textTransform: "uppercase",
      color: "rgba(255,255,255,0.65)",
      marginBottom: 8,
      fontFamily: "'Georgia', serif",
    },
    heroTitle: {
      fontSize: 28,
      fontWeight: "normal",
      margin: "0 0 8px",
      lineHeight: 1.2,
    },
    heroSub: {
      fontSize: 14,
      color: "rgba(255,255,255,0.8)",
      margin: "0 0 16px",
      lineHeight: 1.6,
    },
    heroPills: {
      display: "flex",
      gap: 8,
      justifyContent: "center",
      flexWrap: "wrap",
    },
    pill: {
      background: "rgba(255,255,255,0.15)",
      border: "1px solid rgba(255,255,255,0.3)",
      borderRadius: 20,
      padding: "4px 12px",
      fontSize: 12,
      color: "#fff",
      letterSpacing: "0.03em",
    },
    card: {
      background: "#fff",
      borderRadius: 12,
      border: `1px solid ${CREAM_DARK}`,
      padding: 24,
      marginBottom: 16,
    },
    sectionLabel: {
      fontSize: 11,
      letterSpacing: "0.15em",
      textTransform: "uppercase",
      color: OLIVE,
      marginBottom: 16,
      fontFamily: "'Georgia', serif",
    },
    input: {
      width: "100%",
      padding: "11px 14px",
      border: `1.5px solid ${CREAM_DARK}`,
      borderRadius: 8,
      fontSize: 15,
      fontFamily: "'Georgia', serif",
      background: "#fff",
      color: "#2a2a2a",
      outline: "none",
      boxSizing: "border-box",
      transition: "border-color 0.2s",
    },
    label: {
      fontSize: 13,
      color: "#555",
      marginBottom: 6,
      display: "block",
    },
    btn: {
      width: "100%",
      padding: "15px",
      background: OLIVE_DARK,
      color: "#fff",
      border: "none",
      borderRadius: 10,
      fontSize: 16,
      fontFamily: "'Georgia', serif",
      cursor: "pointer",
      letterSpacing: "0.04em",
      transition: "background 0.2s",
    },
    btnOutline: {
      width: "100%",
      padding: "13px",
      background: "transparent",
      color: OLIVE_DARK,
      border: `1.5px solid ${OLIVE_DARK}`,
      borderRadius: 10,
      fontSize: 15,
      fontFamily: "'Georgia', serif",
      cursor: "pointer",
      marginBottom: 10,
    },
    error: {
      background: "#fef2f2",
      border: "1px solid #fca5a5",
      borderRadius: 8,
      padding: "12px 16px",
      color: "#b91c1c",
      fontSize: 14,
      marginBottom: 16,
    },
    tierCard: (selected) => ({
      border: `2px solid ${selected ? OLIVE : CREAM_DARK}`,
      borderRadius: 10,
      padding: "16px",
      cursor: "pointer",
      background: selected ? `${OLIVE}10` : "#fff",
      transition: "all 0.2s",
      display: "flex",
      alignItems: "center",
      gap: 14,
      marginBottom: 10,
    }),
    tierBadge: (color) => ({
      background: color,
      color: "#fff",
      borderRadius: 20,
      padding: "4px 10px",
      fontSize: 13,
      fontWeight: "bold",
      fontFamily: "'Georgia', serif",
      minWidth: 44,
      textAlign: "center",
      flexShrink: 0,
    }),
    satCard: (selected) => ({
      border: `2px solid ${selected ? ORANGE : CREAM_DARK}`,
      borderRadius: 10,
      padding: "14px 16px",
      cursor: "pointer",
      background: selected ? `${ORANGE}12` : "#fff",
      transition: "all 0.2s",
      marginBottom: 8,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    }),
    checkRow: {
      display: "flex",
      alignItems: "flex-start",
      gap: 12,
      marginBottom: 12,
    },
    checkbox: {
      width: 18,
      height: 18,
      accentColor: OLIVE,
      flexShrink: 0,
      marginTop: 2,
      cursor: "pointer",
    },
    waiverText: {
      fontSize: 13,
      color: "#555",
      lineHeight: 1.6,
      background: "#fafaf8",
      border: `1px solid ${CREAM_DARK}`,
      borderRadius: 8,
      padding: "12px 14px",
      marginBottom: 12,
    },
    summaryRow: {
      display: "flex",
      justifyContent: "space-between",
      padding: "8px 0",
      borderBottom: `1px solid ${CREAM_DARK}`,
      fontSize: 14,
    },
    confirmIcon: {
      width: 64,
      height: 64,
      borderRadius: "50%",
      background: `${GREEN}20`,
      border: `2px solid ${GREEN}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 28,
      margin: "0 auto 20px",
    },
  };

  const TOTAL_STEPS = price === 0 ? 4 : 5; // date, children, details, [payment], waiver, confirm

  // ─── Render steps ──────────────────────────────────────────────────────────

  // Step 0 — Date picker
  if (step === 0) {
    return (
      <div style={S.page}>
        <div style={S.header}>
          <button style={S.headerBack} onClick={() => navigate("/")}>← Home</button>
          <span style={S.headerTitle}>Harmony Co-Op</span>
          <div style={{ width: 60 }} />
        </div>
        <div style={S.hero}>
          <div style={S.heroEyebrow}>Wild Child Nosara</div>
          <h1 style={S.heroTitle}>Wild Child at<br />Harmony Co-Op</h1>
          <p style={S.heroSub}>Saturday mornings in nature · 8:00 – 11:00 am</p>
          <div style={S.heroPills}>
            <span style={S.pill}>Every Saturday</span>
            <span style={S.pill}>Ages 0–12</span>
            <span style={S.pill}>Nosara, Costa Rica</span>
          </div>
        </div>

        <div style={{ maxWidth: 520, margin: "0 auto", padding: "24px 16px" }}>
          <StepBar step={0} total={4} />
          <div style={S.card}>
            <div style={S.sectionLabel}>Choose a Saturday</div>
            {saturdays.map((sat, i) => {
              const selected = selectedDate && localKey(selectedDate) === localKey(sat);
              return (
                <div
                  key={i}
                  style={S.satCard(selected)}
                  onClick={() => setSelectedDate(sat)}
                >
                  <div>
                    <div style={{ fontWeight: "bold", fontSize: 15 }}>{formatDate(sat)}</div>
                    <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>8:00 – 11:00 am · Harmony Co-Op Playground</div>
                  </div>
                  <div style={{
                    width: 22, height: 22, borderRadius: "50%",
                    border: `2px solid ${selected ? ORANGE : CREAM_DARK}`,
                    background: selected ? ORANGE : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    {selected && <span style={{ color: "#fff", fontSize: 12 }}>✓</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pricing reference */}
          <div style={{ ...S.card, background: `${OLIVE_DARK}08` }}>
            <div style={S.sectionLabel}>Pricing</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {TIERS.map((t) => (
                <div key={t.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 14, padding: "4px 0" }}>
                  <span style={{ color: "#444" }}>{t.label}</span>
                  <span style={{ fontWeight: "bold", color: t.price === 0 ? GREEN : "#2a2a2a" }}>
                    {t.price === 0 ? "Free" : `$${t.price}`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {error && <div style={S.error}>{error}</div>}
          <button style={S.btn} onClick={handleNext}>
            Continue →
          </button>
        </div>
      </div>
    );
  }

  // Step 1 — Children
  if (step === 1) {
    return (
      <div style={S.page}>
        <div style={S.header}>
          <button style={S.headerBack} onClick={() => setStep(0)}>← Back</button>
          <span style={S.headerTitle}>Who's coming?</span>
          <div style={{ width: 60 }} />
        </div>
        <div style={{ maxWidth: 520, margin: "0 auto", padding: "24px 16px" }}>
          <StepBar step={1} total={4} />
          <div style={{ ...S.card, marginBottom: 12, background: `${TEAL}10`, border: `1px solid ${TEAL}30` }}>
            <div style={{ fontSize: 13, color: TEAL }}>
              📅 <strong>{formatDate(selectedDate)}</strong> · 8:00 – 11:00 am
            </div>
          </div>

          <div style={S.card}>
            <div style={S.sectionLabel}>Children attending</div>
            {children.map((child, i) => (
              <div key={i} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: i < children.length - 1 ? `1px solid ${CREAM_DARK}` : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 13, color: "#666" }}>Child {i + 1}</span>
                  {children.length > 1 && (
                    <button
                      onClick={() => removeChild(i)}
                      style={{ background: "none", border: "none", color: "#999", cursor: "pointer", fontSize: 18, padding: 0, lineHeight: 1 }}
                    >×</button>
                  )}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 80px", gap: 10 }}>
                  <div>
                    <label style={S.label}>Child's name</label>
                    <input
                      style={S.input}
                      value={child.name}
                      onChange={(e) => updateChild(i, "name", e.target.value)}
                      placeholder="First name"
                    />
                  </div>
                  <div>
                    <label style={S.label}>Age</label>
                    <input
                      style={S.input}
                      value={child.age}
                      onChange={(e) => updateChild(i, "age", e.target.value)}
                      placeholder="e.g. 5"
                      type="number"
                      min="0"
                      max="12"
                    />
                  </div>
                </div>
              </div>
            ))}
            {children.length < 5 && (
              <button
                onClick={addChild}
                style={{ ...S.btnOutline, width: "auto", padding: "8px 16px", fontSize: 13, marginBottom: 0 }}
              >
                + Add another child
              </button>
            )}
          </div>

          {error && <div style={S.error}>{error}</div>}
          <button style={S.btn} onClick={handleNext}>Continue →</button>
        </div>
      </div>
    );
  }

  // Step 2 — Contact + Tier
  if (step === 2) {
    return (
      <div style={S.page}>
        <div style={S.header}>
          <button style={S.headerBack} onClick={() => setStep(1)}>← Back</button>
          <span style={S.headerTitle}>Your details</span>
          <div style={{ width: 60 }} />
        </div>
        <div style={{ maxWidth: 520, margin: "0 auto", padding: "24px 16px" }}>
          <StepBar step={2} total={4} />

          <div style={S.card}>
            <div style={S.sectionLabel}>Contact information</div>
            <div style={{ marginBottom: 14 }}>
              <label style={S.label}>Your name</label>
              <input style={S.input} value={parentName} onChange={(e) => setParentName(e.target.value)} placeholder="Full name" />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={S.label}>Email</label>
              <input style={S.input} value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} placeholder="you@example.com" type="email" />
            </div>
            <div>
              <label style={S.label}>WhatsApp / Phone</label>
              <input style={S.input} value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} placeholder="+506 ..." type="tel" />
            </div>
          </div>

          <div style={S.card}>
            <div style={S.sectionLabel}>Pricing tier</div>
            {TIERS.map((t) => (
              <div key={t.id}>
                <div style={S.tierCard(tier === t.id)} onClick={() => { setTier(t.id); setMemberCodeError(""); setMemberCodeValid(false); }}>
                  <div style={S.tierBadge(t.badgeColor)}>{t.badge}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "bold", fontSize: 15 }}>{t.label}</div>
                    <div style={{ fontSize: 12, color: "#777", marginTop: 2 }}>{t.description}</div>
                  </div>
                  <div style={{
                    width: 20, height: 20, borderRadius: "50%",
                    border: `2px solid ${tier === t.id ? OLIVE : CREAM_DARK}`,
                    background: tier === t.id ? OLIVE : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    {tier === t.id && <span style={{ color: "#fff", fontSize: 11 }}>✓</span>}
                  </div>
                </div>
                {tier === "harmony" && t.id === "harmony" && (
                  <div style={{ marginBottom: 12, marginTop: -4 }}>
                    <label style={S.label}>Member code</label>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        style={{ ...S.input, borderColor: memberCodeValid ? GREEN : memberCodeError ? "#f87171" : CREAM_DARK }}
                        value={memberCode}
                        onChange={(e) => { setMemberCode(e.target.value); setMemberCodeError(""); setMemberCodeValid(false); }}
                        placeholder="e.g. harmonymember"
                      />
                      <button
                        onClick={validateMemberCode}
                        style={{ padding: "11px 14px", background: OLIVE_DARK, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontFamily: "'Georgia', serif", whiteSpace: "nowrap" }}
                      >
                        Verify
                      </button>
                    </div>
                    {memberCodeError && <div style={{ fontSize: 12, color: "#b91c1c", marginTop: 4 }}>{memberCodeError}</div>}
                    {memberCodeValid && <div style={{ fontSize: 12, color: GREEN, marginTop: 4 }}>✓ Member code verified</div>}
                  </div>
                )}
              </div>
            ))}
          </div>

          {error && <div style={S.error}>{error}</div>}
          <button style={S.btn} onClick={handleNext}>Continue →</button>
        </div>
      </div>
    );
  }

  // Step 3 — Payment (only for paid tiers)
  if (step === 3 && price > 0) {
    return (
      <div style={S.page}>
        <div style={S.header}>
          <button style={S.headerBack} onClick={() => setStep(2)}>← Back</button>
          <span style={S.headerTitle}>Payment</span>
          <div style={{ width: 60 }} />
        </div>
        <div style={{ maxWidth: 520, margin: "0 auto", padding: "24px 16px" }}>
          <StepBar step={3} total={5} />

          {/* Order summary */}
          <div style={S.card}>
            <div style={S.sectionLabel}>Order summary</div>
            <div style={S.summaryRow}>
              <span>Wild Child at Harmony Co-Op</span>
              <span></span>
            </div>
            <div style={S.summaryRow}>
              <span style={{ color: "#777" }}>{formatDate(selectedDate)}, 8–11am</span>
              <span></span>
            </div>
            <div style={S.summaryRow}>
              <span style={{ color: "#777" }}>{children.filter(c => c.name).map(c => c.name).join(", ")}</span>
              <span></span>
            </div>
            <div style={S.summaryRow}>
              <span style={{ color: "#777" }}>{selectedTier?.label}</span>
              <span></span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 12, fontSize: 17, fontWeight: "bold" }}>
              <span>Total</span>
              <span style={{ color: OLIVE_DARK }}>${price}</span>
            </div>
          </div>

          {/* Stripe card fields — placeholder UI */}
          <div style={S.card}>
            <div style={S.sectionLabel}>Card details</div>
            <div style={{ marginBottom: 14 }}>
              <label style={S.label}>Card number</label>
              <input
                style={S.input}
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                placeholder="4242 4242 4242 4242"
                maxLength={19}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={S.label}>Expiry</label>
                <input style={S.input} value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} placeholder="MM/YY" maxLength={5} />
              </div>
              <div>
                <label style={S.label}>CVC</label>
                <input style={S.input} value={cardCvc} onChange={(e) => setCardCvc(e.target.value)} placeholder="123" maxLength={4} />
              </div>
            </div>
          </div>

          {payError && <div style={S.error}>{payError}</div>}
          {error && <div style={S.error}>{error}</div>}
          <button style={{ ...S.btn, background: paying ? SAGE : OLIVE_DARK }} onClick={handleNext} disabled={paying}>
            {paying ? "Processing…" : `Pay $${price} →`}
          </button>
          <div style={{ textAlign: "center", marginTop: 10, fontSize: 12, color: "#999" }}>
            🔒 Secure payment via Stripe
          </div>
        </div>
      </div>
    );
  }

  // Step 4 — Waiver
  if (step === 4) {
    return (
      <div style={S.page}>
        <div style={S.header}>
          <button style={S.headerBack} onClick={() => setStep(price > 0 ? 3 : 2)}>← Back</button>
          <span style={S.headerTitle}>Waiver</span>
          <div style={{ width: 60 }} />
        </div>
        <div style={{ maxWidth: 520, margin: "0 auto", padding: "24px 16px" }}>
          <StepBar step={price > 0 ? 4 : 3} total={price > 0 ? 5 : 4} />

          {WAIVER_SECTIONS.map((section) => {
            if (section.id === "media") {
              return (
                <div key={section.id} style={S.card}>
                  <div style={{ fontWeight: "bold", marginBottom: 10, color: OLIVE_DARK, fontSize: 14 }}>{section.title}</div>
                  <div style={S.waiverText}>{section.text}</div>
                  <div style={{ marginTop: 8 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: 8, fontSize: 14 }}>
                      <input type="radio" name="media" checked={mediaChoice === true} onChange={() => setMediaChoice(true)} style={{ accentColor: OLIVE }} />
                      Yes – I grant permission for photos/videos of my child.
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 14 }}>
                      <input type="radio" name="media" checked={mediaChoice === false} onChange={() => setMediaChoice(false)} style={{ accentColor: OLIVE }} />
                      No – I do NOT grant permission.
                    </label>
                  </div>
                </div>
              );
            }
            const isChecked = waivers[section.id];
            return (
              <div key={section.id} style={S.card}>
                <div style={{ fontWeight: "bold", marginBottom: 10, color: OLIVE_DARK, fontSize: 14 }}>{section.title}</div>
                <div style={S.waiverText}>{section.text}</div>
                <div style={S.checkRow}>
                  <input
                    type="checkbox"
                    style={S.checkbox}
                    checked={isChecked}
                    onChange={(e) => setWaivers({ ...waivers, [section.id]: e.target.checked })}
                    id={`waiver-${section.id}`}
                  />
                  <label htmlFor={`waiver-${section.id}`} style={{ fontSize: 14, cursor: "pointer", lineHeight: 1.5 }}>
                    I agree to the {section.title}.
                  </label>
                </div>
              </div>
            );
          })}

          <div style={S.card}>
            <div style={S.sectionLabel}>Digital signature</div>
            <label style={S.label}>Type your full name as your digital signature</label>
            <input
              style={S.input}
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              placeholder="Your full name"
            />
            <div style={{ fontSize: 12, color: "#999", marginTop: 6 }}>
              Today's date: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </div>
          </div>

          {error && <div style={S.error}>{error}</div>}
          <button
            style={{ ...S.btn, background: submitting ? SAGE : OLIVE_DARK }}
            onClick={handleNext}
            disabled={submitting}
          >
            {submitting ? "Confirming booking…" : "Confirm booking →"}
          </button>
        </div>
      </div>
    );
  }

  // Step 5 — Confirmation
  if (step === 5) {
    return (
      <div style={S.page}>
        <div style={S.header}>
          <div style={{ width: 60 }} />
          <span style={S.headerTitle}>Booking confirmed</span>
          <div style={{ width: 60 }} />
        </div>
        <div style={{ maxWidth: 520, margin: "0 auto", padding: "32px 16px", textAlign: "center" }}>
          <div style={S.confirmIcon}>🌿</div>
          <h2 style={{ fontSize: 24, color: OLIVE_DARK, marginBottom: 8, fontWeight: "normal" }}>
            See you Saturday!
          </h2>
          <p style={{ color: "#666", fontSize: 15, lineHeight: 1.6, marginBottom: 28 }}>
            Your spot is confirmed at Wild Child at Harmony Co-Op. A confirmation has been sent to <strong>{parentEmail}</strong>.
          </p>

          <div style={{ ...S.card, textAlign: "left" }}>
            <div style={S.sectionLabel}>Booking details</div>
            <div style={S.summaryRow}>
              <span style={{ color: "#777" }}>Date</span>
              <span style={{ fontWeight: "bold" }}>{formatDate(selectedDate)}</span>
            </div>
            <div style={S.summaryRow}>
              <span style={{ color: "#777" }}>Time</span>
              <span>8:00 – 11:00 am</span>
            </div>
            <div style={S.summaryRow}>
              <span style={{ color: "#777" }}>Location</span>
              <span>Harmony Co-Op Playground, Nosara</span>
            </div>
            <div style={S.summaryRow}>
              <span style={{ color: "#777" }}>Children</span>
              <span>{children.filter(c => c.name).map(c => c.name).join(", ")}</span>
            </div>
            <div style={S.summaryRow}>
              <span style={{ color: "#777" }}>Tier</span>
              <span>{selectedTier?.label}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 12, fontSize: 15 }}>
              <span style={{ color: "#777" }}>Amount paid</span>
              <span style={{ fontWeight: "bold", color: price === 0 ? GREEN : OLIVE_DARK }}>
                {price === 0 ? "Free" : `$${price}`}
              </span>
            </div>
          </div>

          <div style={{ ...S.card, background: `${TEAL}10`, border: `1px solid ${TEAL}30`, textAlign: "left" }}>
            <div style={{ fontWeight: "bold", marginBottom: 8, color: TEAL, fontSize: 14 }}>What to bring</div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#555", lineHeight: 1.8 }}>
              <li>Comfortable, weather-appropriate clothing (that can get dirty)</li>
              <li>Sun hat & sunscreen</li>
              <li>Closed-toe shoes</li>
              <li>One change of clothes</li>
              <li>Reusable water bottle</li>
              <li>Mosquito spray (rainy season)</li>
            </ul>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {session ? (
              <button style={S.btn} onClick={() => navigate("/portal")}>Go to my portal →</button>
            ) : (
              <button style={S.btn} onClick={() => navigate("/")}>Back to home →</button>
            )}
            <button style={S.btnOutline} onClick={() => {
              setStep(0); setSelectedDate(null);
              setChildren([{ name: "", age: "" }]); setTier(null);
            }}>
              Book another Saturday
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
