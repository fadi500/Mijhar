/* beneish.js — مؤشرات بينيش + الإشارات الحمراء + الدرجة المركّبة */


/*---------------------------------دالة تحسب مؤشرات بينيش الثمانيه----------------------*/
function calculateBeneish(currentYear, previousYear){

/*اذا البارامتر مكتوب وبعده نقطه يقصد المتغير الموجود داخل الاوبجكت*/

  const GM = y => (y.revenue - y.cogs)/y.revenue;/* (داله) GM = grossMargin = هامش الربح الاجمالي*/

  const lev = y => (y.currentLiab + y.nonCurrentLiab)/y.totalAssets;/*(داله) lev = leverageRatio = الرافعة المالية*/
  
  const dr = y => y.depreciation/(y.depreciation + y.ppe);/*(داله) dr = depreciationRate = الاهلاك*/ 

  const DSRI=(currentYear.receivables/currentYear.revenue)/(previousYear.receivables/previousYear.revenue);
  const GMI=GM(previousYear)/GM(currentYear);
  const AQI=(1-(currentYear.currentAssets+currentYear.ppe)/currentYear.totalAssets)/(1-(previousYear.currentAssets+previousYear.ppe)/previousYear.totalAssets);
  const SGI=currentYear.revenue/previousYear.revenue;
  const DEPI=dr(previousYear)/dr(currentYear);
  const SGAI=(currentYear.sga/currentYear.revenue)/(previousYear.sga/previousYear.revenue);
  const LVGI=lev(currentYear)/lev(previousYear);
  const TATA=(currentYear.netIncome-currentYear.ocf)/currentYear.totalAssets;
  const M=-4.84+0.920*DSRI+0.528*GMI+0.404*AQI+0.892*SGI+0.115*DEPI-0.172*SGAI+4.679*TATA-0.327*LVGI;
  return {DSRI,GMI,AQI,SGI,DEPI,SGAI,LVGI,TATA,M};
}



/*---------------------------------(تحتاج تعديل) تحويل M-Score إلى درجة 0..100 (العتبة -1.78 = 50)----------------------*/
function mScoreToScore(M){
  let s;
  if(M>=-1.78){
    s=50+((M+1.78)/(1.0+1.78))*50}
      else{
         s=50*((M+3.5)/(-1.78+3.5))};

  return clamp(s,0,100);
}



/*--------------------------------- الإشارات الحمراء الثلاث-----------------------*/
function calculateRedFlags(yearData){

  const flags=[]; let points=0, override=false;

  const totalLiab=yearData.currentLiab+yearData.nonCurrentLiab;  /*إجمالي الالتزامات*/
  const liq=yearData.currentAssets/yearData.currentLiab;  /*حساب السيولة */  
  flags.push({key:'liq',ar:'السيولة الجارية',val:liq,fired:liq<1,sev:'medium',pts:30,msg:'الأصول المتداولة أقل من الالتزامات قصيرة الأجل — صعوبة محتملة في السداد العاجل.'});

  const debt=totalLiab/yearData.totalAssets;  /*نسبة الديون*/     
  flags.push({key:'debt',ar:'نسبة الديون',val:debt,fired:debt>0.70,sev:'medium',pts:30,msg:'أكثر من 70٪ من الأصول مموّلة بالديون — اعتماد مرتفع على الاقتراض.'});

  const eq=yearData.totalAssets-totalLiab;  /*حقوق الملكية */   
  flags.push({key:'neg',ar:'حقوق الملكية',val:eq,fired:eq<0,sev:'high',pts:40,msg:'خصوم الشركة تفوق أصولها — وضع خطير قريب من الإفلاس.'});

  flags.forEach(value=>{
    if(value.fired){
      points+=value.pts; /*يضيف نقاط العلامة الحمراء لاجمالي النقاط*/
       if(value.sev==='high') override=true;}
      });

  return {score:Math.min(points,100),flags,override};
}



/*---------------------------------الدرجة المركّبة — الأوزان تتغيّر حسب توفّر بنفورد-----------------------*/
function calculateRisk(cur, prev){
  const beneish=calculateBeneish(cur,prev), bScore=mScoreToScore(beneish.M), rf=calculateRedFlags(cur);

  let w;
    if (STATE.benford.used) {
      w = CONFIG.WEIGHTS.withBenford;

    } else {
      w = CONFIG.WEIGHTS.without;
  }

  let risk =
    bScore * w.beneish +
    rf.score * w.red +
    (
        STATE.benford.used
        ? STATE.benford.score * w.benford
        : 0
    );

  const override = rf.override || beneish.M > -1.4;

  /* عند وجود تجاوز حرج (حقوق ملكية سالبة، أو M-Score عميق بمنطقة التلاعب)،
     التصنيف يصير "عالٍ" — لازم الرقم المعروض ينسجم مع هذا فعليًا،
     لا يبقى منخفضًا (زي 37) وتُلصَق عليه تسمية "خطر عالٍ" بدون مبرر رقمي واضح للمستخدم.
     Math.max يضمن حدًا أدنى فقط: لو الحساب الطبيعي أعلى أصلًا، ما نخفّضه. */
  if (override) {
    risk = Math.max(risk, 78);
  }

 let level;

  if (override || risk >= 67) {
      level = "high";
  }
  else if (risk >= 34) {
      level = "medium";
  }
  else {
      level = "low";
  }

  return {
    beneish,
    bScore,
    rf,
    risk: Math.round(risk),
    level,
    override,
    weights: w
};

}
