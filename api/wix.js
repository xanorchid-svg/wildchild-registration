// Wix Forms → Flodesk.
// Called by the Wix automations "Registration form → Lili email + Flodesk" (source=register)
// and "Email signup pop-up → Lili email + Flodesk" (source=popup) via "Send HTTP request".
// Lili's email notice comes from Wix's own "Get an Email when a form is submitted" automation.
// Records the family via the console intake (see below).
// Env: FLODESK_API_KEY, WIX_WEBHOOK_KEY (must match ?key= in the Wix automation URL), INTAKE_KEY (console intake).

const FD = 'https://api.flodesk.com/v1';
const EMAIL_RE = /[^\s@"<>]+@[^\s@"<>]+\.[^\s@"<>]{2,}/;
const BASE = 'Website Inquiries';
const RULES = [
  ['Interested · Ages 1–3', /\b(ages?\s*)?1\s*[–—-]\s*3\b/i],
  ['Interested · Ages 4–5', /\b(ages?\s*)?4\s*[–—-]\s*[56]\b/i],
  ['Interested · Ages 6–9', /\b(ages?\s*)?6\s*[–—-]\s*9\b/i],
  ['Interested · Ages 10–13', /\b(ages?\s*)?(10|9)\s*[–—-]\s*1[23]\b/i],
  ['Interested · Harmony Saturdays', /harmony|saturday|s[aá]bado/i],
  ['Interested · Ocean Connection Days', /ocean|thanksgiving|oc[eé]ano/i],
  ['Interested · Pottery workshop', /pottery|chorotega|cer[aá]mica|nanku/i],
];
const auth = () => 'Basic ' + Buffer.from(process.env.FLODESK_API_KEY + ':').toString('base64');
let segCache = null, segAt = 0;

async function fd(path, opts = {}) {
  const r = await fetch(FD + path, { ...opts, headers: { Authorization: auth(), 'Content-Type': 'application/json', 'User-Agent': 'Wild Child forms (agency.dreamxanadu.com)', ...(opts.headers || {}) } });
  const text = await r.text();
  let j; try { j = JSON.parse(text); } catch { j = text; }
  if (!r.ok) throw new Error(`Flodesk ${opts.method || 'GET'} ${path} ${r.status}: ${text.slice(0, 300)}`);
  return j;
}
async function segments() {
  if (segCache && Date.now() - segAt < 10 * 60e3) return segCache;
  const map = {};
  for (let page = 1; page < 20; page++) {
    const j = await fd(`/segments?page=${page}&per_page=100`);
    const items = j.data || j;
    (items || []).forEach(s => { map[s.name.trim().toLowerCase()] = s.id; });
    if (!j.meta || page >= (j.meta.total_pages || 1)) break;
  }
  segCache = map; segAt = Date.now(); return map;
}

// Walk the Wix payload: collect [title, value] pairs and keyed strings, whatever the nesting.
function collect(node, out, key = '') {
  if (node == null) return;
  if (typeof node === 'string' || typeof node === 'number' || typeof node === 'boolean') { out.keyed.push([key, String(node)]); return; }
  if (Array.isArray(node)) { node.forEach(n => collect(n, out, key)); return; }
  if (typeof node === 'object') {
    const t = node.title ?? node.label ?? node.fieldTitle ?? node.field_title ?? node.name;
    const v = node.value ?? node.inputValue ?? node.fieldInputValue ?? node.field_input_value;
    if (typeof t === 'string' && v != null && typeof v !== 'object') out.pairs.push([t, String(v)]);
    if (typeof t === 'string' && Array.isArray(v)) out.pairs.push([t, v.join(', ')]);
    for (const [k, v2] of Object.entries(node)) collect(v2, out, k);
  }
}
const pick = (o, re) => { const p = o.pairs.find(([t]) => re.test(t)); if (p) return p[1]; const k = o.keyed.find(([k]) => re.test(k)); return k ? k[1] : ''; };

function programSegments(programText, childText) {
  const segs = RULES.filter(([, re]) => re.test(programText)).map(([n]) => n);
  if (/\b1\s*[–—-]\s*5\b/.test(programText) && !segs.some(s => /1–3|4–5/.test(s))) {
    const age = parseInt((childText.match(/\b(\d{1,2})\b/) || [])[1], 10);
    if (age >= 4) segs.push('Interested · Ages 4–5'); else segs.push('Interested · Ages 1–3');
  }
  if (!segs.length) { // "Not sure yet" or no program field: use the child's age if given
    const age = parseInt((childText.match(/\b(\d{1,2})\b/) || [])[1], 10);
    if (age >= 1 && age <= 3) segs.push('Interested · Ages 1–3');
    else if (age >= 4 && age <= 5) segs.push('Interested · Ages 4–5');
    else if (age >= 6 && age <= 9) segs.push('Interested · Ages 6–9');
    else if (age >= 10 && age <= 13) segs.push('Interested · Ages 10–13');
  }
  return [...new Set(segs)];
}

// Since Nov 17, 2026 the single path for every channel is the console's /api/intake: it records the family
// in Lili's console and adds them to Flodesk "Website Inquiries" + "New inquiries" (the one Welcome
// workflow; never twice). Program segments are no longer added here: families pick their program from
// the buttons in the welcome email (Flodesk link actions), which sends the program email.
// If the console can't be reached, the family is added to Flodesk directly with the same rules.
const crypto = require('crypto');
const DOOR = 'New inquiries';

async function direct(email, first, last) {
  const map = await segments();
  const base = map[BASE.toLowerCase()], door = map[DOOR.toLowerCase()];
  let existing = null;
  try { existing = await fd('/subscribers/' + encodeURIComponent(email).replace(/%40/g, '@')); } catch { existing = null; }
  if (existing && existing.status && existing.status !== 'active') return { skipped: existing.status };
  const inDoor = existing && (existing.segments || []).some(s => s.id === door);
  const ids = [base, inDoor ? null : door].filter(Boolean);
  const sub = await fd('/subscribers', { method: 'POST', body: JSON.stringify({ email, first_name: existing ? undefined : (first || undefined), last_name: existing ? undefined : (last || undefined), segment_ids: ids }) });
  if (ids.length && sub && sub.id) await fd(`/subscribers/${sub.id}/segments`, { method: 'POST', body: JSON.stringify({ segment_ids: ids }) });
  return { segments: ids.length, welcome: inDoor ? 'already' : (door ? 'queued' : 'no door segment') };
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Use POST.' });
  if (!process.env.WIX_WEBHOOK_KEY || req.query.key !== process.env.WIX_WEBHOOK_KEY) return res.status(401).json({ ok: false });
  let b = req.body || {};
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = {}; } }
  const o = { pairs: [], keyed: [] }; collect(b, o);
  const source = String(req.query.source || 'register');
  const emailRaw = pick(o, /^email$|e-?mail/i) || (o.keyed.map(([, v]) => v).find(v => EMAIL_RE.test(v)) || '');
  const email = (emailRaw.match(EMAIL_RE) || [''])[0].toLowerCase();
  if (!email) { console.log('no email in payload', JSON.stringify(b).slice(0, 1500)); return res.status(200).json({ ok: false, error: 'no email' }); }
  const first = pick(o, /first[ _]?name/i).slice(0, 80);
  const last = pick(o, /last[ _]?name/i).slice(0, 80);
  const program = pick(o, /program|interested/i).slice(0, 200);
  const child = pick(o, /child/i).slice(0, 200);
  const phone = pick(o, /phone|whats/i).slice(0, 60);
  const message = pick(o, /message|question|comment|notes?/i).slice(0, 3000);
  const id = 'wx-' + crypto.createHash('sha1').update(email).digest('hex').slice(0, 12);
  const row = { id, channel: 'Website', notify: false, name: [first, last].filter(Boolean).join(' '), email, phone, program, childAge: child,
    message: [source === 'popup' ? 'Signed up with the website pop-up.' : 'Website registration form.', program ? `Program: ${program}` : '', child ? `Child: ${child}` : '', message].filter(Boolean).join('\n') };
  try {
    const r = await fetch('https://wildchild-console.vercel.app/api/intake', { method: 'POST', headers: { 'content-type': 'application/json', 'x-intake-key': process.env.INTAKE_KEY || '' }, body: JSON.stringify(row) });
    const j = await r.json().catch(() => ({}));
    if (r.ok && j.ok) { console.log(JSON.stringify({ source, via: 'console', id, flodesk: j.flodesk })); return res.status(200).json({ ok: true, via: 'console' }); }
    console.error('console intake failed', r.status, JSON.stringify(j).slice(0, 300));
  } catch (e) { console.error('console intake error', String(e)); }
  try {
    const d = await direct(email, first, last);
    console.log(JSON.stringify({ source, via: 'direct', id, d }));
    return res.status(200).json({ ok: true, via: 'direct' });
  } catch (e) {
    console.error(String(e));
    return res.status(502).json({ ok: false, error: 'flodesk' });
  }
};
module.exports.programSegments = programSegments;
