/* =========================================================================
   Vercel 서버리스 함수: 네이버 쇼핑 검색 API 프록시
   - 향수/디퓨저의 판매처·최저가·구매링크를 가져온다.
   - 환경변수 (Vercel > Settings > Environment Variables):
       NAVER_CLIENT_ID      (필수)
       NAVER_CLIENT_SECRET  (필수)
   - Secret은 서버에만 존재(브라우저 노출 X).
   ========================================================================= */

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");

  const ID = process.env.NAVER_CLIENT_ID;
  const SECRET = process.env.NAVER_CLIENT_SECRET;
  const action = (req.query.action || "search").toString();

  if (action === "status") {
    return res.status(200).json({ ok: true, configured: Boolean(ID && SECRET) });
  }
  if (!ID || !SECRET) {
    return res.status(200).json({ ok: false, reason: "not_configured", items: [] });
  }

  const q = (req.query.q || "").toString().trim();
  const display = Math.min(parseInt(req.query.display, 10) || 12, 30);
  const sort = req.query.sort === "asc" ? "asc" : "sim"; // asc=가격오름차순, sim=정확도
  if (!q) return res.status(200).json({ ok: true, items: [] });

  try {
    const url = `https://openapi.naver.com/v1/search/shop.json?query=${encodeURIComponent(q)}&display=${display}&sort=${sort}`;
    const r = await fetch(url, {
      headers: { "X-Naver-Client-Id": ID, "X-Naver-Client-Secret": SECRET },
    });
    if (!r.ok) return res.status(200).json({ ok: false, status: r.status, items: [] });

    const j = await r.json();
    const decode = s => String(s || "")
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ");
    const minPrice = parseInt(req.query.minPrice, 10) || 0;
    // 시향지·샘플·공병 등 향수 본품이 아닌 잡상품 제외
    const JUNK = /시향지|시향|샘플|공병|스티커|키링|뿌리개|소분|어토마이저|굿즈|쇼핑백|단추|증정/;
    const items = (j.items || [])
      .map(it => ({
        title: decode(it.title),
        price: parseInt(it.lprice, 10) || 0,
        mall: it.mallName || "",
        link: it.link || "",
        image: it.image || "",
        brand: it.brand || it.maker || "",
      }))
      .filter(it => it.price >= minPrice && it.title && !JUNK.test(it.title));
    return res.status(200).json({ ok: true, total: j.total || items.length, items });
  } catch (err) {
    return res.status(200).json({ ok: false, reason: "fetch_error", message: String(err), items: [] });
  }
}
