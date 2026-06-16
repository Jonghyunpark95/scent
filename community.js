/* =========================================================================
   Scentpedia 커뮤니티 — 인증(가입/로그인/이메일인증) + 구매평·별점 (Supabase)
   - anon key는 공개돼도 안전(RLS로 보호). app.js 이후 로드.
   ========================================================================= */
"use strict";

const SUPABASE_URL = "https://qughwjoezbntwirlozue.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1Z2h3am9lemJudHdpcmxvenVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1ODA3NjUsImV4cCI6MjA5NzE1Njc2NX0.iQRZwfPG9qSpTV1q-UpRbh5nG0n0fEr42m3rUWXoI9E";

let sb = null, ME = null;
const esc2 = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c]));

function initCommunity(){
  if (!window.supabase || !window.supabase.createClient) return;
  sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
  renderHomeChart(); renderHomeCal();
  sb.auth.getSession().then(({ data }) => { ME = (data && data.session && data.session.user) || null; renderAuthSlot(); initBoards(); });
  sb.auth.onAuthStateChange((_e, session) => {
    ME = (session && session.user) || null; renderAuthSlot();
    if (document.getElementById("commBody")) renderBoard(_board);
  });
}
function myNick(){ return (ME && (ME.user_metadata && ME.user_metadata.nickname || (ME.email||"").split("@")[0])) || "익명"; }

/* ---------- 상단 로그인 상태 ---------- */
function renderAuthSlot(){
  const slot = document.getElementById("authSlot"); if (!slot) return;
  if (ME){
    slot.innerHTML = `<button class="bell" id="bellBtn" title="가격 알림">🔔<span class="bell-badge" id="bellBadge" style="display:none">0</span></button><span class="auth-nick">${esc2(myNick())}님</span><button class="auth-btn ghost" id="logoutBtn">로그아웃</button>`;
    document.getElementById("logoutBtn").onclick = async () => { await sb.auth.signOut(); };
    document.getElementById("bellBtn").onclick = openAlerts;
    checkAlerts();
  } else {
    slot.innerHTML = `<button class="auth-btn" id="loginBtn">로그인/가입</button>`;
    document.getElementById("loginBtn").onclick = openAuthModal;
  }
}

/* ---------- 인증 모달 ---------- */
function openAuthModal(){
  let m = document.getElementById("authModal");
  if (!m){
    m = document.createElement("div"); m.id = "authModal"; m.className = "modal";
    document.body.appendChild(m);
    m.addEventListener("click", e => { if (e.target.id === "authModal") m.classList.remove("open"); });
  }
  m.innerHTML = `<div class="box card pad" style="max-width:400px;position:relative">
    <button class="close" id="authClose">✕</button>
    <div class="auth-tabs">
      <button class="on" data-t="login">로그인</button>
      <button data-t="signup">회원가입</button>
    </div>
    <div id="authForm"></div>
    <div class="auth-msg" id="authMsg"></div>
  </div>`;
  m.classList.add("open");
  m.querySelector("#authClose").onclick = () => m.classList.remove("open");
  const tabs = m.querySelectorAll(".auth-tabs button");
  tabs.forEach(b => b.onclick = () => { tabs.forEach(x=>x.classList.toggle("on", x===b)); renderAuthForm(b.dataset.t); });
  renderAuthForm("login");
}
function renderAuthForm(mode){
  const f = document.getElementById("authForm"); const msg = document.getElementById("authMsg"); msg.textContent = "";
  if (mode === "signup"){
    f.innerHTML = `
      <input class="auth-in" id="suNick" placeholder="닉네임" maxlength="20">
      <input class="auth-in" id="suEmail" type="email" placeholder="이메일">
      <input class="auth-in" id="suPw" type="password" placeholder="비밀번호 (6자 이상)">
      <button class="btn block" id="suBtn">가입하기 (이메일 인증)</button>`;
    f.querySelector("#suBtn").onclick = doSignup;
  } else {
    f.innerHTML = `
      <input class="auth-in" id="liEmail" type="email" placeholder="이메일">
      <input class="auth-in" id="liPw" type="password" placeholder="비밀번호">
      <button class="btn block" id="liBtn">로그인</button>`;
    f.querySelector("#liBtn").onclick = doLogin;
  }
}
async function doSignup(){
  const nick = document.getElementById("suNick").value.trim();
  const email = document.getElementById("suEmail").value.trim();
  const pw = document.getElementById("suPw").value;
  const msg = document.getElementById("authMsg");
  if (!nick || !email || pw.length < 6){ msg.textContent = "닉네임/이메일/비밀번호(6자+)를 확인해주세요."; return; }
  msg.textContent = "처리 중…";
  const { error } = await sb.auth.signUp({ email, password: pw, options: { data: { nickname: nick }, emailRedirectTo: location.origin } });
  msg.textContent = error ? ("가입 실패: " + error.message)
    : "✅ 인증 메일을 보냈어요! 메일함에서 링크를 누르면 가입 완료됩니다.";
}
async function doLogin(){
  const email = document.getElementById("liEmail").value.trim();
  const pw = document.getElementById("liPw").value;
  const msg = document.getElementById("authMsg");
  msg.textContent = "로그인 중…";
  const { error } = await sb.auth.signInWithPassword({ email, password: pw });
  if (error){ msg.textContent = "로그인 실패: " + (error.message.includes("Email not confirmed") ? "이메일 인증을 먼저 완료해주세요." : error.message); return; }
  document.getElementById("authModal").classList.remove("open");
}

/* ---------- 구매평 · 별점 ---------- */
window.renderReviews = async function(p){
  const box = document.getElementById("reviewBox"); if (!box || !sb) return;
  box.innerHTML = `<div class="rv-h" id="rvHead">구매평 · 별점</div><div class="rv-list" id="rvList"><div class="shop-loading"><span class="spinner"></span> 불러오는 중…</div></div>`;
  const { data, error } = await sb.from("reviews").select("*").eq("perfume_key", p.id).order("created_at", { ascending: false });
  const list = document.getElementById("rvList");
  if (error){ list.innerHTML = `<div class="empty-state" style="padding:14px">구매평을 불러오지 못했어요.</div>`; }
  else {
    const avg = data.length ? data.reduce((s,r)=>s+r.rating,0)/data.length : 0;
    document.getElementById("rvHead").innerHTML = `구매평 · 별점 ${data.length?`<span class="rv-avg">★ ${avg.toFixed(1)} · ${data.length}개</span>`:""}`;
    list.innerHTML = data.length ? data.map(rvRow).join("") : `<div class="empty-state" style="padding:14px">아직 구매평이 없어요. 첫 후기를 남겨보세요! 🙂</div>`;
  }
  box.insertAdjacentHTML("beforeend", ME ? writeFormHTML() : `<div class="rv-login">구매평을 남기려면 <a href="#" id="rvLogin">로그인/가입</a>이 필요해요</div>`);
  if (ME) wireWriteForm(box, p);
  else { const a = box.querySelector("#rvLogin"); if (a) a.onclick = e => { e.preventDefault(); openAuthModal(); }; }
};
function rvRow(r){
  const stars = "★".repeat(r.rating) + "☆".repeat(5 - r.rating);
  return `<div class="rv-item"><div class="rv-top"><b>${esc2(r.nickname || "익명")}</b><span class="rv-stars">${stars}</span></div>${r.body?`<div class="rv-body">${esc2(r.body)}</div>`:""}</div>`;
}
function writeFormHTML(){
  return `<div class="rv-write">
    <div class="rv-stars-input" id="rvStars">${[1,2,3,4,5].map(n=>`<span data-n="${n}">☆</span>`).join("")}</div>
    <textarea class="auth-in" id="rvBody" rows="3" placeholder="이 향수 어땠나요? (지속력·분위기·계절 등)"></textarea>
    <button class="btn block" id="rvSubmit">구매평 등록</button>
  </div>`;
}
function wireWriteForm(box, p){
  let rating = 0;
  const stars = box.querySelectorAll("#rvStars span");
  stars.forEach(s => s.onclick = () => { rating = +s.dataset.n; stars.forEach(x => x.textContent = (+x.dataset.n <= rating) ? "★" : "☆"); });
  box.querySelector("#rvSubmit").onclick = async () => {
    if (!rating){ alert("별점을 선택해주세요 ⭐"); return; }
    const body = box.querySelector("#rvBody").value.trim();
    const { error } = await sb.from("reviews").insert({
      user_id: ME.id, nickname: myNick(), perfume_key: p.id, perfume_name: p.name, brand: p.brand, rating, body,
    });
    if (error){ alert("등록 실패: " + error.message); return; }
    window.renderReviews(p);
  };
}

/* =========================================================================
   게시판 (자유게시판 / 컬렉션 자랑 / 향수 캘린더)
   ========================================================================= */
let _board = "diary";
function todayStr(){ return new Date().toISOString().slice(0, 10); }
function fmtDate(s){ try{ return new Date(s).toLocaleDateString("ko-KR"); }catch(e){ return ""; } }
function ensureModal(id){
  let m = document.getElementById(id);
  if (!m){ m = document.createElement("div"); m.id = id; m.className = "modal"; document.body.appendChild(m);
    m.addEventListener("click", e => { if (e.target.id === id) m.classList.remove("open"); }); }
  return m;
}
function openM(m){ m.classList.add("open"); wireClose(m); }
function closeM(m){ m.classList.remove("open"); }
function wireClose(m){ m.querySelectorAll("[data-close]").forEach(b => b.onclick = () => closeM(m)); }

function initBoards(){
  const tabs = document.getElementById("commTabs"); if (!tabs) return;
  if (!tabs.dataset.wired){
    tabs.dataset.wired = "1";
    tabs.addEventListener("click", e => {
      const b = e.target.closest("button"); if (!b) return;
      tabs.querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b));
      renderBoard(b.dataset.b);
    });
  }
  renderBoard(_board);
}
async function renderBoard(board){
  _board = board;
  const body = document.getElementById("commBody"); if (!body || !sb) return;
  if (board === "diary") return renderDiary(body);
  body.innerHTML = `<div class="comm-top">${ME?`<button class="btn" id="newPost">✏️ 글쓰기</button>`:`<span class="rv-login">글을 쓰려면 <a href="#" id="needLogin">로그인</a>이 필요해요</span>`}</div>
    <div id="postList"><div class="shop-loading"><span class="spinner"></span> 불러오는 중…</div></div>`;
  if (ME) body.querySelector("#newPost").onclick = () => openPostWrite(board);
  else body.querySelector("#needLogin").onclick = e => { e.preventDefault(); openAuthModal(); };
  const { data } = await sb.from("posts").select("*").eq("board", board).order("created_at", { ascending: false }).limit(50);
  if (_board !== board) return;
  const list = body.querySelector("#postList"); if (!list) return;
  list.innerHTML = (data && data.length) ? data.map(postRow).join("") : `<div class="empty-state" style="padding:18px">아직 글이 없어요. 첫 글을 남겨보세요! ✍️</div>`;
  list.querySelectorAll(".post-row").forEach(r => r.onclick = () => openPostView(+r.dataset.id));
}
function postRow(p){
  return `<div class="post-row" data-id="${p.id}"><div class="post-t">${esc2(p.title)}</div><div class="post-m">${esc2(p.nickname||"익명")} · ${fmtDate(p.created_at)}</div></div>`;
}
function openPostWrite(board){
  const m = ensureModal("postModal");
  m.innerHTML = `<div class="box card pad" style="max-width:480px;position:relative">
    <button class="close" data-close>✕</button>
    <h3 style="margin:0 0 14px">${board==="collection"?"내 컬렉션 자랑 ✨":"자유게시판 글쓰기"}</h3>
    <input class="auth-in" id="pTitle" placeholder="제목" maxlength="80">
    <textarea class="auth-in" id="pBody" rows="6" placeholder="${board==="collection"?"보유 향수·취향·추천을 자유롭게 자랑해보세요!":"향수 이야기를 자유롭게 나눠보세요"}"></textarea>
    <button class="btn block" id="pSubmit">등록</button></div>`;
  openM(m);
  m.querySelector("#pSubmit").onclick = async () => {
    const title = m.querySelector("#pTitle").value.trim(), body = m.querySelector("#pBody").value.trim();
    if (!title){ alert("제목을 입력해주세요"); return; }
    const { error } = await sb.from("posts").insert({ user_id: ME.id, nickname: myNick(), board, title, body });
    if (error){ alert("등록 실패: " + error.message); return; }
    closeM(m); renderBoard(board);
  };
}
async function openPostView(id){
  const m = ensureModal("postModal"); openM(m);
  m.innerHTML = `<div class="box card pad" style="max-width:520px;position:relative"><div class="shop-loading"><span class="spinner"></span> 불러오는 중…</div></div>`;
  const { data: post } = await sb.from("posts").select("*").eq("id", id).single();
  const box = m.querySelector(".box");
  if (!post){ box.innerHTML = `<button class="close" data-close>✕</button>삭제된 글이에요.`; wireClose(m); return; }
  const { data: cmts } = await sb.from("comments").select("*").eq("post_id", id).order("created_at");
  box.innerHTML = `<button class="close" data-close>✕</button>
    <div class="post-m" style="margin-bottom:4px">${esc2(post.nickname||"익명")} · ${fmtDate(post.created_at)}</div>
    <h3 style="margin:0 0 10px">${esc2(post.title)}</h3>
    <div class="post-body">${esc2(post.body||"").replace(/\n/g,"<br>")}</div>
    ${ME&&ME.id===post.user_id?`<button class="post-del" data-del>삭제</button>`:""}
    <div class="cmts"><h5>댓글 ${cmts?cmts.length:0}</h5>
      ${(cmts||[]).map(c=>`<div class="cmt"><b>${esc2(c.nickname||"익명")}</b> ${esc2(c.body)}</div>`).join("") || `<div class="empty-state" style="padding:8px">첫 댓글을 남겨보세요</div>`}</div>
    ${ME?`<div class="cmt-write"><input class="auth-in" id="cBody" placeholder="댓글 달기" style="margin:0"><button class="btn" id="cSubmit">등록</button></div>`:`<div class="rv-login">댓글은 <a href="#" data-login>로그인</a> 후 가능해요</div>`}`;
  wireClose(m);
  if (ME){
    box.querySelector("#cSubmit").onclick = async () => {
      const b = box.querySelector("#cBody").value.trim(); if (!b) return;
      const { error } = await sb.from("comments").insert({ post_id: id, user_id: ME.id, nickname: myNick(), body: b });
      if (error){ alert(error.message); return; }
      openPostView(id);
    };
    if (ME.id === post.user_id) box.querySelector("[data-del]").onclick = async () => {
      if (!confirm("이 글을 삭제할까요?")) return;
      await sb.from("posts").delete().eq("id", id); closeM(m); renderBoard(post.board);
    };
  } else { const a = box.querySelector("[data-login]"); if (a) a.onclick = e => { e.preventDefault(); openAuthModal(); }; }
}

/* ---------- 향수 캘린더 ---------- */
async function renderDiary(body){
  body.innerHTML = `${ME?`<div class="diary-write card pad">
      <div style="font-weight:800;margin-bottom:10px">📅 오늘 무슨 향수 뿌렸어요?</div>
      <input class="auth-in" id="dDate" type="date" value="${todayStr()}">
      <input class="auth-in" id="dPerf" placeholder="향수 이름 (예: 디올 쏘바쥬)">
      <input class="auth-in" id="dMemo" placeholder="한 줄 메모 (선택)">
      <label class="diary-pub"><input type="checkbox" id="dPub" checked> 다른 사람에게 공개</label>
      <button class="btn block" id="dSubmit">기록하기</button>
    </div>`:`<div class="rv-login" style="margin-bottom:14px">캘린더 기록은 <a href="#" id="dLogin">로그인</a> 후 가능해요</div>`}
    <div id="diaryFeed"><div class="shop-loading"><span class="spinner"></span> 불러오는 중…</div></div>`;
  if (ME) body.querySelector("#dSubmit").onclick = async () => {
    const worn_on = body.querySelector("#dDate").value, perfume_name = body.querySelector("#dPerf").value.trim(),
          memo = body.querySelector("#dMemo").value.trim(), is_public = body.querySelector("#dPub").checked;
    if (!worn_on || !perfume_name){ alert("날짜와 향수를 입력해주세요"); return; }
    const { error } = await sb.from("diary").insert({ user_id: ME.id, nickname: myNick(), worn_on, perfume_name, memo, is_public });
    if (error){ alert(error.message); return; }
    renderDiary(body);
  };
  else body.querySelector("#dLogin").onclick = e => { e.preventDefault(); openAuthModal(); };
  const { data } = await sb.from("diary").select("*").order("worn_on", { ascending: false }).limit(40);
  const feed = body.querySelector("#diaryFeed"); if (!feed) return;
  feed.innerHTML = (data && data.length) ? data.map(d=>`<div class="diary-item">
      <span class="d-date">${d.worn_on}</span> <b>${esc2(d.perfume_name)}</b> <span class="d-nick">${esc2(d.nickname||"익명")}</span>
      ${d.memo?`<div class="d-memo">${esc2(d.memo)}</div>`:""}</div>`).join("")
    : `<div class="empty-state" style="padding:18px">아직 기록이 없어요. 첫 기록을 남겨보세요!</div>`;
}

/* =========================================================================
   가격 추이 + 내 목표가 선 (모달)
   ========================================================================= */
const won2 = n => Number(n).toLocaleString("ko-KR") + "원";
window.renderPriceChart = async function(p){
  const box = document.getElementById("priceBox"); if (!box || !sb) return;
  box.style.display = "none";
  const { data } = await sb.from("price_history").select("collected_on,price").eq("perfume_key", p.id).order("collected_on");
  if (!data || !data.length) return;
  box.style.display = "";
  const pts = data.map(d => ({ x: d.collected_on, y: d.price }));
  const cur = pts[pts.length - 1].y;
  const tkey = "target:" + p.id;
  let target = parseInt(localStorage.getItem(tkey) || "", 10) || null;
  if (ME){ try{ const { data } = await sb.from("price_alerts").select("target_price").eq("perfume_key", p.id).maybeSingle(); if (data && data.target_price) target = data.target_price; }catch(e){} }
  box.innerHTML = `<div class="pc-h">📈 시세 추이 <span class="pc-cur">현재 시세 ${won2(cur)}</span></div>
    <div id="pcChart"></div>
    <div class="pc-target">🎯 내 목표가 <input id="pcInput" type="number" inputmode="numeric" placeholder="예: 250000" value="${target||""}"><button class="btn" id="pcSet">설정</button></div>
    <div class="pc-msg" id="pcMsg">${target?targetMsg(cur,target):"목표가를 정하면 시세선과 비교해드려요. 시세가 목표 아래로 내려오면 살 타이밍! 🛒"}</div>`;
  mountChart(box.querySelector("#pcChart"), pts, target);
  box.querySelector("#pcSet").onclick = () => {
    const v = parseInt(box.querySelector("#pcInput").value, 10);
    if (v > 0){
      localStorage.setItem(tkey, String(v)); target = v;
      if (ME) sb.from("price_alerts").upsert({ user_id: ME.id, perfume_key: p.id, perfume_name: p.name, target_price: v }, { onConflict: "user_id,perfume_key" }).then(checkAlerts);
    } else {
      localStorage.removeItem(tkey); target = null;
      if (ME) sb.from("price_alerts").delete().eq("perfume_key", p.id).then(checkAlerts);
    }
    mountChart(box.querySelector("#pcChart"), pts, target);
    box.querySelector("#pcMsg").innerHTML = target
      ? targetMsg(cur, target) + (ME ? " <b>🔔 알림 설정됨</b>" : " <span style='color:var(--muted)'>(로그인하면 알림으로 받아요)</span>")
      : "목표가가 해제됐어요.";
  };
};
function targetMsg(cur, target){
  const d = Math.round((cur - target) / target * 100);
  if (d <= 0) return `🎉 현재 시세가 목표가보다 <b>${Math.abs(d)}% 낮아요</b> — 지금이 살 때!`;
  return `현재 시세가 목표가보다 <b>${d}% 높아요</b>. 조금 더 기다려볼까요?`;
}
function chartSVG(pts, target){
  const W = 320, H = 110, pad = 10;
  const ys = pts.map(p => p.y); let min = Math.min(...ys), max = Math.max(...ys);
  if (target){ min = Math.min(min, target); max = Math.max(max, target); }
  if (min === max){ min = min * 0.9; max = max * 1.1; }
  const sx = i => pad + (pts.length <= 1 ? (W - 2*pad)/2 : i * (W - 2*pad) / (pts.length - 1));
  const sy = v => H - pad - (v - min) / (max - min) * (H - 2*pad);
  const line = pts.map((p,i)=>`${sx(i).toFixed(1)},${sy(p.y).toFixed(1)}`).join(" ");
  const dots = pts.map((p,i)=>{
    const x=sx(i).toFixed(1), y=sy(p.y).toFixed(1);
    const label = `${(p.x||"").slice(5)} · ${won2(p.y)}`;
    return `<circle cx="${x}" cy="${y}" r="3.2" fill="#b14a5f"/>`
         + `<circle class="pc-dot" cx="${x}" cy="${y}" r="14" fill="transparent" data-label="${esc2(label)}"/>`;
  }).join("");
  const tline = target ? `<line x1="${pad}" y1="${sy(target).toFixed(1)}" x2="${W-pad}" y2="${sy(target).toFixed(1)}" stroke="#3fae6a" stroke-dasharray="5 4" stroke-width="1.5"/>` : "";
  return `<svg viewBox="0 0 ${W} ${H}" class="pc-svg" preserveAspectRatio="none">${pts.length>1?`<polyline points="${line}" fill="none" stroke="#b14a5f" stroke-width="2"/>`:""}${dots}${tline}</svg>`;
}
/* 차트를 컨테이너에 마운트하고 호버/탭 툴팁(날짜·금액) 부착 */
function mountChart(container, pts, target){
  if (!container) return;
  container.style.position = "relative";
  container.innerHTML = chartSVG(pts, target) + `<div class="pc-tip"></div>`;
  const tip = container.querySelector(".pc-tip");
  const show = dot => {
    const r = dot.getBoundingClientRect(), cr = container.getBoundingClientRect();
    tip.textContent = dot.getAttribute("data-label");
    tip.style.left = (r.left - cr.left + r.width / 2) + "px";
    tip.style.top  = (r.top - cr.top) + "px";
    tip.classList.add("show");
  };
  container.querySelectorAll(".pc-dot").forEach(dot => {
    dot.addEventListener("mouseenter", () => show(dot));
    dot.addEventListener("click", () => show(dot));
    dot.addEventListener("mouseleave", () => tip.classList.remove("show"));
  });
}

/* =========================================================================
   홈 대시보드 — 도손 시세 쇼케이스 + 캘린더 미리보기
   ========================================================================= */
async function renderHomeChart(){
  const box = document.getElementById("homeChart"); if (!box || !sb) return;
  const card = document.getElementById("homeChartCard");
  const { data } = await sb.from("price_history").select("collected_on,price").eq("perfume_key", "diptyque-doson").order("collected_on");
  if (!data || !data.length){ if (card) card.style.display = "none"; return; }
  const pts = data.map(d => ({ x: d.collected_on, y: d.price }));
  const cur = pts[pts.length - 1].y, first = pts[0].y;
  const diff = first ? Math.round((cur - first) / first * 100) : 0;
  mountChart(box, pts, null);
  const msg = document.getElementById("homeChartMsg");
  if (msg) msg.innerHTML = `현재 시세 <b>${won2(cur)}</b> · 최근 ${pts.length}일 ${diff <= 0 ? `<b style="color:#3fae6a">${Math.abs(diff)}% 하락</b> 🔻 — 살 타이밍?` : `<b style="color:#c0392b">${diff}% 상승</b> 🔺`}`;
}
async function renderHomeCal(){
  const box = document.getElementById("homeCalFeed"); if (!box || !sb) return;
  const { data } = await sb.from("diary").select("worn_on,perfume_name,nickname").order("worn_on", { ascending: false }).limit(5);
  box.innerHTML = (data && data.length)
    ? data.map(d => `<div class="home-cal-row"><span class="d-date">${(d.worn_on||"").slice(5)}</span> <b>${esc2(d.perfume_name)}</b> <span class="d-nick">${esc2(d.nickname||"익명")}</span></div>`).join("")
    : `<div class="empty-state" style="padding:10px">아직 기록이 없어요</div>`;
}

/* =========================================================================
   가격 목표가 알림 (🔔)
   ========================================================================= */
window.__alerts = [];
function setBadge(n){ const b = document.getElementById("bellBadge"); if (!b) return; if (n > 0){ b.textContent = n; b.style.display = ""; } else b.style.display = "none"; }
async function checkAlerts(){
  if (!ME || !sb) return;
  const { data: alerts } = await sb.from("price_alerts").select("*");
  if (!alerts || !alerts.length){ window.__alerts = []; setBadge(0); return; }
  const keys = alerts.map(a => a.perfume_key);
  const { data: ph } = await sb.from("price_history").select("perfume_key,price,collected_on").in("perfume_key", keys).order("collected_on", { ascending: false });
  const latest = {}; (ph || []).forEach(r => { if (!(r.perfume_key in latest)) latest[r.perfume_key] = r.price; });
  window.__alerts = alerts.map(a => {
    const cur = (a.perfume_key in latest) ? latest[a.perfume_key] : null;
    return { ...a, current: cur, hit: cur != null && cur <= a.target_price };
  });
  setBadge(window.__alerts.filter(x => x.hit).length);
}
function openAlerts(){
  const m = ensureModal("alertModal"); openM(m);
  const list = (window.__alerts || []).slice().sort((a, b) => (b.hit - a.hit));
  m.innerHTML = `<div class="box card pad" style="max-width:460px;position:relative">
    <button class="close" data-close>✕</button>
    <h3 style="margin:0 0 14px">🔔 가격 알림</h3>
    ${list.length ? list.map(a => `<div class="alert-row ${a.hit?'hit':''}">
        <div><b>${esc2(a.perfume_name || a.perfume_key)}</b>
          <div class="alert-sub">목표 ${won2(a.target_price)} · 현재 ${a.current != null ? won2(a.current) : "수집중"}</div></div>
        <span class="alert-badge ${a.hit?'on':''}">${a.hit ? "🎉 목표 달성!" : "대기중"}</span>
      </div>`).join("")
      : `<div class="empty-state" style="padding:16px">설정한 목표가가 없어요.<br>향수 상세에서 🎯 목표가를 설정하면 여기서 알림을 받아요!</div>`}
    <div class="rv-login" style="margin-top:12px">시세는 매일 자동 업데이트돼요. 목표가 이하가 되면 🎉 로 표시됩니다.</div>
  </div>`;
  wireClose(m);
}

// supabase-js 로드 이후 초기화
if (window.supabase) initCommunity();
else window.addEventListener("load", initCommunity);
