/* ai.js — تحليل الإيضاحات المالية بالذكاء الاصطناعي (Gemini عبر خادم محلي) */

// عنوان الخادم — رابط نسبي
const AI_ENDPOINT = '/analyze-notes';

// يحدد لون/درجة الخطورة من الإيموجي في نص الرد
function aiLevelFromText(text){
  if(text.includes('🔴')) return 'high';
  if(text.includes('🟡')) return 'medium';
  if(text.includes('🟢')) return 'low';
  return 'medium';
}

// يقسم رد Gemini إلى أقسام حسب عناوين الإيموجي المتّفق عليها في prompt.py
function splitAiSections(text){
  const markers=[
    {key:'summary',    re:/📝\s*الملخص/},
    {key:'risks',      re:/⚠️\s*أهم المخاطر/},
    {key:'compliance', re:/📚\s*مدى الالتزام/},
    {key:'missing',    re:/❗\s*الإفصاحات الناقصة/},
    {key:'recs',       re:/💡\s*التوصيات/},
    {key:'risklevel',  re:/🚦\s*درجة الخطورة/},
  ];
  const found=[];
  markers.forEach(m=>{ const mm=m.re.exec(text); if(mm) found.push({key:m.key, idx:mm.index, len:mm[0].length}); });
  found.sort((a,b)=>a.idx-b.idx);
  const sec={};
  found.forEach((f,i)=>{
    const start=f.idx+f.len;
    const end=i+1<found.length ? found[i+1].idx : text.length;
    sec[f.key]=text.slice(start,end).replace(/\*\*/g,'').trim();
  });
  return sec;
}

// يحوّل قسم نصي (أسطر متعددة) إلى قائمة بنفس أسلوب mj-reason المستخدم في بقية الموقع
function aiListify(sectionText, level){
  if(!sectionText) return '';
  const lines=sectionText.split(/\n+/).map(l=>l.replace(/^[-•\d.\)]+\s*/,'').trim()).filter(Boolean);
  if(!lines.length) return '';
  return '<div class="mj-reasons">'+lines.map(li=>
    `<div class="mj-reason ${level}"><span>${level==='high'?'•':level==='medium'?'•':'✓'}</span> ${escapeHtml(li)}</div>`
  ).join('')+'</div>';
}

// يبني بطاقة النتيجة النهائية بنفس هوية تصميم مِجهر (mj-card / mj-h / mj-badge...)
function aiResultHTML(rawText){
  const text=(rawText||'').trim();

  // حالة: النص المُدخل ليس إيضاحات مالية أصلًا
  if(text.startsWith('❌')){
    return `<div class="mj-error"><b>${escapeHtml(text)}</b></div>`;
  }

  const level=aiLevelFromText(text);
  const L=CONFIG.LV[level];
  const sec=splitAiSections(text);
  const badgeText=(sec.risklevel||'').replace(/[🔴🟡🟢]/g,'').trim() || L.ar;

  let h=`<div class="mj-card">
    <div class="mj-top">
      <div>
        <div class="mj-badge" style="background:${L.bg};color:${L.col}">${escapeHtml(badgeText)}</div>
      </div>
      <div class="mj-meta"><div class="mj-co">تحليل الإيضاحات بالذكاء الاصطناعي (Gemini)</div></div>
    </div>`;

  if(sec.summary)    h+=`<h3 class="mj-h">الملخص</h3><p style="color:var(--ink);line-height:1.9;margin-bottom:.6rem">${escapeHtml(sec.summary)}</p>`;
  if(sec.risks)      h+=`<h3 class="mj-h">أهم المخاطر</h3>${aiListify(sec.risks, level)}`;
  if(sec.compliance) h+=`<h3 class="mj-h">مدى الالتزام</h3><p style="color:var(--ink);line-height:1.9;margin-bottom:.6rem">${escapeHtml(sec.compliance)}</p>`;
  if(sec.missing)    h+=`<h3 class="mj-h">الإفصاحات الناقصة</h3>${aiListify(sec.missing, 'medium')}`;
  if(sec.recs)       h+=`<h3 class="mj-h">التوصيات</h3>${aiListify(sec.recs, 'low')}`;

  h+=`<p class="mj-note">تحليل آلي بالذكاء الاصطناعي (Gemini) للإيضاحات النصية — مساعد أوّلي ولا يغني عن المراجعة البشرية.</p></div>`;
  return h;
}

async function analyzeNotes(){
  const textarea=document.getElementById('ai-data');
  const box=ensureAfter(document.querySelector('.ai-analysis-box'), 'mj-ai-out');
  const text=(textarea.value||'').trim();

  if(!text){
    box.innerHTML=errHTML('الصق نص الإيضاحات المالية أولًا.');
    box.scrollIntoView({behavior:'smooth'});
    return;
  }

  const btn=document.querySelector('.btn-analyze-ai');
  const originalLabel=btn ? btn.textContent : '';
  if(btn){ btn.disabled=true; btn.textContent='جاري التحليل...'; }
  box.innerHTML='<div class="mj-live warn" style="padding:.7rem .9rem">⏳ جاري تحليل الإيضاحات بالذكاء الاصطناعي، قد يستغرق بضع ثوانٍ...</div>';

  try{
    const res=await fetch(AI_ENDPOINT, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({text})
    });
    let data;
    try{ data=await res.json(); }catch(_){ data={}; }

    if(!res.ok){
      throw new Error(data.error || `تعذّر الاتصال بخادم التحليل (رمز ${res.status}).`);
    }

    box.innerHTML=aiResultHTML(data.result || '');
    box.scrollIntoView({behavior:'smooth'});
  }catch(e){
    box.innerHTML=errHTML('تعذّر إتمام التحليل.', [
      'تأكّد من الاتصال بالإنترنت (الاتصال بـ Gemini API).',
      e && e.message ? e.message : ''
    ].filter(Boolean));
    box.scrollIntoView({behavior:'smooth'});
  }finally{
    if(btn){ btn.disabled=false; btn.textContent=originalLabel; }
  }
}
