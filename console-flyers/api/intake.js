// Adds or updates one family inquiry from any channel (Instagram, WhatsApp, Email, Website, Other).
// Called by the inbox check (from a console tab, with the x-intake-key header) and by the
// "Add a family" form in Lili's console (signed-in session).
// For a family with an email it, once per inquiry (markers in Vercel Blob):
//   - adds them to Flodesk: the channel segment (e.g. "WhatsApp inquiries") and "New inquiries",
//     which triggers the single Welcome workflow. Anyone already in "New inquiries", or not active
//     in Flodesk (unsubscribed, bounced), is never added to it again, so the welcome goes out once.
//   - emails Lili a summary for Instagram/Other inquiries (WhatsApp and Email ones she already has).
import crypto from 'node:crypto';
import { put, get } from '@vercel/blob';
import { isAuthed } from './_auth.js';

const DOOR = 'New inquiries';
const CHANNEL_SEGMENT = { Instagram: 'Instagram inquiries', WhatsApp: 'WhatsApp inquiries', Email: 'Email inquiries', Website: 'Website Inquiries', Other: 'Other inquiries' };
const CHANNELS = Object.keys(CHANNEL_SEGMENT);
const FIELDS = ['name', 'handle', 'email', 'phone', 'childAge', 'stay', 'program', 'message', 'receivedAt', 'threadUrl'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const splitEmails = (s) => String(s || '').split(/\s*(?:,|;|\band\b)\s*/i).map(e => e.trim()).filter(e => EMAIL_RE.test(e));
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function keyOk(req) {
  const want = process.env.INTAKE_KEY || '';
  const got = String(req.headers['x-intake-key'] || '');
  if (!want || got.length !== want.length) return false;
  return crypto.timingSafeEqual(Buffer.from(got), Buffer.from(want));
}
async function readBlob(path) {
  try {
    const r = await get(path, { access: 'private', useCache: false });
    if (r && r.statusCode === 200 && r.stream) return JSON.parse(await new Response(r.stream).text());
    return null;
  } catch (e) {
    if (/not.?found|does not exist|404/i.test(e.message || '')) return null;
    throw e;
  }
}
const writeBlob = (path, obj) => put(path, JSON.stringify(obj), { access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json' });

async function flodesk(row) {
  const KEY = process.env.FLODESK_API_KEY;
  if (!KEY) return { ok: false, error: 'FLODESK_API_KEY not set' };
  const headers = { Authorization: 'Basic ' + Buffer.from(KEY + ':').toString('base64'), 'Content-Type': 'application/json', 'User-Agent': 'Wild Child Console (wildchild-console.vercel.app)' };
  const fd = async (path, opts = {}) => {
    for (let i = 0; ; i++) {
      const r = await fetch('https://api.flodesk.com/v1' + path, { ...opts, headers });
      const t = await r.text();
      if (r.status === 429 && i < 3) { await new Promise(x => setTimeout(x, 1500 * (i + 1))); continue; }
      return { ok: r.ok, status: r.status, j: (() => { try { return JSON.parse(t); } catch { return null; } })(), t };
    }
  };
  const seg = {};
  for (let page = 1; page < 10; page++) {
    const r = await fd(`/segments?page=${page}&per_page=100`);
    if (!r.ok) return { ok: false, error: `segments ${r.status}` };
    (r.j.data || []).forEach(s => { seg[s.name.trim().toLowerCase()] = s.id; });
    if (!r.j.meta || page >= (r.j.meta.total_pages || 1)) break;
  }
  const door = seg[DOOR.toLowerCase()];
  const chan = seg[CHANNEL_SEGMENT[row.channel].toLowerCase()];
  const parts = String(row.name || '').trim().split(/\s+/).filter(Boolean);
  const out = [];
  for (const addr of splitEmails(row.email)) {
    // Look up first (the address goes in the path as-is; Flodesk 404s on an encoded @).
    const g = await fd('/subscribers/' + encodeURIComponent(addr).replace(/%40/g, '@'));
    const exists = g.ok && g.j && g.j.id;
    const status = exists ? String(g.j.status || '') : 'new';
    if (exists && status !== 'active') { out.push(`${addr}: ${status}, not added`); continue; }
    const inDoor = exists && (g.j.segments || []).some(s => s.id === door);
    const ids = [chan, (inDoor || row.welcome === false) ? null : door].filter(Boolean);
    const body = { email: addr, segment_ids: ids };
    if (!exists && parts[0]) { body.first_name = parts[0]; body.last_name = parts.slice(1).join(' ') || undefined; }
    const p = await fd('/subscribers', { method: 'POST', body: JSON.stringify(body) });
    if (!p.ok) { out.push(`${addr}: add failed ${p.status}`); continue; }
    const id = (p.j && p.j.id) || (exists && g.j.id);
    if (id && ids.length) await fd(`/subscribers/${id}/segments`, { method: 'POST', body: JSON.stringify({ segment_ids: ids }) });
    out.push(`${addr}: ${inDoor ? 'already welcomed' : row.welcome === false ? 'no welcome (Lili wrote directly)' : (door ? 'welcome queued' : 'no "New inquiries" segment yet')}${chan ? '' : ', channel segment missing'}`);
  }
  return { ok: true, result: out };
}

async function notifyLili(row) {
  const KEY = process.env.RESEND_API_KEY;
  if (!KEY) return { ok: false, error: 'RESEND_API_KEY not set' };
  const rows = [['Name', row.name || row.handle || 'Unknown'], ['Channel', row.channel], ['Email', row.email], ['Phone', row.phone], ["Child's age", row.childAge || 'Not shared'], ['Time in Nosara', row.stay || 'Not shared'], ['Program', row.program], ['Instagram', row.handle ? '@' + row.handle : '']].filter(([, v]) => v);
  const text = rows.map(([k, v]) => `${k}: ${v}`).join('\n') + `\n\nTheir message:\n${row.message || ''}\n\nReply to this email to answer them directly.\nAll inquiries: https://wildchild-console.vercel.app\n`;
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#1b1f3a;max-width:560px"><p style="color:#25318d;font-size:18px;font-weight:bold;margin:0 0 12px">New family inquiry</p><table style="border-collapse:collapse">${rows.map(([k, v]) => `<tr><td style="padding:3px 14px 3px 0;color:#5b6080">${esc(k)}</td><td style="padding:3px 0"><b>${esc(v)}</b></td></tr>`).join('')}</table><p style="margin:16px 0 6px;color:#5b6080">Their message</p><div style="background:#e9ebf8;border-radius:8px;padding:10px 12px;white-space:pre-wrap">${esc(row.message)}</div><p style="margin:16px 0 0">Reply to this email to answer them directly.${row.threadUrl ? ` <a href="${esc(row.threadUrl)}">Open the conversation</a>.` : ''}</p><p style="margin:8px 0 0"><a href="https://wildchild-console.vercel.app">See all inquiries</a></p></div>`;
  const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: 'Wild Child Inquiries <info@dandelionwildschooling.org>', to: ['info@dandelionwildschooling.org'], reply_to: splitEmails(row.email), subject: `New family inquiry: ${row.name || row.handle || row.email}`, text, html }) });
  return { ok: r.ok, status: r.status };
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });
  if (!isAuthed(req) && !keyOk(req)) return res.status(401).json({ error: 'Sign in' });
  let b = req.body || {};
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = {}; } }
  const channel = CHANNELS.includes(b.channel) ? b.channel : 'Other';
  let id = String(b.id || '').trim().slice(0, 120);
  if (!id) id = `${channel.slice(0, 2).toLowerCase()}-${Date.now().toString(36)}`;
  if (!/^[a-z0-9][a-z0-9._-]*$/i.test(id)) return res.status(400).json({ error: 'Bad id' });
  const path = `intake/${id}.json`;
  let row;
  try { row = (await readBlob(path)) || { id, receivedAt: new Date().toISOString() }; }
  catch (e) { return res.status(503).json({ error: 'Storage unavailable, nothing saved. Try again.' }); }
  for (const f of FIELDS) if (b[f] !== undefined && String(b[f]).trim() !== '') row[f] = String(b[f]).slice(0, f === 'message' ? 6000 : 300);
  row.channel = channel;
  if (b.welcome === false) row.welcome = false;
  row.updatedAt = new Date().toISOString();
  await writeBlob(path, row);

  const report = { id, saved: true };
  if (splitEmails(row.email).length) {
    if (!(await readBlob(`flodesk/${id}.json`))) {
      try {
        const f = await flodesk(row);
        report.flodesk = f;
        if (f.ok) await writeBlob(`flodesk/${id}.json`, { email: row.email, at: new Date().toISOString(), result: f.result });
      } catch (e) { report.flodesk = { ok: false, error: String(e.message || e).slice(0, 200) }; }
    } else report.flodesk = { ok: true, result: ['already added earlier'] };
  }
  const notify = b.notify !== undefined ? !!b.notify : (channel === 'Instagram' || channel === 'Other');
  if (notify && (row.email || row.phone) && !(await readBlob(`notified/${id}.json`))) {
    try {
      const n = await notifyLili(row);
      report.notify = n;
      if (n.ok) await writeBlob(`notified/${id}.json`, { at: new Date().toISOString() });
    } catch (e) { report.notify = { ok: false, error: String(e.message || e).slice(0, 200) }; }
  }
  return res.status(200).json({ ok: true, ...report });
}
