/* events.js — التهيئة وربط الأحداث */
document.addEventListener('DOMContentLoaded', () => {
  initRouter();
  initScrollReveal();
  initTheme();

  // قيم افتراضية لسنة البداية والعدد
  const startEl=document.getElementById('start-date');
  const countEl=document.getElementById('years-count');
  if(startEl && !startEl.value) startEl.value=CONFIG.DEFAULT_START;
  if(countEl){ countEl.value=String(CONFIG.DEFAULT_COUNT); }

  // شريط بيانات تجريبية + زر الفحص (صفحة "رفع البيانات")
  const wrap=document.querySelector('#page-upload .data-table-wrapper');
  if(wrap){
    const bar=document.createElement('div'); bar.className='mj-toolbar';
    bar.innerHTML='<span>تعبئة تجريبية:</span>'+
      '<button type="button" class="mj-chip risky">شركة مريبة</button>'+
      '<button type="button" class="mj-chip clean">شركة سليمة</button>';
    wrap.insertAdjacentElement('beforebegin', bar);
    bar.querySelector('.risky').addEventListener('click', ()=>fillDemo('risky'));
    bar.querySelector('.clean').addEventListener('click', ()=>fillDemo('clean'));

    const btn=document.createElement('button');
    btn.type='button'; btn.className='btn-primary btn-run'; btn.id='btn-run-analysis';
    btn.textContent='شغّل الفحص'; btn.style.marginTop='1.4rem';
    btn.addEventListener('click', ()=>{ runAnalysis(); showAppPage('dashboard'); });
    wrap.insertAdjacentElement('afterend', btn);
  }

  // شريط تعبئة تجريبية — صفحة بنفورد
  const benfordCtl=document.querySelector('#page-benford .analysis-controls');
  if(benfordCtl){
    const bar=document.createElement('div'); bar.className='mj-toolbar';
    bar.innerHTML='<span>تعبئة تجريبية:</span>'+
      '<button type="button" class="mj-chip risky">شركة مريبة</button>'+
      '<button type="button" class="mj-chip clean">شركة سليمة</button>';
    benfordCtl.insertAdjacentElement('beforebegin', bar);
    bar.querySelector('.risky').addEventListener('click', ()=>fillBenfordDemo('risky'));
    bar.querySelector('.clean').addEventListener('click', ()=>fillBenfordDemo('clean'));
  }

  // شريط تعبئة تجريبية — صفحة تحليل الإيضاحات
  const aiBox=document.querySelector('#page-ai .ai-analysis-box');
  if(aiBox){
    const bar=document.createElement('div'); bar.className='mj-toolbar';
    bar.innerHTML='<span>تعبئة تجريبية:</span>'+
      '<button type="button" class="mj-chip risky">شركة مريبة</button>'+
      '<button type="button" class="mj-chip clean">شركة سليمة</button>';
    aiBox.insertAdjacentElement('beforebegin', bar);
    bar.querySelector('.risky').addEventListener('click', ()=>fillNotesDemo('risky'));
    bar.querySelector('.clean').addEventListener('click', ()=>fillNotesDemo('clean'));
  }

  // بناء الجدول أول مرة + إعادة بنائه عند تغيير السنة أو العدد
  buildTable();
  if(startEl) startEl.addEventListener('input', buildTable);
  if(countEl) countEl.addEventListener('change', buildTable);

  // تلوين الخانة الخاطئة فورًا
  const table=document.querySelector('.financial-table');
  if(table) table.addEventListener('input', e=>{
    if(!e.target.classList.contains('table-input')) return;
    const inp=e.target, raw=inp.value.trim(), v=cleanNumber(inp.value);
    inp.classList.toggle('invalid', raw!=='' && v==null);
  });

  // رفع الإكسل: زر خفي + نقر على صندوق الرفع + سحب وإفلات
  const fileInput=document.createElement('input'); fileInput.type='file'; fileInput.accept='.xlsx,.xls,.csv'; fileInput.style.display='none'; fileInput.id='mj-file';
  document.body.appendChild(fileInput);
  fileInput.addEventListener('change', e=>{ if(e.target.files[0]) handleExcelFile(e.target.files[0]); e.target.value=''; });
  const uploadBox=document.querySelector('.upload-box');
  if(uploadBox){
    uploadBox.style.cursor='pointer';
    uploadBox.addEventListener('click', ()=>fileInput.click());
    uploadBox.addEventListener('dragover', e=>{ e.preventDefault(); uploadBox.classList.add('is-dragover'); });
    uploadBox.addEventListener('dragleave', ()=>{ uploadBox.classList.remove('is-dragover'); });
    uploadBox.addEventListener('drop', e=>{ e.preventDefault(); uploadBox.classList.remove('is-dragover'); if(e.dataTransfer.files[0]) handleExcelFile(e.dataTransfer.files[0]); });
  }

  // ربط الأزرار
  bind('.btn-upload', downloadTemplate);
  bind('.btn-reset', resetTable);
  bind('.btn-analyze', runBenford);
  bind('.btn-analyze-ai', analyzeNotes);
});
