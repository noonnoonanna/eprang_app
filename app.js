
// ===== FREE PAGES (no login required up to subscribe start) =====
window.FREE_PAGES = (function(prev){
  if (prev && typeof prev.has==='function') return prev;
  return new Set(['intro','login','terms','basic','survey','reco-intro','reco','subscribe']);
})(window.FREE_PAGES);

// ===== Keys & Utils =====
const K={BASIC:'ipicare-basic',GOALS:'ipicare-goals',VITALS:'ipicare-vitals',CONSENT:'ipicare-consent',RECO:'ipicare-reco',PLAN:'ipicare-plan',RECORDS:'ipicare-records',RECIPES:'ipicare-recipes',CONSENT_LOG:'ipicare-consent-log',SURVEY_LOG:'ipicare-survey-log'};
const $=s=>document.querySelector(s); const $$=s=>Array.from(document.querySelectorAll(s));
const read=(k,d=null)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):(d===null?null:d);}catch{return d}};
const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function toast(msg){ try{ const t=$('#toast'); if(!t) { console.log('[toast]', msg); return; } t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),1600);}catch(e){ console.log('[toast]', msg);}}

// ===== Auth =====
const KA={AUTH:'AUTH'};
function setAuth(a){ localStorage.setItem(KA.AUTH, JSON.stringify(a)); }
function getAuth(){ try { return JSON.parse(localStorage.getItem(KA.AUTH)); } catch { return null; } }
function isLoggedIn(){ return !!(getAuth()?.loggedIn); }

// ===== Pack mapping =====
const PACK_PLANTS={ Core:['basil','mint','lettuce'], Calm:['lemonbalm','chamomile'], Focus:['rosemary','thyme'] };
const PACK_LABEL={ Core:'Core', Calm:'Calm', Focus:'Focus' };
function packBullets(pack){ const list = PACK_PLANTS[pack]||[]; const names = list.map(k => PLANTS[k]?.name || k); return names.join(', '); }

// ===== Plan helpers =====
function getPlan(){
  const p = read(K.PLAN, null);
  if (!p) return null;
  try{
    if (p.status==='trial' && p.trialEndsAt && new Date(p.trialEndsAt) <= new Date()){
      p.status='active'; p.convertedAt = new Date().toISOString(); save(K.PLAN,p);
    }
  }catch(e){}
  return read(K.PLAN, null);
}
function setPlan(v){ save(K.PLAN, v); }
function isSubscribed(){ const p=getPlan(); return !!p && (p.status==='active' || p.status==='trial'); }

// ===== Consent =====
function getConsent(){ return read(K.CONSENT,{use_health:false,reminder:false}); }
function setConsent(obj){
  const prev = getConsent(); const next = {...prev, ...obj};
  save(K.CONSENT,next);
  const now = new Date().toISOString();
  const key = Object.keys(obj)[0]; const val = obj[key];
  const log = read(K.CONSENT_LOG, []);
  log.push({ key, value: !!val, at: now });
  save(K.CONSENT_LOG, log);
  syncConsentsUI();
}
function toggleConsent(key,val){ const v=(typeof val==='boolean')?val:!getConsent()[key]; setConsent({[key]:v}); toast((key==='use_health'?'건강 데이터':'리마인더')+(v?' 동의':' 철회')); if(key==='use_health' && v) renderRecoV2(); }
function syncConsentsUI(){ const c=getConsent(); const el1=$('#ck-use-health'); const el2=$('#ck-remind'); if(el1) el1.checked=!!c.use_health; if(el2) el2.checked=!!c.reminder; }

// ===== Global nav ctx =====
const NAV_CTX={ surveyMode:'onboard' }; // 'onboard' | 'reeval'
function startReevalSurvey(){ NAV_CTX.surveyMode='reeval'; navigate('survey'); }
function startOnboardingSurvey(){ NAV_CTX.surveyMode='onboard'; navigate('survey'); }

// ===== Navigation (SPA+MPA) & Tabs =====
function setTabsVisible(v){ const n=document.querySelector('nav.tabs'); if(n) n.classList.toggle('hidden',!v); }
function navigate(name){
  try{
    var page=(name||'').toLowerCase();
    // Feature gates (not session gates)
    if (page==='records' && !getConsent().use_health){ if (typeof openConsentPrompt==='function') openConsentPrompt(); return; }
    if (['grow','recipes','crop-detail'].includes(page) && !isSubscribed()){ if (typeof openSubPrompt==='function') openSubPrompt(page); return; }

    // SPA section switch if available
    var target=document.getElementById('view-'+page);
    if(target){
      document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
      target.classList.add('active');
      document.querySelectorAll('.tabs button').forEach(b=>b.classList.remove('active'));
      var tab=document.getElementById('tab-'+page); if(tab) tab.classList.add('active');
      const alwaysHide=['intro','terms','basic','survey','reco-intro','login','subscribe'];
      setTabsVisible(!alwaysHide.includes(page));
      if (page==='home'   && typeof renderHome==='function') renderHome();
      if (page==='records'&& typeof renderCalendar==='function') renderCalendar();
      if (page==='reco'   && typeof renderRecoV2==='function') renderRecoV2();
      if (page==='plants' && typeof renderPlants==='function') renderPlants();
      if (page==='grow'   && typeof renderGrow==='function') renderGrow();
      if (page==='my'     && typeof renderMy==='function') renderMy();
      if (page==='subscribe' && typeof renderSubscribe==='function'){ const p=inferPackFromReco(); renderSubscribe(p); }
      window.scrollTo({top:0,behavior:'smooth'});
      return;
    }
    // MPA: real page navigation (back button works)
    var url=/\.html$/i.test(page)?page:(page+'.html'); if(url==='index.html') url='intro.html';
    window.location.assign(url);
  }catch(e){
    console.warn('[navigate] fallback', e);
    var url2=/\.html$/i.test(name)?name:(name+'.html'); window.location.assign(url2);
  }
}

// ===== Login/Signup =====
function handleLogin(e){
  e.preventDefault();
  const id=e.target.userid.value.trim(); const pw=e.target.password.value.trim();
  if(!id||!pw){ toast('아이디/비밀번호를 입력하세요'); return; }
  const basic=read(K.BASIC,null);
  if(basic && basic.userid===id && basic.pw===pw){
    setAuth({loggedIn:true,userId:id,nick:basic.nick}); toast(`${basic.nick||id}님 환영합니다!`); setTabsVisible(true); navigate('home');
  } else { toast('아이디 또는 비밀번호가 올바르지 않습니다'); }
}
const TERMS={service:`서비스 이용약관 전문을 여기에 넣으세요.`, privacy:`개인정보 수집·이용 동의 전문을 여기에 넣으세요.`};
function openTerms(title,content){ const ov=$('#overlay'); const m=$('#modal'); if(!m||!ov) return; ov.classList.add('show'); m.style.display='block'; m.innerHTML=`<div class='title'>${title}</div><div class='hint' style='white-space:pre-wrap'>${content}</div><div class='right'><button class='btn acc' onclick='closeModal()'>확인</button></div>`; }
function closeModal(){ const ov=$('#overlay'); const m=$('#modal'); if(!m||!ov) return; ov.classList.remove('show'); m.style.display='none'; }
function toggleAllAgreements(checked){ const a=$('#agreeService'); const b=$('#agreePrivacy'); if(a) a.checked=!!checked; if(b) b.checked=!!checked; updateTermsNext(); }
function syncAllAgree(){ const a=$('#agreeService')?.checked; const b=$('#agreePrivacy')?.checked; const all=!!a && !!b; const x=$('#agreeAll'); if(x) x.checked=all; updateTermsNext(); }
function updateTermsNext(){ const ok= !!($('#agreeService')?.checked) && !!($('#agreePrivacy')?.checked); const btn=$('#btnTermsNext'); if(btn) btn.disabled=!ok; }

// ===== Basic info =====
function checkIdDup(){ const useridInput=$('#userid'); if(!useridInput) return; const id=useridInput.value.trim(); const hint=$('#idHint'); if(!hint) return; if(!id){ hint.textContent='아이디를 입력하세요.'; hint.style.color='#dc2626'; return; } const taken=['taken','admin']; if(taken.includes(id.toLowerCase())){ hint.textContent='이미 사용 중인 아이디입니다.'; hint.style.color='#dc2626'; } else { hint.textContent='사용 가능한 아이디입니다.'; hint.style.color='#16a34a'; } }
function validatePwSeq(){ const pw=$('#pw'); const pw2=$('#pw2'); const hint=$('#pwHint'); const v1=pw?.value||''; const v2=pw2?.value||''; const hasMin1=v1.length>=8; const hasMin2=v2.length>=8; const hasSpecial=s=>/[!@#$%^&*]/.test(s); if(!hint){return;} pw.setCustomValidity(''); pw2.setCustomValidity(''); hint.textContent=''; hint.style.color='#dc2626'; if(!hasMin1||!hasMin2){ hint.textContent='비밀번호는 8자 이상으로 입력하세요.'; pw2.setCustomValidity('비밀번호는 8자 이상이어야 합니다.'); return; } if(!hasSpecial(v1)||!hasSpecial(v2)){ hint.textContent='특수기호를 최소 1개 포함해 주세요. (!@#$%^&*)'; pw2.setCustomValidity('특수기호 최소 1개 필요'); return; } if(v1!==v2){ hint.textContent='비밀번호가 일치하지 않습니다.'; pw2.setCustomValidity('비밀번호가 일치하지 않습니다.'); return; } hint.style.color='#16a34a'; hint.textContent='비밀번호가 일치합니다.'; pw2.setCustomValidity(''); }
function blockDisallowed(e){ if(!e.data) return; if(/[^A-Za-z0-9_@]/.test(e.data)) e.preventDefault(); }
function filterUserId(el){ const clean=el.value.replace(/[^A-Za-z0-9_@]/g,''); if(clean!==el.value){ const pos=el.selectionStart; const diff=el.value.length-clean.length; el.value=clean; try{ el.setSelectionRange(Math.max(0,pos-diff),Math.max(0,pos-diff)); }catch{} } }
function filterPhone(el){ const before=el.value; const after=before.replace(/[^0-9]/g,''); if(before!==after){ el.value=after; toast('숫자만 입력할 수 있습니다.'); } }
function saveBasic(){
  const form=$('#form-basic'); if(!form){ toast('폼을 찾을 수 없습니다'); return; }
  const f=new FormData(form);
  const req=['userid','pw','pw2','nick','phone','gender','birth','height','weight'];
  for(const k of req){ if(!(f.get(k)&&String(f.get(k)).trim())){ toast('모든 필수 항목을 입력해주세요'); return; } }
  if(f.get('pw')!==f.get('pw2')){ toast('비밀번호가 일치하지 않습니다'); return; }
  const basicData=Object.fromEntries(f.entries());
  save(K.BASIC,basicData); toast('기본 정보 저장됨'); setAuth({loggedIn:true,userId:basicData.userid,nick:basicData.nick}); startOnboardingSurvey();
}

// ===== Plants (Herb/Leafy) =====
const PLANTS={
  basil:{ name:'바질', tags:['core'], tips:['밝은 간접광','물 자주 주지 않기','수확은 윗부분부터'], img:'img/basil.png', desc:'기본 작물 세트(Core)에 포함됩니다.' },
  mint:{ name:'민트', tags:['core','digestion','stress'], tips:['반그늘 선호','물을 말리지 않기','정기적인 순지르기'], img:'img/mint.png', desc:'상쾌한 향으로 음료/요리에 활용하기 좋아요.' },
  lettuce:{ name:'상추', tags:['core'], tips:['충분한 광','균일한 수분','15~25°C 유지'], img:'img/lettuce.png', desc:'손쉽게 키울 수 있는 잎채소입니다.' },
  lemonbalm:{ name:'레몬밤', tags:['sleep','stress','calm'], tips:['반그늘','과습 주의','신선 섭취 좋음'], img:'img/lemonbalm.png', desc:'은은한 레몬향의 허브.' },
  chamomile:{ name:'카모마일', tags:['sleep','calm'], tips:['충분한 일조','배수 좋은 토양','꽃이 피면 수확'], img:'img/chamomile.png', desc:'편안한 향으로 저녁 루틴에 적합.' },
  rosemary:{ name:'로즈마리', tags:['focus'], tips:['강한 빛 선호','건조에 강함','가지치기 필요'], img:'img/rosemary.png', desc:'향이 강해 요리/워터에 향을 더함.' },
  thyme:{ name:'타임', tags:['focus','digestion'], tips:['햇볕 좋은 곳','건조 토양','자주 수확'], img:'img/thyme.png', desc:'소량만으로도 풍미 업.' },
};

// ===== Survey compute =====
const W2={
  symptom:{ sleep_bad:{chamomile:2,lemonbalm:1.5}, stress_high:{lemonbalm:2,mint:1}, focus_low:{rosemary:2,thyme:1}, digest_heavy:{mint:2,thyme:1.5}, tired:{basil:1,rosemary:1} },
  habit:{ snack:{lettuce:1.5, arugula:1}, sweet:{mint:1.5}, fast_eat:{mint:1}, coffee:{lemonbalm:0.5} },
  flavor:{ soft:{chamomile:0.6,lettuce:0.4}, fresh:{mint:0.6,rosemary:0.2}, strong:{rosemary:0.8,thyme:0.6} },
  core:{ basil:0.2, lettuce:0.2 }
};
function collectSurveyState(){
  const selAll = (name) => Array.from(document.querySelectorAll(`[name="${name}"]`));
  const selected = (name) => selAll(name).filter(i=>i.checked).map(i=>i.value);
  const getVal = (name) => (document.querySelector(`[name="${name}"]`)?.value || '').trim();
  return {
    symptom: selected('symptom'),
    habit: selected('habit'),
    flavor_pref: getVal('flavor_pref') || 'soft',
    constraints: {
      allergy_flag: !!document.querySelector('[name="allergy_flag"]')?.checked,
      allergies: (document.querySelector('[name="allergy_list"]')?.value || '').split(',').map(s=>s.trim()).filter(Boolean),
      intakes: (document.querySelector('[name="intake_list"]')?.value || '').split(',').map(s=>s.trim()).filter(Boolean),
      avoid: selected('avoid'),
      avoid_manual: getVal('avoid_manual') ? getVal('avoid_manual').split(',').map(s=>s.trim()).filter(Boolean) : []
    }
  };
}
function computeRecoV2(state){
  const score={}; const add=(k,w)=>{ if(!PLANTS[k]) return; score[k]=(score[k]||0)+w; };
  (state.symptom||[]).forEach(s=>{ const map=W2.symptom[s]; if(map) Object.entries(map).forEach(([k,w])=>add(k,w)); });
  (state.habit||[]).forEach(h=>{ const map=W2.habit[h]; if(map) Object.entries(map).forEach(([k,w])=>add(k,w)); });
  Object.entries(W2.flavor[state.flavor_pref] || {}).forEach(([k,w])=>add(k,w));
  Object.entries(W2.core).forEach(([k,w])=>add(k,w));
  const nameMatch=(arr,plantKey)=> (arr||[]).some(n=> String(PLANTS[plantKey]?.name||'').replace(/\s/g,'').includes(String(n||'').replace(/\s/g,'')));
  const avoidSet=new Set([...(state.constraints?.avoid||[]), ...(state.constraints?.avoid_manual||[])]);
  let ranked=Object.entries(score).sort((a,b)=>b[1]-a[1]).map(([k])=>k);
  if(avoidSet.has('mint_family')) ranked=ranked.filter(k=>k!=='mint');
  if(avoidSet.has('strong_scent')) ranked=ranked.filter(k=>!['rosemary','thyme'].includes(k));
  if(state.constraints?.avoid_manual?.length){
    const names=state.constraints.avoid_manual.map(s=>String(s).replace(/\s/g,''));
    ranked=ranked.filter(k=>!names.some(n=>(PLANTS[k]?.name||'').replace(/\s/g,'').includes(n)));
  }
  ranked=ranked.filter(k=>!nameMatch(state.constraints?.allergies,k) && !nameMatch(state.constraints?.intakes,k));
  if(!ranked.length) ranked=['basil','lettuce','mint'];
  return ranked.slice(0,3);
}
function saveSurvey(){
  const state=collectSurveyState(); save(K.GOALS,state);
  const top3=computeRecoV2(state); save(K.RECO,{set:top3,state});
  const log=read(K.SURVEY_LOG,[]); log.push({at:new Date().toISOString(),state,top3}); save(K.SURVEY_LOG,log);
  //const first=top3[0]||'basil'; const p=PLANTS[first]||PLANTS['basil'];
  //const card=$('#recoIntroCard'); if(card){ card.innerHTML=`<div class="reco-hero"><figure class="reco-figure"><img src="${p.img||''}" alt="${p.name}"><div class="reco-badge">추천 작물</div></figure><div class="reco-title">${p.name}</div><div class="reco-sub">${p.desc||'설문 결과를 바탕으로 제안했어요.'}</div><ul class="reco-list">${(p.tips||[]).map(t=>`<li>${t}</li>`).join('')}</ul></div>`; }
  try { sessionStorage.setItem('flash_reco', '1'); } catch {}
  const basic=read(K.BASIC,null); if(basic?.userid) setAuth({loggedIn:true,userId:basic.userid,nick:basic.nick});
  //if(NAV_CTX.surveyMode==='onboard'){ navigate('reco-intro'); }
  //else{
  //  navigate('reco-intro');
  //  const actions=document.querySelector('#view-reco-intro .view-reco-intro-actions .cols.two');
  //  if(actions){ actions.innerHTML=`<button class="btn ghost" onclick="navigate('home')">추천만 저장</button><button class="btn acc" onclick="startSubscribeFromReco()">구독 변경</button>`; }
  //}
  window.location.assign('reco-intro.html');
}
function initRecoTabs(){
  const tabs=Array.from(document.querySelectorAll('#view-reco .tab-btn'));
  const panels={ set:$('#tab-set'), guide:$('#tab-guide') };
  tabs.forEach(btn=>btn.addEventListener('click',()=>{ tabs.forEach(b=>b.classList.remove('active')); btn.classList.add('active'); Object.values(panels).forEach(p=>p&&p.classList.remove('active')); const id=btn.getAttribute('data-tab'); panels[id]?.classList.add('active'); }));
}
function renderRecoV2(){
  try{
    const data=read(K.RECO,null); const set=(data&&data.set)||['basil','lettuce','mint']; const heroKey=set[0];
    const p=PLANTS[heroKey]||{name:'추천 원물',desc:'설문 결과를 바탕으로 제안했어요.',img:''};
    // If reco-intro page uses single #recoIntroCard, populate it too
    const introCard = document.getElementById('recoIntroCard');
    if (introCard) {
      introCard.innerHTML = `<div class="reco-hero"><figure class="reco-figure"><img src="${p.img||''}" alt="${p.name}"><div class="reco-badge">추천 작물</div></figure><div class="reco-title">${p.name}</div><div class="reco-sub">${p.desc||'설문 결과를 바탕으로 제안했어요.'}</div><ul class="reco-list">${(p.tips||[]).map(t=>`<li>${t}</li>`).join('')}</ul></div>`;
    }

    const imgEl=$('#recoHeroImg'); const titleEl=$('#recoHeroTitle'); const subEl=$('#recoHeroSub');
    if(imgEl){ imgEl.src=p.img||''; imgEl.alt=p.name||'추천 작물'; }
    if(titleEl) titleEl.textContent=p.name||'추천 원물';
    if(subEl) subEl.textContent=p.desc||'설문 결과를 바탕으로 제안했어요.';
    const listEl=$('#recoSetList');
    if(listEl){
      const others=set.length>1?set.slice(1):set;
      listEl.innerHTML=others.map(k=>{ const x=PLANTS[k]||{name:k,desc:'',img:''}; return `<div class="reco-chip"><img src="${x.img||''}" alt="${x.name||''}"><div class="meta"><div class="name">${x.name||k}</div><div class="desc">${x.desc||''}</div></div></div>`; }).join('');
    }
    const guideEl=$('#recoGuide'); if(guideEl){ const tips=(p.tips||[]); guideEl.innerHTML = `${tips.length? `<ul>${tips.map(t=>`<li>${t}</li>`).join('')}</ul>` : '<p class="hint">곧 가이드가 추가됩니다.</p>'}`; }
    initRecoTabs();
  }catch(e){ console.warn('renderRecoV2 error', e); }
}

// ===== Records/Calendar =====
let calRef=new Date();
const FIELDS=[{k:'weight',label:'몸무게(kg)',type:'number',step:'0.1'},{k:'steps',label:'걸음수',type:'number'},{k:'strength',label:'근력운동(분)',type:'number'},{k:'hr',label:'심박수(bpm)',type:'number'},{k:'glucose',label:'혈당(mg/dL)',type:'number'},{k:'bpSys',label:'혈압 수축',type:'number'},{k:'bpDia',label:'혈압 이완',type:'number'},{k:'water',label:'물 섭취(ml)',type:'number'},{k:'condition',label:'컨디션(메모)',type:'text'}];
function getRecords(){ return read(K.RECORDS,{}); } function setRecords(o){ save(K.RECORDS,o); }
function renderCalendar(){
  const title=$('#calTitle'); const grid=$('#calGrid'); if(!title||!grid) return;
  const base=new Date(calRef.getFullYear(),calRef.getMonth(),1); const firstDow=(base.getDay()+6)%7;
  title.textContent=`${base.getFullYear()}-${String(base.getMonth()+1).padStart(2,'0')}`; grid.innerHTML='';
  const days=new Date(base.getFullYear(),base.getMonth()+1,0).getDate(); for(let i=0;i<firstDow;i++){ grid.appendChild(document.createElement('div')); }
  const recs=getRecords();
  for(let d=1; d<=days; d++){
    const date=`${base.getFullYear()}-${String(base.getMonth()+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const cell=document.createElement('div'); const hasData=!!recs[date] && Object.keys(recs[date]).length>0;
    cell.className='day'+(hasData?' has-data':'');
    cell.innerHTML=`<div class='d'>${d}</div>${hasData?`<span class='mark' title='입력 있음'>🌱</span>`:''}`;
    cell.onclick=()=>openRecordModal(date); grid.appendChild(cell);
  }
}
function prevMonth(){ calRef.setMonth(calRef.getMonth()-1); renderCalendar(); }
function nextMonth(){ calRef.setMonth(calRef.getMonth()+1); renderCalendar(); }
function openRecordModal(date){
  const ov=$('#recOverlay'); const m=$('#recModal'); if(!ov||!m) return;
  ov.classList.add('show'); m.style.display='block';
  const rec=getRecords()[date]||{};
  m.innerHTML=`<div class='title'>${date} 기록하기</div>${FIELDS.map(f=>`<label>${f.label}<input id='f-${f.k}' type='${f.type}' ${f.step?`step='${f.step}'`:''} value='${rec[f.k]??''}'></label>`).join('')}<div class='right'><button class='btn ghost' onclick='closeRecModal()'>취소</button><button class='btn acc' onclick="saveDay('${date}')">저장하기</button></div>`;
}
function closeRecModal(){ const ov=$('#recOverlay'); const m=$('#recModal'); if(!ov||!m) return; ov.classList.remove('show'); m.style.display='none'; }
function saveDay(date){
  const rec=getRecords(); rec[date]=rec[date]||{};
  FIELDS.forEach(f=>{ const el=$(`#f-${f.k}`); if(!el) return; const v=el.value; if(v!==''&&v!=null){ rec[date][f.k]=(f.type==='number')? Number(v): v; } });
  if(rec[date].weight){ const b=read(K.BASIC,{}); const vit=read(K.VITALS,{}); const h=parseFloat(b.height||vit.height); if(h){ rec[date].bmi=Math.round((rec[date].weight/Math.pow(h/100,2))*10)/10; } }
  setRecords(rec); closeRecModal(); renderCalendar(); toast('저장됨');
  if (typeof window.renderRecordsSummary === 'function') window.renderRecordsSummary();
}

// ===== Crop detail =====
let currentCrop=null; const CROPKEY='ipicare-crop-';
function openCropDetail(k){ if(!isSubscribed()){ openSubPrompt('작물 관리'); return; } currentCrop=k; renderCropDetail(); navigate('crop-detail'); }
function getCrop(){ return read(CROPKEY+currentCrop,{meta:{},logs:[]}); }
function setCrop(v){ save(CROPKEY+currentCrop,v); }
function renderCropDetail(){
  const p=PLANTS[currentCrop]; const data=getCrop(); if(!p) return;
  const hdr=$('#cropHeader'); if(hdr) hdr.innerHTML=`<div style='display:flex;align-items:center;gap:12px'><div style='width:56px;height:56px;border-radius:14px;background:#e5f5ec;border:1px solid var(--line)'></div><div><div class='badge'>${(p.tags||[]).join(' · ')}</div><div style='font-weight:900;font-size:18px'>${p.name} 관리</div></div></div>`;
  const ship=$('#shipDate'); const plant=$('#plantDate'); if(ship) ship.value=data.meta.shipDate||''; if(plant) plant.value=data.meta.plantDate||'';
  renderLogs();
}
function saveCropMeta(){ const d=getCrop(); const ship=$('#shipDate'); const plant=$('#plantDate'); d.meta.shipDate=ship?ship.value:''; d.meta.plantDate=plant?plant.value:''; setCrop(d); toast('저장됨'); }
function renderLogs(){
  const host=$('#cropLogs'); const d=getCrop(); if(!host) return;
  host.innerHTML=(d.logs||[]).map((x,i)=>`<div class='item'><div class='meta'><div class='title'>${x.date} · ${x.action}</div><div class='sub'>${x.note||''}</div></div><button class='btn' onclick='delLog(${i})'>삭제</button></div>`).join('')||'<div class="hint">아직 로그가 없습니다.</div>';
}
function delLog(i){ const d=getCrop(); d.logs.splice(i,1); setCrop(d); renderLogs(); }
function openLogModal(){
  const ov=$('#overlay'); const m=$('#modal'); if(!ov||!m) return;
  ov.classList.add('show'); m.style.display='block';
  m.innerHTML=`<div class='title'>관리 로그 추가</div><label>날짜<input type='date' id='logDate' value='${new Date().toISOString().slice(0,10)}'></label><label>작업<select id='logAction'><option>급수</option><option>영양제</option><option>수확</option><option>가지치기</option><option>기타</option></select></label><label>메모<input id='logNote' placeholder='간단 메모'></label><div class='right'><button class='btn ghost' onclick='closeModal()'>취소</button><button class='btn acc' onclick='saveLog()'>저장</button></div>`;
}
function saveLog(){ const d=getCrop(); d.logs=d.logs||[]; const date=$('#logDate')?.value||new Date().toISOString().slice(0,10); const act=$('#logAction')?.value||'기타'; const note=$('#logNote')?.value||''; d.logs.unshift({date,action:'#'+act,note}); setCrop(d); closeModal(); renderLogs(); toast('추가됨'); }

// ===== Subscribe flow & options =====
function openSubPrompt(feature=''){
  const ov=$('#overlay'); const m=$('#modal'); if(!ov||!m) return;
  ov.classList.add('show'); m.style.display='block';
  m.innerHTML = `<div class='title'>구독이 필요한 기능입니다</div>
    <div class='hint' style='margin-bottom:10px'>‘${feature||'이'}’ 기능을 사용하려면 구독을 시작해 주세요.</div>
    <div class='right'><button class='btn ghost' onclick='closeModal()'>닫기</button><button class='btn acc' onclick='startSubscribeFromIntercept()'>구독 시작</button></div>`;
  return false;
}
function inferPackFromReco(){
  try{
    const r = read(K.RECO, null); const set = (r?.set)||[]; const key = set[0]||'';
    if (['basil','mint','lettuce'].includes(key)) return 'Core';
    if (['lemonbalm','chamomile'].includes(key)) return 'Calm';
    if (['rosemary','thyme'].includes(key)) return 'Focus';
  }catch(e){}
  return 'Core';
}
function startSubscribeFromReco(){ const pack=inferPackFromReco(); navigate('subscribe'); setTimeout(()=>renderSubscribe(pack),0); }
function startSubscribeFromIntercept(){ const pack=inferPackFromReco(); navigate('subscribe'); setTimeout(()=>renderSubscribe(pack),0); }
function renderSubscribe(defaultPack='Core'){
  const basic=read(K.BASIC,{});
  const name=$('#shipName'); const phone=$('#shipPhone');
  if(name) name.value=basic.nick||''; if(phone) phone.value=basic.phone||'';
  const today=new Date(); const d=new Date(today.getTime()+1000*60*60*24*3); const dateEl=$('#firstShipDate'); if(dateEl) dateEl.value=d.toISOString().slice(0,10);
  $$('input[name="sub_pack"]').forEach(r=>{ r.checked=(r.value===defaultPack); });
  const p=getPlan();
  if(p){
    $$('input[name="sub_pack"]').forEach(r=>{ r.checked=(r.value===p.pack); });
    const cad=$('#subCadence'); if(cad) cad.value=p.cadence||'biweekly';
    if(p.address){ $('#shipName').value=p.address.name||''; $('#shipPhone').value=p.address.phone||''; $('#shipAddr1').value=p.address.addr1||''; $('#shipAddr2').value=p.address.addr2||''; }
    $('#chkStarter').checked=(p.status==='trial') || !!(p.extras?.starter);
    $('#optHardware').checked=!!(p.extras?.hardware);
    $('#optInstall').checked=!!(p.extras?.installation);
    $('#consNutrient').checked=!!(p.consumables?.nutrient);
    $('#consFilter').checked=!!(p.consumables?.filter);
    $('#consTrayLock').checked=!!(p.consumables?.traylock);
    $('#consSanitizer').checked=!!(p.consumables?.sanitizer);
  }
}
function confirmSubscribe(){
  const pack=(Array.from(document.querySelectorAll('input[name="sub_pack"]')).find(r=>r.checked)?.value)||'Core';
  const cadence=$('#subCadence')?.value||'biweekly';
  const shipDate=$('#firstShipDate')?.value||'';
  const addr1=$('#shipAddr1')?.value.trim()||''; const addr2=$('#shipAddr2')?.value.trim()||'';
  const name=$('#shipName')?.value.trim()||''; const phone=$('#shipPhone')?.value.trim()||'';
  const starter=$('#chkStarter')?.checked||false;
  const extras={ starter, hardware: !!$('#optHardware')?.checked, installation: !!$('#optInstall')?.checked };
  const consumables={ nutrient:!!$('#consNutrient')?.checked, filter:!!$('#consFilter')?.checked, traylock:!!$('#consTrayLock')?.checked, sanitizer:!!$('#consSanitizer')?.checked };
  if(!shipDate || !addr1 || !name || !phone){ toast('필수 정보를 입력해 주세요'); return; }
  const plan={ status: starter?'trial':'active', pack, cadence, shipDate, address:{name,phone,addr1,addr2}, startedAt:new Date().toISOString(), extras, consumables };
  if(starter){ const end=new Date(shipDate); end.setDate(end.getDate()+56); plan.trialEndsAt=end.toISOString().slice(0,10); }
  setPlan(plan); toast(starter?'8주 체험이 시작되었습니다':'구독이 시작되었습니다'); navigate('home');
}
function pauseSubscription(){ const p=getPlan(); if(!p) return; p.status='paused'; setPlan(p); renderSubManage(); toast('구독이 일시정지되었습니다'); }
function resumeSubscription(){ const p=getPlan(); if(!p) return; p.status='active'; setPlan(p); renderSubManage(); toast('구독이 재개되었습니다'); }
function cancelSubscription(){ const p=getPlan(); if(!p) return; p.status='canceled'; setPlan(p); renderSubManage(); toast('구독이 해지되었습니다'); }

// ===== Home dashboard =====
function fmtDate(d){ return d.toISOString().slice(0,10); }
function addDays(d,n){ const x=new Date(d); x.setDate(x.getDate()+n); return x; }
function nextShipFrom(plan){
  if(!plan?.shipDate) return null;
  try{
    const start=new Date(plan.shipDate);
    const step=plan.cadence==='biweekly'?14:30;
    let cur=new Date(start);
    const today=new Date(); today.setHours(0,0,0,0);
    for(let i=0;i<60 && cur<today;i++){ cur=addDays(cur,step); }
    return cur;
  }catch{ return null; }
}
function daysDiff(a,b){ return Math.round((a.getTime()-b.getTime())/86400000); }
function computeStreak(){
  const recs=read(K.RECORDS,{}); const today=new Date(); today.setHours(0,0,0,0);
  let streak=0;
  for(let i=0;i<365;i++){ const d=addDays(today,-i); const key=fmtDate(d); if(recs[key] && Object.keys(recs[key]).length>0){ streak++; } else { break; } }
  return streak;
}
function summarizeRecentRecords(days=7){
  const recs=read(K.RECORDS,{})||{};
  const allCount=Object.keys(recs).length;
  const cutoff=new Date(); cutoff.setDate(cutoff.getDate()-days);
  const nums={ sleep:[], stress:[], focus:[] }; let conditionBad=0; let recentCount=0;
  Object.entries(recs).forEach(([date,val])=>{
    const d=new Date(date); if(isNaN(d)) return;
    if(d>=cutoff){
      recentCount++;
      if(typeof val.sleep==='number') nums.sleep.push(val.sleep);
      if(typeof val.stress==='number') nums.stress.push(val.stress);
      if(typeof val.focus==='number')  nums.focus.push(val.focus);
      if(String(val.condition||'').toLowerCase().includes('bad')) conditionBad++;
    }
  });
  const avg=arr=>arr.length?arr.reduce((a,b)=>a+b,0)/arr.length:null;
  return { sleepAvg:avg(nums.sleep), stressAvg:avg(nums.stress), focusAvg:avg(nums.focus), conditionBad, allCount, recentCount };
}
function renderHome(){
  const r=read(K.RECO,null); const plan=getPlan(); const set=(r?.set && r.set.length? r.set:['basil']); const first=set[0]; const p=PLANTS[first]||{name:'추천 작물',img:'',tips:[]};
  // (1) 설문 기반 추천 카드
  const surveyHost=$('#heroRecoSurvey');
  if(surveyHost){
    surveyHost.innerHTML = `<div style="display:flex;align-items:center;gap:12px;">
      <div style="width:64px;height:64px;border-radius:12px;overflow:hidden;background:#d1fae5;">
        <img src="${p.img||''}" alt="${p.name||'추천 작물'}" style="width:100%;height:100%;object-fit:cover;">
      </div>
      <div><div class="badge">건강 상태 기반 추천</div>
      <div style="font-weight:900;font-size:18px;margin-top:4px;">${p.name||'추천 작물'}</div>
      </div></div>`;
  }
  //<div class="hint">${(p.tips?.[0]||'')}${p.tips?.[1]?' · '+p.tips[1]:''}</div>
  // (2) 기록 요약 카드
  const s=summarizeRecentRecords(7); const recordHost=$('#heroRecoRecord');
  if(recordHost){
    let recordHTML='';
    if(!s.allCount || s.allCount===0) recordHTML=`<div class="empty"><div class="title">기록이 아직 없어요</div><div class="desc">매일 건강을 기록해 주세요. 패턴을 바탕으로 더 정교한 추천을 해드릴게요.</div><div class="actions"><button class="btn acc" onclick="navigate('records')">오늘 건강 기록하기</button></div></div>`;
    else if(s.recentCount===0) recordHTML=`<div class="hint">최근 7일 기록이 없습니다. 오늘 기록해 보세요.</div>`;
    else{
      let second='mint';
      if(s.conditionBad>0 || (s.stressAvg!=null && s.stressAvg>7)) second='lemonbalm';
      else if(s.sleepAvg!=null && s.sleepAvg<6) second='chamomile';
      else if(s.focusAvg!=null && s.focusAvg<5) second='rosemary';
      const q=PLANTS[second]||{name:second,img:'',tips:[]};
      recordHTML=`<div style="display:flex;align-items:center;gap:12px;"><div style="width:64px;height:64px;border-radius:12px;overflow:hidden;background:#dbeafe;"><img src="${q.img||''}" alt="${q.name}" style="width:100%;height:100%;object-fit:cover;"></div><div><div class="badge">기록 기반 추천</div><div style="font-weight:900;font-size:18px;margin-top:4px;">${q.name}</div><div class="hint">${(q.tips?.[0]||'')}${q.tips?.[1]?' · '+q.tips[1]:''}</div></div></div>`;
    }
    recordHost.innerHTML=recordHTML;
  }
  // (3) 구독 요약 카드
  const subHost=$('#homeSubSummary');
  if(subHost){
    if(!plan){
      subHost.innerHTML=`<div class="title-strong">구독</div><div class="hint">아직 구독이 없습니다.</div><div class="right"><button class="btn acc" onclick="navigate('subscribe')">구독 시작</button></div>`;
    } else {
      const next=nextShipFrom(plan); const diff=next?daysDiff(next,new Date()):null;
      const statusClass=plan.status==='active'?'active':(plan.status==='paused'?'paused':(plan.status==='trial'?'active':'canceled'));
      const statusLabel=plan.status==='trial'?'체험중':(plan.status==='active'?'활성':(plan.status==='paused'?'일시정지':'해지됨'));
      const packNames=packBullets(plan.pack);
      const trialInfo=plan.status==='trial'&&plan.trialEndsAt?`<div class="sub">체험 종료: ${plan.trialEndsAt}</div>`:'';
      const cons=plan.consumables||{};
      const consList=Object.entries(cons).filter(([k,v])=>!!v).map(([k])=>({nutrient:'영양액',filter:'필터',traylock:'트레이·락',sanitizer:'살균제'}[k]||k)).join(', ');
      const extras=plan.extras||{}; const extraList=[extras.hardware?'스마트팜 키트':null, extras.installation?'설치·점검':null].filter(Boolean).join(', ');
      subHost.innerHTML=`<div class="title-strong">구독</div>
        <div class="item" style="margin-top:8px">
          <div class="meta">
            <div class="title">${PACK_LABEL[plan.pack]||plan.pack} <span class="badge soft">${packNames}</span><br><span class="status ${statusClass}">${statusLabel}</span></div>
            ${trialInfo}
            <div class="sub">다음 배송: ${next?fmtDate(next):'-'}${(diff!=null && diff>=0)?` (D-${diff})`:''}</div>
            <div class="sub">소모품 구독: ${consList||'없음'}</div>
            <div class="sub">옵션: ${extraList||'없음'}</div>
            <div class="sub">배송지: ${plan.address?.addr1||''} ${plan.address?.addr2||''}</div>
          </div>
          <button class="btn" onclick="navigate('my')">구독 관리</button>
        </div>`;
    }
  }
  // (4) 스트릭
  const streakHost=$('#homeStreak');
  if(streakHost){
    const streak=computeStreak();
    streakHost.innerHTML=`<div class="title-strong">기록 스트릭</div><div class="item" style="margin-top:8px"><div class="meta"><div class="title">${streak}일 연속</div><div class="sub">연속 기록을 이어가 보세요</div></div><button class="btn" onclick="navigate('records')">${streak>0?'오늘도 기록':'지금 기록'}</button></div>`;
  }
  // (5) 루틴
  const todayHost=$('#homeToday');
  if(todayHost){
    const tasks=[`물주기 체크`,`겉잎 수확`,`레시피 보기`];
    todayHost.innerHTML=`<div id="todayRoutine"><div class="title-strong">오늘 루틴</div><ul style="margin-top:6px;color:#4b5563">${tasks.map(t=>`<li>${t}</li>`).join('')}</ul><div class="right"><button class="btn" onclick="navigate('grow')">알림 설정</button><button class="btn acc" onclick="navigate('recipes')">레시피</button></div></div>`;
  }
  // (6) 내 작물 상태
  const host=$('#myCrops'); if(host){
    let cropKeys=[];
    if(isSubscribed() && PACK_PLANTS[getPlan()?.pack]) cropKeys=PACK_PLANTS[getPlan().pack];
    else cropKeys=set.slice(0,3);
    host.innerHTML=cropKeys.map(k=>{ const x=PLANTS[k]||{name:k,tips:[]}; return `<div class="item"><div class="meta"><div class="title">${x.name}</div><div class="sub">권장: ${x.tips?.[0]||''}</div></div><button class="btn" onclick="openCropDetail('${k}')">관리</button></div>`; }).join('');
  }
}

// ===== My / Subscription manage =====
function renderMy(){ const b=read(K.BASIC,{}); const nick=$('#myNick'); if(nick) nick.textContent=b.nick||'닉네임'; syncConsentsUI(); renderSubManage(); }
function renderSubManage(){
  const host=$('#subManage'); if(!host) return;
  const p=getPlan();
  if(!p){ host.innerHTML=`<div class="title-strong">구독 현황</div><div class="hint">아직 구독이 없습니다.</div><div class="right"><button class="btn acc" onclick="navigate('subscribe')">구독 시작</button></div>`; return; }
  const statusLabel=p.status==='trial'?'체험중':(p.status==='active'?'활성':(p.status==='paused'?'일시정지':'해지됨'));
  const statusClass=p.status==='active'?'active':(p.status==='paused'?'paused':(p.status==='trial'?'active':'canceled'));
  const packNames=packBullets(p.pack);
  const cons=p.consumables||{}; const consList=Object.entries(cons).filter(([k,v])=>!!v).map(([k])=>({nutrient:'영양액',filter:'필터',traylock:'트레이·락',sanitizer:'살균제'}[k]||k)).join(', ');
  const extras=p.extras||{}; const extraList=[extras.hardware?'스마트팜 키트':null, extras.installation?'설치·점검':null].filter(Boolean).join(', ');
  const trialInfo=p.status==='trial'&&p.trialEndsAt?`<div class="sub">체험 종료: ${p.trialEndsAt}</div>`:'';
  host.innerHTML=`<div class="title-strong">구독 현황</div>
    <div class="item" style="margin-top:8px">
      <div class="meta">
        <div class="title">${PACK_LABEL[p.pack]||p.pack} <span class="badge soft">${packNames}</span> <span class="status ${statusClass}">${statusLabel}</span></div>
        <div class="sub">주기: ${p.cadence==='biweekly'?'격주':'월 1회'}</div>
        ${trialInfo}
        <div class="sub">소모품 구독: ${consList||'없음'}</div>
        <div class="sub">옵션: ${extraList||'없음'}</div>
        <div class="sub">시작일: ${p.shipDate||'-'}</div>
        <div class="sub">배송지: ${p.address?.addr1||''} ${p.address?.addr2||''}</div>
      </div>
      <div class="grow"></div>
      <div style="display:grid;gap:6px">
        ${p.status==='active'||p.status==='trial' ? `<button class="btn" onclick="pauseSubscription()">일시정지</button>` : `<button class="btn" onclick="resumeSubscription()">재개</button>`}
        <button class="btn ghost" onclick="cancelSubscription()">해지</button>
      </div>
    </div>`;
}

// ===== Consent modal & Data receipt =====
function openConsentPrompt(){
  const ov=$('#overlay'); const m=$('#modal'); if(!ov||!m) return;
  ov.classList.add('show'); m.style.display='block';
  m.innerHTML = `<div class='title'>건강 데이터 사용 동의 필요</div>
    <div class='hint' style='margin-bottom:10px'>기록 기능을 사용하려면 건강 데이터 사용에 동의해 주세요.</div>
    <div class='right'>
      <button class='btn ghost' style="color:black" onclick='closeModal()'>닫기</button>
      <button class='btn acc' onclick='toggleConsent("use_health", true); closeModal(); navigate("records");'>동의하고 계속</button>
    </div>`;
  return false;
}
function openDataReceipt(){
  const dump={
    hasBasic: !!read(K.BASIC,null), hasGoals: !!read(K.GOALS,null), hasReco: !!read(K.RECO,null),
    recordsCount: Object.keys(read(K.RECORDS,{})).length,
    consent: getConsent(), consentLog: read(K.CONSENT_LOG, []),
    plan: getPlan(), recipes: read(K.RECIPES, null), surveyLog: read(K.SURVEY_LOG, [])
  };
  const ov=$('#overlay'); const m=$('#modal'); if(!ov||!m) return;
  ov.classList.add('show'); m.style.display='block';
  const logHTML = dump.consentLog.length ? `<ul style="margin:6px 0 0 18px">${dump.consentLog.map(x=>`<li>${x.at} · ${x.key} → ${x.value?'동의':'철회'}</li>`).join('')}</ul>` : '<div class="hint">동의 변경 이력이 없습니다.</div>';
  const surveyHTML = dump.surveyLog.length ? `<ul style="margin:6px 0 0 18px">${dump.surveyLog.slice(-5).map(x=>`<li>${x.at} · ${x.top3.join(', ')}</li>`).join('')}</ul>` : '<div class="hint">설문 이력이 없습니다.</div>';
  m.innerHTML = `<div class='title'>데이터 영수증</div>
    <div class='hint'>보관 중인 항목(로컬 저장소 기준)</div>
    <ul style="margin:6px 0 0 18px">
      <li>기본정보: ${dump.hasBasic?'있음':'없음'}</li>
      <li>설문/추천: ${dump.hasGoals||dump.hasReco?'있음':'없음'}</li>
      <li>기록 일수: ${dump.recordsCount}일</li>
      <li>구독 상태: ${dump.plan ? (dump.plan.status||'없음') : '없음'}</li>
      <li>레시피 저장: ${dump.recipes ? (dump.recipes.favorites?.length||0)+'개' : '없음'}</li>
    </ul>
    <div style="margin-top:8px"><b>동의 이력</b>${logHTML}</div>
    <div style="margin-top:8px"><b>설문 이력(최근)</b>${surveyHTML}</div>
    <div class='right' style="margin-top:10px"><button class='btn acc' onclick='closeModal()'>닫기</button></div>`;
}

// ===== Service Worker (safe) =====
(function registerSW(){
  try{
    if('serviceWorker' in navigator){
      if(location.protocol==='file:'){ console.warn('file:// 에서는 SW가 동작하지 않습니다.'); return; }
      const swUrl=new URL('service-worker.js', location.href).toString();
      window.addEventListener('load',()=>{ navigator.serviceWorker.register(swUrl).catch(err=>console.warn('[SW] register failed',err)); });
    }
  }catch(e){ console.warn('SW error', e); }
})();

// ===== Init (once) =====
document.addEventListener('DOMContentLoaded',()=>{
  try{  
	if (document.body?.dataset?.page === 'survey') {
	} else {
    const page=(document.body?.dataset?.page||'').toLowerCase();
    const alwaysHide=['intro','terms','basic','survey','reco-intro','login','subscribe'];
    const auth=getAuth();
    setTabsVisible( !!(auth&&auth.loggedIn) && !alwaysHide.includes(page) );
	}
  }catch(e){ try{ setTabsVisible(false); }catch(_){} }
});

// ===== MPA boot (once) =====
(function(){
  function bootPage(){
    const page=(document.body?.dataset?.page||'').toLowerCase();
    // Onboarding pages keep bottom tabs hidden; others per auth
    const alwaysHide=['intro','terms','basic','survey','reco-intro','login','subscribe'];
    setTabsVisible( !!(isLoggedIn()) && !alwaysHide.includes(page) );

    if (page==='home'   && typeof renderHome==='function') renderHome();
    if (page==='records'&& typeof renderCalendar==='function') renderCalendar();
    if (page==='reco'   && typeof renderRecoV2==='function') renderRecoV2();
	if (page==='reco-intro' && typeof renderRecoV2==='function') renderRecoV2();
    if (page==='plants' && typeof renderPlants==='function') renderPlants();
    if (page==='grow'   && typeof renderGrow==='function') renderGrow();
    if (page==='my'     && typeof renderMy==='function') renderMy();
    if (page==='subscribe' && typeof renderSubscribe==='function'){ const p=inferPackFromReco(); renderSubscribe(p); }
  }
  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', bootPage); } else { bootPage(); }
})();

// ===== Export to window =====
Object.assign(window, {
  navigate, setTabsVisible,
  // terms
  openTerms, closeModal, toggleAllAgreements, syncAllAgree, updateTermsNext,
  // auth
  handleLogin,
  // basic & survey
  checkIdDup, validatePwSeq, blockDisallowed, filterUserId, filterPhone, saveBasic,
  collectSurveyState, computeRecoV2, saveSurvey, startReevalSurvey, startOnboardingSurvey,
  // records
  prevMonth, nextMonth, renderCalendar, openRecordModal, closeRecModal, saveDay,
  // crops
  openCropDetail, saveCropMeta, openLogModal, saveLog,
  // subscribe
  openSubPrompt, startSubscribeFromReco, startSubscribeFromIntercept, renderSubscribe, confirmSubscribe, pauseSubscription, resumeSubscription, cancelSubscription,
  // misc
  renderRecoV2, renderHome, renderMy, openDataReceipt
});
