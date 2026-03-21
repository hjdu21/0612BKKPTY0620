# GitHub Pages 설정 가이드

## 🚀 빠른 시작 (3단계)

### 1단계: GitHub에 저장소 생성
1. GitHub 로그인: https://github.com/login
2. 우측 상단 `+` → `New repository` 클릭
3. Repository name: **0612BKKPTY0620** 입력
4. "Create repository" 클릭

### 2단계: 로컬에서 GitHub에 푸시 (SSH 권장)
```bash
# Git Bash 또는 PowerShell에서 실행
cd "c:\Users\hjdu2\OneDrive\Desktop\여행계획\0612BKKPTY0620"

# SSH 방식으로 저장소 설정 (권장 - 계정 충돌 없음)
git remote add origin git@github.com:hjdu21/0612BKKPTY0620.git

# main 브랜치로 푸시
git branch -M main
git push -u origin main
```

**Alternative (HTTPS):**
```bash
git remote add origin https://github.com/hjdu21/0612BKKPTY0620.git
git push -u origin main
```

### 3단계: GitHub Pages 활성화
1. GitHub에서 저장소 열기: https://github.com/hjdu21/0612BKKPTY0620
2. **Settings** 탭 클릭
3. 좌측 메뉴에서 **Pages** 클릭
4. "Build and deployment" 섹션에서:
   - **Source**: "Deploy from a branch" 선택
   - **Branch**: "main" 선택, 폴더 "(root)" 선택
5. **Save** 클릭

✅ 완료! 1-2분 후 아래 주소에서 확인 가능:
```
https://hjdu21.github.io/0612BKKPTY0620
```

---

## 📝 이전 푸켓 프로젝트와의 비교

### 이전 설정 (HYUNJIKIM0532 계정)
```
📍 URL: https://hyunjikim0532.github.io/phuket
```

### 지금 설정 (hjdu21 계정)
```
📍 URL: https://hjdu21.github.io/0612BKKPTY0620
```

같은 방식으로 설정되며, 계정과 저장소 이름만 다릅니다.

---

## 🔄 페이지 업데이트 방법

파일을 수정 후 GitHub에 푸시하면 자동으로 배포됩니다:

```bash
cd "c:\Users\hjdu2\OneDrive\Desktop\여행계획\0612BKKPTY0620"

# 파일 수정 후 실행
git add .
git commit -m "여행 일정 수정"
git push origin main

# 1-2분 후 https://hjdu21.github.io/0612BKKPTY0620 에 반영됨
```

---

## 🎯 주요 파일 설명

| 파일 | 설명 |
|------|------|
| `index.html` | 메인 페이지 (여행 일정, 활동 등) |
| `style.css` | 레이아웃 및 디자인 |
| `script.js` | 상호작용 기능 (스크롤 애니메이션 등) |
| `README.md` | GitHub 저장소 설명 |
| `.nojekyll` | GitHub Pages가 Jekyll 사용 안 함 (정적 파일 그대로 배포) |

---

## 🎨 자주 수정하는 내용

### 1️⃣ 여행 일정 변경 (index.html)
- Timeline 섹션의 Day 1-8 수정
- 각 활동의 날짜 및 내용 변경

### 2️⃣ 색상 변경 (style.css)
```css
/* 주 색상 변경 예시 */
.header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    /* ☝️ 이 색상들을 원하는 색으로 변경 */
}
```

색상 추천 사이트: [coolors.co](https://coolors.co)

### 3️⃣ 활동 추가 (index.html)
```html
<div class="activity">
    <h4>🏖️ 새로운 활동</h4>
    <p>활동 설명 입력</p>
</div>
```

---

## ❓ 자주 묻는 질문

### Q. GitHub Pages가 업데이트되지 않아요
**A.** 다음을 확인하세요:
1. `git push` 명령이 성공했는지 확인
2. GitHub 저장소에 파일이 올라갔는지 확인
3. 브라우저 캐시 삭제 (Ctrl+Shift+Del)
4. 5분 기다리기 (배포 시간이 걸림)

### Q. HTTPS 주소로는 접근이 안 돼요
**A.** GitHub Pages는 항상 HTTPS를 사용합니다. `https://` 프로토콜과 저장소 이름이 맞는지 확인하세요.

### Q. 커스텀 도메인을 사용하고 싶어요
**A.** Settings > Pages에서 "Custom domain" 옵션을 사용할 수 있습니다 (도메인 구매 필요).

### Q. .io 주소처럼 짧은 주소를 쓰고 싶어요
**A.** `hjdu2.github.io`라는 특수 저장소를 만들면 `hjdu2.github.io` URL을 사용할 수 있습니다 (이건 사용자 계정당 1개만 가능).

---

## 🔧 고급: 자동 배포 (선택사항)

GitHub Actions를 사용해서 자동 배포를 설정할 수 있습니다 (현재 프로젝트는 수동 푸시만으로도 충분).

---

## 💡 팁

- 로컬에서 먼저 테스트: `index.html`을 브라우저에서 열어보세요
- 모바일도 확인: 반응형 디자인 적용됨
- 인쇄 가능: Ctrl+P로 PDF 저장 가능

---

## 🎓 학습용 참고 자료

- GitHub Pages 공식 문서: https://pages.github.com/
- Git 기초 배우기: https://git-scm.com/book/ko
- HTML/CSS/JS 배우기: https://www.w3schools.com/

---

**행운을 빕니다! 즐거운 여행 되세요! 🌴✈️**
