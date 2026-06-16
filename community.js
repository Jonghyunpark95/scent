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
  sb.auth.getSession().then(({ data }) => { ME = (data && data.session && data.session.user) || null; renderAuthSlot(); });
  sb.auth.onAuthStateChange((_e, session) => { ME = (session && session.user) || null; renderAuthSlot(); });
}
function myNick(){ return (ME && (ME.user_metadata && ME.user_metadata.nickname || (ME.email||"").split("@")[0])) || "익명"; }

/* ---------- 상단 로그인 상태 ---------- */
function renderAuthSlot(){
  const slot = document.getElementById("authSlot"); if (!slot) return;
  if (ME){
    slot.innerHTML = `<span class="auth-nick">${esc2(myNick())}님</span><button class="auth-btn ghost" id="logoutBtn">로그아웃</button>`;
    document.getElementById("logoutBtn").onclick = async () => { await sb.auth.signOut(); };
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

// supabase-js 로드 이후 초기화
if (window.supabase) initCommunity();
else window.addEventListener("load", initCommunity);
