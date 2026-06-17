/* =========================================================================
   Vercel 서버리스: 시세 알림 이메일 테스트 발송
   - GET /api/test-email?key=ADMIN_KEY&to=받을주소[&name=향수명&price=245000&target=250000]
   - 실제 알림과 동일한 템플릿으로 1통 발송 (관리자 키 필요 — 스팸 방지)
   - 환경변수: ADMIN_KEY, RESEND_API_KEY, RESEND_FROM
   ========================================================================= */
function won(n){ return "약 " + Number(n).toLocaleString("ko-KR") + "원"; }

function alertEmailHTML({ name, price, target }){
  return `<div style="font-family:'Pretendard',sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1a1916">
    <h2 style="color:#b14a5f;margin:0 0 8px">📉 목표가 도달!</h2>
    <p style="font-size:15px;line-height:1.7"><b>${name}</b>의 시세가 설정하신 목표가에 도달했어요.</p>
    <div style="background:#faf7f2;border:1px solid #e7e2d9;border-radius:12px;padding:16px;margin:16px 0">
      <div style="font-size:14px;color:#7c7870">현재 시세</div>
      <div style="font-size:26px;font-weight:800;color:#b14a5f">${won(price)}</div>
      <div style="font-size:13px;color:#7c7870;margin-top:6px">목표가 ${won(target)} 이하</div>
    </div>
    <a href="https://scentpedia.co.kr/" style="display:inline-block;background:#b14a5f;color:#fff;font-weight:800;padding:12px 22px;border-radius:10px;text-decoration:none">구매처 보러 가기 →</a>
    <p style="font-size:12px;color:#9b958c;margin-top:20px">Scentpedia 시세 알림 · 한 번 도달하면 다시 오를 때까지 추가 메일은 보내지 않아요.<br>(이 메일은 <b>테스트 발송</b>입니다.)</p>
  </div>`;
}

module.exports = async function handler(req, res){
  const KEY = process.env.ADMIN_KEY;
  const RESEND = process.env.RESEND_API_KEY;
  const FROM = process.env.RESEND_FROM || "Scentpedia <onboarding@resend.dev>";

  if ((req.query.key || "") !== KEY || !KEY) return res.status(401).json({ ok: false, reason: "unauthorized" });
  if (!RESEND) return res.status(200).json({ ok: false, reason: "resend_not_configured", hint: "Vercel 환경변수 RESEND_API_KEY를 설정하세요." });

  const to = (req.query.to || "").toString().trim();
  if (!to) return res.status(400).json({ ok: false, reason: "to_required" });
  const name = (req.query.name || "르라보 상탈 33").toString();
  const price = parseInt(req.query.price, 10) || 245000;
  const target = parseInt(req.query.target, 10) || 250000;

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer " + RESEND, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM, to,
        subject: `📉 ${name} 목표가 도달! (테스트)`,
        html: alertEmailHTML({ name, price, target }),
      }),
    });
    const body = await r.json().catch(() => ({}));
    if (!r.ok) return res.status(200).json({ ok: false, status: r.status, from: FROM, to, resend: body });
    return res.status(200).json({ ok: true, from: FROM, to, id: body.id || null, note: "발송 성공 — 메일함(스팸함 포함) 확인하세요." });
  } catch (err) {
    return res.status(200).json({ ok: false, reason: "send_failed", message: String(err && err.message || err) });
  }
};
