/* =========================================================================
   Vercel Cron: 매일 인기 향수 최저가 수집 → Supabase price_history 저장
                + 목표가 도달 시 이메일 알림 발송
   - vercel.json crons "0 5 * * *" = UTC 05:00 = 한국시간(KST) 오후 2시 자동 실행
     (Vercel 크론은 UTC 기준 — 한국시간 = UTC + 9시간)
   - 환경변수: NAVER_CLIENT_ID, NAVER_CLIENT_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE,
              RESEND_API_KEY, RESEND_FROM
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

// 오늘 수집된 가격을 perfume_key → price 맵으로 읽어온다.
async function todayPrices(SB, SR, today) {
  try {
    const r = await fetch(`${SB}/rest/v1/price_history?select=perfume_key,price&collected_on=eq.${today}`, {
      headers: { apikey: SR, Authorization: "Bearer " + SR },
    });
    if (!r.ok) return {};
    const rows = await r.json();
    const map = {};
    for (const x of rows || []) map[x.perfume_key] = x.price;
    return map;
  } catch (e) { return {}; }
}

// 가입자 user_id → 이메일 맵 (GoTrue admin)
async function userEmails(SB, SR) {
  try {
    const r = await fetch(`${SB}/auth/v1/admin/users?per_page=1000`, { headers: { apikey: SR, Authorization: "Bearer " + SR } });
    const j = await r.json();
    const map = {};
    for (const u of (j.users || [])) if (u.email) map[u.id] = u.email;
    return map;
  } catch (e) { return {}; }
}

function alertEmailHTML({ name, price, target }) {
  const won = n => "약 " + Number(n).toLocaleString("ko-KR") + "원";
  return `<div style="font-family:'Pretendard',sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1a1916">
    <h2 style="color:#b14a5f;margin:0 0 8px">📉 목표가 도달!</h2>
    <p style="font-size:15px;line-height:1.7"><b>${name}</b>의 시세가 설정하신 목표가에 도달했어요.</p>
    <div style="background:#faf7f2;border:1px solid #e7e2d9;border-radius:12px;padding:16px;margin:16px 0">
      <div style="font-size:14px;color:#7c7870">현재 시세</div>
      <div style="font-size:26px;font-weight:800;color:#b14a5f">${won(price)}</div>
      <div style="font-size:13px;color:#7c7870;margin-top:6px">목표가 ${won(target)} 이하</div>
    </div>
    <a href="https://scentpedia.co.kr/" style="display:inline-block;background:#b14a5f;color:#fff;font-weight:800;padding:12px 22px;border-radius:10px;text-decoration:none">구매처 보러 가기 →</a>
    <p style="font-size:12px;color:#9b958c;margin-top:20px">Scentpedia 시세 알림 · 한 번 도달하면 다시 오를 때까지 추가 메일은 보내지 않아요.<br>알림을 끄려면 사이트 <b>📈 시세 워치</b> 메뉴에서 끄거나 삭제할 수 있어요.</p>
  </div>`;
}

// 목표가 도달 알림 이메일 발송 (Resend). 발송 건수 반환.
async function checkAlerts(SB, SR, today) {
  const RESEND = process.env.RESEND_API_KEY;
  const FROM = process.env.RESEND_FROM || "Scentpedia <onboarding@resend.dev>";
  if (!RESEND) return { sent: 0, reason: "resend_not_configured" };

  const h = { apikey: SR, Authorization: "Bearer " + SR };
  const ar = await fetch(`${SB}/rest/v1/price_alerts?select=*`, { headers: h });
  if (!ar.ok) return { sent: 0, reason: "alerts_read_failed" };
  const alerts = await ar.json();
  if (!alerts || !alerts.length) return { sent: 0 };

  const prices = await todayPrices(SB, SR, today);
  const emails = await userEmails(SB, SR);
  let sent = 0;

  const patch = (id, body) => fetch(`${SB}/rest/v1/price_alerts?id=eq.${id}`, {
    method: "PATCH", headers: { ...h, "Content-Type": "application/json" }, body: JSON.stringify(body),
  });

  for (const a of alerts) {
    if (a.muted) continue;                                  // 사용자가 끈 알림
    if (a.expires_on && a.expires_on < today) continue;     // 수신 종료일 지남
    const price = prices[a.perfume_key];
    if (!price) continue;

    // 목표가보다 위 → '재무장': 다음에 다시 떨어지면 알릴 수 있게 발송표시 해제
    if (price > a.target_price) {
      if (a.last_notified_on) await patch(a.id, { last_notified_on: null, notified_price: null });
      continue;
    }
    // 여기부터 price <= target (목표 도달)
    if (a.last_notified_on) continue;          // 이번 하락 구간에 이미 1회 발송함 → 반복 발송 안 함 (메일 폭탄 방지)
    const to = a.email || emails[a.user_id];
    if (!to) continue;

    try {
      const er = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: "Bearer " + RESEND, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: FROM, to,
          subject: `📉 ${a.perfume_name || "관심 향수"} 목표가 도달!`,
          html: alertEmailHTML({ name: a.perfume_name || "관심 향수", price, target: a.target_price }),
        }),
      });
      if (er.ok) { sent++; await patch(a.id, { last_notified_on: today, notified_price: price }); }
    } catch (e) { /* 개별 실패는 건너뜀 */ }
  }
  return { sent };
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

  // 가격 수집 후 목표가 도달 알림 이메일 발송
  const alerts = await checkAlerts(SB, SR, today);
  return res.status(200).json({ ok: true, date: today, saved, tracked: LIST.length, alerts });
}
