/* ui.js — بناء الجدول ديناميكيًا + التنقّل بين الواجهات */

// يبني أعمدة الجدول حسب سنة البداية وعدد السنوات (تصاعدي)
function buildTable(){
  const startEl=document.getElementById('start-date');
  const countEl=document.getElementById('years-count');
  let start=parseInt((startEl&&startEl.value||'').replace(/[^0-9]/g,''));
  let count=parseInt(countEl&&countEl.value);
  if(!start) start=CONFIG.DEFAULT_START;
  if(!count) count=CONFIG.DEFAULT_COUNT;

  const years=[]; for(let i=0;i<count;i++) years.push(start+i); // 2000,2001,2002...

  const table=document.querySelector('.financial-table');
  if(!table) return;
  table.querySelector('thead').innerHTML='<tr><th>البند</th>'+years.map(y=>`<th>${y}</th>`).join('')+'</tr>';
  let body='';
  CONFIG.ROW_KEYS.forEach((key,r)=>{
    body+=`<tr><td>${CONFIG.FIELD_AR[r]}</td>`+
      years.map(y=>`<td><input type="number" class="table-input" data-year="${y}" data-key="${key}"></td>`).join('')+
      '</tr>';
  });
  table.querySelector('tbody').innerHTML=body;
  clearResults();
}

/* ---------------- التنقّل: الواجهة التسويقية ↔ لوحة التطبيق ---------------- */

// يبدّل بين "الرئيسية" (home) و"التطبيق" (app)
function showView(name){
  document.querySelectorAll('.view').forEach(v=>{ v.hidden = v.dataset.view!==name; });
  window.scrollTo(0,0);
}

// يبدّل الصفحة الظاهرة داخل التطبيق (dashboard/upload/benford/ai)
function showAppPage(name){
  document.querySelectorAll('.app-page').forEach(p=>{ p.hidden = p.dataset.page!==name; });
  document.querySelectorAll('.app-nav-link').forEach(b=>{ b.classList.toggle('is-active', b.dataset.page===name); });
  const titles={dashboard:'لوحة التحليل', upload:'رفع البيانات', benford:'تحليل بنفورد', ai:'تحليل الإيضاحات'};
  const titleEl=document.getElementById('app-page-title');
  if(titleEl) titleEl.textContent=titles[name]||'';
  const main=document.querySelector('.app-main');
  if(main) main.scrollTop=0;
}

// دخول وضع التطبيق مباشرة على صفحة معيّنة
function enterApp(page){ showView('app'); showAppPage(page||'upload'); }

function initRouter(){
  document.querySelectorAll('[data-enter-app]').forEach(el=>{
    el.addEventListener('click', ()=> enterApp(el.dataset.enterApp||'upload'));
  });
  document.querySelectorAll('.app-nav-link').forEach(btn=>{
    btn.addEventListener('click', ()=> showAppPage(btn.dataset.page));
  });
  document.querySelectorAll('.app-back-home').forEach(btn=>{
    btn.addEventListener('click', ()=> showView('home'));
  });
  document.querySelectorAll('[data-goto]').forEach(el=>{
    el.addEventListener('click', ()=> showAppPage(el.dataset.goto));
  });
}

/* ---------------- الوضع الداكن / الفاتح (يشمل الصفحة كاملة) ---------------- */

// يطبّق الوضع المطلوب: يبدّل data-theme على <html>، يحفظ الاختيار، ويبدّل ألوان CONFIG.LV
function applyTheme(theme){
  document.documentElement.dataset.theme=theme;
  try{ localStorage.setItem('mijhar-theme', theme); }catch(_){}

  Object.assign(CONFIG.LV, theme==='light' ? CONFIG.LV_LIGHT : CONFIG.LV_DARK);

  const toggleBtns=document.querySelectorAll('.js-theme-toggle');
  toggleBtns.forEach(btn=>{
    btn.innerHTML = theme==='light'
      ? '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg><span>الوضع الداكن</span>'
      : '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2v2.4M12 19.6V22M4.2 4.2l1.7 1.7M18.1 18.1l1.7 1.7M2 12h2.4M19.6 12H22M4.2 19.8l1.7-1.7M18.1 5.9l1.7-1.7"/></svg><span>الوضع الفاتح</span>';
  });

  // أعيدي رسم أي نتائج ظاهرة حاليًا بالألوان الجديدة (بدون أي طلب شبكة، مجرد إعادة عرض)
  if(typeof STATE!=='undefined' && STATE.lastSeries){
    const nameEl=document.getElementById('company-name');
    displayResults(STATE.lastSeries, (nameEl && nameEl.value.trim()) || 'المنشأة');
  }
  const benfordTA=document.getElementById('benford-data');
  if(benfordTA && benfordTA.value.trim() && typeof STATE!=='undefined' && STATE.benford.used){
    runBenford();
  }
}

function initTheme(){
  let saved='light';
  try{ saved=localStorage.getItem('mijhar-theme') || 'light'; }catch(_){}
  applyTheme(saved);
  document.querySelectorAll('.js-theme-toggle').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      applyTheme(document.documentElement.dataset.theme==='light' ? 'dark' : 'light');
    });
  });
}

/* ---------------- كشف الظهور عند التمرير (للصفحة التسويقية) ---------------- */
function initScrollReveal(){
  const items=document.querySelectorAll('.reveal');
  if(!items.length) return;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    items.forEach(el=>el.classList.add('is-visible'));
    return;
  }
  const io=new IntersectionObserver((entries)=>{
    entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('is-visible'); io.unobserve(e.target); } });
  }, {threshold:0.15});
  items.forEach(el=>io.observe(el));
}
