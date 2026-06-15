# 🧪 Scent Finder — 향수 취향 분석 & 추천

좋아하는 향수를 입력하면:
- **취향 프로필**(향 계열 분석)
- **탑·미들·베이스 중 무엇을 좋아하는지** 판별
- **샌달우드·베티버** 같은 어려운 베이스향을 일상 비유로 쉽게 설명
- **취향 매치 추천 향수 + 예상 가격**
- **브랜드별 향수 모음**
- **향수 백과사전 검색** (내장 DB + RapidAPI 실시간)

모바일 최적화 · 정적 사이트 · Vercel 호스팅 · 구글 애드센스 준비 완료.

---

## 📁 구조
```
scent-finder/
├─ index.html        # 페이지
├─ styles.css        # 디자인
├─ app.js            # 분석/추천/검색 로직 + 향수병 일러스트(SVG) 생성
├─ data.js           # 내장 향수 DB + 노트(향료) 설명 데이터
├─ api/fragrance.js  # Vercel 서버리스 RapidAPI 프록시 (키는 서버에만)
├─ ads.txt           # 애드센스 ads.txt (게시자 ID 교체 필요)
├─ robots.txt
├─ vercel.json
└─ .env.local        # 로컬 키 (깃에 안 올라감)
```

## 🖼️ 향수 이미지
- 기본은 **향 계열 색으로 자동 생성되는 아이코닉 향수병 일러스트**(SVG) — 절대 깨지지 않고 저작권 안전.
- RapidAPI 키를 등록하면, 검색·추천 시 **실제 제품 사진이 있으면 자동으로 교체**됩니다.
- 특정 향수에 직접 이미지를 넣고 싶으면 `data.js`의 해당 향수에 `_img: "https://..."` 한 줄만 추가하면 됩니다.

---

## 🔑 RapidAPI 연동 (실시간 검색 / 실제 사진)

브라우저에 키를 노출하지 않도록 **서버리스 프록시(`/api/fragrance`)** 를 통해서만 호출합니다.

1. [RapidAPI](https://rapidapi.com)에서 향수 API 구독 (예: *FragranceFinder API*, *Fragrance API*).
2. 구독한 API 페이지의 **Endpoints** 탭에서 다음을 확인:
   - `X-RapidAPI-Host` 값 → `RAPIDAPI_HOST`
   - 검색 엔드포인트 경로 → `RAPIDAPI_SEARCH_PATH` (검색어 자리에 `{q}` 사용)
3. **Vercel** 대시보드 → 프로젝트 → **Settings → Environment Variables** 에 등록:

   | Key | Value (예시) |
   |---|---|
   | `RAPIDAPI_KEY` | `1c1826fbf2msh0ce70a9eafcf71cp1e476ajsn227a91fa4d5f` |
   | `RAPIDAPI_HOST` | `fragrancefinder-api.p.rapidapi.com` |
   | `RAPIDAPI_SEARCH_PATH` | `/perfumes/search?q={q}` |

4. 저장 후 **Redeploy**. 사이트 상단 표시등이 초록색(“RapidAPI 연결됨”)이 되면 성공.

> ⚠️ 키가 외부에 노출되었다면 RapidAPI에서 **Regenerate(재발급)** 후 위 값을 갱신하세요.
> `.env.local`은 `.gitignore`로 깃에 올라가지 않으니, 깃허브에는 키가 남지 않습니다.

키를 등록하지 않아도 사이트는 **내장 DB만으로 정상 작동**합니다.

---

## 🚀 배포 (GitHub → Vercel 자동 배포)

이미 Vercel ↔ GitHub(`Jonghyunpark95/scent`)가 연동되어 있으므로 **푸시하면 자동 배포**됩니다.

```bash
git add .
git commit -m "feat: scent finder"
git push
```

로컬에서 API까지 테스트하려면:
```bash
npm i -g vercel
vercel dev          # http://localhost:3000
```
(`.env.local`의 `RAPIDAPI_HOST`를 채워야 API가 동작합니다.)

---

## 💰 구글 애드센스

1. [애드센스](https://adsense.google.com) 가입 후 **사이트 추가** (배포된 도메인).
2. 승인되면 받은 코드의 `ca-pub-XXXXXXXXXXXXXXXX`를 확인.
3. `index.html` 상단 `<head>` 안의 애드센스 주석을 해제하고 본인 ID로 교체.
4. `ads.txt`의 `pub-XXXXXXXXXXXXXXXX`도 본인 ID로 교체.
5. 광고 슬롯(`#ad-top`, `#ad-mid`, `#ad-bottom`) 위치에 애드센스 광고 단위 코드를 넣으면 됩니다.

> 애드센스 승인에는 **콘텐츠 양과 체류 시간**이 중요합니다. 백과사전 검색·추천 기능이 체류 시간 확보에 유리해요. 승인 전이라도 사이트는 정상 작동합니다.

---

## 🌐 가비아 도메인 연결 (구매 후)

1. 가비아에서 도메인 구매.
2. **Vercel** → 프로젝트 → **Settings → Domains** → 도메인 입력 → **Add**.
3. Vercel이 안내하는 DNS 레코드를 **가비아 → My가비아 → DNS 관리** 에 등록:
   - 루트 도메인(`example.com`): **A 레코드** → `76.76.21.21`
   - `www`: **CNAME** → `cname.vercel-dns.com`
   (Vercel 화면에 표시되는 값을 그대로 따르세요. 값이 바뀔 수 있습니다.)
4. DNS 전파(수십 분~수 시간) 후 HTTPS 자동 발급 완료.

---

## 🛠️ 향수 데이터 추가/수정
`data.js`의 `PERFUMES` 배열에 객체를 추가하면 됩니다.
```js
{ id:"고유키", name:"향수명", brand:"브랜드", gender:"유니섹스", price:198000,
  top:["bergamot"], middle:["rose"], base:["sandalwood","musk"],
  desc:"한 줄 설명", _img:"https://...(선택)" }
```
노트 키는 `data.js`의 `NOTES`에 정의된 것을 사용하세요. 없는 노트는 `NOTES`에 추가하면 비유 설명까지 자동 반영됩니다.
