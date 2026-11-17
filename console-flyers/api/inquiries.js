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
  const [edits, intake, meta, fl] = await Promise.all([readPrefix('edits/'), readPrefix('intake/'), readPrefix('meta/'), readPrefix('flodesk/')]);
  const byId = {};
  for (const r of INQUIRIES) byId[r.id] = r;
  for (const [id, r] of Object.entries(intake)) byId[id] = { ...(byId[id] || {}), ...r, id };
  const welcomeOf = (r) => {
    if (!String(r.email || '').includes('@')) return 'none';
    if (r.welcome === false) return 'skipped';
    const res = ((fl[r.id] && fl[r.id].result) || []).join(' ');
    if (/no welcome/.test(res)) return 'skipped';
    if (/unsubscribed|bounced|not added/.test(res)) return 'unsub';
    if (/already/.test(res)) return 'already';
    return 'queued';
  };
  const rows = Object.values(byId).map(r => { const e = edits[r.id] || {}; return { status: 'new', notes: '', ...r, ...e, welcome: e.welcome || welcomeOf(r) }; })
    .sort((a, b) => String(b.receivedAt).localeCompare(String(a.receivedAt)));
  const checked = [LAST_CHECKED, meta['last-checked'] && meta['last-checked'].at].filter(Boolean).sort().pop();
  return res.status(200).json({ lastCheckedAt: checked, inquiries: rows });
}
