/* =========================================================================
   Vercel 서버리스 함수: 쿠팡 파트너스 딥링크 API 프록시
   - 일반 쿠팡 검색 URL → 수수료 추적되는 제휴 딥링크(link.coupang.com/...)로 변환
   - 환경변수 (Vercel > Settings > Environment Variables):
       COUPANG_ACCESS_KEY   (필수) 쿠팡 파트너스 Open API Access Key
       COUPANG_SECRET_KEY   (필수) 쿠팡 파트너스 Open API Secret Key
       COUPANG_SUBID        (선택) 채널/추적 ID (예: AF2213142)
   - 키가 없으면 일반 쿠팡 검색 링크로 폴백(수수료 추적 X).
   ========================================================================= */
import crypto from "node:crypto";

const DOMAIN = "https://api-gateway.coupang.com";
const PATH = "/v2/providers/affiliate_open_api/apis/openapi/v1/deeplink";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=604800");

  const ACCESS = process.env.COUPANG_ACCESS_KEY;
  const SECRET = process.env.COUPANG_SECRET_KEY;
  const SUBID  = process.env.COUPANG_SUBID || "";
  const action = (req.query.action || "deeplink").toString();

  const q = (req.query.q || "").toString().trim();
  const searchUrl = `https://www.coupang.com/np/search?component=&q=${encodeURIComponent(q)}&channel=user`;

  if (action === "status") {
    return res.status(200).json({ ok: true, configured: Boolean(ACCESS && SECRET) });
  }
  // 키 미설정 → 일반 검색 링크 폴백
  if (!ACCESS || !SECRET) {
    return res.status(200).json({ ok: true, configured: false, url: q ? searchUrl : "" });
  }
  if (!q) return res.status(200).json({ ok: true, url: "" });

  try {
    const datetime = new Date().toISOString().substr(2, 17).replace(/[-:]/g, "") + "Z"; // yyMMddTHHmmssZ
    const message = datetime + "POST" + PATH;
    const signature = crypto.createHmac("sha256", SECRET).update(message).digest("hex");
    const authorization = `CEA algorithm=HmacSHA256, access-key=${ACCESS}, signed-date=${datetime}, signature=${signature}`;

    const body = { coupangUrls: [searchUrl] };
    if (SUBID) body.subId = SUBID;

    const r = await fetch(DOMAIN + PATH, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: authorization },
      body: JSON.stringify(body),
    });
    if (!r.ok) return res.status(200).json({ ok: true, configured: true, url: searchUrl, fallback: true });

    const j = await r.json();
    const link = j && j.data && j.data[0] && (j.data[0].shortenUrl || j.data[0].landingUrl);
    return res.status(200).json({ ok: true, configured: true, url: link || searchUrl });
  } catch (err) {
    return res.status(200).json({ ok: true, configured: true, url: searchUrl, fallback: true, message: String(err) });
  }
}
