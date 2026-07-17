/* charts.js — الرسوم البيانية (SVG) — تتكيّف ألوانها مع الوضع الداكن/الفاتح */

/* مقياس دائري (Gauge) لدرجة الخطر — يحل محل الرقم المجرّد */
function scoreGauge(value, color){
  const light=isLightTheme();
  const track = light ? 'rgba(20,22,31,.10)' : 'rgba(245,246,250,.12)';
  const size=132, stroke=11, r=(size-stroke)/2, c=2*Math.PI*r;
  const pct=Math.max(0,Math.min(100,value));
  const dash=(pct/100)*c;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" class="mj-gauge" role="img" aria-label="درجة الخطر ${pct} من 100">
    <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${track}" stroke-width="${stroke}"/>
    <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}"
      stroke-linecap="round" stroke-dasharray="${dash.toFixed(1)} ${c.toFixed(1)}"
      transform="rotate(-90 ${size/2} ${size/2})"/>
  </svg>`;
}

/* خط درجة الخطر عبر السنوات */
function svgChart(series){
  const light=isLightTheme();
  const gridLine = light ? 'rgba(20,22,31,.12)'  : 'rgba(255,255,255,.08)';
  const axisText = light ? 'rgba(20,22,31,.55)'  : 'rgba(245,246,250,.45)';
  const yearText = light ? 'rgba(20,22,31,.8)'   : 'rgba(245,246,250,.75)';
  const lineGold = light ? '#9C6E1F' : '#F2B84B';
  const dotStroke= light ? '#FFFFFF' : '#0A0C12';

  const W=720,H=300,l=44,r=20,t=24,b=44, pw=W-l-r, ph=H-t-b;
  const X=i=> series.length===1 ? l+pw/2 : l+i*pw/(series.length-1);
  const Y=v=> t+ph*(1-v/100);
  let g='';
  [0,33,67,100].forEach(v=>{
    const y=Y(v);
    g+=`<line x1="${l}" y1="${y}" x2="${W-r}" y2="${y}" stroke="${gridLine}" stroke-width="1"/>`;
    g+=`<text x="${l-8}" y="${y+4}" font-size="11" fill="${axisText}" text-anchor="end">${v}٪</text>`;
  });
  g+=`<line x1="${l}" y1="${Y(67)}" x2="${W-r}" y2="${Y(67)}" stroke="#F87171" stroke-width="1.5" stroke-dasharray="6 5" opacity="0.6"/>`;
  const pts=series.map((s,i)=>`${X(i)},${Y(s.risk)}`).join(' ');
  if(series.length>1) g+=`<polygon points="${X(0)},${Y(0)} ${pts} ${X(series.length-1)},${Y(0)}" fill="${lineGold}" opacity="0.08"/>`;
  if(series.length>1) g+=`<polyline points="${pts}" fill="none" stroke="${lineGold}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
  series.forEach((s,i)=>{
    const c=CONFIG.LV[s.level].col, x=X(i), y=Y(s.risk);
    g+=`<circle cx="${x}" cy="${y}" r="6" fill="${c}" stroke="${dotStroke}" stroke-width="2.5"/>`;
    g+=`<text x="${x}" y="${y-12}" font-size="12" font-weight="700" fill="${c}" text-anchor="middle" font-family="'JetBrains Mono',monospace">${s.risk}٪</text>`;
    g+=`<text x="${x}" y="${H-16}" font-size="12" fill="${yearText}" text-anchor="middle" font-family="Cairo,sans-serif">${s.year}</text>`;
  });
  return `<svg viewBox="0 0 ${W} ${H}" class="mj-svg" role="img" aria-label="درجة الخطر عبر السنوات">${g}</svg>`;
}

// رسم بنفورد: عمودان لكل خانة (المتوقّع مقابل المُدخل)
function benfordChart(actual){
  const light=isLightTheme();
  const gridLine = light ? 'rgba(20,22,31,.12)' : 'rgba(255,255,255,.08)';
  const axisText = light ? 'rgba(20,22,31,.55)' : 'rgba(245,246,250,.45)';
  const yearText = light ? 'rgba(20,22,31,.8)'  : 'rgba(245,246,250,.75)';
  const expBar   = light ? 'rgba(20,22,31,.22)' : 'rgba(245,246,250,.28)';
  const actBar   = light ? '#9C6E1F' : '#F2B84B';

  const exp=CONFIG.BENFORD_EXP;
  const W=720,H=300,l=40,r=16,t=20,b=42, pw=W-l-r, ph=H-t-b;
  const maxV=Math.max(35, Math.ceil(Math.max(...actual, ...exp)/5)*5);
  const Y=v=> t+ph*(1-v/maxV);
  const groupW=pw/9, barW=groupW*0.32;
  let g='';
  for(let v=0; v<=maxV; v+=10){ const y=Y(v);
    g+=`<line x1="${l}" y1="${y}" x2="${W-r}" y2="${y}" stroke="${gridLine}" stroke-width="1"/>`;
    g+=`<text x="${l-6}" y="${y+4}" font-size="10" fill="${axisText}" text-anchor="end">${v}٪</text>`;
  }
  for(let d=1; d<=9; d++){
    const cx=l+groupW*(d-1)+groupW/2, e=exp[d-1], a=actual[d-1];
    const base=t+ph;
    const xE=cx-barW-2, xA=cx+2;
    g+=`<rect x="${xE}" y="${Y(e)}" width="${barW}" height="${base-Y(e)}" fill="${expBar}" rx="2"/>`;
    g+=`<rect x="${xA}" y="${Y(a)}" width="${barW}" height="${base-Y(a)}" fill="${actBar}" rx="2"/>`;
    g+=`<text x="${cx}" y="${H-14}" font-size="12" fill="${yearText}" text-anchor="middle" font-family="Cairo,sans-serif">${d}</text>`;
  }
  return `<svg viewBox="0 0 ${W} ${H}" class="mj-svg" role="img" aria-label="توزيع بنفورد">${g}</svg>`;
}
