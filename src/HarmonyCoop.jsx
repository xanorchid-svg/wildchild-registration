import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabase";

const OLIVE      = "#6b7a3f";
const OLIVE_DARK = "#4d5a2c";
const NAVY       = "#0f1f5c";
const ORANGE     = "#c4682a";
const CREAM      = "#f5f0e8";
const CREAM_DARK = "#e0d8c8";
const TEAL       = "#427889";
const SAGE       = "#8fa88a";
const GREEN      = "#5a7a3a";

const TIERS = [
  {
    id: "harmony",
    label: "Harmony Member",
    price: 0,
    description: "Free for Harmony Co-Op members",
    requiresCode: true,
    codeTable: "harmony_member_codes",
    badge: "FREE",
    badgeColor: GREEN,
  },
  {
    id: "wildchild",
    label: "Wild Child Family",
    price: 50,
    description: "Current Wild Child Nosara families",
    requiresCode: true,
    codeTable: "wildchild_discount_codes",
    badge: "$50",
    badgeColor: OLIVE,
  },
  {
    id: "local",
    label: "Costa Rican Family",
    price: 64,
    description: "Local Costa Rican families — 20% community rate",
    requiresCode: true,
    codeTable: "costa_rican_local_codes",
    badge: "$64",
    badgeColor: TEAL,
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

const WAIVER_SECTIONS = [
  {
    id: "liability",
    title: "Assumption of Risk & Release of Liability",
    text: "I understand that Wild Child at Harmony Co-Op Playground is a nature-based, outdoor play session. Activities may include outdoor play, gardening, physical movement, water play, use of natural materials, and exposure to uneven terrain, insects, plants, wildlife, weather conditions, sun, heat, and rain. I acknowledge that participation involves inherent risks that cannot be completely eliminated without changing the nature of the program. I knowingly and voluntarily assume all risks, both known and unknown, associated with my child's participation. To the fullest extent permitted by law, I release, waive, discharge, indemnify, and hold harmless Wild Child Playgarden & Wildschooling Nosara, its founders, directors, teachers, staff, independent contractors, volunteers, and affiliates from any and all claims, liabilities, demands, damages, or expenses arising from my child's participation, except as required by applicable law.",
    required: true,
    type: "checkbox",
    checkLabel: "I agree to the Assumption of Risk and Release of Liability.",
  },
  {
    id: "medical",
    title: "Medical & Emergency Consent",
    text: "I authorize Wild Child Playgarden & Wildschooling Nosara to seek emergency medical care for my child if I cannot be reached. I consent to examination, diagnosis, treatment, and/or hospital care deemed necessary by a licensed physician, dentist, or surgeon for my child's health and safety. I understand that my child's personal medical insurance will be used when available and that all medical expenses are my responsibility, not that of Wild Child Playgarden & Wildschooling Nosara or its affiliates.",
    required: true,
    type: "checkbox",
    checkLabel: "I agree to Medical & Emergency Care Consent.",
  },
  {
    id: "media",
    title: "Media Release (Photos & Videos)",
    text: "I understand that photographs and/or videos may be taken of my child during program activities. If permission is granted, these may be used for educational documentation and community or promotional purposes, including the Wild Child website and social media (Instagram, Facebook). Children's names will not be used publicly without additional consent.",
    required: true,
    type: "radio",
  },
  {
    id: "excursion",
    title: "Excursion & Community Outings Permission",
    text: "I understand that Wild Child Playgarden & Wildschooling Nosara may organize supervised local outings, such as neighborhood walks, visits to nearby natural areas, beaches, farms, or community spaces, as part of the program.",
    required: true,
    type: "radio",
  },
];

function getUpcomingSaturdays(count = 12) {
  const saturdays = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(today);
  const day = d.getDay();
  const daysUntilSat = day === 6 ? 0 : (6 - day);
  d.setDate(d.getDate() + daysUntilSat);
  for (let i = 0; i < count; i++) {
    saturdays.push(new Date(d));
    d.setDate(d.getDate() + 7);
  }
  return saturdays;
}

function formatDate(d) {
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

function localKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function calcAge(dobString) {
  if (!dobString) return null;
  const dob = new Date(dobString);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

function StepBar({ step, total }) {
  return (
    <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 28 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{ height: 4, flex: 1, maxWidth: 60, borderRadius: 2, background: i < step ? OLIVE : i === step ? ORANGE : CREAM_DARK, transition: "background 0.3s" }} />
      ))}
    </div>
  );
}


function HarmonyPaymentStep({ price, selectedDate, selectedTier, childrenList, parentEmail,
  nameOnCard, setNameOnCard, paying, payError, error, onBack, onPay }) {
  const stripe = useStripe();
  const elements = useElements();

  return (
    <>
      <div style={{ background: "#4d5a2c", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56, position: "sticky", top: 0, zIndex: 100 }}>
        <button style={{ color: "rgba(255,255,255,0.8)", background: "none", border: "none", cursor: "pointer", fontSize: 14, fontFamily: "'Georgia', serif", padding: 0 }} onClick={onBack}>← Back</button>
        <span style={{ color: "#fff", fontSize: 15, fontWeight: "normal", letterSpacing: "0.04em" }}>Payment</span>
        <div style={{ width: 60 }} />
      </div>
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "24px 16px" }}>
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 28 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ height: 4, flex: 1, maxWidth: 60, borderRadius: 2, background: i < 3 ? "#6b7a3f" : i === 3 ? "#c4682a" : "#e0d8c8" }} />
          ))}
        </div>

        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e0d8c8", padding: 24, marginBottom: 16 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "#6b7a3f", marginBottom: 16 }}>Order summary</div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #e0d8c8", fontSize: 14 }}><span>Wild Child at Harmony Co-Op</span><span></span></div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #e0d8c8", fontSize: 14 }}><span style={{ color: "#777" }}>{selectedDate && selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}, 8–11am</span><span></span></div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #e0d8c8", fontSize: 14 }}><span style={{ color: "#777" }}>{Array.isArray(childrenList) ? childrenList.filter(c => c.name).map(c => c.name).join(", ") : ""}</span><span></span></div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #e0d8c8", fontSize: 14 }}><span style={{ color: "#777" }}>{selectedTier?.label}</span><span></span></div>
          <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 12, fontSize: 17, fontWeight: "bold" }}>
            <span>Total</span><span style={{ color: "#4d5a2c" }}>${price}</span>
          </div>
        </div>

        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e0d8c8", overflow: "hidden", marginBottom: 16 }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #e0d8c8" }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#888", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>Name on card</label>
            <input
              value={nameOnCard}
              onChange={e => setNameOnCard(e.target.value)}
              placeholder="Full name as it appears on card"
              style={{ width: "100%", border: "none", outline: "none", fontSize: 16, color: "#333", background: "transparent", fontFamily: "Georgia,serif", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ padding: 16 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#888", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>Card details</label>
            <CardElement options={{ style: { base: { fontSize: "16px", color: "#333", fontFamily: "Georgia, serif" } } }} />
          </div>
        </div>

        {payError && <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: "12px 16px", color: "#b91c1c", fontSize: 14, marginBottom: 16 }}>{payError}</div>}
        {error && <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: "12px 16px", color: "#b91c1c", fontSize: 14, marginBottom: 16 }}>{error}</div>}

        <button
          style={{ width: "100%", padding: "15px", background: paying ? "#8fa88a" : "#4d5a2c", color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontFamily: "'Georgia', serif", cursor: paying ? "default" : "pointer", letterSpacing: "0.08em" }}
          onClick={() => onPay(stripe, elements)}
          disabled={paying}
        >
          {paying ? "Processing…" : `Pay $${price} →`}
        </button>
        <div style={{ textAlign: "center", marginTop: 10, fontSize: 12, color: "#999" }}>🔒 Secure payment via Stripe</div>
      </div>
    </>
  );
}

export default function HarmonyCoop() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [session, setSession] = useState(null);

  const [selectedDate, setSelectedDate] = useState(null);
  const [children, setChildren] = useState([{ name: "", dob: "", allergies: "", medicalNotes: "" }]);
  const [childErrors, setChildErrors] = useState([]);
  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [tier, setTier] = useState(null);
  const [tierCode, setTierCode] = useState("");
  const [tierCodeError, setTierCodeError] = useState("");
  const [tierCodeValid, setTierCodeValid] = useState(false);

  const [waivers, setWaivers] = useState({ liability: false, medical: false });
  const [mediaChoice, setMediaChoice] = useState(null);
  const [excursionChoice, setExcursionChoice] = useState(null);
  const [signature, setSignature] = useState("");
  const [waiverSkipped, setWaiverSkipped] = useState(false);

  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");
  const [nameOnCard, setNameOnCard] = useState("");
  const [stripePaymentIntentId, setStripePaymentIntentId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const saturdays = getUpcomingSaturdays(12);
  const selectedTier = TIERS.find((t) => t.id === tier);
  const price = selectedTier?.price ?? null;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        supabase.from("parent_profiles").select("*").eq("id", session.user.id).maybeSingle().then(({ data }) => {
          if (data) {
            setParentName(data.full_name || "");
            setParentEmail(data.email || "");
            setParentPhone(data.phone || "");
            if (data.waiver_signed_at) setWaiverSkipped(true);
          }
        });
        supabase.from("children").select("first_name, last_name, dob").eq("parent_id", session.user.id).then(({ data }) => {
          if (data && data.length > 0) {
            const mapped = data.map((c) => ({
              name: `${c.first_name} ${c.last_name}`.trim(),
              dob: c.dob || "",
            }));
            setChildren(mapped);
          }
        });
      }
    });
  }, []);

  async function validateTierCode(tierId, code) {
    if (!code.trim()) {
      setTierCodeError("Please enter your code.");
      return false;
    }
    const table = tierId === "harmony" ? "harmony_member_codes" : tierId === "wildchild" ? "wildchild_discount_codes" : "costa_rican_local_codes";
    const { data } = await supabase.from(table).select("*").eq("code", code.trim().toLowerCase()).maybeSingle();
    if (!data) {
      setTierCodeError(tierId === "harmony" ? "Code not recognised. Please check with Harmony Co-Op staff." : tierId === "wildchild" ? "Code not recognised. Please check with Wild Child staff." : "Code not recognised. Please use code: localharmony");
      setTierCodeValid(false);
      return false;
    }
    setTierCodeError("");
    setTierCodeValid(true);
    return true;
  }

  function validateChildren() {
    const errors = children.map((c) => {
      if (!c.name.trim()) return "Please enter a name.";
      if (!c.dob) return "Please enter a date of birth.";
      const age = calcAge(c.dob);
      if (age === null) return "Invalid date of birth.";
      if (age < 2) return `Must be at least 2 years old to attend.`;
      if (age > 6) return `Age limit is 6 years old. This child is ${age}.`;
      return null;
    });
    setChildErrors(errors);
    return errors.every((e) => e === null);
  }

  async function handleNext() {
    setError("");
    if (step === 0) {
      if (!selectedDate) { setError("Please select a Saturday."); return; }
      setStep(1);
    } else if (step === 1) {
      if (!validateChildren()) return;
      setStep(2);
    } else if (step === 2) {
      if (!parentName.trim() || !parentEmail.trim() || !parentPhone.trim()) { setError("Please fill in all contact fields."); return; }
      if (!tier) { setError("Please select a pricing tier."); return; }
      if (selectedTier?.requiresCode) {
        const ok = await validateTierCode(tier, tierCode);
        if (!ok) return;
      }
      if (price === 0) {
        setStep(waiverSkipped ? 5 : 4);
      } else {
        setStep(3);
      }
    } else if (step === 3) {
      if (price > 0) {
        // payment handled by HarmonyPaymentStep component
      } else {
        setStep(waiverSkipped ? 4 : 3);
      }
    } else if (step === 4) {
      if (!waivers.liability) { setError("Please accept the liability waiver."); return; }
      if (!waivers.medical) { setError("Please accept the medical consent."); return; }
      if (mediaChoice === null) { setError("Please select your media preference."); return; }
      if (!signature.trim()) { setError("Please enter your digital signature."); return; }
      await handleSubmit();
    }
  }

  async function handlePayment(stripe, elements) {
    if (!stripe || !elements) { setPayError("Payment not ready. Please refresh."); return; }
    if (!nameOnCard.trim()) { setPayError("Please enter the name on your card."); return; }
    setPaying(true);
    setPayError("");
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment-intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ amount: price, currency: "usd", customerName: parentName.trim(), customerEmail: parentEmail.trim(), saveCard: false }),
      });
      const { clientSecret, error: fnError } = await res.json();
      if (fnError) throw new Error(fnError);
      if (!clientSecret) throw new Error("No client secret returned from payment server.");
      const { error: stripeErr, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: { name: nameOnCard.trim(), email: parentEmail.trim() },
        },
      });
      if (stripeErr) throw new Error(stripeErr.message);
      setStripePaymentIntentId(paymentIntent.id);
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
      const { data, error: dbErr } = await supabase.from("harmony_bookings").insert({
        session_date: dateKey,
        children: children.filter((c) => c.name.trim()).map(c => ({ name: c.name, dob: c.dob, allergies: c.allergies || null, medicalNotes: c.medicalNotes || null })),
        parent_name: parentName.trim(),
        parent_email: parentEmail.trim(),
        parent_phone: parentPhone.trim(),
        tier,
        price_paid: price,
        member_code: selectedTier?.requiresCode ? tierCode.trim().toLowerCase() : null,
        waiver_liability: waivers.liability,
        waiver_medical: waivers.medical,
        waiver_media: mediaChoice,
        waiver_excursion: null,
        waiver_signature: signature.trim(),
        waiver_date: new Date().toISOString().split("T")[0],
        parent_user_id: session?.user?.id || null,
        payment_status: price === 0 ? "free" : "paid",
        stripe_payment_intent_id: stripePaymentIntentId || null,
      }).select("id").single();
      if (dbErr) throw dbErr;
      setStep(5);
    } catch (e) {
      setError(e.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function addChild() { if (children.length < 5) setChildren([...children, { name: "", dob: "", allergies: "", medicalNotes: "" }]); }
  function removeChild(i) { setChildren(children.filter((_, idx) => idx !== i)); setChildErrors([]); }
  function updateChild(i, field, val) { setChildren(children.map((c, idx) => idx === i ? { ...c, [field]: val } : c)); setChildErrors([]); }

  const S = {
    page: { minHeight: "100vh", background: CREAM, fontFamily: "'Georgia', serif", color: "#2a2a2a" },
    header: { background: OLIVE_DARK, padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56, position: "sticky", top: 0, zIndex: 100 },
    headerBack: { color: "rgba(255,255,255,0.8)", background: "none", border: "none", cursor: "pointer", fontSize: 14, fontFamily: "'Georgia', serif", padding: 0 },
    headerTitle: { color: "#fff", fontSize: 15, fontWeight: "normal", letterSpacing: "0.04em" },
    hero: { background: `linear-gradient(135deg, ${OLIVE_DARK} 0%, ${TEAL} 100%)`, padding: "36px 24px 28px", textAlign: "center", color: "#fff" },
    heroEyebrow: { fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.65)", marginBottom: 8 },
    heroTitle: { fontSize: 26, fontWeight: "normal", margin: "0 0 8px", lineHeight: 1.2 },
    heroSub: { fontSize: 14, color: "rgba(255,255,255,0.8)", margin: "0 0 16px", lineHeight: 1.6 },
    heroPills: { display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" },
    pill: { background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 20, padding: "4px 12px", fontSize: 12, color: "#fff" },
    card: { background: "#fff", borderRadius: 12, border: `1px solid ${CREAM_DARK}`, padding: 24, marginBottom: 16 },
    sectionLabel: { fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: OLIVE, marginBottom: 16 },
    input: { width: "100%", padding: "11px 14px", border: `1.5px solid ${CREAM_DARK}`, borderRadius: 8, fontSize: 15, fontFamily: "'Georgia', serif", background: "#fff", color: "#2a2a2a", outline: "none", boxSizing: "border-box" },
    label: { fontSize: 13, color: "#555", marginBottom: 6, display: "block" },
    btn: { width: "100%", padding: "15px", background: OLIVE_DARK, color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontFamily: "'Georgia', serif", cursor: "pointer", letterSpacing: "0.08em" },
    btnOutline: { width: "100%", padding: "13px", background: "transparent", color: OLIVE_DARK, border: `1.5px solid ${OLIVE_DARK}`, borderRadius: 10, fontSize: 14, fontFamily: "'Georgia', serif", cursor: "pointer", marginBottom: 10 },
    error: { background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: "12px 16px", color: "#b91c1c", fontSize: 14, marginBottom: 16 },
    fieldError: { fontSize: 12, color: "#b91c1c", marginTop: 4 },
    tierCard: (selected) => ({ border: `2px solid ${selected ? OLIVE : CREAM_DARK}`, borderRadius: 10, padding: "14px 16px", cursor: "pointer", background: selected ? `${OLIVE}10` : "#fff", transition: "all 0.2s", display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }),
    tierBadge: (color) => ({ background: color, color: "#fff", borderRadius: 20, padding: "4px 10px", fontSize: 13, fontWeight: "bold", minWidth: 44, textAlign: "center", flexShrink: 0 }),
    satCard: (selected) => ({ border: `2px solid ${selected ? ORANGE : CREAM_DARK}`, borderRadius: 10, padding: "14px 16px", cursor: "pointer", background: selected ? `${ORANGE}12` : "#fff", transition: "all 0.2s", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }),
    waiverText: { fontSize: 13, color: "#555", lineHeight: 1.6, background: "#fafaf8", border: `1px solid ${CREAM_DARK}`, borderRadius: 8, padding: "12px 14px", marginBottom: 12 },
    checkRow: { display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 8 },
    checkbox: { width: 18, height: 18, accentColor: OLIVE, flexShrink: 0, marginTop: 2, cursor: "pointer" },
    summaryRow: { display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${CREAM_DARK}`, fontSize: 14 },
    confirmIcon: { width: 64, height: 64, borderRadius: "50%", background: `${GREEN}20`, border: `2px solid ${GREEN}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 20px" },
    radioRow: { display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: 8, fontSize: 14 },
  };

  const wrap = (content) => <div style={S.page}>{content}</div>;

  // ── Step 0: Date ──────────────────────────────────────────────────────────
  if (step === 0) return wrap(<>
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
        <span style={S.pill}>Ages 2–6</span>
        <span style={S.pill}>Nosara, Costa Rica</span>
      </div>
    </div>
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "24px 16px" }}>
      <StepBar step={0} total={5} />
      <div style={S.card}>
        <div style={S.sectionLabel}>Choose a Saturday</div>
        {saturdays.map((sat, i) => {
          const selected = selectedDate && localKey(selectedDate) === localKey(sat);
          return (
            <div key={i} style={S.satCard(selected)} onClick={() => setSelectedDate(sat)}>
              <div>
                <div style={{ fontWeight: "bold", fontSize: 15 }}>{formatDate(sat)}</div>
                <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>8:00 – 11:00 am · Harmony Co-Op Playground</div>
              </div>
              <div style={{ width: 22, height: 22, borderRadius: "50%", border: `2px solid ${selected ? ORANGE : CREAM_DARK}`, background: selected ? ORANGE : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {selected && <span style={{ color: "#fff", fontSize: 12 }}>✓</span>}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ ...S.card, background: `${OLIVE_DARK}08` }}>
        <div style={S.sectionLabel}>Pricing</div>
        {TIERS.map((t) => (
          <div key={t.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 14, padding: "4px 0" }}>
            <span style={{ color: "#444" }}>{t.label}</span>
            <span style={{ fontWeight: "bold", color: t.price === 0 ? GREEN : "#2a2a2a" }}>{t.price === 0 ? "Free" : `$${t.price}`}</span>
          </div>
        ))}
        <div style={{ fontSize: 12, color: "#999", marginTop: 10, borderTop: `1px solid ${CREAM_DARK}`, paddingTop: 10 }}>
          Ages 2–6 only · Codes required for Harmony Member, Wild Child Family, and Costa Rican Family tiers
        </div>
        <div style={{ fontSize: 11, color: "#bbb", marginTop: 6, fontStyle: "italic" }}>Our pricing tiers run on the honour system. Please be a truthful citizen when selecting your tier — gracias 🌱</div>
      </div>
      {error && <div style={S.error}>{error}</div>}
      <button style={S.btn} onClick={handleNext}>Continue →</button>
    </div>
  </>);

  // ── Step 1: Children ──────────────────────────────────────────────────────
  if (step === 1) return wrap(<>
    <div style={S.header}>
      <button style={S.headerBack} onClick={() => setStep(0)}>← Back</button>
      <span style={S.headerTitle}>Who's coming?</span>
      <div style={{ width: 60 }} />
    </div>
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "24px 16px" }}>
      <StepBar step={1} total={5} />
      <div style={{ ...S.card, background: `${TEAL}10`, border: `1px solid ${TEAL}30`, marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: TEAL }}>📅 <strong>{selectedDate && formatDate(selectedDate)}</strong> · 8:00 – 11:00 am</div>
      </div>
      <div style={{ ...S.card, background: `${ORANGE}08`, border: `1px solid ${ORANGE}30`, marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: ORANGE }}>⚠️ Children must be between <strong>2 and 6 years old</strong> to attend.</div>
      </div>
      <div style={S.card}>
        <div style={S.sectionLabel}>Children attending</div>
        {children.map((child, i) => (
          <div key={i} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: i < children.length - 1 ? `1px solid ${CREAM_DARK}` : "none" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: "#666" }}>Child {i + 1}</span>
              {children.length > 1 && <button onClick={() => removeChild(i)} style={{ background: "none", border: "none", color: "#999", cursor: "pointer", fontSize: 18, padding: 0 }}>×</button>}
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={S.label}>Child's name</label>
              <input style={S.input} value={child.name} onChange={(e) => updateChild(i, "name", e.target.value)} placeholder="First name" />
            </div>
            <div>
              <label style={S.label}>Date of birth</label>
              <input style={S.input} type="date" value={child.dob} onChange={(e) => updateChild(i, "dob", e.target.value)} />
              {child.dob && (() => {
                const age = calcAge(child.dob);
                if (age < 2) return <div style={S.fieldError}>Must be at least 2 years old.</div>;
                if (age > 6) return <div style={S.fieldError}>Age limit is 6 years old (this child is {age}).</div>;
                return <div style={{ fontSize: 12, color: GREEN, marginTop: 4 }}>✓ Age {age} — eligible</div>;
              })()}
              {childErrors[i] && !child.dob && <div style={S.fieldError}>{childErrors[i]}</div>}
            </div>
            <div style={{ marginTop: 10 }}>
              <label style={S.label}>Allergies (optional)</label>
              <input style={S.input} value={child.allergies} onChange={(e) => updateChild(i, "allergies", e.target.value)} placeholder="Any food or environmental allergies…" />
            </div>
            <div style={{ marginTop: 10 }}>
              <label style={S.label}>Additional medical notes (optional)</label>
              <input style={S.input} value={child.medicalNotes} onChange={(e) => updateChild(i, "medicalNotes", e.target.value)} placeholder="e.g. asthma, epi-pen required, seizure history…" />
            </div>
          </div>
        ))}
        {children.length < 5 && (
          <button onClick={addChild} style={{ ...S.btnOutline, width: "auto", padding: "8px 16px", fontSize: 13, marginBottom: 0 }}>+ Add another child</button>
        )}
      </div>
      {error && <div style={S.error}>{error}</div>}
      <button style={S.btn} onClick={handleNext}>Continue →</button>
    </div>
  </>);

  // ── Step 2: Contact + Tier ────────────────────────────────────────────────
  if (step === 2) return wrap(<>
    <div style={S.header}>
      <button style={S.headerBack} onClick={() => setStep(1)}>← Back</button>
      <span style={S.headerTitle}>Your details</span>
      <div style={{ width: 60 }} />
    </div>
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "24px 16px" }}>
      <StepBar step={2} total={5} />
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
            <div style={S.tierCard(tier === t.id)} onClick={() => { setTier(t.id); setTierCode(""); setTierCodeError(""); setTierCodeValid(false); }}>
              <div style={S.tierBadge(t.badgeColor)}>{t.badge}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "bold", fontSize: 15 }}>{t.label}</div>
                <div style={{ fontSize: 12, color: "#777", marginTop: 2 }}>{t.description}</div>
              </div>
              <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${tier === t.id ? OLIVE : CREAM_DARK}`, background: tier === t.id ? OLIVE : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {tier === t.id && <span style={{ color: "#fff", fontSize: 11 }}>✓</span>}
              </div>
            </div>
            {tier === t.id && t.requiresCode && (
              <div style={{ marginBottom: 12, marginTop: -4 }}>
                <label style={S.label}>{t.id === "harmony" ? "Member code" : t.id === "wildchild" ? "Wild Child family code" : "Costa Rican local code"}</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    style={{ ...S.input, borderColor: tierCodeValid ? GREEN : tierCodeError ? "#f87171" : CREAM_DARK }}
                    value={tierCode}
                    onChange={(e) => { setTierCode(e.target.value); setTierCodeError(""); setTierCodeValid(false); }}
                    placeholder={t.id === "harmony" ? "e.g. harmonymember" : t.id === "wildchild" ? "Your Wild Child code" : "localharmony"}
                  />
                  <button onClick={() => validateTierCode(t.id, tierCode)} style={{ padding: "11px 14px", background: OLIVE_DARK, color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontFamily: "'Georgia', serif", whiteSpace: "nowrap" }}>Verify</button>
                </div>
                {tierCodeError && <div style={{ fontSize: 12, color: "#b91c1c", marginTop: 4 }}>{tierCodeError}</div>}
                {tierCodeValid && <div style={{ fontSize: 12, color: GREEN, marginTop: 4 }}>✓ Code verified</div>}
              </div>
            )}
          </div>
        ))}
      </div>

      {error && <div style={S.error}>{error}</div>}
      <button style={S.btn} onClick={handleNext}>Continue →</button>
    </div>
  </>);

  // ── Step 3: Payment ───────────────────────────────────────────────────────
  if (step === 3 && price > 0) return (
    <Elements stripe={stripePromise}>
      <HarmonyPaymentStep
        price={price}
        selectedDate={selectedDate}
        selectedTier={selectedTier}
        childrenList={children}
        nameOnCard={nameOnCard}
        setNameOnCard={setNameOnCard}
        paying={paying}
        payError={payError}
        error={error}
        onBack={() => setStep(2)}
        onPay={handlePayment}
      />
    </Elements>
  );
  if (step === 4) return wrap(<>
    <div style={S.header}>
      <button style={S.headerBack} onClick={() => setStep(price > 0 ? 3 : 2)}>← Back</button>
      <span style={S.headerTitle}>Waiver & Consent</span>
      <div style={{ width: 60 }} />
    </div>
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "24px 16px" }}>
      <StepBar step={4} total={5} />

      {/* Liability */}
      <div style={S.card}>
        <div style={{ fontWeight: "bold", marginBottom: 10, color: OLIVE_DARK, fontSize: 14 }}>1. Assumption of Risk & Release of Liability</div>
        <div style={S.waiverText}>{WAIVER_SECTIONS[0].text}</div>
        <div style={S.checkRow}>
          <input type="checkbox" style={S.checkbox} checked={waivers.liability} onChange={(e) => setWaivers({ ...waivers, liability: e.target.checked })} id="w-liability" />
          <label htmlFor="w-liability" style={{ fontSize: 14, cursor: "pointer", lineHeight: 1.5 }}>I agree to the Assumption of Risk and Release of Liability.</label>
        </div>
      </div>

      {/* Medical */}
      <div style={S.card}>
        <div style={{ fontWeight: "bold", marginBottom: 10, color: OLIVE_DARK, fontSize: 14 }}>2. Medical & Emergency Consent</div>
        <div style={S.waiverText}>{WAIVER_SECTIONS[1].text}</div>
        <div style={S.checkRow}>
          <input type="checkbox" style={S.checkbox} checked={waivers.medical} onChange={(e) => setWaivers({ ...waivers, medical: e.target.checked })} id="w-medical" />
          <label htmlFor="w-medical" style={{ fontSize: 14, cursor: "pointer", lineHeight: 1.5 }}>I agree to Medical & Emergency Care Consent.</label>
        </div>
      </div>

      {/* Media */}
      <div style={S.card}>
        <div style={{ fontWeight: "bold", marginBottom: 10, color: OLIVE_DARK, fontSize: 14 }}>3. Media Release (Photos & Videos)</div>
        <div style={S.waiverText}>{WAIVER_SECTIONS[2].text}</div>
        <label style={S.radioRow}><input type="radio" name="media" checked={mediaChoice === true} onChange={() => setMediaChoice(true)} style={{ accentColor: OLIVE }} /> YES – I grant permission for photos/videos of my child.</label>
        <label style={S.radioRow}><input type="radio" name="media" checked={mediaChoice === false} onChange={() => setMediaChoice(false)} style={{ accentColor: OLIVE }} /> NO – I do NOT grant permission.</label>
      </div>


      {/* Signature */}
      <div style={S.card}>
        <div style={S.sectionLabel}>Digital signature</div>
        <div style={{ marginBottom: 8, fontSize: 13, color: "#666" }}>
          <strong>{parentName}</strong><br />
          {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </div>
        <label style={S.label}>Type your full name as your digital signature</label>
        <input style={S.input} value={signature} onChange={(e) => setSignature(e.target.value)} placeholder="Your full name" />
      </div>

      {error && <div style={S.error}>{error}</div>}
      <button style={{ ...S.btn, background: submitting ? SAGE : OLIVE_DARK }} onClick={handleNext} disabled={submitting}>
        {submitting ? "Confirming booking…" : "Confirm booking →"}
      </button>
    </div>
  </>);

  // ── Step 5: Confirmation ──────────────────────────────────────────────────
  if (step === 5) return wrap(<>
    <div style={S.header}>
      <div style={{ width: 60 }} />
      <span style={S.headerTitle}>Booking confirmed</span>
      <div style={{ width: 60 }} />
    </div>
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "32px 16px", textAlign: "center" }}>
      <div style={S.confirmIcon}>🌿</div>
      <h2 style={{ fontSize: 24, color: OLIVE_DARK, marginBottom: 8, fontWeight: "normal" }}>See you Saturday!</h2>
      <p style={{ color: "#666", fontSize: 15, lineHeight: 1.6, marginBottom: 28 }}>
        Your spot is confirmed. A confirmation has been sent to <strong>{parentEmail}</strong>.
      </p>
      <div style={{ ...S.card, textAlign: "left" }}>
        <div style={S.sectionLabel}>Booking details</div>
        <div style={S.summaryRow}><span style={{ color: "#777" }}>Date</span><span style={{ fontWeight: "bold" }}>{selectedDate && formatDate(selectedDate)}</span></div>
        <div style={S.summaryRow}><span style={{ color: "#777" }}>Time</span><span>8:00 – 11:00 am</span></div>
        <div style={S.summaryRow}><span style={{ color: "#777" }}>Location</span><span>Harmony Co-Op Playground, Nosara</span></div>
        <div style={S.summaryRow}><span style={{ color: "#777" }}>Children</span><span>{children.filter(c => c.name).map(c => c.name).join(", ")}</span></div>
        <div style={S.summaryRow}><span style={{ color: "#777" }}>Tier</span><span>{selectedTier?.label}</span></div>
        <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 12, fontSize: 15 }}>
          <span style={{ color: "#777" }}>Amount</span>
          <span style={{ fontWeight: "bold", color: price === 0 ? GREEN : OLIVE_DARK }}>{price === 0 ? "Free" : `$${price}`}</span>
        </div>
      </div>
      <div style={{ ...S.card, background: `${TEAL}10`, border: `1px solid ${TEAL}30`, textAlign: "left" }}>
        <div style={{ fontWeight: "bold", marginBottom: 8, color: TEAL, fontSize: 14 }}>What to bring</div>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#555", lineHeight: 1.8 }}>
          <li>Comfortable clothing that can get dirty</li>
          <li>Sun hat & sunscreen</li>
          <li>Closed-toe shoes</li>
          <li>One change of clothes</li>
          <li>Reusable water bottle</li>
          <li>Mosquito spray (rainy season)</li>
        </ul>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {session ? <button style={S.btn} onClick={() => navigate("/portal")}>Go to my portal →</button> : <button style={S.btn} onClick={() => navigate("/")}>Back to home →</button>}
        <button style={S.btnOutline} onClick={() => { setStep(0); setSelectedDate(null); setChildren([{ name: "", dob: "" }]); setTier(null); setTierCode(""); setTierCodeValid(false); }}>Book another Saturday</button>
      </div>
    </div>
  </>);

  return null;
}
