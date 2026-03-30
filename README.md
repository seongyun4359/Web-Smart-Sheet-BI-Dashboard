# Smart-Sheet BI Dashboard

엑셀 데이터를 불러와 AG Grid로 편집하고, 같은 Pinia 상태를 기준으로 JSON 미리보기와 차트를 함께 확인하는 Vue 3 대시보드입니다.

## 현재 기능
- `.xlsx`, `.xls` 파일 업로드와 드래그 앤 드롭 지원
- 통합문서 내 여러 시트 탐색 및 시트 전환
- AG Grid 기반 표 편집
- 셀 수정, 행 추가, 선택 행 삭제
- 실행 취소 / 다시 실행
- JSON 미리보기
- 막대 차트 시각화
- 기본 데이터 검증 패널 표시
- 편집 결과를 엑셀 파일로 다시 내보내기
- 샘플 데이터 즉시 로드
- 설정 페이지 제공
- 앱 제목 변경
- `system / light / dark` 테마 전환
- 첫 데이터 열 잠금 기본값 저장
- 설정 적용 / 기본값 복원 시 토스트 피드백
- 설정값 `localStorage` 저장 및 재방문 유지

## 화면 구성
- `/`: 엑셀 업로드, 데이터 편집, JSON 미리보기, 차트 확인
- `/settings`: UI 설정과 대시보드 기본값 관리

## 기술 스택
- Vue 3
- TypeScript
- Vite
- Pinia
- Vue Router
- AG Grid
- Chart.js
- xlsx
- Tailwind CSS v4
- Vitest

## 시작하기
```bash
npm install
npm run dev
```

## 스크립트
```bash
npm run dev
npm run build
npm run preview
npm run test
npm run test:run
```

## 테스트
현재 아래 영역에 대한 단위 테스트가 포함되어 있습니다.

- 샘플 데이터 생성
- 시트 컬럼 타입 추정
- 데이터 검증
- xlsx 처리
- 설정 저장 / 복원
- 토스트 동작
