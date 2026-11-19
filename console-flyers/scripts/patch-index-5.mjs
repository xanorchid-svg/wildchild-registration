// Fifth console change (Nov 19, 2026): "Registered" tab — families registered for classes/events,
// grouped by program and date, with counts by age group and filters. Data: /api/registrations.
// Runs after patch-index-4.mjs on public/index.html. Fails the build if an anchor doesn't match.
import { readFileSync, writeFileSync } from 'node:fs';
const P = process.argv[2] || 'public/index.html';
let s = readFileSync(P, 'utf8');
function once(a, b, label) {
  if (s.split(a).length !== 2) { console.error('[patch-5] anchor not found exactly once: ' + label); process.exit(1); }
  s = s.replace(a, () => b);
}
const TAB = '<a href="#inquiries" data-p="inquiries">Inquiries</a>';
once(TAB, TAB + '\n    <a href="#registered" data-p="registered">Registered</a>', 'tab');

const PAGE = `<div class="page" id="registered">
  <section class="rg" aria-labelledby="rgh">
    <h2 id="rgh">Registered</h2>
    <p class="sub">Who's signed up for each class or event, by age group. Add a family below.</p>
    <div class="rgf">
      <label>Program <select id="rg-prog"><option value="">All programs</option></select></label>
      <label>Age group <select id="rg-age"><option value="">All ages</option></select></label>
      <label><input type="checkbox" id="rg-past"> Show past dates</label>
    </div>
    <div id="rg-sum" class="rgsum"></div>
    <div id="rg-list" class="rglist"><div class="empty">Loading…</div></div>
    <details class="rgadd" id="rg-addbox"><summary>+ Register a family</summary>
      <form id="rg-form">
        <div class="rgrow">
          <label>Program <input id="rgf-prog" list="rg-progs" required placeholder="Pottery"></label>
          <datalist id="rg-progs"><option>Pottery</option><option>Saturday at Harmony Co-Op</option><option>Ages 1–3</option><option>Ages 4–5</option><option>Ages 6–9</option><option>Ages 10–13</option><option>Holiday camp</option></datalist>
          <label>Date <input id="rgf-date" type="date"></label>
        </div>
        <div class="rgrow">
          <label>Family / contact name <input id="rgf-fam" required></label>
          <label>Email or WhatsApp <input id="rgf-contact"></label>
        </div>
        <div id="rgf-people"></div>
        <button type="button" class="rgbtn ghost" id="rgf-addp">+ Add person</button>
        <label>Notes <input id="rgf-notes"></label>
        <label><input type="checkbox" id="rgf-paid"> Paid</label>
        <div><button class="rgbtn" type="submit">Save registration</button> <span id="rgf-msg" class="sub"></span></div>
      </form>
    </details>
  </section>
</div>
`;
once('<div class="page" id="inquiries">', PAGE + '  <div class="page" id="inquiries">', 'page');

const CSS = `
.rg { display: grid; gap: 14px; }
.rgf { display: flex; flex-wrap: wrap; gap: 12px; align-items: end; }
.rgf label, .rgadd label { display: grid; gap: 4px; font-size: .88rem; color: var(--muted); }
.rgf label:has(input[type=checkbox]), .rgadd label:has(input[type=checkbox]) { display: flex; align-items: center; gap: 6px; }
.rg select, .rg input:not([type=checkbox]) { font: inherit; color: var(--ink); background: var(--surface); border: 1px solid var(--line); border-radius: 8px; padding: 6px 10px; }
.rgsum { display: flex; flex-wrap: wrap; gap: 8px; }
.rgchip { background: var(--accent-soft); color: var(--accent); border-radius: 999px; padding: 3px 12px; font-size: .88rem; font-weight: 700; }
.rgchip.warn { background: var(--new-soft); color: var(--new); }
.rglist { display: grid; gap: 16px; }
.rgev { background: var(--surface); border: 1px solid var(--line); border-left: 5px solid var(--accent); border-radius: 12px; padding: 14px 18px; display: grid; gap: 10px; }
.rgev h3 { margin: 0; font: 700 1.15rem/1.2 var(--font-display); color: var(--accent); }
.rgev .rgsum { gap: 6px; }
.rgfam { border-top: 1px solid var(--line); padding-top: 10px; display: grid; gap: 4px; }
.rgfam .top { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; justify-content: space-between; }
.rgfam ul { margin: 0; padding-left: 18px; }
.rgfam .ag { color: var(--muted); font-size: .85rem; }
.rgfam .ag.nog { color: var(--new); font-weight: 700; }
.rgbtn { font: inherit; font-weight: 700; background: var(--accent); color: #fff; border: 0; border-radius: 8px; padding: 7px 14px; cursor: pointer; }
.rgbtn.ghost { background: transparent; color: var(--accent); border: 1px solid var(--line); }
.rgbtn.small { padding: 3px 10px; font-size: .82rem; }
.rgadd summary { cursor: pointer; font-weight: 700; color: var(--accent); }
.rgadd form { display: grid; gap: 10px; margin-top: 10px; }
.rgrow { display: flex; flex-wrap: wrap; gap: 12px; }
.rgp { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
`;
once('<div class="page" id="registered">', '<style>' + CSS + '</style>\n<div class="page" id="registered">', 'style');

const JS = `<script>
(function(){
  const $ = id => document.getElementById(id);
  const E = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let regs = [], groups = ['Adult','1–3','4–5','6–9','10–13','Not given'];
  const today = new Date(Date.now() - 6*3600e3).toISOString().slice(0,10);
  const fmt = d => { if (!d) return 'No date'; const x = new Date(d + 'T12:00:00'); return x.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }); };
  function counts(people){ const c = {}; people.forEach(p => c[p.group] = (c[p.group]||0) + 1); return c; }
  function chips(c, total){ return '<span class="rgchip">' + total + ' total</span>' + groups.filter(g => c[g]).map(g => '<span class="rgchip' + (g==='Not given'?' warn':'') + '">' + (g==='Adult'?'Adults':g==='Not given'?'Age not given':'Ages ' + g) + ': ' + c[g] + '</span>').join(''); }
  function render(){
    const prog = $('rg-prog').value, age = $('rg-age').value, past = $('rg-past').checked;
    const progs = [...new Set(regs.map(r => r.program))].sort();
    const ps = $('rg-prog'); const cur = ps.value;
    ps.innerHTML = '<option value="">All programs</option>' + progs.map(p => '<option' + (p===cur?' selected':'') + '>' + E(p) + '</option>').join('');
    let rows = regs.filter(r => (!prog || r.program === prog) && (past || !r.date || r.date >= today));
    const ev = {};
    rows.forEach(r => { const k = r.program + '|' + r.date; (ev[k] = ev[k] || { program: r.program, date: r.date, fams: [] }).fams.push(r); });
    const evs = Object.values(ev).sort((a,b) => (a.date||'9') < (b.date||'9') ? -1 : 1);
    let all = [];
    const html = evs.map(e => {
      const fams = e.fams.map(f => ({ ...f, shown: f.people.filter(p => !age || p.group === age) })).filter(f => f.shown.length);
      if (!fams.length) return '';
      const ppl = fams.flatMap(f => f.shown); all = all.concat(ppl);
      return '<article class="rgev"><h3>' + E(e.program) + ' · ' + E(fmt(e.date)) + '</h3><div class="rgsum">' + chips(counts(ppl), ppl.length) + '<span class="rgchip">' + fams.length + (fams.length===1?' family':' families') + '</span></div>' +
        fams.map(f => '<div class="rgfam"><div class="top"><b>' + E(f.family) + (f.contact ? ' <span class="ag">· ' + E(f.contact) + '</span>' : '') + '</b><span><span class="rgchip' + (f.paid?'':' warn') + '">' + (f.paid?'Paid':'Not paid') + '</span> <button class="rgbtn ghost small" data-pay="' + E(f.id) + '">' + (f.paid?'Mark unpaid':'Mark paid') + '</button> <button class="rgbtn ghost small" data-del="' + E(f.id) + '">Remove</button></span></div>' +
          '<ul>' + f.shown.map(p => '<li>' + E(p.name) + ' <span class="ag' + (p.group==='Not given'?' nog':'') + '">' + (p.group==='Adult'?'adult':p.group==='Not given'?'age not given':'ages ' + E(p.group)) + (p.age ? ' · ' + p.age + ' yrs' : '') + '</span></li>').join('') + '</ul>' +
          (f.notes ? '<div class="ag">' + E(f.notes) + '</div>' : '') + '</div>').join('') + '</article>';
    }).join('');
    $('rg-list').innerHTML = html || '<div class="empty">No registrations match. Use “Register a family” below.</div>';
    $('rg-sum').innerHTML = all.length ? chips(counts(all), all.length) : '';
  }
  async function load(){
    try { const r = await fetch('/api/registrations', { credentials: 'same-origin' }); if (!r.ok) throw 0; const j = await r.json(); regs = j.registrations || []; groups = j.groups || groups; }
    catch { $('rg-list').innerHTML = '<div class="empty">Couldn’t load registrations. Refresh to try again.</div>'; return; }
    const as = $('rg-age'); if (as.options.length < 2) as.innerHTML = '<option value="">All ages</option>' + groups.map(g => '<option value="' + E(g) + '">' + (g==='Adult'?'Adults':g==='Not given'?'Age not given':'Ages ' + g) + '</option>').join('');
    render();
  }
  async function post(body){ const r = await fetch('/api/registrations', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }); const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || 'Something went wrong'); regs = j.registrations || regs; render(); }
  function addPerson(){ const d = document.createElement('div'); d.className = 'rgp'; d.innerHTML = '<input placeholder="Name" class="rgp-n"> <select class="rgp-g">' + groups.map(g => '<option value="' + E(g) + '"' + (g==='Not given'?' selected':'') + '>' + (g==='Adult'?'Adult':g==='Not given'?'Age not given':'Ages ' + g) + '</option>').join('') + '</select> <input type="number" min="0" max="99" placeholder="Age" class="rgp-a" style="width:5.5em"> <button type="button" class="rgbtn ghost small">✕</button>'; d.querySelector('button').onclick = () => d.remove();
    d.querySelector('.rgp-a').oninput = e => { const a = +e.target.value, g = d.querySelector('.rgp-g'); if (!a) return; g.value = a >= 14 ? 'Adult' : a <= 3 ? '1–3' : a <= 5 ? '4–5' : a <= 9 ? '6–9' : '10–13'; };
    $('rgf-people').appendChild(d); }
  document.addEventListener('click', async e => {
    const t = e.target; if (!t.dataset) return;
    try {
      if (t.dataset.pay) { const r = regs.find(x => x.id === t.dataset.pay); await post({ id: r.id, paid: !r.paid }); }
      if (t.dataset.del) { const r = regs.find(x => x.id === t.dataset.del); if (confirm('Remove ' + r.family + ' from ' + r.program + '?')) await post({ action: 'delete', id: r.id }); }
    } catch (err) { alert(err.message); }
  });
  ['rg-prog','rg-age','rg-past'].forEach(id => $(id).onchange = render);
  $('rgf-addp').onclick = addPerson; addPerson();
  $('rg-form').onsubmit = async e => { e.preventDefault(); const msg = $('rgf-msg');
    const people = [...document.querySelectorAll('#rgf-people .rgp')].map(d => ({ name: d.querySelector('.rgp-n').value.trim(), group: d.querySelector('.rgp-g').value, age: +d.querySelector('.rgp-a').value || undefined })).filter(p => p.name);
    try { await post({ program: $('rgf-prog').value, date: $('rgf-date').value, family: $('rgf-fam').value, contact: $('rgf-contact').value, notes: $('rgf-notes').value, paid: $('rgf-paid').checked, people });
      $('rg-form').reset(); $('rgf-people').innerHTML = ''; addPerson(); msg.textContent = 'Saved.'; } catch (err) { msg.textContent = err.message; } };
  let loaded = false; const go = () => { if (!loaded && location.hash === '#registered') { loaded = true; load(); } };
  addEventListener('hashchange', go); go(); setTimeout(() => { if (!loaded) { loaded = true; load(); } }, 1500);
})();
</script>
`;
once('</body>', JS + '</body>', 'body');
writeFileSync(P, s);
console.log('[patch-5] added Registered tab');
