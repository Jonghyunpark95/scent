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
  renderHomeWatch(); renderHomeCal();
  onPricesRoute();   // 시세 워치 화면으로 직접 들어온 경우 렌더
  const wa = document.getElementById("watchAdd"); if (wa) wa.onclick = openWatchPicker;
  sb.auth.getSession().then(({ data }) => { ME = (data && data.session && data.session.user) || null; renderAuthSlot(); initBoards(); syncRegion(); });
  sb.auth.onAuthStateChange((event, session) => {
    ME = (session && session.user) || null; renderAuthSlot();
    if (event === "PASSWORD_RECOVERY") openResetModal();          // 비밀번호 재설정 링크 진입
    syncRegion();
    if (document.getElementById("commBody")) renderBoard(_board);
  });
}
function myNick(){ return (ME && (ME.user_metadata && ME.user_metadata.nickname || (ME.email||"").split("@")[0])) || "익명"; }

/* ---------- 날씨 지역 설정을 계정에 저장/복원 (로그인 시 기기 간 유지) ---------- */
window.saveRegionRemote = async function(name){
  if (!sb || !ME) return;                       // 비로그인 시엔 localStorage만 (app.js가 처리)
  try{ await sb.auth.updateUser({ data: { region: name } }); }catch(e){}
};
function syncRegion(){
  if (!ME) return;
  const remote = ME.user_metadata && ME.user_metadata.region;
  if (remote){ if (window.applyRegion) window.applyRegion(remote); }      // 계정 값으로 복원
  else {                                                                 // 계정에 없으면 현재 로컬값을 계정에 저장
    let local = null; try{ local = localStorage.getItem("region"); }catch(e){}
    if (local) window.saveRegionRemote(local);
  }
}
function isGuest(){ return !!(ME && ME.is_anonymous); }

/* ---------- 비회원(익명) 시작: 닉네임만 정하면 바로 사용 ---------- */
function askNickname(actionLabel){
  return new Promise(resolve => {
    const m = ensureModal("guestModal");
    m.innerHTML = `<div class="box card pad" style="max-width:360px;position:relative">
      <button class="close" data-close>✕</button>
      <h3 style="margin:0 0 8px">닉네임으로 바로 시작 🙂</h3>
      <p style="font-size:13px;color:var(--muted);margin:0 0 14px">${esc2(actionLabel || "")}가입 없이 닉네임만 정하면 돼요.</p>
      <input class="auth-in" id="gNick" placeholder="닉네임 (2자 이상)" maxlength="20">
      <button class="btn block" id="gGo">비회원으로 시작</button>
      <div class="auth-guest"><button id="gLogin">이메일·소셜 계정으로 로그인 →</button></div>
    </div>`;
    openM(m);
    let done = false;
    const finish = v => { if (done) return; done = true; closeM(m); resolve(v); };
    m.querySelectorAll("[data-close]").forEach(b => b.onclick = () => finish(null));
    m.onclick = e => { if (e.target.id === "guestModal") finish(null); };   // 배경 클릭 = 취소
    const go = () => { const v = m.querySelector("#gNick").value.trim(); if (v.length < 2){ m.querySelector("#gNick").focus(); return; } finish(v); };
    m.querySelector("#gGo").onclick = go;
    m.querySelector("#gNick").addEventListener("keydown", e => { if (e.key === "Enter") go(); });
    m.querySelector("#gLogin").onclick = () => { finish(null); openAuthModal(); };
    setTimeout(() => { const i = m.querySelector("#gNick"); if (i) i.focus(); }, 50);
  });
}
/* 로그인돼 있으면 true. 아니면 닉네임 입력 → 익명 로그인. 비활성화 시 일반 로그인으로 폴백. */
async function ensureAuthed(actionLabel){
  if (ME) return true;
  const nick = await askNickname(actionLabel);
  if (nick === null) return false;
  const { data, error } = await sb.auth.signInAnonymously({ options: { data: { nickname: nick } } });
  if (error || !data || !data.user){
    openAuthModal();
    const am = document.getElementById("authMsg");
    if (am) am.textContent = "비회원 시작이 꺼져 있어요. 이메일·소셜로 로그인해주세요.";
    return false;
  }
  ME = data.user; renderAuthSlot();
  return true;
}

/* ---------- 상단 로그인 상태 ---------- */
function renderAuthSlot(){
  const slot = document.getElementById("authSlot"); if (!slot) return;
  if (ME){
    slot.innerHTML = `<button class="bell" id="bellBtn" title="가격 알림">🔔<span class="bell-badge" id="bellBadge" style="display:none">0</span></button><span class="auth-nick">${esc2(myNick())}님${isGuest()?" <small style='color:var(--muted);font-weight:600'>(비회원)</small>":""}</span><button class="auth-btn ghost" id="logoutBtn">로그아웃</button>`;
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
function socialHTML(){
  // 카카오는 이메일 동의항목(비즈앱) 설정 전까지 숨김. 구글 + 이메일 + 비회원으로 운영.
  return `<div class="auth-social">
      <button class="social-btn google" data-prov="google">🇬 구글로 계속하기</button>
    </div>
    <div class="auth-sep">또는 이메일로</div>`;
}
function wireSocial(f){ f.querySelectorAll(".social-btn").forEach(b => b.onclick = () => doSocial(b.dataset.prov)); }
function renderAuthForm(mode){
  const f = document.getElementById("authForm"); const msg = document.getElementById("authMsg"); msg.textContent = "";
  if (mode === "signup"){
    f.innerHTML = socialHTML() + `
      <input class="auth-in" id="suNick" placeholder="닉네임" maxlength="20">
      <input class="auth-in" id="suEmail" type="email" placeholder="이메일">
      <input class="auth-in" id="suPw" type="password" placeholder="비밀번호 (6자 이상)">
      <button class="btn block" id="suBtn">가입하기 (이메일 인증)</button>`;
    f.querySelector("#suBtn").onclick = doSignup;
    wireSocial(f);
  } else {
    f.innerHTML = socialHTML() + `
      <input class="auth-in" id="liEmail" type="email" placeholder="이메일">
      <input class="auth-in" id="liPw" type="password" placeholder="비밀번호">
      <button class="auth-forgot" id="liForgot">비밀번호를 잊으셨나요?</button>
      <button class="btn block" id="liBtn">로그인</button>`;
    f.querySelector("#liBtn").onclick = doLogin;
    f.querySelector("#liForgot").onclick = doForgot;
    wireSocial(f);
  }
}
async function doSocial(provider){
  const msg = document.getElementById("authMsg");
  if (msg) msg.textContent = "이동 중…";
  const options = { redirectTo: location.origin };
  // 카카오: Supabase가 account_email을 강제하므로, 카카오 앱에서 닉네임+이메일 동의항목을 켜둬야 함
  if (provider === "kakao") options.scopes = "account_email profile_nickname";
  const { error } = await sb.auth.signInWithOAuth({ provider, options });
  if (error && msg) msg.textContent = "소셜 로그인 실패: " + error.message + " (관리자: Supabase에서 " + provider + " 공급자를 설정해주세요)";
}
async function doForgot(){
  const email = (document.getElementById("liEmail").value || "").trim();
  const msg = document.getElementById("authMsg");
  if (!email){ msg.textContent = "가입한 이메일을 입력한 뒤 다시 눌러주세요."; return; }
  msg.textContent = "메일 보내는 중…";
  const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin });
  msg.textContent = error ? ("실패: " + error.message)
    : "✅ 비밀번호 재설정 메일을 보냈어요! 메일 속 링크를 누르면 새 비밀번호를 정할 수 있어요.";
}
function openResetModal(){
  const m = ensureModal("resetModal"); openM(m);
  m.innerHTML = `<div class="box card pad" style="max-width:380px;position:relative">
    <button class="close" data-close>✕</button>
    <h3 style="margin:0 0 12px">🔑 새 비밀번호 설정</h3>
    <input class="auth-in" id="rsPw" type="password" placeholder="새 비밀번호 (6자 이상)">
    <button class="btn block" id="rsGo">비밀번호 변경</button>
    <div class="auth-msg" id="rsMsg"></div></div>`;
  wireClose(m);
  m.querySelector("#rsGo").onclick = async () => {
    const pw = m.querySelector("#rsPw").value; const msg = m.querySelector("#rsMsg");
    if (pw.length < 6){ msg.textContent = "6자 이상 입력해주세요."; return; }
    const { error } = await sb.auth.updateUser({ password: pw });
    msg.textContent = error ? ("실패: " + error.message) : "✅ 변경됐어요! 새 비밀번호로 로그인하세요.";
    if (!error) setTimeout(() => closeM(m), 1600);
  };
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
  box.insertAdjacentHTML("beforeend", writeFormHTML());
  wireWriteForm(box, p);
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
    if (!(await ensureAuthed("구매평을 남기려면 "))) return;
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
  body.innerHTML = `<div class="comm-top"><button class="btn" id="newPost">✏️ 글쓰기</button></div>
    <div id="postList"><div class="shop-loading"><span class="spinner"></span> 불러오는 중…</div></div>`;
  body.querySelector("#newPost").onclick = () => openPostWrite(board);
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
    if (!(await ensureAuthed("글을 등록하려면 "))) return;
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
    <div class="cmt-write"><input class="auth-in" id="cBody" placeholder="댓글 달기" style="margin:0"><button class="btn" id="cSubmit">등록</button></div>`;
  wireClose(m);
  box.querySelector("#cSubmit").onclick = async () => {
    const b = box.querySelector("#cBody").value.trim(); if (!b) return;
    if (!(await ensureAuthed("댓글을 남기려면 "))) return;
    const { error } = await sb.from("comments").insert({ post_id: id, user_id: ME.id, nickname: myNick(), body: b });
    if (error){ alert(error.message); return; }
    openPostView(id);
  };
  if (ME && ME.id === post.user_id){
    const db = box.querySelector("[data-del]");
    if (db) db.onclick = async () => {
      if (!confirm("이 글을 삭제할까요?")) return;
      await sb.from("posts").delete().eq("id", id); closeM(m); renderBoard(post.board);
    };
  }
}

/* ---------- 향수 캘린더 ---------- */
async function renderDiary(body){
  body.innerHTML = `<div class="diary-write card pad">
      <div style="font-weight:800;margin-bottom:10px">📅 오늘 무슨 향수 뿌렸어요?</div>
      <input class="auth-in" id="dDate" type="date" value="${todayStr()}">
      <input class="auth-in" id="dPerf" placeholder="향수 이름 (예: 디올 쏘바쥬)">
      <input class="auth-in" id="dMemo" placeholder="한 줄 메모 (선택)">
      <label class="diary-pub"><input type="checkbox" id="dPub" checked> 다른 사람에게 공개</label>
      <button class="btn block" id="dSubmit">기록하기</button>
    </div>
    <div id="diaryFeed"><div class="shop-loading"><span class="spinner"></span> 불러오는 중…</div></div>`;
  body.querySelector("#dSubmit").onclick = async () => {
    const worn_on = body.querySelector("#dDate").value, perfume_name = body.querySelector("#dPerf").value.trim(),
          memo = body.querySelector("#dMemo").value.trim(), is_public = body.querySelector("#dPub").checked;
    if (!worn_on || !perfume_name){ alert("날짜와 향수를 입력해주세요"); return; }
    if (!(await ensureAuthed("캘린더에 기록하려면 "))) return;
    const { error } = await sb.from("diary").insert({ user_id: ME.id, nickname: myNick(), worn_on, perfume_name, memo, is_public });
    if (error){ alert(error.message); return; }
    renderDiary(body);
  };
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
  const hasData = data && data.length;
  const watched = !!(window.isWatched && window.isWatched(p.id));
  // 시세 기록도 없고 추적(워치)도 안 하는 향수는 칸을 숨김 (모달 깔끔하게)
  if (!hasData && !watched) return;
  box.style.display = "";
  const pts = hasData ? data.map(d => ({ x: d.collected_on, y: d.price })) : [];
  const cur = hasData ? pts[pts.length - 1].y : null;
  const tkey = "target:" + p.id;
  let target = parseInt(localStorage.getItem(tkey) || "", 10) || null;
  if (ME){ try{ const { data } = await sb.from("price_alerts").select("target_price").eq("perfume_key", p.id).maybeSingle(); if (data && data.target_price) target = data.target_price; }catch(e){} }

  // 목표가 입력 후 안내 문구
  const tipFor = t => {
    if (!t) return hasData
      ? "목표가를 정하면 시세선과 비교해드려요. 시세가 목표 아래로 내려오면 살 타이밍! 🛒"
      : "시세는 매일 새벽 자동 수집돼요. 목표가를 미리 정해두면 도달 시 알려드려요. ⏳";
    const reach = hasData ? targetMsg(cur, t) : "목표가가 설정됐어요. 시세가 수집되면 비교해드릴게요. ⏳";
    return reach + (ME ? " <b>🔔 목표가 도달 시 이메일로 알려드려요</b>" : " <span style='color:var(--muted)'>(로그인하면 목표가 도달 시 이메일로 받아요)</span>");
  };

  box.innerHTML = `<div class="pc-h">📈 시세 추이 ${hasData ? `<span class="pc-cur">현재 시세 ${won2(cur)}</span>` : `<span class="pc-cur">수집 대기 중</span>`}</div>
    ${hasData ? `<div id="pcChart"></div>` : `<div class="pc-empty">아직 시세 데이터가 없어요. 워치리스트에 있으면 곧(매일 새벽) 수집됩니다.</div>`}
    <div class="pc-target">🎯 내 목표가 <input id="pcInput" type="number" inputmode="numeric" placeholder="예: 250000" value="${target||""}"><button class="btn" id="pcSet">설정</button></div>
    <div class="pc-msg" id="pcMsg">${tipFor(target)}</div>`;
  if (hasData) mountChart(box.querySelector("#pcChart"), pts, target);
  box.querySelector("#pcSet").onclick = () => {
    const v = parseInt(box.querySelector("#pcInput").value, 10);
    if (v > 0){
      localStorage.setItem(tkey, String(v)); target = v;
      // 목표가를 정하면 자동으로 시세 추적 목록에도 추가 (수집 보장)
      if (window.ensureTracked) window.ensureTracked(p);
      if (ME) sb.from("price_alerts").upsert({ user_id: ME.id, perfume_key: p.id, perfume_name: p.name, target_price: v }, { onConflict: "user_id,perfume_key" }).then(checkAlerts);
    } else {
      localStorage.removeItem(tkey); target = null;
      if (ME) sb.from("price_alerts").delete().eq("perfume_key", p.id).then(checkAlerts);
    }
    if (hasData) mountChart(box.querySelector("#pcChart"), pts, target);
    box.querySelector("#pcMsg").innerHTML = target ? tipFor(target) : "목표가가 해제됐어요.";
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
/* 내 시세 워치리스트 (localStorage, 기본=르라보 어나더 13) */
function pname(k){ const p = (typeof PERFUMES !== "undefined") && PERFUMES.find(x => x.id === k); return p ? p.name : k; }
function getWatch(){ try{ let a = JSON.parse(localStorage.getItem("watch") || "null"); return (Array.isArray(a) && a.length) ? a : ["ll-another13"]; }catch(e){ return ["ll-another13"]; } }
function setWatch(a){ try{ localStorage.setItem("watch", JSON.stringify(a)); }catch(e){} }
async function renderHomeWatch(){
  const list = document.getElementById("watchList"); if (!list || !sb) return;
  const watch = getWatch();
  const { data } = await sb.from("price_history").select("perfume_key,price,collected_on").in("perfume_key", watch).order("collected_on");
  const byKey = {}; (data || []).forEach(r => { (byKey[r.perfume_key] = byKey[r.perfume_key] || []).push({ x: r.collected_on, y: r.price }); });
  list.innerHTML = watch.map(k => {
    const pts = byKey[k] || [], name = pname(k);
    if (!pts.length) return `<div class="watch-item"><div class="watch-h"><b>${esc2(name)}</b><span class="watch-x" data-k="${esc2(k)}">✕</span></div><div class="empty-state" style="padding:8px;font-size:12px">시세 수집중… 매일 업데이트돼요</div></div>`;
    const cur = pts[pts.length-1].y, first = pts[0].y, diff = first ? Math.round((cur-first)/first*100) : 0;
    return `<div class="watch-item"><div class="watch-h"><b>${esc2(name)}</b>
      <span class="watch-cur">${won2(cur)} <small style="color:${diff<=0?'#3fae6a':'#c0392b'}">${diff<=0?'▼':'▲'}${Math.abs(diff)}%</small></span>
      <span class="watch-x" data-k="${esc2(k)}">✕</span></div>
      <div class="watch-chart" data-k="${esc2(k)}"></div></div>`;
  }).join("");
  watch.forEach(k => { const pts = byKey[k]; if (pts && pts.length){ const el = list.querySelector(`.watch-chart[data-k="${k}"]`); if (el) mountChart(el, pts, null); } });
  list.querySelectorAll(".watch-x").forEach(x => x.onclick = () => { setWatch(getWatch().filter(i => i !== x.dataset.k)); renderHomeWatch(); });
}
function perfById(id){ return (typeof PERFUMES !== "undefined") && PERFUMES.find(x => x.id === id); }

/* =========================================================================
   시세 워치 전용 화면 (사이드바 → 📈 시세 워치)
   ① 내 목표가 알림(끄기/삭제)  ② 내 워치리스트  ③ 최근 변동 큰 향수
   ========================================================================= */
window.renderPricesView = async function(){
  const root = document.getElementById("pricesBody"); if (!root) return;
  if (!sb){ root.innerHTML = `<div class="card pad pc-empty">시세 기능을 불러올 수 없어요.</div>`; return; }
  root.innerHTML = `<div class="card pad pc-empty">시세 불러오는 중…</div>`;

  // 최근 60일 시세 전체 로드 → 키별 포인트 배열
  const since = new Date(Date.now() - 60 * 864e5).toISOString().slice(0, 10);
  let rows = [];
  try { const { data } = await sb.from("price_history").select("perfume_key,price,collected_on").gte("collected_on", since).order("collected_on"); rows = data || []; } catch (e) {}
  const byKey = {};
  rows.forEach(r => { (byKey[r.perfume_key] = byKey[r.perfume_key] || []).push({ x: r.collected_on, y: r.price }); });
  const latest = k => { const a = byKey[k]; return a && a.length ? a[a.length - 1].y : null; };

  // ── ① 내 목표가 알림 ──
  let alerts = [];
  if (ME){ try { const { data } = await sb.from("price_alerts").select("*").order("created_at"); alerts = data || []; } catch (e) {} }
  let alertHTML;
  if (!ME) alertHTML = `<div class="card pad pc-empty">로그인하면 목표가 도달 시 <b>이메일</b>로 알려드려요. 향수 상세에서 🎯 목표가를 설정해보세요.</div>`;
  else if (!alerts.length) alertHTML = `<div class="card pad pc-empty">아직 설정한 목표가가 없어요. 향수 상세 화면에서 🎯 목표가를 정하면 여기에 모여요.</div>`;
  else {
    const rowsH = alerts.map(a => {
      const cur = latest(a.perfume_key);
      const status = cur == null ? `<span class="pa-wait">수집 대기 중</span>`
        : (cur <= a.target_price) ? `<span class="pa-hit">🎉 목표 도달 · 현재 ${won2(cur)}</span>`
        : `<span class="pa-cur">현재 ${won2(cur)}</span>`;
      return `<div class="pa-row${a.muted ? " muted" : ""}" data-k="${esc2(a.perfume_key)}">
        <div class="pa-main"><b>${esc2(a.perfume_name || pname(a.perfume_key))}</b>
          <div class="pa-sub">목표 ${won2(a.target_price)} · ${status}${a.muted ? " · 🔕 알림 꺼짐" : ""}</div></div>
        <div class="pa-btns">
          <button class="pa-mute" data-id="${a.id}" data-m="${a.muted ? 1 : 0}">${a.muted ? "🔔 켜기" : "🔕 끄기"}</button>
          <button class="pa-del" data-id="${a.id}" data-k="${esc2(a.perfume_key)}">삭제</button>
        </div></div>`;
    }).join("");
    alertHTML = `<div class="card pad">${rowsH}<div class="pa-foot"><button class="pa-allmute">모든 알림 끄기</button></div></div>`;
  }

  // ── ② 내 워치리스트 ──
  const watch = getWatch();
  const watchHTML = watch.length ? watch.map(k => {
    const pts = byKey[k] || [], name = pname(k);
    if (!pts.length) return `<div class="watch-item" data-k="${esc2(k)}"><div class="watch-h"><b>${esc2(name)}</b></div><div class="empty-state" style="padding:8px;font-size:12px">시세 수집중… 곧 업데이트돼요</div></div>`;
    const cur = pts[pts.length - 1].y, first = pts[0].y, diff = first ? Math.round((cur - first) / first * 100) : 0;
    return `<div class="watch-item" data-k="${esc2(k)}"><div class="watch-h"><b>${esc2(name)}</b>
      <span class="watch-cur">${won2(cur)} <small style="color:${diff <= 0 ? "#3fae6a" : "#c0392b"}">${diff <= 0 ? "▼" : "▲"}${Math.abs(diff)}%</small></span></div>
      <div class="watch-chart" data-k="${esc2(k)}"></div></div>`;
  }).join("") : `<div class="pc-empty">워치리스트가 비어있어요. 향수 상세에서 📈 시세 추적을 눌러보세요.</div>`;

  // ── ③ 최근 변동 큰 향수 ──
  const movers = Object.keys(byKey)
    .map(k => { const a = byKey[k]; if (a.length < 2) return null; const first = a[0].y, cur = a[a.length - 1].y; return { k, cur, pct: first ? (cur - first) / first * 100 : 0 }; })
    .filter(Boolean).sort((x, y) => Math.abs(y.pct) - Math.abs(x.pct)).slice(0, 8);
  const moverHTML = movers.length ? movers.map(m => `
    <div class="watch-item" data-k="${esc2(m.k)}"><div class="watch-h"><b>${esc2(pname(m.k))}</b>
      <span class="watch-cur">${won2(m.cur)} <small style="color:${m.pct <= 0 ? "#3fae6a" : "#c0392b"}">${m.pct <= 0 ? "▼" : "▲"}${Math.abs(Math.round(m.pct))}%</small></span></div>
      <div class="watch-chart" data-k="mv-${esc2(m.k)}"></div></div>`).join("")
    : `<div class="pc-empty">아직 비교할 시세 데이터가 충분하지 않아요. 수집이 며칠 쌓이면 표시돼요.</div>`;

  root.innerHTML = `
    <div class="prices-sec"><h3>🔔 내 목표가 알림</h3>${alertHTML}</div>
    <div class="prices-sec"><h3>📈 내 워치리스트</h3><div class="watch-grid">${watchHTML}</div></div>
    <div class="prices-sec"><h3>🔥 최근 가격 변동 큰 향수 <small>(최근 60일)</small></h3><div class="watch-grid">${moverHTML}</div></div>`;

  // 차트 마운트
  watch.forEach(k => { const pts = byKey[k]; if (pts && pts.length){ const el = root.querySelector(`.watch-chart[data-k="${k}"]`); if (el) mountChart(el, pts, null); } });
  movers.forEach(m => { const pts = byKey[m.k]; const el = root.querySelector(`.watch-chart[data-k="mv-${m.k}"]`); if (el && pts) mountChart(el, pts, null); });

  // 행 클릭 → 상세 모달(목표가 수정)
  root.querySelectorAll(".pa-row, .watch-item").forEach(row => {
    const target = row.querySelector(".pa-main") || row.querySelector(".watch-h");
    if (!target) return;
    target.style.cursor = "pointer";
    target.addEventListener("click", () => { const p = perfById(row.dataset.k); if (p && window.openModal) window.openModal(p); });
  });
  // 알림 끄기/켜기 · 삭제 · 전체 끄기
  root.querySelectorAll(".pa-mute").forEach(b => b.onclick = async e => {
    e.stopPropagation(); await sb.from("price_alerts").update({ muted: b.dataset.m !== "1" }).eq("id", b.dataset.id); window.renderPricesView();
  });
  root.querySelectorAll(".pa-del").forEach(b => b.onclick = async e => {
    e.stopPropagation(); await sb.from("price_alerts").delete().eq("id", b.dataset.id);
    try { localStorage.removeItem("target:" + b.dataset.k); } catch (_) {} window.renderPricesView();
  });
  const allMute = root.querySelector(".pa-allmute");
  if (allMute) allMute.onclick = async () => {
    if (!confirm("설정한 모든 목표가 알림을 끌까요? (목표가 자체는 남아있어요)")) return;
    await sb.from("price_alerts").update({ muted: true }).eq("user_id", ME.id); window.renderPricesView();
  };
};

/* 사용자가 추적하려는 향수를 서버에 등록 → 크론이 매일 시세를 수집 */
async function registerTracked(id){
  if (!sb) return;
  const p = perfById(id); if (!p) return;
  try{
    await sb.from("tracked_perfumes").upsert(
      { perfume_key: id, perfume_name: p.name, query: (p.brand ? p.brand + " " : "") + p.name },
      { onConflict: "perfume_key" }
    );
  }catch(e){ /* 테이블 없으면 무시 (마이그레이션 전) */ }
}
async function addWatch(id){
  const a = getWatch(); if (!a.includes(id)){ a.push(id); setWatch(a); }
  await registerTracked(id);
}
window.isWatched = function(id){ return getWatch().includes(id); };
// 목표가 설정 시 호출 → 시세 추적 목록에 등록(크론이 가격 수집하도록 보장)
window.ensureTracked = async function(p){ if (p && !p._api) await addWatch(p.id); };
window.toggleWatch = async function(p, btn){
  if (!p || p._api) return;
  const a = getWatch(), has = a.includes(p.id);
  if (has){
    setWatch(a.filter(x => x !== p.id));
    if (btn){ btn.classList.remove("on"); btn.textContent = "📈 이 향수 시세 추적하기"; }
  } else {
    await addWatch(p.id);
    if (btn){ btn.classList.add("on"); btn.textContent = "✓ 시세 추적 중 · 홈에서 보기"; }
  }
  renderHomeWatch();
};

async function openWatchPicker(){
  const m = ensureModal("watchModal"); openM(m);
  const watch = new Set(getWatch());
  const all = (typeof PERFUMES !== "undefined" ? PERFUMES : []).filter(p => !p._api);
  m.innerHTML = `<div class="box card pad" style="max-width:460px;position:relative">
    <button class="close" data-close>✕</button>
    <h3 style="margin:0 0 6px">시세 추적 추가</h3>
    <p style="font-size:12.5px;color:var(--muted);margin:0 0 12px">향수명·브랜드로 검색해 추가하세요. 추가하면 매일 시세를 자동 수집해 그래프로 보여드려요.</p>
    <input class="watch-search" id="watchSearch" placeholder="🔍 향수명 또는 브랜드 검색 (예: 상탈, 디올)" autocomplete="off">
    <div class="watch-pick" id="watchPick"></div></div>`;
  wireClose(m);
  // 이미 시세 데이터가 있는 향수 표시 (참고용)
  let haveData = new Set();
  try{ const { data } = await sb.from("price_history").select("perfume_key"); haveData = new Set((data || []).map(r => r.perfume_key)); }catch(e){}
  const pickBox = m.querySelector("#watchPick"), si = m.querySelector("#watchSearch");
  const nrm = s => (s || "").toLowerCase().replace(/\s+/g, "");
  function render(q){
    const nq = nrm(q);
    const list = all.filter(p => !nq || nrm(p.name + p.brand).includes(nq)).slice(0, 80);
    pickBox.innerHTML = list.length ? list.map(p => {
      const added = watch.has(p.id);
      return `<button class="watch-pick-row" data-k="${esc2(p.id)}" ${added ? "disabled" : ""}>
        <span><b>${esc2(p.name)}</b> <span style="color:var(--muted);font-size:12px">${esc2(p.brand)}</span>${haveData.has(p.id) ? ' <span class="ml-tag">시세 있음</span>' : ''}</span>
        ${added ? '<span class="wp-added">추가됨</span>' : '<span class="wp-add">+ 추가</span>'}</button>`;
    }).join("") : `<div class="empty-state" style="padding:16px">검색 결과가 없어요 🙂</div>`;
    pickBox.querySelectorAll(".watch-pick-row").forEach(b => b.onclick = async () => {
      if (b.disabled) return;
      await addWatch(b.dataset.k);
      watch.add(b.dataset.k);
      render(si.value);
      renderHomeWatch();
    });
  }
  render("");
  si.addEventListener("input", () => render(si.value));
  setTimeout(() => si.focus(), 50);
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

/* 시세 워치 화면 진입 시 렌더 (사이드바 → 📈 시세 워치) */
function onPricesRoute(){
  if ((location.hash || "").replace(/^#\/?/, "") === "prices" && window.renderPricesView) window.renderPricesView();
}
window.addEventListener("hashchange", onPricesRoute);

// supabase-js 로드 이후 초기화
if (window.supabase) initCommunity();
else window.addEventListener("load", initCommunity);
