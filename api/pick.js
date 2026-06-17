/* =========================================================================
   Vercel 서버리스: Editor's Pick 글 페이지 (서버 렌더링 HTML, SEO 인덱싱용)
   - /pick/:slug → vercel.json rewrite → /api/pick?slug=:slug
   - /pick       → 글 목록
   - 크롤러가 본문을 바로 읽도록 서버에서 HTML 완성 + og/JSON-LD 메타 포함
   ========================================================================= */
const SITE = "https://scentpedia.co.kr";

function esc(s){
  return String(s == null ? "" : s).replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function fmtDate(d){ try { return new Date(d).toISOString().slice(0, 10); } catch (e) { return ""; } }

// 평문 본문 → 안전한 문단 HTML (HTML 태그는 이스케이프, 줄바꿈만 보존)
function bodyHTML(body){
  return String(body || "").split(/\n{2,}/).map(par =>
    `<p>${esc(par).replace(/\n/g, "<br>")}</p>`).join("");
}

async function fetchPicks({ slug }){
  const SB = process.env.SUPABASE_URL, SR = process.env.SUPABASE_SERVICE_ROLE;
  if (!SB || !SR) return slug ? null : [];
  const h = { apikey: SR, Authorization: "Bearer " + SR };
  let q = `${SB}/rest/v1/editor_picks?select=*&published=eq.true&order=created_at.desc`;
  if (slug) q = `${SB}/rest/v1/editor_picks?select=*&slug=eq.${encodeURIComponent(slug)}&published=eq.true`;
  const r = await fetch(q, { headers: h });
  if (!r.ok) return slug ? null : [];
  const rows = await r.json();
  return slug ? (rows && rows[0]) || null : (rows || []);
}

function shell({ title, desc, url, body, jsonld, image }){
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(url)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="article">
<meta property="og:url" content="${esc(url)}">
<meta property="og:site_name" content="Scentpedia">
<meta property="og:image" content="${esc(image || SITE + '/logo.png')}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/png" href="/logo.png?v=1">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css">
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>` : ""}
<style>
  :root{--accent:#b14a5f;--ink:#1a1916;--muted:#7c7870;--line:#e7e2d9;--cream:#faf7f2}
  *{box-sizing:border-box}
  body{font-family:"Pretendard",system-ui,sans-serif;color:var(--ink);background:var(--cream);margin:0;line-height:1.75}
  .wrap{max-width:720px;margin:0 auto;padding:28px 20px 60px}
  a{color:var(--accent);text-decoration:none}a:hover{text-decoration:underline}
  .crumb{font-size:13px;color:var(--muted);margin-bottom:18px}
  h1{font-size:30px;margin:6px 0 8px;letter-spacing:-.02em;line-height:1.3}
  .date{font-size:13px;color:var(--muted)}
  .summary{font-size:17px;color:#3a3833;margin:14px 0 22px;font-weight:600}
  .hero{width:100%;border-radius:18px;border:1px solid var(--line);margin:8px 0 24px;display:block}
  article p{font-size:16px;margin:0 0 18px}
  .pick-list{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:14px}
  .pick-item{display:flex;gap:14px;background:#fff;border:1px solid var(--line);border-radius:16px;padding:14px;align-items:center}
  .pick-item img{width:84px;height:84px;object-fit:cover;border-radius:12px;flex-shrink:0}
  .pick-item h2{font-size:17px;margin:0 0 4px}
  .pick-item p{font-size:14px;color:var(--muted);margin:0}
  .cta{margin-top:30px;text-align:center}
  .btn{display:inline-block;background:var(--accent);color:#fff;font-weight:800;padding:14px 24px;border-radius:14px;font-size:15px}
  .btn:hover{text-decoration:none;opacity:.92}
  .btn.ghost{background:#fff;color:var(--accent);border:1px solid var(--accent)}
  .cta+.cta{margin-top:12px}
  footer{margin-top:40px;font-size:12px;color:var(--muted);text-align:center}
</style>
</head>
<body>
<main class="wrap">
${body}
<footer>© 2026 Scentpedia · <a href="${SITE}/">향수 취향 찾기</a></footer>
</main>
</body>
</html>`;
}

function renderOne(pk){
  const title = `${pk.title} | Scentpedia 에디터 추천`;
  const desc = (pk.summary || pk.body || pk.title || "").toString().replace(/\s+/g, " ").slice(0, 160);
  const url = `${SITE}/pick/${encodeURIComponent(pk.slug)}`;
  const jsonld = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: pk.title,
    datePublished: pk.created_at,
    dateModified: pk.updated_at || pk.created_at,
    image: pk.image_url || `${SITE}/logo.png`,
    author: { "@type": "Organization", name: "Scentpedia" },
    publisher: { "@type": "Organization", name: "Scentpedia", logo: { "@type": "ImageObject", url: `${SITE}/logo.png` } },
    mainEntityOfPage: url,
  };
  const body = `
    <nav class="crumb"><a href="${SITE}/">Scentpedia</a> › <a href="${SITE}/pick">에디터 추천</a></nav>
    <div class="date">${esc(fmtDate(pk.created_at))} · 에디터 추천</div>
    <h1>${esc(pk.title)}</h1>
    ${pk.summary ? `<div class="summary">${esc(pk.summary)}</div>` : ""}
    ${pk.image_url ? `<img class="hero" src="${esc(pk.image_url)}" alt="${esc(pk.title)}">` : ""}
    <article>${bodyHTML(pk.body)}</article>
    ${pk.link_url ? `<div class="cta"><a class="btn" href="${esc(pk.link_url)}" target="_blank" rel="noopener">📖 블로그에서 전문 보기 →</a></div>` : ""}
    <div class="cta"><a class="btn ghost" href="${SITE}/">Scentpedia에서 내 취향 향수 찾기 →</a></div>`;
  return shell({ title, desc, url, body, jsonld, image: pk.image_url });
}

function renderList(picks){
  const title = "에디터 추천 · 향수 이야기 | Scentpedia";
  const desc = "Scentpedia 에디터가 직접 고른 향수 추천과 향수 이야기. 입문 가이드부터 시즌 추천까지.";
  const url = `${SITE}/pick`;
  const items = picks.length ? `<ul class="pick-list">${picks.map(pk => `
    <li class="pick-item">
      ${pk.image_url ? `<img src="${esc(pk.image_url)}" alt="${esc(pk.title)}">` : ""}
      <div><h2><a href="/pick/${encodeURIComponent(pk.slug)}">${esc(pk.title)}</a></h2>
      <p>${esc((pk.summary || "").slice(0, 80))}</p></div>
    </li>`).join("")}</ul>` : `<p>아직 등록된 추천 글이 없어요.</p>`;
  const body = `
    <nav class="crumb"><a href="${SITE}/">Scentpedia</a> › 에디터 추천</nav>
    <h1>에디터 추천</h1>
    <p class="summary">에디터가 직접 고른 향수 이야기</p>
    ${items}
    <div class="cta"><a class="btn" href="${SITE}/">내 취향 향수 찾기 →</a></div>`;
  return shell({ title, desc, url, body, image: `${SITE}/logo.png` });
}

module.exports = async function handler(req, res){
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate=86400");
  const slug = (req.query.slug || "").toString().trim();
  try {
    if (slug){
      const pk = await fetchPicks({ slug });
      if (!pk){
        res.statusCode = 404;
        return res.send(shell({ title: "글을 찾을 수 없어요 | Scentpedia", desc: "요청하신 글을 찾을 수 없습니다.", url: `${SITE}/pick`,
          body: `<h1>글을 찾을 수 없어요</h1><div class="cta"><a class="btn" href="/pick">목록 보기</a></div>` }));
      }
      return res.status(200).send(renderOne(pk));
    }
    const picks = await fetchPicks({});
    return res.status(200).send(renderList(picks));
  } catch (err) {
    res.statusCode = 500;
    return res.send(shell({ title: "오류 | Scentpedia", desc: "", url: `${SITE}/pick`, body: `<h1>일시적 오류</h1><p>${esc(String(err && err.message || err))}</p>` }));
  }
};
