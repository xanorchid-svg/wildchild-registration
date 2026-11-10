
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

  // newsletter: replace with Flodesk/Resend endpoint when deployed
  var su=document.getElementById('signup');if(su)su.addEventListener('submit',function(e){
    e.preventDefault();var v=this.email.value.trim(),msg=document.getElementById('signup-msg');
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)){msg.textContent='Please enter a valid email address.';return}
    // TODO: post to Flodesk / Resend. Until then, hand off to email so no signup is lost.
    location.href='mailto:info@dandelionwildschooling.org?subject='+encodeURIComponent('Subscribe me to Wild Child\'s Letter')+'&body='+encodeURIComponent('Please add '+v+' to the Wild Child letter.');
    msg.textContent='Opening your email app to confirm your signup…';
  });

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

  document.querySelectorAll('form[data-mailto]').forEach(function(f){
    f.addEventListener('submit',function(e){
      e.preventDefault();
      var m=f.querySelector('.msg'),grp=f.querySelector('[data-required-group]');
      if(grp&&!grp.querySelector('input:checked')){if(m)m.textContent='Please choose at least one program (or "Not sure yet").';grp.querySelector('input').focus();return}
      if(!f.checkValidity()){f.reportValidity();return}
      var rows={},order=[];
      [].forEach.call(f.elements,function(el){
        if(!el.name||!el.value)return;
        if((el.type==='checkbox'||el.type==='radio')&&!el.checked)return;
        var k=el.dataset.label||el.name;if(!(k in rows)){rows[k]=[];order.push(k)}rows[k].push(el.value);
      });
      var body=order.map(function(k){return k+': '+rows[k].join(', ')}).join('\n');
      location.href='mailto:'+f.dataset.mailto+'?subject='+encodeURIComponent(f.dataset.subject||'Website inquiry')+'&body='+encodeURIComponent(body);
      if(m)m.textContent='Opening your email app with your message ready to send. If nothing opens, email info@dandelionwildschooling.org or WhatsApp +506 6164 0827.';
    });
  });
})();
