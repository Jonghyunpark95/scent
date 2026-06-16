/* =========================================================================
   Scent Finder — app.js
   - 좋아하는 향수 선택 → 취향 분석 / 추천 / 베이스향 설명 / 브랜드 모음
   - 향수병 일러스트 자동 생성(SVG)  + RapidAPI 사진/검색 자동 연동(/api/fragrance)
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
   이미지 — RapidAPI 실제 제품 사진 우선, 없으면 미니멀 플레이스홀더
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

/* 이미지 캐시 (세션 유지 → API 호출 절약) */
const imgCache = {};
async function fetchImage(term){
  if (!term) return null;
  if (term in imgCache) return imgCache[term];
  try{ const s = sessionStorage.getItem("img:" + term); if (s !== null) return (imgCache[term] = s || null); }catch(e){}
  const data = await apiFetch("search", { q: term, limit: 1 });
  const hit = data && data.results && data.results[0];
  const url = (hit && hit.image) || null;
  imgCache[term] = url;
  try{ sessionStorage.setItem("img:" + term, url || ""); }catch(e){}
  return url;
}

/* 카드가 화면에 보이면 실제 사진을 지연 로딩 */
let _imgObs;
function observeImages(scope){
  if (!API.enabled) return;
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
  const url = await fetchImage(getEnTerm(p));
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

function renderSuggest(q){
  const nq = norm(q);
  if (!nq){ suggest.classList.remove("open"); return; }
  const hits = PERFUMES.filter(p =>
    norm(p.name).includes(nq) || norm(p.brand).includes(nq)
  ).filter(p => !state.selected.includes(p.id)).slice(0, 8);

  if (!hits.length){
    suggest.innerHTML = `<div class="empty">"${esc(q)}" 검색 결과가 없어요. 다른 향수 이름으로 검색해 보세요 🙂</div>`;
  } else {
    suggest.innerHTML = hits.map(p => `
      <div class="row" data-id="${p.id}">
        <div class="thumb">${artHTML(p)}</div>
        <div><b>${esc(p.name)}</b><br><small>${esc(p.brand)} · ${esc(p.gender)}</small></div>
      </div>`).join("");
  }
  suggest.classList.add("open");
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
    const p = PERFUMES.find(x => x.id === id);
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
  const picks = state.selected.map(id => PERFUMES.find(p => p.id === id));
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
function renderBrand(b){
  const grid = $("#brandGrid");
  const internal = b==="전체" ? PERFUMES : PERFUMES.filter(p=>p.brand===b);
  grid.innerHTML = internal.map(p=>pcard(p, null)).join("");
  observeImages(grid);
  if (b !== "전체" && API.enabled && typeof BRAND_EN !== "undefined" && BRAND_EN[b]) loadBrandExtra(b, internal);
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

/* =========================================================================
   향수 백과사전 검색 (내장 DB + RapidAPI)
   ========================================================================= */
const encInput = $("#encSearch");
let encTimer;
encInput.addEventListener("input", e=>{
  clearTimeout(encTimer);
  const q = e.target.value.trim();
  if (!q){ $("#encGrid").innerHTML=""; return; }
  // 즉시 내장 DB 결과
  const local = PERFUMES.filter(p=> norm(p.name).includes(norm(q)) || norm(p.brand).includes(norm(q)));
  $("#encGrid").innerHTML = local.length ? local.map(p=>pcard(p,null)).join("")
    : `<div class="empty-state">내장 DB에 없어요. <span class="spinner"></span> RapidAPI에서 찾는 중…</div>`;
  observeImages($("#encGrid"));
  // API 검색 (디바운스)
  encTimer = setTimeout(()=>encSearchAPI(q, local), 450);
});

async function encSearchAPI(q, local){
  const data = await apiFetch("search", { q });
  if (!data || !data.results || !data.results.length){
    if (!local.length) $("#encGrid").innerHTML = `<div class="empty-state">"${esc(q)}" 결과가 없어요. (RapidAPI 키 미설정 시 내장 DB만 검색됩니다)</div>`;
    return;
  }
  // API 결과를 카드로 (내장 DB 우선 표시 후 이어붙임)
  const apiCards = data.results.map(apiToPerfume).map(p=>pcard(p,null)).join("");
  $("#encGrid").innerHTML = local.map(p=>pcard(p,null)).join("") + apiCards;
  observeImages($("#encGrid"));
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

/* 추천 카드에 API 사진 보강 */
async function enrichRecImages(recs){
  if (!API.enabled) return;
  for (const r of recs){
    if (r.p._img) continue;
    const data = await apiFetch("search", { q: r.p.name, limit: 1 });
    const hit = data && data.results && data.results[0];
    const img = hit && hit.image;
    if (img){
      r.p._img = img;
      const card = $(`#recGrid .pcard[data-id="${r.p.id}"] .art`);
      if (card){ const m = card.querySelector(".match"); card.innerHTML = (m?m.outerHTML:"") + artHTML(r.p); }
    }
  }
}

/* =========================================================================
   RapidAPI 프록시 호출 (/api/fragrance) — 키는 서버(Vercel)에만 존재
   ========================================================================= */
const API = { enabled: false };
async function apiFetch(action, params){
  try{
    const qs = new URLSearchParams({ action, ...params }).toString();
    const res = await fetch(`/api/fragrance?${qs}`);
    if (!res.ok) throw new Error("api " + res.status);
    const json = await res.json();
    if (json && json.ok === false) return null;
    return json;
  }catch(err){ return null; }
}
async function pingAPI(){
  const data = await apiFetch("status", {});
  API.enabled = !!(data && data.configured);
  const el = $("#apiState");
  if (API.enabled){
    el.classList.add("live");
    el.querySelector("span").textContent = "실시간 향수 데이터 연결됨 · 전 세계 10만+ 향수";
    observeImages(document);   // 이미 그려진 카드들의 실제 사진 로딩 시작
  } else {
    el.querySelector("span").textContent = "내장 DB 모드 (실제 사진/검색은 API 연결 후 자동 활성화)";
  }
}

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
    <a class="buy-btn" href="https://search.shopping.naver.com/search/all?query=${encodeURIComponent((p._api?"":p.brand+" ")+p.name)}" target="_blank" rel="noopener">🛒 네이버 쇼핑에서 구매처·최저가 보기</a>`;
  $("#modal").classList.add("open");
  $("#modalClose").onclick = closeModal;
  if (!p._img && API.enabled){
    fetchImage(getEnTerm(p)).then(u=>{ if(u){ p._img=u; const t=$("#modalBody .thumb"); if(t) t.innerHTML=artHTML(p); } });
  }
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
initBrands();
pingAPI();
