// Nov 20 (patch-8): hide the "Emails to parents" tab, and add a "Codes" tab (discount codes, from /api/codes).
// Patches public/index.html at build time.
import { readFileSync, writeFileSync } from 'node:fs';
const F = 'public/index.html';
let h = readFileSync(F, 'utf8');
const SECTION = `<section class="page" id="codes">
    <h2 class="lh">Discount codes</h2>
    <p class="sub">Codes families can use when they book or register. Tap Copy to paste one into a message.</p>
    <div class="vtop"><button class="btn ghost" id="cadd" type="button">Add a code</button><span></span></div>
    <div id="clist"><p class="sub">Loading…</p></div>
  </section>
  <section class="page" id="logins"`;
const JS = `
(function(){
  let codes=null;
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function render(){
    $("clist").innerHTML=(codes||[]).map((c,i)=>\`<article class="vcard ccard" data-i="\${i}"><div class="crow"><span class="ccode">\${esc(c.code)}</span><button class="btn small" data-ccopy="\${i}">Copy</button></div>\${c.label?\`<p class="clab">\${esc(c.label)}</p>\`:""}<p class="sub cmeta">\${[c.discount,c.expires&&("Until "+c.expires)].filter(Boolean).map(esc).join(" · ")}</p>\${c.note?\`<p class="sub">\${esc(c.note)}</p>\`:""}<button class="linkbtn" data-cedit="\${i}">Edit</button></article>\`).join("")||'<p class="sub">No codes yet. Add the first one.</p>';
  }
  async function load(){ if(codes)return; try{const r=await fetch("/api/codes",{credentials:"same-origin"});if(!r.ok)throw 0;codes=(await r.json()).codes||[];}catch{$("clist").innerHTML='<p class="sub">Could not load the codes. Sign in and try again.</p>';return;} render(); }
  async function save(next){ const r=await fetch("/api/codes",{method:"POST",credentials:"same-origin",headers:{"content-type":"application/json"},body:JSON.stringify({codes:next})}); const j=await r.json().catch(()=>({})); if(!r.ok)throw new Error(j.error||"Could not save."); codes=j.codes; render(); }
  function form(i){ const c=(i==null?null:codes[i])||{code:"",label:"",discount:"",expires:"",note:""};
    const html=\`<form class="vedit" data-csave="\${i==null?"new":i}"><input name="code" placeholder="Code (e.g. HARMONY)" value="\${esc(c.code)}" required autocomplete="off"><input name="label" placeholder="What it's for (e.g. Harmony Co-Op members)" value="\${esc(c.label)}"><input name="discount" placeholder="Discount (e.g. 100% off, $30 off)" value="\${esc(c.discount)}"><input name="expires" placeholder="Valid until (optional)" value="\${esc(c.expires)}"><input name="note" placeholder="Note (optional)" value="\${esc(c.note)}"><div class="vrow">\${i==null?"":\`<button class="linkbtn" type="button" data-cdel="\${i}">Remove</button>\`}<button class="linkbtn" type="button" data-ccancel>Cancel</button><button class="btn" type="submit">Save</button></div></form>\`;
    const card=i==null?null:document.querySelector(\`.ccard[data-i="\${i}"]\`);
    if(card)card.insertAdjacentHTML("beforeend",html); else $("clist").insertAdjacentHTML("afterbegin",\`<article class="vcard">\${html}</article>\`); }
  $("cadd").addEventListener("click",async()=>{await load();form(null);});
  $("clist").addEventListener("click",async e=>{const t=e.target;
    if(t.dataset.ccopy){try{await navigator.clipboard.writeText(codes[t.dataset.ccopy].code);t.textContent="Copied";setTimeout(()=>t.textContent="Copy",1500);}catch{t.textContent="Copy failed";}}
    else if(t.dataset.cedit){form(+t.dataset.cedit);t.hidden=true;}
    else if("ccancel" in t.dataset){render();}
    else if(t.dataset.cdel){if(!confirm("Remove this code?"))return;try{await save(codes.filter((_,i)=>i!=t.dataset.cdel));}catch(err){alert(err.message);}}
  });
  $("clist").addEventListener("submit",async e=>{e.preventDefault();const f=e.target;const d=Object.fromEntries(new FormData(f));const k=f.dataset.csave;const next=(codes||[]).slice();if(k=="new")next.unshift(d);else next[+k]=d;try{await save(next);}catch(err){alert(err.message);}});
  const check=()=>{if(location.hash=="#codes")load();};
  addEventListener("hashchange",check);check();
})();
`;
const CSS = `.ccard .crow{display:flex;justify-content:space-between;align-items:center;gap:12px}
.ccode{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:1.25rem;font-weight:700;letter-spacing:.04em}
.ccard .clab{margin:8px 0 2px;font-weight:600}.ccard .cmeta{margin:2px 0}
</style>`;
const R = [
  ['<a href="#templates" data-p="templates">Emails to parents</a>', ''],
  ['<section class="msgs page" id="templates">', '<section class="msgs" id="templates" hidden>'],
  ['<a href="#logins" data-p="logins">Logins</a>', '<a href="#codes" data-p="codes">Codes</a>\n    <a href="#logins" data-p="logins">Logins</a>'],
  ['<section class="page" id="logins"', SECTION],
  ['</style>', CSS],
];
let n = 0;
for (const [a, b] of R) { if (h.includes(a)) { h = h.replace(a, () => b); n++; } else console.log('[patch-8] not found:', a.slice(0, 60)); }
// Script: insert before the last </script> so the page-switcher (which lists .page elements on load) sees the new tab.
const k = h.lastIndexOf('</script>');
if (k > 0) { h = h.slice(0, k) + JS + h.slice(k); n++; }
writeFileSync(F, h);
console.log(`[patch-8] applied ${n}/${R.length + 1}`);
