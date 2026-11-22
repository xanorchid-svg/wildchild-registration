// Nov 21: keep the 8 am–2 pm school day until Dec 19, 2026 (the 9 am–2:30 pm day starts then).
// Runs LAST in the build. Undoes the hours part of patch-index-7 + patch-index-9 in public/index.html
// and sets api/approvals.js HOURS back to the 8–2 day. Tuesday Garza (Café Estrellitas 7:30 am,
// pick-up 1:30 pm) stays. To switch to 9–2:30 on Dec 19: drop this script from the build and redeploy.
import { readFileSync, writeFileSync } from 'node:fs';

// 1. Console page
const F = 'public/index.html';
let h = readFileSync(F, 'utf8');
const R = [
  ['9am–2:30pm', '8am–2pm'], ['9am-2:30pm', '8am-2pm'], ['9 AM–2:30 PM', '8 AM–2 PM'],
  ['9 am – 2:30 pm', '8 am – 2 pm'], ['9 am–2:30 pm', '8 am–2 pm'],
  ['9:00 a.m.–2:30 p.m.', '8:00 a.m.–2:00 p.m.'], ['9:00 am–2:30 pm', '8:00 am–2:00 pm'],
  ['9:00 am – 2:30 pm', '8:00 am – 2:00 pm'], ['9:00 am to 2:30 pm', '8:00 am to 2:00 pm'],
  ['Half day until 11:30 am or 12:15 pm (with lunch)', 'Half day until 11:30 am or 12 pm (with lunch)'],
  ['12:15 pm (after lunch)', '12 pm (after lunch)'], ['2:30 pm (with nap', '2 pm (with nap'],
  ['2:30 pm (with a nap', '2 pm (with a nap'],
];
let n = 0;
for (const [a, b] of R) { const c = h.split(a).length - 1; if (c) { h = h.split(a).join(b); n += c; } }
writeFileSync(F, h);
console.log(`patch-hours-8-2: index.html ${n} hour mentions set to 8–2`);
for (const k of ['2:30', '12:15', '9:00 am', '9 am']) {
  let i = -1; while ((i = h.indexOf(k, i + 1)) !== -1) console.log(`  left in index.html: …${h.slice(Math.max(0, i - 70), i + 50).replace(/\s+/g, ' ')}…`);
}

// 2. Confirmation emails + Prices tab (api/approvals.js HOURS): emails say 8–2 until Dec 19, then 9–2:30 (Xan, Nov 21)
const A = 'api/approvals.js';
let s = readFileSync(A, 'utf8');
const m = s.match(/export const HOURS = \{[\s\S]*?\n\};/);
if (!m) throw new Error('patch-hours-8-2: HOURS block not found in api/approvals.js');
console.log('patch-hours-8-2: HOURS before:\n' + m[0]);
const G = "On Tuesdays we meet at Café Estrellitas in Garza at 7:30 am; pick-up is at 1:30 pm at Café Estrellitas.";
const out = `export const HOURS = {
  '1-3': 'Arrival 8:30 am. Pick-up 11:30 am (before lunch), 12:00 pm (after lunch) or 2:00 pm (with a nap at school) until December 19; from December 19, pick-up is 11:30 am, 12:15 pm or 2:30 pm.',
  '4-5': 'Drop-off 8:30 am, pick-up 2:00 pm until December 19; from December 19, drop-off 9:00 am, pick-up 2:30 pm.',
  '6-9': 'Drop-off 8:00 am, pick-up 2:00 pm until December 19; from December 19, drop-off 9:00 am, pick-up 2:30 pm. ${G}',
  '10-13': 'Drop-off 8:00 am, pick-up 2:00 pm until December 19; from December 19, drop-off 9:00 am, pick-up 2:30 pm. ${G}',
};`;
if (!/Garza/.test(m[0])) throw new Error('patch-hours-8-2: unexpected HOURS block');
s = s.replace(m[0], out);
writeFileSync(A, s);
console.log('patch-hours-8-2: HOURS after:\n' + out);
