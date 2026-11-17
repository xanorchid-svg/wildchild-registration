import { list, get } from '@vercel/blob';
import { isAuthed } from './_auth.js';
import { INQUIRIES, LAST_CHECKED } from './_data.js';

async function readPrefix(prefix) {
  const out = {};
  try {
    let cursor;
    do {
      const page = await list({ prefix, cursor });
      await Promise.all(page.blobs.map(async (b) => {
        const r = await get(b.pathname, { access: 'private', useCache: false });
        if (r && r.statusCode === 200 && r.stream) {
          const txt = await new Response(r.stream).text();
          const id = b.pathname.slice(prefix.length).replace(/\.json$/, '');
          try { out[id] = JSON.parse(txt); } catch {}
        }
      }));
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
  } catch (e) {
    console.error('readPrefix failed', prefix, e);
  }
  return out;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!isAuthed(req)) return res.status(401).json({ error: 'Sign in' });
  const [edits, intake, meta] = await Promise.all([readPrefix('edits/'), readPrefix('intake/'), readPrefix('meta/')]);
  const byId = {};
  for (const r of INQUIRIES) byId[r.id] = r;
  for (const [id, r] of Object.entries(intake)) byId[id] = { ...(byId[id] || {}), ...r, id };
  const rows = Object.values(byId).map(r => ({ status: 'new', notes: '', ...r, ...(edits[r.id] || {}) }))
    .sort((a, b) => String(b.receivedAt).localeCompare(String(a.receivedAt)));
  const checked = [LAST_CHECKED, meta['last-checked'] && meta['last-checked'].at].filter(Boolean).sort().pop();
  return res.status(200).json({ lastCheckedAt: checked, inquiries: rows });
}
