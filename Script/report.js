/* report.js — بناء وعرض النتيجة */

function clearResults(){ const b=document.getElementById('mejhar-results'); if(b) b.innerHTML=''; }

function errHTML(title, list){
  let h=`<div class="mj-error"><b>${title}</b>`;
  if(list&&list.length) h+='<ul>'+list.map(x=>`<li>${x}</li>`).join('')+'</ul>';
  return h+'</div>';
}

function displayResults(series, name){
  const latest=series[series.length-1], L=CONFIG.LV[latest.level];
  const bf=STATE.benford.used;

  let h=`<div class="mj-card">
    <div class="mj-stat-grid">
      <div class="mj-stat mj-stat-score">
        <div class="mj-gauge-wrap">
          ${scoreGauge(latest.risk, L.col)}
          <div class="mj-gauge-center">
            <span class="mj-gauge-num" style="color:${L.col}">${latest.risk}</span>
            <span class="mj-gauge-den">/ 100</span>
          </div>
        </div>
        <div class="mj-badge" style="background:${L.bg};color:${L.col}">${L.ar}</div>
      </div>
      <div class="mj-stat">
        <span class="mj-stat-label">M-SCORE</span>
        <span class="mj-stat-value">${latest.beneish.M.toFixed(2)}</span>
        <span class="mj-stat-sub">${latest.beneish.M>-1.78?'تجاوز عتبة التلاعب (−1.78)':'دون عتبة التلاعب'}</span>
      </div>
      <div class="mj-stat">
        <span class="mj-stat-label">المنشأة</span>
        <span class="mj-stat-value mj-stat-value-sm">${escapeHtml(name)}</span>
        <span class="mj-stat-sub">سنة ${latest.year}</span>
      </div>
      <div class="mj-stat">
        <span class="mj-stat-label">أوزان الدرجة المركّبة</span>
        <span class="mj-stat-value mj-stat-value-sm">بينيش ${latest.weights.beneish*100}٪ · إشارات ${latest.weights.red*100}٪</span>
        <span class="mj-stat-sub">${bf?`بنفورد ${latest.weights.benford*100}٪ ضمن الدرجة`:'بنفورد غير مُدرَج (لم يُشغَّل)'}</span>
      </div>
    </div>
    <h3 class="mj-h">أبرز الملاحظات</h3>
    <div class="mj-reasons">${reasonsHTML(latest)}</div>
  </div>`;

  // الرسم الزمني
  h+=`<h3 class="mj-h">الخط الزمني للخطورة</h3>
      <div class="mj-chartbox">${svgChart(series)}
      <div class="mj-legend"><span><i style="background:#1F9D6B"></i>منخفض</span><span><i style="background:#C2891C"></i>متوسّط</span><span><i style="background:#CB3F3F"></i>عالٍ</span><span><i class="dash"></i>عتبة الخطر (67)</span></div>
      <div class="mj-story">${storyText(series)}</div></div>`;

  // كروت شرح المؤشرات الثمانية (+ بنفورد)
  h+=`<h3 class="mj-h">مؤشرات بينيش الثمانية</h3>`+indicatorCards(latest.beneish);

  // الإشارات الحمراء (جدول)
  h+=`<h3 class="mj-h">الإشارات الحمراء</h3>`+redFlagsTable(latest.rf);

  h+=`<p class="mj-note">تنويه: فحص أوّلي يشير إلى احتمالية تستدعي تحقّقًا بشريًا، ولا يُعدّ اتهامًا أو دليلًا قاطعًا.</p>`;

  const box=document.getElementById('mejhar-results'); box.innerHTML=h; box.scrollIntoView({behavior:'smooth'});
}

function storyText(series){
  const fr=series.find(s=>s.level!=='low'), fh=series.find(s=>s.level==='high');
  if(!fr) return 'بقيت درجة الخطورة منخفضة ومستقرة طوال الفترة — لا مؤشرات تصعيد.';
  let t=`بدأت مؤشرات الخطورة بالارتفاع من عام ${fr.year}`; if(fh) t+=`، ودخلت منطقة الخطر العالي في ${fh.year}`;
  return t+'. ننصح بتركيز التدقيق على هذه الفترة وما بعدها.';
}

function reasonsHTML(r){
  const out=[];
  if(r.beneish.TATA>0.03) out.push(['high','الأرباح غير مدعومة بتدفّق نقدي كافٍ (استحقاقات مرتفعة).']);
  if(r.beneish.DSRI>1.4) out.push(['medium','الذمم المدينة تنمو أسرع من الإيرادات بشكل غير طبيعي.']);
  if(r.beneish.SGI>1.4) out.push(['medium','نمو سريع وغير معتاد في المبيعات.']);
  if(r.beneish.GMI>1.0) out.push(['medium','تدهور في هامش الربح الإجمالي.']);
  r.rf.flags.forEach(f=>{if(f.fired) out.push([f.sev,f.msg]);});
  if(STATE.benford.used && STATE.benford.score>60) out.push(['high',`توزيع الأرقام (بنفورد) غير مطابق للطبيعي — احتمال فبركة.`]);
  if(!out.length) out.push(['low','لم تُشتعل أي إشارة جوهرية — المؤشرات ضمن الحدود الطبيعية.']);
  return out.map(([s,tx])=>`<div class="mj-reason ${s}"><span>${s==='high'?'🔴':s==='medium'?'⚠️':'✓'}</span> ${tx}</div>`).join('');
}

// كروت المؤشرات الثمانية + كرت بنفورد
function indicatorCards(b){
  let cards='';
  Object.keys(CONFIG.RM).forEach(k=>{
    const m=CONFIG.RM[k], v=b[k];
    const fired = k==='TATA' ? v>0.03 : v>m.th;
    const cls = (k==='TATA'&&v>0.03) ? 'high' : fired ? 'med' : 'low';
    const label = (k==='TATA'&&v>0.03) ? 'حرج' : fired ? 'مرتفع' : 'طبيعي';
    cards+=`<div class="mj-icard">
      <div class="mj-icard-h"><span class="mj-pill ${cls}">${label}</span><b>${m.ar} <small>${k}</small></b></div>
      <div class="mj-icard-v">${v.toFixed(2)}</div>
      <div class="mj-icard-d">${m.desc}</div></div>`;
  });
  if(STATE.benford.used){
    const s=STATE.benford, cls=s.score>66?'high':s.score>33?'med':'low';
    cards+=`<div class="mj-icard">
      <div class="mj-icard-h"><span class="mj-pill ${cls}">${s.band}</span><b>قانون بنفورد <small>Benford</small></b></div>
      <div class="mj-icard-v">${Math.round(s.score)}</div>
      <div class="mj-icard-d">يفحص توزيع الخانة الأولى للأرقام التفصيلية (${s.total} رقم). الانحراف عن التوزيع الطبيعي يشير لاحتمال فبركة.</div></div>`;
  }
  return `<div class="mj-cards">${cards}</div>`;
}

function redFlagsTable(rf){
  let rows='';
  rf.flags.forEach(f=>{let disp,pill;
    if(f.key==='neg'){disp=Math.round(f.val).toLocaleString('en');pill=f.fired?'<span class="mj-pill high">حرجة</span>':'<span class="mj-pill low">سليمة</span>';}
    else if(f.key==='debt'){disp=(f.val*100).toFixed(0)+'٪';pill=f.fired?'<span class="mj-pill med">مرتفعة</span>':'<span class="mj-pill low">سليمة</span>';}
    else{disp=f.val.toFixed(2);pill=f.fired?'<span class="mj-pill med">ضعيفة</span>':'<span class="mj-pill low">سليمة</span>';}
    rows+=`<tr><td>${f.ar}</td><td class="v">${disp}</td><td>${f.fired?f.msg:'ضمن الحدود الطبيعية.'}</td><td>${pill}</td></tr>`;});
  return `<table class="mj-table"><thead><tr><th>الإشارة</th><th>القيمة</th><th>الدلالة</th><th>الحالة</th></tr></thead><tbody>${rows}</tbody></table>`;
}
