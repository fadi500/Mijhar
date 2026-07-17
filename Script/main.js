/* main.js — تشغيل الفحص الرئيسي */
function runAnalysis(){
  const box=document.getElementById('mejhar-results');
  const filled=readData().filter(isFilled);
  if(filled.length<2){ box.innerHTML=errHTML('عبّئ سنتين متتاليتين على الأقل لإجراء الفحص.'); box.scrollIntoView({behavior:'smooth'}); return; }
  const errs=validate(filled);
  if(errs.length){ box.innerHTML=errHTML('تعذّر الفحص — صحّح ما يلي:', errs.slice(0,8)); box.scrollIntoView({behavior:'smooth'}); return; }

  const series=[];
  for(let i=1;i<filled.length;i++) series.push({year:filled[i].year, ...calculateRisk(filled[i], filled[i-1])});
  STATE.lastSeries=series;

  const nameEl=document.getElementById('company-name');
  const name=(nameEl&&nameEl.value.trim())||'المنشأة';
  displayResults(series, name);
}
