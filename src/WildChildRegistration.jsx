import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { supabase } from './supabase';
import logoSvg from './assets/logo1.svg';

// ─── Brand colours ────────────────────────────────────────────────────────────
const OLIVE      = '#6b7a3f';
const OLIVE_DARK = '#4d5a2c';
const NAVY       = '#0f1f5c';
const ORANGE     = '#c4682a';
const CREAM      = '#f5f0e8';
const GREEN      = '#5a7a3a';
const CREAM_DARK = '#e0d8c8';
const SAGE       = '#8fa88a';

// ─── Stripe ───────────────────────────────────────────────────────────────────
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// ─── Programs ─────────────────────────────────────────────────────────────────
const ALL_PROGRAMS = [
  {
    id: 'tiny-roots', name: 'Tiny Roots', ages: '0–3 years', minAge: 0, maxAge: 3,
    description: 'A gentle half-day programme for our youngest explorers. Sensory play, rhythm, and nature connection in a nurturing small-group setting.',
    halfDay: true,
    rateStd:  { 3: 150, 4: 200, 5: 250 },
    rateFlat: { 3: 105, 4: 140, 5: 175 },
  },
  {
    id: 'little-roots', name: 'Little Roots', ages: '0–5 years', minAge: 0, maxAge: 5,
    description: 'Full days of imaginative play, storytelling, garden time, and creative arts for young children finding their footing in the world.',
    halfDay: false,
    rateStd:  { 3: 260, 4: 345, 5: 420 },
    rateFlat: { 3: 180, 4: 230, 5: 275 },
  },
  {
    id: 'wild-roots', name: 'Wild Roots', ages: '5–9 years', minAge: 5, maxAge: 9,
    description: 'Forest school, project-based learning, and community skills for curious, independent children ready to dig deeper into the world around them.',
    halfDay: false,
    rateStd:  { 3: 260, 4: 345, 5: 420 },
    rateFlat: { 3: 180, 4: 230, 5: 275 },
  },
  {
    id: 'earth-leaders', name: 'Earth Leaders', ages: '9–12 years', minAge: 9, maxAge: 12,
    description: 'Leadership, ecology, critical thinking, and real-world projects for older children stepping into their power as earth stewards and community makers.',
    halfDay: false,
    rateStd:  { 3: 260, 4: 345, 5: 420 },
    rateFlat: { 3: 180, 4: 230, 5: 275 },
  },
];

// ─── Age helpers ──────────────────────────────────────────────────────────────
function ageInYears(dobString) {
  if (!dobString) return null;
  const [y, m, d] = dobString.split('-').map(Number);
  const today = new Date();
  let age = today.getFullYear() - y;
  if (today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d)) age--;
  return age;
}
function eligiblePrograms(dobString) {
  const age = ageInYears(dobString);
  if (age === null) return [];
  return ALL_PROGRAMS.filter(p => age >= p.minAge && age <= p.maxAge);
}

// ─── Date helpers (Sakamoto – timezone-safe) ──────────────────────────────────
function dowOf(y, m, d) {
  const t = [0,3,2,5,0,3,5,1,4,6,2,4];
  if (m < 3) y--;
  return (y + Math.floor(y/4) - Math.floor(y/100) + Math.floor(y/400) + t[m-1] + d) % 7;
}
function addDays(ymd, n) {
  const dt = new Date(Date.UTC(ymd.y, ymd.m - 1, ymd.d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
}
function localDateKey({ y, m, d }) {
  return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}
function parseLocalKey(k) {
  const [y, m, d] = k.split('-').map(Number);
  return { y, m, d };
}
function getMonday(ymd) {
  const dow = dowOf(ymd.y, ymd.m, ymd.d);
  return addDays(ymd, dow === 0 ? -6 : 1 - dow);
}
function todayYMD() {
  const t = new Date();
  return { y: t.getFullYear(), m: t.getMonth() + 1, d: t.getDate() };
}
function getWeeksForMonth(year, month) {
  const firstDay = { y: year, m: month, d: 1 };
  const monday   = getMonday(firstDay);
  const weeks    = [];
  let cur = monday;
  while (cur.y < year || (cur.y === year && cur.m <= month)) {
    weeks.push({ monday: cur, friday: addDays(cur, 4) });
    cur = addDays(cur, 7);
  }
  return weeks;
}
function ymdLt(a, b) {
  if (a.y !== b.y) return a.y < b.y;
  if (a.m !== b.m) return a.m < b.m;
  return a.d < b.d;
}
const MONTH_NAMES = ['January','February','March','April','May','June',
                     'July','August','September','October','November','December'];
const DAY_ABBR = ['Mon','Tue','Wed','Thu','Fri'];

// ─── Pricing helpers ──────────────────────────────────────────────────────────
function weeklyRate(program, daysPerWeek, useFlat) {
  return useFlat ? program.rateFlat[daysPerWeek] : program.rateStd[daysPerWeek];
}
function discountPct(prevWeeks, newWeeks, hasLocalCode, localBasePct) {
  const total = prevWeeks + newWeeks;
  if (total >= 18) return null;
  if (hasLocalCode) {
    if (total >= 12) return 35;
    if (total >= 4)  return 25;
    return localBasePct || 20;
  }
  if (total >= 12) return 15;
  if (total >= 4)  return 5;
  return 0;
}
function calcChildTotal(child, selectedDays, prevWeeks, hasLocalCode, localBasePct, siblingDiscount, referralPct) {
  if (!child.program) return { tuition: 0, weeks: 0, useFlat: false, discPct: 0 };
  const program = ALL_PROGRAMS.find(p => p.id === child.program);
  if (!program) return { tuition: 0, weeks: 0, useFlat: false, discPct: 0 };
  const days = selectedDays || [];
  const weekMap = {};
  days.forEach(k => {
    const mon = localDateKey(getMonday(parseLocalKey(k)));
    weekMap[mon] = (weekMap[mon] || 0) + 1;
  });
  const weeks    = Object.keys(weekMap).length;
  const totalWks = prevWeeks + weeks;
  const useFlat  = totalWks >= 18;
  const dPct     = useFlat ? null : discountPct(prevWeeks, weeks, hasLocalCode, localBasePct);
  let tuition = 0;
  Object.values(weekMap).forEach(cnt => { tuition += weeklyRate(program, cnt, useFlat); });
  if (dPct !== null && dPct > 0) tuition *= (1 - dPct / 100);
  if (siblingDiscount) tuition *= 0.90;
  if (referralPct)     tuition *= (1 - referralPct / 100);
  return { tuition: Math.round(tuition * 100) / 100, weeks, useFlat, discPct: dPct };
}

function blankChild() {
  return { firstName: '', lastName: '', dob: '', allergies: '', medicalNotes: '', program: '', prevWeeks: 0 };
}

// ─── Step definitions ─────────────────────────────────────────────────────────
const STEPS_NORMAL = ['Children', 'Schedule', 'Your Info', 'Payment', 'Waiver', 'Confirmation'];
const STEPS_PORTAL = ['Schedule', 'Payment', 'Waiver', 'Confirmation'];

// ─── Main component ───────────────────────────────────────────────────────────
export default function WildChildRegistration() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const comingFromPortal = searchParams.get('prefill') === 'true';
  const portalChildId    = searchParams.get('childId');

  const [step, setStep]                     = useState(0);
  const [children, setChildren]             = useState([blankChild()]);
  const [selectedDays, setSelectedDays]     = useState({});
  const [activeChildTab, setActiveChildTab] = useState(0);
  const [parentInfo, setParentInfo]         = useState({ name: '', email: '', phone: '' });
  const [createAccount, setCreateAccount]   = useState(false);
  const [password, setPassword]             = useState('');
  const [localCode, setLocalCode]           = useState('');
  const [localCodeValid, setLocalCodeValid] = useState(null);
  const [localCodePct, setLocalCodePct]     = useState(20);
  const [referralCode, setReferralCode]     = useState('');
  const [referralValid, setReferralValid]   = useState(null);
  const [paymentPlan, setPaymentPlan]       = useState('full');
  const [waivers, setWaivers]               = useState({ liability: false, medical: false, media: false, excursion: false });
  const [signature, setSignature]           = useState('');
  const [lunch, setLunch]                   = useState(false);
  const [user, setUser]                     = useState(null);
  const [waiverAlreadySigned, setWaiverAlreadySigned] = useState(false);
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState('');
  const [registrationId, setRegistrationId] = useState(null);

  const today = todayYMD();
  const [calMonth, setCalMonth] = useState(today.m);
  const [calYear,  setCalYear]  = useState(today.y);

  const STEPS = comingFromPortal ? STEPS_PORTAL : STEPS_NORMAL;

  const CONFIRM_STEP = comingFromPortal ? 3 : 5;
  const WAIVER_STEP  = comingFromPortal ? 2 : 4;
  const PAYMENT_STEP = comingFromPortal ? 1 : 3;

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      setUser(session.user);

      const { data: profile } = await supabase
        .from('parent_profiles').select('*').eq('id', session.user.id).maybeSingle();
      if (profile) {
        setParentInfo({ name: profile.full_name || '', email: profile.email || '', phone: profile.phone || '' });
        // Waiver skip ONLY when re-enrolling an existing child (portalChildId is set).
        // Any new child always sees the full waiver regardless of parent's history.
        if (profile.waiver_signed_at && portalChildId) {
          setWaiverAlreadySigned(true);
          setWaivers({ liability: true, medical: true, media: true, excursion: true });
          setSignature(profile.waiver_signature || '');
        }
      }

      if (comingFromPortal) {
        if (portalChildId) {
          const { data: child } = await supabase
            .from('children').select('*').eq('id', portalChildId).single();
          if (child) {
            setChildren([{
              firstName:    child.first_name,
              lastName:     child.last_name,
              dob:          child.dob,
              allergies:    child.allergies || '',
              medicalNotes: child.medical_notes || '',
              program:      child.program_id || '',
              prevWeeks:    child.total_weeks_enrolled || 0,
            }]);
          }
        } else {
          const { data: dbChildren } = await supabase
            .from('children').select('*').eq('parent_id', session.user.id);
          if (dbChildren && dbChildren.length > 0) {
            setChildren(dbChildren.map(c => ({
              firstName:    c.first_name,
              lastName:     c.last_name,
              dob:          c.dob,
              allergies:    c.allergies || '',
              medicalNotes: c.medical_notes || '',
              program:      c.program_id || '',
              prevWeeks:    c.total_weeks_enrolled || 0,
            })));
          }
        }
        setStep(0);
      }
    });
  }, []);

  // ── Totals ────────────────────────────────────────────────────────────────
  const hasLocalCode   = localCodeValid === true;
  const referralPct    = referralValid  === true ? 5 : 0;
  const totalWeeksAll  = children.reduce((acc, ch, i) => {
    const days = selectedDays[i] || [];
    const weekMap = {};
    days.forEach(k => { weekMap[localDateKey(getMonday(parseLocalKey(k)))] = true; });
    return acc + Object.keys(weekMap).length;
  }, 0);
  const childTotals   = children.map((ch, i) =>
    calcChildTotal(ch, selectedDays[i] || [], ch.prevWeeks, hasLocalCode, localCodePct, i > 0, referralPct)
  );
  const tuitionTotal  = childTotals.reduce((a, c) => a + c.tuition, 0);
  const lunchDays     = children.reduce((a, _, i) => a + (selectedDays[i] || []).length, 0);
  const lunchTotal    = lunch ? lunchDays * 10 : 0;
  const grandTotal    = tuitionTotal + lunchTotal;
  const installmentAmt = () => {
    if (paymentPlan === 'biweekly') return Math.round((grandTotal / Math.ceil(totalWeeksAll / 2)) * 100) / 100;
    if (paymentPlan === 'monthly')  return Math.round((grandTotal / Math.ceil(totalWeeksAll / 4)) * 100) / 100;
    return grandTotal;
  };

  // ── Code validation ───────────────────────────────────────────────────────
  async function validateLocalCode() {
    if (!localCode.trim()) return;
    const { data, error } = await supabase
      .from('discount_codes').select('*').eq('code', localCode.trim().toLowerCase()).single();
    if (error || !data || !data.active) { setLocalCodeValid(false); }
    else { setLocalCodeValid(true); setLocalCodePct(data.discount_pct || 20); }
  }
  async function validateReferralCode() {
    if (!referralCode.trim()) return;
    const { data } = await supabase
      .from('parent_profiles').select('id').eq('referral_code', referralCode.trim().toUpperCase()).single();
    setReferralValid(data ? true : false);
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async function submitRegistration(paymentIntentId) {
    setLoading(true); setError('');
    try {
      let userId = user?.id;
      if (createAccount && !user) {
        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
          email: parentInfo.email, password,
        });
        if (signUpErr) throw signUpErr;
        userId = signUpData.user?.id;
        if (userId) {
          await supabase.from('parent_profiles').upsert({
            id: userId, full_name: parentInfo.name, email: parentInfo.email, phone: parentInfo.phone,
          });
        }
      }
      const savedIds = [];
      for (let i = 0; i < children.length; i++) {
        const ch   = children[i];
        const tot  = childTotals[i];
        const prog = ALL_PROGRAMS.find(p => p.id === ch.program);
        const { data: reg, error: regErr } = await supabase.from('registrations').insert({
          program_id: ch.program, program_name: prog?.name || ch.program,
          child_first_name: ch.firstName, child_last_name: ch.lastName,
          child_dob: ch.dob, child_allergies: ch.allergies,
          child_medical_notes: ch.medicalNotes || null,
          parent_name: parentInfo.name, parent_email: parentInfo.email, parent_phone: parentInfo.phone,
          selected_days: selectedDays[i] || [], lunch,
          subtotal_tuition: tot.tuition,
          subtotal_lunch: lunch ? (selectedDays[i] || []).length * 10 : 0,
          grand_total: tot.tuition + (lunch ? (selectedDays[i] || []).length * 10 : 0),
          waiver_liability: waivers.liability, waiver_medical: waivers.medical,
          waiver_media: waivers.media, waiver_excursion: waivers.excursion,
          waiver_signature: signature, waiver_date: new Date().toISOString(),
          payment_status: 'pending', stripe_payment_intent_id: paymentIntentId,
          parent_user_id: userId || null,
          discount_code: hasLocalCode ? localCode.trim().toLowerCase() : null,
          discount_pct: tot.discPct || 0, flat_rate_applied: tot.useFlat,
          weeks_total: tot.weeks, payment_plan: paymentPlan,
        }).select().single();
        if (regErr) throw regErr;
        savedIds.push(reg.id);
        if (userId) {
          const { data: existing } = await supabase
            .from('children').select('id, total_weeks_enrolled')
            .eq('parent_id', userId).eq('first_name', ch.firstName).eq('last_name', ch.lastName).single();
          if (existing) {
            await supabase.from('children').update({
              total_weeks_enrolled: (existing.total_weeks_enrolled || 0) + tot.weeks,
              program_id: ch.program, program_name: prog?.name || ch.program,
              allergies: ch.allergies,
              medical_notes: ch.medicalNotes || null,
            }).eq('id', existing.id);
          } else {
            await supabase.from('children').insert({
              parent_id: userId, first_name: ch.firstName, last_name: ch.lastName,
              dob: ch.dob, allergies: ch.allergies,
              medical_notes: ch.medicalNotes || null,
              program_id: ch.program, program_name: prog?.name || ch.program,
              total_weeks_enrolled: tot.weeks,
            });
          }
        }
      }
      if (userId && (createAccount || user)) {
        await supabase.from('parent_profiles').update({
          waiver_signature: signature, waiver_signed_at: new Date().toISOString(),
        }).eq('id', userId);
      }
      try {
        await supabase.functions.invoke('send-enrollment-notification', {
          body: {
            parentName: parentInfo.name, parentEmail: parentInfo.email, parentPhone: parentInfo.phone,
            children: children.map((ch, i) => ({
              name: `${ch.firstName} ${ch.lastName}`,
              program: ALL_PROGRAMS.find(p => p.id === ch.program)?.name || ch.program,
              days: selectedDays[i] || [], tuition: childTotals[i].tuition,
            })),
            grandTotal, paymentPlan, registrationIds: savedIds,
          }
        });
      } catch (emailErr) { console.warn('Email notification failed:', emailErr); }
      setRegistrationId(savedIds[0]);
      setStep(CONFIRM_STEP);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    }
    setLoading(false);
  }

  // ── Navigation ────────────────────────────────────────────────────────────
  function nextStep() {
    if (step === PAYMENT_STEP) {
      if (waiverAlreadySigned) { submitRegistration(null); return; }
      setStep(WAIVER_STEP); return;
    }
    setStep(s => s + 1);
  }
  function prevStep() {
    if (step === 0 && comingFromPortal) { navigate('/portal'); return; }
    if (step === 0) return;
    setStep(s => Math.max(0, s - 1));
  }

  // ── Child management ──────────────────────────────────────────────────────
  function updateChild(i, field, value) {
    setChildren(prev => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      if (field === 'dob') {
        const eligible = eligiblePrograms(value);
        if (!eligible.find(p => p.id === next[i].program)) next[i].program = '';
      }
      return next;
    });
  }
  function addChild() {
    if (children.length >= 5) return;
    setChildren(prev => [...prev, blankChild()]);
    setActiveChildTab(children.length);
  }
  function removeChild(i) {
    setChildren(prev => prev.filter((_, idx) => idx !== i));
    setSelectedDays(prev => {
      const next = {};
      Object.keys(prev).forEach(k => {
        const ki = parseInt(k);
        if (ki < i) next[ki] = prev[ki];
        else if (ki > i) next[ki - 1] = prev[ki];
      });
      return next;
    });
    setActiveChildTab(t => Math.max(0, t - 1));
  }

  // ── Day toggle ────────────────────────────────────────────────────────────
  function toggleDay(childIdx, key) {
    setSelectedDays(prev => {
      const days = prev[childIdx] || [];
      const ymd  = parseLocalKey(key);
      const dow  = dowOf(ymd.y, ymd.m, ymd.d);
      if (dow === 0 || dow === 6) return prev;
      const has = days.includes(key);
      if (!has) {
        const mon     = localDateKey(getMonday(ymd));
        const wkCount = days.filter(d => localDateKey(getMonday(parseLocalKey(d))) === mon).length;
        if (wkCount >= 5) return prev;
      }
      return { ...prev, [childIdx]: has ? days.filter(d => d !== key) : [...days, key] };
    });
  }

  // ── Schedule step valid check ─────────────────────────────────────────────
  const scheduleValid = !children.some((ch, i) => {
    if (!ch.program) return true;
    const days = selectedDays[i] || [];
    if (days.length === 0) return true;
    const weekMap = {};
    days.forEach(k => { weekMap[localDateKey(getMonday(parseLocalKey(k)))] = (weekMap[localDateKey(getMonday(parseLocalKey(k)))]||0)+1; });
    return Object.values(weekMap).some(cnt => cnt < 3);
  });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: CREAM, margin: 0, padding: 0 }}>

      {/* Header */}
      <header style={{
        background: OLIVE_DARK, padding: '0 24px', height: 64, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <img src={logoSvg} alt="Wild Child" style={{ height: 120, marginTop: 16 }} />
        <button onClick={() => navigate(comingFromPortal ? '/portal' : '/')} style={{
          background: 'transparent', border: '1.5px solid rgba(245,240,232,0.5)',
          borderRadius: 4, color: CREAM, fontSize: 13, fontWeight: 600,
          letterSpacing: '0.06em', padding: '7px 16px', cursor: 'pointer', textTransform: 'uppercase',
        }}>{comingFromPortal ? '← Portal' : '← Home'}</button>
      </header>

      {/* Step bar */}
      <div style={{ background: NAVY, padding: '12px 24px', display: 'flex', gap: 4, overflowX: 'auto' }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{
            flex: 1, minWidth: 60, textAlign: 'center', fontSize: 11, fontWeight: 600,
            letterSpacing: '0.05em', paddingBottom: 6, whiteSpace: 'nowrap',
            color: i === step ? ORANGE : i < step ? SAGE : 'rgba(255,255,255,0.4)',
            borderBottom: `2px solid ${i === step ? ORANGE : i < step ? SAGE : 'transparent'}`,
          }}>{s.toUpperCase()}</div>
        ))}
      </div>

      {/* Body */}
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 20px 80px' }}>

        {error && (
          <div style={{ background: '#fee', border: '1px solid #f99', borderRadius: 8,
            padding: '12px 16px', marginBottom: 20, color: '#900', fontSize: 14 }}>
            {error}
          </div>
        )}

        {/* ── STEP 0 (normal): Children ─────────────────────────────────────── */}
        {!comingFromPortal && step === 0 && (
          <div>
            <h2 style={{ color: OLIVE_DARK, marginBottom: 8 }}>Children</h2>
            <p style={{ color: '#666', marginBottom: 24, fontSize: 14 }}>
              Add up to 5 children. Enter each child's date of birth first — eligible programmes will appear automatically.
            </p>

            {children.length > 1 && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                {children.map((ch, i) => (
                  <button key={i} onClick={() => setActiveChildTab(i)} style={{
                    padding: '6px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
                    background: activeChildTab === i ? OLIVE_DARK : CREAM_DARK,
                    color: activeChildTab === i ? CREAM : '#555', fontSize: 13, fontWeight: 600,
                  }}>{ch.firstName || `Child ${i+1}`}</button>
                ))}
              </div>
            )}

            {children.map((ch, i) => i !== activeChildTab ? null : (
              <div key={i}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <Field label="First name">
                    <input value={ch.firstName} onChange={e => updateChild(i,'firstName',e.target.value)}
                      style={inputStyle} placeholder="First name" />
                  </Field>
                  <Field label="Last name">
                    <input value={ch.lastName} onChange={e => updateChild(i,'lastName',e.target.value)}
                      style={inputStyle} placeholder="Last name" />
                  </Field>
                </div>
                <Field label="Date of birth">
                  <input type="date" value={ch.dob} onChange={e => updateChild(i,'dob',e.target.value)}
                    style={{ ...inputStyle, WebkitAppearance: 'none' }} />
                </Field>

                {ch.dob && (() => {
                  const eligible = eligiblePrograms(ch.dob);
                  if (eligible.length === 0) {
                    const age = ageInYears(ch.dob);
                    return (
                      <div style={{ marginTop: 16, padding: '14px 16px', background: '#fff8e1',
                        border: '1px solid #ffe082', borderRadius: 8, color: '#7a5c00', fontSize: 14 }}>
                        {age !== null && age > 12
                          ? 'Our programmes are for children aged 0–12. Please contact us directly.'
                          : 'Please enter a valid date of birth.'}
                      </div>
                    );
                  }
                  return (
                    <div style={{ marginTop: 16 }}>
                      <label style={labelStyle}>Programme</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 6 }}>
                        {eligible.map(prog => (
                          <ProgramCard key={prog.id} prog={prog}
                            selected={ch.program === prog.id}
                            onSelect={() => updateChild(i, 'program', prog.id)} />
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {!ch.dob && (
                  <div style={{ marginTop: 16, padding: '12px 16px', background: CREAM_DARK,
                    borderRadius: 8, color: '#777', fontSize: 14 }}>
                    Enter date of birth above to see available programmes.
                  </div>
                )}

                <Field label="Allergies (optional)" style={{ marginTop: 16 }}>
                  <textarea value={ch.allergies} onChange={e => updateChild(i,'allergies',e.target.value)}
                    style={{ ...inputStyle, height: 72, resize: 'vertical' }}
                    placeholder="Any allergies or dietary needs…" />
                </Field>

                <Field label="Additional medical notes (N/A if not applicable)">
                  <textarea value={ch.medicalNotes} onChange={e => updateChild(i,'medicalNotes',e.target.value)}
                    style={{ ...inputStyle, height: 72, resize: 'vertical' }}
                    placeholder="e.g. asthma, epi-pen required, seizure history — or write N/A" />
                </Field>

                {children.length > 1 && (
                  <button onClick={() => removeChild(i)} style={{
                    marginTop: 8, background: 'none', border: 'none',
                    color: '#c00', fontSize: 13, cursor: 'pointer', padding: 0,
                  }}>Remove this child</button>
                )}
              </div>
            ))}

            {children.length < 5 && (
              <button onClick={addChild} style={{
                marginTop: 20, background: CREAM_DARK, border: 'none', borderRadius: 6,
                padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: OLIVE_DARK,
              }}>+ Add another child</button>
            )}

            <NavButtons onNext={() => setStep(1)}
              nextDisabled={children.some(ch => !ch.firstName || !ch.lastName || !ch.dob || !ch.program || !ch.medicalNotes.trim())} />
          </div>
        )}

        {/* ── STEP 1 (normal): Schedule ─────────────────────────────────────── */}
        {!comingFromPortal && step === 1 && (
          <div>
            <h2 style={{ color: OLIVE_DARK, marginBottom: 8 }}>Schedule</h2>
            <p style={{ color: '#666', marginBottom: 16, fontSize: 14 }}>
              Select school days. Minimum 3 days per week, maximum 5 (Monday–Friday only).
            </p>

            {children.length > 1 && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                {children.map((ch, i) => (
                  <button key={i} onClick={() => setActiveChildTab(i)} style={{
                    padding: '6px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
                    background: activeChildTab === i ? OLIVE_DARK : CREAM_DARK,
                    color: activeChildTab === i ? CREAM : '#555', fontSize: 13, fontWeight: 600,
                  }}>{ch.firstName}</button>
                ))}
              </div>
            )}

            {children.map((ch, ci) => ci !== activeChildTab ? null : (
              <ChildCalendar key={ci} child={ch} childIdx={ci}
                selectedDays={selectedDays[ci] || []}
                onToggle={key => toggleDay(ci, key)}
                calMonth={calMonth} calYear={calYear}
                onPrevMonth={() => { if (calMonth===1){setCalMonth(12);setCalYear(y=>y-1);}else setCalMonth(m=>m-1); }}
                onNextMonth={() => { if (calMonth===12){setCalMonth(1);setCalYear(y=>y+1);}else setCalMonth(m=>m+1); }}
                today={today} />
            ))}

            <LunchToggle lunch={lunch} setLunch={setLunch} />
            <NavButtons onBack={prevStep} onNext={() => setStep(2)} nextDisabled={!scheduleValid} />
          </div>
        )}

        {/* ── STEP 2 (normal): Your Info ────────────────────────────────────── */}
        {!comingFromPortal && step === 2 && (
          <div>
            <h2 style={{ color: OLIVE_DARK, marginBottom: 8 }}>Your Information</h2>
            <Field label="Full name">
              <input value={parentInfo.name} onChange={e => setParentInfo(p=>({...p,name:e.target.value}))}
                style={inputStyle} placeholder="Your full name" />
            </Field>
            <Field label="Email address">
              <input type="email" value={parentInfo.email} onChange={e => setParentInfo(p=>({...p,email:e.target.value}))}
                style={inputStyle} placeholder="your@email.com" />
            </Field>
            <Field label="Phone number">
              <input type="tel" value={parentInfo.phone} onChange={e => setParentInfo(p=>({...p,phone:e.target.value}))}
                style={inputStyle} placeholder="+506 …" />
            </Field>

            {!user && (
              <div style={{ marginTop: 8, padding: 16, background: '#fff',
                border: `1px solid ${CREAM_DARK}`, borderRadius: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                  <input type="checkbox" checked={createAccount} onChange={e => setCreateAccount(e.target.checked)}
                    style={{ width: 18, height: 18, accentColor: OLIVE }} />
                  <div>
                    <div style={{ fontWeight: 600, color: OLIVE_DARK }}>Create a parent account</div>
                    <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>Access your enrolment details and re-enrol easily.</div>
                  </div>
                </label>
                {createAccount && (
                  <Field label="Password" style={{ marginTop: 14 }}>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                      style={inputStyle} placeholder="Choose a password (min 6 characters)" />
                  </Field>
                )}
              </div>
            )}

            <NavButtons onBack={prevStep} onNext={() => setStep(3)}
              nextDisabled={!parentInfo.name || !parentInfo.email || !parentInfo.phone} />
          </div>
        )}

        {/* ── STEP 0 (portal): Programme + Schedule ────────────────────────── */}
        {comingFromPortal && step === 0 && (
          <div>
            <div style={{ background: '#f0f4e8', border: `1px solid ${SAGE}`, borderRadius: 8,
              padding: '10px 14px', marginBottom: 20, fontSize: 14, color: OLIVE_DARK }}>
              Enrolling more weeks for <strong>{children.map(c => c.firstName).join(', ')}</strong>.
            </div>

            {children.map((ch, i) => i !== activeChildTab ? null : (
              <div key={i}>
                <div style={{ marginBottom: 24 }}>
                  <label style={labelStyle}>Programme</label>
                  {ch.dob ? (() => {
                    const eligible = eligiblePrograms(ch.dob);
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 6 }}>
                        {eligible.map(prog => (
                          <ProgramCard key={prog.id} prog={prog}
                            selected={ch.program === prog.id}
                            onSelect={() => updateChild(i, 'program', prog.id)} />
                        ))}
                      </div>
                    );
                  })() : (
                    <div style={{ padding: '12px 16px', background: CREAM_DARK, borderRadius: 8, color: '#777', fontSize: 14 }}>
                      No date of birth on file — please contact Wild Child to update your child's profile.
                    </div>
                  )}
                </div>

                {ch.program && (
                  <>
                    <h3 style={{ color: OLIVE_DARK, marginBottom: 8, fontSize: 17 }}>Select days</h3>
                    <p style={{ color: '#666', marginBottom: 16, fontSize: 14 }}>
                      Minimum 3 days per week, maximum 5 (Monday–Friday only).
                    </p>
                    <ChildCalendar child={ch} childIdx={i}
                      selectedDays={selectedDays[i] || []}
                      onToggle={key => toggleDay(i, key)}
                      calMonth={calMonth} calYear={calYear}
                      onPrevMonth={() => { if (calMonth===1){setCalMonth(12);setCalYear(y=>y-1);}else setCalMonth(m=>m-1); }}
                      onNextMonth={() => { if (calMonth===12){setCalMonth(1);setCalYear(y=>y+1);}else setCalMonth(m=>m+1); }}
                      today={today} />
                  </>
                )}
              </div>
            ))}

            {children[activeChildTab]?.program && <LunchToggle lunch={lunch} setLunch={setLunch} />}

            <NavButtons onBack={prevStep} onNext={() => setStep(1)} nextDisabled={!scheduleValid} />
          </div>
        )}

        {/* ── PAYMENT STEP (both flows) ─────────────────────────────────────── */}
        {step === PAYMENT_STEP && (
          <Elements stripe={stripePromise}>
            <PaymentStep
              childTotals={childTotals} children={children} selectedDays={selectedDays}
              lunch={lunch} lunchTotal={lunchTotal} tuitionTotal={tuitionTotal}
              grandTotal={grandTotal} totalWeeksAll={totalWeeksAll}
              paymentPlan={paymentPlan} setPaymentPlan={setPaymentPlan}
              installmentAmt={installmentAmt()}
              hasLocalCode={hasLocalCode} localCodePct={localCodePct} referralPct={referralPct}
              localCode={localCode} setLocalCode={setLocalCode}
              localCodeValid={localCodeValid} setLocalCodeValid={setLocalCodeValid}
              referralCode={referralCode} setReferralCode={setReferralCode}
              referralValid={referralValid} setReferralValid={setReferralValid}
              validateLocalCode={validateLocalCode} validateReferralCode={validateReferralCode}
              onBack={prevStep} onSuccess={submitRegistration}
              loading={loading} error={error}
            />
          </Elements>
        )}

        {/* ── WAIVER STEP ───────────────────────────────────────────────────── */}
        {step === WAIVER_STEP && (
          <div>
            <h2 style={{ color: OLIVE_DARK, marginBottom: 8 }}>Waiver & Consent</h2>
            <p style={{ fontSize: 14, color: '#666', marginBottom: 20 }}>Please read and agree to each section before signing.</p>
            {[
              { key: 'liability', title: '1. Assumption of Risk & Release of Liability',
                text: 'Wild Child is a nature-based, outdoor programme. Activities include outdoor play, gardening, forest and beach exploration, physical movement, water play, and exposure to uneven terrain, insects, plants, wildlife, and weather. Participation involves inherent risks. I knowingly assume all risks and release Wild Child Nosara from any claims arising from my child\'s participation.' },
              { key: 'medical', title: '2. Medical & Emergency Consent',
                text: 'I authorise Wild Child to seek emergency medical care if I cannot be reached. I consent to examination, diagnosis, treatment, or hospital care deemed necessary by a physician. All medical expenses are my responsibility.' },
              { key: 'media', title: '3. Media Release',
                text: 'Photos and videos may be taken during programme activities for educational documentation and promotional purposes including the Wild Child website and social media. Children\'s names will not be used publicly without additional consent.' },
              { key: 'excursion', title: '4. Excursion Permission',
                text: 'Wild Child may organise supervised local outings including neighbourhood walks, visits to beaches, farms, and community spaces as part of the programme.' },
            ].map(({ key, title, text }) => (
              <div key={key} style={{ marginBottom: 16, padding: 16, background: '#fff',
                border: `1px solid ${CREAM_DARK}`, borderRadius: 8 }}>
                <div style={{ fontWeight: 700, color: OLIVE_DARK, marginBottom: 8 }}>{title}</div>
                <p style={{ fontSize: 13, color: '#555', marginBottom: 12, lineHeight: 1.6 }}>{text}</p>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <input type="checkbox" checked={waivers[key]}
                    onChange={e => setWaivers(w => ({ ...w, [key]: e.target.checked }))}
                    style={{ width: 18, height: 18, accentColor: OLIVE }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: OLIVE_DARK }}>I agree</span>
                </label>
              </div>
            ))}
            <Field label="Digital signature (type your full name)">
              <input value={signature} onChange={e => setSignature(e.target.value)}
                style={inputStyle} placeholder="Your full legal name" />
            </Field>
            <NavButtons onBack={() => setStep(PAYMENT_STEP)} onNext={() => submitRegistration(null)}
              nextLabel="Complete Enrolment"
              nextDisabled={!Object.values(waivers).every(Boolean) || !signature.trim()} />
          </div>
        )}

        {/* ── CONFIRMATION STEP ─────────────────────────────────────────────── */}
        {step === CONFIRM_STEP && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🌿</div>
            <h2 style={{ color: OLIVE_DARK, marginBottom: 12 }}>Enrolment complete!</h2>
            <p style={{ color: '#555', fontSize: 15, maxWidth: 420, margin: '0 auto 24px', lineHeight: 1.7 }}>
              Thank you for joining the Wild Child family. A confirmation email is on its way to <strong>{parentInfo.email}</strong>.
            </p>
            {paymentPlan !== 'full' && (
              <div style={{ background: '#fff', border: `1px solid ${CREAM_DARK}`, borderRadius: 8,
                padding: 16, maxWidth: 360, margin: '0 auto 24px', textAlign: 'left' }}>
                <div style={{ fontWeight: 700, color: OLIVE_DARK, marginBottom: 6 }}>Payment plan</div>
                <div style={{ fontSize: 14, color: '#555' }}>
                  {paymentPlan === 'biweekly' ? 'Bi-weekly' : 'Monthly'} payments of <strong>${installmentAmt().toFixed(2)}</strong>.
                  Your first payment has been processed. Subsequent payments will be arranged with the Wild Child team.
                </div>
              </div>
            )}
            <button onClick={() => navigate(user ? '/portal' : '/')} style={{
              background: OLIVE_DARK, color: CREAM, border: 'none', borderRadius: 6,
              padding: '14px 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer',
            }}>{user ? 'Go to your portal →' : 'Back to home →'}</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Lunch toggle ─────────────────────────────────────────────────────────────
function LunchToggle({ lunch, setLunch }) {
  return (
    <div style={{ marginTop: 24, padding: 16, background: '#fff',
      border: `1px solid ${CREAM_DARK}`, borderRadius: 8 }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
        <input type="checkbox" checked={lunch} onChange={e => setLunch(e.target.checked)}
          style={{ width: 18, height: 18, accentColor: GREEN }} />
        <div>
          <div style={{ fontWeight: 600, color: OLIVE_DARK }}>Add organic snack & lunch — $10/day</div>
          <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>Fresh, locally sourced meals prepared daily by our chef.</div>
        </div>
      </label>
    </div>
  );
}

// ─── Program card ─────────────────────────────────────────────────────────────
function ProgramCard({ prog, selected, onSelect }) {
  return (
    <div onClick={onSelect} style={{
      border: `2px solid ${selected ? OLIVE_DARK : CREAM_DARK}`, borderRadius: 10,
      padding: '14px 16px', cursor: 'pointer',
      background: selected ? '#f0f4e8' : '#fff',
      transition: 'border-color 0.15s, background 0.15s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: OLIVE_DARK }}>{prog.name}</div>
        {prog.halfDay && (
          <span style={{ fontSize: 11, fontWeight: 700, background: '#fff3e0', color: '#e65100',
            borderRadius: 4, padding: '2px 7px', letterSpacing: '0.04em' }}>HALF DAY</span>
        )}
        <div style={{ marginLeft: 'auto', fontSize: 12, color: '#888', fontWeight: 500 }}>{prog.ages}</div>
      </div>
      <p style={{ fontSize: 13, color: '#666', margin: 0, lineHeight: 1.5 }}>{prog.description}</p>
      <p style={{ fontSize: 12, color: OLIVE, marginTop: 6, marginBottom: 0, fontWeight: 600 }}>
        From ${prog.rateStd[3]}/week (3 days){prog.halfDay ? ' · Half day, 3 hrs' : ' · Full day'}
      </p>
    </div>
  );
}

// ─── Child calendar ───────────────────────────────────────────────────────────
function ChildCalendar({ child, selectedDays, onToggle, calMonth, calYear, onPrevMonth, onNextMonth, today }) {
  const weeks = getWeeksForMonth(calYear, calMonth);
  const weekCounts = {};
  selectedDays.forEach(k => {
    const mon = localDateKey(getMonday(parseLocalKey(k)));
    weekCounts[mon] = (weekCounts[mon] || 0) + 1;
  });
  const weekGroups = {};
  selectedDays.forEach(k => {
    const mon = localDateKey(getMonday(parseLocalKey(k)));
    if (!weekGroups[mon]) weekGroups[mon] = [];
    weekGroups[mon].push(k);
  });
  const sortedWeeks = Object.keys(weekGroups).sort();

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button onClick={onPrevMonth} style={arrowBtn}>‹</button>
        <span style={{ fontWeight: 700, color: OLIVE_DARK, fontSize: 16 }}>{MONTH_NAMES[calMonth-1]} {calYear}</span>
        <button onClick={onNextMonth} style={arrowBtn}>›</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 4, marginBottom: 6 }}>
        {DAY_ABBR.map(d => (
          <div key={d} style={{ textAlign:'center', fontSize:12, fontWeight:700, color:'#888', paddingBottom:4 }}>{d}</div>
        ))}
      </div>
      {weeks.map(({ monday }) => {
        const monKey  = localDateKey(monday);
        const wkCount = weekCounts[monKey] || 0;
        return (
          <div key={monKey} style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:4, marginBottom:4 }}>
            {[0,1,2,3,4].map(offset => {
              const day      = addDays(monday, offset);
              const key      = localDateKey(day);
              const inMonth  = day.m === calMonth;
              const isPast   = ymdLt(day, today);
              const isSel    = selectedDays.includes(key);
              const atMax    = !isSel && wkCount >= 5;
              const disabled = !inMonth || isPast || atMax;
              return (
                <div key={key} onClick={() => !disabled && onToggle(key)} style={{
                  height: 40, display:'flex', alignItems:'center', justifyContent:'center',
                  borderRadius: 6, fontSize: 13, fontWeight: isSel ? 700 : 400,
                  background: isSel ? OLIVE_DARK : disabled ? CREAM_DARK : '#fff',
                  color: isSel ? CREAM : disabled ? '#bbb' : OLIVE_DARK,
                  border: `1px solid ${isSel ? OLIVE_DARK : CREAM_DARK}`,
                  cursor: disabled ? 'default' : 'pointer',
                  opacity: !inMonth ? 0.3 : 1,
                }}>{day.d}</div>
              );
            })}
          </div>
        );
      })}
      {Object.entries(weekCounts).map(([mon, cnt]) => cnt > 0 && cnt < 3 && (
        <p key={mon} style={{ color:'#c00', fontSize:12, marginTop:4 }}>
          Week of {MONTH_NAMES[parseLocalKey(mon).m-1]} {parseLocalKey(mon).d}: {cnt} day{cnt!==1?'s':''} selected — minimum 3 required.
        </p>
      ))}
      {sortedWeeks.length > 0 && child.program && (
        <div style={{ marginTop:16, padding:14, background:'#fff', border:`1px solid ${CREAM_DARK}`, borderRadius:8, fontSize:13 }}>
          <div style={{ fontWeight:700, color:OLIVE_DARK, marginBottom:8 }}>{child.firstName}'s schedule summary</div>
          {sortedWeeks.map(mon => {
            const ymd  = parseLocalKey(mon);
            const cnt  = weekGroups[mon].length;
            const prog = ALL_PROGRAMS.find(p => p.id === child.program);
            const useFlat = (child.prevWeeks + sortedWeeks.indexOf(mon) + 1) >= 18;
            const rate = prog ? weeklyRate(prog, cnt, useFlat) : 0;
            return (
              <div key={mon} style={{ display:'flex', justifyContent:'space-between',
                borderTop:`1px solid ${CREAM_DARK}`, padding:'5px 0' }}>
                <span style={{ color:'#555' }}>{cnt} day{cnt!==1?'s':''} · week of {MONTH_NAMES[ymd.m-1]} {ymd.d}</span>
                <span style={{ fontWeight:600, color:OLIVE_DARK }}>${rate}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Payment step ─────────────────────────────────────────────────────────────
function PaymentStep({ childTotals, children, selectedDays, lunch, lunchTotal,
  tuitionTotal, grandTotal, totalWeeksAll, paymentPlan, setPaymentPlan,
  installmentAmt, hasLocalCode, localCodePct, referralPct,
  localCode, setLocalCode, localCodeValid, setLocalCodeValid,
  referralCode, setReferralCode, referralValid, setReferralValid,
  validateLocalCode, validateReferralCode,
  onBack, onSuccess, loading, error }) {
  const stripe   = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [payErr, setPayErr] = useState('');

  async function handlePay() {
    if (!stripe || !elements) return;
    setPaying(true); setPayErr('');
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('create-payment-intent', {
        body: { amount: installmentAmt, currency: 'usd' }
      });
      if (fnErr) throw fnErr;
      const { error: stripeErr, paymentIntent } = await stripe.confirmCardPayment(
        data.clientSecret, { payment_method: { card: elements.getElement(CardElement) } }
      );
      if (stripeErr) throw stripeErr;
      await onSuccess(paymentIntent.id);
    } catch (err) {
      setPayErr(err.message || 'Payment failed. Please try again.');
    }
    setPaying(false);
  }

  return (
    <div>
      <h2 style={{ color: OLIVE_DARK, marginBottom: 16 }}>Payment</h2>

      <div style={{ background:'#fff', border:`1px solid ${CREAM_DARK}`, borderRadius:8, padding:16, marginBottom:20 }}>
        <div style={{ fontWeight:700, color:OLIVE_DARK, marginBottom:12 }}>Order summary</div>
        {childTotals.map((tot, i) => {
          const ch   = children[i];
          const prog = ALL_PROGRAMS.find(p => p.id === ch.program);
          return (
            <div key={i} style={{ borderTop:`1px solid ${CREAM_DARK}`, padding:'8px 0' }}>
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <span style={{ fontWeight:600, color:OLIVE_DARK }}>{ch.firstName} — {prog?.name}</span>
                <span style={{ fontWeight:700 }}>${tot.tuition.toFixed(2)}</span>
              </div>
              <div style={{ fontSize:12, color:'#888', marginTop:2 }}>
                {tot.weeks} week{tot.weeks!==1?'s':''}
                {tot.useFlat ? ' · flat rate' : tot.discPct ? ` · ${tot.discPct}% discount` : ''}
                {i > 0 ? ' · sibling 10%' : ''}{referralPct ? ` · referral ${referralPct}%` : ''}
              </div>
            </div>
          );
        })}
        {lunch && (
          <div style={{ display:'flex', justifyContent:'space-between',
            borderTop:`1px solid ${CREAM_DARK}`, padding:'8px 0', color:'#555' }}>
            <span>Organic snack & lunch</span><span>${lunchTotal.toFixed(2)}</span>
          </div>
        )}
        <div style={{ display:'flex', justifyContent:'space-between', borderTop:`2px solid ${OLIVE_DARK}`,
          paddingTop:10, marginTop:4, fontWeight:700, fontSize:16, color:OLIVE_DARK }}>
          <span>Total</span><span>${grandTotal.toFixed(2)}</span>
        </div>
      </div>

      <div style={{ background:'#fff', border:`1px solid ${CREAM_DARK}`, borderRadius:8, padding:16, marginBottom:20 }}>
        <div style={{ fontWeight:700, color:OLIVE_DARK, marginBottom:12 }}>Discount & referral codes</div>
        <div style={{ marginBottom:12 }}>
          <label style={labelStyle}>Local discount code (optional)</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={localCode} onChange={e => { setLocalCode(e.target.value); setLocalCodeValid(null); }}
              style={{ ...inputStyle, flex: 1, marginBottom: 0 }} placeholder="e.g. nosaralocals" />
            <button onClick={validateLocalCode} style={{
              background: OLIVE, color: CREAM, border: 'none', borderRadius: 6,
              padding: '0 16px', fontWeight: 600, cursor: 'pointer', fontSize: 14,
            }}>Apply</button>
          </div>
          {localCodeValid === true  && <p style={{ color: GREEN,  fontSize: 13, marginTop: 4 }}>✓ Code applied — {localCodePct}% base discount</p>}
          {localCodeValid === false && <p style={{ color: '#c00', fontSize: 13, marginTop: 4 }}>Code not recognised or inactive</p>}
        </div>
        <div>
          <label style={labelStyle}>Referral code (optional)</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={referralCode} onChange={e => { setReferralCode(e.target.value); setReferralValid(null); }}
              style={{ ...inputStyle, flex: 1, marginBottom: 0 }} placeholder="WC-XXXXXX" />
            <button onClick={validateReferralCode} style={{
              background: OLIVE, color: CREAM, border: 'none', borderRadius: 6,
              padding: '0 16px', fontWeight: 600, cursor: 'pointer', fontSize: 14,
            }}>Apply</button>
          </div>
          {referralValid === true  && <p style={{ color: GREEN,  fontSize: 13, marginTop: 4 }}>✓ Referral applied — 5% off</p>}
          {referralValid === false && <p style={{ color: '#c00', fontSize: 13, marginTop: 4 }}>Referral code not found</p>}
        </div>
      </div>

      {totalWeeksAll >= 4 && (
        <div style={{ marginBottom:20 }}>
          <div style={{ fontWeight:700, color:OLIVE_DARK, marginBottom:10 }}>Payment plan</div>
          {[
            { id:'full',     label:'Pay in Full', detail:`$${grandTotal.toFixed(2)} today` },
            { id:'biweekly', label:'Bi-Weekly',   detail:`~$${(grandTotal/Math.ceil(totalWeeksAll/2)).toFixed(2)} every 2 weeks` },
            { id:'monthly',  label:'Monthly',     detail:`~$${(grandTotal/Math.ceil(totalWeeksAll/4)).toFixed(2)}/month` },
          ].map(opt => (
            <label key={opt.id} style={{ display:'flex', alignItems:'center', gap:12,
              padding:'10px 14px', marginBottom:8, cursor:'pointer',
              background: paymentPlan===opt.id ? '#f0f4e8' : '#fff',
              border:`1.5px solid ${paymentPlan===opt.id ? OLIVE_DARK : CREAM_DARK}`, borderRadius:8 }}>
              <input type="radio" name="plan" value={opt.id} checked={paymentPlan===opt.id}
                onChange={() => setPaymentPlan(opt.id)} style={{ accentColor: OLIVE_DARK }} />
              <div>
                <div style={{ fontWeight:600, color:OLIVE_DARK }}>{opt.label}</div>
                <div style={{ fontSize:13, color:'#666' }}>{opt.detail}</div>
              </div>
            </label>
          ))}
        </div>
      )}

      <div style={{ marginBottom:20 }}>
        <div style={{ fontWeight:700, color:OLIVE_DARK, marginBottom:10 }}>Card details</div>
        <div style={{ background:'#fff', border:`1px solid ${CREAM_DARK}`, borderRadius:8, padding:14 }}>
          <CardElement options={{ style:{ base:{ fontSize:'16px', color:'#333' } } }} />
        </div>
      </div>

      {(payErr||error) && <p style={{ color:'#c00', fontSize:14, marginBottom:12 }}>{payErr||error}</p>}

      <div style={{ display:'flex', gap:12, marginTop:8 }}>
        <button onClick={onBack} style={backBtnStyle}>← Back</button>
        <button onClick={handlePay} disabled={paying||loading} style={{
          flex:1, background: paying||loading ? '#aaa' : ORANGE,
          color:CREAM, border:'none', borderRadius:6, padding:'16px 24px',
          fontSize:16, fontWeight:700, cursor: paying||loading ? 'default' : 'pointer',
        }}>
          {paying||loading ? 'Processing…' : `Pay $${installmentAmt.toFixed(2)}${paymentPlan!=='full'?' (first instalment)':''}`}
        </button>
      </div>
    </div>
  );
}

// ─── Shared UI ────────────────────────────────────────────────────────────────
function Field({ label, children, style }) {
  return (
    <div style={{ marginBottom:16, ...style }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}
function NavButtons({ onBack, onNext, nextLabel='Continue →', nextDisabled=false }) {
  return (
    <div style={{ display:'flex', gap:12, marginTop:32 }}>
      {onBack && <button onClick={onBack} style={backBtnStyle}>← Back</button>}
      {onNext && (
        <button onClick={onNext} disabled={nextDisabled} style={{
          flex:1, background: nextDisabled ? '#ccc' : ORANGE,
          color: nextDisabled ? '#999' : CREAM, border:'none', borderRadius:6,
          padding:'16px 24px', fontSize:16, fontWeight:700, cursor: nextDisabled ? 'default' : 'pointer',
        }}>{nextLabel}</button>
      )}
    </div>
  );
}
const inputStyle  = { width:'100%', padding:'12px 14px', borderRadius:6, fontSize:15, border:`1px solid ${CREAM_DARK}`, background:'#fff', color:'#333', boxSizing:'border-box', outline:'none', fontFamily:'inherit' };
const labelStyle  = { display:'block', fontSize:13, fontWeight:700, color:OLIVE_DARK, marginBottom:6, letterSpacing:'0.03em' };
const backBtnStyle= { background:CREAM_DARK, color:OLIVE_DARK, border:'none', borderRadius:6, padding:'16px 20px', fontSize:15, fontWeight:600, cursor:'pointer' };
const arrowBtn    = { background:'none', border:'none', fontSize:22, cursor:'pointer', color:OLIVE_DARK, padding:'4px 12px', borderRadius:4 };
