// Approvals queue: everything that needs Lili's OK before it reaches a family.
//   kind "invoice"  – a priced invoice drafted from a Brightwheel registration. Approve → the scheduled
//                      check creates and sends it in Brightwheel, then marks it done.
//   kind "payment"  – a Zelle / bank payment matched (or not) to an open invoice. Approve → the parent gets
//                      the enrollment confirmation email right away (Wild Child Resend), card moves to Enrolled.
//   kind "chatnote" – a short "we just emailed you" note for WhatsApp / Instagram. Approve → the scheduled
//                      check sends it in that chat, then marks it done.
// Storage: private Vercel Blob approvals/queue.json. Scripts use the x-intake-key header; Lili uses her session.
import { put, get } from '@vercel/blob';
import { isAuthed } from './_auth.js';
import { keyOk } from './_lib.js';

const PATH = 'approvals/queue.json';
const LILI = process.env.LILI_EMAIL || 'info@dandelionwildschooling.org';
const FROM = process.env.WC_FROM || 'Wild Child Nosara <info@dandelionwildschooling.org>';
const CONSOLE_URL = 'https://wildchild-console.vercel.app/#approvals';

// One price sheet for everything (USD per week; 3 days = 3/5 of 5 days).
export const PRICES = {
  '1-3': { label: 'Ages 1–3', d5: 445, d3: 267, lunch: 10 },
  '4-5': { label: 'Ages 4–5', d5: 445, d3: 267, lunch: 10 },
  '6-9': { label: 'Ages 6–9', d5: 480, d3: 288, lunch: 12 },
  '10-13': { label: 'Ages 10–13', d5: 595, d3: 357, lunch: 15 },
};
export const HOURS = {
  '1-3': 'Arrival 9:00 am. Pick-up 12:30 pm (before lunch), 1:00 pm (after lunch) or 3:00 pm (with a nap at school).',
  '4-5': 'Drop-off 9:00 am, pick-up 3:00 pm.',
  '6-9': 'Drop-off 9:00 am, pick-up 3:00 pm. On Tuesdays we meet at Garza at 7:30 am; pick-up is back at school at 3:00 pm.',
  '10-13': 'Drop-off 9:00 am, pick-up 3:00 pm. On Tuesdays we meet at Garza at 7:30 am; pick-up is back at school at 3:00 pm.',
};
const r2 = (n) => Math.round(n * 100) / 100;
export function quote({ group, days = 5, weeks = 1, lunch = false, sibling = false }) {
  const p = PRICES[group];
  if (!p) throw new Error('Unknown group ' + group);
  days = Number(days) === 3 ? 3 : 5; weeks = Math.max(1, Math.round(Number(weeks) || 1));
  const weekly = days === 5 ? p.d5 : p.d3;
  const lines = [{ label: `${p.label} tuition, ${days} days/week`, qty: weeks, unit: weekly, amount: weekly * weeks }];
  const tuition = weekly * weeks;
  const commit = weeks >= 12 ? 0.15 : weeks >= 8 ? 0.10 : weeks >= 4 ? 0.05 : 0;
  if (commit) lines.push({ label: `${Math.round(commit * 100)}% off for ${weeks} weeks`, amount: -r2(tuition * commit) });
  let afterCommit = r2(tuition * (1 - commit));
  if (sibling) { lines.push({ label: '10% sibling discount', amount: -r2(afterCommit * 0.10) }); afterCommit = r2(afterCommit * 0.9); }
  if (lunch) lines.push({ label: `Organic snack and lunch, $${p.lunch}/day`, qty: days * weeks, unit: p.lunch, amount: p.lunch * days * weeks });
  const total = r2(lines.reduce((s, l) => s + l.amount, 0));
  return { group, days, weeks, lunch: !!lunch, sibling: !!sibling, lines, total };
}

async function load() {
  try {
    const r = await get(PATH, { access: 'private', useCache: false });
    if (!r) return { items: [] };
    const txt = r.stream ? await new Response(r.stream).text() : await r.text?.();
    const j = JSON.parse(txt || '{}');
    return { items: Array.isArray(j.items) ? j.items : [] };
  } catch { return { items: [] }; }
}
async function save(db) {
  db.items = db.items.slice(-500);
  await put(PATH, JSON.stringify(db), { access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json' });
}

async function sendEmail({ to, subject, html, text, replyTo }) {
  const key = process.env.WC_RESEND_API_KEY;
  if (!key) return { ok: false, error: 'No Wild Child Resend key (WC_RESEND_API_KEY) set yet' };
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: [].concat(to), subject, html, text, reply_to: replyTo || LILI }),
  });
  const j = await r.json().catch(() => ({}));
  return r.ok ? { ok: true, id: j.id } : { ok: false, error: j.message || `Resend ${r.status}` };
}

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const money = (n) => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d) => { try { return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }); } catch { return d; } };

export function confirmationEmail(it) {
  const d = it.details || {}; const f = it.family || {};
  const first = (f.parentFirst || f.name || '').split(' ')[0] || 'there';
  const children = (d.children && d.children.length ? d.children : [{ name: f.child, group: d.group }]).filter((c) => c && c.name);
  const rows = children.map((c) => `<tr><td style="padding:6px 0;color:#5b6080">${esc(c.name)}</td><td style="padding:6px 0;text-align:right">${esc((PRICES[c.group] || {}).label || c.group || '')}${d.days ? `, ${d.days} days a week` : ''}</td></tr>`).join('');
  const hours = [...new Set(children.map((c) => HOURS[c.group]).filter(Boolean))];
  const html = `<!doctype html><html><body style="margin:0;background:#f4f5fb;font-family:Georgia,serif;color:#1b1f3a">
<div style="max-width:560px;margin:0 auto;padding:28px 22px">
<p style="font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#25318d;margin:0 0 6px">Wild Child Nosara 🌀</p>
<h1 style="font-size:26px;color:#25318d;margin:0 0 18px">Your place is confirmed</h1>
<p>Dear ${esc(first)},</p>
<p>Thank you, we received your payment of <b>${money(d.amount)}</b>. ${children.length > 1 ? 'Your children are' : `${esc(children[0]?.name || 'Your child')} is`} officially enrolled, and we can't wait to welcome you.</p>
<table style="width:100%;border-collapse:collapse;border-top:1px solid #dcdff0;border-bottom:1px solid #dcdff0;margin:16px 0;font-size:15px">${rows}
${d.start ? `<tr><td style="padding:6px 0;color:#5b6080">First day</td><td style="padding:6px 0;text-align:right">${esc(fmtDate(d.start))}</td></tr>` : ''}
${d.end ? `<tr><td style="padding:6px 0;color:#5b6080">Last day</td><td style="padding:6px 0;text-align:right">${esc(fmtDate(d.end))}</td></tr>` : ''}
${d.weekdays ? `<tr><td style="padding:6px 0;color:#5b6080">Days</td><td style="padding:6px 0;text-align:right">${esc(d.weekdays)}</td></tr>` : ''}
<tr><td style="padding:6px 0;color:#5b6080">Paid</td><td style="padding:6px 0;text-align:right">${money(d.amount)}${d.source ? ' by ' + esc(d.source) : ''}</td></tr></table>
<h2 style="font-size:18px;color:#25318d;margin:22px 0 6px">Your days with us</h2>
${hours.map((h) => `<p style="margin:4px 0">${esc(h)}</p>`).join('')}
<p style="margin:10px 0 4px"><b>Where:</b> Wild Child, 300 metres east of the Osteonal crossing, Barrio San Ramón, Nosara.</p>
<p style="margin:4px 0"><b>What to bring:</b> backpack, water bottle, change of clothes, sun hat, sunscreen, swimsuit and towel.</p>
<p style="margin:16px 0 4px">Please join our parents' WhatsApp group for updates and events:<br><a style="color:#25318d" href="https://chat.whatsapp.com/C5jFFka7huS16KE732HXvR">Join the Wild Child parents' group</a></p>
<p style="margin:18px 0 4px">Questions? Just reply to this email or WhatsApp us at +506 6164 0827.</p>
<p style="margin:22px 0 0">With warmth,<br>Lili and the Wild Child team</p>
</div></body></html>`;
  const text = `Dear ${first},\n\nThank you, we received your payment of ${money(d.amount)}. ${children.map((c) => c.name).join(' and ')} ${children.length > 1 ? 'are' : 'is'} officially enrolled.\n\n${children.map((c) => `${c.name}: ${(PRICES[c.group] || {}).label || ''}`).join('\n')}\n${d.start ? 'First day: ' + fmtDate(d.start) + '\n' : ''}${d.end ? 'Last day: ' + fmtDate(d.end) + '\n' : ''}\n${hours.join('\n')}\nWhere: Wild Child, 300 metres east of the Osteonal crossing, Barrio San Ramón, Nosara.\nWhat to bring: backpack, water bottle, change of clothes, sun hat, sunscreen, swimsuit and towel.\nParents' WhatsApp group: https://chat.whatsapp.com/C5jFFka7huS16KE732HXvR\n\nQuestions? Reply to this email or WhatsApp +506 6164 0827.\n\nWith warmth,\nLili and the Wild Child team`;
  return { subject: `You're enrolled at Wild Child 🌀 ${children.map((c) => c.name.split(' ')[0]).join(' & ')}`, html, text };
}

function notifyText(it) {
  const f = it.family || {}; const d = it.details || {};
  if (it.kind === 'payment') return `Payment from ${d.payer || f.name}: ${money(d.amount)}${d.invoiceTotal != null ? ` (invoice ${money(d.invoiceTotal)})` : ''}. ${it.checkNote || ''}`;
  if (it.kind === 'invoice') return `Invoice ready for ${f.name}${f.child ? ' (' + f.child + ')' : ''}: ${money(d.total)}. ${it.checkNote || ''}`;
  return `Chat note ready for ${f.name} on ${d.channel}.`;
}

export default async function handler(req, res) {
  const viaKey = keyOk(req);
  if (!viaKey && !isAuthed(req)) return res.status(401).json({ error: 'Not signed in' });

  if (req.method === 'GET') {
    if (req.query.quote) {
      try { return res.json(quote({ group: req.query.group, days: req.query.days, weeks: req.query.weeks, lunch: req.query.lunch === '1', sibling: req.query.sibling === '1' })); }
      catch (e) { return res.status(400).json({ error: e.message }); }
    }
    if (req.query.preview) {
      const db = await load(); const it = db.items.find((x) => x.id === req.query.preview);
      if (!it) return res.status(404).send('Not found');
      res.setHeader('Content-Type', 'text/html; charset=utf-8'); return res.send(confirmationEmail(it).html);
    }
    const db = await load();
    const state = req.query.state;
    return res.json({ items: state ? db.items.filter((x) => x.state === state) : db.items, prices: PRICES, emailReady: !!process.env.WC_RESEND_API_KEY });
  }
  if (req.method !== 'POST') return res.status(405).end();

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const { action } = body;
  const db = await load();
  const now = new Date().toISOString();

  if (action === 'add') {
    if (!viaKey) return res.status(403).json({ error: 'Scripts only' });
    const incoming = [].concat(body.items || body.item || []);
    const added = []; const skipped = [];
    for (const raw of incoming) {
      if (!raw || !raw.id || !['invoice', 'payment', 'chatnote'].includes(raw.kind)) { skipped.push(raw && raw.id); continue; }
      if (db.items.some((x) => x.id === raw.id)) { skipped.push(raw.id); continue; } // never twice
      const it = { ...raw, state: 'pending', createdAt: now, history: [{ at: now, what: 'added' }] };
      if (it.kind === 'invoice' && it.details && it.details.group && !it.details.lines) {
        Object.assign(it.details, quote(it.details));
      }
      db.items.push(it); added.push(it);
    }
    await save(db);
    if (added.length && body.notify !== false) {
      const lines = added.map((it) => '• ' + notifyText(it)).join('\n');
      await sendEmail({ to: LILI, subject: `Wild Console: ${added.length} to approve`, text: `${lines}\n\nReview: ${CONSOLE_URL}`, html: `<p>${added.map((it) => esc(notifyText(it))).join('<br>')}</p><p><a href="${CONSOLE_URL}">Open Approvals</a></p>` }).catch(() => {});
    }
    return res.json({ added: added.map((x) => x.id), skipped });
  }

  const it = db.items.find((x) => x.id === body.id);
  if (!it) return res.status(404).json({ error: 'Not found' });

  if (action === 'approve') {
    if (it.state !== 'pending') return res.status(409).json({ error: 'Already ' + it.state });
    if (body.edits && typeof body.edits === 'object') {
      it.details = { ...(it.details || {}), ...body.edits.details };
      it.family = { ...(it.family || {}), ...body.edits.family };
      if (it.kind === 'invoice' && body.edits.requote && it.details.group) Object.assign(it.details, quote(it.details));
    }
    it.history.push({ at: now, what: 'approved by Lili' });
    if (it.kind === 'payment') {
      const to = (it.family || {}).email;
      if (!to) { it.state = 'approved'; it.result = 'Approved, but no parent email on file: send the confirmation yourself.'; }
      else {
        const m = confirmationEmail(it);
        const sent = await sendEmail({ to, subject: m.subject, html: m.html, text: m.text });
        if (!sent.ok) { await save(db); return res.status(502).json({ error: 'Confirmation email not sent: ' + sent.error }); }
        it.state = 'done'; it.result = `Confirmation emailed to ${to}`; it.history.push({ at: now, what: it.result });
        const ch = (it.family || {}).channel;
        if ((ch === 'WhatsApp' || ch === 'Instagram') && (it.family || {}).threadUrl) {
          const nid = 'note-confirm-' + it.id;
          if (!db.items.some((x) => x.id === nid)) db.items.push({ id: nid, kind: 'chatnote', state: 'pending', createdAt: now, family: it.family, details: { channel: ch, step: 'confirmation', text: `Hi ${(it.family.parentFirst || it.family.name || '').split(' ')[0]}! We just emailed your enrollment confirmation, with everything for the first day. See you soon 🌀 Lili` }, history: [{ at: now, what: 'added after confirmation' }] });
        }
      }
    } else {
      it.state = 'approved'; // the scheduled check does the Brightwheel invoice / chat message, then marks done
    }
    await save(db);
    return res.json({ ok: true, item: it });
  }
  if (action === 'dismiss') {
    it.state = 'dismissed'; it.history.push({ at: now, what: 'dismissed' + (body.reason ? ': ' + body.reason : '') });
    await save(db); return res.json({ ok: true });
  }
  if (action === 'done') {
    if (!viaKey) return res.status(403).json({ error: 'Scripts only' });
    it.state = body.failed ? 'approved' : 'done'; it.result = body.result || it.result;
    it.history.push({ at: now, what: (body.failed ? 'failed: ' : 'done: ') + (body.result || '') });
    await save(db); return res.json({ ok: true });
  }
  return res.status(400).json({ error: 'Unknown action' });
}
