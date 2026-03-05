// 인팸 AI 챗봇 프론트엔드 - v2.0 완전 재구축
// 7가지 핵심 기능: AI 답변, 지식 베이스, FAQ 매칭, 대화 히스토리, 빠른 질문, 연락처, 바로가기

const API_URL = '/api/chat';
const sessionId = 'session_' + Math.random().toString(36).substring(2);
let isLoading = false;
let messageCount = 0;

const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');

// 링크 메타데이터
const LINK_META = {
    'figma.com': { icon: '📐', label: '시공 가이드 보기' },
    'drive.google.com': { icon: '📋', label: '카탈로그/자료 보기' },
    'notion.so': { icon: '📸', label: '시공 사례 보기' },
    'youtube.com': { icon: '🎥', label: '유튜브 영상 보기' },
    'instagram.com': { icon: '📸', label: '인스타그램 보기' },
    'naver.me': { icon: '📍', label: '지도 바로가기' },
    'cafe24.com': { icon: '✨', label: '샘플 구매하기' },
    'inpock.co.kr': { icon: '🔗', label: '카탈로그 모음 보기' },
    'infamglobal.com': { icon: '🌐', label: '홈페이지 가기' },
    'buly.kr': { icon: '✨', label: '샘플 구매하기' },
};

function getLinkMeta(url) {
    const domain = Object.keys(LINK_META).find(d => url.includes(d));
    return domain ? LINK_META[domain] : { icon: '🔗', label: '바로가기' };
}

function getLinkName(url, surroundingText) {
    const patterns = [
        { match: /소프트.?스톤.*시공|시공.*소프트.?스톤/, name: '소프트 스톤 시공 가이드' },
        { match: /WPC.*시공|시공.*WPC|월패널.*시공/, name: 'WPC 월패널 시공 가이드' },
        { match: /카빙.*시공|시공.*카빙/, name: '카빙 스톤 시공 가이드' },
        { match: /스텐.*시공|시공.*스텐/, name: '스텐 플레이트 시공 가이드' },
        { match: /크리스탈.*시공|시공.*크리스탈/, name: '크리스탈 블럭 시공 가이드' },
        { match: /시멘트.*시공|시공.*시멘트/, name: '시멘트 블럭 시공 가이드' },
        { match: /재고/, name: '재고 현황표 (당일 배송 확인)' },
        { match: /샘플/, name: '샘플 구매 바로가기' },
        { match: /지도|쇼룸|위치/, name: '쇼룸 위치 (네이버 지도)' },
        { match: /시공.?사례|사례/, name: '시공 사례 갤러리' },
        { match: /유튜브/, name: '유튜브 채널' },
        { match: /인스타/, name: '인스타그램' },
        { match: /카탈로그|카탈/, name: '카탈로그 보기' },
    ];
    for (const p of patterns) {
        if (p.match.test(surroundingText)) return p.name;
    }
    return getLinkMeta(url).label;
}
// URL 유효성 검사
function isValidUrl(url) {
    try {
        const u = new URL(url);
        if (!u.hostname.includes('.')) return false;
        if (u.hostname.length < 4) return false;
        const validDomains = ['figma.com', 'drive.google.com', 'notion.so', 'youtube.com', 'youtu.be',
            'instagram.com', 'naver.me', 'cafe24.com', 'inpock.co.kr', 'infamglobal.com', 'buly.kr',
            'google.com', 'naver.com', 'kakao.com'];
        const isKnown = validDomains.some(d => u.hostname.includes(d));
        return isKnown || url.length >= 25;
    } catch {
        return false;
    }
}

// URL → 이름 직접 매핑 (Google Drive 파일 ID 기반)
const KNOWN_URL_NAMES = {
    // 카탈로그
    '1DhpjbpkCQQyw9j-q1RGvhQ5Yf436E6uR': '인팸 월패널 카탈로그',
    '17BugkibGu-LGP-norCf4X3X_EQfY0d1w': 'WPC/SPC 월패널 카탈로그',
    '1qxKnYksEV9K8ZC77taQHjKb6CjINW6DQ': '카빙 스톤 카탈로그',
    '1xG1LehNxCCaojPaszL3TQHw5MUW_PAoT': '소프트 스톤 카탈로그',
    '1AgZiGb1HhlLCTO0cFXtsufaOTjUuTTsj': '라이트 스톤 카탈로그',
    '1UMyjUbApBi7NzN-BRPGtZ6dMjSZ-dqq4': '인팸 스톤 카탈로그',
    '14z48YrSdruEsD3yb8KKiz5wnkWTEjcXG': '스텐 플레이트 카탈로그',
    '1YDc4bJViOKKYoHmZP_a-KZxCH25Txe9D': '크리스탈 블럭 카탈로그',
    '1TxWqYVf8HmRtHoJx2DIeQ7tflqe-2yew': '아이스 플레이트 카탈로그',
    '1IJ9GzJNPHfdAONfwlH3lW2o35E_-mZLG': '아크릴 플레이트 카탈로그',
    '1AXmkXcqt5ZohC22iMsECrZqsiSqI9RR6': '시멘트 블럭 카탈로그',
    '1-cHqNT1Treb_8qg3z7uGC-iQre0pGDRO': '스타 스톤 카탈로그',
    '1JLg8ntfBKLzruBlObTNzxivj2e5w7NQP': '하드 스톤 카탈로그',
    '1SNrQblpUrlSAhgZZ63o274xtKyCBkV-q': '노이즈 템바보드 카탈로그',
    '1ZtEa5n3Yqt3Cn4OJ4xWC9kG2YF8hQ5Jk': '브릭 스톤 카탈로그',
    '18L3mmP9Mrh6wCuwckFrscP7s9BYUoSPH': '플로우 메탈 카탈로그',
    '17ABwLtSQ4cSicq36fZEPN4-RqYOogxwp': '3D 블럭 카탈로그',
    '1jyndgTRs1jFz8M6FK6g3pKws0xP1RzcK': '오로라 스톤 카탈로그',
    '1eu2LI2TReLFnvhAqCkPv_SUaLgA3gLIl': '오브제 프레임 카탈로그',
    // 재고
    '1y5C5T12d3VrMG2H-7N3CNIVMJfqDEY2d': '재고 현황표',
};

// URL에서 알려진 이름 찾기
function getKnownUrlName(url) {
    for (const [fileId, name] of Object.entries(KNOWN_URL_NAMES)) {
        if (url.includes(fileId)) return name;
    }
    // figma.com 시공 가이드
    if (url.includes('figma.com')) {
        if (url.includes('%EC%86%8C%ED%94%84%ED%8A%B8')) return '소프트 스톤 시공 가이드';
        if (url.includes('%EC%9B%94%ED%8C%A8%EB%84%90') || url.includes('WPC')) return 'WPC 월패널 시공 가이드';
        if (url.includes('%EC%B9%B4%EB%B9%99')) return '카빙 스톤 시공 가이드';
        if (url.includes('%EC%8A%A4%ED%85%90')) return '스텐 플레이트 시공 가이드';
        if (url.includes('%ED%81%AC%EB%A6%AC%EC%8A%A4%ED%83%88')) return '크리스탈 블럭 시공 가이드';
        if (url.includes('%EC%8B%9C%EB%A9%98%ED%8A%B8')) return '시멘트 블럭 시공 가이드';
        return '시공 가이드';
    }
    // 기타 알려진 도메인
    if (url.includes('edtc101.cafe24.com')) return '샘플 구매하기';
    if (url.includes('naver.me/G1wCKANl')) return '쇼룸 위치 (네이버 지도)';
    if (url.includes('link.inpock.co.kr')) return '전체 카탈로그 모음';
    if (url.includes('youtube.com/@interior__family')) return '유튜브 채널';
    if (url.includes('instagram.com/interior__family')) return '인스타그램';
    if (url.includes('infamglobal.com')) return '공식 홈페이지';
    if (url.includes('notion.so')) return '시공 사례 갤러리';
    return null;
}

// 메시지 포맷팅 - marked.js 기반 마크다운 변환 + URL → 카드
function formatMessage(text) {
    // URL 앞 라벨 텍스트도 포함하여 캡처 (예: "크리스탈 블럭 카탈로그: https://...")
    const urlPattern = /((?:[가-힣a-zA-Z0-9\s]+[:\-→]\s*)?(?:🔗\s*)?)(https?:\/\/[^\s\n<>"')\]]+)/g;
    const usedUrls = new Set();
    const linkCards = [];

    // 1단계: URL을 먼저 추출하고 카드로 변환할 준비
    let textForMd = text.replace(urlPattern, (fullMatch, prefix, url) => {
        url = url.replace(/[.,;:!?]+$/, '');
        if (!isValidUrl(url)) return '';

        if (!usedUrls.has(url)) {
            usedUrls.add(url);
            const meta = getLinkMeta(url);

            // 1순위: 알려진 URL 직접 매칭
            let name = getKnownUrlName(url);

            // 2순위: 앞 라벨 텍스트에서 이름 추출
            if (!name && prefix) {
                const label = prefix.replace(/[:\-→🔗\s]+$/g, '').trim();
                if (label.length >= 2) name = label;
            }

            // 3순위: 도메인 메타
            if (!name) {
                name = meta.label || '바로가기';
            }

            linkCards.push({ url, name, icon: meta.icon });
        }

        return '';  // 라벨 + URL 모두 제거 (카드로 대체)
    });

    // 2단계: 불필요한 이모지 링크 마크다운 정리
    textForMd = textForMd
        .replace(/🔗\s*/g, '')
        .replace(/^\s*$/gm, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

    // 3단계: marked.js로 마크다운 변환
    let formatted;
    if (typeof marked !== 'undefined' && marked.parse) {
        // marked 설정
        marked.setOptions({
            breaks: true,      // 줄바꿈을 <br>로 변환
            gfm: true,         // GitHub Flavored Markdown
            headerIds: false,
            mangle: false,
        });
        formatted = marked.parse(textForMd);
        // marked가 <p> 태그로 감싸므로, 최상위 불필요 <p> 정리
        formatted = formatted.trim();
    } else {
        // marked.js 로드 실패 시 폴백
        formatted = textForMd
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/^- (.+)/gm, '• $1')
            .replace(/\n/g, '<br>');
    }

    // 4단계: 카드 HTML
    let cardsHtml = '';
    if (linkCards.length > 0) {
        cardsHtml = `<div class="link-cards">` +
            linkCards.map(card => `
            <a href="${escapeAttr(card.url)}" target="_blank" rel="noopener" class="link-card">
              <span class="link-card-icon">${card.icon}</span>
              <div class="link-card-text">
                <span class="link-card-name">${escapeHtml(card.name)}</span>
                <span class="link-card-url">${escapeHtml(card.url)}</span>
              </div>
              <span class="link-card-arrow">→</span>
            </a>`).join('') +
            `</div>`;
    }
    // 5단계: "내부 참고 메모" 영역을 접이식 토글로 변환
    const memoRegex = /(<(?:p|h\d|strong|div)[^>]*>.*?(?:💡\s*내부\s*참고\s*메모|내부\s*참고\s*메모).*?<\/(?:p|h\d|strong|div)>)/i;
    const memoIdx = formatted.search(memoRegex);
    if (memoIdx > 0) {
        const customerPart = formatted.substring(0, memoIdx);
        const memoPart = formatted.substring(memoIdx);
        formatted = customerPart +
            `<details class="internal-memo-toggle">` +
            `<summary class="internal-memo-summary">💡 내부 참고 메모 <span class="memo-arrow">▶</span></summary>` +
            `<div class="internal-memo-content">${memoPart.replace(memoRegex, '')}</div>` +
            `</details>`;
    }

    return formatted + cardsHtml;
}

function truncateUrl(url) {
    try {
        const u = new URL(url);
        return u.hostname + (u.pathname.length > 30 ? u.pathname.substring(0, 30) + '...' : u.pathname);
    } catch { return url.substring(0, 45) + '...'; }
}
function escapeHtml(text) {
    return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function escapeAttr(text) {
    return String(text).replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

// 이모티콘 제거 유틸리티
function stripEmojis(text) {
    return text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}\u{2328}\u{23CF}\u{23E9}-\u{23F3}\u{23F8}-\u{23FA}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}]/gu, '').replace(/\s{2,}/g, ' ').trim();
}

// 봇 메시지 복사 — "고객 전달용 답변" 영역만 추출하여 복사
function copyBotMessage(btn) {
    const group = btn.closest('.message-group');
    const rawText = group.getAttribute('data-raw-text') || '';

    // "고객 전달용 답변" 영역만 추출 (내부 참고 메모 제외)
    let customerText = rawText;
    const customerMatch = rawText.match(/(?:📋\s*고객\s*전달용\s*답변[:\s]*)((?:.|\n)*?)(?=💡\s*내부\s*참고\s*메모|$)/i);
    if (customerMatch) {
        customerText = customerMatch[1].trim();
    } else {
        // 폴백: 내부 참고 메모 이후 제거
        const memoIdx = rawText.indexOf('💡 내부 참고 메모');
        if (memoIdx > 0) {
            customerText = rawText.substring(0, memoIdx).trim();
        }
        // "고객 전달용 답변:" 헤더 자체도 제거
        customerText = customerText.replace(/^📋\s*고객\s*전달용\s*답변[:\s]*/i, '').trim();
    }

    // 마크다운 서식 정리 (** 볼드 등 제거)
    customerText = customerText
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/^[\-\*]\s+/gm, '• ')
        .replace(/^#+\s+/gm, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

    navigator.clipboard.writeText(customerText).then(() => {
        btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> 복사됨!';
        btn.classList.add('copied');
        setTimeout(() => {
            btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path></svg> 📋 고객 전달용 복사';
            btn.classList.remove('copied');
        }, 2000);
    }).catch(() => {
        const ta = document.createElement('textarea');
        ta.value = customerText;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        btn.textContent = '복사됨!';
        setTimeout(() => { btn.textContent = '📋 고객 전달용 복사'; }, 2000);
    });
}

// 사이드바 토글
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}
document.addEventListener('click', (e) => {
    const sidebar = document.getElementById('sidebar');
    const menuBtn = document.getElementById('menuBtn');
    if (window.innerWidth <= 768 &&
        !sidebar.contains(e.target) &&
        !menuBtn.contains(e.target) &&
        sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
    }
});

// 소스 배지 생성
function getSourceBadge(data) {
    if (data.fromCorrection) return '<span class="source-badge faq">✏️ 관리자 수정 답변</span>';
    if (data.fromCache) return '<span class="source-badge cache">💾 캐시 응답</span>';
    if (data.fromFallback) return '<span class="source-badge fallback">📚 지식 베이스 응답</span>';
    if (data.ragSources && data.ragSources.length > 0 && data.matchedFAQs && data.matchedFAQs.length > 0)
        return '<span class="source-badge ai">🧠 RAG + FAQ + AI</span>';
    if (data.ragSources && data.ragSources.length > 0)
        return '<span class="source-badge ai">🧠 RAG + AI 답변</span>';
    if (data.matchedFAQs && data.matchedFAQs.length > 0) return '<span class="source-badge faq">🔍 FAQ 매칭 + AI</span>';
    return '<span class="source-badge ai">🤖 AI 생성 답변</span>';
}

// FAQ 매칭 카드 — 대화창에 표시하지 않음 (사용자 요청)
function getFAQMatchHtml(matchedFAQs) {
    return '';
}

// RAG 소스 카드 생성 — 고객 채팅 데이터 기준
function getRAGSourceHtml(ragSources) {
    if (!ragSources || ragSources.length === 0) return '';
    return `<div class="faq-match-card" style="border-left-color: #8b5cf6;">
        <div class="faq-match-title" style="color: #8b5cf6;">고객 채팅 데이터를 기준으로 ${ragSources.length}건 참조</div>
        <div class="faq-match-list">
            ${ragSources.map(r => {
        const pct = Math.round(parseFloat(r.score) * 100);
        return `<div class="faq-match-item" onclick="openEditPopup('rag', '${escapeAttr(r.title)}', '${escapeAttr(r.content || '')}', '${escapeAttr(r.category)}', ${pct})" title="클릭하여 편집">[${escapeHtml(r.category)}] ${escapeHtml(r.title)} <span style="color:#8b5cf6;font-size:11px;font-weight:600;">${pct}%</span></div>`;
    }).join('')}
        </div>
    </div>`;
}

// === 편집 팝업 ===
function openEditPopup(type, question, answer, category, score) {
    // 기존 팝업 제거
    const old = document.getElementById('editPopupOverlay');
    if (old) old.remove();

    const overlay = document.createElement('div');
    overlay.id = 'editPopupOverlay';
    overlay.className = 'edit-popup-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

    const typeLabel = type === 'faq' ? '📋 FAQ 편집' : '🧠 RAG 학습 데이터 편집';
    const scoreHtml = score ? `<span class="edit-popup-score">${score}% 유사도</span>` : '';
    const catHtml = category ? `<span class="edit-popup-cat">${category}</span>` : '';

    overlay.innerHTML = `
    <div class="edit-popup">
        <div class="edit-popup-header">
            <div class="edit-popup-title">${typeLabel} ${catHtml} ${scoreHtml}</div>
            <button class="edit-popup-close" onclick="this.closest('.edit-popup-overlay').remove()">✕</button>
        </div>
        <div class="edit-popup-body">
            <label class="edit-popup-label">질문 (Q)</label>
            <textarea class="edit-popup-textarea" id="popupQuestion" rows="2">${question}</textarea>
            <label class="edit-popup-label">답변 (A)</label>
            <textarea class="edit-popup-textarea" id="popupAnswer" rows="6" placeholder="수정할 답변을 입력하세요...">${answer}</textarea>
        </div>
        <div class="edit-popup-footer">
            <button class="edit-popup-cancel" onclick="this.closest('.edit-popup-overlay').remove()">취소</button>
            <button class="edit-popup-save" onclick="savePopupEdit(this)">💾 저장 & 학습</button>
        </div>
    </div>`;

    document.body.appendChild(overlay);
    // 답변이 비어있으면 답변 textarea에 포커스
    setTimeout(() => {
        const target = answer ? document.getElementById('popupQuestion') : document.getElementById('popupAnswer');
        if (target) target.focus();
    }, 100);
}

async function savePopupEdit(btn) {
    const overlay = btn.closest('.edit-popup-overlay');
    const question = document.getElementById('popupQuestion').value.trim();
    const answer = document.getElementById('popupAnswer').value.trim();
    if (!question || !answer) { alert('질문과 답변을 모두 입력해주세요.'); return; }

    btn.disabled = true;
    btn.textContent = '저장 중...';

    try {
        const res = await fetch('/api/admin/learn-correction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question, answer })
        });
        const data = await res.json();
        if (data.success) {
            btn.textContent = '✅ 저장 완료!';
            btn.style.background = '#22c55e';
            setTimeout(() => overlay.remove(), 1200);
        } else {
            alert('저장 실패: ' + (data.error || '알 수 없는 오류'));
            btn.disabled = false;
            btn.textContent = '💾 저장 & 학습';
        }
    } catch (e) {
        alert('저장 요청 실패: ' + e.message);
        btn.disabled = false;
        btn.textContent = '💾 저장 & 학습';
    }
}

// 후속 질문 버튼 생성
function getSuggestedQuestionsHtml(suggestedQuestions) {
    if (!suggestedQuestions || suggestedQuestions.length === 0) return '';
    return `<div class="suggested-questions">
        <div class="suggested-title">💡 이런 것도 궁금하신가요?</div>
        <div class="suggested-list">
            ${suggestedQuestions.map(q => `<button class="suggested-btn" onclick="sendQuickMessage('${escapeAttr(q)}')">${escapeHtml(q)}</button>`).join('')}
        </div>
    </div>`;
}

// 메시지 전송
let lastUserQuestion = '';
async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message || isLoading) return;

    // === @기록 명령어 처리 ===
    if (message.startsWith('@기록')) {
        messageInput.value = '';
        autoResize(messageInput);
        const welcome = document.getElementById('welcomeSection');
        if (welcome) welcome.remove();
        await handleMemoCommand(message);
        return;
    }

    const welcome = document.getElementById('welcomeSection');
    if (welcome) welcome.remove();

    addMessage(message, 'user');
    lastUserQuestion = message;
    messageInput.value = '';
    autoResize(messageInput);
    messageCount++;

    isLoading = true;
    sendBtn.disabled = true;
    const typingEl = showTypingIndicator();

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, sessionId })
        });
        const data = await response.json();
        typingEl.remove();

        let responseText = data.response || '오류가 발생했습니다.';
        // 빈 링크/괄호 정리
        responseText = responseText
            .replace(/^(\s*\n)+/, '')
            .replace(/\[([^\]]+)\]\(\s*\)/g, '$1')
            .replace(/\(\s*\)/g, '')
            .trim();
        const sourceBadge = getSourceBadge(data);
        const faqMatchHtml = getFAQMatchHtml(data.matchedFAQs) + getRAGSourceHtml(data.ragSources);

        // 후속 질문 HTML 생성
        const suggestedHtml = getSuggestedQuestionsHtml(data.suggestedQuestions);

        addMessage(responseText, 'bot', sourceBadge, faqMatchHtml + suggestedHtml, lastUserQuestion);
    } catch (error) {
        typingEl.remove();
        console.error('채팅 API 오류:', error);
        addMessage(
            '서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.\n\n계속 연결이 안 되면 담당자에게 문의해 주세요.\n김동현 팀장: 010-6802-9124',
            'bot',
            '<span class="source-badge fallback">⚠️ 서버 연결 실패</span>'
        );
    } finally {
        isLoading = false;
        sendBtn.disabled = false;
        messageInput.focus();
    }
}

function sendQuickMessage(msg) {
    messageInput.value = msg;
    sendMessage();
    if (window.innerWidth <= 768) document.getElementById('sidebar').classList.remove('open');
}

function addMessage(text, type, sourceBadge = '', faqMatchHtml = '', originalQuestion = '') {
    const group = document.createElement('div');
    group.className = `message-group ${type}`;
    if (type === 'bot' && originalQuestion) {
        group.setAttribute('data-question', originalQuestion);
    }
    // 원본 텍스트 저장 (편집 시 사용)
    if (type === 'bot') {
        group.setAttribute('data-raw-text', text);
    }

    const timeStr = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    const avatar = type === 'bot'
        ? `<div class="msg-avatar bot"><img src="infam-logo.svg" alt="InFam" style="width: 100%; height: 100%; border-radius: 50%; object-fit: contain;"></div>`
        : `<div class="msg-avatar user">👤</div>`;
    const formattedText = formatMessage(text);

    const copyBtnHtml = type === 'bot' ? `<button class="copy-msg-btn" onclick="copyBotMessage(this)" title="고객 전달용 답변만 복사"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path></svg> 📋 고객 전달용 복사</button>` : '';
    const editBtnHtml = type === 'bot' ? `<button class="edit-msg-btn" onclick="editBotMessage(this)" title="답변 수정 후 학습">✏️ 바로수정</button>` : '';

    group.innerHTML = `
    <div class="message-row">
      ${type === 'bot' ? avatar : ''}
      <div class="bubble">${formattedText}${faqMatchHtml}</div>
      ${type === 'user' ? avatar : ''}
    </div>
    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
      <span class="message-time">${timeStr}</span>
      ${type === 'bot' ? sourceBadge : ''}
      ${copyBtnHtml}
      ${editBtnHtml}
    </div>
  `;

    chatMessages.appendChild(group);
    scrollToBottom();
    return group;
}

function showTypingIndicator() {
    const div = document.createElement('div');
    div.className = 'typing-indicator';
    div.innerHTML = `
    <div class="msg-avatar bot"><img src="infam-logo.svg" alt="InFam" style="width: 100%; height: 100%; border-radius: 50%; object-fit: contain;"></div>
    <div class="typing-bubble">
      <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
    </div>
  `;
    chatMessages.appendChild(div);
    scrollToBottom();
    return div;
}

function scrollToBottom() {
    requestAnimationFrame(() => {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    });
}

function clearChat() {
    messageCount = 0;
    chatMessages.innerHTML = '';
    const welcome = document.createElement('div');
    welcome.className = 'welcome-section';
    welcome.id = 'welcomeSection';
    welcome.innerHTML = `
    <div class="welcome-logo"><img src="infam-logo.svg" alt="InFam" style="width: 50px; height: 50px; object-fit: contain;"></div>
    <h2 class="welcome-title">인팸 CS 어시스턴트 👋</h2>
    <p class="welcome-subtitle">고객의 질문을 입력하면, 바로 전달 가능한 답변을 생성해 드립니다.<br>생성된 답변의 <strong>📋 고객 전달용 복사</strong> 버튼을 눌러 카카오톡/문자로 보내세요!</p>
    <div class="feature-chips">
      <div class="chip">🏠 벽장재 전문</div>
      <div class="chip">🚛 전국 배송</div>
      <div class="chip">📋 1,000+ 제품</div>
      <div class="chip">⚡ 당일 배송 가능</div>
    </div>
    <div class="welcome-quick-questions">
      <p class="welcome-suggest-title">자주 들어오는 고객 질문을 클릭해 보세요</p>
      <div class="welcome-quick-btns">
        <button class="welcome-quick-btn" onclick="sendQuickMessage('제품 종류가 어떻게 되나요?')">🏠 제품 종류</button>
        <button class="welcome-quick-btn" onclick="sendQuickMessage('배송은 어떻게 진행되나요?')">🚛 배송 안내</button>
        <button class="welcome-quick-btn" onclick="sendQuickMessage('시공 방법이 어떻게 되나요?')">🔨 시공 방법</button>
        <button class="welcome-quick-btn" onclick="sendQuickMessage('샘플을 받아볼 수 있나요?')">📦 샘플 구매</button>
        <button class="welcome-quick-btn" onclick="sendQuickMessage('재고 확인은 어떻게 하나요?')">📊 재고 확인</button>
        <button class="welcome-quick-btn" onclick="sendQuickMessage('쇼룸 위치가 어디인가요?')">📍 쇼룸 위치</button>
      </div>
    </div>
  `;
    chatMessages.appendChild(welcome);
    messageInput.focus();
}

function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
}

function autoResize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
}

// === 바로수정 기능 ===
function editBotMessage(btn) {
    const group = btn.closest('.message-group');
    const bubble = group.querySelector('.bubble');
    const rawText = group.getAttribute('data-raw-text') || bubble.innerText;
    if (group.classList.contains('editing')) return;
    group.classList.add('editing');
    group.setAttribute('data-original-html', bubble.innerHTML);
    const textarea = document.createElement('textarea');
    textarea.className = 'edit-textarea';
    textarea.value = rawText;
    textarea.rows = Math.max(5, rawText.split('\n').length + 2);
    const editActions = document.createElement('div');
    editActions.className = 'edit-actions';
    editActions.innerHTML = '<button class="edit-ai-btn" onclick="aiImproveAnswer(this)">🤖 AI 개선</button><button class="edit-save-btn" onclick="saveBotEdit(this)">저장 & 학습</button><button class="edit-cancel-btn" onclick="cancelBotEdit(this)">취소</button>';
    bubble.innerHTML = '';
    bubble.appendChild(textarea);
    bubble.appendChild(editActions);
    textarea.focus();
    btn.style.display = 'none';
}

async function saveBotEdit(btn) {
    const group = btn.closest('.message-group');
    const bubble = group.querySelector('.bubble');
    const textarea = bubble.querySelector('.edit-textarea');
    const editedText = textarea.value.trim();
    const question = group.getAttribute('data-question') || '';
    if (!editedText) { alert('답변 내용을 입력해주세요.'); return; }
    btn.disabled = true;
    btn.textContent = '저장 중...';
    try {
        const res = await fetch('/api/admin/learn-correction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question, answer: editedText })
        });
        const data = await res.json();
        group.setAttribute('data-raw-text', editedText);
        bubble.innerHTML = formatMessage(editedText);
        const badge = document.createElement('div');
        badge.className = 'edit-success-badge';
        badge.textContent = '수정 완료 - 학습에 반영됨';
        bubble.appendChild(badge);
        setTimeout(function () { badge.remove(); }, 4000);
        group.classList.remove('editing');
        const editBtn = group.querySelector('.edit-msg-btn');
        if (editBtn) editBtn.style.display = '';
    } catch (e) {
        alert('저장 실패: ' + e.message);
        btn.disabled = false;
        btn.textContent = '저장 & 학습';
    }
}

function cancelBotEdit(btn) {
    const group = btn.closest('.message-group');
    const bubble = group.querySelector('.bubble');
    bubble.innerHTML = group.getAttribute('data-original-html');
    group.classList.remove('editing');
    const editBtn = group.querySelector('.edit-msg-btn');
    if (editBtn) editBtn.style.display = '';
}

// AI로 답변 개선
async function aiImproveAnswer(btn) {
    const group = btn.closest('.message-group');
    const bubble = group.querySelector('.bubble');
    const textarea = bubble.querySelector('.edit-textarea');
    const question = group.getAttribute('data-question') || '';
    const currentAnswer = textarea.value.trim();

    if (!currentAnswer) {
        alert('개선할 답변 내용이 없습니다.');
        return;
    }

    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = '🧠 AI 분석 중...';
    btn.style.opacity = '0.7';

    try {
        const res = await fetch('/api/admin/improve-answer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question, currentAnswer })
        });
        const data = await res.json();

        if (data.success && data.improvedAnswer) {
            textarea.value = data.improvedAnswer;
            textarea.style.borderColor = '#22c55e';
            textarea.style.background = '#f0fdf4';
            btn.textContent = '✅ 개선 완료!';
            setTimeout(() => {
                btn.textContent = '🤖 AI 개선';
                btn.disabled = false;
                btn.style.opacity = '1';
                textarea.style.borderColor = '';
                textarea.style.background = '';
            }, 2000);
        } else {
            alert('AI 개선 실패: ' + (data.error || '알 수 없는 오류'));
            btn.textContent = originalText;
            btn.disabled = false;
            btn.style.opacity = '1';
        }
    } catch (e) {
        alert('AI 개선 요청 실패: ' + e.message);
        btn.textContent = originalText;
        btn.disabled = false;
        btn.style.opacity = '1';
    }
}

// ========================
// @기록 메모 기능 (토스트 + 사이드바 + 태그 + 팝업)
// ========================

// 담당자 태그 매핑 (이름 → 풀네임 + 컬러)
const MEMO_AUTHORS = {
    '찬미': { name: '민찬미', color: '#e91e63', emoji: '💗' },
    '성은': { name: '하성은', color: '#9c27b0', emoji: '💜' },
    '나현': { name: '장나현', color: '#ff9800', emoji: '🧡' },
    '준식': { name: '배준식', color: '#2196f3', emoji: '💙' },
    '반석': { name: '이반석', color: '#4caf50', emoji: '💚' },
    '동현': { name: '김동현', color: '#f44336', emoji: '❤️' },
    '종찬': { name: '이종찬', color: '#00bcd4', emoji: '🩵' },
    '호영': { name: '호영', color: '#ff5722', emoji: '🔥' }
};

// @이름 태그 파싱
function parseMemoTags(content) {
    const tags = [];
    const tagRegex = /@(찬미|성은|나현|준식|반석|동현|종찬|호영)/g;
    let match;
    while ((match = tagRegex.exec(content)) !== null) {
        const key = match[1];
        if (MEMO_AUTHORS[key] && !tags.find(t => t.key === key)) {
            tags.push({ key, ...MEMO_AUTHORS[key] });
        }
    }
    // 태그 제거한 본문
    const cleanContent = content.replace(tagRegex, '').replace(/\s{2,}/g, ' ').trim();
    return { tags, cleanContent };
}

// 태그 배지 HTML
function renderTagBadges(tags) {
    if (!tags || tags.length === 0) return '';
    return tags.map(t =>
        `<span class="memo-tag" style="--tag-color:${t.color}">${t.emoji} ${t.name}</span>`
    ).join('');
}

// 토스트 알림 표시
function showMemoToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `memo-toast memo-toast-${type}`;
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'delete' ? '🗑️' : '📝';
    toast.innerHTML = `
        <div class="memo-toast-icon">${icon}</div>
        <div class="memo-toast-body">${message}</div>
        <button class="memo-toast-close" onclick="this.parentElement.remove()">✕</button>
    `;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('memo-toast-exit');
        setTimeout(() => toast.remove(), 400);
    }, 5000);
}

// 사이드바 기록보관소 로딩
async function loadMemoArchive() {
    const list = document.getElementById('memoArchiveList');
    const badge = document.getElementById('memoCountBadge');
    try {
        const res = await fetch('/api/memos');
        const data = await res.json();
        if (!data.memos || data.memos.length === 0) {
            list.innerHTML = '<div class="memo-empty">메모가 없습니다</div>';
            badge.style.display = 'none';
            return;
        }
        badge.style.display = 'inline-flex';
        badge.textContent = data.total;

        const pinnedMemos = data.memos.filter(m => m.pinned);
        const normalMemos = data.memos.filter(m => !m.pinned);
        const allMemos = [...pinnedMemos, ...normalMemos];

        list.innerHTML = allMemos.map(memo => {
            const date = new Date(memo.createdAt);
            const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
            const pinClass = memo.pinned ? 'pinned' : '';
            const pinIcon = memo.pinned ? '📌 ' : '';
            const { tags, cleanContent } = parseMemoTags(memo.content);
            const tagHtml = renderTagBadges(tags);
            const borderColor = tags.length > 0 ? tags[0].color : null;
            const borderStyle = borderColor ? `style="--author-color:${borderColor}"` : '';

            return `<div class="memo-archive-item ${pinClass} ${tags.length > 0 ? 'has-author' : ''}" data-id="${memo.id}" ${borderStyle} onclick="openMemoPopup('${memo.id}')">
                ${tagHtml ? `<div class="memo-tag-row">${tagHtml}</div>` : ''}
                <div class="memo-item-content">${pinIcon}${escapeHtml(cleanContent)}</div>
                <div class="memo-item-meta">
                    <span>${dateStr}</span>
                    <span class="memo-item-actions">
                        <button onclick="event.stopPropagation();togglePinMemo('${memo.id}')" title="${memo.pinned ? '핀 해제' : '핀 고정'}">${memo.pinned ? '📌' : '📍'}</button>
                        <button onclick="event.stopPropagation();deleteMemoById('${memo.id}')" title="삭제">🗑️</button>
                    </span>
                </div>
            </div>`;
        }).join('');
    } catch (e) {
        list.innerHTML = '<div class="memo-empty">불러오기 실패</div>';
    }
}

// 메모 상세 팝업
async function openMemoPopup(memoId) {
    try {
        const res = await fetch('/api/memos');
        const data = await res.json();
        const memo = data.memos.find(m => m.id === memoId);
        if (!memo) return;

        const date = new Date(memo.createdAt);
        const fullDate = `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        const { tags, cleanContent } = parseMemoTags(memo.content);
        const tagHtml = renderTagBadges(tags);

        // 기존 팝업 제거
        const old = document.getElementById('memoPopupOverlay');
        if (old) old.remove();

        const overlay = document.createElement('div');
        overlay.id = 'memoPopupOverlay';
        overlay.className = 'memo-popup-overlay';
        overlay.onclick = (e) => { if (e.target === overlay) closeMemoPopup(); };

        overlay.innerHTML = `
            <div class="memo-popup">
                <div class="memo-popup-header">
                    <h3>📝 메모 상세</h3>
                    <button class="memo-popup-close" onclick="closeMemoPopup()">✕</button>
                </div>
                <div class="memo-popup-body">
                    ${tagHtml ? `<div class="memo-popup-tags">${tagHtml}</div>` : ''}
                    <div class="memo-popup-content">${escapeHtml(cleanContent)}</div>
                    <div class="memo-popup-date">📅 ${fullDate}</div>
                    <div class="memo-popup-status">
                        ${memo.pinned ? '<span class="memo-popup-pin">📌 핀 고정됨</span>' : ''}
                        <span class="memo-popup-author">작성: ${memo.author || '직원'}</span>
                    </div>
                </div>
                <div class="memo-popup-footer">
                    <button class="memo-popup-btn pin" onclick="togglePinMemo('${memo.id}');closeMemoPopup();">
                        ${memo.pinned ? '📌 핀 해제' : '📍 핀 고정'}
                    </button>
                    <button class="memo-popup-btn delete" onclick="if(confirm('이 메모를 삭제하시겠습니까?')){deleteMemoById('${memo.id}');closeMemoPopup();}">
                        🗑️ 삭제
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        // ESC 닫기
        document.addEventListener('keydown', memoPopupEscHandler);
    } catch (e) {
        showMemoToast('메모 열기 실패', 'error');
    }
}

function closeMemoPopup() {
    const overlay = document.getElementById('memoPopupOverlay');
    if (overlay) {
        overlay.classList.add('memo-popup-exit');
        setTimeout(() => overlay.remove(), 250);
    }
    document.removeEventListener('keydown', memoPopupEscHandler);
}

function memoPopupEscHandler(e) {
    if (e.key === 'Escape') closeMemoPopup();
}

// @기록 명령어 핸들러
async function handleMemoCommand(message) {
    const content = message.replace(/^@기록\s*/, '').trim();

    if (!content || content === '목록') {
        document.getElementById('sidebar').classList.add('open');
        await loadMemoArchive();
        const section = document.querySelector('.memo-archive-section');
        if (section) {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
            section.classList.add('memo-highlight');
            setTimeout(() => section.classList.remove('memo-highlight'), 2000);
        }
        return;
    }

    if (content === '전체삭제') {
        try {
            const res = await fetch('/api/memos');
            const data = await res.json();
            if (!data.memos || data.memos.length === 0) {
                showMemoToast('삭제할 메모가 없습니다', 'info');
                return;
            }
            if (!confirm(`${data.memos.length}건의 메모를 모두 삭제하시겠습니까?`)) return;
            for (const memo of data.memos) {
                await fetch(`/api/memos/${memo.id}`, { method: 'DELETE' });
            }
            showMemoToast(`${data.memos.length}건의 메모가 모두 삭제되었습니다`, 'delete');
            await loadMemoArchive();
        } catch (e) {
            showMemoToast('전체 삭제 실패: ' + e.message, 'error');
        }
        return;
    }

    const deleteMatch = content.match(/^삭제\s+(\d+)$/);
    if (deleteMatch) {
        const idx = parseInt(deleteMatch[1]) - 1;
        try {
            const res = await fetch('/api/memos');
            const data = await res.json();
            const allMemos = [...data.memos.filter(m => m.pinned), ...data.memos.filter(m => !m.pinned)];
            if (idx < 0 || idx >= allMemos.length) {
                showMemoToast(`${deleteMatch[1]}번 메모가 없습니다 (총 ${allMemos.length}건)`, 'error');
                return;
            }
            const target = allMemos[idx];
            await fetch(`/api/memos/${target.id}`, { method: 'DELETE' });
            showMemoToast(`삭제됨: "${target.content}"`, 'delete');
            await loadMemoArchive();
        } catch (e) {
            showMemoToast('삭제 실패: ' + e.message, 'error');
        }
        return;
    }

    // 메모 저장 — @이름 태그 자동 추출
    const { tags } = parseMemoTags(content);
    const authorName = tags.length > 0 ? tags.map(t => t.name).join(', ') : '직원';
    try {
        const res = await fetch('/api/memos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content, author: authorName })
        });
        const data = await res.json();
        if (data.success) {
            const tagInfo = tags.length > 0 ? ` [${tags.map(t => t.emoji + t.name).join(', ')}]` : '';
            showMemoToast(`메모 저장 완료${tagInfo}`, 'success');
            await loadMemoArchive();
        } else {
            showMemoToast('저장 실패: ' + (data.error || '알 수 없는 오류'), 'error');
        }
    } catch (e) {
        showMemoToast('저장 실패: ' + e.message, 'error');
    }
}

// 사이드바에서 메모 추가
async function saveMemoFromSidebar() {
    const input = document.getElementById('memoQuickInput');
    const content = input.value.trim();
    if (!content) return;
    input.value = '';
    const { tags } = parseMemoTags(content);
    const authorName = tags.length > 0 ? tags.map(t => t.name).join(', ') : '직원';
    try {
        const res = await fetch('/api/memos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content, author: authorName })
        });
        const data = await res.json();
        if (data.success) {
            const tagInfo = tags.length > 0 ? ` [${tags.map(t => t.emoji + t.name).join(', ')}]` : '';
            showMemoToast(`메모 저장${tagInfo}`, 'success');
            await loadMemoArchive();
        }
    } catch (e) {
        showMemoToast('저장 실패: ' + e.message, 'error');
    }
}

// 메모 삭제
async function deleteMemoById(id) {
    try {
        await fetch(`/api/memos/${id}`, { method: 'DELETE' });
        showMemoToast('메모가 삭제되었습니다', 'delete');
        await loadMemoArchive();
    } catch (e) {
        showMemoToast('삭제 실패: ' + e.message, 'error');
    }
}

// 핀 토글
async function togglePinMemo(id) {
    try {
        await fetch(`/api/memos/${id}/pin`, { method: 'PATCH' });
        await loadMemoArchive();
    } catch (e) {
        showMemoToast('핀 토글 실패: ' + e.message, 'error');
    }
}

// 하위 호환
async function deleteMemo(id, num) {
    await deleteMemoById(id);
}

// 페이지 로드 시 기록보관소 초기화
document.addEventListener('DOMContentLoaded', () => {
    loadMemoArchive();
});

// ========================
// 전체 기록보관소 팝업 (담당자 필터)
// ========================

let memoFullPopupFilter = '전체';

async function openMemoFullPopup() {
    memoFullPopupFilter = '전체';

    // 기존 팝업 제거
    const old = document.getElementById('memoFullPopupOverlay');
    if (old) old.remove();

    const overlay = document.createElement('div');
    overlay.id = 'memoFullPopupOverlay';
    overlay.className = 'memo-full-popup-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) closeMemoFullPopup(); };

    // 담당자 탭 생성
    const allAuthors = Object.entries(MEMO_AUTHORS);
    const filterTabs = [
        `<button class="mfp-tab active" data-filter="전체" onclick="filterMemoFullPopup('전체', this)">전체</button>`,
        ...allAuthors.map(([key, val]) =>
            `<button class="mfp-tab" data-filter="${key}" onclick="filterMemoFullPopup('${key}', this)">
                <span class="mfp-tab-dot" style="background:${val.color}"></span>${val.name}
            </button>`
        )
    ].join('');

    overlay.innerHTML = `
        <div class="memo-full-popup">
            <div class="mfp-header">
                <div class="mfp-header-left">
                    <h3>📝 기록보관소</h3>
                    <span class="mfp-total" id="mfpTotal"></span>
                </div>
                <button class="mfp-close" onclick="closeMemoFullPopup()">✕</button>
            </div>
            <div class="mfp-filters" id="mfpFilters">
                ${filterTabs}
            </div>
            <div class="mfp-body" id="mfpBody">
                <div class="mfp-loading">불러오는 중...</div>
            </div>
            <div class="mfp-footer">
                <div class="mfp-add-bar">
                    <input type="text" id="mfpMemoInput" class="mfp-input" placeholder="새 메모 입력... (@이름으로 담당자 지정)" 
                        onkeydown="if(event.key==='Enter'){saveMemoFromFullPopup();}" />
                    <button class="mfp-add-btn" onclick="saveMemoFromFullPopup()">+ 추가</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    document.addEventListener('keydown', memoFullPopupEscHandler);

    // 데이터 로드
    await renderMemoFullPopup();
}

function closeMemoFullPopup() {
    const overlay = document.getElementById('memoFullPopupOverlay');
    if (overlay) {
        overlay.classList.add('mfp-exit');
        setTimeout(() => overlay.remove(), 250);
    }
    document.removeEventListener('keydown', memoFullPopupEscHandler);
}

function memoFullPopupEscHandler(e) {
    if (e.key === 'Escape') closeMemoFullPopup();
}

function filterMemoFullPopup(filter, btn) {
    memoFullPopupFilter = filter;
    // 탭 활성화
    document.querySelectorAll('#mfpFilters .mfp-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    renderMemoFullPopup();
}

async function renderMemoFullPopup() {
    const body = document.getElementById('mfpBody');
    const totalBadge = document.getElementById('mfpTotal');
    if (!body) return;

    try {
        const res = await fetch('/api/memos');
        const data = await res.json();

        if (!data.memos || data.memos.length === 0) {
            body.innerHTML = '<div class="mfp-empty">📭 저장된 메모가 없습니다<br><span>하단 입력창에서 새 메모를 추가해보세요</span></div>';
            totalBadge.textContent = '0건';
            return;
        }

        // 필터링
        let filtered = data.memos;
        if (memoFullPopupFilter !== '전체') {
            filtered = data.memos.filter(memo => {
                const { tags } = parseMemoTags(memo.content);
                return tags.some(t => t.key === memoFullPopupFilter);
            });
        }

        totalBadge.textContent = `${filtered.length}건` + (memoFullPopupFilter !== '전체' ? ` / 전체 ${data.memos.length}건` : '');

        if (filtered.length === 0) {
            const authorInfo = MEMO_AUTHORS[memoFullPopupFilter];
            body.innerHTML = `<div class="mfp-empty">${authorInfo ? authorInfo.emoji : '📭'} ${authorInfo ? authorInfo.name : ''} 담당 메모가 없습니다</div>`;
            return;
        }

        // 핀 고정 → 일반 순서
        const pinnedMemos = filtered.filter(m => m.pinned);
        const normalMemos = filtered.filter(m => !m.pinned);
        const allMemos = [...pinnedMemos, ...normalMemos];

        body.innerHTML = allMemos.map(memo => {
            const date = new Date(memo.createdAt);
            const dateStr = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
            const { tags, cleanContent } = parseMemoTags(memo.content);
            const tagHtml = renderTagBadges(tags);
            const pinIcon = memo.pinned ? '📌 ' : '';
            const pinClass = memo.pinned ? 'pinned' : '';

            return `<div class="mfp-card ${pinClass}" onclick="openMemoPopup('${memo.id}');closeMemoFullPopup();">
                <div class="mfp-card-top">
                    <div class="mfp-card-tags">${tagHtml || '<span class="mfp-no-tag">태그 없음</span>'}</div>
                    <div class="mfp-card-actions">
                        <button onclick="event.stopPropagation();togglePinMemo('${memo.id}').then(()=>renderMemoFullPopup())" title="${memo.pinned ? '핀 해제' : '핀 고정'}">${memo.pinned ? '📌' : '📍'}</button>
                        <button onclick="event.stopPropagation();if(confirm('이 메모를 삭제하시겠습니까?')){deleteMemoById('${memo.id}').then(()=>renderMemoFullPopup())}" title="삭제">🗑️</button>
                    </div>
                </div>
                <div class="mfp-card-content">${pinIcon}${escapeHtml(cleanContent)}</div>
                <div class="mfp-card-date">${dateStr}</div>
            </div>`;
        }).join('');

    } catch (e) {
        body.innerHTML = '<div class="mfp-empty">❌ 불러오기 실패</div>';
    }
}

async function saveMemoFromFullPopup() {
    const input = document.getElementById('mfpMemoInput');
    const content = input.value.trim();
    if (!content) return;
    input.value = '';

    const { tags } = parseMemoTags(content);
    const authorName = tags.length > 0 ? tags.map(t => t.name).join(', ') : '직원';

    try {
        const res = await fetch('/api/memos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content, author: authorName })
        });
        const data = await res.json();
        if (data.success) {
            const tagInfo = tags.length > 0 ? ` [${tags.map(t => t.emoji + t.name).join(', ')}]` : '';
            showMemoToast(`메모 저장 완료${tagInfo}`, 'success');
            await renderMemoFullPopup();
            await loadMemoArchive();
        }
    } catch (e) {
        showMemoToast('저장 실패: ' + e.message, 'error');
    }
}

