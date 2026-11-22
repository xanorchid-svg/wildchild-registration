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

// 2. Confirmation emails + Prices tab (api/approvals.js HOURS)
const A = 'api/approvals.js';
let s = readFileSync(A, 'utf8');
const m = s.match(/export const HOURS = \{[\s\S]*?\n\};/);
if (!m) throw new Error('patch-hours-8-2: HOURS block not found in api/approvals.js');
console.log('patch-hours-8-2: HOURS before:\n' + m[0]);
const lines = m[0].split('\n').map((l) => {
  if (/^\s*'1-3':/.test(l)) return l.replace(/(Arrival|arrive)\s+\d{1,2}:\d{2} am/i, '$1 8:30 am').replace('12:15 pm', '12:00 pm').replace(/2:30 pm/g, '2:00 pm');
  if (/^\s*'4-5':/.test(l)) return l.replace(/\b9:00 am\b/g, '8:30 am').replace(/2:30 pm/g, '2:00 pm');
  if (/^\s*'(6-9|10-13)':/.test(l)) return l.replace(/\b9:00 am\b/g, '8:00 am').replace(/2:30 pm/g, '2:00 pm');
  return l;
});
const out = lines.join('\n');
if (/2:30|12:15|9:00 am/.test(out)) throw new Error('patch-hours-8-2: HOURS still has 9–2:30 times:\n' + out);
s = s.replace(m[0], out);
writeFileSync(A, s);
console.log('patch-hours-8-2: HOURS after:\n' + out);
