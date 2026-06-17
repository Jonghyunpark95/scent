/* =========================================================================
   Vercel 서버리스: 동적 sitemap.xml
   - /sitemap.xml → vercel.json rewrite → /api/sitemap
   - 홈 + 향수 전체 목록 + 향수별 SEO 페이지 + Editor's Pick 글을 포함
   ========================================================================= */
const { PERFUMES } = require("../data.js");

const SITE = "https://scentpedia.co.kr";

function url(loc, freq, prio){
  return `<url><loc>${loc}</loc>${freq ? `<changefreq>${freq}</changefreq>` : ""}${prio ? `<priority>${prio}</priority>` : ""}</url>`;
}

// Editor's Pick 글 목록 (있으면 포함, 없으면 무시)
async function loadPicks(){
  const SB = process.env.SUPABASE_URL, ANON = process.env.SUPABASE_ANON || process.env.SUPABASE_SERVICE_ROLE;
  if (!SB || !ANON) return [];
  try {
    const r = await fetch(`${SB}/rest/v1/editor_picks?select=slug,updated_at,published&published=eq.true`, {
      headers: { apikey: ANON, Authorization: "Bearer " + ANON },
    });
    if (!r.ok) return [];
    return (await r.json()) || [];
  } catch (e) { return []; }
}

module.exports = async function handler(req, res){
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "s-maxage=43200, stale-while-revalidate=86400");

  const picks = await loadPicks();
  const parts = [];
  parts.push(url(`${SITE}/`, "weekly", "1.0"));
  parts.push(url(`${SITE}/perfume`, "weekly", "0.8"));
  for (const p of PERFUMES){
    parts.push(url(`${SITE}/perfume/${encodeURIComponent(p.id)}`, "monthly", "0.6"));
  }
  for (const pk of picks){
    if (pk && pk.slug) parts.push(url(`${SITE}/pick/${encodeURIComponent(pk.slug)}`, "weekly", "0.7"));
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${parts.join("\n")}
</urlset>`;
  return res.status(200).send(xml);
};
