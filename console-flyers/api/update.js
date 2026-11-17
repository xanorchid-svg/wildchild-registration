import crypto from 'node:crypto';
import { put, get, head } from '@vercel/blob';
import { isAuthed } from './_auth.js';
import { INQUIRIES } from './_data.js';

const STATUSES = new Set(['new', 'emailed', 'visit', 'registered', 'invoiced', 'enrolled', 'notfit']);

async function known(id) {
  if (INQUIRIES.some(r => r.id === id)) return true;
  if (!/^[a-z0-9][a-z0-9._-]*$/i.test(String(id || ''))) return false;
  try { await head(`intake/${id}.json`); return true; } catch { return false; }
}

function keyOk(req) {
  const want = process.env.INTAKE_KEY || '', got = String(req.headers['x-intake-key'] || '');
  return !!want && got.length === want.length && crypto.timingSafeEqual(Buffer.from(got), Buffer.from(want));
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });
  if (!isAuthed(req) && !keyOk(req)) return res.status(401).json({ error: 'Sign in' });
  const { id, status, notes } = req.body || {};
  if (!(await known(id))) return res.status(404).json({ error: 'Unknown inquiry' });
  const path = `edits/${id}.json`;
  let current = {};
  try {
    const r = await get(path, { access: 'private', useCache: false });
    if (r && r.statusCode === 200 && r.stream) current = JSON.parse(await new Response(r.stream).text());
  } catch {}
  if (status !== undefined) {
    if (!STATUSES.has(status)) return res.status(400).json({ error: 'Unknown status' });
    current.status = status;
  }
  if (notes !== undefined) current.notes = String(notes).slice(0, 5000);
  if (req.body && req.body.appendNote) current.notes = [current.notes, String(req.body.appendNote).slice(0, 2000)].filter(Boolean).join('\n');
  if (req.body && ['queued', 'sent', 'already', 'skipped', 'unsub', 'none'].includes(req.body.welcome)) current.welcome = req.body.welcome;
  current.updatedAt = new Date().toISOString();
  await put(path, JSON.stringify(current), {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
  });
  return res.status(200).json({ ok: true, ...current });
}
