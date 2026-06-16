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

export default async function handler(req, res) {
  const ID = process.env.NAVER_CLIENT_ID, SECRET = process.env.NAVER_CLIENT_SECRET;
  const SB = process.env.SUPABASE_URL, SR = process.env.SUPABASE_SERVICE_ROLE;
  if (!ID || !SECRET || !SB || !SR) {
    return res.status(200).json({ ok: false, reason: "not_configured" });
  }
  const today = new Date().toISOString().slice(0, 10);
  // 시향지·샘플·소분(데칸트)·15ml 이하 미니 등 본품이 아닌 항목 제외
  const JUNK = /시향지|시향|샘플|공병|소분|분할|데칸트|디[캔켄]트|어토마이저|미니어|바이알|vial|추출|(?:[^0-9]|^)(?:[1-9]|1[0-5])\s?ml(?![0-9])/i;
  let saved = 0;

  for (const t of TRACK) {
    try {
      const url = `https://openapi.naver.com/v1/search/shop.json?query=${encodeURIComponent(t.q)}&display=40&sort=sim`;
      const j = await fetch(url, { headers: { "X-Naver-Client-Id": ID, "X-Naver-Client-Secret": SECRET } }).then(r => r.json());
      const prices = (j.items || [])
        .map(it => ({ title: String(it.title || "").replace(/<[^>]+>/g, ""), price: parseInt(it.lprice, 10) || 0 }))
        .filter(it => it.price >= 30000 && !JUNK.test(it.title))
        .map(it => it.price)
        .sort((a, b) => a - b);
      if (prices.length < 3) continue;                    // 표본 너무 적으면 건너뜀
      // 중앙값 = 가품/decant 이상치에 휘둘리지 않는 '정상 시세'
      const median = prices[Math.floor(prices.length / 2)];

      const r = await fetch(`${SB}/rest/v1/price_history?on_conflict=perfume_key,collected_on`, {
        method: "POST",
        headers: {
          apikey: SR, Authorization: "Bearer " + SR,
          "Content-Type": "application/json", Prefer: "resolution=merge-duplicates",
        },
        body: JSON.stringify({ perfume_key: t.key, price: median, collected_on: today }),
      });
      if (r.ok) saved++;
    } catch (e) { /* 개별 실패는 건너뜀 */ }
  }
  return res.status(200).json({ ok: true, date: today, saved, tracked: TRACK.length });
}
