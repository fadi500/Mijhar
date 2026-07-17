/* validation.js — التحقّق من صحة البيانات قبل الحساب */
function validate(cols){
  const errs = [];
  cols.forEach(y => {
    CONFIG.ROW_KEYS.forEach((k, i) => { if(y[k]==null || isNaN(y[k])) errs.push(`سنة ${y.year}: «${CONFIG.FIELD_AR[i]}» فارغ أو غير رقمي.`); });
    if(y.revenue!=null && y.revenue < 0) errs.push(`سنة ${y.year}: الإيرادات لا يمكن أن تكون سالبة.`);
    if(y.totalAssets!=null && y.totalAssets <= 0) errs.push(`سنة ${y.year}: إجمالي الأصول يجب أن يكون أكبر من صفر.`);
    if([y.currentLiab,y.nonCurrentLiab,y.equity,y.totalAssets].every(v => v!=null)){
      const rhs = y.currentLiab + y.nonCurrentLiab + y.equity;
      if(Math.abs(y.totalAssets - rhs)/Math.abs(y.totalAssets||1) > 0.01)
        errs.push(`سنة ${y.year}: الميزانية غير متوازنة (الأصول ≠ الخصوم + حقوق الملكية).`);
    }
  });
  return errs;
}
