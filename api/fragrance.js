/* =========================================================================
   Vercel 서버리스 함수: RapidAPI "Fragrance API" 프록시 (Meilisearch 기반)
   - 브라우저는 이 함수만 호출하고, 실제 RapidAPI 키는 서버 환경변수에만 존재.
   - 환경변수 (Vercel > Project > Settings > Environment Variables):
       RAPIDAPI_KEY   (필수) X-RapidAPI-Key
       RAPIDAPI_HOST  (선택) 기본값 fragrance-api.p.rapidapi.com
   - 엔드포인트: POST /multi-search  (indexUid: "fragrances")
   ========================================================================= */

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=604800");

  const KEY  = process.env.RAPIDAPI_KEY;
  const HOST = process.env.RAPIDAPI_HOST || "fragrance-api.p.rapidapi.com";
  const action = (req.query.action || "search").toString();

  if (action === "status") {
    return res.status(200).json({ ok: true, configured: Boolean(KEY) });
  }
  if (!KEY) {
    return res.status(200).json({ ok: false, reason: "not_configured", results: [] });
  }

  try {
    if (action === "search") {
      const q = (req.query.q || "").toString().trim();
      const limit = Math.min(parseInt(req.query.limit, 10) || 12, 20);
      if (!q) return res.status(200).json({ ok: true, results: [] });

      const r = await fetch(`https://${HOST}/multi-search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-RapidAPI-Key": KEY,
          "X-RapidAPI-Host": HOST,
        },
        body: JSON.stringify({
          queries: [{ indexUid: "fragrances", q, limit, offset: 0 }],
        }),
      });
      if (!r.ok) return res.status(200).json({ ok: false, status: r.status, results: [] });

      const raw = await r.json();
      const hits = (raw.results && raw.results[0] && raw.results[0].hits) || [];
      return res.status(200).json({ ok: true, results: hits.map(toClean) });
    }

    if (action === "brand") {
      const brand = (req.query.brand || "").toString().trim();
      const limit = Math.min(parseInt(req.query.limit, 10) || 40, 60);
      if (!brand) return res.status(200).json({ ok: true, results: [] });

      const r = await fetch(`https://${HOST}/multi-search`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-RapidAPI-Key": KEY, "X-RapidAPI-Host": HOST },
        body: JSON.stringify({
          queries: [{ indexUid: "fragrances", q: "", filter: [`"brand.name"="${brand.replace(/"/g, '')}"`], limit, offset: 0 }],
        }),
      });
      if (!r.ok) return res.status(200).json({ ok: false, status: r.status, results: [] });

      const raw = await r.json();
      const hits = (raw.results && raw.results[0] && raw.results[0].hits) || [];
      const total = (raw.results && raw.results[0] && raw.results[0].estimatedTotalHits) || hits.length;
      return res.status(200).json({ ok: true, total, results: hits.map(toClean) });
    }

    return res.status(400).json({ ok: false, reason: "unknown_action" });
  } catch (err) {
    return res.status(200).json({ ok: false, reason: "fetch_error", message: String(err), results: [] });
  }
}

/* Meilisearch hit → 프런트가 쓰기 쉬운 평탄한 형태 */
function toClean(h) {
  return {
    id: h.id,
    name: h.name || "",
    brand: (h.brand && h.brand.name) || "",
    image: (h.image && h.image.url) || null,
    notes: Array.isArray(h.notes) ? h.notes.map(n => ({ id: n.id, name: n.name })) : [],
    perfumers: Array.isArray(h.perfumers) ? h.perfumers.map(p => p.name).filter(Boolean) : [],
    releasedAt: h.releasedAt || null,
    rating: h.reviewsScoreAvg ?? null,
    reviews: h.reviewsCount ?? null,
    popularity: h.popularityScore ?? null,
  };
}
