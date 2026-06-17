/* =========================================================================
   Vercel 서버리스: 향수별 SEO 페이지 (서버 렌더링 HTML)
   - /perfume/:id  → vercel.json rewrite → /api/perfume?id=:id
   - 검색엔진 크롤러가 읽을 수 있도록 본문을 서버에서 완성해 내려보냄
   - 데이터는 data.js를 그대로 재사용 (Node에서 module.exports)
   ========================================================================= */
const { NOTES, NOTE_FAMILIES, PERFUMES } = require("../data.js");

const SITE = "https://scentpedia.co.kr";

function esc(s){
  return String(s == null ? "" : s).replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function won(n){ return n ? "약 " + Number(n).toLocaleString("ko-KR") + "원" : ""; }
function noteName(k){ const n = NOTES[k]; return n ? n.name : k; }
function noteEmoji(k){ const n = NOTES[k]; return n ? n.emoji : "•"; }
function noteAnalogy(k){ const n = NOTES[k]; return n ? n.analogy : ""; }

function layerBlock(label, keys){
  if (!keys || !keys.length) return "";
  const items = keys.map(k =>
    `<li><b>${noteEmoji(k)} ${esc(noteName(k))}</b>${noteAnalogy(k) ? ` — <span>${esc(noteAnalogy(k))}</span>` : ""}</li>`).join("");
  return `<section class="layer"><h2>${esc(label)}</h2><ul>${items}</ul></section>`;
}

function allNotes(p){
  return [...(p.top || []), ...(p.middle || []), ...(p.base || [])];
}

function renderPerfume(p){
  const fullName = `${p.brand} ${p.name}`;
  const notesText = allNotes(p).map(noteName).join(", ");
  const title = `${fullName} 향수 노트·가격 | Scentpedia`;
  const desc = `${fullName}${p.en ? ` (${p.en})` : ""} 향수의 탑·미들·베이스 노트와 예상 가격(${won(p.price)})을 한눈에. ${p.desc || ""} 주요 노트: ${notesText}.`.slice(0, 160);
  const url = `${SITE}/perfume/${encodeURIComponent(p.id)}`;

  // 같은 브랜드의 다른 향수 (내부 링크 → SEO)
  const related = PERFUMES.filter(x => x.brand === p.brand && x.id !== p.id).slice(0, 6);
  const relatedHTML = related.length ? `<section class="related"><h2>${esc(p.brand)}의 다른 향수</h2><ul>${
    related.map(r => `<li><a href="/perfume/${encodeURIComponent(r.id)}">${esc(r.name)}</a></li>`).join("")
  }</ul></section>` : "";

  const jsonld = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: fullName,
    brand: { "@type": "Brand", name: p.brand },
    description: p.desc || desc,
    category: "향수",
    url,
    ...(p.price ? { offers: { "@type": "Offer", priceCurrency: "KRW", price: p.price, availability: "https://schema.org/InStock", url } } : {}),
  };

  const body = `
    <nav class="crumb"><a href="${SITE}/">Scentpedia</a> › <a href="${SITE}/perfume">향수</a> › ${esc(p.brand)}</nav>
    <header class="ph">
      <div class="brand">${esc(p.brand)}${p.gender ? ` · ${esc(p.gender)}` : ""}</div>
      <h1>${esc(p.name)}</h1>
      ${p.en ? `<div class="en">${esc(p.en)}</div>` : ""}
      ${p.price ? `<div class="price">${esc(won(p.price))} <small>(50ml 기준 추정가)</small></div>` : ""}
    </header>
    ${p.desc ? `<p class="lead">${esc(p.desc)}</p>` : ""}
    ${layerBlock("탑 노트 (첫인상)", p.top)}
    ${layerBlock("미들 노트 (중심 향)", p.middle)}
    ${layerBlock("베이스 노트 (잔향)", p.base)}
    ${relatedHTML}
    <div class="cta">
      <a class="btn" href="${SITE}/?p=${encodeURIComponent(p.id)}">앱에서 시세·구매처·비슷한 향수 보기 →</a>
    </div>`;

  return pageShell({ title, desc, url, body, jsonld, ogTitle: `${fullName} 향수`, image: `${SITE}/logo.png` });
}

function renderIndex(){
  const title = "향수 전체 목록 · 노트와 가격 | Scentpedia";
  const desc = "디올, 샤넬, 톰포드, 르라보 등 인기 향수의 탑·미들·베이스 노트와 예상 가격을 한곳에서. 향수 백과사전 Scentpedia.";
  const url = `${SITE}/perfume`;
  // 브랜드별 그룹
  const byBrand = {};
  for (const p of PERFUMES){ (byBrand[p.brand] = byBrand[p.brand] || []).push(p); }
  const brands = Object.keys(byBrand).sort((a, b) => a.localeCompare(b, "ko"));
  const body = `
    <nav class="crumb"><a href="${SITE}/">Scentpedia</a> › 향수 목록</nav>
    <header class="ph"><h1>향수 전체 목록</h1>
      <p class="lead">${PERFUMES.length}종의 향수 노트와 예상 가격. 향수를 눌러 자세히 보세요.</p></header>
    ${brands.map(b => `<section class="related"><h2>${esc(b)}</h2><ul>${
      byBrand[b].map(p => `<li><a href="/perfume/${encodeURIComponent(p.id)}">${esc(p.name)}</a></li>`).join("")
    }</ul></section>`).join("")}`;
  return pageShell({ title, desc, url, body, ogTitle: "향수 전체 목록", image: `${SITE}/logo.png` });
}

function pageShell({ title, desc, url, body, jsonld, ogTitle, image }){
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(url)}">
<meta property="og:title" content="${esc(ogTitle || title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${esc(url)}">
<meta property="og:site_name" content="Scentpedia">
<meta property="og:image" content="${esc(image)}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/png" href="/logo.png?v=1">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css">
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>` : ""}
<style>
  :root{--accent:#b14a5f;--ink:#1a1916;--muted:#7c7870;--line:#e7e2d9;--cream:#faf7f2}
  *{box-sizing:border-box}
  body{font-family:"Pretendard",system-ui,sans-serif;color:var(--ink);background:var(--cream);margin:0;line-height:1.65}
  .wrap{max-width:760px;margin:0 auto;padding:28px 20px 60px}
  a{color:var(--accent);text-decoration:none}
  a:hover{text-decoration:underline}
  .crumb{font-size:13px;color:var(--muted);margin-bottom:18px}
  .ph .brand{font-size:14px;color:var(--muted);font-weight:700}
  h1{font-size:30px;margin:4px 0 6px;letter-spacing:-.02em}
  .ph .en{color:var(--muted);font-size:15px}
  .price{font-size:18px;font-weight:800;color:var(--accent);margin-top:10px}
  .price small{font-size:12px;color:var(--muted);font-weight:600}
  .lead{font-size:16px;color:#3a3833;margin:16px 0 24px}
  .layer,.related{background:#fff;border:1px solid var(--line);border-radius:16px;padding:18px 20px;margin:14px 0}
  .layer h2,.related h2{font-size:16px;margin:0 0 12px;color:var(--accent)}
  .layer ul{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:10px}
  .layer li b{font-weight:800}
  .layer li span{color:var(--muted);font-size:14.5px}
  .related ul{list-style:none;padding:0;margin:0;display:flex;flex-wrap:wrap;gap:8px}
  .related li a{display:inline-block;background:var(--cream);border:1px solid var(--line);border-radius:999px;padding:7px 14px;font-size:14px;font-weight:700}
  .cta{margin-top:28px;text-align:center}
  .btn{display:inline-block;background:var(--accent);color:#fff;font-weight:800;padding:15px 26px;border-radius:14px;font-size:15px}
  .btn:hover{text-decoration:none;opacity:.92}
  footer{margin-top:40px;font-size:12px;color:var(--muted);text-align:center}
</style>
</head>
<body>
<main class="wrap">
${body}
<footer>※ 표시 가격은 50ml 기준 추정치이며 실제 판매가와 다를 수 있습니다. © 2026 Scentpedia</footer>
</main>
</body>
</html>`;
}

module.exports = function handler(req, res){
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=604800");
  const id = (req.query.id || "").toString().trim();
  if (!id){
    return res.status(200).send(renderIndex());
  }
  const p = PERFUMES.find(x => x.id === id);
  if (!p){
    res.statusCode = 404;
    return res.send(pageShell({
      title: "향수를 찾을 수 없어요 | Scentpedia",
      desc: "요청하신 향수 정보를 찾을 수 없습니다.",
      url: `${SITE}/perfume`,
      body: `<header class="ph"><h1>향수를 찾을 수 없어요</h1></header><div class="cta"><a class="btn" href="/perfume">전체 향수 목록 보기</a></div>`,
      image: `${SITE}/logo.png`,
    }));
  }
  return res.status(200).send(renderPerfume(p));
};
