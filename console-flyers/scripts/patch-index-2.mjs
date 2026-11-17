// Second set of console changes (Nov 17, 2026): source filter, step guide, channel colours, welcome-email status.
// Runs after patch-index.mjs on public/index.html. Fails the build if anything doesn't match.
import { readFileSync, writeFileSync } from 'node:fs';
const P = 'public/index.html';
let s = readFileSync(P, 'utf8');
const PAIRS = [
[
".card.s-notfit { border-left-color: var(--off); }\n",
".card.s-notfit { border-left-color: var(--off); }\n.howto { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin: 12px 0 4px; font-size: .85rem; color: var(--muted); }\n.howto b { color: var(--accent); }\n.srcs { display: flex; flex-wrap: wrap; gap: 8px; margin: 10px 0 4px; }\n.src { font: inherit; font-size: .85rem; border: 1px solid var(--line); background: var(--surface); color: inherit; border-radius: 999px; padding: 5px 12px; cursor: pointer; }\n.src[aria-pressed=\"true\"] { border-color: var(--accent); background: var(--accent-soft); color: var(--accent); font-weight: 600; }\n.pill.ch-Website { background: #e4effa; color: #1d5a91; } .pill.ch-Instagram { background: #f8e6f0; color: #9b2c6a; } .pill.ch-WhatsApp { background: #e1f3e6; color: #22713a; } .pill.ch-Email { background: #fbf0dc; color: #8a5a10; } .pill.ch-Other { background: var(--off-soft); color: var(--off); }\n.wl-queued { color: var(--accent-2); } .wl-sent { color: var(--done); } .wl-skip { color: var(--off); }\n"
],
[
"  <div class=\"counts\" id=\"counts\" role=\"group\" aria-label=\"Filter by status\"></div>\n",
"  <div class=\"howto\"><span>How a family moves:</span> <b>New</b> → <b>Emailed</b> (welcome sent or Lili replied) → <b>Visit booked</b> → <b>On Brightwheel</b> (they registered) → <b>Invoice sent</b> → <b>Paid &amp; enrolled</b>. Change a card's status as it moves.</div>\n  <div class=\"counts\" id=\"counts\" role=\"group\" aria-label=\"Filter by status\"></div>\n  <div class=\"srcs\" id=\"srcs\" role=\"group\" aria-label=\"Filter by where they came from\"></div>\n"
],
[
"let rows = [], filter = \"all\", query = \"\";\n",
"let rows = [], filter = \"all\", query = \"\", src = \"all\";\nconst SOURCES = [[\"Website\", \"Website form\"], [\"Instagram\", \"Instagram\"], [\"WhatsApp\", \"WhatsApp\"], [\"Email\", \"Email\"], [\"Other\", \"Other\"]];\nconst WELCOME = { queued: [\"wl-queued\", \"Welcome email queued\"], sent: [\"wl-sent\", \"Welcome email sent\"], already: [\"wl-sent\", \"Already welcomed\"], skipped: [\"wl-skip\", \"No welcome (Lili wrote directly)\"], unsub: [\"wl-skip\", \"Unsubscribed, no emails\"], none: [\"wl-skip\", \"No email yet\"] };\n"
],
[
"  el(\"counts\").querySelectorAll(\"button\").forEach(b => b.onclick = () => { filter = b.dataset.f; render(); });\n",
"  el(\"counts\").querySelectorAll(\"button\").forEach(b => b.onclick = () => { filter = b.dataset.f; render(); });\n  const ct = {}; rows.forEach(r => { const c = r.channel || \"Instagram\"; ct[c] = (ct[c] || 0) + 1; });\n  el(\"srcs\").innerHTML = [[\"all\", \"All sources\", rows.length], ...SOURCES.filter(([k]) => ct[k]).map(([k, l]) => [k, l, ct[k]])].map(([k, l, n]) => `<button class=\"src\" data-s=\"${k}\" aria-pressed=\"${src === k}\">${esc(l)} · ${n}</button>`).join(\"\");\n  el(\"srcs\").querySelectorAll(\"button\").forEach(b => b.onclick = () => { src = b.dataset.s; render(); });\n"
],
[
"  const shown = rows.filter(r => (filter === \"all\" || (r.status || \"new\") === filter) &&\n",
"  const shown = rows.filter(r => (filter === \"all\" || (r.status || \"new\") === filter) && (src === \"all\" || (r.channel || \"Instagram\") === src) &&\n"
],
[
"<span class=\"pill\">${esc(r.channel || \"Instagram\")}</span>",
"<span class=\"pill ch-${esc(r.channel || \"Instagram\")}\">${esc(r.channel === \"Website\" ? \"Website form\" : (r.channel || \"Instagram\"))}</span>"
],
[
"        <div class=\"fact\"><small>Child's age</small>",
"        <div class=\"fact\"><small>Welcome email</small><span class=\"val ${(WELCOME[r.welcome] || WELCOME.none)[0]}\">${(WELCOME[r.welcome] || WELCOME.none)[1]}</span></div>\n        <div class=\"fact\"><small>Child's age</small>"
]
];
let n = 0;
for (const [a, b] of PAIRS) {
  if (s.includes(b)) continue;
  if (s.split(a).length !== 2) { console.error('[patch2] no unique match for:', a.slice(0, 80)); process.exit(1); }
  s = s.replace(a, () => b); n++;
}
writeFileSync(P, s);
console.log('[patch2] applied', n, 'of', PAIRS.length);
