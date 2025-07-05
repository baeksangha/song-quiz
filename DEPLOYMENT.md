# Song Quiz 배포 가이드

## Vercel 배포 방법

### 1. 백엔드 배포 (Railway 추천)

1. **Railway 계정 생성**: https://railway.app
2. **GitHub 연동**: Railway에서 GitHub 저장소 연결
3. **백엔드 배포**:
   - Railway 대시보드에서 "New Project" 클릭
   - "Deploy from GitHub repo" 선택
   - 저장소 선택 후 `backend` 폴더 선택
   - 환경변수 설정:
     ```
     PORT=4000
     ```
   - 배포 완료 후 URL 복사 (예: `https://your-app.railway.app`)

### 2. 프론트엔드 배포 (Vercel)

1. **Vercel 계정 생성**: https://vercel.com
2. **GitHub 연동**: Vercel에서 GitHub 저장소 연결
3. **프로젝트 설정**:
   - Framework Preset: `Create React App`
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `build`
4. **환경변수 설정**:
   ```
   REACT_APP_WS_URL=wss://your-backend-url.railway.app
   ```
   (백엔드 URL의 `https://`를 `wss://`로 변경)
5. **배포**: Deploy 클릭

### 3. CORS 설정 (백엔드)

백엔드의 `index.js`에서 CORS 설정을 수정:

```javascript
app.use(cors({
  origin: ['https://your-frontend-url.vercel.app'],
  credentials: true
}));
```

### 4. 배포 후 확인사항

1. **WebSocket 연결**: 브라우저 개발자 도구에서 WebSocket 연결 확인
2. **게임 기능**: 방 생성, 입장, 게임 시작 테스트
3. **실시간 통신**: 여러 브라우저에서 동시 접속 테스트

## 문제 해결

### WebSocket 연결 실패
- 백엔드 URL이 올바른지 확인
- `wss://` 프로토콜 사용 확인
- CORS 설정 확인

### 환경변수 문제
- Vercel 대시보드에서 환경변수 재설정
- 빌드 후 재배포

### 배포 후 기능 테스트
1. 방 생성/입장
2. 게임 시작
3. 노래 재생
4. 정답 제출
5. 힌트 표시
6. 실시간 점수 업데이트 