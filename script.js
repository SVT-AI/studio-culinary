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

  // Normalize
  const normalize = (s)=> (s||'').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9\s-]/g,'');

  // Recipes data with local images
  const RECIPES = [
    // Przekąski
    {cat:'przekaski', title:'Bruschetta z pomidorami', img:'/images/bruschetta.jpg', tags:'przekaski szybkie', desc:'Chrupiąca bagietka z pomidorami i bazylią.'},
    {cat:'przekaski', title:'Tosty caprese', img:'/images/caprese.jpg', tags:'przekaski wegetarianskie', desc:'Mozzarella, pomidor, bazylia.'},
    {cat:'przekaski', title:'Hummus z warzywami', img:'/images/hummus.jpg', tags:'przekaski wegetarianskie szybkie', desc:'Kremowy hummus + chrupiące słupki.'},
    {cat:'przekaski', title:'Grzanki z awokado', img:'/images/avocado.jpg', tags:'przekaski wegetarianskie', desc:'Awokado, cytryna, chili.'},
    {cat:'przekaski', title:'Roladki z cukinii', img:'/images/zucchini.jpg', tags:'przekaski bezglutenowe', desc:'Grillowana cukinia z serkiem.'},
    // Dania
    {cat:'dania', title:'Makaron z pomidorami', img:'/images/makaron.jpg', tags:'dania szybkie wegetarianskie', desc:'Sos czosnek + bazylia.'},
    {cat:'dania', title:'Kurczak pieczony z ziołami', img:'/images/kurczak.jpg', tags:'dania bezglutenowe', desc:'Soczysty kurczak z rozmarynem.'},
    {cat:'dania', title:'Szakszuka', img:'/images/szakszuka.jpg', tags:'dania wegetarianskie szybkie', desc:'Jajka w sosie pomidorowym.'},
    {cat:'dania', title:'Risotto z grzybami', img:'/images/risotto.jpg', tags:'dania', desc:'Kremowe risotto z leśnymi grzybami.'},
    {cat:'dania', title:'Łosoś z piekarnika', img:'/images/losos.jpg', tags:'dania bezglutenowe', desc:'Zioła, cytryna, oliwa.'},
    // Desery
    {cat:'desery', title:'Tiramisu w pucharkach', img:'/images/tiramisu.jpg', tags:'desery bezglutenowe', desc:'Klasyczny deser w lekkiej wersji.'},
    {cat:'desery', title:'Brownie czekoladowe', img:'/images/brownie.jpg', tags:'desery', desc:'Mokre, intensywnie czekoladowe.'},
    {cat:'desery', title:'Sernik nowojorski', img:'/images/sernik.jpg', tags:'desery', desc:'Gładki, kremowy, klasyk.'},
    {cat:'desery', title:'Panna cotta z malinami', img:'/images/pannacotta.jpg', tags:'desery bezglutenowe', desc:'Delikatny deser z musem malinowym.'},
    {cat:'desery', title:'Owocowa sałatka', img:'/images/salatka.jpg', tags:'desery wegetarianskie szybkie', desc:'Kolorowe owoce w cytrusowym dressingu.'},
  ];

  // Render cards
  function cardHTML(r){
    return `
      <article class="card" data-tags="${r.tags}">
        <img class="cover lightbox" src="${r.img}" alt="${r.title}" loading="lazy" />
        <h3>${r.title}</h3>
        <p>${r.desc}</p>
        <div class="meta">
          ${r.tags.split(' ').map(t=>`<span class="chip">${t}</span>`).join('')}
        </div>
        <a class="btn" href="#" data-action="favorite">Zobacz przepis</a>
        <a class="btn secondary" href="#" data-action="details">Szczegóły</a>
      </article>`;
  }

  const grids = {
    przekaski: $('#grid-przekaski'),
    dania: $('#grid-dania'),
    desery: $('#grid-desery')
  };

  Object.keys(grids).forEach(cat=>{
    const items = RECIPES.filter(r=>r.cat===cat);
    grids[cat].innerHTML = items.map(cardHTML).join('');
  });

  function initCards(){
    $$('.card').forEach((card, idx)=>{
      const favKey = 'fav-' + idx;
      const favBtn = card.querySelector('[data-action="favorite"]');
      const detBtn = card.querySelector('[data-action="details"]');
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
        alert('Szczegóły przepisu: ' + (card.querySelector('h3')?.textContent || '') + '\nSkładniki, czas, poziom…');
      });
    });
  }
  initCards();

  // Search + tags
  const search = $('#search');
  const tagBar = $('#tagBar');
  const activeTags = new Set();
  function applyFilters(){
    const q = normalize(search?.value || '');
    Object.values(grids).forEach(grid => {
      const cards = $$('.card', grid);
      let visible = 0;
      cards.forEach(card => {
        const tags = card.dataset.tags || '';
        const title = card.querySelector('h3')?.textContent || '';
        const haystack = normalize(title + ' ' + tags);
        const show = (!q || haystack.includes(q)) && (activeTags.size===0 || [...activeTags].every(t => tags.includes(t)));
        card.style.display = show ? 'flex' : 'none';
        if (show) visible++;
      });
      const counter = grid.previousElementSibling?.querySelector?.('.count');
      if (counter) counter.textContent = visible + ' wyników';
    });
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

  // --- Calorie calculator + generator ---
  const PRODUCTS = {
    "makaron": 350, "ryż": 360, "kurczak": 165, "łosoś": 208,
    "oliwa": 884, "masło": 717, "cukier": 387, "jajko": 155,
    "pomidor": 18, "cebula": 40, "czosnek": 149, "bazylia": 23,
    "mozzarella": 280, "mascarpone": 430, "kakao": 228,
    "jogurt naturalny": 60, "marchew": 41, "bagietka": 270,
    "mleko": 64, "mąka pszenna": 364
  }; // kcal/100g

  const calSelect = $('#cal-product');
  const calGrams = $('#cal-grams');
  const calAdd = $('#cal-add');
  const calBody = $('#cal-body');
  const calTotal = $('#cal-total');
  const dishName = $('#dish-name');
  const dishCat  = $('#dish-category');
  const dishClear = $('#dish-clear');
  const savedDishes = $('#saved-dishes');

  calSelect.innerHTML = Object.keys(PRODUCTS).sort().map(p=>`<option value="${p}">${p} (${PRODUCTS[p]} kcal/100g)</option>`).join('');

  function rowHTML(name, grams, kcal){
    return `<tr>
      <td>${name}</td><td>${grams}</td><td>${kcal}</td>
      <td><button class="btn secondary cal-del">Usuń</button></td></tr>`;
  }
  function recalc(){
    let sum = 0;
    $$('#cal-body tr').forEach(tr=>{ sum += parseFloat(tr.children[2].textContent||'0')||0; });
    calTotal.textContent = Math.round(sum);
  }
  calAdd.addEventListener('click', ()=>{
    const name = calSelect.value;
    const grams = Math.max(1, parseInt(calGrams.value||'0',10));
    const kcal = (PRODUCTS[name]||0) * grams / 100;
    calBody.insertAdjacentHTML('beforeend', rowHTML(name, grams, Math.round(kcal)));
    recalc();
  });
  calBody.addEventListener('click', (e)=>{
    if (e.target.closest('.cal-del')){ e.target.closest('tr').remove(); recalc(); }
  });
  dishClear.addEventListener('click', ()=>{ calBody.innerHTML=''; recalc(); });

  // Generator przepisu → nowa karta
  function readItems(){
    return $$('#cal-body tr').map(tr=>({
      product: tr.children[0].textContent,
      grams: parseInt(tr.children[1].textContent,10),
      kcal: parseInt(tr.children[2].textContent,10)
    }));
  }
  function injectCard({cat, title, desc}){
    const grid = cat==='przekaski' ? grids.przekaski : cat==='desery' ? grids.desery : grids.dania;
    const img = cat==='desery' ? '/images/sernik.jpg' : (cat==='przekaski' ? '/images/bruschetta.jpg' : '/images/makaron.jpg');
    const tags = cat + ' szybkie';
    const html = `
      <article class="card" data-tags="${tags}">
        <img class="cover lightbox" src="${img}" alt="${title}" loading="lazy" />
        <h3>${title}</h3>
        <p>${desc}</p>
        <div class="meta">${tags.split(' ').map(t=>`<span class="chip">${t}</span>`).join('')}</div>
        <a class="btn" href="#" data-action="favorite">Zobacz przepis</a>
        <a class="btn secondary" href="#" data-action="details">Szczegóły</a>
      </article>`;
    grid.insertAdjacentHTML('afterbegin', html);
  }

  $('#dish-make-recipe').addEventListener('click', ()=>{
    const items = readItems();
    if (!items.length){ alert('Dodaj najpierw składniki do potrawy.'); return; }
    const total = parseInt(calTotal.textContent||'0',10);
    const title = (dishName.value || 'Moja potrawa').trim();
    const cat = dishCat.value || 'dania';
    const desc = `~${Math.round(total/2)} kcal/porcję • ${items.length} składników`;
    // zapisz
    const gen = JSON.parse(localStorage.getItem('generated-recipes')||'[]');
    gen.unshift({title, cat, items, total, ts: Date.now()});
    localStorage.setItem('generated-recipes', JSON.stringify(gen));
    injectCard({cat, title, desc});
  });

  // Start filters after initial render
  (function initCounts(){ applyFilters(); })();
})();