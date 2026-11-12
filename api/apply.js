// Volunteer / "Work with us" applications from /work-with-us.
// Emails each application to info@dandelionwildschooling.org through Resend, reply-to set to the applicant.
// Applicants are not added to Flodesk (they are not families).
// POST /api/apply  JSON: { email, first_name?, last_name?, fields: [[label, value], ...], company?: "" (honeypot) }
// Needs RESEND_API_KEY (send-only key for agency.dreamxanadu.com) in the Vercel project.

const TO = 'info@dandelionwildschooling.org';
const FROM = 'Wild Child Nosara Website <wildchild@agency.dreamxanadu.com>';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ALLOWED_ORIGIN = /^https:\/\/((www\.)?wildchildnosara\.com|wildchild-nosara-site(-[a-z0-9-]+)?\.vercel\.app)$/;
const FALLBACK = 'Please email info@dandelionwildschooling.org or WhatsApp +506 6164 0827.';
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clip = (s, n) => String(s ?? '').slice(0, n);
const recent = new Map();

module.exports = async function handler(req, res) {
  const origin = req.headers.origin || '';
  if (origin && !ALLOWED_ORIGIN.test(origin)) return res.status(403).json({ ok: false, error: 'Not allowed.' });
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Use POST.' });
  let b = req.body || {};
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = {}; } }
  if (b.company) return res.status(200).json({ ok: true });
  const email = clip(b.email, 200).trim();
  if (!EMAIL_RE.test(email)) return res.status(400).json({ ok: false, error: 'Please enter a valid email address.' });

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0];
  const now = Date.now(), hits = (recent.get(ip) || []).filter(t => now - t < 60000);
  if (hits.length >= 5) return res.status(429).json({ ok: false, error: 'Too many submissions. ' + FALLBACK });
  recent.set(ip, [...hits, now]);

  const name = [b.first_name, b.last_name].filter(Boolean).map(s => clip(s, 80).trim()).join(' ') || email;
  const fields = (Array.isArray(b.fields) ? b.fields : []).slice(0, 40)
    .map(r => [clip(r && r[0], 80), clip(r && r[1], 4000)]).filter(r => r[0] && r[1]);
  const role = (fields.find(r => /role/i.test(r[0])) || [, 'Volunteer'])[1];

  const text = fields.map(([k, v]) => `${k}: ${v}`).join('\n') + '\n\nReply to this email to answer them directly.\n';
  const html = `<div style="font-family:Georgia,serif;color:#3b2f22;max-width:620px">
<h2 style="font-weight:normal;margin:0 0 4px">New volunteer application</h2>
<p style="margin:0 0 18px;color:#6b5d48">From the Work With Us page on the Wild Child website</p>
<table style="border-collapse:collapse;width:100%">${fields.map(([k, v]) => `<tr><td style="padding:8px 12px 8px 0;vertical-align:top;color:#6b5d48;white-space:nowrap;border-top:1px solid #e8e0cf">${esc(k)}</td><td style="padding:8px 0;border-top:1px solid #e8e0cf;white-space:pre-wrap">${esc(v)}</td></tr>`).join('')}</table>
<p style="margin-top:18px;color:#6b5d48">Reply to this email to answer ${esc(name)} directly.</p></div>`;

  const key = process.env.RESEND_API_KEY;
  if (!key) return res.status(500).json({ ok: false, error: 'The form is not set up yet. ' + FALLBACK });
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to: [TO], reply_to: email, subject: `Volunteer application: ${clip(name, 80)} (${clip(role, 120)})`, text, html }),
    });
    if (!r.ok) { console.error('resend', r.status, await r.text()); throw new Error('send'); }
  } catch (e) {
    return res.status(502).json({ ok: false, error: 'Something went wrong sending your application. ' + FALLBACK });
  }
  return res.status(200).json({ ok: true });
};
