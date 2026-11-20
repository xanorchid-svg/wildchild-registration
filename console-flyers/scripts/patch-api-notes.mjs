// Nov 20: a note on an inquiry can hold the automatic emails (the Flodesk welcome).
// Notes like "don't email", "no welcome", "Lili replied", "I called her", "not a fit", "spam",
// "duplicate", "on hold", "ya le respondí" keep the family off Flodesk "New inquiries":
//   - intake never adds them; saving such a note takes them off at once (update.js);
//   - the daily health fix keeps them off and never re-adds them (_lib noWelcome);
//   - the card shows the welcome as skipped (inquiries.js).
// Patches the api files at build time, before Vercel compiles the functions. All or nothing.
import { readFileSync, writeFileSync } from 'node:fs';

const HOLD = String.raw`/\b(?:do\s*n[o']?t|don['’]?t|no|never)\s+(?:e-?mail|send|contact|welcome|message|write)\b|\bno\s+(?:welcome|emails?)\b|\b(?:hold|pause|stop)\s+(?:the\s+)?(?:welcome|emails?|automatic)|\b(?:lili|i|we|team|xan|alexandra|karen)\s+(?:already\s+)?(?:replied|answered|emailed|e-mailed|wrote|sent|messaged|called|talked|spoke|is\s+talking|is\s+in\s+touch|contacted)\b|\balready\s+(?:replied|answered|emailed|welcomed|enrolled|registered)\b|\bnot\s+(?:a\s+fit|interested)\b|\b(?:spam|duplicate|unsubscribed?|opted?\s+out|on\s+hold|hold\s+off)\b|\bno\s+(?:enviar|escribir|contactar)\b|\bya\s+(?:le\s+)?(?:respond|escrib|envi|habl|contact)/i`;

const P = {
  'api/_lib.js': [
    ["export const noWelcome = (c) => c.status !== 'new' || c.welcome === false || ['skipped', 'unsub'].includes(c.welcomeEdit);",
     `// A note on the card can hold the automatic emails (see scripts/patch-api-notes.mjs).\nexport const NOTE_HOLD = ${HOLD};\nexport const noteHolds = (n) => NOTE_HOLD.test(String(n || ''));\nexport const noWelcome = (c) => c.status !== 'new' || c.welcome === false || ['skipped', 'unsub'].includes(c.welcomeEdit) || noteHolds(c.notes);`],
  ],
  'api/intake.js': [
    ["import { logEvent, ENROLLED_SEGMENT } from './_lib.js';", "import { logEvent, ENROLLED_SEGMENT, noteHolds } from './_lib.js';"],
    ["const handled = ed && ((ed.status && ed.status !== 'new') || ['skipped', 'unsub'].includes(ed.welcome));",
     "const handled = ed && ((ed.status && ed.status !== 'new') || ['skipped', 'unsub'].includes(ed.welcome) || noteHolds(ed.notes));"],
  ],
  'api/update.js': [
    ["import { logEvent, flodeskClient, removeFromDoor, readBlob, splitEmails, DOOR } from './_lib.js';",
     "import { logEvent, flodeskClient, removeFromDoor, readBlob, splitEmails, DOOR, noteHolds } from './_lib.js';"],
    ["const moved = (status !== undefined && status !== 'new') || ['skipped', 'unsub'].includes(req.body && req.body.welcome);",
     "const moved = (status !== undefined && status !== 'new') || ['skipped', 'unsub'].includes(req.body && req.body.welcome) || ((notes !== undefined || (req.body && req.body.appendNote)) && noteHolds(current.notes));"],
  ],
  'api/health.js': [
    ["import { keyOk, cronOk, readBlob, writeBlob, listAll, removeBlobs, logEvent, flodeskClient, removeFromDoor, loadCards, noWelcome,",
     "import { keyOk, cronOk, readBlob, writeBlob, listAll, removeBlobs, logEvent, flodeskClient, removeFromDoor, loadCards, noWelcome, noteHolds,"],
    ["${c.status !== 'new' ? 'status is ' + c.status : 'Lili wrote to them directly'}",
     "${c.status !== 'new' ? 'status is ' + c.status : noteHolds(c.notes) ? 'the note on the card says not to email' : 'Lili wrote to them directly'}"],
  ],
  'api/inquiries.js': [
    ["import { INQUIRIES, LAST_CHECKED } from './_data.js';", "import { INQUIRIES, LAST_CHECKED } from './_data.js';\nimport { noteHolds } from './_lib.js';"],
    ["welcome: e.welcome || welcomeOf(r) };", "welcome: e.welcome || (noteHolds(e.notes) && welcomeOf(r) === 'queued' ? 'skipped' : welcomeOf(r)), noteHold: noteHolds(e.notes) };"],
  ],
};

const out = {};
let missing = [];
for (const [f, reps] of Object.entries(P)) {
  let s = readFileSync(f, 'utf8');
  for (const [a, b] of reps) { if (s.split(a).length !== 2) missing.push(`${f}: ${a.slice(0, 60)}`); else s = s.replace(a, () => b); }
  out[f] = s;
}
if (missing.length) { console.log('[notes] NOT applied, text not found:\n  ' + missing.join('\n  ')); process.exit(0); }
for (const [f, s] of Object.entries(out)) writeFileSync(f, s);
console.log(`[notes] applied to ${Object.keys(out).length} files`);
