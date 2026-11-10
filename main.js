
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

  document.querySelectorAll('form[data-mailto]').forEach(function(f){
    f.addEventListener('submit',function(e){
      e.preventDefault();
      if(!f.checkValidity()){f.reportValidity();return}
      var lines=[];[].forEach.call(f.elements,function(el){if(el.name&&el.value)lines.push((el.dataset.label||el.name)+': '+el.value)});
      location.href='mailto:'+f.dataset.mailto+'?subject='+encodeURIComponent(f.dataset.subject||'Website inquiry')+'&body='+encodeURIComponent(lines.join('\n'));
      var m=f.querySelector('.msg');if(m)m.textContent='Opening your email app with your message ready to send…';
    });
  });
})();
(function(){if(document.querySelector('main>section.hero, main>section.page-hero:not(.plain)'))document.body.classList.add('has-hero')})();
