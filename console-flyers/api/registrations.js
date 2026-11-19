import crypto from 'node:crypto';
import { put, get } from '@vercel/blob';
import { isAuthed } from './_auth.js';

// Registered families for classes and events (pottery, Saturdays, holiday camps...).
// Stored in Vercel Blob at registrations/all.json. Auth: console session cookie or x-intake-key.
const PATH = 'registrations/all.json';
const AGE_GROUPS = ['Adult', '1–3', '4–5', '6–9', '10–13', 'Not given'];

const SEED = [{
  id: 'reg-zarabi-pottery-20261121',
  program: 'Pottery',
  date: '2026-11-21',
  family: 'Sherry Zarabi',
  contact: '',
  notes: 'Family of 5. Ages for Mick and Maryam not given yet.',
  paid: false,
  created: Date.parse('2026-11-19T22:00:00Z'),
  people: [
    { name: 'Sherry Zarabi', group: 'Adult' },
    { name: "Sherry's husband", group: 'Adult' },
    { name: 'Daughter (8)', group: '6–9', age: 8 },
    { name: 'Mick', group: 'Not given' },
    { name: 'Maryam', group: 'Not given' },
  ],
}];

function keyOk(req) {
  const k = process.env.INTAKE_KEY || '';
  const got = req.headers['x-intake-key'] || '';
  if (!k || !got || got.length !== k.length) return false;
  return crypto.timingSafeEqual(Buffer.from(got), Buffer.from(k));
}

async function read() {
  try {
    const r = await get(PATH, { access: 'private', useCache: false });
    if (r && r.statusCode === 200 && r.stream) return JSON.parse(await new Response(r.stream).text());
  } catch {}
  return null;
}
async function write(list) {
  await put(PATH, JSON.stringify(list), { access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json' });
}
async function load() {
  let list = await read();
  if (!Array.isArray(list)) { list = SEED.slice(); await write(list); }
  return list;
}

const s = (v, n = 200) => (typeof v === 'string' ? v.trim().slice(0, n) : '');
function clean(b, prev = {}) {
  const people = Array.isArray(b.people) ? b.people.slice(0, 30).map(p => {
    const age = Number(p && p.age);
    const out = { name: s(p && p.name, 120) || 'Unnamed', group: AGE_GROUPS.includes(p && p.group) ? p.group : 'Not given' };
    if (Number.isFinite(age) && age > 0 && age < 120) out.age = age;
    return out;
  }) : (prev.people || []);
  return {
    id: prev.id || 'reg-' + Date.now().toString(36) + crypto.randomBytes(3).toString('hex'),
    program: s(b.program, 80) || prev.program || 'Other',
    date: /^\d{4}-\d{2}-\d{2}$/.test(b.date || '') ? b.date : (prev.date || ''),
    family: s(b.family, 120) || prev.family || '',
    contact: b.contact !== undefined ? s(b.contact, 160) : (prev.contact || ''),
    notes: b.notes !== undefined ? s(b.notes, 600) : (prev.notes || ''),
    paid: b.paid !== undefined ? !!b.paid : !!prev.paid,
    created: prev.created || Date.now(),
    people,
  };
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!isAuthed(req) && !keyOk(req)) return res.status(401).json({ error: 'Sign in' });
  const list = await load();
  if (req.method === 'GET') return res.status(200).json({ registrations: list, groups: AGE_GROUPS });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use GET or POST' });
  const b = req.body || {};
  if (b.action === 'delete') {
    const next = list.filter(r => r.id !== b.id);
    await write(next);
    return res.status(200).json({ ok: true, registrations: next });
  }
  if (b.id) {
    const i = list.findIndex(r => r.id === b.id);
    if (i < 0) return res.status(404).json({ error: 'Not found' });
    list[i] = clean(b, list[i]);
  } else {
    if (!s(b.family) || !Array.isArray(b.people) || !b.people.length) return res.status(400).json({ error: 'Add a family name and at least one person' });
    list.push(clean(b));
  }
  await write(list);
  return res.status(200).json({ ok: true, registrations: list });
}
