/* =========================================================================
   Scent Finder — app.js
   - 좋아하는 향수 선택 → 취향 분석 / 추천 / 베이스향 설명 / 브랜드 모음
   - 향수병 일러스트 자동 생성(SVG) + 네이버 쇼핑 연동(이미지/구매처/백과사전 검색)
   ========================================================================= */
"use strict";

/* ---------- 유틸 ---------- */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const won = n => "약 " + Number(n).toLocaleString("ko-KR") + "원";
const norm = s => (s || "").toLowerCase().replace(/\s+/g, "");

function getNote(key){
  if (NOTES[key]) return NOTES[key];
  // DB에 없는 노트 안전 처리
  return { name: key, family: "woody", emoji: "•", analogy: "" };
}
function fam(key){ return getNote(key).family; }
function famMeta(f){ return NOTE_FAMILIES[f] || { label: f, emoji: "•", color: "#9b93c4" }; }
const allNotes = p => [...p.top, ...p.middle, ...p.base];

function hash(s){ let h=0; for(let i=0;i<s.length;i++){h=(h<<5)-h+s.charCodeAt(i);h|=0;} return h; }
function esc(s){ return String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])); }

/* =========================================================================
   이미지 — 네이버 쇼핑 실제 제품 사진 우선, 없으면 미니멀 플레이스홀더
   ========================================================================= */
function getEnTerm(p){ return p.en || (typeof EN_NAMES !== "undefined" && EN_NAMES[p.id]) || p.name; }
function placeholderHTML(){
  return `<div class="ph"><svg viewBox="0 0 48 64" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" aria-hidden="true">
    <rect x="19" y="3" width="10" height="7" rx="1.5"/>
    <path d="M16 11h16c1 3.2 4 4 4 9v32a7 7 0 0 1-7 7H19a7 7 0 0 1-7-7V20c0-5 3-5.8 4-9z"/></svg></div>`;
}
function artHTML(p){
  if (p._img) return `<img src="${esc(p._img)}" alt="${esc(p.name)}" loading="lazy" onerror="this.outerHTML=window.__ph()">`;
  return placeholderHTML();
}
window.__ph = () => placeholderHTML();
function findPerfume(id){ return PERFUMES.find(x => x.id === id) || (window.__apiCache && window.__apiCache[id]); }

/* 이미지 캐시 (세션 유지 → API 호출 절약). 네이버 쇼핑 이미지를 사용. */
const imgCache = {};
async function naverImageFor(p){
  // 여러 검색어를 순서대로 시도 (소분·데칸트만 잡히는 상탈33 등 보완 + 영문명 폴백)
  const queries = [];
  if (p._api){ if (p.name) queries.push(p.name); }
  else {
    if (p.brand && p.name) queries.push(p.brand + " " + p.name);
    const en = getEnTerm(p); if (en && en !== p.name) queries.push(en);
    if (p.name) queries.push(p.name);
  }
  if (!queries.length) return null;
  const cacheKey = queries[0];
  if (cacheKey in imgCache) return imgCache[cacheKey];
  try{ const s = sessionStorage.getItem("nimg:" + cacheKey); if (s) return (imgCache[cacheKey] = s); }catch(e){}
  let url = null;
  for (const q of queries){
    const data = await naverFetch("search", { q, display: 20 });   // 넉넉히 받아 JUNK 필터 후에도 이미지가 남도록
    const hit = data && data.items && data.items.find(i => i.image);
    if (hit && hit.image){ url = hit.image; break; }
  }
  imgCache[cacheKey] = url;
  // 양성 결과만 영구 캐시 → 실패 시 다음 방문에 재시도
  try{ if (url) sessionStorage.setItem("nimg:" + cacheKey, url); }catch(e){}
  return url;
}

/* 카드가 화면에 보이면 실제 사진을 지연 로딩 (네이버) */
let _imgObs;
function observeImages(scope){
  if (!NAVER.enabled) return;
  if (!_imgObs){
    _imgObs = new IntersectionObserver(ents=>{
      ents.forEach(en=>{ if(en.isIntersecting){ _imgObs.unobserve(en.target); lazyLoadImage(en.target); } });
    }, { rootMargin: "300px" });
  }
  (scope || document).querySelectorAll(".pcard, .fcard").forEach(c=>{
    const p = findPerfume(c.dataset.id);
    if (p && !p._img && !c.dataset.obs){ c.dataset.obs = "1"; _imgObs.observe(c); }
  });
}
async function lazyLoadImage(card){
  const p = findPerfume(card.dataset.id); if (!p || p._img) return;
  const url = await naverImageFor(p);
  if (url){
    p._img = url;
    const art = card.querySelector(".art");
    if (art){ const m = art.querySelector(".match"); art.innerHTML = (m ? m.outerHTML : "") + artHTML(p); }
  }
}

/* ---------- 상태 ---------- */
const state = { selected: [] };   // 선택한 향수 id 배열

/* =========================================================================
   STEP 1 : 검색 & 선택
   ========================================================================= */
const input = $("#search");
const suggest = $("#suggest");

function suggestRow(p){
  return `<div class="row" data-id="${p.id}">
    <div class="thumb">${artHTML(p)}</div>
    <div><b>${esc(p.name)}</b><br><small>${esc(p.brand)}${p._api?"":" · "+esc(p.gender)}</small></div>
  </div>`;
}
let suggestTimer, suggestSeq = 0;
function renderSuggest(q){
  const nq = norm(q);
  if (!nq){ suggest.classList.remove("open"); return; }
  const local = PERFUMES.filter(p =>
    norm(p.name).includes(nq) || norm(p.brand).includes(nq)
  ).filter(p => !state.selected.includes(p.id)).slice(0, 8);

  let html = local.map(suggestRow).join("");
  if (API.enabled) html += `<div class="suggest-more" id="sugMore"><span class="spinner"></span> 더 많은 향수 찾는 중…</div>`;
  else if (!local.length) html = `<div class="empty">"${esc(q)}" 검색 결과가 없어요 🙂</div>`;
  suggest.innerHTML = html;
  suggest.classList.add("open");
  if (!API.enabled) return;

  // 전 세계 DB(RapidAPI)에서 추가 검색
  clearTimeout(suggestTimer);
  const seq = ++suggestSeq;
  suggestTimer = setTimeout(async ()=>{
    const data = await apiFetch("search", { q, limit: 20 });
    if (seq !== suggestSeq) return;                 // 최신 입력만 반영
    const more = $("#sugMore"); if (more) more.remove();
    if (!data || !data.results) return;
    const localNames = new Set(local.map(p=>norm(p.name)));
    const extra = data.results.map(apiToPerfume)
      .filter(p => !state.selected.includes(p.id) && !localNames.has(norm(p.name)));
    if (extra.length) suggest.insertAdjacentHTML("beforeend", extra.map(suggestRow).join(""));
    else if (!local.length) suggest.innerHTML = `<div class="empty">"${esc(q)}" 결과가 없어요 🙂</div>`;
  }, 350);
}
input.addEventListener("input", e => renderSuggest(e.target.value));
input.addEventListener("focus", e => { if (e.target.value) renderSuggest(e.target.value); });
document.addEventListener("click", e => {
  if (!suggest.contains(e.target) && e.target !== input) suggest.classList.remove("open");
});
suggest.addEventListener("click", e => {
  const row = e.target.closest(".row"); if (!row) return;
  addPerfume(row.dataset.id);
  input.value = ""; suggest.classList.remove("open"); input.focus();
});

function addPerfume(id){
  if (state.selected.includes(id)) return;
  state.selected.push(id);
  renderChips();
}
function removePerfume(id){
  state.selected = state.selected.filter(x => x !== id);
  renderChips();
}
function renderChips(){
  const box = $("#chips");
  box.innerHTML = state.selected.map(id => {
    const p = findPerfume(id) || { name: id, brand: "" };
    return `<span class="chip"><b>${esc(p.name)}</b> <small>${esc(p.brand)}</small>
      <span class="x" data-id="${id}" title="삭제">✕</span></span>`;
  }).join("");
  $("#analyzeBtn").disabled = state.selected.length === 0;
  $("#count").textContent = state.selected.length;
}
$("#chips").addEventListener("click", e => {
  const x = e.target.closest(".x"); if (x) removePerfume(x.dataset.id);
});

/* 빠른 선택(예시) */
$("#quick").addEventListener("click", e => {
  const b = e.target.closest("button[data-id]"); if (!b) return;
  addPerfume(b.dataset.id);
});

/* =========================================================================
   분석
   ========================================================================= */
$("#analyzeBtn").addEventListener("click", analyze);

function analyze(){
  const picks = state.selected.map(findPerfume).filter(Boolean);
  if (!picks.length) return;

  // 1) 계열 점수 + 레이어별 계열 점수
  const familyScore = {};
  const layer = { top:{}, middle:{}, base:{} };
  const noteScore = {};   // 추천용 (개별 노트)
  const baseNoteScore = {};
  const W = { top:1, middle:1.2, base:1.4 };

  picks.forEach(p => {
    ["top","middle","base"].forEach(L => {
      p[L].forEach(k => {
        const f = fam(k);
        familyScore[f] = (familyScore[f]||0) + W[L];
        layer[L][f]    = (layer[L][f]||0) + 1;
        noteScore[k]   = (noteScore[k]||0) + W[L];
        if (L === "base") baseNoteScore[k] = (baseNoteScore[k]||0) + 1;
      });
    });
  });

  renderProfile(familyScore);
  renderLayers(layer, picks.length);
  renderBase(baseNoteScore);
  const recs = recommend(noteScore, familyScore);
  renderRecs(recs);
  renderBaseRecs(baseNoteScore);
  buildShareData(familyScore, layer, picks.length);

  const r = $("#results");
  r.classList.add("show");
  r.scrollIntoView({ behavior:"smooth", block:"start" });

}

/* ---- 취향 프로필 (계열 막대) ---- */
function renderProfile(familyScore){
  const entries = Object.entries(familyScore).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const max = entries[0]?.[1] || 1;
  $("#profileBars").innerHTML = entries.map(([f,v])=>{
    const m = famMeta(f);
    return `<div class="bar-row">
      <div class="lab">${m.emoji} ${m.label}</div>
      <div class="bar-track"><div class="bar-fill" style="--w:${Math.round(v/max*100)}%"></div></div>
      <div class="pct">${Math.round(v/max*100)}%</div>
    </div>`;
  }).join("");
  // 애니메이션
  requestAnimationFrame(()=> $$("#profileBars .bar-fill").forEach(el=> el.style.width = el.style.getPropertyValue("--w")));

  const top1 = famMeta(entries[0][0]);
  const top2 = entries[1] ? famMeta(entries[1][0]) : null;
  $("#profileSummary").innerHTML =
    `당신은 <b>${top1.emoji} ${top1.label}</b>${top2?` 계열을 가장 좋아하고, <b>${top2.emoji} ${top2.label}</b>`:""} 계열에 끌리는 취향이에요.`;
}

/* ---- 레이어 성향 (탑/미들/베이스) ---- */
const LAYER_INFO = {
  top:    { name:"탑 노트", sub:"첫인상 (뿌리고 5~15분)", desc:"가볍게 흩날리는 첫 향. 시트러스·과일·허브가 여기 많아요." },
  middle: { name:"미들 노트", sub:"중심 (15분~2시간)", desc:"향의 성격을 결정하는 심장부. 꽃·스파이스가 주로 자리해요." },
  base:   { name:"베이스 노트", sub:"잔향 (2시간 이후)", desc:"오래 남는 마무리. 우디·머스크·바닐라가 깔려요." },
};
function renderLayers(layer, n){
  // 각 레이어의 '취향 집중도' = 가장 많이 겹친 계열 횟수 / 선택 개수
  const conc = {};
  ["top","middle","base"].forEach(L=>{
    const top = Object.entries(layer[L]).sort((a,b)=>b[1]-a[1])[0];
    conc[L] = { fam: top?.[0], score: top ? top[1]/n : 0,
                families: Object.entries(layer[L]).sort((a,b)=>b[1]-a[1]).slice(0,2).map(e=>famMeta(e[0])) };
  });
  const winner = ["top","middle","base"].sort((a,b)=>conc[b].score-conc[a].score)[0];

  $("#layers").innerHTML = ["top","middle","base"].map(L=>{
    const info = LAYER_INFO[L], c = conc[L];
    const fams = c.families.map(m=>`${m.emoji} ${m.label}`).join(", ") || "—";
    return `<div class="layer ${L===winner?"win":""}">
      ${L===winner?'<div class="crown">👑</div>':''}
      <div class="tag">${info.name}</div>
      <h4>${fams}</h4>
      <p>${info.sub}</p>
    </div>`;
  }).join("");

  const wm = LAYER_INFO[winner];
  const verdictMap = {
    top:    "향의 <b>첫인상(상큼함)</b>을 가장 중요하게 여기는 타입이에요. 가볍고 청량하게 시작하는 향을 좋아해요.",
    middle: "향의 <b>중심(꽃·스파이스의 개성)</b>을 즐기는 타입이에요. 향의 '성격'이 뚜렷한 걸 선호해요.",
    base:   "향의 <b>잔향(깊고 오래 남는 마무리)</b>을 중시하는 타입이에요. 은은하게 오래가는 묵직한 향을 좋아해요.",
  };
  $("#layerVerdict").innerHTML = `🎯 ${verdictMap[winner]} <span style="color:var(--muted)">— ${wm.desc}</span>`;
}

/* ---- 베이스(기초)향 쉬운 설명 ---- */
function renderBase(baseNoteScore){
  const top = Object.entries(baseNoteScore).sort((a,b)=>b[1]-a[1]).slice(0,4);
  if (!top.length){ $("#baseCards").innerHTML = `<div class="empty-state">선택한 향수의 베이스 노트 정보가 부족해요.</div>`; return; }
  $("#baseCards").innerHTML = top.map(([k])=>{
    const nt = getNote(k);
    return `<div class="basecard">
      <div class="ico">${nt.emoji}</div>
      <div><h4>${esc(nt.name)}</h4><p>${esc(nt.analogy || "깊고 오래 남는 베이스 노트")}</p></div>
    </div>`;
  }).join("");
}

/* ---- 추천 ---- */
function recommend(noteScore, familyScore){
  const picked = new Set(state.selected);
  const scored = PERFUMES.filter(p => !picked.has(p.id)).map(p=>{
    let s = 0;
    allNotes(p).forEach(k=>{
      if (noteScore[k]) s += noteScore[k] * 2;        // 정확히 같은 노트 가산
      s += (familyScore[fam(k)] || 0) * 0.5;          // 같은 계열 가산
    });
    s = s / Math.sqrt(allNotes(p).length || 1);       // 노트 많다고 유리하지 않게 보정
    return { p, s };
  }).sort((a,b)=>b.s-a.s);

  const max = scored[0]?.s || 1;
  return scored.slice(0, 6).map(x => ({ ...x, match: Math.max(60, Math.round(x.s/max*100)) }));
}
function pcard(p, match){
  const tags = allNotes(p).slice(0,3).map(k=>`<span>${getNote(k).emoji} ${esc(getNote(k).name)}</span>`).join("");
  let foot;
  if (p.price) foot = `<div class="price">${won(p.price)}</div>`;
  else if (p._rating) foot = `<div class="price">⭐ ${Number(p._rating).toFixed(1)}${p._year?` · ${p._year}`:""}</div>`;
  else foot = `<div class="price">${p._year?`${p._year}년 출시`:"향수 정보"}</div>`;
  return `<div class="pcard" data-id="${p.id}">
    <div class="art">${match!=null?`<div class="match">${match}% 매치</div>`:""}${artHTML(p)}</div>
    <div class="info">
      <div class="brand">${esc(p.brand)}${p._api?"":` · ${esc(p.gender)}`}</div>
      <div class="name">${esc(p.name)}</div>
      <div class="note-tags">${tags}</div>
      ${foot}
    </div>
  </div>`;
}
function renderRecs(recs){
  $("#recGrid").innerHTML = recs.map(r => pcard(r.p, r.match)).join("");
  observeImages($("#recGrid"));
}

/* ---- 베이스향 기반 추천 ---- */
function renderBaseRecs(baseNoteScore){
  const favBase = Object.entries(baseNoteScore).sort((a,b)=>b[1]-a[1]).slice(0,3).map(e=>e[0]);
  if (!favBase.length){ $("#baseRecWrap").style.display="none"; return; }
  $("#baseRecWrap").style.display="block";
  const picked = new Set(state.selected);
  const recs = PERFUMES.filter(p => !picked.has(p.id))
    .map(p => ({ p, hit: p.base.filter(b => favBase.includes(b)).length }))
    .filter(x => x.hit > 0)
    .sort((a,b)=>b.hit-a.hit).slice(0,3);

  const names = favBase.map(k=>getNote(k).name).join(", ");
  $("#baseRecTitle").innerHTML = `🧴 <b>${esc(names)}</b> 같은 기초향을 좋아한다면`;
  $("#baseRecGrid").innerHTML = recs.length
    ? recs.map(r => pcard(r.p, null)).join("")
    : `<div class="empty-state">조건에 맞는 향수를 찾지 못했어요.</div>`;
  observeImages($("#baseRecGrid"));
}

/* =========================================================================
   브랜드별 모음
   ========================================================================= */
function initBrands(){
  const brands = [...new Set(PERFUMES.map(p=>p.brand))];
  const tabs = $("#brandTabs");
  tabs.innerHTML = `<button class="on" data-b="전체">전체</button>` +
    brands.map(b=>`<button data-b="${esc(b)}">${esc(b)}</button>`).join("");
  tabs.addEventListener("click", e=>{
    const b = e.target.closest("button"); if(!b) return;
    $$("#brandTabs button").forEach(x=>x.classList.toggle("on", x===b));
    renderBrand(b.dataset.b);
  });
  renderBrand("전체");
}
const BRAND_PAGE = 10;
let _brandState = { list: [], shown: 0 };
function renderBrand(b){
  const grid = $("#brandGrid");
  const internal = b==="전체" ? PERFUMES : PERFUMES.filter(p=>p.brand===b);
  _brandState = { list: internal, shown: 0 };
  grid.innerHTML = "";
  appendBrandPage();
  if (b !== "전체" && API.enabled && typeof BRAND_EN !== "undefined" && BRAND_EN[b]) loadBrandExtra(b, internal);
}
function appendBrandPage(){
  const grid = $("#brandGrid"); if(!grid) return;
  const next = _brandState.list.slice(_brandState.shown, _brandState.shown + BRAND_PAGE);
  grid.insertAdjacentHTML("beforeend", next.map(p=>pcard(p, null)).join(""));
  _brandState.shown += next.length;
  observeImages(grid);
  const wrap = $("#brandLoadMore");
  if(wrap){
    const remaining = _brandState.list.length - _brandState.shown;
    wrap.innerHTML = remaining > 0
      ? `<button class="btn ghost2 more-btn" id="brandMoreBtn">더 보기 (${remaining}개 더)</button>` : "";
    const btn = $("#brandMoreBtn"); if(btn) btn.onclick = appendBrandPage;
  }
}
/* 브랜드 선택 시 API(전 세계 DB)에서 해당 브랜드 향수를 추가로 로딩 */
async function loadBrandExtra(b, internal){
  const grid = $("#brandGrid");
  grid.insertAdjacentHTML("beforeend", `<div class="empty-state" id="brandMore"><span class="spinner"></span> ${esc(b)}의 다른 향수 불러오는 중…</div>`);
  const data = await apiFetch("brand", { brand: BRAND_EN[b], limit: 48 });
  $("#brandMore")?.remove();
  if (!data || !data.results || ($("#brandTabs button.on") && $("#brandTabs button.on").dataset.b !== b)) return;
  const seen = new Set(internal.map(p=>norm(p.name)));
  const extras = data.results.map(apiToPerfume).filter(p=>{ const n=norm(p.name); if(!n||seen.has(n)) return false; seen.add(n); return true; });
  if (!extras.length) return;
  grid.insertAdjacentHTML("beforeend", extras.map(p=>pcard(p, null)).join(""));
  observeImages(grid);
}

/* =========================================================================
   상단 인기 향수 갤러리 (실제 사진으로 시선 잡기)
   ========================================================================= */
const FEATURED = ["kilian-angels","mfk-baccarat","ll-santal33","diptyque-philo","tf-lostcherry","creed-aventus","dior-sauvage","byredo-gypsy"];
function fcard(p){
  return `<div class="fcard" data-id="${p.id}">
    <div class="art">${artHTML(p)}</div>
    <div class="finfo"><div class="brand">${esc(p.brand)}</div><div class="name">${esc(p.name)}</div></div>
  </div>`;
}
function renderFeatured(){
  const rail = $("#featuredRail"); if(!rail) return;
  rail.innerHTML = FEATURED.map(id=>{ const p = PERFUMES.find(x=>x.id===id); return p?fcard(p):""; }).join("");
  observeImages(rail);
}

/* 에디터 추천 (Editor's Pick) — 홈 노출. /api/editor 공개 목록 */
async function initEditorPicks(){
  const rail = $("#pickRail"); if(!rail) return;
  try{
    const r = await fetch("/api/editor");
    const j = await r.json();
    const picks = (j && j.ok && j.picks) || [];
    if(!picks.length) return;
    const hero = picks[0], rest = picks.slice(1,5);
    const heroHTML = `
      <a class="pick-hero" href="/pick/${encodeURIComponent(hero.slug)}">
        <div class="pick-hero-bg">${hero.image_url?`<img src="${esc(hero.image_url)}" alt="${esc(hero.title)}" loading="lazy">`:`<span class="pick-hero-emoji">✨</span>`}</div>
        <div class="pick-hero-text">
          <span class="pick-badge">✨ 에디터 추천</span>
          <b>${esc(hero.title)}</b>
          ${hero.summary?`<p>${esc(hero.summary.slice(0,72))}</p>`:""}
          <span class="pick-cta">읽어보기 →</span>
        </div>
      </a>`;
    const restHTML = rest.length ? `<div class="pick-rail">${rest.map(p=>`
      <a class="pick-card" href="/pick/${encodeURIComponent(p.slug)}">
        <div class="pick-thumb">${p.image_url?`<img src="${esc(p.image_url)}" alt="${esc(p.title)}" loading="lazy">`:"✨"}</div>
        <div class="pick-info"><b>${esc(p.title)}</b><small>${esc((p.summary||"").slice(0,40))}</small></div>
      </a>`).join("")}</div>` : "";
    rail.innerHTML = heroHTML + restHTML;
    $("#editorPick").style.display = "";
  }catch(e){}
}

/* 최근 본 향수 (localStorage) */
function pushRecent(p){
  if (!p || p._api) return;   // 내장 향수만 (새로고침 후 복원 가능)
  try{
    let a = JSON.parse(localStorage.getItem("recent") || "[]");
    a = a.filter(x => x !== p.id); a.unshift(p.id); a = a.slice(0, 12);
    localStorage.setItem("recent", JSON.stringify(a));
  }catch(e){}
}
function renderRecent(){
  const wrap = $("#recentWrap"), rail = $("#recentRail"); if (!wrap || !rail) return;
  let a = []; try{ a = JSON.parse(localStorage.getItem("recent") || "[]"); }catch(e){}
  const ps = a.map(id => PERFUMES.find(x => x.id === id)).filter(Boolean);
  if (!ps.length){ wrap.style.display = "none"; return; }
  wrap.style.display = "";
  rail.innerHTML = ps.map(fcard).join("");
  observeImages(rail);
}

/* =========================================================================
   향수 백과사전 검색 (내장 DB + 네이버 쇼핑)
   ========================================================================= */
const encInput = $("#encSearch");
let encTimer;
encInput.addEventListener("input", e=>{
  clearTimeout(encTimer);
  const q = e.target.value.trim();
  if (!q){ $("#encGrid").innerHTML=""; return; }
  // 즉시 내장 DB 결과
  const local = PERFUMES.filter(p=> norm(p.name).includes(norm(q)) || norm(p.brand).includes(norm(q)));
  $("#encGrid").innerHTML = (local.length ? local.map(p=>pcard(p,null)).join("") : "")
    + `<div class="empty-state" id="encMore"><span class="spinner"></span> 네이버 쇼핑에서 찾는 중…</div>`;
  observeImages($("#encGrid"));
  // 네이버 쇼핑 검색 (디바운스)
  encTimer = setTimeout(()=>encSearchNaver(q, local), 400);
});

async function encSearchNaver(q, local){
  const more = $("#encMore");
  if (!NAVER.enabled){
    if (more) more.outerHTML = local.length ? "" : `<div class="empty-state">"${esc(q)}" 내장 DB에 없어요.</div>`;
    return;
  }
  const data = await naverFetch("search", { q, display: 24, sort: "sim", minPrice: 20000 });
  const items = (data && data.items) || [];
  if (more) more.remove();
  if (!items.length){
    if (!local.length) $("#encGrid").innerHTML = `<div class="empty-state">"${esc(q)}" 결과가 없어요 🙂</div>`;
    return;
  }
  // 내장 DB와 중복되는 이름은 제외
  const seen = new Set(local.map(p=>norm(p.name)));
  const cards = items.filter(it=>{ const n=norm(it.title); if(!n||seen.has(n)) return false; seen.add(n); return true; })
    .map(naverProductCard).join("");
  $("#encGrid").innerHTML = local.map(p=>pcard(p,null)).join("") + cards;
}

/* 네이버 쇼핑 상품 → 외부 링크 카드 (노트 정보는 없고, 구매처로 연결) */
function naverProductCard(it){
  const price = it.price ? pf(it.price) : "";
  const img = it.image
    ? `<img src="${esc(it.image)}" alt="${esc(it.title)}" loading="lazy" onerror="this.outerHTML=window.__ph()">`
    : placeholderHTML();
  return `<a class="pcard shop-card" href="${esc(it.link)}" target="_blank" rel="noopener nofollow sponsored">
    <div class="art">${img}</div>
    <div class="info">
      <div class="brand">🛒 ${esc(it.mall || it.brand || "네이버 쇼핑")}</div>
      <div class="name">${esc(it.title)}</div>
      ${price ? `<div class="price">${price}</div>` : ""}
    </div>
  </a>`;
}

/* 영어 노트명/슬러그 → 내장 NOTES 키 (한글명·비유·이모지 재사용용) */
const EN_NOTE = {
  bergamot:"bergamot", lemon:"lemon", orange:"orange", grapefruit:"grapefruit", mandarin:"mandarin",
  apple:"apple", peach:"peach", blackcurrant:"blackcurrant", "black-currant":"blackcurrant", pear:"pear",
  raspberry:"raspberry", lychee:"lychee", pineapple:"pineapple", plum:"peach",
  rose:"rose", jasmine:"jasmine", peony:"peony", iris:"iris", "lily-of-the-valley":"lily", lily:"lily",
  tuberose:"tuberose", "orange-blossom":"orangeblossom", neroli:"orangeblossom", violet:"violet",
  "ylang-ylang":"ylang", "ylang":"ylang", geranium:"geranium",
  mint:"mint", basil:"basil", lavender:"lavender", sage:"sage", "clary-sage":"sage", rosemary:"rosemary",
  fig:"fig", "green-notes":"greenleaves", galbanum:"galbanum",
  pepper:"pepper", "black-pepper":"pepper", "pink-pepper":"pinkpepper", "sichuan-pepper":"pepper",
  cardamom:"cardamom", cinnamon:"cinnamon", ginger:"ginger", saffron:"saffron", clove:"clove",
  vanilla:"vanilla", caramel:"caramel", honey:"honey", chocolate:"chocolate", cacao:"cacao",
  coffee:"coffee", almond:"almond", coconut:"coconut", "tonka-bean":"tonka", tonka:"tonka",
  sandalwood:"sandalwood", cedarwood:"cedar", cedar:"cedar", vetiver:"vetiver", patchouli:"patchouli",
  oud:"oud", agarwood:"oud", "guaiac-wood":"guaiac", cypress:"cypress", pine:"pine",
  amber:"amber", ambroxan:"amber", incense:"incense", benzoin:"benzoin", labdanum:"labdanum",
  myrrh:"myrrh", elemi:"incense", frankincense:"incense",
  musk:"musk", "white-musk":"whitemusk", leather:"leather", ambergris:"ambergris", oakmoss:"oakmoss",
  marine:"marine", "sea-salt":"seasalt", "sea-notes":"marine", water:"watery", tea:"tea",
  tobacco:"tobacco", rum:"rum", chestnut:"chestnut", ambrette:"ambrette",
};
function resolveNoteKey(n){
  const id = norm(n.id || ""), nm = norm(n.name || "");
  return EN_NOTE[n.id] || EN_NOTE[id] || EN_NOTE[nm] || (n.name || n.id || "노트");
}

/* 프록시 정규화 응답 → 내부 perfume 형태 (이 API는 노트가 평면 리스트) */
const apiCache = (window.__apiCache = {});
function apiToPerfume(r){
  const noteKeys = (r.notes || []).map(resolveNoteKey);
  const year = r.releasedAt ? new Date(r.releasedAt).getFullYear() : null;
  const p = {
    id: "api-" + r.id,
    name: r.name || "이름 미상",
    brand: r.brand || "브랜드 미상",
    gender: "유니섹스",
    price: 0,
    top: [], middle: noteKeys, base: [],   // 평면 노트 → middle에 모음
    desc: "",
    _img: r.image || null,
    _api: true, _flat: true,
    _year: year, _rating: r.rating, _reviews: r.reviews, _perfumers: r.perfumers || [],
  };
  apiCache[p.id] = p;
  return p;
}

/* =========================================================================
   (RapidAPI 제거 — 네이버 쇼핑으로 일원화)
   API.enabled는 항상 false로 두어, 과거 API 분기들은 자동으로 비활성화됨.
   ========================================================================= */
const API = { enabled: false };
function apiFetch(){ return Promise.resolve(null); }   // 호출돼도 무해 (no-op)

/* =========================================================================
   네이버 쇼핑 (구매처·최저가·디퓨저) — /api/shop
   ========================================================================= */
const NAVER = { enabled: false };
const pf = n => Number(n).toLocaleString("ko-KR") + "원";
async function naverFetch(action, params){
  try{
    const qs = new URLSearchParams({ action, ...params }).toString();
    const res = await fetch(`/api/shop?${qs}`);
    if (!res.ok) throw new Error("shop " + res.status);
    const json = await res.json();
    if (json && json.ok === false) return null;
    return json;
  }catch(err){ return null; }
}
async function pingNaver(){
  const d = await naverFetch("status", {});
  NAVER.enabled = !!(d && d.configured);
}
function naverLinkBtn(q){
  return `<a class="buy-btn" href="https://search.shopping.naver.com/search/all?query=${encodeURIComponent(q)}" target="_blank" rel="noopener nofollow sponsored">🛒 네이버 쇼핑에서 구매처·최저가 보기</a>`;
}
/* 모달 안에서 판매처/최저가 로딩 (네이버 + 쿠팡) */
const SHOP_WARN = `<div class="shop-warn">💚 <b>Scentpedia는 정품 거래를 응원해요.</b><br>시세보다 지나치게 저렴한 향수는 <b>가품일 수 있어요.</b> 요즘 향수 가품이 정말 많으니, 정품 여부를 꼭 확인하세요!</div>`;
async function loadShop(p){
  const box = $("#shopBox"); if (!box) return;
  const q = (p._api ? "" : p.brand + " ") + p.name;
  if (!NAVER.enabled){
    box.innerHTML = SHOP_WARN + naverLinkBtn(q);
    return;
  }
  box.innerHTML = `<div class="shop-loading"><span class="spinner"></span> 판매처·최저가 불러오는 중…</div>`;
  const data = await naverFetch("search", { q, display: 10, sort: "sim", minPrice: 30000 });
  if (!data || !data.items || !data.items.length){
    box.innerHTML = SHOP_WARN + naverLinkBtn(q);
    return;
  }
  const priced = data.items.filter(i => i.price > 0)
    .map(i => ({ ...i, ml: mlOf(i.title) })).sort((a,b)=>a.price-b.price);
  const median = priced.length ? priced[Math.floor(priced.length/2)].price : 0;
  const susp = i => median && i.price < median * 0.5;   // 시세 절반 미만 → 가품 의심
  // 용량(ml)별 칩 — 50ml·100ml 등 주력 용량 우선
  const vols = [...new Set(priced.map(i=>i.ml).filter(Boolean))].sort((a,b)=>parseInt(a)-parseInt(b));
  const volChips = ['전체', ...vols];

  box.innerHTML = `
    <div class="shop-h">🛒 판매처·가격 <span class="low" id="shopLow"></span></div>
    ${vols.length ? `<div class="vol-chips" id="volChips">${volChips.map((v,i)=>`<button class="${i===0?'on':''}" data-v="${esc(v)}">${esc(v)}</button>`).join("")}</div>` : ""}
    <div class="shop-list" id="shopList"></div>
    ${SHOP_WARN}
    ${naverLinkBtn(q)}`;

  function renderShopList(vol){
    const arr = (vol === "전체") ? priced : priced.filter(i => i.ml === vol);
    const lowEl = $("#shopLow"); if (lowEl) lowEl.textContent = arr.length ? `${vol==="전체"?"":vol+" "}최저가 ${pf(arr[0].price)}` : "해당 용량 없음";
    const list = $("#shopList"); if (!list) return;
    list.innerHTML = arr.slice(0,5).map(i=>`
      <a class="shop-row${susp(i)?" warn":""}" href="${esc(i.link)}" target="_blank" rel="noopener nofollow sponsored">
        <span class="mall">${esc(i.mall)}</span>
        <span class="t">${susp(i)?'<span class="warn-tag">가품 의심</span> ':''}${i.ml?`<span class="ml-tag">${esc(i.ml)}</span> `:''}${esc(i.title)}</span>
        <span class="p">${pf(i.price)}</span>
      </a>`).join("") || `<div class="empty-state" style="padding:12px">해당 용량 상품이 없어요.</div>`;
  }
  renderShopList("전체");
  const vc = $("#volChips");
  if (vc) vc.addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    vc.querySelectorAll("button").forEach(x=>x.classList.toggle("on", x===b));
    renderShopList(b.dataset.v);
  });
}
function mlOf(title){ const m = String(title||"").match(/(\d{2,3})\s?ml/i); return m ? m[1] + "ml" : null; }

/* =========================================================================
   디퓨저 (네이버 쇼핑 기반)
   ========================================================================= */
const DIFFUSER_BRANDS = ["딥디크","조말론","이솝","논픽션","산타마리아노벨라","록시땅","코코도르","르라보"];
function dcard(it){
  return `<a class="dcard" href="${esc(it.link)}" target="_blank" rel="noopener nofollow sponsored">
    <div class="art">${it.image?`<img src="${esc(it.image)}" alt="${esc(it.title)}" loading="lazy" onerror="this.outerHTML=window.__ph()">`:window.__ph()}</div>
    <div class="info"><div class="mall">${esc(it.mall)}</div><div class="name">${esc(it.title)}</div><div class="price">${pf(it.price)}</div></div>
  </a>`;
}
function initDiffusers(){
  const sec = $("#diffusers"); if (!sec) return;
  if (!NAVER.enabled){ sec.style.display = "none"; return; }
  sec.style.display = "";
  const tabs = $("#diffTabs");
  tabs.innerHTML = DIFFUSER_BRANDS.map((b,i)=>`<button class="${i===0?"on":""}" data-b="${esc(b)}">${esc(b)}</button>`).join("");
  tabs.addEventListener("click", e=>{
    const btn = e.target.closest("button"); if(!btn) return;
    $$("#diffTabs button").forEach(x=>x.classList.toggle("on", x===btn));
    loadDiffusers(btn.dataset.b);
  });
  loadDiffusers(DIFFUSER_BRANDS[0]);
}
async function loadDiffusers(brand){
  const grid = $("#diffGrid");
  grid.innerHTML = `<div class="empty-state"><span class="spinner"></span> ${esc(brand)} 디퓨저 불러오는 중…</div>`;
  const data = await naverFetch("search", { q: brand + " 디퓨저", display: 12, sort: "sim", minPrice: 5000 });
  if (!data || !data.items || !data.items.length){ grid.innerHTML = `<div class="empty-state">${esc(brand)} 디퓨저를 찾지 못했어요.</div>`; return; }
  if ($("#diffTabs button.on") && $("#diffTabs button.on").dataset.b !== brand) return;
  grid.innerHTML = data.items.filter(i=>i.price>0).map(dcard).join("");
}

/* =========================================================================
   오늘 날씨 맞춤 추천 (Open-Meteo · 키 불필요)
   ========================================================================= */
function perfumesByFamilies(fams, n){
  return PERFUMES.map(p=>{ let s=0; allNotes(p).forEach(k=>{ if(fams.includes(fam(k))) s++; }); return {p,s}; })
    .filter(x=>x.s>0).sort((a,b)=>b.s-a.s).slice(0, n).map(x=>x.p);
}
function weatherText(c){ if(c===0)return"맑음"; if(c<=3)return"구름 조금"; if(c<=48)return"안개"; if(c<=67)return"비"; if(c<=77)return"눈"; if(c<=82)return"소나기"; return"천둥번개"; }
function weatherRec(temp, code){
  const rain=(code>=51&&code<=67)||(code>=80&&code<=82)||code>=95, snow=code>=71&&code<=77;
  if(snow)        return {fams:["gourmand","oriental","woody"], msg:"포근하게 감싸주는 따뜻한 향이 어울려요", emoji:"❄️"};
  if(rain)        return {fams:["woody","oriental","aromatic"], msg:"차분하고 깊은 우디·인센스 향이 좋아요", emoji:"🌧️"};
  if(temp>=27)    return {fams:["citrus","aquatic","green"],   msg:"더운 날엔 청량하고 시원한 향!", emoji:"☀️"};
  if(temp>=17)    return {fams:["floral","fruity","green"],    msg:"산뜻하고 화사한 향이 잘 맞아요", emoji:"🌤️"};
  if(temp>=7)     return {fams:["woody","spicy","aromatic"],   msg:"살짝 쌀쌀할 땐 따뜻한 우디·스파이시", emoji:"🍂"};
  return {fams:["gourmand","oriental","woody"], msg:"추운 날엔 달콤포근한 구르망·앰버", emoji:"🧣"};
}
/* 지역 목록 (위치 권한 없이 기본 제공 — 기본값 서울) */
const REGIONS = [
  { name:"서울", lat:37.5665, lon:126.9780 }, { name:"인천", lat:37.4563, lon:126.7052 },
  { name:"수원", lat:37.2636, lon:127.0286 }, { name:"춘천", lat:37.8813, lon:127.7300 },
  { name:"강릉", lat:37.7519, lon:128.8761 }, { name:"대전", lat:36.3504, lon:127.3845 },
  { name:"청주", lat:36.6424, lon:127.4890 }, { name:"전주", lat:35.8242, lon:127.1480 },
  { name:"광주", lat:35.1595, lon:126.8526 }, { name:"대구", lat:35.8714, lon:128.6014 },
  { name:"울산", lat:35.5384, lon:129.3114 }, { name:"부산", lat:35.1796, lon:129.0756 },
  { name:"창원", lat:35.2280, lon:128.6811 }, { name:"제주", lat:33.4996, lon:126.5312 },
];
function getRegionName(){ try{ return localStorage.getItem("region") || "서울"; }catch(e){ return "서울"; } }

async function loadWeather(lat, lon, label){
  const sec=$("#weather"); if(!sec) return;
  try{
    const j=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`).then(r=>r.json());
    const temp=Math.round(j.current.temperature_2m), code=j.current.weather_code;
    const rec=weatherRec(temp,code);
    $("#weatherHead").innerHTML=`${rec.emoji} <b>${esc(label)}</b> 지금 <b>${temp}°C ${weatherText(code)}</b> · ${rec.msg}`;
    $("#weatherGrid").innerHTML=perfumesByFamilies(rec.fams,4).map(p=>pcard(p,null)).join("");
    observeImages($("#weatherGrid"));
    sec.style.display="";
    // 상단바 날씨 칩 (클릭 시 지역 변경 메뉴)
    const chip=$("#weatherChip");
    if(chip){ chip.innerHTML=`${rec.emoji} ${esc(label)} ${temp}° <span class="wc-caret">▾</span>`; chip.style.display=""; }
  }catch(e){ sec.style.display="none"; }
}
let _region = null;   // 현재 선택된 지역명 (중복 적용 방지)
/* 지역 선택의 단일 진입점. local: 로컬 저장, remote: 계정(로그인 시)에 저장 */
function selectRegion(name, opts){
  opts = opts || {};
  const local = opts.local !== false, remote = opts.remote !== false;
  const r = REGIONS.find(x => x.name === name) || REGIONS[0];
  _region = r.name;
  const sel = $("#regionSel"); if (sel) sel.value = r.name;
  highlightWeatherMenu(r.name);
  loadWeather(r.lat, r.lon, r.name);
  if (local){ try{ localStorage.setItem("region", r.name); }catch(e){} }
  if (remote && window.saveRegionRemote) window.saveRegionRemote(r.name);
}
/* 계정에서 불러온 지역 적용 (로컬엔 저장하되 원격 재저장은 생략, 동일하면 무시) */
window.applyRegion = function(name){
  if (!REGIONS.some(r => r.name === name) || name === _region) return;
  selectRegion(name, { local:true, remote:false });
};

/* 상단바 날씨 칩 → 지역 선택 드롭다운 */
function buildWeatherMenu(){
  let menu = $("#weatherMenu");
  if (!menu){ menu = document.createElement("div"); menu.id = "weatherMenu"; menu.className = "weather-menu"; document.body.appendChild(menu); }
  menu.innerHTML = `<div class="wm-h">지역 선택</div>` +
    REGIONS.map(r => `<button class="wm-item" data-r="${esc(r.name)}">${esc(r.name)}</button>`).join("") +
    `<button class="wm-item wm-geo" data-geo="1">📍 현재 위치</button>`;
  menu.querySelectorAll("[data-r]").forEach(b => b.onclick = () => { selectRegion(b.dataset.r); closeWeatherMenu(); });
  menu.querySelector("[data-geo]").onclick = () => { useMyLocation(); closeWeatherMenu(); };
  highlightWeatherMenu(_region);
}
function highlightWeatherMenu(name){
  const menu = $("#weatherMenu"); if (!menu) return;
  menu.querySelectorAll(".wm-item").forEach(b => b.classList.toggle("on", b.dataset.r === name));
}
function openWeatherMenu(){
  const chip = $("#weatherChip"), menu = $("#weatherMenu"); if (!chip || !menu) return;
  const rect = chip.getBoundingClientRect();
  menu.style.top = (rect.bottom + 6) + "px";
  menu.style.right = Math.max(8, window.innerWidth - rect.right) + "px";
  menu.classList.add("open");
}
function closeWeatherMenu(){ const m = $("#weatherMenu"); if (m) m.classList.remove("open"); }

/* 위치 권한은 '현재 위치'를 직접 누를 때만 요청 (저장된 지역은 그대로 둠) */
function useMyLocation(){
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(
    pos => loadWeather(pos.coords.latitude, pos.coords.longitude, "내 위치"),
    () => {},
    { timeout:6000, maximumAge:600000 }
  );
}

function initWeather(){
  const sel = $("#regionSel");
  let cur = getRegionName();
  if (!REGIONS.some(r => r.name === cur)) cur = "서울";
  if (sel){
    sel.innerHTML = REGIONS.map(r => `<option value="${esc(r.name)}">${esc(r.name)}</option>`).join("");
    sel.onchange = () => selectRegion(sel.value);
  }
  buildWeatherMenu();
  // 상단바 칩 클릭 → 메뉴 토글
  const chip = $("#weatherChip");
  if (chip){
    chip.addEventListener("click", e => {
      e.preventDefault();
      const m = $("#weatherMenu");
      if (m && m.classList.contains("open")) closeWeatherMenu(); else openWeatherMenu();
    });
    document.addEventListener("click", e => {
      const m = $("#weatherMenu");
      if (m && m.classList.contains("open") && !m.contains(e.target) && !chip.contains(e.target)) closeWeatherMenu();
    });
    window.addEventListener("resize", closeWeatherMenu);
  }
  const geo = $("#regionGeo"); if (geo) geo.onclick = useMyLocation;
  // 시작: 위치 권한 요청 없이 저장값(또는 서울)으로 표시 (원격 재저장 안 함)
  selectRegion(cur, { local:false, remote:false });
}

/* =========================================================================
   향수 팝업·이벤트 소식 (네이버 블로그 검색)
   ========================================================================= */
function newscard(it){
  const d = (it.date && it.date.length===8) ? `${it.date.slice(0,4)}.${it.date.slice(4,6)}.${it.date.slice(6,8)}` : "";
  return `<a class="ncard" href="${esc(it.link)}" target="_blank" rel="noopener">
    <div class="ntitle">${esc(it.title)}</div>
    <div class="ndesc">${esc(it.desc)}</div>
    <div class="nmeta">${esc(it.source)}${d?" · "+d:""}</div>
  </a>`;
}
async function initNews(){
  const sec=$("#news"); if(!sec) return;
  if(!NAVER.enabled){ sec.style.display="none"; return; }
  let data; try{ data=await fetch("/api/news?q="+encodeURIComponent("향수 팝업스토어")).then(r=>r.json()); }catch(e){ data=null; }
  if(!data || !data.items || !data.items.length){ sec.style.display="none"; return; }
  sec.style.display="";
  $("#newsGrid").innerHTML=data.items.map(newscard).join("");
}

/* =========================================================================
   네이버 실시간 인기 향수 (네이버 쇼핑 인기 상품)
   ========================================================================= */
async function initNaverHot(){
  const sec=$("#naverHot"); if(!sec) return;
  if(!NAVER.enabled){ sec.style.display="none"; return; }
  const data=await naverFetch("search", { q:"향수", display:20, sort:"sim", minPrice:30000 });
  const items=(data && data.items ? data.items : []).filter(i=>i.price>0 && i.image).slice(0,8);
  if(!items.length){ sec.style.display="none"; return; }
  $("#naverHotGrid").innerHTML=items.map(dcard).join("");
  sec.style.display="";
}

/* =========================================================================
   결과 공유 (이미지 카드 다운로드 / 사이트 공유)
   ========================================================================= */
let _shareData = null;
const LAYER_SHARE = { top:"첫인상(상큼함) 중시형", middle:"개성(꽃·스파이스) 중시형", base:"잔향(깊은 마무리) 중시형" };
/* 계열별 향수 유형(MBTI 느낌) */
const PERFUME_TYPES = {
  citrus:  { name:"프레시 에너자이저", emoji:"🍋", tagline:"상큼하게 하루를 여는 사람", desc:"청량하고 깨끗한 향으로 활기를 주는 타입. 시트러스·아쿠아틱이 찰떡이에요." },
  fruity:  { name:"스위트 무드메이커", emoji:"🍑", tagline:"달콤 발랄한 분위기 메이커", desc:"과즙 가득한 달콤함을 즐기는 타입. 사랑스럽고 친근한 인상을 줘요." },
  floral:  { name:"로맨틱 드리머", emoji:"🌸", tagline:"화사한 꽃을 두른 로맨티스트", desc:"우아하고 화사한 플로럴을 사랑하는 타입. 부드럽고 사랑스러운 무드." },
  green:   { name:"내추럴 힐러", emoji:"🌿", tagline:"숲 한가운데의 평온함", desc:"풀잎·차 같은 자연의 청량함을 즐기는 타입. 편안하고 담백해요." },
  aromatic:{ name:"쿨 미니멀리스트", emoji:"🪴", tagline:"군더더기 없는 허브 무드", desc:"라벤더·세이지 같은 허브 향의 깔끔함을 선호하는 절제된 타입." },
  spicy:   { name:"시크 모험가", emoji:"🌶️", tagline:"따뜻하고 대담한 스파이스", desc:"알싸하고 따뜻한 스파이스로 강한 존재감을 주는 타입." },
  sweet:   { name:"허니 로맨티스트", emoji:"🍯", tagline:"포근하고 달콤한 끌림", desc:"꿀처럼 달콤하고 포근한 향에 끌리는 다정한 타입." },
  woody:   { name:"우디 로맨티스트", emoji:"🪵", tagline:"그윽하고 깊은 매력", desc:"샌달우드·시더 같은 나무향의 깊이를 즐기는, 차분하고 세련된 타입." },
  oriental:{ name:"미스터리 매혹가", emoji:"🏜️", tagline:"관능적이고 신비로운 잔향", desc:"앰버·인센스·레더의 관능적 깊이를 사랑하는 매혹적인 타입." },
  musk:    { name:"클린 살냄새파", emoji:"🤍", tagline:"가까이서 더 좋은 은은함", desc:"포근한 머스크, 갓 세탁한 듯 깨끗한 향을 좋아하는 타입." },
  aquatic: { name:"프레시 자유인", emoji:"🌊", tagline:"바다처럼 시원하고 자유롭게", desc:"물·바다의 청량함을 즐기는 쿨하고 자유로운 타입." },
  gourmand:{ name:"스위트 미식가", emoji:"🍮", tagline:"디저트 같은 달콤함", desc:"바닐라·카라멜처럼 먹음직한 달콤함을 사랑하는 타입." },
};
function determineType(entries){
  const topFam = entries[0][0];
  return Object.assign({ key: topFam }, PERFUME_TYPES[topFam] || PERFUME_TYPES.woody);
}
function buildShareData(familyScore, layer, n){
  const entries = Object.entries(familyScore).sort((a,b)=>b[1]-a[1]);
  if(!entries.length){ _shareData=null; return; }
  const max = entries[0][1] || 1;
  // 레이어 승자 (renderLayers와 동일 기준)
  const score = {};
  ["top","middle","base"].forEach(L=>{ const t=Object.entries(layer[L]).sort((a,b)=>b[1]-a[1])[0]; score[L]= t? t[1]/n : 0; });
  const winner = ["top","middle","base"].sort((a,b)=>score[b]-score[a])[0];
  _shareData = {
    type: determineType(entries),
    fams: entries.slice(0,3).map(([f,v])=>{ const m=famMeta(f); return { label:m.label, emoji:m.emoji, color:m.color, pct:Math.round(v/max*100) }; }),
    winner: LAYER_SHARE[winner] || "",
    count: n,
  };
  renderTypeCard();
  renderSharePreview();
}
function renderTypeCard(){
  const box=$("#typeCard"); if(!box||!_shareData) return;
  const t=_shareData.type;
  box.innerHTML = `<div class="type-eyebrow">🧪 나의 향수 유형</div>
    <div class="type-emoji">${t.emoji}</div>
    <div class="type-name">${esc(t.name)}</div>
    <div class="type-tag">"${esc(t.tagline)}"</div>
    <p class="type-desc">${esc(t.desc)}</p>`;
}
function renderSharePreview(){
  const box=$("#sharePreview"); if(!box||!_shareData) return;
  const t=_shareData.type;
  box.innerHTML = `<div class="sp-card">
    <div class="sp-emoji">${t.emoji}</div>
    <div class="sp-eyebrow">내 향수 유형</div>
    <div class="sp-title"><b>${esc(t.name)}</b></div>
    <div class="sp-tag">"${esc(t.tagline)}"</div>
    <div class="sp-fams">${_shareData.fams.map(f=>`<span><b>${f.emoji} ${esc(f.label)}</b> ${f.pct}%</span>`).join("")}</div>
    <div class="sp-foot">scentpedia.co.kr</div>
  </div>`;
}
/* 공유용 결과 카드 SVG (1080×1350, 인스타 세로) */
function buildResultCardSVG(d){
  const W=1080, H=1350, t=d.type;
  const bars = d.fams.map((f,i)=>{
    const y=760+i*145, bw=Math.max(60, Math.round(760*f.pct/100));
    return `<text x="90" y="${y-18}" font-size="38" font-weight="700" fill="#1a1916">${esc(f.emoji+" "+f.label)}</text>
      <text x="990" y="${y-18}" font-size="38" font-weight="800" fill="#b14a5f" text-anchor="end">${f.pct}%</text>
      <rect x="90" y="${y}" width="900" height="24" rx="12" fill="#f1ece4"/>
      <rect x="90" y="${y}" width="${bw}" height="24" rx="12" fill="${f.color}"/>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="Pretendard, 'Apple SD Gothic Neo', sans-serif">
    <rect width="${W}" height="${H}" fill="#ffffff"/>
    <rect width="${W}" height="${H}" fill="url(#g)"/>
    <defs><radialGradient id="g" cx="50%" cy="0%" r="80%">
      <stop offset="0%" stop-color="#f5e6ea"/><stop offset="55%" stop-color="#fbf8f4"/><stop offset="100%" stop-color="#ffffff"/>
    </radialGradient></defs>
    <text x="90" y="120" font-size="32" font-weight="800" fill="#b14a5f" letter-spacing="2">SCENTPEDIA · 향수 유형 테스트</text>
    <text x="540" y="330" font-size="200" text-anchor="middle">${esc(t.emoji)}</text>
    <text x="540" y="445" font-size="46" font-weight="700" fill="#7c7870" text-anchor="middle">내 향수 유형은</text>
    <text x="540" y="540" font-size="78" font-weight="800" fill="#b14a5f" text-anchor="middle">${esc(t.name)}</text>
    <text x="540" y="615" font-size="38" fill="#3a3833" text-anchor="middle">"${esc(t.tagline)}"</text>
    ${bars}
    <text x="540" y="1280" font-size="34" font-weight="700" fill="#1a1916" text-anchor="middle">나도 테스트하기 → scentpedia.co.kr</text>
  </svg>`;
}
function svgToPngBlob(svg){
  return new Promise((resolve,reject)=>{
    const img=new Image();
    img.onload=()=>{
      const c=document.createElement("canvas"); c.width=1080; c.height=1350;
      const ctx=c.getContext("2d"); ctx.fillStyle="#fff"; ctx.fillRect(0,0,1080,1350);
      ctx.drawImage(img,0,0,1080,1350);
      c.toBlob(b=> b?resolve(b):reject(new Error("toBlob 실패")), "image/png");
    };
    img.onerror=()=>reject(new Error("이미지 로드 실패"));
    img.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg);
  });
}

/* =========================================================================
   향수 노트 카드 (블로그 리뷰용 캡처/공유) — 1080×1350 SVG → PNG
   사진 대신 노트 피라미드를 깔끔하게 (외부 이미지 CORS 문제 없이 저장 가능)
   ========================================================================= */
function buildPerfumeCardSVG(p){
  const W=1080, H=1350;
  const fam = famMeta(fam0(p));
  const layers = p._flat
    ? [["노트", allNotes(p)]]
    : [["탑 노트 · 첫인상", p.top||[]], ["미들 노트 · 중심 향", p.middle||[]], ["베이스 노트 · 잔향", p.base||[]]];
  let y = 720;
  const blocks = layers.map(([label, keys])=>{
    const ks = (keys||[]).slice(0,6);
    const names = ks.map(k=>`${getNote(k).emoji} ${getNote(k).name}`).join("   ");
    const block = `
      <text x="90" y="${y}" font-size="30" font-weight="800" fill="${fam.color}">${esc(label)}</text>
      <text x="90" y="${y+50}" font-size="34" fill="#1a1916">${esc(names || "정보 없음")}</text>`;
    y += 130;
    return block;
  }).join("");
  const priceLine = p.price ? `<text x="540" y="640" font-size="38" fill="#7c7870" text-anchor="middle">${esc(won(p.price))} (50ml 추정)</text>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="Pretendard, 'Apple SD Gothic Neo', sans-serif">
    <defs><radialGradient id="g" cx="50%" cy="0%" r="90%">
      <stop offset="0%" stop-color="#f5e6ea"/><stop offset="55%" stop-color="#fbf8f4"/><stop offset="100%" stop-color="#ffffff"/>
    </radialGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#g)"/>
    <text x="90" y="120" font-size="30" font-weight="800" fill="#b14a5f" letter-spacing="2">SCENTPEDIA · 향수 노트</text>
    <text x="540" y="320" font-size="150" text-anchor="middle">${esc(fam.emoji)}</text>
    <text x="540" y="430" font-size="40" fill="#7c7870" text-anchor="middle">${esc(p.brand)}${p._api?"":` · ${esc(p.gender)}`}</text>
    <text x="540" y="520" font-size="68" font-weight="800" fill="#1a1916" text-anchor="middle">${esc(p.name)}</text>
    ${p.en?`<text x="540" y="575" font-size="32" fill="#9b958c" text-anchor="middle">${esc(p.en)}</text>`:""}
    ${priceLine}
    <line x1="90" y1="690" x2="990" y2="690" stroke="#ece6dd" stroke-width="2"/>
    ${blocks}
    <text x="540" y="1295" font-size="32" font-weight="700" fill="#b14a5f" text-anchor="middle">scentpedia.co.kr · 향수 취향 찾기</text>
  </svg>`;
}
function fam0(p){
  // 대표 계열: 베이스>미들>탑 순으로 첫 노트의 family
  const k = (p.base&&p.base[0]) || (p.middle&&p.middle[0]) || (p.top&&p.top[0]) || (allNotes(p)[0]);
  return k ? (getNote(k).family || "woody") : "woody";
}
async function savePerfumeCard(p){
  const msg=$("#cardMsg");
  if(msg) msg.textContent="향수 카드를 만드는 중…";
  try{
    const blob=await svgToPngBlob(buildPerfumeCardSVG(p));
    const fname=`scentpedia-${(p.name||"향수").replace(/\s+/g,"")}.png`;
    const file=new File([blob],fname,{type:"image/png"});
    if(navigator.canShare && navigator.canShare({files:[file]})){
      await navigator.share({ files:[file], title:`${p.brand} ${p.name}`, text:`${p.brand} ${p.name} 향수 노트 · scentpedia.co.kr` });
      if(msg) msg.textContent="";
    } else {
      const url=URL.createObjectURL(blob);
      const a=document.createElement("a"); a.href=url; a.download=fname; a.click();
      setTimeout(()=>URL.revokeObjectURL(url),1500);
      if(msg) msg.textContent="카드 이미지를 저장했어요! 블로그·SNS에 올려보세요 🎁";
    }
  }catch(e){ if(msg) msg.textContent="카드 생성 실패. 화면을 캡처해 사용해 주세요 🙏"; }
}
async function shareResultImage(){
  const msg=$("#shareMsg");
  if(!_shareData){ if(msg) msg.textContent="먼저 취향을 분석해 주세요 🙂"; return; }
  if(msg) msg.textContent="결과 이미지를 만드는 중…";
  try{
    const blob=await svgToPngBlob(buildResultCardSVG(_shareData));
    const file=new File([blob],"scentpedia-취향카드.png",{type:"image/png"});
    if(navigator.canShare && navigator.canShare({files:[file]})){
      await navigator.share({ files:[file], title:"내 향수 취향", text:"Scentpedia에서 분석한 내 향수 취향! 너도 해봐 → scentpedia.co.kr" });
      if(msg) msg.textContent="";
    } else {
      const url=URL.createObjectURL(blob);
      const a=document.createElement("a"); a.href=url; a.download="scentpedia-취향카드.png"; a.click();
      setTimeout(()=>URL.revokeObjectURL(url),1500);
      if(msg) msg.textContent="이미지를 저장했어요! 친구에게 공유해보세요 🎁";
    }
  }catch(e){ if(msg) msg.textContent="이미지 생성에 실패했어요. 화면을 캡처해 공유해 주세요 🙏"; }
}
async function shareSite(){
  const msg=$("#shareMsg");
  const url="https://scentpedia.co.kr/";
  const data={ title:"Scentpedia · 향수 취향 찾기", text:"좋아하는 향수로 내 취향을 분석하고 향수를 추천받아요!", url };
  try{
    if(navigator.share){ await navigator.share(data); if(msg) msg.textContent=""; }
    else { await navigator.clipboard.writeText(url); if(msg) msg.textContent="링크를 복사했어요! 친구에게 붙여넣기 해보세요 🔗"; }
  }catch(e){
    try{ await navigator.clipboard.writeText(url); if(msg) msg.textContent="링크를 복사했어요! 🔗"; }
    catch(_){ if(msg) msg.textContent=url; }
  }
}
$("#shareImgBtn")?.addEventListener("click", shareResultImage);
$("#shareLinkBtn")?.addEventListener("click", shareSite);

/* =========================================================================
   상세 모달
   ========================================================================= */
function openModal(p){
  const noteChips = arr => arr.map(k=>`<span class="n">${getNote(k).emoji} ${esc(getNote(k).name)}</span>`).join("");
  let layerHTML;
  if (p._flat){
    layerHTML = `<div class="lyr"><h5>노트</h5><div class="ns">${noteChips(allNotes(p)) || '<span class="n">정보 없음</span>'}</div></div>`;
  } else {
    layerHTML = ["top","middle","base"].map(L=>{
      const label = {top:"탑 노트", middle:"미들 노트", base:"베이스 노트"}[L];
      return `<div class="lyr"><h5>${label}</h5><div class="ns">${noteChips(p[L]) || '<span class="n">정보 없음</span>'}</div></div>`;
    }).join("");
  }
  const meta = [];
  if (p._year)   meta.push(`📅 ${p._year}년`);
  if (p._rating) meta.push(`⭐ ${Number(p._rating).toFixed(1)}${p._reviews?` (${p._reviews})`:""}`);
  if (p._perfumers && p._perfumers.length) meta.push(`👃 ${esc(p._perfumers.join(", "))}`);
  const footPrice = p.price ? `<div class="price" style="color:var(--accent);font-weight:800;margin-top:4px">${won(p.price)}</div>` : "";
  $("#modalBody").innerHTML = `
    <button class="close" id="modalClose">✕</button>
    <div class="head">
      <div class="thumb">${artHTML(p)}</div>
      <div><div class="brand" style="color:var(--muted);font-weight:700">${esc(p.brand)}${p._api?"":` · ${esc(p.gender)}`}</div>
      <h3>${esc(p.name)}</h3>
      ${footPrice}</div>
    </div>
    ${meta.length?`<p style="color:var(--muted);margin-top:12px;font-size:13px">${meta.join("  ·  ")}</p>`:""}
    ${p.desc?`<p style="color:var(--muted);margin-top:8px">${esc(p.desc)}</p>`:""}
    <div class="notelist">${layerHTML}</div>
    <div class="modal-actions">
      ${p._api?"":`<button class="mact" id="trackBtn">📈 시세 추적</button>
      <button class="mact" id="ownBtn">🧴 향수장</button>
      <button class="mact" id="wishBtn">💛 위시</button>`}
      <button class="mact" id="cardBtn">🖼️ 카드 저장</button>
    </div>
    <div class="card-msg" id="cardMsg"></div>
    <div class="shopbox" id="shopBox"></div>
    <div class="pricebox" id="priceBox" style="display:none"></div>
    <div class="reviewbox" id="reviewBox"></div>`;
  $("#modal").classList.add("open");
  $("#modalClose").onclick = closeModal;
  const tb=$("#trackBtn");
  if(tb && window.toggleWatch){
    if(window.isWatched && window.isWatched(p.id)){ tb.classList.add("on"); tb.textContent="✓ 추적 중"; }
    tb.onclick=()=>{ window.toggleWatch(p, tb); };
  }
  // 향수장 / 위시리스트
  const setCollBtn=(btn,active,onText,offText)=>{ if(!btn) return; btn.classList.toggle("on",active); btn.textContent=active?onText:offText; };
  const ownBtn=$("#ownBtn"), wishBtn=$("#wishBtn");
  const cur = window.inCollection ? window.inCollection(p.id) : null;
  setCollBtn(ownBtn, cur==="owned", "✓ 향수장에 있음", "🧴 향수장");
  setCollBtn(wishBtn, cur==="wish", "✓ 위시리스트", "💛 위시");
  if(ownBtn) ownBtn.onclick=async()=>{ const n=await window.toggleCollection(p,"owned",ownBtn); setCollBtn(ownBtn,n==="owned","✓ 향수장에 있음","🧴 향수장"); setCollBtn(wishBtn,n==="wish","✓ 위시리스트","💛 위시"); };
  if(wishBtn) wishBtn.onclick=async()=>{ const n=await window.toggleCollection(p,"wish",wishBtn); setCollBtn(wishBtn,n==="wish","✓ 위시리스트","💛 위시"); setCollBtn(ownBtn,n==="owned","✓ 향수장에 있음","🧴 향수장"); };
  const cardBtn=$("#cardBtn");
  if(cardBtn) cardBtn.onclick=()=>savePerfumeCard(p);
  if (!p._img && NAVER.enabled){
    naverImageFor(p).then(u=>{ if(u){ p._img=u; const t=$("#modalBody .thumb"); if(t) t.innerHTML=artHTML(p); } });
  }
  loadShop(p);
  if (window.renderPriceChart) window.renderPriceChart(p);
  if (window.renderReviews) window.renderReviews(p);
  pushRecent(p); renderRecent();
}
function closeModal(){ $("#modal").classList.remove("open"); }
$("#modal").addEventListener("click", e=>{ if(e.target.id==="modal") closeModal(); });
document.addEventListener("keydown", e=>{ if(e.key==="Escape") closeModal(); });

// 카드 클릭 → 모달
document.addEventListener("click", e=>{
  const card = e.target.closest(".pcard, .fcard"); if(!card) return;
  const id = card.dataset.id;
  let p = PERFUMES.find(x=>x.id===id);
  if (!p && window.__apiCache) p = window.__apiCache[id];
  if (p) openModal(p);
});

/* =========================================================================
   init
   ========================================================================= */
function fillQuick(){
  const picks = ["dior-sauvage","chanel-bleu","jm-woodsage","ll-santal33","tf-lostcherry","mfk-baccarat"];
  $("#quick").innerHTML = picks.map(id=>{
    const p = PERFUMES.find(x=>x.id===id); if(!p) return "";
    return `<button data-id="${id}">+ ${esc(p.name)}</button>`;
  }).join("");
}
fillQuick();
renderChips();
renderFeatured();
initEditorPicks();
renderRecent();
initBrands();
initWeather();
pingNaver().then(()=>{ initDiffusers(); initNews(); initNaverHot(); observeImages(document); });

/* ---------- 페이지 라우터 (해시) ---------- */
const ROUTES = ["home","analyze","worldcup","brands","diffusers","prices","community","encyclopedia","mypage","cabinet"];
function currentRoute(){ const seg = (location.hash || "").replace(/^#\/?/, "").split("/")[0]; return ROUTES.includes(seg) ? seg : "home"; }
function showView(){
  const v = currentRoute();
  $$(".view").forEach(el => { el.style.display = (el.id === "view-" + v) ? "" : "none"; });
  $$(".sidenav a").forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#/" + v));
  window.scrollTo(0, 0);
  observeImages(document);   // 새 화면에 보이는 카드 이미지 로딩
}
window.addEventListener("hashchange", showView);
showView();

/* ---------- 딥링크: SEO 향수 페이지(/perfume/:id)의 "앱에서 보기" → ?p=id 로 들어오면 상세 모달 열기 ---------- */
(function openFromQuery(){
  try{
    const id = new URLSearchParams(location.search).get("p");
    if(!id) return;
    const p = findPerfume(id);
    if(p) setTimeout(()=>openModal(p), 300);
  }catch(e){}
})();

/* ---------- 사이드바 (모바일 드로어) ---------- */
(function initSidebar(){
  const toggle=$("#navToggle"), sidebar=$("#sidebar"), backdrop=$("#sidebarBackdrop");
  if(!toggle||!sidebar) return;
  const open=()=>{ sidebar.classList.add("open"); if(backdrop) backdrop.classList.add("show"); };
  const close=()=>{ sidebar.classList.remove("open"); if(backdrop) backdrop.classList.remove("show"); };
  toggle.onclick=open;
  if(backdrop) backdrop.onclick=close;
  sidebar.querySelectorAll("a").forEach(a=>a.addEventListener("click", close));
})();
