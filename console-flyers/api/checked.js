// The inbox check calls this (x-intake-key) at the end of each run so the console shows when it last ran.
import crypto from 'node:crypto';
import { put } from '@vercel/blob';
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });
  const want = process.env.INTAKE_KEY || '', got = String(req.headers['x-intake-key'] || '');
  if (!want || got.length !== want.length || !crypto.timingSafeEqual(Buffer.from(got), Buffer.from(want))) return res.status(401).json({ error: 'No' });
  const at = new Date().toISOString();
  await put('meta/last-checked.json', JSON.stringify({ at }), { access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json' });
  return res.status(200).json({ ok: true, at });
}
