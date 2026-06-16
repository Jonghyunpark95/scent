/* =========================================================================
   Vercel Cron: 매일 인기 향수 최저가 수집 → Supabase price_history 저장
   - vercel.json 의 crons 설정으로 매일 1회 자동 실행 (배포 환경에서만)
   - 환경변수: NAVER_CLIENT_ID, NAVER_CLIENT_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE
   ========================================================================= */

// 추적할 향수 (key = 내부 id, q = 네이버 검색어)
const TRACK = [
  { key: "dior-sauvage", q: "디올 쏘바쥬 EDT" },
  { key: "chanel-bleu", q: "블루 드 샤넬 EDP" },
  { key: "ll-santal33", q: "르라보 상탈 33" },
  { key: "mfk-baccarat", q: "바카라 루즈 540" },
  { key: "tf-lostcherry", q: "톰포드 로스트 체리" },
  { key: "creed-aventus", q: "크리드 어벤투스" },
  { key: "kilian-angels", q: "킬리안 엔젤스 셰어" },
  { key: "byredo-gypsy", q: "바이레도 집시 워터" },
  { key: "jm-woodsage", q: "조말론 우드 세이지 앤 씨 솔트" },
  { key: "diptyque-philo", q: "딥디크 필로시코스" },
  { key: "ysl-libre", q: "입생로랑 리브르" },
  { key: "dior-jadore", q: "디올 자도르 EDP" },
  { key: "chanel-coco", q: "샤넬 코코 마드모아젤" },
  { key: "tf-tobacco", q: "톰포드 타바코 바닐라" },
  { key: "pdm-layton", q: "퍼퓸 드 말리 레이튼" },
  { key: "xerjoff-naxos", q: "제르조프 낙소스" },
  { key: "ysl-blackopium", q: "입생로랑 블랙 오피움" },
  { key: "narciso-poudree", q: "나르시소 로드리게즈 포 허 푸드레" },
  { key: "versace-eros", q: "베르사체 에로스" },
  { key: "lancome-lveb", q: "랑콤 라 비 에 벨" },
  { key: "diptyque-doson", q: "딥디크 도손" },
  { key: "amouage-interludeman", q: "아무아쥬 인터루드 맨" },
  { key: "ll-another13", q: "르라보 어나더 13" },
];

// 함수 실행 시간 한도 상향 (수집 대상이 많아도 타임아웃 방지)
export const config = { maxDuration: 60 };

// 사용자가 추적 요청한 향수(tracked_perfumes) 목록을 Supabase에서 읽어온다.
async function loadTracked(SB, SR) {
  try {
    const r = await fetch(`${SB}/rest/v1/tracked_perfumes?select=perfume_key,query,perfume_name`, {
      headers: { apikey: SR, Authorization: "Bearer " + SR },
    });
    if (!r.ok) return [];
    const rows = await r.json();
    return (rows || [])
      .filter(x => x && x.perfume_key)
      .map(x => ({ key: x.perfume_key, q: x.query || x.perfume_name || x.perfume_key }));
  } catch (e) { return []; }
}

// 향수 1개의 중앙값 시세를 수집해 저장. 성공 시 true.
async function collectOne(t, { ID, SECRET, SB, SR, today, JUNK }) {
  try {
    const url = `https://openapi.naver.com/v1/search/shop.json?query=${encodeURIComponent(t.q)}&display=40&sort=sim`;
    const j = await fetch(url, { headers: { "X-Naver-Client-Id": ID, "X-Naver-Client-Secret": SECRET } }).then(r => r.json());
    const prices = (j.items || [])
      .map(it => ({ title: String(it.title || "").replace(/<[^>]+>/g, ""), price: parseInt(it.lprice, 10) || 0 }))
      .filter(it => it.price >= 30000 && !JUNK.test(it.title))
      .map(it => it.price)
      .sort((a, b) => a - b);
    if (prices.length < 3) return false;                   // 표본 너무 적으면 건너뜀
    const median = prices[Math.floor(prices.length / 2)];  // 중앙값 = 이상치에 강한 '정상 시세'
    const r = await fetch(`${SB}/rest/v1/price_history?on_conflict=perfume_key,collected_on`, {
      method: "POST",
      headers: {
        apikey: SR, Authorization: "Bearer " + SR,
        "Content-Type": "application/json", Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify({ perfume_key: t.key, price: median, collected_on: today }),
    });
    return r.ok;
  } catch (e) { return false; }
}

export default async function handler(req, res) {
  const ID = process.env.NAVER_CLIENT_ID, SECRET = process.env.NAVER_CLIENT_SECRET;
  const SB = process.env.SUPABASE_URL, SR = process.env.SUPABASE_SERVICE_ROLE;
  if (!ID || !SECRET || !SB || !SR) {
    return res.status(200).json({ ok: false, reason: "not_configured" });
  }
  const today = new Date().toISOString().slice(0, 10);
  // 시향지·샘플·소분(데칸트)·15ml 이하 미니 등 본품이 아닌 항목 제외
  const JUNK = /시향지|시향|샘플|공병|소분|분할|데칸트|디[캔켄]트|어토마이저|미니어|바이알|vial|추출|(?:[^0-9]|^)(?:[1-9]|1[0-5])\s?ml(?![0-9])/i;

  // 기본 인기 향수(seed) + 사용자가 추적 요청한 향수 → key 기준 중복 제거
  const tracked = await loadTracked(SB, SR);
  const byKey = new Map();
  for (const t of TRACK) byKey.set(t.key, t);
  for (const t of tracked) if (!byKey.has(t.key)) byKey.set(t.key, t);
  const LIST = [...byKey.values()];

  // 동시 요청 수 제한(8)으로 병렬 수집 → 많은 향수도 타임아웃 없이 처리
  const ctx = { ID, SECRET, SB, SR, today, JUNK };
  let saved = 0;
  const CONCURRENCY = 8;
  for (let i = 0; i < LIST.length; i += CONCURRENCY) {
    const chunk = LIST.slice(i, i + CONCURRENCY);
    const results = await Promise.all(chunk.map(t => collectOne(t, ctx)));
    saved += results.filter(Boolean).length;
  }
  return res.status(200).json({ ok: true, date: today, saved, tracked: LIST.length });
}
