// Applies the Nov 17, 2026 console changes (Add a family form, Brightwheel/invoice statuses,
// phone links) to public/index.html at build time. Fails the build if anything doesn't match,
// so the previous deployment stays live.
import { readFileSync, writeFileSync } from 'node:fs';
const P = 'public/index.html';
let s = readFileSync(P, 'utf8');
const PAIRS = [
[
".card.s-new { border-left-color: var(--new); }\n.card.s-emailed, .card.s-visit { border-left-color: var(--accent-2); }\n",
".card.s-new { border-left-color: var(--new); }\n.card.s-emailed, .card.s-visit, .card.s-registered, .card.s-invoiced { border-left-color: var(--accent-2); }\n.addfam { margin: 14px 0; } .addfam summary { cursor: pointer; font-weight: bold; color: var(--accent); }\n.addfam form { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 8px; margin-top: 10px; }\n.addfam form textarea, .addfam form .full { grid-column: 1 / -1; }\n.addfam input, .addfam select, .addfam textarea { font: inherit; padding: 7px 9px; border: 1px solid #ccd; border-radius: 8px; }\n"
],
[
"  <div class=\"counts\" id=\"counts\" role=\"group\" aria-label=\"Filter by status\"></div>\n",
"  <div class=\"counts\" id=\"counts\" role=\"group\" aria-label=\"Filter by status\"></div>\n  <details class=\"addfam\" id=\"addfam\">\n    <summary>+ Add a family (WhatsApp, email, phone call, in person)</summary>\n    <form id=\"addForm\">\n      <input name=\"name\" placeholder=\"Parent's name\" required>\n      <select name=\"channel\"><option>WhatsApp</option><option>Email</option><option>Instagram</option><option>Other</option></select>\n      <input name=\"email\" type=\"email\" placeholder=\"Email (they get the welcome email once)\">\n      <input name=\"phone\" placeholder=\"Phone / WhatsApp\">\n      <input name=\"childAge\" placeholder=\"Child's age\">\n      <input name=\"program\" placeholder=\"Program (e.g. Ages 4–5)\">\n      <input name=\"stay\" placeholder=\"Dates in Nosara / start date\">\n      <textarea name=\"message\" rows=\"3\" placeholder=\"What they asked\"></textarea>\n      <div class=\"full\"><button class=\"btn\" type=\"submit\">Add family</button> <span id=\"addNote\" class=\"sync\"></span></div>\n    </form>\n  </details>\n"
],
[
"  { key: \"visit\", label: \"Visit booked\" },\n  { key: \"enrolled\", label: \"Enrolled\" },\n",
"  { key: \"visit\", label: \"Visit booked\" },\n  { key: \"registered\", label: \"On Brightwheel\" },\n  { key: \"invoiced\", label: \"Invoice sent\" },\n  { key: \"enrolled\", label: \"Paid & enrolled\" },\n"
],
[
"  const shown = rows.filter(r => (filter === \"all\" || (r.status || \"new\") === filter) &&\n    (!q || [r.name, r.handle, r.email, r.program, r.message, r.notes].join(\" \").toLowerCase().includes(q)));\n",
"  const shown = rows.filter(r => (filter === \"all\" || (r.status || \"new\") === filter) &&\n    (!q || [r.name, r.handle, r.email, r.phone, r.channel, r.program, r.message, r.notes].join(\" \").toLowerCase().includes(q)));\n"
],
[
"  const list = el(\"list\");\n  if (!rows.length) { list.innerHTML = `<div class=\"empty\">No inquiries yet. New Instagram and Messenger conversations are added here when the inbox is checked.</div>`; return; }\n",
"  const list = el(\"list\");\n  if (!rows.length) { list.innerHTML = `<div class=\"empty\">No inquiries yet. New Instagram, WhatsApp and email inquiries are added here when the inbox is checked, and website registrations are emailed to info@.</div>`; return; }\n"
],
[
"        <div class=\"fact\"><small>Email</small>${email}</div>\n",
"        <div class=\"fact\"><small>Email</small>${email}</div>\n        ${r.phone ? `<div class=\"fact\"><small>Phone</small><span class=\"val\"><a href=\"https://wa.me/${esc(String(r.phone).replace(/[^0-9]/g, \"\"))}\" target=\"_blank\" rel=\"noopener\">${esc(r.phone)}</a></span></div>` : \"\"}\n"
],
[
"  setTimeout(() => b.textContent = \"Copy message\", 1600);\n",
"  setTimeout(() => b.textContent = \"Copy message\", 1600);\n});\nel(\"addForm\").addEventListener(\"submit\", async (e) => {\n  e.preventDefault();\n  const f = new FormData(e.target); const body = Object.fromEntries(f.entries());\n  body.id = (body.channel || \"other\").slice(0, 2).toLowerCase() + \"-\" + Date.now().toString(36);\n  el(\"addNote\").textContent = \"Adding…\";\n  try {\n    const r = await fetch(\"/api/intake\", { method: \"POST\", credentials: \"same-origin\", headers: { \"content-type\": \"application/json\" }, body: JSON.stringify(body) });\n    const j = await r.json().catch(() => ({}));\n    if (!r.ok) { el(\"addNote\").textContent = j.error || \"That didn't save. Try again.\"; return; }\n    const fl = j.flodesk && j.flodesk.result ? \" Flodesk: \" + j.flodesk.result.join(\"; \") : (body.email ? \"\" : \" (no email, so no welcome email)\");\n    el(\"addNote\").textContent = \"Added.\" + fl;\n    e.target.reset(); load();\n  } catch { el(\"addNote\").textContent = \"That didn't save. Check your connection and try again.\"; }\n"
]
];
let n = 0;
for (const [a, b] of PAIRS) {
  if (s.includes(b) && !s.includes(a)) continue;
  if (s.split(a).length !== 2) { console.error('[patch] no unique match for:', a.slice(0, 80)); process.exit(1); }
  s = s.replace(a, () => b); n++;
}
writeFileSync(P, s);
console.log('[patch] applied', n, 'of', PAIRS.length);
