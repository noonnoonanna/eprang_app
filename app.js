// =============================
//  공통 키 & 유틸
// =============================

const supabaseClient = supabase.createClient(
  'https://jotgygpobwvswasgbage.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvdGd5Z3BvYnd2c3dhc2diYWdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4ODU4MzIsImV4cCI6MjA5NDQ2MTgzMn0.GCPW_viKskyoR7Nd1NbrSULJbouOBSFFtJdQQi6zDBE'
);

// DOM 헬퍼
function $(sel)  { return document.querySelector(sel); }
function $$(sel) { return Array.from(document.querySelectorAll(sel)); }

// 토스트 메시지
function toast(msg) {
  const el = $('#toast');
  if (!el) {
    alert(msg);
    return;
  }
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2000);
}

// =============================
//  인증 상태 (AUTH)
// =============================
// 현재 로그인 유저 정보 가져오기 (비동기)
async function getCurrentUser() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  return user;
}

// 동기식 체크가 필요한 페이지 진입 Guard용 (선택)
function isLoggedIn() {
  // Supabase가 로컬스토리지에 자동으로 생성하는 세션 키를 확인하는
  const sbKey = Object.keys(localStorage).find(key => key.startsWith('sb-'));
  return !!sbKey;
}

// =============================
//  로그인 처리
// =============================
async function handleLogin(e) {
  e.preventDefault();
  const id = e.target.userid.value.trim();
  const pw = e.target.password.value.trim();

  if (!id || !pw) {
    toast('아이디/비밀번호를 입력하세요');
    return;
  }

  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: id,
      password: pw
    });

    if (error) throw error;

    toast('로그인 되었습니다.');
	localStorage.setItem('AUTH', 'true');

    // 회원가입 시 이메일 인증 때문에 저장하지 못한 설문 패키지가 있으면
    // 로그인 직후 프로젝트로 저장한 다음 홈으로 이동합니다.
    if (localStorage.getItem('ep-temp-project-package')) {
      await addProject();
      return;
    }
    window.location.assign('home.html');
  } catch (e) {
    console.error(e);
    toast('아이디 또는 비밀번호가 올바르지 않습니다');
  }
}

// =============================
//  약관 동의 (terms.html)
// =============================
const TERMS = {
  service: `서비스 이용약관 전문을 여기에 넣으세요.`,
  privacy: `개인정보 수집·이용 동의 전문을 여기에 넣으세요.`
};

function openTerms(title, content) {
  const ov = document.querySelector('#overlay');
  const m  = document.querySelector('#modal');
  if (!m || !ov) return;

  ov.classList.add('show');
  m.style.display = 'block';
  m.innerHTML = `
    <div class="title">${title}</div>
    <div class="hint" style="white-space:pre-wrap">${content}</div>
  `;
}

function closeModal() {
  const ov = document.querySelector('#overlay');
  const m  = document.querySelector('#modal');
  if (!m || !ov) return;
  ov.classList.remove('show');
  m.style.display = 'none';
}

window.TERMS = TERMS;
window.openTerms = openTerms;
window.closeModal = closeModal;

// "전체동의" 체크박스 → 개별 약관 체크 반영
function toggleAllAgreements(checked) {
  const a = $('#agreeService');
  const b = $('#agreePrivacy');
  if (a) a.checked = !!checked;
  if (b) b.checked = !!checked;
  updateTermsNext();
}

// 개별 약관 체크 시 전체동의 sync
function syncAllAgree() {
  const a = $('#agreeService')?.checked;
  const b = $('#agreePrivacy')?.checked;
  const all = !!a && !!b;
  const x = $('#agreeAll');
  if (x) x.checked = all;
  updateTermsNext();
}

// 다음 버튼 활성화 여부
function updateTermsNext() {
  const ok =
    !!($('#agreeService')?.checked) &&
    !!($('#agreePrivacy')?.checked);
  const btn = $('#btnTermsNext');
  if (btn) btn.disabled = !ok;
}

function handleTermsNext() {
  const agreeService = $('#agreeService')?.checked || false;
  const agreePrivacy = $('#agreePrivacy')?.checked || false;

  if (!agreeService || !agreePrivacy) {
    
    const errorMsg = '서비스 이용약관과 개인정보 수집 및 이용에 모두 동의해 주세요. 필수 항목을 체크하셔야 다음 단계로 진행할 수 있습니다.';
    
    if (typeof openTerms === 'function') {
      openTerms('동의가 필요합니다', errorMsg);
    } else {
      toast('필수 약관에 모두 동의해주세요.');
    }
    return;
  }

  // 두 개 다 체크된 경우에만 survey.html로 이동
  window.location.assign('survey.html');
}

// =============================
//  회원가입 기본 정보 (basic.html)
// =============================

// 비밀번호/비밀번호 확인 검증
function validatePwSeq() {
  const pw   = $('#pw');
  const pw2  = $('#pw2');
  const hint = $('#pwHint');

  const v1 = pw?.value || '';
  const v2 = pw2?.value || '';

  if (!hint || !pw || !pw2) return;

  const hasMin1 = v1.length >= 8;
  const hasMin2 = v2.length >= 8;
  const hasSpecial = s => /[!@#$%^&*]/.test(s);

  pw.setCustomValidity('');
  pw2.setCustomValidity('');
  hint.textContent = '';
  hint.style.color = '#dc2626';

  if (!hasMin1 || !hasMin2) {
    hint.textContent = '비밀번호는 8자 이상으로 입력하세요.';
    pw2.setCustomValidity('비밀번호는 8자 이상이어야 합니다.');
    return;
  }

  if (!hasSpecial(v1) || !hasSpecial(v2)) {
    hint.textContent = '특수기호를 최소 1개 포함해 주세요. (!@#$%^&*)';
    pw2.setCustomValidity('특수기호 최소 1개 필요');
    return;
  }

  if (v1 !== v2) {
    hint.textContent = '비밀번호가 일치하지 않습니다.';
    pw2.setCustomValidity('비밀번호가 일치하지 않습니다.');
    return;
  }

  hint.style.color = '#16a34a';
  hint.textContent = '비밀번호가 일치합니다.';
  pw2.setCustomValidity('');
}

// 연락처 숫자만 허용
function filterPhone(el) {
  const before = el.value;
  const after  = before.replace(/[^0-9]/g, '');
  if (before !== after) {
    el.value = after;
    toast('숫자만 입력할 수 있습니다.');
  }
}

// 회원가입 저장 + 로그인 상태 세팅 + 대시보드로 이동
async function saveBasic() {
  const form = $('#form-basic');
  if (!form) {
    toast('폼을 찾을 수 없습니다');
    return;
  }

  const f = new FormData(form);

  // 필수 항목: 이메일(userid) + pw + pw2 + phone
  const req = ['userid', 'pw', 'pw2', 'phone'];
  for (const k of req) {
    const v = f.get(k);
    if (!(v && String(v).trim())) {
      toast('모든 필수 항목을 입력해주세요');
      return;
    }
  }

  if (f.get('pw') !== f.get('pw2')) {
    toast('비밀번호가 일치하지 않습니다');
    return;
  }
  
  const email = String(f.get('userid')).trim();
  const password = String(f.get('pw'));
  const phone = String(f.get('phone')).trim();
  
  try {
    // 1단계: Supabase 회원가입 진행
    const { data: authData, error: authError } = await supabaseClient.auth.signUp({
      email: email,
      password: password,
      options: {
        data: { phone: phone }
      }
    });

    if (authError) throw authError;
    if (!authData.user) {
      toast('회원가입 처리에 실패했습니다.');
      return;
    }

    // 회원가입 직후 실제 Supabase 세션을 확보해야 홈에서 프로젝트를 조회할 수 있습니다.
    // 이메일 확인 설정 등에 따라 signUp 결과에 session이 없을 수 있어 한 번 로그인도 시도합니다.
    let activeSession = authData.session;
    if (!activeSession) {
      const { data: loginData, error: loginError } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

      if (loginError || !loginData.session) {
        toast('이메일 인증 후 로그인하면 선택한 설계안이 자동으로 저장됩니다.');
        window.location.assign('login.html');
        return;
      }
      activeSession = loginData.session;
    }

    const userId = activeSession.user.id;

    // 2단계: reco-intro에서 임시 패킹해둔 [설문+설계안] 데이터 패키지 꺼내기
    const tempPackageRaw = localStorage.getItem('ep-temp-project-package');

    if (tempPackageRaw) {
      const packageData = JSON.parse(tempPackageRaw);
      const surveyData = packageData.survey;
      const recoData = packageData.reco;
      
      const regionSi = surveyData.step1?.region_si || '';
      // 선택한 설계안 이름이 있다면 제목에 반영 (예: "서울 스마트팜 프로젝트 (딸기 컴팩트형)")
      const recoName = recoData?.title ? ` (${recoData.title})` : '';
      const projectName = regionSi ? `${regionSi} 스마트팜 프로젝트${recoName}` : `신규 스마트팜 프로젝트${recoName}`;

      // 3단계: projects 테이블에 마스터 행 추가 (선택한 설계안 정보인 recoData를 json 구조로 통째로 넣어 보관해도 좋습니다)
      const { data: newProject, error: projectError } = await supabaseClient
        .from('projects')
        .insert([{ 
          user_id: userId, 
          name: projectName, 
          status: 'draft'
          // 만약 projects 테이블에 선택한 안을 저장하는 컬럼(예: selected_reco)을 만드셨다면 여기에 recoData를 넣으시면 됩니다.
        }])
        .select()
        .single();

      if (projectError) throw projectError;

      // 4단계: project_surveys 테이블에 상세 설문 데이터 매핑하여 추가
      const { error: surveyError } = await supabaseClient
        .from('project_surveys')
        .insert([
          {
            project_id: newProject.id,
            user_type: surveyData.step1?.user_type || null,
            region_si: surveyData.step1?.region_si || null,
            policy: surveyData.step1?.policy || null,
            loan_range: surveyData.step1?.loan_range || null,
            own_capital: surveyData.step1?.own_capital || null,
            facility: surveyData.step2?.facility || null,
            floor_area: surveyData.step2?.floor_area ? Number(surveyData.step2.floor_area) : null,
            usable_area: surveyData.step2?.usable_area ? Number(surveyData.step2.usable_area) : null,
            ceil_height: surveyData.step2?.ceil_height ? Number(surveyData.step2.ceil_height) : null,
            pillar_info: surveyData.step2?.pillar_info || null,
            entrance_path: surveyData.step2?.entrance_path || null,
            electric_power: surveyData.step2?.electric_power ? Number(surveyData.step2.electric_power) : null,
            electric_power_known: surveyData.step2?.electric_power_known || null,
            electric_phase: surveyData.step2?.electric_phase || null,
            panel_location: surveyData.step2?.panel_location || null,
            panel_location_known: surveyData.step2?.panel_location_known || null,
            water_supply: surveyData.step2?.water_supply || null,
            water_location: surveyData.step2?.water_location || null,
            water_location_known: surveyData.step2?.water_location_known || null,
            ventilation: surveyData.step2?.ventilation || null,
            work_hours: surveyData.step2?.work_hours || null,
            work_type: surveyData.step2?.work_type || null,
            family_staff: surveyData.step2?.family_staff ? parseInt(surveyData.step2.family_staff, 10) : null,
            profit_goal: surveyData.step3?.profit_goal || null,
            risk: surveyData.step3?.risk || null,
            distribution: surveyData.step3?.distribution || [],
            distribution_etc: surveyData.step3?.distribution_etc || null
          }
        ]);

      if (surveyError) throw surveyError;

      // 깔끔하게 임시 데이터 청소 및 현재 프로젝트 ID 세팅
      localStorage.removeItem('ep-temp-project-package');
      localStorage.setItem('ep-current-project-id', newProject.id);
    }

    // 대시보드가 로그인 상태를 인식하도록 처리
    localStorage.setItem('AUTH', 'true');
    toast('회원가입 및 선택하신 맞춤 설계안 저장이 완료되었습니다!');
    
    // 가입 완료 후 대시보드(home.html) 혹은 대시보드 인트로 페이지로 이동
    window.location.assign('home.html');

  } catch (err) {
    console.error('Supabase 비회원 데이터 통합 저장 에러:', err);
    toast(`저장 실패: ${err.message || err}`);
  }
}

//프로젝트 추가
async function addProject() {
 
  try {
    // reco-intro_new에서 임시 패킹해둔 [설문+설계안] 데이터 패키지 꺼내기
    const tempPackageRaw = localStorage.getItem('ep-temp-project-package');
	
	const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    // 로그인이 안 되어 있을 때 예외 처리
    if (authError || !user) {
      toast('로그인이 필요한 서비스입니다.');
      return;
    }
	
    if (tempPackageRaw) {
      const packageData = JSON.parse(tempPackageRaw);
      const surveyData = packageData.survey;
      const recoData = packageData.reco;
      
      const regionSi = surveyData.step1?.region_si || '';
      // 선택한 설계안 이름이 있다면 제목에 반영 (예: "서울 스마트팜 프로젝트 (딸기 컴팩트형)")
      const recoName = recoData?.title ? ` (${recoData.title})` : '';
      const projectName = regionSi ? `${regionSi} 스마트팜 프로젝트${recoName}` : `신규 스마트팜 프로젝트${recoName}`;

      // 3단계: projects 테이블에 마스터 행 추가 (선택한 설계안 정보인 recoData를 json 구조로 통째로 넣어 보관해도 좋습니다)
      const { data: newProject, error: projectError } = await supabaseClient
        .from('projects')
        .insert([{ 
          user_id: user.id, 
          name: projectName, 
          status: 'draft'
          // 만약 projects 테이블에 선택한 안을 저장하는 컬럼(예: selected_reco)을 만드셨다면 여기에 recoData를 넣으시면 됩니다.
        }])
        .select()
        .single();

      if (projectError) throw projectError;

      // 4단계: project_surveys 테이블에 상세 설문 데이터 매핑하여 추가
      const { error: surveyError } = await supabaseClient
        .from('project_surveys')
        .insert([
          {
            project_id: newProject.id,
            user_type: surveyData.step1?.user_type || null,
            region_si: surveyData.step1?.region_si || null,
            policy: surveyData.step1?.policy || null,
            loan_range: surveyData.step1?.loan_range || null,
            own_capital: surveyData.step1?.own_capital || null,
            facility: surveyData.step2?.facility || null,
            floor_area: surveyData.step2?.floor_area ? Number(surveyData.step2.floor_area) : null,
            usable_area: surveyData.step2?.usable_area ? Number(surveyData.step2.usable_area) : null,
            ceil_height: surveyData.step2?.ceil_height ? Number(surveyData.step2.ceil_height) : null,
            pillar_info: surveyData.step2?.pillar_info || null,
            entrance_path: surveyData.step2?.entrance_path || null,
            electric_power: surveyData.step2?.electric_power ? Number(surveyData.step2.electric_power) : null,
            electric_power_known: surveyData.step2?.electric_power_known || null,
            electric_phase: surveyData.step2?.electric_phase || null,
            panel_location: surveyData.step2?.panel_location || null,
            panel_location_known: surveyData.step2?.panel_location_known || null,
            water_supply: surveyData.step2?.water_supply || null,
            water_location: surveyData.step2?.water_location || null,
            water_location_known: surveyData.step2?.water_location_known || null,
            ventilation: surveyData.step2?.ventilation || null,
            work_hours: surveyData.step2?.work_hours || null,
            work_type: surveyData.step2?.work_type || null,
            family_staff: surveyData.step2?.family_staff ? parseInt(surveyData.step2.family_staff, 10) : null,
            profit_goal: surveyData.step3?.profit_goal || null,
            risk: surveyData.step3?.risk || null,
            distribution: surveyData.step3?.distribution || [],
            distribution_etc: surveyData.step3?.distribution_etc || null
          }
        ]);

      if (surveyError) throw surveyError;

      // 깔끔하게 임시 데이터 청소 및 현재 프로젝트 ID 세팅
      localStorage.removeItem('ep-temp-project-package');
      localStorage.setItem('ep-current-project-id', newProject.id);
    }
    
    window.location.assign('home.html');

  } catch (err) {
    console.error('Supabase 비회원 데이터 통합 저장 에러:', err);
    toast(`저장 실패: ${err.message || err}`);
  }
}


// =============================
//  홈 대시보드: Supabase에서 프로젝트 + 설문 데이터 불러오기
// =============================

// 1. 로그인한 유저의 프로젝트와 상세 설문(project_surveys) 데이터를 통째로 가져오는 함수
async function fetchProjects() {
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    const user = session?.user;
    if (!user) return [];

    // 홈 카드에는 projects 데이터만 필요합니다.
    // project_surveys 관계/RLS 오류가 프로젝트 목록 전체를 막지 않도록 조회를 분리합니다.
    const { data, error } = await supabaseClient
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }); // 최근 생성 순

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('프로젝트 데이터 fetch 에러:', err);
    return [];
  }
}

// 2. 서버에서 가져온 데이터로 홈 화면 UI를 동적으로 그려주는 함수
async function renderHomeProjects() {
  const listEl         = document.querySelector('#projectList');
  const emptyEl        = document.querySelector('#projectEmptyState');
  const statInProgress = document.querySelector('#statInProgress');
  const statCompleted  = document.querySelector('#statCompleted');

  if (!listEl) return; // home.html 대시보드 페이지가 아니면 패스

  // 로딩 표시 또는 비우기
  if (emptyEl) emptyEl.style.display = 'none';
  listEl.innerHTML = '<p class="project-loading">프로젝트를 불러오는 중입니다.</p>';

  // 💡 [핵심] 로컬스토리지 대신 Supabase 서버에서 real 데이터 받아오기!
  const projects = await fetchProjects();

  listEl.innerHTML = ''; // 로딩 문구 제거

  let inProgress = 0;
  let completed  = 0;

  // 프로젝트가 하나도 없으면 예외 처리
  if (!projects.length) {
    if (emptyEl) emptyEl.style.display = 'block';
    if (statInProgress) statInProgress.textContent = '0건';
    if (statCompleted)  statCompleted.textContent  = '0건';
    return;
  } else if (emptyEl) {
    emptyEl.style.display = 'none';
  }
	
	// 시설 유형 텍스트
  function facilityTypeFromReco(reco) {
    if (!reco) return '실내 스마트팜';
    const label = reco.facilityLabel || '';
    const title = reco.title || '';

    const base = label || title;

    if (base.includes('육묘') || base.includes('육묘장')) return '실내 육묘장';
    if (base.includes('조경') || base.includes('쇼룸'))  return '실내용 조경 스마트팜';
    return '실내 스마트팜';
  }

  // 상태 라벨 변환기
  function statusLabel(status) {
    switch (status) {
      case 'draft':            return '설계중';
      case 'quote_requested':  return '견적요청';
      case 'quote_review':     return '견적검토';
      case 'contracted':       return '계약체결';
      case 'construction':     return '시공';
      case 'operating':        return '운영중';
      case 'done':
      case 'complete':         return '완료';
      default:                 return '진행 중';
    }
  }

  // 다음 진행 액션 메시지
  function nextAction(status) {
    switch (status) {
      case 'draft':
      default:        return '다음 단계: 견적 요청하기';
      case 'quote_requested':        return '다음 단계: 견적 회신 확인하기';
      case 'quote_review':        return '다음 단계: 조건 협의 및 계약 체결';
      case 'contracted':        return '다음 단계: 착공 일정 확정하기';
      case 'construction':        return '다음 단계: 준공 및 인수인계';
      case 'operating':
      case 'done':
      case 'complete':
        return '완료: 운영 데이터 기록·모니터링';
    }
  }
  
  function buildProjectName(p) {
  const survey = p.survey || {};
  const s1 = p.step1 || {};
  const s2 = p.step2 || {};
  const reco = p.reco || {};

  // 1) 지역: "경기도 김포시" → "경기도 김포시" 또는 "김포시"로 줄이기
  let region = s1.region_si || '';
  if (region) {
    const parts = region.split(/\s+/); // ["경기도","김포시"]
    if (parts.length >= 2) {
      // 취향에 따라 둘 중 하나 골라 써
      // region = parts[0] + ' ' + parts[1];       // "경기도 김포시"
      region = parts[1];                           // "김포시" 처럼 더 짧게
    }
  }

  // 2) 시설 유형
  let facilityBase = '';
  switch (s2.facility) {
    case 'biz_center':
      facilityBase = '지식산업센터';
      break;
    case 'panel_factory':
      facilityBase = '판넬형 창고·공장';
      break;
    case 'retail_space':
      facilityBase = '상가/근린생활시설';
      break;
    default:
      facilityBase = '실내 공간';
      break;
  }

  // 3) 작목/용도에서 한 단어 뽑기
  const cropSource = (reco.cropType || reco.title || '');
  let cropWord = '스마트팜';

  if (cropSource.includes('엽채')) {
    cropWord = '엽채 스마트팜';
  } else if (cropSource.includes('허브')) {
    cropWord = '허브 스마트팜';
  } else if (cropSource.includes('육묘')) {
    cropWord = '육묘장';
  } else if (cropSource.includes('조경') || cropSource.includes('쇼룸')) {
    cropWord = '조경 스마트팜';
  }

  const parts = [];
  if (region) parts.push(region);
  if (facilityBase) parts.push(facilityBase);
  if (cropWord) parts.push(cropWord);

  const name = parts.join(' '); // "김포시 지식산업센터 엽채 스마트팜"

  // 혹시라도 다 비어있으면 reco.title로 폴백
  return name || '이름 없는 프로젝트';
}

  // Supabase에서 넘어온 프로젝트 배열 순회하며 카드 그리기
  projects.forEach(p => {

    const reco = p.reco || {};
    const status = p.status || 'draft';

    // ✅ 프로젝트명: reco-intro에서 선택한 설계안 제목
    const name = p.name || '이름 없는 프로젝트';

    // ✅ 시설 유형 텍스트
    const facilityText = facilityTypeFromReco(reco);

    // ✅ 상태 텍스트
    const statusText = statusLabel(status);

    // 진행/완료 카운트
    const isDone = ['operating', 'done', 'complete'].includes(status);
    if (isDone) completed++; else inProgress++;

    const nextText = nextAction(status);

    const card = document.createElement('article');
    card.className = 'project-card';
    card.style.cursor = 'pointer'; // 클릭 가능한 손가락 커서 명시
    
    // HTML 구조 렌더링 (a 태그 삭제로 안전성 확보)
    card.innerHTML = `
      <div class="project-main">
        <h3 class="project-name">${name}</h3>
        <div class="project-meta">
          <span><i data-lucide="building-2"></i> ${facilityText}</span>
          <span><i data-lucide="chart-no-axes-column-increasing"></i> ${statusText}</span>
        </div>
        <div class="project-next">
          ${nextText}
        </div>
      </div>
      <div class="project-tags">
        ${
          reco.estimatable === false
            ? '<span class="badge badge-gray"><i data-lucide="circle-help"></i>추가 상담 필요</span>'
            : '<span class="badge badge-green"><i data-lucide="check"></i>실내 전용</span><span class="badge badge-blue"><i data-lucide="link"></i>견적 연계 가능</span>'
        }
      </div>
    `;

    // 카드 클릭 이벤트 핸들러: ID 저장 보장 후 이동처리 (순서 정렬 완료 ⭐️)
    card.addEventListener('click', () => {
      localStorage.setItem('ep-current-project-id', p.id);
      window.location.href = 'project-detail.html';
    });

    listEl.appendChild(card);
  });

  // 상단 대시보드 통계판 수치 업데이트
  if (statInProgress) statInProgress.textContent = `${inProgress}건`;
  if (statCompleted)  statCompleted.textContent  = `${completed}건`;

  // 렌더가 끝난 뒤 한 번만 Lucide 아이콘을 생성합니다.
  if (window.lucide) {
    window.lucide.createIcons({ attrs: { 'aria-hidden': 'true' } });
  }
}


document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;

  // 홈(대시보드)일 때만 실행
  if (page === 'dashboard') {
    renderHomeProjects();

    // 버튼들 이벤트도 여기서 연결
    const btnNew = document.querySelector('#btnNewProject');
    const btnFirst = document.querySelector('#btnStartFirstProject');

    btnNew && btnNew.addEventListener('click', () => {
      // 새 설문 시작
      window.location.href = 'survey_new.html';
    });

    btnFirst && btnFirst.addEventListener('click', () => {
      window.location.href = 'survey.html';
    });
  }
});



// =============================
//  전역에 노출 (HTML에서 호출할 것들)
// =============================

Object.assign(window, {
  // 약관
  TERMS,
  openTerms,
  closeModal,
  toggleAllAgreements,
  syncAllAgree,
  updateTermsNext,

  // 인증
  handleLogin,
  isLoggedIn,

  // 회원가입
  validatePwSeq,
  filterPhone,
  saveBasic,

  // 기타 유틸
  toast
});
