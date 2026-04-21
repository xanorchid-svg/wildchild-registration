import { useState, useEffect } from "react";

const TEAL = "#3d7d8a";
const TEAL_DARK = "#2c5f6a";
const TEAL_LIGHT = "#e8f4f6";
const TEAL_MID = "#5a9aaa";
const CREAM = "#f7f2e8";
const CREAM_DARK = "#e8dfc8";
const TEXT_DARK = "#1a2e32";
const TEXT_MID = "#3d5a5f";
const TEXT_LIGHT = "#6b8c91";
const SAND = "#c8a96e";

const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="200" viewBox="0 0 810 1012.5" preserveAspectRatio="xMidYMid meet" version="1.2"><defs><clipPath id="e778370935"><path d="M 91.144531 361.730469 L 793.546875 361.730469 L 793.546875 465.929688 L 91.144531 465.929688 Z M 91.144531 361.730469 "/></clipPath></defs><g id="5a52d61b0e"><g clip-rule="nonzero" clip-path="url(#e778370935)"><g mask="url(#5587f855ec)" transform="matrix(0.543135,0,0,0.546605,91.143348,361.444788)"><image width="1296" xlink:href="data:image/png;base64,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...` + `" height="192" preserveAspectRatio="xMidYMid meet"/></g></g></g></svg>`;

const PROGRAMS = [
  {
    id: "little-wild-ones",
    name: "Little Wild Ones",
    ageRange: "Ages 1–4",
    schedule: "3 or 5 days a week · 9:00am–3:00pm",
    description:
      "A gentle, nurturing program for our youngest explorers. Little Wild Ones focuses on sensory play, nature connection, creative movement, storytelling, music, and social-emotional development. Through free play and soft structure, children build confidence, coordination, language, and a sense of belonging—learning at their own pace in a loving, nature-based environment.",
    color: TEAL,
    accent: "#2c5f6a",
    emoji: "🌿",
  },
  {
    id: "wild-explorers",
    name: "Wild Explorers",
    ageRange: "Ages 5–9",
    schedule: "3 or 5 days a week · 9:00am–3:00pm",
    description:
      "Wild Explorers is a curiosity-led program that blends outdoor learning, creative expression, mindfulness, movement, and academics. Children engage in hands-on learning across math, reading, writing, geography, and science, while developing critical thinking, collaboration, and independence. Learning is experiential, playful, and rooted in nature, curiosity, and community.",
    color: "#5a7a4a",
    accent: "#3d5c30",
    emoji: "🦋",
  },
];

const DAY_OPTIONS = [
  { value: 3, label: "3 Days/Week", sublabel: "Mon · Wed · Fri", price: 650 },
  { value: 4, label: "4 Days/Week", sublabel: "Mon · Tue · Wed · Thu", price: 800 },
  { value: 5, label: "5 Days/Week", sublabel: "Mon – Fri", price: 950 },
];

const LUNCH_PRICE = 120;

const STEPS = ["Program", "Child Info", "Schedule", "Payment", "Waiver", "Confirmation"];

const styles = {
  container: {
    fontFamily: "'Georgia', 'Times New Roman', serif",
    background: CREAM,
    minHeight: "100vh",
    color: TEXT_DARK,
  },
  header: {
    background: TEAL,
    padding: "20px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    gap: "8px",
  },
  headerTitle: {
    color: "#fff",
    fontSize: "13px",
    letterSpacing: "2px",
    textTransform: "uppercase",
    fontFamily: "'Georgia', serif",
    fontWeight: 400,
    margin: 0,
    opacity: 0.9,
  },
  stepBar: {
    display: "flex",
    background: TEAL_DARK,
    overflowX: "auto",
  },
  stepItem: (active, done) => ({
    flex: 1,
    padding: "10px 4px",
    textAlign: "center",
    fontSize: "11px",
    letterSpacing: "0.5px",
    color: active ? "#fff" : done ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.4)",
    borderBottom: active ? `2px solid ${SAND}` : "2px solid transparent",
    fontFamily: "'Georgia', serif",
    whiteSpace: "nowrap",
    cursor: done ? "pointer" : "default",
    transition: "all 0.2s",
  }),
  content: {
    maxWidth: "640px",
    margin: "0 auto",
    padding: "32px 20px 60px",
  },
  sectionTitle: {
    fontSize: "22px",
    color: TEXT_DARK,
    fontWeight: 400,
    marginBottom: "6px",
    fontFamily: "'Georgia', serif",
  },
  sectionSub: {
    fontSize: "14px",
    color: TEXT_MID,
    marginBottom: "28px",
    lineHeight: 1.5,
  },
  programCard: (selected, color) => ({
    background: selected ? color : "#fff",
    border: `1.5px solid ${selected ? color : CREAM_DARK}`,
    borderRadius: "12px",
    padding: "24px",
    marginBottom: "16px",
    cursor: "pointer",
    transition: "all 0.25s",
    boxShadow: selected ? "0 4px 20px rgba(0,0,0,0.12)" : "none",
  }),
  programName: (selected) => ({
    fontSize: "13px",
    letterSpacing: "1.5px",
    textTransform: "uppercase",
    color: selected ? "rgba(255,255,255,0.8)" : TEXT_LIGHT,
    fontFamily: "'Georgia', serif",
    marginBottom: "4px",
  }),
  programAge: (selected) => ({
    fontSize: "28px",
    fontWeight: 400,
    color: selected ? "#fff" : TEXT_DARK,
    fontFamily: "'Georgia', serif",
    marginBottom: "6px",
  }),
  programSchedule: (selected) => ({
    fontSize: "13px",
    color: selected ? "rgba(255,255,255,0.75)" : TEXT_LIGHT,
    marginBottom: "14px",
    fontFamily: "'Georgia', serif",
  }),
  programDesc: (selected) => ({
    fontSize: "14px",
    lineHeight: 1.7,
    color: selected ? "rgba(255,255,255,0.9)" : TEXT_MID,
    fontFamily: "'Georgia', serif",
  }),
  input: {
    width: "100%",
    padding: "12px 14px",
    border: `1px solid ${CREAM_DARK}`,
    borderRadius: "8px",
    fontSize: "15px",
    fontFamily: "'Georgia', serif",
    background: "#fff",
    color: TEXT_DARK,
    boxSizing: "border-box",
    outline: "none",
    marginBottom: "16px",
    transition: "border-color 0.2s",
  },
  label: {
    display: "block",
    fontSize: "12px",
    letterSpacing: "1px",
    textTransform: "uppercase",
    color: TEXT_LIGHT,
    marginBottom: "6px",
    fontFamily: "'Georgia', serif",
  },
  dayCard: (selected) => ({
    background: selected ? TEAL : "#fff",
    border: `1.5px solid ${selected ? TEAL : CREAM_DARK}`,
    borderRadius: "10px",
    padding: "18px 20px",
    cursor: "pointer",
    flex: 1,
    textAlign: "center",
    transition: "all 0.2s",
    minWidth: "100px",
  }),
  dayLabel: (selected) => ({
    fontSize: "15px",
    fontWeight: 400,
    color: selected ? "#fff" : TEXT_DARK,
    fontFamily: "'Georgia', serif",
    marginBottom: "4px",
  }),
  daySub: (selected) => ({
    fontSize: "12px",
    color: selected ? "rgba(255,255,255,0.75)" : TEXT_LIGHT,
    fontFamily: "'Georgia', serif",
    marginBottom: "8px",
  }),
  dayPrice: (selected) => ({
    fontSize: "16px",
    color: selected ? "#fff" : TEAL,
    fontFamily: "'Georgia', serif",
  }),
  lunchCard: (selected) => ({
    background: selected ? "#5a7a4a" : "#fff",
    border: `1.5px solid ${selected ? "#5a7a4a" : CREAM_DARK}`,
    borderRadius: "10px",
    padding: "20px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    transition: "all 0.2s",
    marginTop: "20px",
  }),
  summaryBox: {
    background: "#fff",
    border: `1px solid ${CREAM_DARK}`,
    borderRadius: "10px",
    padding: "20px",
    marginBottom: "24px",
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "14px",
    padding: "6px 0",
    borderBottom: `1px solid ${CREAM_DARK}`,
    fontFamily: "'Georgia', serif",
    color: TEXT_MID,
  },
  summaryTotal: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "17px",
    padding: "10px 0 0",
    fontFamily: "'Georgia', serif",
    color: TEXT_DARK,
    fontWeight: 400,
  },
  btn: (variant = "primary") => ({
    background: variant === "primary" ? TEAL : "transparent",
    color: variant === "primary" ? "#fff" : TEXT_MID,
    border: variant === "primary" ? "none" : `1px solid ${CREAM_DARK}`,
    borderRadius: "8px",
    padding: "14px 28px",
    fontSize: "14px",
    letterSpacing: "1px",
    fontFamily: "'Georgia', serif",
    cursor: "pointer",
    transition: "background 0.2s",
    textTransform: "uppercase",
  }),
  waiverSection: {
    marginBottom: "24px",
    background: "#fff",
    border: `1px solid ${CREAM_DARK}`,
    borderRadius: "10px",
    padding: "20px",
  },
  waiverTitle: {
    fontSize: "13px",
    letterSpacing: "1px",
    textTransform: "uppercase",
    color: TEXT_LIGHT,
    marginBottom: "10px",
    fontFamily: "'Georgia', serif",
  },
  waiverText: {
    fontSize: "13px",
    lineHeight: 1.7,
    color: TEXT_MID,
    fontFamily: "'Georgia', serif",
    marginBottom: "14px",
  },
  checkRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    marginBottom: "10px",
  },
  checkLabel: {
    fontSize: "13px",
    color: TEXT_DARK,
    fontFamily: "'Georgia', serif",
    lineHeight: 1.5,
  },
  errorText: {
    color: "#c0392b",
    fontSize: "13px",
    fontFamily: "'Georgia', serif",
    marginBottom: "12px",
  },
};

export default function WildChildRegistration() {
  const [step, setStep] = useState(0);
  const [program, setProgram] = useState(null);
  const [child, setChild] = useState({ firstName: "", lastName: "", dob: "", allergies: "", notes: "" });
  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [days, setDays] = useState(null);
  const [lunch, setLunch] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  const [cardNum, setCardNum] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [waiver, setWaiver] = useState({ liability: false, medical: false, mediaYes: false, mediaNo: false, excursionYes: false, excursionNo: false });
  const [signature, setSignature] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const selectedProgram = PROGRAMS.find((p) => p.id === program);
  const selectedDays = DAY_OPTIONS.find((d) => d.value === days);
  const total = selectedDays ? selectedDays.price + (lunch ? LUNCH_PRICE : 0) : 0;

  const validate = () => {
    const e = {};
    if (step === 0 && !program) e.program = "Please select a program.";
    if (step === 1) {
      if (!child.firstName.trim()) e.firstName = "Required";
      if (!child.lastName.trim()) e.lastName = "Required";
      if (!child.dob) e.dob = "Required";
      if (!parentName.trim()) e.parentName = "Required";
      if (!parentEmail.trim()) e.parentEmail = "Required";
    }
    if (step === 2 && !days) e.days = "Please select number of days.";
    if (step === 3) {
      if (!cardNum.trim() || cardNum.replace(/\s/g, "").length < 16) e.cardNum = "Enter a valid card number";
      if (!cardExp.trim()) e.cardExp = "Required";
      if (!cardCvc.trim()) e.cardCvc = "Required";
    }
    if (step === 4) {
      if (!waiver.liability) e.liability = "Required";
      if (!waiver.medical) e.medical = "Required";
      if (!waiver.mediaYes && !waiver.mediaNo) e.media = "Please select one";
      if (!waiver.excursionYes && !waiver.excursionNo) e.excursion = "Please select one";
      if (!signature.trim()) e.signature = "Signature required";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (!validate()) return;
    if (step === 4) {
      handleSubmit();
      return;
    }
    setStep((s) => s + 1);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1800));
    setSubmitting(false);
    setStep(5);
    setSubmitted(true);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" width="160" height="64">
          <text x="50%" y="30" textAnchor="middle" fontFamily="Georgia, serif" fontSize="11" fill="rgba(255,255,255,0.7)" letterSpacing="3">WILD CHILD</text>
          <text x="50%" y="52" textAnchor="middle" fontFamily="Georgia, serif" fontSize="22" fill="#fff" fontWeight="400">Nosara</text>
          <text x="50%" y="68" textAnchor="middle" fontFamily="Georgia, serif" fontSize="9" fill="rgba(255,255,255,0.6)" letterSpacing="2">PLAYGARDEN & WILDSCHOOLING</text>
        </svg>
        <p style={styles.headerTitle}>Enrollment Registration</p>
      </div>

      <div style={styles.stepBar}>
        {STEPS.map((s, i) => (
          <div
            key={s}
            style={styles.stepItem(i === step, i < step)}
            onClick={() => i < step && setStep(i)}
          >
            {i < step ? "✓ " : ""}{s}
          </div>
        ))}
      </div>

      <div style={styles.content}>
        {step === 0 && (
          <>
            <h2 style={styles.sectionTitle}>Choose a Program</h2>
            <p style={styles.sectionSub}>Select the program that best fits your child's age and needs.</p>
            {errors.program && <p style={styles.errorText}>{errors.program}</p>}
            {PROGRAMS.map((p) => (
              <div key={p.id} style={styles.programCard(program === p.id, p.color)} onClick={() => setProgram(p.id)}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                  <p style={styles.programName(program === p.id)}>{p.name}</p>
                  <span style={{ fontSize: "24px" }}>{p.emoji}</span>
                </div>
                <p style={styles.programAge(program === p.id)}>{p.ageRange}</p>
                <p style={styles.programSchedule(program === p.id)}>{p.schedule}</p>
                <p style={styles.programDesc(program === p.id)}>{p.description}</p>
                {program === p.id && (
                  <div style={{ marginTop: "16px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: p.color }} />
                    </div>
                    <span style={{ color: "#fff", fontSize: "13px", fontFamily: "Georgia, serif" }}>Selected</span>
                  </div>
                )}
              </div>
            ))}
          </>
        )}

        {step === 1 && (
          <>
            <h2 style={styles.sectionTitle}>Child & Family Information</h2>
            <p style={styles.sectionSub}>Tell us about your child and how to reach you.</p>

            <p style={{ ...styles.label, marginTop: "4px" }}>Child's First Name</p>
            <input style={styles.input} value={child.firstName} onChange={(e) => setChild({ ...child, firstName: e.target.value })} placeholder="First name" />
            {errors.firstName && <p style={{ ...styles.errorText, marginTop: "-12px" }}>{errors.firstName}</p>}

            <p style={styles.label}>Child's Last Name</p>
            <input style={styles.input} value={child.lastName} onChange={(e) => setChild({ ...child, lastName: e.target.value })} placeholder="Last name" />

            <p style={styles.label}>Date of Birth</p>
            <input style={styles.input} type="date" value={child.dob} onChange={(e) => setChild({ ...child, dob: e.target.value })} />
            {errors.dob && <p style={{ ...styles.errorText, marginTop: "-12px" }}>{errors.dob}</p>}

            <p style={styles.label}>Allergies or Dietary Notes</p>
            <input style={styles.input} value={child.allergies} onChange={(e) => setChild({ ...child, allergies: e.target.value })} placeholder="None, or describe..." />

            <p style={styles.label}>Anything else we should know about your child?</p>
            <textarea style={{ ...styles.input, height: "80px", resize: "vertical" }} value={child.notes} onChange={(e) => setChild({ ...child, notes: e.target.value })} placeholder="Optional notes..." />

            <div style={{ height: "1px", background: CREAM_DARK, margin: "8px 0 24px" }} />
            <p style={{ fontSize: "16px", color: TEXT_DARK, fontFamily: "Georgia, serif", marginBottom: "16px" }}>Parent / Guardian</p>

            <p style={styles.label}>Full Name</p>
            <input style={styles.input} value={parentName} onChange={(e) => setParentName(e.target.value)} placeholder="Your full name" />
            {errors.parentName && <p style={{ ...styles.errorText, marginTop: "-12px" }}>{errors.parentName}</p>}

            <p style={styles.label}>Email Address</p>
            <input style={styles.input} type="email" value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} placeholder="your@email.com" />
            {errors.parentEmail && <p style={{ ...styles.errorText, marginTop: "-12px" }}>{errors.parentEmail}</p>}

            <p style={styles.label}>Phone / WhatsApp</p>
            <input style={styles.input} value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} placeholder="+1 555 000 0000" />
          </>
        )}

        {step === 2 && (
          <>
            <h2 style={styles.sectionTitle}>Choose Your Schedule</h2>
            <p style={styles.sectionSub}>How many days per week will {child.firstName || "your child"} attend?</p>
            {errors.days && <p style={styles.errorText}>{errors.days}</p>}

            <div style={{ display: "flex", gap: "12px", marginBottom: "8px" }}>
              {DAY_OPTIONS.map((d) => (
                <div key={d.value} style={styles.dayCard(days === d.value)} onClick={() => setDays(d.value)}>
                  <p style={styles.dayLabel(days === d.value)}>{d.label}</p>
                  <p style={styles.daySub(days === d.value)}>{d.sublabel}</p>
                  <p style={styles.dayPrice(days === d.value)}>${d.price}/mo</p>
                </div>
              ))}
            </div>

            <div style={styles.lunchCard(lunch)} onClick={() => setLunch(!lunch)}>
              <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: lunch ? "rgba(255,255,255,0.2)" : TEAL_LIGHT, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0 }}>
                🥗
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "15px", color: lunch ? "#fff" : TEXT_DARK, fontFamily: "Georgia, serif", margin: "0 0 3px" }}>Add Lunch Program</p>
                <p style={{ fontSize: "13px", color: lunch ? "rgba(255,255,255,0.75)" : TEXT_LIGHT, fontFamily: "Georgia, serif", margin: 0, lineHeight: 1.4 }}>Fresh daily meals prepared by our chef. Local, organic, and nourishing. +$120/mo</p>
              </div>
              <div style={{ width: "22px", height: "22px", borderRadius: "50%", border: `2px solid ${lunch ? "#fff" : CREAM_DARK}`, background: lunch ? "#fff" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {lunch && <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#5a7a4a" }} />}
              </div>
            </div>

            {days && (
              <div style={{ ...styles.summaryBox, marginTop: "24px" }}>
                <p style={{ fontSize: "12px", letterSpacing: "1px", textTransform: "uppercase", color: TEXT_LIGHT, marginBottom: "12px", fontFamily: "Georgia, serif" }}>Monthly Summary</p>
                <div style={styles.summaryRow}><span>{selectedProgram?.name}</span><span style={{ color: TEXT_DARK }}>${selectedDays?.price}/mo</span></div>
                {lunch && <div style={styles.summaryRow}><span>Lunch Program</span><span style={{ color: TEXT_DARK }}>$120/mo</span></div>}
                <div style={styles.summaryTotal}><span>Total</span><span style={{ color: TEAL }}>${total}/mo</span></div>
              </div>
            )}
          </>
        )}

        {step === 3 && (
          <>
            <h2 style={styles.sectionTitle}>Payment</h2>
            <p style={styles.sectionSub}>Secure enrollment payment. Your first month is charged today.</p>

            <div style={{ ...styles.summaryBox, marginBottom: "28px" }}>
              <div style={styles.summaryRow}><span>{selectedProgram?.name}</span><span style={{ color: TEXT_DARK }}>${selectedDays?.price}/mo</span></div>
              {lunch && <div style={styles.summaryRow}><span>Lunch Program</span><span style={{ color: TEXT_DARK }}>$120/mo</span></div>}
              <div style={styles.summaryTotal}><span>Due Today</span><span style={{ color: TEAL }}>${total}</span></div>
            </div>

            <div style={{ background: TEAL_LIGHT, border: `1px solid ${TEAL_MID}`, borderRadius: "8px", padding: "12px 16px", marginBottom: "24px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
              <span style={{ fontSize: "16px" }}>🔒</span>
              <p style={{ fontSize: "13px", color: TEAL_DARK, fontFamily: "Georgia, serif", margin: 0, lineHeight: 1.5 }}>
                This is a demo registration form. In production, this connects to Stripe for secure payment processing. Please enter any test card details to continue.
              </p>
            </div>

            <p style={styles.label}>Card Number</p>
            <input style={styles.input} value={cardNum} onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "").slice(0, 16);
              setCardNum(v.replace(/(.{4})/g, "$1 ").trim());
            }} placeholder="1234 5678 9012 3456" maxLength={19} />
            {errors.cardNum && <p style={{ ...styles.errorText, marginTop: "-12px" }}>{errors.cardNum}</p>}

            <div style={{ display: "flex", gap: "16px" }}>
              <div style={{ flex: 1 }}>
                <p style={styles.label}>Expiry</p>
                <input style={styles.input} value={cardExp} onChange={(e) => {
                  let v = e.target.value.replace(/\D/g, "").slice(0, 4);
                  if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2);
                  setCardExp(v);
                }} placeholder="MM/YY" maxLength={5} />
                {errors.cardExp && <p style={{ ...styles.errorText, marginTop: "-12px" }}>{errors.cardExp}</p>}
              </div>
              <div style={{ flex: 1 }}>
                <p style={styles.label}>CVC</p>
                <input style={styles.input} value={cardCvc} onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="123" maxLength={4} />
                {errors.cardCvc && <p style={{ ...styles.errorText, marginTop: "-12px" }}>{errors.cardCvc}</p>}
              </div>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h2 style={styles.sectionTitle}>Waiver & Consent</h2>
            <p style={styles.sectionSub}>Please read and complete each section carefully.</p>

            <div style={styles.waiverSection}>
              <p style={styles.waiverTitle}>1. Assumption of Risk & Release of Liability</p>
              <p style={styles.waiverText}>
                I understand that Wild Child Playgarden & Wildschooling Nosara is a nature-based, outdoor educational program. Activities may include outdoor play, gardening, forest and beach exploration, physical movement, water play, use of natural materials, and exposure to uneven terrain, insects, plants, wildlife, weather conditions, sun, heat, and rain.
              </p>
              <p style={styles.waiverText}>
                I acknowledge that participation involves inherent risks that cannot be completely eliminated without changing the nature of the program. I knowingly and voluntarily assume all risks, both known and unknown. To the fullest extent permitted by law, I release, waive, discharge, and hold harmless Wild Child Playgarden & Wildschooling Nosara, its founders, directors, teachers, staff, and affiliates from any and all claims, liabilities, damages, or expenses arising from my child's participation.
              </p>
              <div style={styles.checkRow}>
                <input type="checkbox" id="liability" checked={waiver.liability} onChange={(e) => setWaiver({ ...waiver, liability: e.target.checked })} style={{ marginTop: "3px", accentColor: TEAL }} />
                <label htmlFor="liability" style={styles.checkLabel}>I agree to the Assumption of Risk and Release of Liability.</label>
              </div>
              {errors.liability && <p style={styles.errorText}>{errors.liability}</p>}
            </div>

            <div style={styles.waiverSection}>
              <p style={styles.waiverTitle}>2. Medical & Emergency Consent</p>
              <p style={styles.waiverText}>
                I authorize Wild Child Playgarden & Wildschooling Nosara to seek emergency medical care for my child if I cannot be reached. I consent to examination, diagnosis, treatment, and/or hospital care deemed necessary by a licensed physician for my child's health and safety. All medical expenses are my responsibility.
              </p>
              <div style={styles.checkRow}>
                <input type="checkbox" id="medical" checked={waiver.medical} onChange={(e) => setWaiver({ ...waiver, medical: e.target.checked })} style={{ marginTop: "3px", accentColor: TEAL }} />
                <label htmlFor="medical" style={styles.checkLabel}>I agree to Medical & Emergency Care Consent.</label>
              </div>
              {errors.medical && <p style={styles.errorText}>{errors.medical}</p>}
            </div>

            <div style={styles.waiverSection}>
              <p style={styles.waiverTitle}>3. Media Release (Photos & Videos)</p>
              <p style={styles.waiverText}>
                Photographs and/or videos may be taken of your child during program activities. If permission is granted, these may be used for educational documentation and promotional purposes, including the Wild Child website and social media. Children's names will not be used publicly without additional consent.
              </p>
              <div style={styles.checkRow}>
                <input type="radio" id="mediaYes" name="media" checked={waiver.mediaYes} onChange={() => setWaiver({ ...waiver, mediaYes: true, mediaNo: false })} style={{ marginTop: "3px", accentColor: TEAL }} />
                <label htmlFor="mediaYes" style={styles.checkLabel}>YES – I grant permission for photos/videos of my child to be taken and used.</label>
              </div>
              <div style={styles.checkRow}>
                <input type="radio" id="mediaNo" name="media" checked={waiver.mediaNo} onChange={() => setWaiver({ ...waiver, mediaYes: false, mediaNo: true })} style={{ marginTop: "3px", accentColor: TEAL }} />
                <label htmlFor="mediaNo" style={styles.checkLabel}>NO – I do not grant permission for photos/videos of my child.</label>
              </div>
              {errors.media && <p style={styles.errorText}>{errors.media}</p>}
            </div>

            <div style={styles.waiverSection}>
              <p style={styles.waiverTitle}>4. Excursion & Community Outings</p>
              <p style={styles.waiverText}>
                Wild Child may organize supervised local outings such as neighborhood walks, visits to nearby natural areas, beaches, farms, or community spaces as part of the program.
              </p>
              <div style={styles.checkRow}>
                <input type="radio" id="excYes" name="excursion" checked={waiver.excursionYes} onChange={() => setWaiver({ ...waiver, excursionYes: true, excursionNo: false })} style={{ marginTop: "3px", accentColor: TEAL }} />
                <label htmlFor="excYes" style={styles.checkLabel}>YES – I grant permission for my child to participate in supervised outings.</label>
              </div>
              <div style={styles.checkRow}>
                <input type="radio" id="excNo" name="excursion" checked={waiver.excursionNo} onChange={() => setWaiver({ ...waiver, excursionYes: false, excursionNo: true })} style={{ marginTop: "3px", accentColor: TEAL }} />
                <label htmlFor="excNo" style={styles.checkLabel}>NO – I do not grant permission for my child to participate in outings.</label>
              </div>
              {errors.excursion && <p style={styles.errorText}>{errors.excursion}</p>}
            </div>

            <div style={styles.waiverSection}>
              <p style={styles.waiverTitle}>5. Signature</p>
              <p style={styles.waiverText}>By signing below, I confirm I am the legal parent/guardian of {child.firstName || "the child named above"}, and that all information provided is accurate.</p>
              <p style={styles.label}>Digital Signature (type your full name)</p>
              <input style={{ ...styles.input, fontStyle: "italic", fontSize: "17px" }} value={signature} onChange={(e) => setSignature(e.target.value)} placeholder="Your full name" />
              {errors.signature && <p style={{ ...styles.errorText, marginTop: "-12px" }}>{errors.signature}</p>}
              <p style={{ fontSize: "12px", color: TEXT_LIGHT, fontFamily: "Georgia, serif", marginTop: "-4px" }}>
                Date: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>
          </>
        )}

        {step === 5 && (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: TEAL, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: "32px" }}>
              🌿
            </div>
            <h2 style={{ ...styles.sectionTitle, fontSize: "28px", textAlign: "center" }}>Welcome to the Wild!</h2>
            <p style={{ ...styles.sectionSub, maxWidth: "440px", margin: "0 auto 28px", textAlign: "center" }}>
              {child.firstName} is enrolled in {selectedProgram?.name}. We're so excited to welcome your family to Wild Child Nosara.
            </p>

            <div style={{ ...styles.summaryBox, textAlign: "left", maxWidth: "400px", margin: "0 auto 28px" }}>
              <p style={{ fontSize: "12px", letterSpacing: "1px", textTransform: "uppercase", color: TEXT_LIGHT, marginBottom: "14px", fontFamily: "Georgia, serif" }}>Enrollment Summary</p>
              <div style={styles.summaryRow}><span>Child</span><span style={{ color: TEXT_DARK }}>{child.firstName} {child.lastName}</span></div>
              <div style={styles.summaryRow}><span>Program</span><span style={{ color: TEXT_DARK }}>{selectedProgram?.name}</span></div>
              <div style={styles.summaryRow}><span>Schedule</span><span style={{ color: TEXT_DARK }}>{days} days/week</span></div>
              {lunch && <div style={styles.summaryRow}><span>Lunch</span><span style={{ color: TEXT_DARK }}>Included</span></div>}
              <div style={styles.summaryRow}><span>Email Sent To</span><span style={{ color: TEXT_DARK }}>{parentEmail}</span></div>
              <div style={styles.summaryTotal}><span>Monthly Total</span><span style={{ color: TEAL }}>${total}</span></div>
            </div>

            <div style={{ background: TEAL_LIGHT, border: `1px solid ${TEAL_MID}`, borderRadius: "10px", padding: "16px 20px", maxWidth: "400px", margin: "0 auto 28px", textAlign: "left" }}>
              <p style={{ fontSize: "13px", color: TEAL_DARK, fontFamily: "Georgia, serif", margin: "0 0 6px", fontWeight: "bold" }}>What happens next</p>
              <p style={{ fontSize: "13px", color: TEAL_DARK, fontFamily: "Georgia, serif", margin: 0, lineHeight: 1.7 }}>
                A confirmation email has been sent to {parentEmail}. Our team at info@dandelionwildschooling.com has also been notified of {child.firstName}'s enrollment. We'll be in touch soon with your welcome packet and any next steps. Pura vida! 🌺
              </p>
            </div>

            <p style={{ fontSize: "13px", color: TEXT_LIGHT, fontFamily: "Georgia, serif" }}>
              Questions? Reach us at{" "}
              <a href="mailto:info@dandelionwildschooling.com" style={{ color: TEAL }}>info@dandelionwildschooling.com</a>
            </p>
          </div>
        )}

        {step < 5 && (
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "32px", gap: "12px" }}>
            {step > 0 ? (
              <button style={styles.btn("secondary")} onClick={() => setStep((s) => s - 1)}>← Back</button>
            ) : (
              <div />
            )}
            <button
              style={{ ...styles.btn("primary"), opacity: submitting ? 0.7 : 1 }}
              onClick={handleNext}
              disabled={submitting}
            >
              {submitting ? "Processing..." : step === 4 ? "Submit & Complete" : step === 3 ? `Pay $${total} →` : "Continue →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
