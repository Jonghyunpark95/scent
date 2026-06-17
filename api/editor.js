/* =========================================================================
   Vercel 서버리스: Editor's Pick (관리자 추천 글) CRUD
   - GET                 → 공개된 글 목록 (홈/목록용).  ?slug=x → 단일 글
   - GET ?key=ADMIN_KEY  → 비공개 포함 전체 목록 (관리자)
   - POST (ADMIN_KEY)    → 글 작성/수정 (+ base64 이미지 → Supabase Storage 업로드)
   - DELETE (ADMIN_KEY)  → ?id 또는 ?slug 글 삭제
   - 환경변수: ADMIN_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE
   ========================================================================= */
const BUCKET = "editor";

function env(){ return { KEY: process.env.ADMIN_KEY, SB: process.env.SUPABASE_URL, SR: process.env.SUPABASE_SERVICE_ROLE }; }
function sbHeaders(SR){ return { apikey: SR, Authorization: "Bearer " + SR }; }

function slugify(s){
  const base = String(s || "").toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .trim().replace(/\s+/g, "-").slice(0, 60);
  return base || "pick";
}

async function uploadImage(dataUrl, slug, { SB, SR }){
  const m = String(dataUrl).match(/^data:(image\/[\w.+-]+);base64,(.+)$/s);
  if (!m) return null;
  const mime = m[1];
  const ext = (mime.split("/")[1] || "png").replace(/[^a-z0-9]/g, "");
  const buf = Buffer.from(m[2], "base64");
  if (buf.length > 5 * 1024 * 1024) throw new Error("이미지가 너무 큽니다 (5MB 이하)");
  const path = `${slug}-${Date.now()}.${ext}`;
  const r = await fetch(`${SB}/storage/v1/object/${BUCKET}/${path}`, {
    method: "POST",
    headers: { ...sbHeaders(SR), "Content-Type": mime, "x-upsert": "true" },
    body: buf,
  });
  if (!r.ok) throw new Error("이미지 업로드 실패: " + (await r.text()).slice(0, 200));
  return `${SB}/storage/v1/object/public/${BUCKET}/${path}`;
}

module.exports = async function handler(req, res){
  const { KEY, SB, SR } = env();
  if (!SB || !SR) return res.status(200).json({ ok: false, reason: "not_configured" });
  const h = sbHeaders(SR);
  const isAdmin = KEY && (req.query.key || (req.headers["x-admin-key"] || "")) === KEY;

  try {
    if (req.method === "GET"){
      const slug = (req.query.slug || "").toString().trim();
      let q = `${SB}/rest/v1/editor_picks?select=*&order=created_at.desc`;
      if (slug) q = `${SB}/rest/v1/editor_picks?select=*&slug=eq.${encodeURIComponent(slug)}`;
      else if (!isAdmin) q += "&published=eq.true";
      const r = await fetch(q, { headers: h });
      const rows = await r.json();
      if (slug) return res.status(200).json({ ok: true, pick: (rows && rows[0]) || null });
      return res.status(200).json({ ok: true, picks: rows || [] });
    }

    // 이하 쓰기 작업은 관리자만
    if (!isAdmin) return res.status(401).json({ ok: false, reason: "unauthorized" });

    if (req.method === "POST"){
      const b = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
      if (!b.title) return res.status(400).json({ ok: false, reason: "title_required" });
      const slug = slugify(b.slug || b.title) + (b.slug ? "" : "-" + Date.now().toString(36));
      let image_url = b.image_url || null;
      if (b.image && /^data:/.test(b.image)) image_url = await uploadImage(b.image, slug, { SB, SR });

      const row = {
        slug,
        title: b.title,
        summary: b.summary || null,
        body: b.body || null,
        image_url,
        link_url: b.link_url || null,
        published: b.published !== false,
        updated_at: new Date().toISOString(),
      };
      const r = await fetch(`${SB}/rest/v1/editor_picks?on_conflict=slug`, {
        method: "POST",
        headers: { ...h, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=representation" },
        body: JSON.stringify(row),
      });
      if (!r.ok) return res.status(200).json({ ok: false, reason: "insert_failed", message: (await r.text()).slice(0, 300) });
      const saved = await r.json();
      return res.status(200).json({ ok: true, pick: (saved && saved[0]) || row });
    }

    if (req.method === "DELETE"){
      const id = (req.query.id || "").toString();
      const slug = (req.query.slug || "").toString();
      const filter = id ? `id=eq.${encodeURIComponent(id)}` : slug ? `slug=eq.${encodeURIComponent(slug)}` : null;
      if (!filter) return res.status(400).json({ ok: false, reason: "id_or_slug_required" });
      const r = await fetch(`${SB}/rest/v1/editor_picks?${filter}`, { method: "DELETE", headers: h });
      return res.status(200).json({ ok: r.ok });
    }

    return res.status(405).json({ ok: false, reason: "method_not_allowed" });
  } catch (err) {
    return res.status(200).json({ ok: false, reason: "error", message: String(err && err.message || err) });
  }
};
