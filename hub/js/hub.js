const SUPABASE_URL = 'https://jotgygpobwvswasgbage.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvdGd5Z3BvYnd2c3dhc2diYWdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4ODU4MzIsImV4cCI6MjA5NDQ2MTgzMn0.GCPW_viKskyoR7Nd1NbrSULJbouOBSFFtJdQQi6zDBE';
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const state = { members:[], projects:[], surveys:[], templates:[], admin:null };

function escapeHtml(value=''){
  return String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}
function toast(message){
  const el = $('#toast');
  if(!el) return alert(message);
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(()=>el.classList.remove('show'),2400);
}
function maskEmail(email=''){
  const [id, domain] = String(email).split('@');
  if(!domain) return email || '-';
  const visible = id.slice(0,Math.min(3,id.length));
  return `${visible}${'*'.repeat(Math.max(2,id.length-visible.length))}@${domain}`;
}
function maskPhone(phone=''){
  const d = String(phone).replace(/\D/g,'');
  return d.length === 11 ? `${d.slice(0,3)}-${d.slice(3,7)}-****` : (phone || '-');
}
function formatDate(value, withTime=false){
  if(!value) return '-';
  const options = withTime
    ? {year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}
    : {year:'numeric',month:'2-digit',day:'2-digit'};
  return new Intl.DateTimeFormat('ko-KR', options).format(new Date(value));
}
function userTypeLabel(v){return ({young:'청년농',successor:'후계농',return:'귀농예정',other:'일반창업자'})[v] || '-'}
function facilityLabel(v){return ({biz_center:'지식산업센터',panel_factory:'판넬형 창고·공장',retail_space:'상가/근린생활시설',etc:'기타 실내공간'})[v] || v || '-'}
function statusLabel(v){return ({draft:'설계중',quote_requested:'견적요청',quote_review:'견적검토',contracted:'계약체결',construction:'시공',operating:'운영중',complete:'완료',done:'완료'})[v] || v || '-'}
function statusBadge(v){
  const cls = ({draft:'gray',quote_requested:'blue',quote_review:'orange',contracted:'purple',construction:'orange',operating:'green',complete:'green',done:'green'})[v] || 'gray';
  return `<span class="badge badge-${cls}">${escapeHtml(statusLabel(v))}</span>`;
}
function roleLabel(v){return ({user:'회원',manager:'매니저',admin:'관리자',super_admin:'최고관리자'})[v] || v || '-'}
function roleBadge(v){
  const cls = v === 'super_admin' ? 'purple' : v === 'admin' ? 'green' : v === 'manager' ? 'blue' : 'gray';
  return `<span class="badge badge-${cls}">${escapeHtml(roleLabel(v))}</span>`;
}
function percentage(value,total){return total ? Math.round(value/total*100) : 0}
function closeModal(id){$('#'+id)?.classList.remove('show')}
function openModal(id){$('#'+id)?.classList.add('show')}

async function currentAdmin(){
  const {data:{user}, error:userError} = await db.auth.getUser();
  if(userError || !user) return null;
  const {data:profile,error} = await db
    .from('profiles')
    .select('id,email,name,role,is_active')
    .eq('id',user.id)
    .single();
  if(error || !profile || !['manager','admin','super_admin'].includes(profile.role) || profile.is_active === false) return null;
  return {...profile, authUser:user};
}
async function guard(){
  const admin = await currentAdmin();
  if(!admin){
    location.replace('login.html');
    return null;
  }
  state.admin = admin;
  $('#hubUserName') && ($('#hubUserName').textContent = admin.name || '관리자');
  $('#hubUserEmail') && ($('#hubUserEmail').textContent = admin.email || '');
  $('#hubUserInitial') && ($('#hubUserInitial').textContent = (admin.name || admin.email || 'A').slice(0,1).toUpperCase());
  $('#hubRole') && ($('#hubRole').textContent = roleLabel(admin.role));
  return admin;
}
function initLayout(page){
  $$('.hub-nav a').forEach(a=>a.classList.toggle('active',a.dataset.page===page));
  $('#mobileMenu')?.addEventListener('click',()=>{
    $('#hubSidebar')?.classList.add('open');
    $('#mobileOverlay')?.classList.add('show');
  });
  $('#mobileOverlay')?.addEventListener('click',()=>{
    $('#hubSidebar')?.classList.remove('open');
    $('#mobileOverlay')?.classList.remove('show');
  });
  $('#btnLogout')?.addEventListener('click',async()=>{
    await db.auth.signOut();
    location.replace('login.html');
  });
  $('#btnHome')?.addEventListener('click',()=>location.href='../home.html');
  $$('[data-close]').forEach(btn=>btn.addEventListener('click',()=>closeModal(btn.dataset.close)));
  $$('.modal-backdrop').forEach(modal=>modal.addEventListener('click',e=>{
    if(e.target===modal) modal.classList.remove('show');
  }));
}
async function bootstrap(page){
  const admin = await guard();
  if(!admin) return null;
  initLayout(page);
  return admin;
}

async function login(event){
  event.preventDefault();
  const email = event.target.email.value.trim();
  const password = event.target.password.value;
  const button = event.target.querySelector('button[type="submit"]');
  button.disabled = true;
  button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 확인 중';
  const {error} = await db.auth.signInWithPassword({email,password});
  if(error){
    button.disabled = false;
    button.textContent = '운영센터 로그인';
    return toast('이메일 또는 비밀번호를 확인해 주세요.');
  }
  const admin = await currentAdmin();
  if(!admin){
    await db.auth.signOut();
    button.disabled = false;
    button.textContent = '운영센터 로그인';
    return toast('관리자 권한이 없는 계정입니다.');
  }
  location.replace('index.html');
}

async function fetchCore(){
  const [members,projects,surveys,templates] = await Promise.all([
    db.from('profiles').select('id,email,phone,name,farm_name,role,is_active,created_at,notifications').order('created_at',{ascending:false}),
    db.from('projects').select('id,user_id,name,status,reco,memo,created_at,updated_at,profiles(id,email,name,farm_name),project_surveys(*)').order('created_at',{ascending:false}),
    db.from('project_surveys').select('*'),
    db.from('reco_templates').select('*').order('ai_score_base',{ascending:false})
  ]);
  const errors = [members.error,projects.error,surveys.error,templates.error].filter(Boolean);
  if(errors.length) throw errors[0];
  state.members = members.data || [];
  state.projects = projects.data || [];
  state.surveys = surveys.data || [];
  state.templates = templates.data || [];
  updateNavCounts();
}
function updateNavCounts(){
  $('#navMemberCount') && ($('#navMemberCount').textContent = state.members.length);
  $('#navProjectCount') && ($('#navProjectCount').textContent = state.projects.length);
  $('#navSurveyCount') && ($('#navSurveyCount').textContent = state.surveys.length);
  $('#navTemplateCount') && ($('#navTemplateCount').textContent = state.templates.length);
}

async function dashboard(){
  if(!await bootstrap('dashboard')) return;
  try{ await fetchCore(); }catch(error){ return toast(`데이터 조회 실패: ${error.message}`); }

  const inProgress = state.projects.filter(p=>!['operating','complete','done'].includes(p.status)).length;
  const completed = state.projects.length - inProgress;
  $('#statMembers').textContent = `${state.members.length}명`;
  $('#statProjects').textContent = `${state.projects.length}건`;
  $('#statInProgress').textContent = `${inProgress}건`;
  $('#statTemplates').textContent = `${state.templates.length}개`;
  $('#statCompleteRate').textContent = `완료율 ${percentage(completed,state.projects.length)}%`;
  $('#statAdminCount').textContent = `운영자 ${state.members.filter(m=>['manager','admin','super_admin'].includes(m.role)).length}명`;

  $('#recentProjects').innerHTML = state.projects.slice(0,7).map(p=>`
    <div class="activity-item">
      <div class="activity-icon"><i class="fa-solid fa-seedling"></i></div>
      <div class="activity-main">
        <div class="activity-title">${escapeHtml(p.name)}</div>
        <div class="activity-meta">${escapeHtml(p.profiles?.name || maskEmail(p.profiles?.email || ''))} · ${formatDate(p.created_at,true)}</div>
      </div>
      ${statusBadge(p.status)}
    </div>`).join('') || '<div class="empty">최근 프로젝트가 없습니다.</div>';

  const typeCounts = {young:0,successor:0,return:0,other:0};
  state.surveys.forEach(s=>{ if(typeCounts[s.user_type] !== undefined) typeCounts[s.user_type]++; });
  const total = state.surveys.length;
  $('#userTypeBars').innerHTML = Object.entries(typeCounts).map(([key,count])=>`
    <div>
      <div class="kpi-row-head"><span>${userTypeLabel(key)}</span><strong>${count}명 · ${percentage(count,total)}%</strong></div>
      <div class="progress-track"><div class="progress-bar" style="width:${percentage(count,total)}%"></div></div>
    </div>`).join('');

  const statuses = ['draft','quote_requested','quote_review','contracted','construction','operating'];
  $('#statusBars').innerHTML = statuses.map(key=>{
    const count = state.projects.filter(p=>p.status===key).length;
    return `<div>
      <div class="kpi-row-head"><span>${statusLabel(key)}</span><strong>${count}건</strong></div>
      <div class="progress-track"><div class="progress-bar" style="width:${percentage(count,state.projects.length)}%"></div></div>
    </div>`;
  }).join('');

  const regions = {};
  state.surveys.forEach(s=>{
    const region = (s.region_si || '미입력').split(' ').slice(0,2).join(' ');
    regions[region] = (regions[region] || 0) + 1;
  });
  $('#regionList').innerHTML = Object.entries(regions).sort((a,b)=>b[1]-a[1]).slice(0,7).map(([region,count])=>`
    <div class="activity-item">
      <div class="activity-icon"><i class="fa-solid fa-location-dot"></i></div>
      <div class="activity-main"><div class="activity-title">${escapeHtml(region)}</div><div class="activity-meta">전체 설문 중 ${percentage(count,total)}%</div></div>
      <strong>${count}건</strong>
    </div>`).join('') || '<div class="empty">지역 데이터가 없습니다.</div>';

  const today = new Date();
  const thisMonth = state.members.filter(m=>{
    const d = new Date(m.created_at);
    return d.getFullYear()===today.getFullYear() && d.getMonth()===today.getMonth();
  }).length;
  $('#monthJoin').textContent = `${thisMonth}명`;
  $('#quoteWait').textContent = `${state.projects.filter(p=>['quote_requested','quote_review'].includes(p.status)).length}건`;
  $('#buildCount').textContent = `${state.projects.filter(p=>p.status==='construction').length}건`;
}

async function members(){
  if(!await bootstrap('members')) return;
  try{ await fetchCore(); }catch(error){ return toast(`회원 조회 실패: ${error.message}`); }
  renderMembers();
  ['memberSearch','memberType','memberRole','memberStatus'].forEach(id=>$('#'+id)?.addEventListener('input',renderMembers));
  $('#memberRows')?.addEventListener('click',event=>{
    const button = event.target.closest('[data-member-id]');
    if(button) openMember(button.dataset.memberId);
  });
  $('#memberForm')?.addEventListener('submit',saveMember);
}
function memberSurvey(member){
  const project = state.projects.find(p=>p.user_id===member.id);
  return project?.project_surveys?.[0] || {};
}
function renderMembers(){
  const q = ($('#memberSearch')?.value || '').trim().toLowerCase();
  const type = $('#memberType')?.value || '';
  const role = $('#memberRole')?.value || '';
  const active = $('#memberStatus')?.value || '';
  const rows = state.members.filter(m=>{
    const s = memberSurvey(m);
    const matchesQ = !q || [m.name,m.email,m.phone,m.farm_name,s.region_si].join(' ').toLowerCase().includes(q);
    return matchesQ && (!type || s.user_type===type) && (!role || m.role===role) &&
      (!active || String(m.is_active !== false)===active);
  });
  $('#memberCount').textContent = `${rows.length}명`;
  $('#memberRows').innerHTML = rows.map(m=>{
    const s = memberSurvey(m);
    const projectCount = state.projects.filter(p=>p.user_id===m.id).length;
    return `<tr>
      <td><div class="cell-title">${escapeHtml(m.name || '이름 미등록')}</div><div class="cell-sub">${escapeHtml(m.farm_name || '농장명 미등록')}</div></td>
      <td><div class="cell-stack"><span>${escapeHtml(maskEmail(m.email))}</span><span class="cell-sub">${escapeHtml(maskPhone(m.phone))}</span></div></td>
      <td>${escapeHtml(userTypeLabel(s.user_type))}</td>
      <td>${escapeHtml(s.region_si || '-')}</td>
      <td>${projectCount}건</td>
      <td>${roleBadge(m.role)}</td>
      <td>${m.is_active===false?'<span class="badge badge-red">비활성</span>':'<span class="badge badge-green">활성</span>'}</td>
      <td>${formatDate(m.created_at)}</td>
      <td><button class="btn btn-ghost btn-sm" data-member-id="${m.id}"><i class="fa-solid fa-pen"></i> 상세</button></td>
    </tr>`;
  }).join('') || '<tr><td colspan="9" class="empty"><i class="fa-regular fa-folder-open"></i>조건에 맞는 회원이 없습니다.</td></tr>';
}
function openMember(id){
  const m = state.members.find(x=>x.id===id);
  if(!m) return;
  const s = memberSurvey(m);
  const projects = state.projects.filter(p=>p.user_id===m.id);
  $('#editMemberId').value = m.id;
  $('#editMemberName').value = m.name || '';
  $('#editMemberFarm').value = m.farm_name || '';
  $('#editMemberRole').value = m.role || 'user';
  $('#editMemberActive').value = String(m.is_active !== false);
  $('#memberModalTitle').textContent = m.name || '회원 상세';
  $('#memberDetail').innerHTML = `
    <div class="detail-box"><div class="detail-label">이메일</div><div class="detail-value">${escapeHtml(m.email || '-')}</div></div>
    <div class="detail-box"><div class="detail-label">전화번호</div><div class="detail-value">${escapeHtml(m.phone || '-')}</div></div>
    <div class="detail-box"><div class="detail-label">회원 유형</div><div class="detail-value">${userTypeLabel(s.user_type)}</div></div>
    <div class="detail-box"><div class="detail-label">지역</div><div class="detail-value">${escapeHtml(s.region_si || '-')}</div></div>
    <div class="detail-box"><div class="detail-label">가입일</div><div class="detail-value">${formatDate(m.created_at,true)}</div></div>
    <div class="detail-box"><div class="detail-label">프로젝트</div><div class="detail-value">${projects.length}건</div></div>
    <div class="detail-box full"><div class="detail-label">프로젝트 목록</div><div class="detail-value">${projects.map(p=>escapeHtml(p.name)).join('<br>') || '프로젝트 없음'}</div></div>`;
  openModal('memberModal');
}
async function saveMember(event){
  event.preventDefault();
  const id = $('#editMemberId').value;
  const payload = {
    name: $('#editMemberName').value.trim() || null,
    farm_name: $('#editMemberFarm').value.trim() || null,
    role: $('#editMemberRole').value,
    is_active: $('#editMemberActive').value === 'true',
    updated_at: new Date().toISOString()
  };
  const {data,error} = await db.from('profiles').update(payload).eq('id',id).select().single();
  if(error) return toast(`회원 수정 실패: ${error.message}`);
  const idx = state.members.findIndex(x=>x.id===id);
  state.members[idx] = {...state.members[idx],...data};
  closeModal('memberModal');
  renderMembers();
  toast('회원 정보를 수정했습니다.');
}

async function projects(){
  if(!await bootstrap('projects')) return;
  try{ await fetchCore(); }catch(error){ return toast(`프로젝트 조회 실패: ${error.message}`); }
  renderProjects();
  ['projectSearch','projectStatus','projectFacility'].forEach(id=>$('#'+id)?.addEventListener('input',renderProjects));
  $('#projectRows')?.addEventListener('click',event=>{
    const button = event.target.closest('[data-project-id]');
    if(button) openProject(button.dataset.projectId);
  });
  $('#projectForm')?.addEventListener('submit',saveProject);
}
function renderProjects(){
  const q = ($('#projectSearch')?.value || '').trim().toLowerCase();
  const status = $('#projectStatus')?.value || '';
  const facility = $('#projectFacility')?.value || '';
  const rows = state.projects.filter(p=>{
    const s = p.project_surveys?.[0] || {};
    const matchesQ = !q || [p.name,p.profiles?.name,p.profiles?.email,s.region_si,p.reco?.title].join(' ').toLowerCase().includes(q);
    return matchesQ && (!status || p.status===status) && (!facility || s.facility===facility);
  });
  $('#projectCount').textContent = `${rows.length}건`;
  $('#projectRows').innerHTML = rows.map(p=>{
    const s = p.project_surveys?.[0] || {};
    return `<tr>
      <td><div class="cell-title">${escapeHtml(p.name)}</div><div class="cell-sub">${escapeHtml(p.reco?.title || '추천안 미지정')}</div></td>
      <td><div class="cell-title">${escapeHtml(p.profiles?.name || '-')}</div><div class="cell-sub">${escapeHtml(maskEmail(p.profiles?.email || ''))}</div></td>
      <td>${escapeHtml(s.region_si || '-')}</td>
      <td>${facilityLabel(s.facility)}</td>
      <td>${s.floor_area ? `${s.floor_area}㎡` : '-'}</td>
      <td>${statusBadge(p.status)}</td>
      <td>${formatDate(p.created_at)}</td>
      <td><button class="btn btn-ghost btn-sm" data-project-id="${p.id}"><i class="fa-solid fa-pen"></i> 관리</button></td>
    </tr>`;
  }).join('') || '<tr><td colspan="8" class="empty"><i class="fa-regular fa-folder-open"></i>조건에 맞는 프로젝트가 없습니다.</td></tr>';
}
function openProject(id){
  const p = state.projects.find(x=>x.id===id);
  if(!p) return;
  const s = p.project_surveys?.[0] || {};
  $('#editProjectId').value = p.id;
  $('#editProjectName').value = p.name || '';
  $('#editProjectStatus').value = p.status || 'draft';
  $('#editProjectMemo').value = p.memo || '';
  $('#projectModalTitle').textContent = p.name;
  $('#projectDetail').innerHTML = `
    <div class="detail-box"><div class="detail-label">회원</div><div class="detail-value">${escapeHtml(p.profiles?.name || '-')}</div></div>
    <div class="detail-box"><div class="detail-label">이메일</div><div class="detail-value">${escapeHtml(maskEmail(p.profiles?.email || ''))}</div></div>
    <div class="detail-box"><div class="detail-label">지역</div><div class="detail-value">${escapeHtml(s.region_si || '-')}</div></div>
    <div class="detail-box"><div class="detail-label">시설 유형</div><div class="detail-value">${facilityLabel(s.facility)}</div></div>
    <div class="detail-box"><div class="detail-label">면적 / 층고</div><div class="detail-value">${s.floor_area || '-'}㎡ / ${s.ceil_height || '-'}m</div></div>
    <div class="detail-box"><div class="detail-label">전력</div><div class="detail-value">${s.electric_power || s.electric_power_known || '-'}${s.electric_power ? 'kW' : ''}</div></div>
    <div class="detail-box full"><div class="detail-label">추천안</div><div class="detail-value">${escapeHtml(p.reco?.title || '-')} · ${escapeHtml(p.reco?.cropType || p.reco?.crop_type || '-')}</div></div>`;
  openModal('projectModal');
}
async function saveProject(event){
  event.preventDefault();
  const id = $('#editProjectId').value;
  const payload = {
    name: $('#editProjectName').value.trim(),
    status: $('#editProjectStatus').value,
    memo: $('#editProjectMemo').value.trim() || null,
    updated_at: new Date().toISOString()
  };
  const {data,error} = await db.from('projects').update(payload).eq('id',id).select().single();
  if(error) return toast(`프로젝트 수정 실패: ${error.message}`);
  const idx = state.projects.findIndex(x=>x.id===id);
  state.projects[idx] = {...state.projects[idx],...data};
  closeModal('projectModal');
  renderProjects();
  toast('프로젝트를 수정했습니다.');
}

async function surveys(){
  if(!await bootstrap('surveys')) return;
  try{ await fetchCore(); }catch(error){ return toast(`설문 조회 실패: ${error.message}`); }
  renderSurveys();
  ['surveySearch','surveyType','surveyFacility'].forEach(id=>$('#'+id)?.addEventListener('input',renderSurveys));
  $('#surveyRows')?.addEventListener('click',event=>{
    const button = event.target.closest('[data-survey-id]');
    if(button) openSurvey(button.dataset.surveyId);
  });
}
function surveyProject(s){return state.projects.find(p=>p.id===s.project_id)}
function renderSurveys(){
  const q = ($('#surveySearch')?.value || '').trim().toLowerCase();
  const type = $('#surveyType')?.value || '';
  const facility = $('#surveyFacility')?.value || '';
  const rows = state.surveys.filter(s=>{
    const p = surveyProject(s);
    const matchesQ = !q || [s.region_si,p?.name,p?.profiles?.name,p?.profiles?.email].join(' ').toLowerCase().includes(q);
    return matchesQ && (!type || s.user_type===type) && (!facility || s.facility===facility);
  });
  $('#surveyCount').textContent = `${rows.length}건`;
  $('#surveyRows').innerHTML = rows.map(s=>{
    const p = surveyProject(s);
    return `<tr>
      <td><div class="cell-title">${escapeHtml(p?.profiles?.name || '-')}</div><div class="cell-sub">${escapeHtml(maskEmail(p?.profiles?.email || ''))}</div></td>
      <td>${userTypeLabel(s.user_type)}</td>
      <td>${escapeHtml(s.region_si || '-')}</td>
      <td>${facilityLabel(s.facility)}</td>
      <td>${s.floor_area ? `${s.floor_area}㎡` : '-'}</td>
      <td>${s.ceil_height ? `${s.ceil_height}m` : '-'}</td>
      <td>${s.electric_power ? `${s.electric_power}kW` : '모름'}</td>
      <td><button class="btn btn-ghost btn-sm" data-survey-id="${s.project_id}"><i class="fa-solid fa-eye"></i> 보기</button></td>
    </tr>`;
  }).join('') || '<tr><td colspan="8" class="empty"><i class="fa-regular fa-folder-open"></i>조건에 맞는 설문이 없습니다.</td></tr>';
}
function openSurvey(projectId){
  const s = state.surveys.find(x=>x.project_id===projectId);
  const p = surveyProject(s || {});
  if(!s) return;
  $('#surveyModalTitle').textContent = p?.name || '설문 상세';
  const items = [
    ['회원 유형',userTypeLabel(s.user_type)],['지역',s.region_si],['정책자금',s.policy],
    ['희망 대출',s.loan_range],['자기자본',s.own_capital],['시설 유형',facilityLabel(s.facility)],
    ['면적',s.floor_area ? `${s.floor_area}㎡` : '-'],['가용면적',s.usable_area ? `${s.usable_area}㎡` : '-'],
    ['층고',s.ceil_height ? `${s.ceil_height}m` : '-'],['전력',s.electric_power ? `${s.electric_power}kW` : '모름'],
    ['급배수',s.water_supply],['환기',s.ventilation],['근무형태',s.work_type],
    ['근무시간',s.work_hours],['가족 인력',s.family_staff],['목표수익',s.profit_goal],
    ['위험성향',s.risk],['유통방식',(s.distribution || []).join(', ') || '-']
  ];
  $('#surveyDetail').innerHTML = items.map(([label,value])=>`<div class="detail-box"><div class="detail-label">${label}</div><div class="detail-value">${escapeHtml(value ?? '-')}</div></div>`).join('');
  openModal('surveyModal');
}

async function templates(){
  if(!await bootstrap('templates')) return;
  try{ await fetchCore(); }catch(error){ return toast(`추천안 조회 실패: ${error.message}`); }
  renderTemplates();
  $('#templateSearch')?.addEventListener('input',renderTemplates);
  $('#templateEstimatable')?.addEventListener('input',renderTemplates);
  $('#btnNewTemplate')?.addEventListener('click',()=>openTemplate());
  $('#templateRows')?.addEventListener('click',event=>{
    const button = event.target.closest('[data-template-id]');
    if(button) openTemplate(button.dataset.templateId);
  });
  $('#templateForm')?.addEventListener('submit',saveTemplate);
}
function renderTemplates(){
  const q = ($('#templateSearch')?.value || '').trim().toLowerCase();
  const estimatable = $('#templateEstimatable')?.value || '';
  const rows = state.templates.filter(t=>{
    const matchesQ = !q || [t.code,t.title,t.crop_type,t.facility_label,(t.tags||[]).join(' ')].join(' ').toLowerCase().includes(q);
    return matchesQ && (!estimatable || String(t.estimatable !== false)===estimatable);
  });
  $('#templateCount').textContent = `${rows.length}개`;
  $('#templateRows').innerHTML = rows.map(t=>`<tr>
    <td><div class="cell-title">${escapeHtml(t.title)}</div><div class="cell-sub">${escapeHtml(t.code || '-')}</div></td>
    <td>${escapeHtml(t.crop_type || '-')}</td>
    <td>${escapeHtml(t.facility_label || '-')}</td>
    <td>${escapeHtml(t.invest || '-')}</td>
    <td>${escapeHtml(t.staff || '-')}</td>
    <td>${t.ai_score_base ?? '-'}</td>
    <td>${t.estimatable===false?'<span class="badge badge-orange">상담 필요</span>':'<span class="badge badge-green">견적 가능</span>'}</td>
    <td><button class="btn btn-ghost btn-sm" data-template-id="${t.id}"><i class="fa-solid fa-pen"></i> 수정</button></td>
  </tr>`).join('') || '<tr><td colspan="8" class="empty"><i class="fa-regular fa-folder-open"></i>추천안이 없습니다.</td></tr>';
}
function openTemplate(id=''){
  const t = state.templates.find(x=>x.id===id) || {};
  $('#templateForm').reset();
  $('#editTemplateId').value = t.id || '';
  $('#editTemplateCode').value = t.code || '';
  $('#editTemplateTitle').value = t.title || '';
  $('#editTemplateCrop').value = t.crop_type || '';
  $('#editTemplateFacility').value = t.facility_label || '';
  $('#editTemplateInvest').value = t.invest || '';
  $('#editTemplateStaff').value = t.staff || '';
  $('#editTemplateScore').value = t.ai_score_base ?? 80;
  $('#editTemplateDifficulty').value = t.difficulty ?? 2;
  $('#editTemplateTags').value = (t.tags || []).join(', ');
  $('#editTemplateDescription').value = t.description || '';
  $('#editTemplateEstimatable').value = String(t.estimatable !== false);
  $('#templateModalTitle').textContent = id ? '추천안 수정' : '추천안 추가';
  openModal('templateModal');
}
async function saveTemplate(event){
  event.preventDefault();
  const id = $('#editTemplateId').value;
  const payload = {
    code: $('#editTemplateCode').value.trim(),
    title: $('#editTemplateTitle').value.trim(),
    crop_type: $('#editTemplateCrop').value.trim() || null,
    facility_label: $('#editTemplateFacility').value.trim() || null,
    invest: $('#editTemplateInvest').value.trim() || null,
    staff: $('#editTemplateStaff').value.trim() || null,
    ai_score_base: Number($('#editTemplateScore').value || 80),
    difficulty: Number($('#editTemplateDifficulty').value || 2),
    tags: $('#editTemplateTags').value.split(',').map(x=>x.trim()).filter(Boolean),
    description: $('#editTemplateDescription').value.trim() || null,
    estimatable: $('#editTemplateEstimatable').value === 'true'
  };
  const result = id
    ? await db.from('reco_templates').update(payload).eq('id',id).select().single()
    : await db.from('reco_templates').insert(payload).select().single();
  if(result.error) return toast(`추천안 저장 실패: ${result.error.message}`);
  if(id){
    const idx = state.templates.findIndex(x=>x.id===id);
    state.templates[idx] = result.data;
  }else state.templates.unshift(result.data);
  closeModal('templateModal');
  renderTemplates();
  toast('추천안을 저장했습니다.');
}

async function analytics(){
  if(!await bootstrap('analytics')) return;
  try{ await fetchCore(); }catch(error){ return toast(`통계 조회 실패: ${error.message}`); }
  const total = state.surveys.length;
  const typeCounts = {young:0,successor:0,return:0,other:0};
  state.surveys.forEach(s=>{ if(typeCounts[s.user_type]!==undefined) typeCounts[s.user_type]++; });
  $('#analyticsTotal').textContent = `${total}건`;
  $('#analyticsMembers').textContent = `${state.members.length}명`;
  $('#analyticsAvgArea').textContent = `${Math.round(state.surveys.reduce((a,s)=>a+(Number(s.floor_area)||0),0)/(total||1))}㎡`;
  $('#analyticsQuote').textContent = `${state.projects.filter(p=>['quote_requested','quote_review','contracted'].includes(p.status)).length}건`;

  $('#analyticsTypeBars').innerHTML = Object.entries(typeCounts).map(([key,count])=>`
    <div>
      <div class="kpi-row-head"><span>${userTypeLabel(key)}</span><strong>${count}건 · ${percentage(count,total)}%</strong></div>
      <div class="progress-track"><div class="progress-bar" style="width:${percentage(count,total)}%"></div></div>
    </div>`).join('');

  const areaGroups = {'30평 미만':0,'30~49평':0,'50~60평':0,'61~80평':0,'81~100평':0};
  state.surveys.forEach(s=>{
    const p = (Number(s.floor_area)||0)/3.3058;
    if(p<30) areaGroups['30평 미만']++;
    else if(p<50) areaGroups['30~49평']++;
    else if(p<=60) areaGroups['50~60평']++;
    else if(p<=80) areaGroups['61~80평']++;
    else areaGroups['81~100평']++;
  });
  $('#areaBars').innerHTML = Object.entries(areaGroups).map(([key,count])=>`
    <div>
      <div class="kpi-row-head"><span>${key}</span><strong>${count}건</strong></div>
      <div class="progress-track"><div class="progress-bar" style="width:${percentage(count,total)}%"></div></div>
    </div>`).join('');

  const topTemplates = {};
  state.projects.forEach(p=>{
    const title = p.reco?.title || '미지정';
    topTemplates[title] = (topTemplates[title] || 0) + 1;
  });
  $('#topTemplates').innerHTML = Object.entries(topTemplates).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([title,count])=>`
    <div class="activity-item">
      <div class="activity-icon"><i class="fa-solid fa-wand-magic-sparkles"></i></div>
      <div class="activity-main"><div class="activity-title">${escapeHtml(title)}</div><div class="activity-meta">프로젝트 선택 비중 ${percentage(count,state.projects.length)}%</div></div>
      <strong>${count}건</strong>
    </div>`).join('') || '<div class="empty">추천 데이터가 없습니다.</div>';

  const facilities = {};
  state.surveys.forEach(s=>facilities[facilityLabel(s.facility)]=(facilities[facilityLabel(s.facility)]||0)+1);
  $('#facilityBars').innerHTML = Object.entries(facilities).sort((a,b)=>b[1]-a[1]).map(([key,count])=>`
    <div>
      <div class="kpi-row-head"><span>${escapeHtml(key)}</span><strong>${count}건</strong></div>
      <div class="progress-track"><div class="progress-bar" style="width:${percentage(count,total)}%"></div></div>
    </div>`).join('');
}

async function settings(){
  const admin = await bootstrap('settings');
  if(!admin) return;
  $('#settingName').value = admin.name || '';
  $('#settingEmail').value = admin.email || '';
  $('#settingRole').value = roleLabel(admin.role);
  $('#settingsForm')?.addEventListener('submit',async event=>{
    event.preventDefault();
    const name = $('#settingName').value.trim();
    const {error} = await db.from('profiles').update({name,updated_at:new Date().toISOString()}).eq('id',admin.id);
    if(error) return toast(`저장 실패: ${error.message}`);
    $('#hubUserName').textContent = name || '관리자';
    toast('관리자 정보를 저장했습니다.');
  });
}

window.Hub = {login,dashboard,members,projects,surveys,templates,analytics,settings};
