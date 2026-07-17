/* utils.js — أدوات مساعدة عامة */

// تنظيف رقم: يشيل الفواصل والمسافات ويحوّل الأرقام العربية لإنجليزية
function cleanNumber(value){
  if(value==null) return null;
  let v = value.toString().replace(/[,٬\s]/g,'').replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
  if(v==='') return null;
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}

// استخراج الخانة الأولى من رقم (لبنفورد)
function firstDigit(n){ let x=Math.abs(n); if(!isFinite(x)||x===0) return null; while(x<1)x*=10; while(x>=10)x/=10; return Math.floor(x); }

// حماية النص من رموز HTML
function escapeHtml(s){ return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

// إنشاء (أو إرجاع) عنصر نتيجة بعد عنصر معيّن
function ensureAfter(targetElement,id){ let el=document.getElementById(id); if(!el){el=document.createElement('div');el.id=id;el.style.marginTop='1rem';targetElement.insertAdjacentElement('afterend',el);} return el; }

// ربط زر بدالة
function bind(sel, fn){ const el=document.querySelector(sel); if(el) el.addEventListener('click', fn); }

// حصر رقم بين حدّين
function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }

// هل وضع الصفحة الحالي فاتح؟ (يُستخدم لاختيار ألوان الرسوم البيانية المناسبة)
function isLightTheme(){
  return document.documentElement.dataset.theme==='light';
}
