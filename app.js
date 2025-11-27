// =============================
//  공통 키 & 유틸
// =============================

// ep- 로 요약한 로컬스토리지 키들
const K = {
  BASIC:    'ep-basic',     // 회원 기본 정보 (userid, pw, phone 등)
  PROJECTS: 'ep-projects'   // 나중에 프로젝트 리스트 쓸 때 사용
};

// 인증 상태용 (index.html 에서 쓰는 AUTH 그대로 유지)
const KA = {
  AUTH: 'AUTH'
};

// DOM 헬퍼
function $(sel)  { return document.querySelector(sel); }
function $$(sel) { return Array.from(document.querySelectorAll(sel)); }

// localStorage read/save
function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('[read] fail', key, e);
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('[save] fail', key, e);
  }
}

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

function setAuth(data) {
  const prev = getAuth() || {};
  const next = { ...prev, ...data };
  save(KA.AUTH, next);
}

function getAuth() {
  return read(KA.AUTH, null);
}

function isLoggedIn() {
  const a = getAuth();
  return !!(a && a.loggedIn);
}

// =============================
//  로그인 처리 (login.html)
// =============================

function handleLogin(e) {
  e.preventDefault();
  const id = e.target.userid.value.trim();
  const pw = e.target.password.value.trim();

  if (!id || !pw) {
    toast('아이디/비밀번호를 입력하세요');
    return;
  }

  const basic = read(K.BASIC, null);

  if (basic && basic.userid === id && basic.pw === pw) {
    setAuth({ loggedIn: true, userId: id });
    toast('로그인 되었습니다.');
    // 로그인 성공 후 대시보드(메인)로 이동
    window.location.assign('index.html');
  } else {
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

// 약관 전문 모달 열기
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
  const agreeService = $('#agreeService')?.checked;
  const agreePrivacy = $('#agreePrivacy')?.checked;

  if (!agreeService || !agreePrivacy) {
    // survey에서 쓰던 느낌 그대로 모달로 안내
    openTerms(
      '동의가 필요합니다',
      '서비스 이용약관과 개인정보 수집·이용에 모두 동의해 주세요.\n\n필수 항목을 체크한 후 다음 단계로 진행할 수 있습니다.'
    );
    return;
  }

  // 두 개 다 체크된 경우에만 다음 페이지로 이동
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
function saveBasic() {
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

  const basicData = Object.fromEntries(f.entries());

  // 기본 정보 저장
  save(K.BASIC, basicData);

  // 로그인 상태로 전환
  setAuth({ loggedIn: true, userId: basicData.userid });

  toast('회원가입이 완료되었습니다.');

  // 회원가입 완료 후 메인 대시보드로 이동
  window.location.assign('index.html');
}

// =============================
//  홈 대시보드: 프로젝트 불러오기
// =============================
// =============================
//  홈 대시보드: 프로젝트 불러오기
// =============================
function renderHomeProjects() {
  const key = K.PROJECTS; // 'ep-projects'
  const projects = read ? read(key, []) : JSON.parse(localStorage.getItem(key) || '[]');

  const listEl         = document.querySelector('#projectList');
  const emptyEl        = document.querySelector('#projectEmptyState');
  const statInProgress = document.querySelector('#statInProgress');
  const statCompleted  = document.querySelector('#statCompleted');

  if (!listEl) return; // home.html이 아닐 때

  // 리스트 비우기
  listEl.innerHTML = '';

  let inProgress = 0;
  let completed  = 0;

  // 없으면 비어있는 상태 노출
  if (!projects.length) {
    if (emptyEl) emptyEl.style.display = 'block';
    if (statInProgress) statInProgress.textContent = '0건';
    if (statCompleted)  statCompleted.textContent  = '0건';
    return;
  } else if (emptyEl) {
    emptyEl.style.display = 'none';
  }

  // 시설 유형 텍스트 (아이콘 옆에 나올 것)
  function facilityTypeFromReco(reco) {
    if (!reco) return '실내 스마트팜';
    const label = reco.facilityLabel || '';
    const title = reco.title || '';

    const base = label || title;

    if (base.includes('육묘') || base.includes('육묘장')) return '실내 육묘장';
    if (base.includes('조경') || base.includes('쇼룸'))  return '실내용 조경 스마트팜';
    return '실내 스마트팜';
  }

  // 상태 라벨
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

  // 다음 액션 문구
  function nextAction(status) {
    switch (status) {
      case 'draft':
      default:
        return '다음 단계: 견적 요청하기';
      case 'quote_requested':
        return '다음 단계: 견적 회신 확인하기';
      case 'quote_review':
        return '다음 단계: 조건 협의 및 계약 체결';
      case 'contracted':
        return '다음 단계: 착공 일정 확정하기';
      case 'construction':
        return '다음 단계: 준공 및 인수인계';
      case 'operating':
      case 'done':
      case 'complete':
        return '완료: 운영 데이터 기록·모니터링';
    }
  }
  
  // 홈에서 보여줄 "사람이 읽기 쉬운" 프로젝트명 만들기
function buildProjectName(p) {
  const survey = p.survey || {};
  const s1 = survey.step1 || {};
  const s2 = survey.step2 || {};
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
  return name || reco.title || '이름 없는 프로젝트';
}


  projects.forEach(p => {
    const reco = p.reco || {};
    const status = p.status || 'draft';

    // ✅ 프로젝트명: reco-intro에서 선택한 설계안 제목
    const name = reco.title || '이름 없는 프로젝트';

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

    // home.html에서 쓰는 아이콘/클래스 구조에 맞춰서 렌더링 :contentReference[oaicite:5]{index=5}
    card.innerHTML = `
      <a href="project-detail.html"><div class="project-main">
        <h3 class="project-name">${name}</h3>
        <div class="project-meta">
          <span><i class="far fa-building"></i> ${facilityText}</span>
          <span><i class="fas fa-chart-line"></i> ${statusText}</span>
        </div>
        <div class="project-next">
          ${nextText}
        </div>
      </div>
      <div class="project-tags">
        ${
          reco.estimatable === false
            ? '<span class="badge badge-gray">추가 상담 필요</span>'
            : '<span class="badge badge-green">실내 전용</span><span class="badge badge-gray">견적 연계 가능</span>'
        }
      </div></a>
    `;

    // 카드 클릭 시 해당 프로젝트 상세로
    card.addEventListener('click', () => {
      localStorage.setItem('ep-current-project-id', p.id);
      // 너가 만든 상세 페이지 이름에 맞게 수정 (예: project-detail.html)
      window.location.href = 'project-detail.html';
    });

    listEl.appendChild(card);
  });

  // 통계 텍스트 갱신
  if (statInProgress) statInProgress.textContent = `${inProgress}건`;
  if (statCompleted)  statCompleted.textContent  = `${completed}건`;
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
      window.location.href = 'survey.html';
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

  // 기타 유틸 (필요하면 직접 쓰도록)
  toast,
  read,
  save
});

