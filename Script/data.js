/* data.js — قراءة/كتابة بيانات الجدول + الإكسل */

// سنوات الجدول من صف العناوين
function tableYears(){
  const table=document.querySelector('.financial-table');
  return Array.from(table.querySelectorAll('thead th')).slice(1)
    .map(th=>parseInt((th.textContent||'').replace(/[^0-9]/g,'')));
}

// قراءة كل الأرقام من الجدول (تعتمد على data-year و data-key)
function readData(){
  const byYear={};
  document.querySelectorAll('.financial-table input.table-input').forEach(inp=>{
    const y=+inp.dataset.year, k=inp.dataset.key;
    (byYear[y]=byYear[y]||{year:y})[k]=cleanNumber(inp.value);
  });
  return Object.values(byYear).sort((a,b)=>a.year-b.year); // تصاعدي
}

function isFilled(col){ return CONFIG.ROW_KEYS.some(k => col[k] != null); }

// تعبئة بيانات تجريبية (تضبط السنوات 2020..2024 ثم تعبّي)
function fillDemo(type){
  const startEl=document.getElementById('start-date'), countEl=document.getElementById('years-count');
  if(startEl) startEl.value=2020;
  if(countEl) countEl.value=5;
  buildTable();
  const set=CONFIG.DEMO[type];
  document.querySelectorAll('.financial-table input.table-input').forEach(inp=>{
    const arr=set[+inp.dataset.year]; if(!arr) return;
    const r=CONFIG.ROW_KEYS.indexOf(inp.dataset.key);
    if(r>=0){ inp.value=arr[r]; inp.classList.remove('invalid'); }
  });
  const nameEl=document.getElementById('company-name'); if(nameEl) nameEl.value=CONFIG.DEMO_NAME[type];
}

/* ---------- تعبئة تجريبية: بنفورد + الإيضاحات ---------- */

// رقم عشوائي المظهر خانته الأولى d — أحجام متنوعة (عشرات → عشرات آلاف)
// الدرجة تعتمد على الخانة الأولى فقط، لذا بقية الخانات حرة تمامًا
function benfordRandomNumber(d){
  const m=Math.random();
  if(m<0.18)      return d*100   + Math.floor(Math.random()*100);    // 3 خانات: 743
  else if(m<0.72) return d*1000  + Math.floor(Math.random()*1000);   // 4 خانات: 7,318
  else if(m<0.94) return d*10000 + Math.floor(Math.random()*10000);  // 5 خانات: 73,187
  else            return d*10    + Math.floor(Math.random()*10);     // خانتان: 73
}

// بناء نص الأرقام من متجه توزيع الخانة الأولى — قيم عشوائية + خلط كامل للترتيب
function benfordDemoText(counts){
  const nums=[];
  for(let d=1;d<=9;d++) for(let i=0;i<counts[d-1];i++) nums.push(benfordRandomNumber(d));
  for(let i=nums.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [nums[i],nums[j]]=[nums[j],nums[i]]; } // خلط فيشر-ييتس
  return nums.map(n=>n.toLocaleString('en-US')).join(', '); // فواصل آلاف داخل الأرقام: 5,016
}

/* تعبئة صندوق بنفورد — تتناوب النسخ مع كل ضغطة:
   السليمة: درجات 0 / 5 / 11 — المريبة: 82 / 91 / 100 */
const BENFORD_DEMO_IDX={clean:0,risky:0};
function fillBenfordDemo(type){
  const ta=document.getElementById('benford-data'); if(!ta) return;
  const versions=CONFIG.BENFORD_DEMO[type];
  const counts=versions[BENFORD_DEMO_IDX[type]%versions.length];
  BENFORD_DEMO_IDX[type]++;
  ta.value=benfordDemoText(counts);
}

// تعبئة صندوق الإيضاحات
function fillNotesDemo(type){
  const ta=document.getElementById('ai-data');
  if(ta) ta.value=CONFIG.DEMO_NOTES[type];
}

// تفريغ الجدول
function resetTable(){
  document.querySelectorAll('.financial-table input.table-input').forEach(i=>{ i.value=''; i.classList.remove('invalid'); });
  clearResults();
}

/* ---------- الإكسل ---------- */
function loadXLSX(){
  return new Promise((res,rej)=>{
    if(window.XLSX) return res(window.XLSX);
    const s=document.createElement('script');
    s.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    s.onload=()=>res(window.XLSX);
    s.onerror=()=>rej(new Error('تعذّر تحميل مكتبة الإكسل — تأكّد من الاتصال بالإنترنت.'));
    document.head.appendChild(s);
  });
}
async function downloadTemplate(){
  try{
    const XLSX=await loadXLSX();
    const years=tableYears();
    const aoa=[['البند',...years]];
    CONFIG.FIELD_AR.forEach(label=>aoa.push([label,...years.map(()=>'')]));
    const ws=XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols']=[{wch:34},...years.map(()=>({wch:12}))];
    const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,'مجهر');
    XLSX.writeFile(wb,'قالب_مجهر.xlsx');
  }catch(e){ alert(e.message); }
}
async function handleExcelFile(file){
  try{
    const XLSX=await loadXLSX();
    const buf=await file.arrayBuffer();
    const wb=XLSX.read(buf,{type:'array'});
    const ws=wb.Sheets[wb.SheetNames[0]];
    const aoa=XLSX.utils.sheet_to_json(ws,{header:1});
    const years=tableYears();
    // الصف r+1 = بند، العمود c+1 = سنة (بعد عمود «البند»)
    CONFIG.ROW_KEYS.forEach((key,r)=>{
      const fileRow=aoa[r+1]||[];
      years.forEach((y,c)=>{
        const raw=fileRow[c+1];
        const v=cleanNumber(raw);
        const inp=document.querySelector(`.financial-table input[data-year="${y}"][data-key="${key}"]`);
        if(inp && v!=null){ inp.value=v; inp.classList.remove('invalid'); }
      });
    });
    const box=document.getElementById('upload-feedback');
    if(box) box.innerHTML='<div class="mj-live ok">✓ تم استيراد بيانات الملف بنجاح. راجع الجدول ثم اضغط «شغّل الفحص».</div>';
  }catch(e){
    const box=document.getElementById('upload-feedback');
    if(box) box.innerHTML=errHTML('تعذّرت قراءة الملف. استخدم القالب الموحّد (xlsx).');
  }
}
