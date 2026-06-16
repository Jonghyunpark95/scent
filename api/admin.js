/* =========================================================================
   Vercel 서버리스: 관리자용 — 가입자 목록 + 통계
   - 접근: /api/admin?key=ADMIN_KEY  (key가 환경변수 ADMIN_KEY와 일치해야 함)
   - 환경변수: ADMIN_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE
   - service_role은 서버에만 존재 (브라우저 노출 X)
   ========================================================================= */
export default async function handler(req, res) {
  const KEY = process.env.ADMIN_KEY;
  const SB = process.env.SUPABASE_URL, SR = process.env.SUPABASE_SERVICE_ROLE;
  if (!KEY || !SB || !SR) return res.status(200).json({ ok: false, reason: "not_configured" });
  if ((req.query.key || "") !== KEY) return res.status(401).json({ ok: false, reason: "unauthorized" });

  const h = { apikey: SR, Authorization: "Bearer " + SR };
  try {
    // 가입자 목록 (GoTrue admin)
    const ur = await fetch(`${SB}/auth/v1/admin/users?per_page=500`, { headers: h });
    const uj = await ur.json();
    const users = (uj.users || []).map(u => ({
      email: u.email,
      nickname: (u.user_metadata && u.user_metadata.nickname) || "",
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      confirmed: !!u.email_confirmed_at,
    })).sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));

    const count = async (t) => {
      const r = await fetch(`${SB}/rest/v1/${t}?select=id`, { headers: { ...h, Prefer: "count=exact", Range: "0-0" } });
      const cr = r.headers.get("content-range") || "/0";
      return parseInt(cr.split("/")[1] || "0", 10) || 0;
    };
    const [reviews, posts, comments, diary] = await Promise.all([count("reviews"), count("posts"), count("comments"), count("diary")]);

    return res.status(200).json({ ok: true, total: users.length, users, stats: { reviews, posts, comments, diary } });
  } catch (err) {
    return res.status(200).json({ ok: false, reason: "fetch_error", message: String(err) });
  }
}
