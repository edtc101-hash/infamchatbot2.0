---
name: git-teacher
description: Git 사용법 학습 및 튜토리얼을 한글로 제공하는 스킬
---

# Git Teacher 스킬

이 스킬은 Git 사용법을 한글로 학습할 수 있도록 도와줍니다. 사용자가 Git 관련 질문을 하면, 이 스킬의 내용을 기반으로 쉽고 친절하게 한글로 답변하세요.

---

## 📚 Git 기초 개념

### 저장소 (Repository)
- **로컬 저장소**: 내 컴퓨터에 있는 Git 프로젝트 폴더
- **원격 저장소**: GitHub, GitLab 등 서버에 있는 저장소
- `.git` 폴더가 있으면 Git 저장소입니다

### Git의 3가지 영역
```
작업 디렉터리 (Working Directory)
    ↓ git add
스테이징 영역 (Staging Area / Index)
    ↓ git commit
저장소 (Repository / .git)
```

### 파일 상태
| 상태 | 설명 |
|------|------|
| Untracked | Git이 추적하지 않는 새 파일 |
| Modified | 수정되었지만 아직 스테이징하지 않은 파일 |
| Staged | 다음 커밋에 포함될 파일 |
| Committed | 저장소에 안전하게 저장된 파일 |

---

## 🔧 자주 쓰는 Git 명령어

### 시작하기
```bash
# 새 저장소 만들기
git init

# 기존 저장소 복제하기
git clone <URL>

# 원격 저장소 연결하기
git remote add origin <URL>
```

### 기본 작업 흐름
```bash
# 현재 상태 확인
git status

# 변경사항 확인 (아직 스테이징 전)
git diff

# 파일 스테이징 (개별)
git add <파일명>

# 모든 변경사항 스테이징
git add .

# 커밋하기
git commit -m "커밋 메시지"

# 스테이징 + 커밋 한번에 (추적 중인 파일만)
git commit -am "커밋 메시지"
```

### 브랜치 관리
```bash
# 브랜치 목록 보기
git branch

# 새 브랜치 만들기
git branch <브랜치명>

# 브랜치 전환하기
git checkout <브랜치명>
# 또는 (최신 방식)
git switch <브랜치명>

# 새 브랜치 만들고 바로 전환
git checkout -b <브랜치명>
# 또는
git switch -c <브랜치명>

# 브랜치 병합 (현재 브랜치에 합치기)
git merge <브랜치명>

# 브랜치 삭제
git branch -d <브랜치명>
```

### 원격 저장소 연동
```bash
# 원격 저장소에 올리기
git push origin <브랜치명>

# 원격 저장소에서 가져오기
git pull origin <브랜치명>

# 원격 저장소 정보만 가져오기 (병합 안 함)
git fetch origin
```

### 히스토리 확인
```bash
# 커밋 로그 보기
git log

# 간략하게 보기
git log --oneline

# 그래프로 보기
git log --oneline --graph --all

# 특정 파일의 히스토리
git log -- <파일명>
```

---

## 🛠️ 문제 해결 가이드

### 커밋 되돌리기
```bash
# 마지막 커밋 메시지만 수정
git commit --amend -m "새 메시지"

# 마지막 커밋 취소 (변경사항 유지)
git reset --soft HEAD~1

# 마지막 커밋 취소 (변경사항도 스테이징 해제)
git reset HEAD~1

# ⚠️ 마지막 커밋 완전 삭제 (주의!)
git reset --hard HEAD~1
```

### 변경사항 되돌리기
```bash
# 특정 파일의 수정 취소 (스테이징 전)
git checkout -- <파일명>
# 또는
git restore <파일명>

# 스테이징 취소
git reset HEAD <파일명>
# 또는
git restore --staged <파일명>
```

### 충돌 해결 (Merge Conflict)
충돌이 발생하면 파일에 다음과 같은 표시가 나타납니다:
```
<<<<<<< HEAD
내 변경사항
=======
상대방 변경사항
>>>>>>> branch-name
```

**해결 방법:**
1. 충돌 파일을 열어서 `<<<<<<<`, `=======`, `>>>>>>>` 표시를 찾습니다
2. 원하는 내용만 남기고 표시를 삭제합니다
3. `git add <파일명>`으로 해결 완료 표시
4. `git commit`으로 병합 커밋 생성

### 임시 저장 (Stash)
```bash
# 현재 변경사항 임시 저장
git stash

# 임시 저장 목록 보기
git stash list

# 임시 저장 복원
git stash pop

# 특정 stash 복원
git stash apply stash@{번호}
```

---

## 📋 InFam Chatbot 2.0 프로젝트 Git 팁

이 프로젝트에서 Git을 사용할 때 참고하세요:

### .gitignore에 포함된 항목
- `node_modules/` — npm 패키지 (용량이 크므로 절대 커밋하지 마세요)
- `.env` — API 키 등 민감한 환경 변수
- `*.log` — 로그 파일
- `.DS_Store`, `Thumbs.db` — 운영체제 생성 임시 파일

### 권장 브랜치 전략
```
main          ← 안정된 배포 버전
├── develop   ← 개발 통합 브랜치
│   ├── feature/채팅UI-개선
│   ├── feature/RAG-최적화
│   └── feature/새기능-추가
└── hotfix/긴급수정
```

### 커밋 전 체크리스트
1. ✅ `.env` 파일이 커밋에 포함되지 않았는지 확인
2. ✅ `node_modules/`가 포함되지 않았는지 확인
3. ✅ `git status`로 불필요한 파일이 없는지 확인
4. ✅ 커밋 메시지가 변경 내용을 잘 설명하는지 확인

---

## 💡 학습 순서 추천

Git을 처음 배우는 경우 다음 순서로 학습하세요:

1. **1단계**: `git init`, `git add`, `git commit` — 기본 저장 흐름
2. **2단계**: `git status`, `git log`, `git diff` — 상태 확인
3. **3단계**: `git branch`, `git merge` — 브랜치 활용
4. **4단계**: `git remote`, `git push`, `git pull` — 원격 저장소
5. **5단계**: `git stash`, `git reset`, 충돌 해결 — 고급 기능

---

## 응답 지침

사용자가 Git 관련 질문을 할 때:
1. **항상 한글로** 답변하세요
2. **예제 명령어**를 함께 제공하세요
3. **현재 프로젝트 경로** (`c:\Users\kimdy\Desktop\Infam chatbot 2.0`)를 기준으로 설명하세요
4. 초보자에게는 **왜 그렇게 하는지** 이유도 설명해주세요
5. 위험한 명령어(예: `git reset --hard`)는 반드시 **⚠️ 경고**를 포함하세요
