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
  service: `[이피랑 서비스 이용약관]

제1조 목적
본 약관은 주식회사 이피랑(이하 ‘회사’)이 제공하는 이피랑 웹·모바일 서비스(이하 ‘서비스’)의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 정하는 것을 목적으로 합니다.

제2조 용어의 정의
1. ‘서비스’란 이용자가 입력한 창업 조건, 시설 조건 및 운영 계획 등을 바탕으로 스마트팜 설계안을 추천하고, 프로젝트·기록·설비 레시피·리마인더·데이터 브리핑·견적 상담 등의 기능을 제공하는 서비스를 말합니다.
2. ‘이용자’란 본 약관에 동의하고 서비스를 이용하는 자를 말합니다.
3. ‘회원’이란 이메일 주소 등 필요한 정보를 등록하여 계정을 생성한 이용자를 말합니다.
4. ‘추천 설계안’이란 이용자가 입력한 조건과 회사가 보유한 추천 기준 및 템플릿을 바탕으로 제공되는 참고용 결과를 말합니다.
5. ‘프로젝트’란 이용자가 선택하거나 저장한 설계안과 관련된 조건, 기록, 진행 상태 및 상담 내용을 말합니다.

제3조 약관의 게시 및 변경
1. 회사는 이용자가 본 약관을 확인할 수 있도록 서비스 가입 또는 이용 화면에 게시합니다.
2. 회사는 관련 법령을 위반하지 않는 범위에서 본 약관을 변경할 수 있습니다.
3. 이용자에게 불리하거나 중요한 내용이 변경되는 경우 회사는 적용일과 변경 사유를 명시하여 적용일 7일 전까지 서비스 화면 또는 전자우편 등의 방법으로 안내합니다. 이용자에게 중대한 불이익이 발생하는 변경은 적용일 30일 전부터 안내합니다.
4. 이용자가 변경된 약관에 동의하지 않는 경우 서비스 이용을 중단하고 회원 탈퇴를 요청할 수 있습니다.

제4조 서비스 이용계약
1. 이용계약은 이용자가 본 약관과 개인정보 수집 및 이용에 동의하고 회원가입 절차를 완료한 때 성립합니다.
2. 이용자는 정확하고 최신의 정보를 입력해야 합니다.
3. 타인의 정보 사용, 허위 정보 입력, 서비스 운영을 방해할 목적의 가입이 확인되는 경우 회사는 가입을 제한하거나 이용계약을 해지할 수 있습니다.

제5조 서비스의 내용
회사는 다음 서비스를 제공할 수 있습니다.
1. 창업 유형, 지역, 시설, 면적, 층고, 전기, 급·배수, 예산, 근무시간, 인력, 목표 수익 및 유통 방식 등에 따른 스마트팜 설계안 추천
2. 추천 설계안의 저장 및 프로젝트 생성
3. 프로젝트 진행 단계와 기록 관리
4. 설비 구성 및 레시피 정보 제공
5. 정책·상담·견적 등 주요 일정 알림
6. 유사 조건의 투자비·운영비·수익 관련 참고 정보 제공
7. 스마트팜 제조·설치·견적 상담 연결
8. 그 밖에 회사가 정하는 관련 서비스

제6조 추천 정보의 성격
1. 서비스에서 제공하는 추천 설계안, 적합도, 이미지, 예상 투자 범위, 예상 인력, 예상 수익 및 설비 구성은 이용자의 의사결정을 돕기 위한 참고 정보입니다.
2. 추천 설계안의 이미지는 이해를 돕기 위한 예시 이미지이며 실제 설계 및 시공 형태와 다를 수 있습니다.
3. 추천 결과는 현장 상태, 건축물 용도, 구조 안전성, 전기 용량, 급·배수 환경, 소방·인허가 조건, 자재 가격, 작물 생육환경 및 유통 여건 등을 모두 반영한 확정 설계가 아닙니다.
4. 실제 시공 가능 여부, 공사 범위, 자재 사양, 금액 및 일정은 현장 확인과 별도의 상세 설계·견적·계약을 통해 확정됩니다.
5. 서비스에서 설계안을 선택하거나 저장하는 행위만으로 제조·설치·시공 계약이 체결되는 것은 아닙니다.

제7조 이용자의 의무
이용자는 다음 행위를 해서는 안 됩니다.
1. 허위 정보 또는 타인의 정보를 입력하는 행위
2. 다른 회원의 계정이나 개인정보를 무단으로 사용하는 행위
3. 서비스의 정상적인 운영을 방해하거나 보안 체계를 우회하는 행위
4. 서비스의 화면, 데이터, 추천 기준 또는 프로그램을 무단으로 복제·수집·배포·판매하는 행위
5. 자동화된 프로그램을 이용해 비정상적으로 접속하거나 데이터를 수집하는 행위
6. 관계 법령 또는 공공질서에 위반되는 행위
7. 회사 또는 제3자의 권리를 침해하는 행위

제8조 계정 관리
1. 이용자는 자신의 계정과 비밀번호를 안전하게 관리해야 합니다.
2. 계정의 도용이나 무단 사용을 알게 된 경우 즉시 회사에 알려야 합니다.
3. 이용자의 관리 소홀로 발생한 손해에 대하여 회사는 회사의 고의 또는 중대한 과실이 없는 한 책임을 부담하지 않습니다.

제9조 서비스의 변경 및 중단
1. 회사는 운영상 또는 기술상 필요한 경우 서비스의 일부를 변경할 수 있습니다.
2. 시스템 점검, 장애, 통신망 문제, 천재지변 또는 외부 서비스 제공자의 장애 등 불가피한 사유가 있는 경우 서비스가 일시적으로 중단될 수 있습니다.
3. 회사는 예정된 점검이나 중대한 서비스 변경이 있는 경우 가능한 범위에서 사전에 안내합니다.

제10조 지식재산권
1. 서비스에 포함된 프로그램, 디자인, 추천 기준, 설계 템플릿, 데이터 구조, 이미지, 문서 및 콘텐츠에 관한 권리는 회사 또는 정당한 권리자에게 있습니다.
2. 이용자는 서비스를 개인적인 검토와 상담 목적으로 이용할 수 있으며 회사의 사전 동의 없이 이를 복제, 수정, 판매, 재배포하거나 상업적으로 이용할 수 없습니다.
3. 이용자가 직접 입력한 정보에 대한 권리는 이용자에게 있습니다. 다만 회사는 서비스 제공, 추천 결과 생성, 오류 개선 및 프로젝트 관리를 위해 필요한 범위에서 해당 정보를 처리할 수 있습니다.

제11조 이용 제한 및 계약 해지
1. 이용자가 본 약관 또는 관련 법령을 위반한 경우 회사는 사전 안내 후 서비스 이용을 제한하거나 이용계약을 해지할 수 있습니다.
2. 보안 침해, 타인 계정 도용 또는 서비스에 중대한 피해가 예상되는 경우 회사는 우선 이용을 제한한 후 그 사유를 안내할 수 있습니다.
3. 이용자는 서비스의 회원 탈퇴 기능 또는 고객센터를 통해 이용계약 해지를 요청할 수 있습니다.

제12조 책임의 범위
1. 회사는 서비스의 안정적인 제공을 위해 합리적인 노력을 다합니다.
2. 회사는 추천 결과가 이용자의 모든 조건에 부합하거나 특정 수익, 정책자금 선정, 인허가 취득, 시공 가능성 또는 사업 성공을 보장하지 않습니다.
3. 이용자는 실제 투자·계약·시공 전에 현장조사, 법령 검토 및 전문가 상담을 받아야 합니다.
4. 회사의 고의 또는 과실로 이용자에게 손해가 발생한 경우 회사는 관련 법령에 따라 책임을 부담합니다.
5. 이용자의 허위 정보, 입력 오류, 계정 관리 소홀 또는 서비스 안내와 다른 사용으로 발생한 손해에 대해서는 회사의 책임이 제한될 수 있습니다.

제13조 분쟁 해결
1. 회사와 이용자는 서비스 이용과 관련하여 발생한 분쟁을 원만하게 해결하기 위해 노력합니다.
2. 본 약관은 대한민국 법령을 따릅니다.
3. 분쟁에 관한 소송은 민사소송법에 따른 관할 법원에 제기합니다.

부칙
본 약관은 2025.08.01 부터 시행합니다.`,

  privacy: `[개인정보 수집 및 이용 동의]

주식회사 이피랑은 이피랑 서비스의 회원가입, 맞춤형 스마트팜 설계안 추천 및 프로젝트 관리를 위해 다음과 같이 개인정보를 수집·이용합니다.

1. 개인정보의 수집·이용 목적

가. 회원가입 및 계정 관리
- 회원 식별 및 인증
- 계정 생성과 로그인
- 회원 문의 및 불만 처리
- 부정 이용 방지 및 서비스 보안

나. 맞춤형 설계안 추천
- 이용자가 입력한 창업·시설·운영 조건 분석
- 조건에 적합한 스마트팜 설계안 및 설비 구성 추천
- 추천 적합도와 추천 이유 제공

다. 프로젝트 및 상담 관리
- 선택 설계안 저장과 프로젝트 생성
- 프로젝트 진행 내역 및 기록 관리
- 견적·설치·시공 상담 요청 확인 및 연락
- 주요 일정 및 리마인더 제공

라. 서비스 개선
- 오류 확인 및 서비스 안정성 개선
- 개인을 직접 식별하지 않는 통계 작성 및 서비스 이용 분석

2. 수집하는 개인정보 항목

가. 회원가입 정보
- 필수: 이메일 주소, 비밀번호, 휴대전화번호
- 비밀번호는 인증 시스템에서 암호화하여 관리됩니다.

나. 설문 및 추천 정보
- 필수: 창업 유형, 지역, 정책자금 대상 여부, 희망 대출 규모, 자기자본 범위
- 필수: 시설 유형, 시설 면적, 층고, 전기·분전반·급수·배수·환기 등 시설 조건
- 필수: 근무 가능 시간, 운영 형태, 가족 인력, 함께 일하는 인원
- 필수: 목표 수익, 위험 선호도, 희망 유통 방식
- 이용자가 직접 입력한 기타 시설 및 유통 관련 내용

다. 서비스 이용 과정에서 자동으로 생성될 수 있는 정보
- 접속 일시, 접속 기록, IP 주소, 브라우저 및 기기 정보
- 서비스 이용기록, 페이지 열람 및 기능 사용기록
- 오류 및 보안 관련 기록

3. 개인정보의 보유 및 이용기간

가. 회원 및 프로젝트 정보
- 회원 탈퇴 시까지 보유·이용합니다.

나. 회원 탈퇴 후 처리
- 회원 탈퇴 또는 개인정보 수집·이용 목적 달성 시 지체 없이 파기합니다.
- 관계 법령에 따라 일정 기간 보관할 의무가 있는 경우 해당 법령에서 정한 기간 동안 별도로 보관한 후 파기합니다.
- 분쟁 또는 민원 처리 중인 경우 해당 업무가 완료될 때까지 필요한 범위에서 보관할 수 있습니다.

4. 개인정보 수집 및 이용 동의 거부 권리

이용자는 개인정보 수집 및 이용에 대한 동의를 거부할 권리가 있습니다.

다만 필수 개인정보 수집 및 이용에 동의하지 않을 경우 회원가입, 맞춤형 설계안 추천, 프로젝트 저장 및 서비스 이용이 제한될 수 있습니다.

5. 개인정보의 제3자 제공

회사는 이용자의 개인정보를 원칙적으로 제3자에게 제공하지 않습니다.

스마트팜 제조·설치·견적 상담 등을 위해 협력업체에 개인정보를 제공할 필요가 있는 경우 제공받는 자, 제공 목적, 제공 항목 및 보유기간을 이용자에게 별도로 안내하고 동의를 받습니다.

6. 개인정보 처리업무의 위탁

회사는 인증, 데이터 저장, 호스팅 및 서비스 운영을 위해 외부 전문 서비스를 이용할 수 있습니다.

개인정보 처리업무를 위탁하는 경우 관련 법령에 따라 수탁자와 위탁업무의 내용을 개인정보 처리방침을 통해 공개하고 필요한 보호조치를 시행합니다.

7. 이용자의 권리

이용자는 회사에 본인의 개인정보에 대한 열람, 정정, 삭제, 처리정지 및 회원 탈퇴를 요청할 수 있습니다.

요청은 서비스 내 설정 또는 아래 개인정보 문의처를 통해 할 수 있으며, 회사는 관련 법령에 따라 지체 없이 처리합니다.

개인정보 침해에 관한 상담이 필요한 경우 개인정보침해신고센터(국번 없이 118) 또는 개인정보분쟁조정위원회(1833-6972)에 문의할 수 있습니다.

본 동의서는 2025.08.01 부터 적용합니다.`
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
