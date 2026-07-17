/* ---------------benford.js — تحليل قانون بنفورد ---------------*/

function runBenford(){
  const binfordTextArea=document.getElementById('benford-data');
  const out=ensureAfter(binfordTextArea.closest('.analysis-controls')||binfordTextArea.parentElement,'mj-benford-out');
  const raw=(binfordTextArea.value||'').replace(/(\d),(?=\d{3}(\D|$))/g,'$1'); /*أزل فواصل الآلاف داخل الأرقام (5,016 → 5016) قبل التقسيم*/
  const nums=raw.split(/[\s,،\n\r\t;]+/).map(cleanNumber).filter(v=>v!=null&&isFinite(v)); /*تفصل الارقام بالفواصل الخ... وتنظف الفواصل في الارقام الكبيره*/
  const counts=Array(10).fill(0); let total=0; /*عداد لعدد مرات ظهور كل رقم أول من 1 إلى9.*/

  nums.forEach(v=>{const d=firstDigit(v); if(d>=1&&d<=9){counts[d]++;total++;}});

  if(total<CONFIG.BENFORD_MIN){
    STATE.benford={used:false,score:0,band:null,mad:0,chi2:0,total};
    out.innerHTML=errHTML(`عدد الأرقام (${total}) غير كافٍ. المطلوب ${CONFIG.BENFORD_MIN} رقمًا على الأقل.`);
    return;
  }

  let mad=0;   /*متوسط الانحراف المطلق — يقيس "حجم" الانحراف بغض النظر عن حجم العيّنة*/
  let chi2=0;  /*إحصائية مربع كاي — تقيس هل الانحراف "دالّ إحصائيًا" آخذةً حجم العيّنة بالحسبان*/
  const actual=[];

  for(let d=1;d<=9;d++){
    const p=counts[d]/total*100; actual.push(p);
    mad+=Math.abs(p/100-CONFIG.BENFORD_EXP[d-1]/100);

    const expectedCount=total*CONFIG.BENFORD_EXP[d-1]/100;
    chi2+=Math.pow(counts[d]-expectedCount,2)/expectedCount;
  }
  mad/=9;

  /* لماذا مربع كاي بجانب MAD؟
     MAD وحدها تستخدم حدودًا ثابتة (0.006/0.012/0.015) بغض النظر عن عدد الأرقام،
     فتحكم بتشدد زائف على العيّنات الصغيرة (300-500 رقم) رغم أنها قد تكون مطابقة تمامًا،
     لأن التذبذب العشوائي الطبيعي فيها أكبر. مربع كاي (بدرجة حرية 8) يراعي حجم العيّنة
     ضمن الحساب نفسه، فيبقى معدّل الإنذار الكاذب ثابتًا (~5٪) بغض النظر عن N. */
  const CHI2_CRIT_05=15.507, CHI2_CRIT_01=20.090; /* القيم الحرجة القياسية لمربع كاي بدرجة حرية 8 */

  let band;
  if(chi2>=CHI2_CRIT_01)      band={ar:'غير مطابِقة', lv:'high'};
  else if(chi2>=CHI2_CRIT_05) band={ar:'حدّية',        lv:'medium'};
  else                         band={ar: mad<0.006 ? 'مطابقة قريبة' : 'مقبولة', lv:'low'};

  const score=clamp((chi2-8)/20*100, 0, 100); /*8 = متوسط مربع كاي المتوقّع تحت الافتراض الصفري (لا تلاعب)*/

  STATE.benford={used:true, score, band:band.ar, mad, chi2, total}; /*خزّن الحالة لتُستخدم في الدرجة المركّبة*/

  const light=typeof isLightTheme==='function' && isLightTheme();
  const expColor = light ? 'rgba(20,22,31,.28)' : 'rgba(245,246,250,.32)';
  const actColor = light ? '#9C6E1F' : '#F2B84B';
  const confidence = total>=1000 ? 'عالية' : total>=500 ? 'متوسطة' : 'محدودة — العيّنة قريبة من الحد الأدنى';

  const L=CONFIG.LV[band.lv];
  out.innerHTML=`
    <div class="mj-benford-band" style="background:${L.bg};color:${L.col}">
      التوزيع: ${band.ar} · χ²=${chi2.toFixed(2)} · MAD=${mad.toFixed(4)} · ${total} رقم · درجة بنفورد ${Math.round(score)}/100
    </div>
    <div class="mj-chartbox">
      ${benfordChart(actual)}
      <div class="mj-legend">
        <span><i style="background:${expColor}"></i>التوزيع المتوقّع (بنفورد)</span>
        <span><i style="background:${actColor}"></i>الأرقام المُدخلة</span>
      </div>
    </div>
    <p class="mj-note">موثوقية النتيجة إحصائيًا: <b>${confidence}</b> (تعتمد على حجم العيّنة). سيُدمج تحليل بنفورد في الدرجة المركّبة بوزن ١٥٪ عند الضغط على «شغّل الفحص».</p>`;
}

