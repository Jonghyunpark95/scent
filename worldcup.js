/* =========================================================================
   향수 이상형 월드컵 — 둘 중 하나 고르기 토너먼트 → 내 "원픽 향수"
   - app.js의 전역 헬퍼 재사용: PERFUMES, esc, artHTML, naverImageFor,
     won, openModal, svgToPngBlob, NAVER
   - 순수 프런트. 결과는 이미지 카드로 저장·공유 (취향 분석 공유 기능 재활용)
   ========================================================================= */
(function(){
  const $ = (s, r=document) => r.querySelector(s);

  /* 인지도 높은 향수 우선 풀 (없으면 전체에서 보충) */
  const SEED = [
    "dior-sauvage","chanel-bleu","ll-santal33","mfk-baccarat","tf-lostcherry",
    "creed-aventus","kilian-angels","byredo-gypsy","jm-woodsage","diptyque-philo",
    "ysl-libre","ysl-blackopium","dior-jadore","chanel-coco","tf-tobacco",
    "creed-viking","narciso-poudree","versace-eros","diptyque-doson","gucci-bloom",
    "paco-1million","chanel-chance","dior-homme","tf-oud","kilian-love",
    "byredo-mojave","jm-englishpear","ll-rose31","prada-candy","ysl-y",
    "chanel-no5","tf-blackorchid","dior-missdior","gucci-guilty","mm-jazz",
    "kilian-gggb","diptyque-tam","creed-silver","paco-invictus","glossier-you",
  ];

  const SIZES = [8, 16, 32];
  let pool = [], round = [], winners = [], pairIdx = 0, total = 0, champion = null;

  function shuffle(a){
    const arr = a.slice();
    for (let i = arr.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function buildPool(size){
    const byId = new Map(PERFUMES.map(p => [p.id, p]));
    const seeded = SEED.map(id => byId.get(id)).filter(Boolean);
    const rest = shuffle(PERFUMES.filter(p => p && p.price && !SEED.includes(p.id)));
    const picked = shuffle(seeded).concat(rest).slice(0, size);
    return shuffle(picked);
  }

  function roundName(n){
    return n === 2 ? "결승" : n === 4 ? "4강" : n === 8 ? "8강" : n + "강";
  }

  /* ---- 화면들 ---- */
  function renderIntro(){
    const max = PERFUMES.filter(p => p && p.price).length;
    const opts = SIZES.filter(s => s <= max).map(s =>
      `<button class="wc-size" data-size="${s}">${s}강</button>`).join("");
    $("#worldcup").innerHTML = `
      <div class="sec-h"><span class="num">🏆 토너먼트</span><h2>향수 이상형 월드컵</h2>
        <p>둘 중 더 끌리는 향수를 고르세요. 끝까지 살아남은 향이 <b>내 원픽</b>!</p></div>
      <div class="card pad wc-intro">
        <div class="wc-emoji">🥇</div>
        <p class="wc-lead">몇 강으로 시작할까요?</p>
        <div class="wc-sizes">${opts}</div>
        <p class="wc-note">취향이 애매할 땐 8강으로 가볍게 시작해보세요.</p>
      </div>`;
    $$(".wc-size").forEach(b => b.onclick = () => start(parseInt(b.dataset.size, 10)));
  }

  function start(size){
    pool = buildPool(size);
    round = pool;
    winners = [];
    pairIdx = 0;
    total = pool.length;
    champion = null;
    renderMatch();
  }

  function preload(p){
    if (!p || p._img || !window.naverImageFor) return;
    naverImageFor(p).then(u => {
      if (!u) return;
      p._img = u;
      const card = document.querySelector(`.wc-card[data-id="${p.id}"] .wc-art`);
      if (card) card.innerHTML = artHTML(p);
    }).catch(() => {});
  }

  function tile(p, side){
    return `<button class="wc-card" data-side="${side}" data-id="${esc(p.id)}">
      <div class="wc-art">${artHTML(p)}</div>
      <div class="wc-meta">
        <div class="wc-brand">${esc(p.brand)}</div>
        <div class="wc-name">${esc(p.name)}</div>
        ${p.price ? `<div class="wc-price">${won(p.price)}</div>` : ""}
      </div>
      <span class="wc-pick">이 향 고르기</span>
    </button>`;
  }

  function renderMatch(){
    const a = round[pairIdx * 2], b = round[pairIdx * 2 + 1];
    // 홀수로 부전승이 생기면 자동 진출
    if (a && !b){ winners.push(a); pairIdx++; return renderMatch(); }
    const matches = round.length / 2;
    const done = winners.length;
    $("#worldcup").innerHTML = `
      <div class="sec-h"><span class="num">🏆 ${roundName(round.length)}</span><h2>더 끌리는 향수는?</h2>
        <p>${roundName(round.length)} · ${pairIdx + 1} / ${matches}경기</p></div>
      <div class="wc-progress"><span style="width:${Math.round(done / matches * 100)}%"></span></div>
      <div class="wc-arena">
        ${tile(a, "a")}
        <div class="wc-vs">VS</div>
        ${tile(b, "b")}
      </div>
      <div class="wc-foot"><button class="wc-restart" id="wcRestart">↺ 처음부터</button></div>`;
    preload(a); preload(b);
    $$(".wc-card").forEach(c => c.onclick = () => choose(c.dataset.side === "a" ? a : b));
    const rs = $("#wcRestart"); if (rs) rs.onclick = renderIntro;
  }

  function choose(p){
    winners.push(p);
    pairIdx++;
    if (pairIdx * 2 >= round.length){
      // 라운드 종료
      if (winners.length === 1){ champion = winners[0]; return finish(); }
      round = winners; winners = []; pairIdx = 0;
    }
    renderMatch();
  }

  function finish(){
    const p = champion;
    if (p && !p._img && window.naverImageFor){
      naverImageFor(p).then(u => { if (u){ p._img = u; const a = $("#wcWinArt"); if (a) a.innerHTML = artHTML(p); } }).catch(() => {});
    }
    $("#worldcup").innerHTML = `
      <div class="sec-h"><span class="num">🥇 우승</span><h2>당신의 원픽 향수</h2>
        <p>${total}종 중에서 끝까지 살아남았어요</p></div>
      <div class="card pad wc-win">
        <div class="wc-win-eyebrow">🏆 MY No.1</div>
        <div class="wc-win-art" id="wcWinArt">${artHTML(p)}</div>
        <div class="wc-win-brand">${esc(p.brand)}</div>
        <div class="wc-win-name">${esc(p.name)}</div>
        ${p.price ? `<div class="wc-win-price">${won(p.price)}</div>` : ""}
        ${p.desc ? `<p class="wc-win-desc">${esc(p.desc)}</p>` : ""}
        <div class="wc-win-btns">
          <button class="btn" id="wcDetail">🔎 향수 자세히 보기</button>
          <button class="btn" id="wcShare">🖼️ 결과 이미지 저장·공유</button>
          <button class="btn ghost2" id="wcAgain">↺ 다시 하기</button>
        </div>
        <div class="share-msg" id="wcMsg"></div>
      </div>`;
    const d = $("#wcDetail"); if (d && window.openModal) d.onclick = () => openModal(p);
    const a = $("#wcAgain"); if (a) a.onclick = renderIntro;
    const s = $("#wcShare"); if (s) s.onclick = shareWin;
  }

  /* ---- 결과 공유 카드 (1080×1350) ---- */
  function buildSVG(p){
    const W = 1080, H = 1350;
    const safe = t => esc(String(t || ""));
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="Pretendard, 'Apple SD Gothic Neo', sans-serif">
      <defs><radialGradient id="g" cx="50%" cy="0%" r="85%">
        <stop offset="0%" stop-color="#f5e6ea"/><stop offset="55%" stop-color="#fbf8f4"/><stop offset="100%" stop-color="#ffffff"/>
      </radialGradient></defs>
      <rect width="${W}" height="${H}" fill="url(#g)"/>
      <text x="90" y="120" font-size="32" font-weight="800" fill="#b14a5f" letter-spacing="2">SCENTPEDIA · 향수 이상형 월드컵</text>
      <text x="540" y="300" font-size="150" text-anchor="middle">🏆</text>
      <text x="540" y="430" font-size="46" font-weight="700" fill="#7c7870" text-anchor="middle">나의 원픽 향수는</text>
      <text x="540" y="560" font-size="44" fill="#3a3833" text-anchor="middle">${safe(p.brand)}</text>
      <text x="540" y="660" font-size="74" font-weight="800" fill="#b14a5f" text-anchor="middle">${safe(p.name)}</text>
      ${p.price ? `<text x="540" y="745" font-size="40" fill="#7c7870" text-anchor="middle">${safe(won(p.price))}</text>` : ""}
      <text x="540" y="1150" font-size="34" fill="#7c7870" text-anchor="middle">${safe((p.desc || "").slice(0, 28))}</text>
      <text x="540" y="1280" font-size="34" font-weight="700" fill="#1a1916" text-anchor="middle">나도 해보기 → scentpedia.co.kr</text>
    </svg>`;
  }

  async function shareWin(){
    const msg = $("#wcMsg"); if (!champion) return;
    if (!window.svgToPngBlob){ if (msg) msg.textContent = "화면을 캡처해 공유해 주세요 🙏"; return; }
    if (msg) msg.textContent = "결과 이미지를 만드는 중…";
    try{
      const blob = await svgToPngBlob(buildSVG(champion));
      const file = new File([blob], "scentpedia-원픽향수.png", { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })){
        await navigator.share({ files: [file], title: "내 원픽 향수", text: "향수 이상형 월드컵 결과! 너도 해봐 → scentpedia.co.kr" });
        if (msg) msg.textContent = "";
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = "scentpedia-원픽향수.png"; a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1500);
        if (msg) msg.textContent = "이미지를 저장했어요! 친구에게 공유해보세요 🎁";
      }
    }catch(e){ if (msg) msg.textContent = "이미지 생성에 실패했어요. 화면을 캡처해 공유해 주세요 🙏"; }
  }

  /* ---- 라우팅: 월드컵 화면에 들어올 때 인트로 표시 ---- */
  function onRoute(){
    const r = (location.hash || "").replace(/^#\/?/, "");
    if (r === "worldcup" && !champion && !round.length) renderIntro();
    if (r === "worldcup" && !$("#worldcup").innerHTML.trim()) renderIntro();
  }
  window.addEventListener("hashchange", onRoute);
  // 즉시 + load 시점 모두 시도 (PERFUMES/헬퍼는 app.js 로드 후 전역에 존재)
  onRoute();
  window.addEventListener("load", onRoute);
})();
