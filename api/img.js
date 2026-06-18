/* =========================================================================
   Vercel 서버리스: 이미지 프록시 (네이버 제품 이미지 → 같은 도메인으로 중계)
   - 향수 카드 생성 시 외부 이미지를 캔버스에 그리면 CORS로 막히는 문제 해결
   - /api/img?url=<이미지URL>  (네이버 이미지 도메인만 허용 — 오픈 프록시 방지)
   ========================================================================= */
const ALLOW = /(^|\.)pstatic\.net$|(^|\.)naver\.net$|(^|\.)naver\.com$/i;

export default async function handler(req, res) {
  const raw = (req.query.url || "").toString();
  let u;
  try { u = new URL(raw); } catch (e) { return res.status(400).json({ ok: false, reason: "bad_url" }); }
  if (!/^https?:$/.test(u.protocol) || !ALLOW.test(u.hostname)) {
    return res.status(403).json({ ok: false, reason: "host_not_allowed" });
  }
  try {
    const r = await fetch(u.toString());
    if (!r.ok) return res.status(502).json({ ok: false, status: r.status });
    const ct = r.headers.get("content-type") || "image/jpeg";
    if (!/^image\//.test(ct)) return res.status(415).json({ ok: false, reason: "not_image" });
    const buf = Buffer.from(await r.arrayBuffer());
    res.setHeader("Content-Type", ct);
    res.setHeader("Cache-Control", "s-maxage=604800, stale-while-revalidate=86400");
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(200).send(buf);
  } catch (e) {
    return res.status(502).json({ ok: false, reason: "fetch_error" });
  }
}
