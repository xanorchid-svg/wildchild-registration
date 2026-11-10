
(function(){
  var h=document.querySelector('header');
  function onScroll(){var mm=document.querySelector('.menu');h.classList.toggle('solid',window.scrollY>40||(mm&&mm.classList.contains('open')))}
  onScroll();window.addEventListener('scroll',onScroll,{passive:true});

  var b=document.querySelector('.burger'),m=document.querySelector('.menu');
  b.addEventListener('click',function(){var o=m.classList.toggle('open');b.setAttribute('aria-expanded',o);onScroll()});
  m.addEventListener('click',function(e){if(e.target.tagName==='A'&&e.target.getAttribute('href').charAt(0)==='#'){m.classList.remove('open')}});

  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px'});
    document.querySelectorAll('.reveal').forEach(function(el){io.observe(el)});
  } else document.querySelectorAll('.reveal').forEach(function(el){el.classList.add('in')});

  // seamless marquee: duplicate track
  var t=document.getElementById('track');if(t){t.innerHTML+=t.innerHTML;
  t.querySelectorAll('img').forEach(function(i,k){if(k>=t.querySelectorAll('img').length/2){i.alt='';i.setAttribute('aria-hidden','true')}});}

  // gentle parallax
  var px=[].slice.call(document.querySelectorAll('[data-parallax]'));
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches && px.length){
    var tick=false;
    function run(){px.forEach(function(img){var r=img.parentNode.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight)return;var p=(r.top+r.height/2-innerHeight/2)/innerHeight;img.style.transform='translate3d(0,'+(p*-6)+'%,0)'});tick=false}
    window.addEventListener('scroll',function(){if(!tick){requestAnimationFrame(run);tick=true}},{passive:true});run();
  }

  // upcoming Harmony Saturdays (links to the Wix booking calendar)
  document.querySelectorAll('[data-saturdays]').forEach(function(box){
    var n=+box.dataset.saturdays||6,d=new Date(),url='https://www.wildchildnosara.com/booking-calendar/wild-child-at-harmony-co-op-playground';
    var cr=new Date(d.toLocaleString('en-US',{timeZone:'America/Costa_Rica'}));
    var add=(6-cr.getDay()+7)%7;if(add===0&&cr.getHours()>=11)add=7;cr.setDate(cr.getDate()+add);
    var html='';for(var i=0;i<n;i++){var x=new Date(cr);x.setDate(cr.getDate()+7*i);
      html+='<a class="sat" href="'+url+'"><b>'+x.toLocaleDateString('en-US',{weekday:'short'})+'</b><span>'+x.toLocaleDateString('en-US',{month:'short',day:'numeric'})+'</span><small>8:30 am</small></a>'}
    box.innerHTML=html;
  });

  // new-chapter pop-up (home page, once per visit, like the Wix site)
  var promo=document.getElementById('chapter-popup');
  if(promo&&promo.showModal){
    var seen=false;try{seen=sessionStorage.getItem('wc_promo')==='1'}catch(e){}
    if(!seen)setTimeout(function(){if(!document.querySelector('dialog[open]')){promo.showModal();try{sessionStorage.setItem('wc_promo','1')}catch(e){}}},3500);
    promo.querySelector('.dialog-close').addEventListener('click',function(){promo.close()});
    promo.addEventListener('click',function(e){if(e.target===promo)promo.close()});
  }

  // inquiry pop-up (same form as the Wix site's "Send us a note")
  var dlg=document.getElementById('inquiry');
  if(dlg&&dlg.showModal){
    document.addEventListener('click',function(e){
      var a=e.target.closest&&e.target.closest('[data-inquiry]');
      if(a){e.preventDefault();dlg.showModal();var f=dlg.querySelector('input');if(f)f.focus()}
    });
    dlg.querySelector('.dialog-close').addEventListener('click',function(){dlg.close()});
    dlg.addEventListener('click',function(e){if(e.target===dlg)dlg.close()});
  }

  // forms → wildchild-forms /api/site (Resend email to Lili + Flodesk "Website inquiries")
  var ENDPOINT='https://wildchild-forms.vercel.app/api/site';
  var THANKS='Thank you for your message. We will be in contact soon.';
  var FALLBACK=' Please email <a href="mailto:info@dandelionwildschooling.org">info@dandelionwildschooling.org</a> or WhatsApp <a href="https://wa.me/50661640827">+506 6164 0827</a>.';
  document.querySelectorAll('form[data-form]').forEach(function(f){
    f.addEventListener('submit',function(e){
      e.preventDefault();
      var m=f.querySelector('.msg'),btn=f.querySelector('button[type=submit]'),grp=f.querySelector('[data-required-group]');
      function say(t,ok){if(m){m.innerHTML=t;m.className='msg'+(ok?' ok':' err')}}
      if(grp&&!grp.querySelector('input:checked')){say('Please choose at least one program (or “Not sure yet”).');grp.querySelector('input').focus();return}
      if(!f.checkValidity()){f.reportValidity();return}
      var rows={},order=[],data={form:f.dataset.form,page:location.pathname,company:(f.elements.company||{}).value||''};
      [].forEach.call(f.elements,function(el){
        if(!el.name||el.name==='company'||!el.value.trim())return;
        if((el.type==='checkbox'||el.type==='radio')&&!el.checked)return;
        if(el.name==='email')data.email=el.value.trim();
        if(el.name==='first_name')data.first_name=el.value.trim();
        if(el.name==='last_name')data.last_name=el.value.trim();
        if(el.name==='name'){var p=el.value.trim().split(/\s+/);data.first_name=p.shift();data.last_name=p.join(' ')}
        var k=el.dataset.label||el.getAttribute('aria-label')||el.name;if(!(k in rows)){rows[k]=[];order.push(k)}rows[k].push(el.value.trim());
      });
      data.fields=order.map(function(k){return [k,rows[k].join(', ')]});
      if(f.dataset.source)data.fields.unshift(['Source',f.dataset.source]);
      btn.disabled=true;var old=btn.textContent;btn.textContent='Sending…';say('');
      fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)})
        .then(function(r){return r.json().catch(function(){return {ok:false}}).then(function(j){if(!r.ok||!j.ok)throw new Error(j.error||'');return j})})
        .then(function(){
          f.reset();
          if(f.dataset.source){say('Thank you! We’ll be in touch with the new programs soon.',true);setTimeout(function(){var dd=f.closest('dialog');if(dd)dd.close()},2600)}
          else if(f.dataset.form==='newsletter'){say('Thank you — you’re subscribed to Wild Child’s Letter.',true)}
          else{f.classList.add('sent');var d=document.createElement('div');d.className='sent-note';d.innerHTML='<h3>Thank you</h3><p>'+THANKS+'</p><p>For anything urgent, WhatsApp us at <a href="https://wa.me/50661640827">+506 6164 0827</a>.</p>';f.parentNode.insertBefore(d,f.nextSibling);d.scrollIntoView({block:'nearest',behavior:'smooth'})}
        })
        .catch(function(err){say((err.message&&err.message.length<160?err.message:'Something went wrong sending your message.')+(/email info@/.test(err.message)?'':FALLBACK))})
        .then(function(){btn.disabled=false;btn.textContent=old});
    });
  });
})();
