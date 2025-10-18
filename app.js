// ===== 스토리지 유틸 =====
const K={BASIC:'ipicare-basic',GOALS:'ipicare-goals',VITALS:'ipicare-vitals',CONSENT:'ipicare-consent',RECO:'ipicare-reco',PLAN:'ipicare-plan', RECORDS:'ipicare-records'};
const $=s=>document.querySelector(s); const $$=s=>Array.from(document.querySelectorAll(s));
const read=(k,d=null)=>{try{return JSON.parse(localStorage.getItem(k)||(d===null?'null':JSON.stringify(d)));}catch{return d}};
const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));

// ===== 탭 표시/숨김 =====
function setTabsVisible(v){document.querySelector('nav.tabs')?.classList.toggle('hidden',!v)}

// ===== 내비게이션 =====
function navigate(name){
  $$('.view').forEach(v=>v.classList.remove('active')); $('#view-'+name).classList.add('active');
  $$('.tabs button').forEach(b=>b.classList.remove('active')); $('#tab-'+name)?.classList.add('active');
  setTabsVisible(!(name==='intro'||name==='terms'||name==='basic'||name==='survey'||name==='reco-intro'));
  if(name==='home'){renderHome()} if(name==='records'){renderCalendar()} if(name==='reco'){renderReco()} if(name==='plants'){renderPlants()} if(name==='grow'){renderGrow()} if(name==='my'){renderMy()}
  window.scrollTo({top:0,behavior:'smooth'});
}

// ===== 약관 =====
const TERMS={service:`(샘플) 서비스 이용약관 전문을 여기에 넣으세요.`, privacy:`(샘플) 개인정보 수집·이용 동의 전문을 여기에 넣으세요.`};
function openTerms(title,content){$('#overlay').classList.add('show'); const m=$('#modal'); m.style.display='block'; m.innerHTML=`<div class='title'>${title}</div><div class='hint' style='white-space:pre-wrap'>${content}</div><div class='right'><button class='btn acc' onclick='closeModal()'>확인</button></div>`}
function closeModal(){ $('#overlay').classList.remove('show'); $('#modal').style.display='none'; }
function toggleAllAgreements(checked){ $('#agreeService').checked=checked; $('#agreePrivacy').checked=checked; updateTermsNext(); }
function syncAllAgree(){ const all=$('#agreeService').checked && $('#agreePrivacy').checked; $('#agreeAll').checked=all; updateTermsNext(); }
function updateTermsNext(){ $('#btnTermsNext').disabled=!( $('#agreeService').checked && $('#agreePrivacy').checked ); }

// ===== 기본 정보 저장 & 검증 =====
function checkIdDup(){ const id=$('[name="userid"]').value.trim(); const hint=$('#idHint'); if(!id){hint.textContent='아이디를 입력하세요.';return;} const taken=['taken','admin']; if(taken.includes(id.toLowerCase())){hint.textContent='이미 사용 중인 아이디입니다.'; hint.style.color='#dc2626';} else {hint.textContent='사용 가능한 아이디입니다.'; hint.style.color='#16a34a';}}
function clearPwHint(){ $('#pwHint').textContent=''; }
function checkPwMatch(){ const pw=$('[name="pw"]').value; const pw2=$('[name="pw2"]').value; const hint=$('#pwHint'); if(!pw2){hint.textContent='';return;} if(pw===pw2){hint.textContent='비밀번호가 일치합니다.'; hint.style.color='#16a34a';} else {hint.textContent='비밀번호가 일치하지 않습니다.'; hint.style.color='#dc2626';} }
function saveBasic(){ const f=new FormData($('#form-basic')); const req=['userid','pw','pw2','nick','phone','gender','birth','height','weight']; for(const k of req){ if(!(f.get(k)&&String(f.get(k)).trim())){ toast('모든 필수 항목을 입력해주세요'); return; } } if(f.get('pw')!==f.get('pw2')){ toast('비밀번호가 일치하지 않습니다'); return; } save(K.BASIC,Object.fromEntries(f.entries())); toast('기본 정보 저장됨'); navigate('survey'); }

// ===== 설문 저장 → 추천 소개 =====
function saveSurvey(){ const f=new FormData($('#form-survey')); const data={ goals:f.getAll('goals'), habit:f.get('habit')||'', allergies:(f.get('allergies')||'').split(',').map(s=>s.trim()).filter(Boolean), intakes:(f.get('intakes')||'').split(',').map(s=>s.trim()).filter(Boolean) }; save(K.GOALS,data);
  const r=computeReco(); const first=(r.set&&r.set[0])||'basil'; const p=PLANTS[first]; save(K.RECO,{...r,set:[first]});
  $('#recoIntroCard').innerHTML=`<div style='display:flex;gap:12px;align-items:center'><div style='width:72px;height:72px;border-radius:16px;background:#d1fae5;border:1px solid var(--line);'></div><div><div class='badge'>추천 작물</div><div style='font-weight:900;font-size:20px;margin-top:4px'>${p.name}</div><div class='hint'>${p.tips[0]} · ${p.tips[1]}</div></div></div><div class='card pad' style='margin-top:12px'><div class='title-strong'>왜 ${p.name}인가요?</div><div class='hint'>초기 설문 결과를 바탕으로 가장 무난하고 키우기 쉬운 작물을 제안했어요. (데모: 데이터 없으면 바질 기본 추천)</div></div>`;
  navigate('reco-intro'); }

// ===== 추천 로직/데이터 =====
const PLANTS={ basil:{name:'바질',tags:['core'],tips:['밝은 간접광','물 자주 주지 않기','수확은 윗부분부터']}, mint:{name:'민트',tags:['core','digestion','stress'],tips:['반그늘 선호','물을 말리지 않기','정기적인 순지르기']}, lettuce:{name:'상추',tags:['core'],tips:['충분한 광','균일한 수분','15~25°C']}, lemonbalm:{name:'레몬밤',tags:['sleep','stress','calm'],tips:['반그늘','과습 주의','신선 섭취 좋음']}, chamomile:{name:'카모마일',tags:['sleep','calm'],tips:['충분한 일조','배수 좋은 토양','꽃이 피면 수확']}, rosemary:{name:'로즈마리',tags:['focus'],tips:['강한 빛 선호','건조에 강함','가지치기 필요']}, thyme:{name:'타임',tags:['focus','digestion'],tips:['햇볕 좋은 곳','건조 토양','자주 수확']} };
function computeReco(){ const g=read(K.GOALS,{goals:[]}).goals||[]; const score={}; const inc=(k)=>score[k]=(score[k]||0)+1; g.forEach(goal=>{ if(goal==='sleep'){inc('lemonbalm');inc('chamomile')} if(goal==='stress'){inc('lemonbalm');inc('mint')} if(goal==='digestion'){inc('mint');inc('thyme')} if(goal==='focus'){inc('rosemary');inc('thyme')} }); if(!Object.keys(score).length){inc('basil')} const ranked=Object.entries(score).sort((a,b)=>b[1]-a[1]).map(([k])=>k); return {goals:g,set:ranked}; }

function renderHome(){
  const r=read(K.RECO,null); const first=(r?.set&&r.set[0])||'basil'; const p=PLANTS[first];
  $('#heroReco').innerHTML=`<div style='display:flex;align-items:center;gap:12px'><div style='width:64px;height:64px;border-radius:16px;background:#d1fae5;border:1px solid var(--line)'></div><div><div class='badge'>추천 작물</div><div style='font-weight:900;font-size:18px;margin-top:4px'>${p.name}</div><div class='hint'>${p.tips[0]} · ${p.tips[1]}</div></div></div>`;
  const list=(r?.set||['basil']);
  $('#myCrops').innerHTML=list.map(k=>`<div class='item'><div class='meta'><div class='title'>${PLANTS[k].name}</div><div class='sub'>권장: ${PLANTS[k].tips[0]}</div></div><button class='btn' onclick="openCropDetail('${k}')">관리</button></div>`).join('');
}

// ===== 동의/추천/성장 가이드 =====
function getConsent(){ return read(K.CONSENT,{use_health:false,reminder:false}); }
function setConsent(obj){ save(K.CONSENT,{...getConsent(),...obj}); syncConsentsUI(); }
function toggleConsent(key,val){ const v=(typeof val==='boolean')?val:!getConsent()[key]; setConsent({[key]:v}); toast((key==='use_health'?'건강 데이터':'리마인더')+(v?' 동의':' 철회')); if(key==='use_health' && v) renderReco(); }
function syncConsentsUI(){ const c=getConsent(); const el1=$('#ck-use-health'); const el2=$('#ck-remind'); if(el1) el1.checked=!!c.use_health; if(el2) el2.checked=!!c.reminder; }

function renderReco(){
  const r = read(K.RECO,null);
  const first = (r?.set && r.set[0]) || 'basil';
  const p = PLANTS[first];
  const guide = {
    lemonbalm: { pack:'Calm', set:['레몬밤','카모마일'], routine:['아침: 레몬밤 5~7장, 뜨거운 물 200ml 3분 우림','오후: 레몬밤 인퓨즈드 워터 500ml (잎 6장 + 레몬 조각)','저녁: 취침 1시간 전 허브티 1잔'] },
    basil: { pack:'Core', set:['바질','민트','상추'], routine:['점심: 바질 샐러드 (토마토+올리브오일)','간식: 민트 워터로 수분 보충','주 1회: 겉잎부터 수확, 순지르기'] },
    mint: { pack:'Core', set:['민트','바질','상추'], routine:['오전: 인퓨즈드 워터','식후: 민트 3~4장 씹기','주기: 2주마다 가지치기'] }
  };
  const g = guide[first] || guide.basil;
  const html = `<div style="display:flex;align-items:center;gap:12px"><div style="width:56px;height:56px;border-radius:14px;background:#d1fae5;border:1px solid var(--line)"></div><div><div class="badge">추천 작물</div><div style="font-weight:900;font-size:18px;margin-top:4px">${p.name}</div><div class="hint">${p.tips[0]} · ${p.tips[1]}</div></div></div><div style="margin-top:10px"><b>추천 세트:</b> ${g.pack} (${g.set.join(', ')})</div><div style="margin-top:6px"><b>재배·섭취 루틴:</b><ul style="margin:6px 0 0 18px">${g.routine.map(x=>`<li>${x}</li>`).join('')}</ul></div>`;
  const host = $('#recoDetail'); if(host) host.innerHTML = html;
}
function renderPlants(){ const r=read(K.RECO,null); const list=(r?.set||['basil']); $('#plantList').innerHTML=list.map(k=>{const p=PLANTS[k]; return `<div class='card pad'><div class='row-between'><div class='title-strong'>${p.name}</div><span class='badge'>${p.tags.join(' · ')}</span></div><ul style='margin:8px 0 0 18px;color:#4b5563'>${p.tips.map(t=>`<li>${t}</li>`).join('')}</ul></div>`;}).join(''); }
function renderGrow(){ const r=read(K.RECO,null); const list=(r?.set||['basil']); const tips=list.map(k=>({name:PLANTS[k].name,guide:['빛: 하루 6~8시간','급수: 지표면이 마를 때','온도: 18~24°C 유지','수확: 상단/겉잎부터']})); $('#growTips').innerHTML=tips.map(x=>`<div class='card pad'><div class='title-strong'>${x.name}</div><ul style='margin:8px 0 0 18px;color:#4b5563'>${x.guide.map(t=>`<li>${t}</li>`).join('')}</ul></div>`).join(''); }

// ===== 캘린더 기록 =====
let calRef=new Date();
const FIELDS=[{k:'weight',label:'몸무게(kg)',type:'number',step:'0.1'},{k:'steps',label:'걸음수',type:'number'},{k:'strength',label:'근력운동(분)',type:'number'},{k:'hr',label:'심박수(bpm)',type:'number'},{k:'glucose',label:'혈당(mg/dL)',type:'number'},{k:'bpSys',label:'혈압 수축',type:'number'},{k:'bpDia',label:'혈압 이완',type:'number'},{k:'water',label:'물 섭취(ml)',type:'number'},{k:'condition',label:'컨디션(메모)',type:'text'}];
function getRecords(){ return read(K.RECORDS,{}); } function setRecords(o){ save(K.RECORDS,o); }
function renderCalendar(){ const title=$('#calTitle'); const grid=$('#calGrid'); const base=new Date(calRef.getFullYear(),calRef.getMonth(),1); const firstDow=(base.getDay()+6)%7;
  title.textContent=`${base.getFullYear()}-${String(base.getMonth()+1).padStart(2,'0')}`; grid.innerHTML=''; const days=new Date(base.getFullYear(),base.getMonth()+1,0).getDate(); for(let i=0;i<firstDow;i++){ grid.appendChild(document.createElement('div')); }
  const recs=getRecords();
  for(let d=1; d<=days; d++){ const date=`${base.getFullYear()}-${String(base.getMonth()+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`; const cell=document.createElement('div'); cell.className='day'; const note=recs[date]? Object.keys(recs[date]).slice(0,2).map(k=>FIELDS.find(f=>f.k===k)?.label.split('(')[0]).join(', ') : ''; cell.innerHTML=`<div class='d'>${d}</div>${note?`<div class='note'>${note}…</div>`:''}`; cell.onclick=()=>openRecordModal(date); grid.appendChild(cell);} }
function prevMonth(){ calRef.setMonth(calRef.getMonth()-1); renderCalendar(); }
function nextMonth(){ calRef.setMonth(calRef.getMonth()+1); renderCalendar(); }
function openRecordModal(date){ const ov=$('#recOverlay'); const m=$('#recModal'); ov.classList.add('show'); m.style.display='block'; const rec=getRecords()[date]||{}; m.innerHTML=`<div class='title'>${date} 기록하기</div>${FIELDS.map(f=>`<label>${f.label}<input id='f-${f.k}' type='${f.type}' ${f.step?`step='${f.step}'`:''} value='${rec[f.k]??''}'></label>`).join('')}<div class='right'><button class='btn ghost' onclick='closeRecModal()'>취소</button><button class='btn acc' onclick="saveDay('${date}')">저장하기</button></div>`; }
function closeRecModal(){ $('#recOverlay').classList.remove('show'); $('#recModal').style.display='none'; }
function saveDay(date){ const rec=getRecords(); rec[date]=rec[date]||{}; FIELDS.forEach(f=>{ const v=$(`#f-${f.k}`).value; if(v!==''&&v!=null){ rec[date][f.k]= (f.type==='number')? Number(v): v; } }); if(rec[date].weight){ const h=parseFloat(read(K.BASIC,{}).height||read(K.VITALS,{}).height); if(h){ rec[date].bmi= Math.round((rec[date].weight/Math.pow(h/100,2))*10)/10; } } setRecords(rec); closeRecModal(); renderCalendar(); toast('저장됨'); }

// ===== 설치/오프라인 =====
let deferredPrompt; window.addEventListener('beforeinstallprompt',(e)=>{e.preventDefault();deferredPrompt=e;$('#installBtn').hidden=false}); $('#installBtn')?.addEventListener('click',async()=>{if(!deferredPrompt) return; deferredPrompt.prompt(); const {outcome}=await deferredPrompt.userChoice; if(outcome==='accepted') toast('설치 진행…'); deferredPrompt=null; $('#installBtn').hidden=true;});
function updateOfflineBadge(){ $('#offlineBadge').hidden=navigator.onLine; } addEventListener('online',updateOfflineBadge); addEventListener('offline',updateOfflineBadge); updateOfflineBadge();

// ===== 작물 상세 로직 =====
let currentCrop = null; const CROPKEY='ipicare-crop-';
function openCropDetail(k){ currentCrop=k; renderCropDetail(); navigate('crop-detail'); }
function getCrop(){ return read(CROPKEY+currentCrop,{meta:{},logs:[]}); }
function setCrop(v){ save(CROPKEY+currentCrop,v); }
function renderCropDetail(){ const p=PLANTS[currentCrop]; const data=getCrop(); $('#cropHeader').innerHTML=`<div style='display:flex;align-items:center;gap:12px'><div style='width:56px;height:56px;border-radius:14px;background:#e5f5ec;border:1px solid var(--line)'></div><div><div class='badge'>${p.tags.join(' · ')}</div><div style='font-weight:900;font-size:18px'>${p.name} 관리</div></div></div>`; $('#shipDate').value=data.meta.shipDate||''; $('#plantDate').value=data.meta.plantDate||''; renderLogs(); }
function saveCropMeta(){ const d=getCrop(); d.meta.shipDate=$('#shipDate').value; d.meta.plantDate=$('#plantDate').value; setCrop(d); toast('저장됨'); }
function renderLogs(){ const host=$('#cropLogs'); const d=getCrop(); if(!host) return; host.innerHTML=(d.logs||[]).map((x,i)=>`<div class='item'><div class='meta'><div class='title'>${x.date} · ${x.action}</div><div class='sub'>${x.note||''}</div></div><button class='btn' onclick='delLog(${i})'>삭제</button></div>`).join('')||'<div class="hint">아직 로그가 없습니다.</div>'; }
function delLog(i){ const d=getCrop(); d.logs.splice(i,1); setCrop(d); renderLogs(); }
function openLogModal(){ $('#overlay').classList.add('show'); const m=$('#modal'); m.style.display='block'; m.innerHTML=`<div class='title'>관리 로그 추가</div><label>날짜<input type='date' id='logDate' value='${new Date().toISOString().slice(0,10)}'></label><label>작업<select id='logAction'><option>급수</option><option>영양제</option><option>수확</option><option>가지치기</option><option>기타</option></select></label><label>메모<input id='logNote' placeholder='간단 메모'></label><div class='right'><button class='btn ghost' onclick='closeModal()'>취소</button><button class='btn acc' onclick='saveLog()'>저장</button></div>`; }
function saveLog(){ const d=getCrop(); d.logs=d.logs||[]; d.logs.unshift({date:$('#logDate').value, action:$('#logAction').value, note:$('#logNote').value}); setCrop(d); closeModal(); renderLogs(); toast('추가됨'); }

// ===== 마이 =====
function renderMy(){ const b=read(K.BASIC,{}); $('#myNick').textContent=b.nick||'닉네임'; syncConsentsUI(); }

// ===== 알림/내보내기 유틸 =====
async function reqNotifyPerm(){
  try{
    if(!('Notification' in window)) { toast('알림 미지원 브라우저'); return; }
    const perm = await Notification.requestPermission();
    toast(perm==='granted' ? '알림 허용됨' : '알림 거부됨');
  }catch(e){ console.warn('notify perm error', e); }
}
function demoSchedule(){
  if(!('Notification' in window) || Notification.permission!=='granted'){ toast('알림 권한을 허용해주세요'); return; }
  setTimeout(()=> new Notification('IpiCare', { body:'교체/수확 시점 알림 (데모)' }), 3000);
  toast('3초 뒤 알림을 전송합니다');
}
function exportData(){
  const dump = { basic: read(K.BASIC,{}), goals: read(K.GOALS,{}), reco: read(K.RECO,{}), records: read(K.RECORDS,{}), consent: read(K.CONSENT,{}) };
  const blob = new Blob([JSON.stringify(dump,null,2)], {type:'application/json'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'ipicare-export.json'; a.click(); URL.revokeObjectURL(a.href);
  toast('데이터 내보내기 완료');
}

// ===== Service Worker 등록 =====
(function registerSW(){
  if ('serviceWorker' in navigator) {
    const isFile = location.protocol === 'file:';
    if (isFile) { console.warn('file:// 로 열면 SW가 동작하지 않아요. 서버(HTTPS)에 올려 테스트하세요.'); return; }
    const swUrl = new URL('service-worker.js', location.href).toString();
    window.addEventListener('load', ()=>{
      navigator.serviceWorker.register(swUrl)
        .then(reg=>{ console.log('[SW] registered', reg.scope); })
        .catch(err=>{ console.warn('[SW] register failed', err); });
    });
  } else {
    console.warn('Service Worker 미지원 환경');
  }
})();

// ===== 초기화 & 스모크 테스트 =====
(function init(){
  setTabsVisible(false);
  renderCalendar();
  runSmokeTests();
})();

function toast(msg){ const t=$('#toast'); t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),1600) }

function runSmokeTests(){
  console.group('IpiCare smoke tests');
  try{
    save('__test__',{x:1});
    console.assert(read('__test__').x===1,'localStorage save/read failed');
    ['intro','terms','basic','survey','reco-intro','home','records','reco','plants','grow','recipes','my','crop-detail'].forEach(id=>{
      console.assert(document.getElementById('view-'+id),'missing view-'+id);
    });
    const m = document.querySelector('link[rel="manifest"]');
    console.assert(!!m,'manifest link missing');
    console.assert('serviceWorker' in navigator,'SW unsupported in this environment');
    console.log('All basic assertions passed.');
  }catch(e){
    console.error('Smoke test failure:',e);
  }finally{ console.groupEnd(); }
}
