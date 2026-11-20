// Nov 20: Logins page shows discount codes (entries with kind "code") under their own heading,
// labels them "Code", and adds an "Add a code" button. Patches public/index.html at build time.
import { readFileSync, writeFileSync } from 'node:fs';
const F = 'public/index.html';
let h = readFileSync(F, 'utf8');
const R = [
  ['field("Username",x.username,false,i)', 'field(x.kind=="code"?"Code":"Username",x.username,false,i)'],
  ['$("vlist").innerHTML=items.map((x,i)=>`<article class="vcard"', '$("vlist").innerHTML=items.map((x,i)=>(x.kind=="code"&&!items.slice(0,i).some(y=>y.kind=="code")?`<h3 class="vgh">Discount codes</h3>`:"")+`<article class="vcard"'],
  ['<button class="btn ghost" id="vadd" type="button">Add a login</button>', '<span><button class="btn ghost" id="vadd" type="button">Add a login</button> <button class="btn ghost" id="vaddc" type="button">Add a code</button></span>'],
  ['const x=items[i]||{service:"",url:"",username:"",password:"",note:""}', 'const x=items[i]||{service:"",url:"",username:"",password:"",note:"",kind:window.__vkind||""}'],
  ['<input name="username" placeholder="Username or email"', '<input type="hidden" name="kind" value="${esc(x.kind||"")}"><input name="username" placeholder="${x.kind=="code"?"Code":"Username or email"}"'],
  ['$("vadd").addEventListener("click",()=>editForm(null));', '$("vadd").addEventListener("click",()=>{window.__vkind="";editForm(null)});$("vaddc").addEventListener("click",()=>{window.__vkind="code";editForm(null)});'],
  ['${x.password?"":`<p class="sub" style="margin:6px 0 0">No password saved yet.</p>`}', '${x.password||x.kind=="code"?"":`<p class="sub" style="margin:6px 0 0">No password saved yet.</p>`}'],
  ['</style>', '.vgh{margin:26px 0 10px;font-size:1.15rem}\n</style>'],
];
let n = 0;
for (const [a, b] of R) { if (h.includes(a)) { h = h.replace(a, b); n++; } else console.log('[patch-6] not found:', a.slice(0, 60)); }
writeFileSync(F, h);
console.log(`[patch-6] applied ${n}/${R.length}`);
