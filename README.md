# Love Link - 결혼식 청첩장 사이트

## 방명록 설정 방법

### Firebase Realtime Database를 이용한 방명록 저장

이 사이트는 방명록을 Firebase Realtime Database에 저장하여 **모든 환경에서 동일한 방명록을 공유**할 수 있습니다.

#### 1. Firebase 프로젝트 생성
1. [Firebase Console](https://console.firebase.google.com/)에 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름 입력 (예: lovelnk-guestbook)
4. Google Analytics 설정 (선택사항)

#### 2. Realtime Database 설정
1. Firebase Console에서 "Realtime Database" 선택
2. "데이터베이스 만들기" 클릭
3. **테스트 모드로 시작** 선택 (나중에 보안 규칙 설정 가능)
4. 지역 선택 (asia-southeast1 권장)

#### 3. Firebase 설정 정보 복사
1. Firebase Console에서 ⚙️ > "프로젝트 설정" 클릭
2. "일반" 탭에서 "웹 앱에 Firebase 추가" 클릭
3. 앱 이름 입력 후 등록
4. **firebaseConfig 객체 복사**

#### 4. 코드 설정 수정
`index.html` 파일의 `firebaseConfig` 부분을 수정하세요:

```javascript
const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "your-project.firebaseapp.com",
    databaseURL: "https://your-project-default-rtdb.firebaseio.com/",
    projectId: "your-project",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "your-app-id"
};
```

#### 5. 보안 규칙 설정 (선택사항)
Firebase Console > Realtime Database > 규칙에서:

```json
{
  "rules": {
    "guestbook": {
      ".read": true,
      ".write": true
    }
  }
}
```

### GitHub Pages 배포

1. 저장소를 GitHub에 푸시
2. Settings > Pages에서 배포 설정
3. Source를 "Deploy from a branch" 선택
4. Branch를 "main" 선택

## 방명록 작동 방식

- 방명록 작성 시 **Firebase Realtime Database**에 실시간 저장됩니다
- **모든 환경에서 동일한 방명록 공유**: PC↔모바일, 서울↔미국 등
- Firebase 연결 실패 시 로컬스토리지에 백업 저장됩니다
- 실시간 동기화로 새 방명록이 즉시 모든 사용자에게 표시됩니다

## 주요 기능

- ✅ **실시간 방명록 공유** (Firebase Realtime Database)
- ✅ 방명록 작성/수정/삭제
- ✅ 로컬스토리지 백업 시스템
- ✅ 반응형 디자인
- ✅ GitHub Pages 호환
- ✅ 모든 환경에서 동일한 데이터 표시

## 환경별 테스트

Firebase 설정 완료 후:
1. **PC에서 방명록 작성** → 모바일에서 즉시 확인 가능
2. **다른 브라우저에서 접속** → 동일한 방명록 표시
3. **다른 지역에서 접속** → 모든 방명록 동기화