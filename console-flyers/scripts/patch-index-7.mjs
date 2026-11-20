// Nov 20: (1) new school hours 9 am–3 pm in every message and caption; (2) "To approve" page:
// invoices, payments and chat notes waiting for Lili (api/approvals.js). Patches public/index.html at build time.
import { readFileSync, writeFileSync } from 'node:fs';
const F = 'public/index.html';
let h = readFileSync(F, 'utf8');

// 1. Hours. General opening hours only; the Thanksgiving-week hour-by-hour timetable is left as is.
const HOURS = [
  ['8am–2pm', '9am–3pm'], ['8am-2pm', '9am-3pm'], ['8 AM–2 PM', '9 AM–3 PM'],
  ['8 am – 2 pm', '9 am – 3 pm'], ['8 am–2 pm', '9 am–3 pm'],
  ['8:00 a.m.–2:00 p.m.', '9:00 a.m.–3:00 p.m.'], ['8:00 am–2:00 pm', '9:00 am–3:00 pm'],
  ['8:00 am – 2:00 pm', '9:00 am – 3:00 pm'], ['8:00 am to 2:00 pm', '9:00 am to 3:00 pm'],
];
let n = 0;
for (const [a, b] of HOURS) { const c = h.split(a).length - 1; if (c) { h = h.split(a).join(b); n += c; } }
console.log(`patch-index-7: ${n} hour mentions updated`);

// 2. "To approve" page.
const NAV = '<a href="#inquiries" data-p="inquiries"';
if (!h.includes(NAV)) throw new Error('patch-index-7: nav anchor not found');
h = h.replace(NAV, () => '<a href="#approvals" data-p="approvals" id="apTab">To approve <span class="apn" id="apN"></span></a>\n    ' + NAV);

const SEC = '<section class="page" id="health">';
if (!h.includes(SEC)) throw new Error('patch-index-7: health section not found');
h = h.replace(SEC, () => `<section class="page" id="approvals">
    <h2>To approve</h2>
    <p class="sub">Nothing here reaches a family until you approve it. Invoices are created and sent in Brightwheel; confirmations go out by email the moment you approve a payment; chat notes are sent in the family's WhatsApp or Instagram chat.</p>
    <div class="apbar"><button class="linkbtn on" data-f="pending" type="button">Waiting</button><button class="linkbtn" data-f="approved" type="button">Approved, being sent</button><button class="linkbtn" data-f="done" type="button">Done</button><button class="linkbtn" data-f="dismissed" type="button">Dismissed</button><span id="apWarn"></span></div>
    <div id="apList"><p class="sub">Loading…</p></div>
    <details class="apprices"><summary>Price sheet</summary><div id="apPrices"></div></details>
  </section>
  ` + SEC);

const CSS = `
#approvals{gap:14px}
.apn:not(:empty){display:inline-block;min-width:1.4em;padding:0 .4em;margin-left:.3em;border-radius:1em;background:var(--new);color:#fff;font-size:.8em;text-align:center}
.apbar{display:flex;gap:14px;flex-wrap:wrap;align-items:center}.apbar .on{font-weight:700;text-decoration:underline}
#apWarn{color:var(--new);font-size:.9em}
.apcard{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:16px 18px;display:grid;gap:8px}
.apcard h3{margin:0;font-size:1.05rem}.apcard .kind{font-size:.75rem;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
.apcheck{border-radius:10px;padding:8px 12px;font-size:.92rem}.apcheck.ok{background:var(--done-soft);color:var(--done)}.apcheck.warn{background:var(--new-soft);color:var(--new)}.apcheck.none{background:var(--off-soft);color:var(--off)}
.aplines{width:100%;border-collapse:collapse;font-size:.92rem}.aplines td{padding:3px 0;border-bottom:1px dashed var(--line)}.aplines td:last-child{text-align:right}
.apact{display:flex;gap:10px;flex-wrap:wrap;margin-top:4px}
.apnote{width:100%;min-height:70px;font:inherit;border:1px solid var(--line);border-radius:10px;padding:8px;background:var(--bg);color:var(--ink)}
.apprices table{border-collapse:collapse;margin-top:8px}.apprices td,.apprices th{padding:4px 12px;border-bottom:1px solid var(--line);text-align:left}
`;
h = h.replace('</style>', () => CSS + '</style>');

const JS = `<script>
(function(){
  const $a = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const money = (n) => '$' + Number(n||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
  let items = [], filter = 'pending', prices = {};
  const KIND = { invoice: 'Invoice to send in Brightwheel', payment: 'Payment received', chatnote: 'Chat note' };
  function page(){ const on = location.hash === '#approvals';
    $a('approvals').classList.toggle('on', on);
    if (on) { document.querySelectorAll('section.page').forEach(p => { if (p.id !== 'approvals') p.classList.remove('on'); });
      document.querySelectorAll('#tabs a').forEach(a => a.toggleAttribute('aria-current', a.dataset.p === 'approvals')); if (a0) a0.setAttribute('aria-current','page'); load(); } }
  const a0 = $a('apTab');
  function card(it){
    const f = it.family || {}, d = it.details || {};
    const check = it.check ? '<div class="apcheck ' + esc(it.check) + '">' + esc(it.checkNote || '') + '</div>' : '';
    let body = '';
    if (it.kind === 'invoice') body = '<table class="aplines">' + (d.lines||[]).map(l => '<tr><td>' + esc(l.label) + (l.qty ? ' × ' + l.qty : '') + '</td><td>' + money(l.amount) + '</td></tr>').join('') + '<tr><td><b>Total</b></td><td><b>' + money(d.total) + '</b></td></tr></table>' + (d.start ? '<div class="sub">' + esc(d.start) + (d.end ? ' to ' + esc(d.end) : '') + (d.weekdays ? ' · ' + esc(d.weekdays) : '') + '</div>' : '');
    if (it.kind === 'payment') body = '<div><b>' + money(d.amount) + '</b> from ' + esc(d.payer||'') + (d.source ? ' by ' + esc(d.source) : '') + (d.date ? ' on ' + esc(d.date) : '') + '</div>' + (d.invoiceTotal != null ? '<div class="sub">Open invoice: ' + money(d.invoiceTotal) + (d.invoiceNo ? ' (#' + esc(d.invoiceNo) + ')' : '') + '</div>' : '') + (f.email ? '<div class="sub">Confirmation goes to ' + esc(f.email) + ' · <a href="/api/approvals?preview=' + encodeURIComponent(it.id) + '" target="_blank" rel="noopener">preview email</a></div>' : '<div class="sub">No parent email on file</div>');
    if (it.kind === 'chatnote') body = '<div class="sub">' + esc(d.channel) + (f.threadUrl ? ' · <a href="' + esc(f.threadUrl) + '" target="_blank" rel="noopener">open chat</a>' : '') + '</div><textarea class="apnote" data-id="' + esc(it.id) + '">' + esc(d.text) + '</textarea>';
    const label = it.kind === 'invoice' ? 'Approve and send invoice' : it.kind === 'payment' ? 'Confirm enrollment and email parent' : 'Approve and send';
    const acts = it.state === 'pending' ? '<div class="apact"><button class="btn" data-ok="' + esc(it.id) + '" type="button">' + label + '</button><button class="btn ghost" data-no="' + esc(it.id) + '" type="button">Dismiss</button></div>' : (it.result ? '<div class="sub">' + esc(it.result) + '</div>' : '');
    return '<article class="apcard"><span class="kind">' + KIND[it.kind] + '</span><h3>' + esc(f.name || d.payer || '') + (f.child ? ' · ' + esc(f.child) : '') + '</h3>' + check + body + acts + '</article>';
  }
  function render(){
    const list = items.filter(x => x.state === filter).sort((a,b) => (b.createdAt||'').localeCompare(a.createdAt||''));
    $a('apList').innerHTML = list.length ? list.map(card).join('') : '<p class="sub">Nothing here.</p>';
    const n = items.filter(x => x.state === 'pending').length; $a('apN').textContent = n || '';
  }
  async function load(){
    try { const r = await fetch('/api/approvals', { credentials: 'same-origin' }); if (!r.ok) throw 0; const j = await r.json(); items = j.items || []; prices = j.prices || {};
      $a('apWarn').textContent = j.emailReady ? '' : 'Confirmation emails are off until the Wild Child Resend key is added.';
      $a('apPrices').innerHTML = '<table><tr><th>Group</th><th>3 days/week</th><th>5 days/week</th><th>Lunch/day</th></tr>' + Object.values(prices).map(p => '<tr><td>' + esc(p.label) + '</td><td>$' + p.d3 + '</td><td>$' + p.d5 + '</td><td>$' + p.lunch + '</td></tr>').join('') + '</table><p class="sub">5% off for 4+ weeks, 10% for 8+, 15% for 12+. 10% sibling discount.</p>';
      render(); } catch { $a('apList').innerHTML = '<p class="sub">Could not load. Try again in a moment.</p>'; }
  }
  async function act(id, action, extra){
    const r = await fetch('/api/approvals', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.assign({ id, action }, extra||{})) });
    const j = await r.json().catch(() => ({})); if (!r.ok) { alertBox(j.error || 'Something went wrong'); } await load();
  }
  function alertBox(msg){ $a('apWarn').textContent = msg; }
  document.addEventListener('click', (e) => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.dataset.f) { filter = t.dataset.f; document.querySelectorAll('.apbar [data-f]').forEach(b => b.classList.toggle('on', b === t)); render(); }
    if (t.dataset.ok) { const ta = document.querySelector('.apnote[data-id="' + CSS.escape(t.dataset.ok) + '"]'); t.disabled = true; t.textContent = 'Working…'; act(t.dataset.ok, 'approve', ta ? { edits: { details: { text: ta.value } } } : null); }
    if (t.dataset.no) { act(t.dataset.no, 'dismiss'); }
  });
  window.addEventListener('hashchange', page); page();
  fetch('/api/approvals?state=pending', { credentials: 'same-origin' }).then(r => r.ok ? r.json() : null).then(j => { if (j) $a('apN').textContent = (j.items||[]).length || ''; }).catch(() => {});
})();
</script>`;
const END = '</body>';
if (!h.includes(END)) throw new Error('patch-index-7: </body> not found');
h = h.replace(END, () => JS + '\n' + END);
writeFileSync(F, h);
console.log('patch-index-7: To approve page added');
