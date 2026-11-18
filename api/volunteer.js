// Volunteer applications from the hidden "Work With Us" page on wildchildnosara.com.
// The page's HTML embed POSTs JSON here; we email the application to info@ via Resend.
// Volunteers are NOT families: nothing here touches the console intake or Flodesk.
// Env: RESEND_API_KEY (Resend account with the verified dreamxanadu.com domain).

const TO = 'info@dandelionwildschooling.org';
const FROM = 'Wild Child Volunteers <volunteers@dreamxanadu.com>';
const EMAIL_RE = /^[^\s@"<>]+@[^\s@"<>]+\.[^\s@"<>]{2,}$/;
const FIELDS = [
  ['name', 'Name'],
  ['email', 'Email'],
  ['whatsapp', 'WhatsApp'],
  ['roles', 'Role(s)'],
  ['availability', 'Availability'],
  ['languages', 'Languages'],
  ['location', 'Where they are based'],
  ['experience', 'Experience and gifts'],
  ['why', 'Why Wild Child'],
  ['heard', 'How they heard about us'],
];

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clean = (v) => (Array.isArray(v) ? v.join(', ') : String(v == null ? '' : v)).trim().slice(0, 4000);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method === 'GET' && req.query.ping) return res.json({ ok: true, resend: !!process.env.RESEND_API_KEY });
  if (req.method !== 'POST') return res.status(405).json({ ok: false });

  let b = req.body || {};
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = {}; } }
  if (b.website) return res.json({ ok: true }); // honeypot: bots fill the hidden field

  const d = Object.fromEntries(FIELDS.map(([k]) => [k, clean(b[k])]));
  if (!d.name || !EMAIL_RE.test(d.email) || !d.roles) return res.status(400).json({ ok: false, error: 'Please add your name, a valid email and at least one role.' });

  const KEY = process.env.RESEND_API_KEY;
  if (!KEY) return res.status(500).json({ ok: false, error: 'Email is not set up yet.' });

  const rows = FIELDS.filter(([k]) => d[k]);
  const text = rows.map(([k, l]) => `${l}: ${d[k]}`).join('\n\n') + '\n\nReply to this email to write back to the applicant.';
  const html = `<div style="font-family:Georgia,serif;color:#1f2a44;max-width:620px">
<h2 style="color:#1f3fae;margin:0 0 4px">New volunteer application</h2>
<p style="margin:0 0 18px;color:#555">From the Work With Us page. Reply to this email to write back to ${esc(d.name)}.</p>
${rows.map(([k, l]) => `<p style="margin:0 0 14px"><strong style="color:#1f3fae">${esc(l)}</strong><br>${esc(d[k]).replace(/\n/g, '<br>')}</p>`).join('')}
</div>`;

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: [TO], reply_to: d.email, subject: `Volunteer application: ${d.name} (${d.roles})`, text, html }),
  });
  if (!r.ok) {
    console.error('resend', r.status, await r.text());
    return res.status(502).json({ ok: false, error: 'We could not send your application. Please message us on WhatsApp.' });
  }
  return res.json({ ok: true });
};
