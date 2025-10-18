// 주요 JS 함수 로드
window.addEventListener('DOMContentLoaded',()=>{
  console.log('IpiCare PWA Loaded');
  const toast = document.getElementById('toast');
  function showToast(msg){ toast.textContent=msg; toast.classList.add('show'); setTimeout(()=>toast.classList.remove('show'),1600) }

  // 기본 네비게이션 초기화 예시
  document.getElementById('header').innerHTML = '<div class="bar"><h1>IpiCare</h1><div class="grow"></div></div>';
  document.getElementById('main').innerHTML = '<div class="card pad">메인 컨텐츠</div>';
  document.getElementById('tabs').innerHTML = '<div class="bar"><button class="btn acc">홈</button></div>';

  // 설치 준비 테스트
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js').then(()=>console.log('SW registered'));
  }

  showToast('앱이 로드되었습니다');
});
