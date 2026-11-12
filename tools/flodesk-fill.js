// Helpers to fill a Flodesk email (duplicated from Newsletter Nº 02) with one program's info.
// Load in the Flodesk editor page: (0,eval)(await (await fetch(RAW+'flodesk-fill.js')).text())
window.__fd=()=>[...document.querySelectorAll('iframe')].map(f=>{try{return f.contentDocument}catch(e){return null}}).find(d=>d&&d.querySelector('.container'));
window.__rowsNow=()=>{const d=__fd(); let k=[...d.querySelector('.container').children]; while(k.length===1){k=[...k[0].children];} return k;};
window.__sleep=ms=>new Promise(r=>setTimeout(r,ms));
window.__clickEl=async(tgt,dx,dy)=>{const d=__fd(); tgt.scrollIntoView({block:'center'}); await __sleep(300); const r=tgt.getBoundingClientRect(); const o={bubbles:true,cancelable:true,clientX:r.left+(dx??Math.min(r.width/2,20)),clientY:r.top+(dy??Math.min(r.height/2,10)),view:d.defaultView}; for(const ev of ['pointerdown','mousedown','pointerup','mouseup','click']) tgt.dispatchEvent(new (ev.startsWith('pointer')?PointerEvent:MouseEvent)(ev,o)); await __sleep(800);};
window.__ed=()=>{const e=__fd().querySelector('[contenteditable=true]'); return e&&e.ckeditorInstance;};
window.__act=async(i)=>{const row=__rowsNow()[i]; const t=row.querySelector('[data-paragraph]')||row.querySelector('a')||row; await __clickEl(t); return __ed();};
// spec: array of paragraphs; each = array of [text, srcPara, srcChild]
window.__set=(spec)=>{const ed=__ed(); const root=ed.model.document.getRoot(); const orig=[...root.getChildren()]; const attrsOf=(pi,ci)=>{const p=orig[pi]; const c=[...p.getChildren()].filter(x=>x.data!==undefined)[ci||0]; return c?Object.fromEntries(c.getAttributes()):{}}; ed.model.change(w=>{ const els=spec.map(para=>{ const pi=para[0][1]; const el=w.createElement(orig[pi].name, Object.fromEntries(orig[pi].getAttributes())); para.forEach(([t,spi,sci])=>{ if(!t) return; const a=attrsOf(spi,sci); delete a.linkHref; w.append(w.createText(t,a),el);}); return el;}); w.remove(w.createRangeIn(root)); els.forEach(el=>w.append(el,root)); }); return [...root.getChildren()].length; };
window.__findRow=(re)=>__rowsNow().findIndex(r=>re.test(r.innerText));
window.__fillText=async(key)=>{
  const m=window.__EMAILS.find(x=>x.key===key); const log=[];
  // title block (row with NEWSLETTER kicker)
  let i=__rowsNow().findIndex((r,k)=>k>0&&r.querySelector('[data-paragraph]')); await __act(i);
  __set([[[m.kicker,0]],[[m.title,1]],[[m.subtitle,2]]]); log.push('title');
  // letter block
  i=__findRow(/^\s*Dear /); await __act(i);
  const E=[["",1]], B=t=>[[t,2]];
  const L=[[["Dear families,",0]],E];
  m.intro.forEach(t=>{L.push(B(t)); L.push(E);});
  L.push(E); L.push([[m.k,7]]); L.push([[m.h,8]]); L.push(E);
  m.paras.forEach((t,j)=>{L.push(B(t)); if(j<m.paras.length-1) L.push(E);});
  __set(L); log.push('letter');
  // details + enroll block
  i=__findRow(/ENROLLMENT IS OPEN|THE DETAILS/); await __act(i);
  const E2=[["",1]], D=[[["THE DETAILS",3]],[["Everything in one place",4]],E2];
  m.details.forEach(([b,t],j)=>{D.push([["✦ ",8,0],[b,8,1],[" "+t,8,2]]); D.push(E2);});
  D.push(E2); D.push([[m.enrollK||"ENROLLMENT IS OPEN",3]]); D.push([[m.enrollH||"Come grow with us",4]]); D.push(E2);
  D.push([[m.enrollBody||window.__ENROLL_BODY,6]]);
  __set(D); log.push('details');
  // button label
  i=__rowsNow().findIndex(r=>r.querySelector('a')&&/ENROLL NOW|BOOK A SATURDAY|RESERVE YOUR SPOT/.test(r.innerText)&&r.innerText.trim().length<40);
  await __act(i); const be=__ed(); be.model.change(w=>{const root=be.model.document.getRoot(); const p=root.getChild(0); const t=p.getChild(0); const a=t?Object.fromEntries(t.getAttributes()):{}; w.remove(w.createRangeIn(p)); w.append(w.createText(m.button[0],a),p);}); log.push('button');
  return log;
};
window.__heroFile=async(name)=>{const b=await (await fetch('https://raw.githubusercontent.com/xanorchid-svg/wildchild-registration/console-flyers/console-flyers/web-'+name+'.jpg')).blob(); return new File([b],name+'.jpg',{type:'image/jpeg'});};
window.__upload=async(name)=>{const inp=document.querySelector('[data-testid="upload-area__input"]'); if(!inp) return 'no input'; const dt=new DataTransfer(); dt.items.add(await __heroFile(name)); inp.files=dt.files; inp.dispatchEvent(new Event('change',{bubbles:true})); await __sleep(6000); return [...__fd().images].map(i=>i.src.split('/').pop()).join(' ');};
window.__setLink=async(url)=>{const ta=[...document.querySelectorAll('textarea,input[type=text],input[type=url]')].find(t=>/^https?:|wa\.me/.test(t.value)||/url|link/i.test(t.placeholder||'')); if(!ta) return 'no link field'; const set=Object.getOwnPropertyDescriptor(ta.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set; set.call(ta,url); ta.dispatchEvent(new Event('input',{bubbles:true})); ta.dispatchEvent(new Event('change',{bubbles:true})); ta.dispatchEvent(new Event('blur',{bubbles:true})); await __sleep(800); return ta.value;};
window.__subject=(t)=>{const eds=[...document.querySelectorAll('[contenteditable=true]')].filter(e=>e.ckeditorInstance); const ed=eds[0].ckeditorInstance; ed.model.change(w=>{const root=ed.model.document.getRoot(); w.remove(w.createRangeIn(root)); const p=w.createElement('paragraph'); w.append(w.createText(t),p); w.append(p,root);}); return eds.map(e=>e.innerText);};
'fill helpers loaded';
