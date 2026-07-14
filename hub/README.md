# 이피랑 운영센터 `/hub`

GitHub 또는 Netlify에 현재 앱과 함께 그대로 업로드할 수 있는 관리자 페이지입니다.

## 폴더 구조

```text
hub/
├─ login.html
├─ index.html
├─ members.html
├─ projects.html
├─ surveys.html
├─ templates.html
├─ analytics.html
├─ settings.html
├─ css/
│  └─ hub.css
├─ js/
│  └─ hub.js
└─ 00_hub_rls_v2.sql
```

## 배포

현재 사용자 앱 루트에 `hub` 폴더를 그대로 복사합니다.

```text
프로젝트 루트/
├─ home.html
├─ img/
│  └─ logo.png
└─ hub/
   ├─ index.html
   └─ ...
```

배포 후 주소:

```text
https://사이트주소/hub/login.html
```

`/hub/` 접속 시 자동으로 `index.html`이 열리는 호스팅 환경이라면 아래 주소도 가능합니다.

```text
https://사이트주소/hub/
```

## Supabase 설정

1. `00_hub_rls_v2.sql`을 Supabase SQL Editor에서 실행합니다.
2. 관리자 계정을 Authentication → Users에서 생성합니다.
3. 아래 SQL의 이메일을 실제 관리자 이메일로 변경해 실행합니다.

```sql
update public.profiles
set role='super_admin', is_active=true, updated_at=now()
where email='실제관리자이메일';
```

## 권한

- `user`: 일반 회원
- `manager`: 전체 데이터 조회
- `admin`: 전체 조회 + 회원·프로젝트·추천안 수정
- `super_admin`: 최고관리자

현재 화면은 `manager`, `admin`, `super_admin` 모두 로그인할 수 있습니다.
수정 기능은 RLS에서 `admin`, `super_admin`만 허용합니다.

## 보안

- `service_role` 키는 포함되어 있지 않습니다.
- 브라우저에는 기존 앱과 동일한 anon key만 사용합니다.
- 실제 권한은 Supabase RLS가 판단합니다.
- 관리자 계정은 강한 비밀번호와 별도 이메일 사용을 권장합니다.

## 현재 포함된 페이지

- 대시보드
- 회원 관리
- 프로젝트 관리
- 설문 관리
- 추천안 관리
- 통계·리포트
- 운영센터 설정

## 다음 확장 권장

현재 DB에 관련 테이블을 만든 뒤 다음 메뉴를 추가할 수 있습니다.

- 상담·견적 관리
- 공지사항 관리
- 운영 기록 관리
- 관리자 작업 로그
- 문의·CS 관리
