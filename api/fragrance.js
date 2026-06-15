/* =========================================================================
   Vercel 서버리스 함수: RapidAPI 향수 API 프록시
   - 브라우저는 이 함수만 호출하고, 실제 RapidAPI 키는 서버 환경변수에만 존재.
   - 필요한 환경변수 (Vercel > Project > Settings > Environment Variables):
       RAPIDAPI_KEY         (필수) 발급받은 X-RapidAPI-Key
       RAPIDAPI_HOST        (필수) 구독한 API의 호스트
                                   예) fragrancefinder-api.p.rapidapi.com
       RAPIDAPI_SEARCH_PATH (선택) 검색 경로 템플릿 ({q}=검색어)
                                   기본값: /perfumes/search?q={q}
   - 구독한 API에 맞게 RAPIDAPI_HOST / RAPIDAPI_SEARCH_PATH 만 바꾸면 됩니다.
   ========================================================================= */

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=604800");

  const KEY  = process.env.RAPIDAPI_KEY;
  const HOST = process.env.RAPIDAPI_HOST;
  const SEARCH_PATH = process.env.RAPIDAPI_SEARCH_PATH || "/perfumes/search?q={q}";

  const action = (req.query.action || "search").toString();

  // 연결 상태 확인 (프런트가 키 등록 여부 판단)
  if (action === "status") {
    return res.status(200).json({ ok: true, configured: Boolean(KEY && HOST) });
  }

  if (!KEY || !HOST) {
    return res.status(200).json({ ok: false, reason: "not_configured", results: [] });
  }

  try {
    if (action === "search") {
      const q = (req.query.q || "").toString().trim();
      if (!q) return res.status(200).json({ ok: true, results: [] });

      const path = SEARCH_PATH.replace("{q}", encodeURIComponent(q));
      const url = `https://${HOST}${path}`;

      const r = await fetch(url, {
        headers: { "X-RapidAPI-Key": KEY, "X-RapidAPI-Host": HOST },
      });
      if (!r.ok) return res.status(200).json({ ok: false, status: r.status, results: [] });

      const raw = await r.json();
      return res.status(200).json({ ok: true, results: normalize(raw) });
    }

    return res.status(400).json({ ok: false, reason: "unknown_action" });
  } catch (err) {
    return res.status(200).json({ ok: false, reason: "fetch_error", message: String(err), results: [] });
  }
}

/* 다양한 API 응답 스키마를 배열로 흡수 */
function normalize(raw) {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== "object") return [];
  for (const k of ["results", "data", "perfumes", "items", "hits", "products"]) {
    if (Array.isArray(raw[k])) return raw[k];
  }
  // 단일 객체면 배열로 감싸기
  return [raw];
}
