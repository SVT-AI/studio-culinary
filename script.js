(function(){
  const $ = (s,root=document)=>root.querySelector(s);
  const $$ = (s,root=document)=>Array.from(root.querySelectorAll(s));

  // Theme
  const html = document.documentElement;
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) html.setAttribute('data-theme', savedTheme);
  $('#themeToggle')?.addEventListener('click', ()=>{
    const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  });

  // Print
  $('#printBtn')?.addEventListener('click', ()=> window.print());

  // Year
  $('#year').textContent = new Date().getFullYear();

  // Normalize (for search/tags)
  const normalize = (s)=> (s||'').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9\s-]/g,'');

  // URL state helpers
  const stateFromURL = ()=>{
    const p = new URLSearchParams(location.search);
    return {
      q: p.get('q') || '',
      tags: (p.get('tags')||'').split(',').filter(Boolean)
    };
  };
  const pushState = (q, tags)=>{
    const p = new URLSearchParams(location.search);
    if (q) p.set('q', q); else p.delete('q');
    if (tags.length) p.set('tags', tags.join(',')); else p.delete('tags');
    const url = location.pathname + (p.toString() ? '?' + p.toString() : '') + location.hash;
    history.replaceState(null, '', url);
  };

  const search = $('#search');
  const tagBar = $('#tagBar');
  const grid = $('#grid');
  const activeTags = new Set();

  // Init from URL
  const init = stateFromURL();
  if (init.q) search.value = init.q;
  init.tags.forEach(t => {
    const btn = $(`.tag[data-tag="${t}"]`);
    if (btn){ activeTags.add(t); btn.classList.add('active'); }
  });

  function applyFilters(){
    const q = normalize(search.value || '');
    const cards = $$('.card', grid);
    cards.forEach(card => {
      const tags = card.dataset.tags || '';
      const title = card.querySelector('h3').textContent;
      const haystack = normalize(title + ' ' + tags);
      const matchesText = !q || haystack.includes(q);
      const matchesTags = activeTags.size === 0 || [...activeTags].every(t => tags.includes(t));
      card.style.display = (matchesText && matchesTags) ? 'flex' : 'none';
    });
    pushState(search.value.trim(), [...activeTags]);
  }

  search?.addEventListener('input', applyFilters);

  tagBar?.addEventListener('click', (e)=>{
    const btn = e.target.closest('.tag');
    if(!btn) return;
    const key = (btn.dataset.tag || '').toLowerCase();
    if(activeTags.has(key)){ activeTags.delete(key); btn.classList.remove('active'); }
    else { activeTags.add(key); btn.classList.add('active'); }
    applyFilters();
  });

  // Lightbox
  const modal = $('#modal');
  const modalImg = $('#modalImg');
  document.addEventListener('click', (e)=>{
    const img = e.target.closest('.lightbox');
    if(img){ modalImg.src = img.src; modal.classList.add('open'); }
  });
  modal?.addEventListener('click', ()=> modal.classList.remove('open'));

  // Favorites + Details
  $$('.card').forEach((card, idx)=>{
    const favKey = 'fav-' + idx;
    const favBtn = $('[data-action="favorite"]', card);
    const detBtn = $('[data-action="details"]', card);
    const setFav = (on)=>{
      favBtn.textContent = on ? '★ Ulubione' : 'Zobacz przepis';
      favBtn.setAttribute('aria-pressed', on);
    };
    setFav(localStorage.getItem(favKey) === '1');
    favBtn?.addEventListener('click', (e)=>{
      e.preventDefault();
      const on = !(localStorage.getItem(favKey) === '1');
      localStorage.setItem(favKey, on ? '1' : '0'); setFav(on);
    });
    detBtn?.addEventListener('click', (e)=>{
      e.preventDefault();
      alert('Szczegóły przepisu: ' + card.querySelector('h3').textContent + '\nSkładniki, czas, poziom… (miejsce na Twoją treść).');
    });
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e)=>{
    if (e.key === '/' && document.activeElement !== search){ e.preventDefault(); search.focus(); }
    if (e.key === 'Escape'){ modal?.classList.remove('open'); }
  });

  // Contact form validation + Netlify fallback
  const cForm = $('#contact-form');
  const cName = $('input[name="name"]', cForm);
  const cEmail = $('input[name="email"]', cForm);
  const cMsg = $('textarea[name="message"]', cForm);
  const cConsent = $('#consent', cForm);
  const cStatus = $('#form-status');

  const validateEmail = (v)=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  cForm?.addEventListener('submit', (e)=>{
    // Client validation
    e.preventDefault();
    let ok = true;
    cStatus.textContent = '';
    if(!cName.value.trim()){ ok=false; cStatus.textContent = 'Podaj imię.'; }
    else if(!validateEmail(cEmail.value)){ ok=false; cStatus.textContent = 'Podaj poprawny e-mail.'; }
    else if(!cMsg.value.trim()){ ok=false; cStatus.textContent = 'Napisz wiadomość.'; }
    else if(!cConsent.checked){ ok=false; cStatus.textContent = 'Zaznacz zgodę na kontakt.'; }
    if(!ok) return;

    // If Netlify handles the form, submit natively
    if (cForm.hasAttribute('data-netlify')){
      cForm.submit();
      return;
    }

    // Fallback: mailto
    const subject = encodeURIComponent('Wiadomość ze strony Culinary Studio');
    const body = encodeURIComponent(`Imię: ${cName.value}\nEmail: ${cEmail.value}\n\n${cMsg.value}`);
    window.location.href = `mailto:kontakt@example.com?subject=${subject}&body=${body}`;
  });

  // Apply initial filters (URL state)
  applyFilters();
})();