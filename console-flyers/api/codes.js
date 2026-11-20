import { put, get } from '@vercel/blob';
import { isAuthed } from './_auth.js';

// Discount codes for Lili's console (Codes tab). Stored privately in Vercel Blob (codes/all.json),
// never in the page source. Anyone signed in to the console can read and edit them.
const PATH = 'codes/all.json';
const START = [];

async function read() {
  try {
    const r = await get(PATH, { access: 'private', useCache: false });
    if (r && r.statusCode === 200 && r.stream) return JSON.parse(await new Response(r.stream).text());
  } catch {}
  return START;
}
const clip = (s, n) => String(s ?? '').slice(0, n).trim();

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!isAuthed(req)) return res.status(401).json({ error: 'Sign in to the console first.' });
  if (req.method === 'GET') return res.status(200).json({ codes: await read() });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use GET or POST' });
  const b = req.body || {};
  if (!Array.isArray(b.codes) || b.codes.length > 200) return res.status(400).json({ error: 'Could not save.' });
  const codes = b.codes.map(c => ({ code: clip(c.code, 60), label: clip(c.label, 120), discount: clip(c.discount, 80), expires: clip(c.expires, 40), note: clip(c.note, 300) })).filter(c => c.code);
  await put(PATH, JSON.stringify(codes), { access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json' });
  return res.status(200).json({ ok: true, codes });
}
