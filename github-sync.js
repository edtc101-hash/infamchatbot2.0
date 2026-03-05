/**
 * GitHub API 데이터 동기화 모듈
 * Render 배포 시 임시 파일 시스템 문제를 해결합니다.
 * 
 * - 서버 시작 시: GitHub에서 최신 JSON 다운로드 → 로컬에 저장
 * - 데이터 변경 시: 로컬 저장 + GitHub에 비동기 커밋 (5초 디바운스)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// 설정
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = 'edtc101-hash';
const REPO_NAME = 'infamchatbot2.0';
const BRANCH = 'main';

// 동기화 대상 파일
const SYNC_FILES = [
    'faq-data.json',
    'learned-data.json',
    'memo-data.json'
];

// 디바운스 타이머 관리
const pendingUploads = {};
const DEBOUNCE_MS = 5000; // 5초

/**
 * GitHub API 호출 (Promise 기반, 외부 라이브러리 불필요)
 */
function githubAPI(method, apiPath, body = null) {
    return new Promise((resolve, reject) => {
        if (!GITHUB_TOKEN) {
            return reject(new Error('GITHUB_TOKEN 미설정'));
        }

        const options = {
            hostname: 'api.github.com',
            path: apiPath,
            method,
            headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github+json',
                'User-Agent': 'infamchatbot-sync',
                'X-GitHub-Api-Version': '2022-11-28'
            }
        };

        if (body) {
            options.headers['Content-Type'] = 'application/json';
        }

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = data ? JSON.parse(data) : {};
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(json);
                    } else {
                        reject(new Error(`GitHub API ${res.statusCode}: ${json.message || data}`));
                    }
                } catch (e) {
                    reject(new Error(`GitHub API 파싱 오류: ${e.message}`));
                }
            });
        });

        req.on('error', reject);
        req.setTimeout(15000, () => {
            req.destroy();
            reject(new Error('GitHub API 타임아웃 (15초)'));
        });

        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

/**
 * GitHub에서 파일 다운로드 (Base64 디코딩)
 */
async function downloadFromGitHub(filename) {
    const apiPath = `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filename}?ref=${BRANCH}`;
    const result = await githubAPI('GET', apiPath);

    if (result.content) {
        const content = Buffer.from(result.content, 'base64').toString('utf8');
        return { content, sha: result.sha };
    }
    return null;
}

/**
 * GitHub에 파일 업로드 (커밋)
 */
async function uploadToGitHub(filename, content, message) {
    const apiPath = `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filename}`;

    // 기존 파일의 SHA 가져오기 (업데이트 시 필요)
    let sha = null;
    try {
        const existing = await githubAPI('GET', `${apiPath}?ref=${BRANCH}`);
        sha = existing.sha;
    } catch (e) {
        // 파일이 없으면 새로 생성
    }

    const body = {
        message,
        content: Buffer.from(content, 'utf8').toString('base64'),
        branch: BRANCH
    };
    if (sha) body.sha = sha;

    return githubAPI('PUT', apiPath, body);
}

/**
 * 서버 시작 시 GitHub에서 최신 데이터 복원
 */
async function syncFromGitHub() {
    if (!GITHUB_TOKEN) {
        console.log('⚠️ GITHUB_TOKEN 미설정 — GitHub 동기화 비활성화 (로컬 파일만 사용)');
        return;
    }

    console.log('🔄 GitHub에서 데이터 동기화 시작...');
    let restored = 0;

    for (const filename of SYNC_FILES) {
        try {
            const result = await downloadFromGitHub(filename);
            if (result && result.content) {
                // JSON 유효성 확인
                JSON.parse(result.content);

                const localPath = path.join(__dirname, filename);
                const localExists = fs.existsSync(localPath);
                let localContent = null;

                if (localExists) {
                    localContent = fs.readFileSync(localPath, 'utf8');
                }

                // GitHub 데이터가 로컬보다 최신 or 로컬이 비어있으면 복원
                const githubData = JSON.parse(result.content);
                const localData = localContent ? JSON.parse(localContent) : [];

                const githubCount = Array.isArray(githubData) ? githubData.length : Object.keys(githubData).length;
                const localCount = Array.isArray(localData) ? localData.length : Object.keys(localData).length;

                if (githubCount >= localCount) {
                    fs.writeFileSync(localPath, result.content, 'utf8');
                    console.log(`  ✅ ${filename}: GitHub → 로컬 복원 (${githubCount}건)`);
                    restored++;
                } else {
                    console.log(`  ℹ️ ${filename}: 로컬 데이터가 더 최신 (로컬 ${localCount} vs GitHub ${githubCount})`);
                }
            }
        } catch (e) {
            console.log(`  ⚠️ ${filename}: 복원 실패 — ${e.message}`);
        }
    }

    console.log(`🔄 GitHub 동기화 완료 (${restored}/${SYNC_FILES.length} 파일 복원)`);
}

/**
 * 데이터 변경 시 GitHub에 비동기 업로드 (5초 디바운스)
 */
function syncToGitHub(filename) {
    if (!GITHUB_TOKEN) return; // 토큰 없으면 무시 (로컬 전용)

    // 기존 타이머 취소 (디바운스)
    if (pendingUploads[filename]) {
        clearTimeout(pendingUploads[filename]);
    }

    pendingUploads[filename] = setTimeout(async () => {
        delete pendingUploads[filename];

        try {
            const localPath = path.join(__dirname, filename);
            if (!fs.existsSync(localPath)) return;

            const content = fs.readFileSync(localPath, 'utf8');

            // JSON 유효성 확인
            const data = JSON.parse(content);
            const count = Array.isArray(data) ? data.length : Object.keys(data).length;

            const timestamp = new Date().toISOString().replace('T', ' ').substr(0, 19);
            await uploadToGitHub(
                filename,
                content,
                `📦 자동 동기화: ${filename} (${count}건) — ${timestamp}`
            );

            console.log(`☁️ GitHub 동기화: ${filename} (${count}건 업로드)`);
        } catch (e) {
            console.error(`❌ GitHub 동기화 실패 (${filename}):`, e.message);
        }
    }, DEBOUNCE_MS);
}

/**
 * 동기화 상태 확인
 */
function isSyncEnabled() {
    return !!GITHUB_TOKEN;
}

module.exports = {
    syncFromGitHub,
    syncToGitHub,
    isSyncEnabled
};
