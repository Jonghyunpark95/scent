/* =========================================================================
   Vercel 서버리스 함수: 네이버 블로그/뉴스 검색 프록시 (향수 팝업·이벤트 소식)
   - 쇼핑과 동일한 NAVER_CLIENT_ID / NAVER_CLIENT_SECRET 사용 (검색 API)
   ========================================================================= */
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "s-maxage=1800, stale-while-revalidate=86400");

  const ID = process.env.NAVER_CLIENT_ID;
  const SECRET = process.env.NAVER_CLIENT_SECRET;
  if ((req.query.action || "") === "status") {
    return res.status(200).json({ ok: true, configured: Boolean(ID && SECRET) });
  }
  if (!ID || !SECRET) return res.status(200).json({ ok: false, reason: "not_configured", items: [] });

  const q = (req.query.q || "향수 팝업스토어").toString().trim();
  const display = Math.min(parseInt(req.query.display, 10) || 8, 20);

  const decode = s => String(s || "").replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ");

  try {
    const url = `https://openapi.naver.com/v1/search/blog.json?query=${encodeURIComponent(q)}&display=${display}&sort=date`;
    const r = await fetch(url, { headers: { "X-Naver-Client-Id": ID, "X-Naver-Client-Secret": SECRET } });
    if (!r.ok) return res.status(200).json({ ok: false, status: r.status, items: [] });
    const j = await r.json();
    const items = (j.items || []).map(it => ({
      title: decode(it.title),
      desc: decode(it.description),
      link: it.link || "",
      source: it.bloggername || "블로그",
      date: it.postdate || "",
    }));
    return res.status(200).json({ ok: true, items });
  } catch (err) {
    return res.status(200).json({ ok: false, reason: "fetch_error", items: [] });
  }
}
