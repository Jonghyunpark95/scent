/* =========================================================================
 * Scent Finder — 데이터
 * notes  : 향료(노트) 메타데이터 (계열 / 이모지 / 쉬운 비유)
 * perfumes : 향수 데이터베이스 (탑/미들/베이스 노트, 예상가격 KRW)
 * 가격은 50ml 기준 대략적인 국내 정가/시중가 추정치입니다 (참고용).
 * ========================================================================= */

const NOTE_FAMILIES = {
  citrus:   { label: "시트러스", emoji: "🍋", color: "#ffd34d" },
  fruity:   { label: "프루티",   emoji: "🍑", color: "#ff8fab" },
  floral:   { label: "플로럴",   emoji: "🌸", color: "#ff9ecb" },
  green:    { label: "그린/허브", emoji: "🌿", color: "#7ed957" },
  aromatic: { label: "아로마틱", emoji: "🪴", color: "#9bcf63" },
  spicy:    { label: "스파이시", emoji: "🌶️", color: "#ff7a45" },
  sweet:    { label: "스위트",   emoji: "🍯", color: "#ffb84d" },
  woody:    { label: "우디",     emoji: "🪵", color: "#b07d4f" },
  oriental: { label: "오리엔탈/앰버", emoji: "🏜️", color: "#d9a066" },
  musk:     { label: "머스크",   emoji: "🤍", color: "#e7e1d8" },
  aquatic:  { label: "아쿠아틱", emoji: "🌊", color: "#5bc0eb" },
  gourmand: { label: "구르망",   emoji: "🍮", color: "#c88a5a" },
};

/* note key -> { name, family, emoji, analogy }
 * analogy : 어려운 향을 일상적인 것에 비유한 한 줄 설명 */
const NOTES = {
  // 시트러스
  bergamot:   { name: "베르가못", family: "citrus", emoji: "🍋", analogy: "얼그레이 홍차에서 나는 상큼한 시트러스 향" },
  lemon:      { name: "레몬",     family: "citrus", emoji: "🍋", analogy: "갓 짜낸 레몬, 청량하고 톡 쏘는 느낌" },
  orange:     { name: "오렌지",   family: "citrus", emoji: "🍊", analogy: "오렌지 껍질 깔 때 퍼지는 달콤상큼함" },
  grapefruit: { name: "자몽",     family: "citrus", emoji: "🍊", analogy: "쌉싸름하면서 상큼한 자몽 주스" },
  mandarin:   { name: "만다린",   family: "citrus", emoji: "🍊", analogy: "귤 까먹을 때의 부드럽고 달콤한 시트러스" },

  // 프루티
  apple:      { name: "애플",     family: "fruity", emoji: "🍏", analogy: "아삭한 풋사과 한 입" },
  peach:      { name: "피치",     family: "fruity", emoji: "🍑", analogy: "잘 익은 복숭아의 보송하고 달큰한 과즙" },
  blackcurrant:{ name: "블랙커런트", family: "fruity", emoji: "🫐", analogy: "새콤달콤한 베리, 카시스 음료 느낌" },
  pear:       { name: "배",       family: "fruity", emoji: "🍐", analogy: "시원하고 청량한 배 과즙" },
  raspberry:  { name: "라즈베리", family: "fruity", emoji: "🍓", analogy: "새콤달콤 라즈베리 젤리" },
  lychee:     { name: "리치",     family: "fruity", emoji: "🍈", analogy: "달콤하고 화사한 리치 과육" },

  // 플로럴
  rose:       { name: "로즈",     family: "floral", emoji: "🌹", analogy: "꽃집에서 갓 산 장미 한 다발" },
  jasmine:    { name: "자스민",   family: "floral", emoji: "🌼", analogy: "밤에 진하게 퍼지는 하얀 꽃향기" },
  peony:      { name: "피오니",   family: "floral", emoji: "🌸", analogy: "물오른 작약, 화사하고 부드러운 꽃" },
  iris:       { name: "아이리스", family: "floral", emoji: "🪻", analogy: "파우더리하고 고급스러운 비누 같은 꽃향" },
  lily:       { name: "릴리(은방울꽃)", family: "floral", emoji: "🌷", analogy: "깨끗하고 맑은 봄꽃, 비누처럼 산뜻" },
  tuberose:   { name: "튜베로즈", family: "floral", emoji: "💐", analogy: "크리미하고 관능적인 진한 하얀 꽃" },
  orangeblossom:{ name: "오렌지 블라썸", family: "floral", emoji: "🌼", analogy: "달콤하고 화사한 주황 꽃, 봄날 햇살 같은" },
  violet:     { name: "바이올렛", family: "floral", emoji: "🪻", analogy: "파우더리하고 살짝 달콤한 제비꽃 사탕" },
  ylang:      { name: "일랑일랑", family: "floral", emoji: "🌺", analogy: "이국적이고 진한 열대 꽃향기" },

  // 그린 / 아로마틱
  greenleaves:{ name: "그린 노트", family: "green", emoji: "🌿", analogy: "잔디 깎은 직후, 풀잎 비비면 나는 향" },
  mint:       { name: "민트",     family: "green", emoji: "🌱", analogy: "치약처럼 화하고 시원한 박하" },
  basil:      { name: "바질",     family: "aromatic", emoji: "🌿", analogy: "허브 가득한 파스타에서 나는 향긋함" },
  lavender:   { name: "라벤더",   family: "aromatic", emoji: "💜", analogy: "포근하고 깔끔한 허브, 디퓨저로 익숙한 향" },
  sage:       { name: "세이지",   family: "aromatic", emoji: "🌿", analogy: "쌉싸름하고 청량한 약초 같은 허브" },
  rosemary:   { name: "로즈마리", family: "aromatic", emoji: "🌿", analogy: "톡 쏘는 상쾌한 허브, 고기 요리에 쓰는 그 향" },
  fig:        { name: "피그(무화과)", family: "green", emoji: "🪴", analogy: "초록 잎과 달콤한 과육이 섞인 나무 그늘 느낌" },

  // 스파이시
  pepper:     { name: "페퍼(후추)", family: "spicy", emoji: "🌶️", analogy: "톡 쏘는 통후추, 향에 입체감을 주는 스파이스" },
  pinkpepper: { name: "핑크페퍼", family: "spicy", emoji: "🌶️", analogy: "후추보다 부드럽고 살짝 달큰한 스파이스" },
  cardamom:   { name: "카다멈",   family: "spicy", emoji: "🫚", analogy: "따뜻하고 향긋한 인도 향신료, 짜이 차 느낌" },
  cinnamon:   { name: "시나몬",   family: "spicy", emoji: "🍂", analogy: "계피, 따뜻한 시나몬롤 향" },
  ginger:     { name: "진저",     family: "spicy", emoji: "🫚", analogy: "알싸하고 따뜻한 생강" },
  saffron:    { name: "사프란",   family: "spicy", emoji: "🧡", analogy: "고급스럽고 가죽 같은 따뜻한 향신료" },

  // 스위트 / 구르망
  vanilla:    { name: "바닐라",   family: "gourmand", emoji: "🍦", analogy: "달콤하고 포근한 바닐라 아이스크림" },
  caramel:    { name: "카라멜",   family: "gourmand", emoji: "🍮", analogy: "녹진하게 졸인 카라멜" },
  honey:      { name: "허니",     family: "sweet", emoji: "🍯", analogy: "끈적하고 진한 꿀의 달콤함" },
  chocolate:  { name: "초콜릿",   family: "gourmand", emoji: "🍫", analogy: "다크 초콜릿의 쌉싸름하고 달콤한 향" },
  coffee:     { name: "커피",     family: "gourmand", emoji: "☕", analogy: "갓 내린 에스프레소의 쌉싸름한 향" },
  almond:     { name: "아몬드",   family: "gourmand", emoji: "🌰", analogy: "고소하고 달콤한 아몬드 과자" },
  coconut:    { name: "코코넛",   family: "gourmand", emoji: "🥥", analogy: "선크림처럼 달콤하고 크리미한 휴양지 느낌" },
  tonka:      { name: "통카빈",   family: "gourmand", emoji: "🫘", analogy: "바닐라+아몬드 섞인 듯 달콤고소한 향" },

  // 우디
  sandalwood: { name: "샌달우드", family: "woody", emoji: "🪵", analogy: "절(사찰)에서 나는 은은하고 크리미한 나무향, 우유 탄 나무 느낌" },
  cedar:      { name: "시더우드", family: "woody", emoji: "🪵", analogy: "새 연필 깎을 때 나는 마른 나무향" },
  vetiver:    { name: "베티버",   family: "woody", emoji: "🌾", analogy: "흙냄새 섞인 쌉싸름한 뿌리·풀 향, 비 온 흙 느낌" },
  patchouli:  { name: "파출리",   family: "woody", emoji: "🍃", analogy: "축축한 흙과 한약 같은 깊고 묵직한 향" },
  oud:        { name: "우드(오우드)", family: "woody", emoji: "🪵", analogy: "중동풍의 진하고 약간 동물적인 고급 나무향" },
  guaiac:     { name: "과이악우드", family: "woody", emoji: "🪵", analogy: "살짝 그을린 듯 스모키한 나무향" },
  cypress:    { name: "사이프러스", family: "woody", emoji: "🌲", analogy: "침엽수 숲, 시원하고 청량한 나무향" },

  // 오리엔탈 / 앰버 / 레진
  amber:      { name: "앰버",     family: "oriental", emoji: "🟤", analogy: "따뜻하고 달콤포근한, 햇볕에 데워진 호박 같은 향" },
  incense:    { name: "인센스(유향)", family: "oriental", emoji: "🕯️", analogy: "성당·절에서 피우는 향, 신비롭고 차분한" },
  benzoin:    { name: "벤조인",   family: "oriental", emoji: "🟤", analogy: "바닐라처럼 달콤한 발삼 수지 향" },
  labdanum:   { name: "라브다넘", family: "oriental", emoji: "🟤", analogy: "가죽+꿀 섞인 듯 진하고 따뜻한 수지" },
  myrrh:      { name: "미르(몰약)", family: "oriental", emoji: "🟤", analogy: "약간 쌉싸름하고 신비로운 수지향" },

  // 머스크 / 기타 베이스
  musk:       { name: "머스크",   family: "musk", emoji: "🤍", analogy: "갓 빤 빨래·살냄새처럼 포근하고 깨끗한 향" },
  whitemusk:  { name: "화이트 머스크", family: "musk", emoji: "🤍", analogy: "비누처럼 깨끗하고 은은한 살결 향" },
  leather:    { name: "레더(가죽)", family: "oriental", emoji: "🧥", analogy: "새 가죽 자켓·가죽 가방에서 나는 향" },
  ambergris:  { name: "앰버그리스", family: "musk", emoji: "🌊", analogy: "짭짤하고 포근한 바다·살결 같은 고급 베이스" },
  oakmoss:    { name: "오크모스", family: "woody", emoji: "🍃", analogy: "축축한 숲 바닥의 이끼, 클래식 향수의 묵직한 뿌리" },

  // 아쿠아틱 / 프레시
  marine:     { name: "마린/아쿠아", family: "aquatic", emoji: "🌊", analogy: "바닷바람과 짭조름한 물 내음" },
  seasalt:    { name: "시 솔트",  family: "aquatic", emoji: "🧂", analogy: "해변의 짭짤하고 청량한 소금기" },
  watery:     { name: "워터리 노트", family: "aquatic", emoji: "💧", analogy: "갓 떠온 물처럼 투명하고 시원한 느낌" },
  tea:        { name: "티(차)",   family: "green", emoji: "🍵", analogy: "은은하게 우려낸 녹차/홍차의 차분함" },

  // 추가 노트 (DB에서 참조)
  rum:        { name: "럼",       family: "gourmand", emoji: "🥃", analogy: "달콤하고 따뜻한 럼주, 살짝 알싸한 술 향" },
  tobacco:    { name: "타바코(담뱃잎)", family: "oriental", emoji: "🍂", analogy: "말린 담뱃잎의 달콤쌉싸름하고 따뜻한 향" },
  cacao:      { name: "카카오",   family: "gourmand", emoji: "🍫", analogy: "쌉싸름한 코코아 파우더" },
  chestnut:   { name: "체스트넛(밤)", family: "gourmand", emoji: "🌰", analogy: "군밤처럼 고소하고 달큰한 향" },
  clove:      { name: "클로브(정향)", family: "spicy", emoji: "🌶️", analogy: "치과에서 나던 알싸한 향신료, 따뜻한 스파이스" },
  pine:       { name: "파인(소나무)", family: "woody", emoji: "🌲", analogy: "소나무 숲의 시원한 송진 향" },
  geranium:   { name: "제라늄",   family: "floral", emoji: "🌸", analogy: "장미와 허브 사이의 화하고 그린한 꽃향" },
  pineapple:  { name: "파인애플", family: "fruity", emoji: "🍍", analogy: "상큼달콤한 파인애플 과즙" },
  ambrette:   { name: "암브레트", family: "musk", emoji: "🤍", analogy: "식물성 머스크, 포근하고 부드러운 살결 향" },
  galbanum:   { name: "갈바넘",   family: "green", emoji: "🌿", analogy: "쌉싸름하고 진한 풀줄기 향" },
  spicy:      { name: "스파이스", family: "spicy", emoji: "🌶️", analogy: "여러 향신료가 어우러진 따뜻하고 알싸한 향" },
};

/* 향수 DB
 * gender: "남성" | "여성" | "유니섹스"
 * price : 50ml 기준 대략 KRW
 */
const PERFUMES = [
  // --- 조 말론 ---
  { id:"jm-woodsage", name:"우드 세이지 앤 씨 솔트", brand:"조 말론", gender:"유니섹스", price:198000,
    top:["grapefruit","seasalt"], middle:["sage","greenleaves"], base:["ambergris","vetiver"],
    desc:"바닷가 절벽에서 부는 짭조름한 바람 같은 청량함" },
  { id:"jm-englishpear", name:"잉글리쉬 페어 앤 프리지아", brand:"조 말론", gender:"여성", price:198000,
    top:["pear"], middle:["jasmine","rose"], base:["patchouli","musk"],
    desc:"갓 깎은 배의 청량한 과즙과 화사한 꽃" },
  { id:"jm-limebasil", name:"라임 바질 앤 만다린", brand:"조 말론", gender:"유니섹스", price:198000,
    top:["lemon","mandarin"], middle:["basil"], base:["vetiver"],
    desc:"라임과 허브가 어우러진 상쾌한 시그니처" },

  // --- 르 라보 ---
  { id:"ll-santal33", name:"상탈 33", brand:"르 라보", gender:"유니섹스", price:285000,
    top:["cardamom","violet"], middle:["iris"], base:["sandalwood","cedar","leather"],
    desc:"스모키하고 크리미한 우디, 르 라보의 대표 시그니처" },
  { id:"ll-another13", name:"어나더 13", brand:"르 라보", gender:"유니섹스", price:285000,
    top:["pear"], middle:["jasmine"], base:["ambergris","musk","amber"],
    desc:"깨끗한 살결 같은 모던 머스크" },
  { id:"ll-rose31", name:"로즈 31", brand:"르 라보", gender:"유니섹스", price:285000,
    top:["rose","pepper"], middle:["cardamom"], base:["vetiver","oud","guaiac"],
    desc:"달콤하지 않은, 스파이시하고 우디한 장미" },

  // --- 디올 ---
  { id:"dior-sauvage", name:"쏘바쥬 EDT", brand:"디올", gender:"남성", price:135000,
    top:["bergamot","pepper"], middle:["pinkpepper","lavender"], base:["amber","patchouli"],
    desc:"청량한 시트러스에서 따뜻한 앰버로, 대중적인 남성 베스트셀러" },
  { id:"dior-homme", name:"옴므 인텐스", brand:"디올", gender:"남성", price:155000,
    top:["lavender"], middle:["iris","pear"], base:["vetiver","cedar"],
    desc:"파우더리한 아이리스가 중심인 우아한 남성향" },
  { id:"dior-jadore", name:"자도르 EDP", brand:"디올", gender:"여성", price:165000,
    top:["pear","mandarin"], middle:["jasmine","rose","ylang"], base:["musk","vanilla"],
    desc:"화려한 백화 꽃다발, 클래식 여성 플로럴" },
  { id:"dior-missdior", name:"미스 디올 EDP", brand:"디올", gender:"여성", price:165000,
    top:["bergamot","blackcurrant"], middle:["rose","peony"], base:["patchouli","musk"],
    desc:"로맨틱한 장미와 베리, 화사한 여성향" },

  // --- 샤넬 ---
  { id:"chanel-bleu", name:"블루 드 샤넬 EDP", brand:"샤넬", gender:"남성", price:185000,
    top:["grapefruit","lemon","mint"], middle:["ginger","jasmine"], base:["sandalwood","cedar","incense"],
    desc:"시트러스와 우디 인센스의 세련된 남성향" },
  { id:"chanel-coco", name:"코코 마드모아젤 EDP", brand:"샤넬", gender:"여성", price:210000,
    top:["orange","bergamot"], middle:["rose","jasmine"], base:["patchouli","vanilla","vetiver"],
    desc:"상큼함과 파출리가 어우러진 도시적인 여성향" },
  { id:"chanel-chance", name:"챤스 오 땅드르", brand:"샤넬", gender:"여성", price:200000,
    top:["grapefruit"], middle:["jasmine","peach"], base:["whitemusk","cedar"],
    desc:"부드럽고 달콤한 과일·꽃, 산뜻한 페미닌" },

  // --- 톰 포드 ---
  { id:"tf-oud", name:"우드 우드", brand:"톰 포드", gender:"유니섹스", price:330000,
    top:["pepper","cardamom"], middle:["oud","sandalwood"], base:["vanilla","amber","tonka"],
    desc:"진한 오우드와 따뜻한 스파이스, 럭셔리 우디 오리엔탈" },
  { id:"tf-lostcherry", name:"로스트 체리", brand:"톰 포드", gender:"유니섹스", price:430000,
    top:["raspberry","peach"], middle:["jasmine"], base:["tonka","vanilla","almond"],
    desc:"달콤한 체리 리큐르 같은 강렬한 구르망" },
  { id:"tf-tobacco", name:"타바코 바닐라", brand:"톰 포드", gender:"유니섹스", price:430000,
    top:["spicy","ginger"], middle:["vanilla","cardamom"], base:["tonka","cinnamon","cacao"],
    desc:"달콤하고 따뜻한 담뱃잎과 바닐라, 겨울에 어울리는 향" },
  { id:"tf-neroli", name:"네롤리 포르토피노", brand:"톰 포드", gender:"유니섹스", price:330000,
    top:["bergamot","lemon","mandarin"], middle:["orangeblossom","jasmine"], base:["amber","musk"],
    desc:"지중해 휴양지 같은 눈부신 시트러스 플로럴" },

  // --- 메종 마르지엘라 (레플리카) ---
  { id:"mm-jazz", name:"레플리카 재즈클럽", brand:"메종 마르지엘라", gender:"유니섹스", price:185000,
    top:["pinkpepper","lemon"], middle:["rum","sage"], base:["vanilla","tobacco","vetiver"],
    desc:"위스키 바의 따뜻하고 달콤스모키한 분위기" },
  { id:"mm-beach", name:"레플리카 비치 워크", brand:"메종 마르지엘라", gender:"유니섹스", price:185000,
    top:["bergamot","pinkpepper","lemon"], middle:["coconut","ylang"], base:["musk","benzoin"],
    desc:"선크림과 바닷바람, 여름 해변의 추억" },
  { id:"mm-fireplace", name:"레플리카 바이 더 파이어플레이스", brand:"메종 마르지엘라", gender:"유니섹스", price:185000,
    top:["orange","clove"], middle:["chestnut","guaiac"], base:["vanilla","cedar"],
    desc:"벽난로 앞 군밤 같은 따뜻하고 스모키한 향" },

  // --- 바이레도 ---
  { id:"byredo-gypsy", name:"집시 워터", brand:"바이레도", gender:"유니섹스", price:280000,
    top:["bergamot","lemon","pepper"], middle:["incense","pine"], base:["sandalwood","amber","vanilla"],
    desc:"숲속 모닥불 같은 따뜻하고 우디한 향" },
  { id:"byredo-mojave", name:"모하비 고스트", brand:"바이레도", gender:"유니섹스", price:280000,
    top:["ambrette"], middle:["violet","sandalwood"], base:["musk","cedar","amber"],
    desc:"사막처럼 건조하고 미니멀한 우디 머스크" },
  { id:"byredo-blanche", name:"블랑쉬", brand:"바이레도", gender:"여성", price:280000,
    top:["pinkpepper"], middle:["rose","violet"], base:["whitemusk","sandalwood"],
    desc:"갓 세탁한 새하얀 시트 같은 깨끗한 머스크" },

  // --- 딥디크 ---
  { id:"diptyque-philo", name:"필로시코스", brand:"딥디크", gender:"유니섹스", price:215000,
    top:["fig"], middle:["greenleaves","fig"], base:["cedar","whitemusk"],
    desc:"무화과 나무 그늘 같은 그린하고 우디한 시그니처" },
  { id:"diptyque-tam", name:"탐 다오", brand:"딥디크", gender:"유니섹스", price:215000,
    top:["cypress"], middle:["sandalwood","cardamom"], base:["sandalwood","cedar","amber"],
    desc:"순수하고 크리미한 샌달우드의 정수" },
  { id:"diptyque-orpheon", name:"오르페옹", brand:"딥디크", gender:"유니섹스", price:215000,
    top:["bergamot"], middle:["jasmine","tuberose"], base:["cedar","tonka"],
    desc:"60년대 재즈바 같은 차분하고 우디한 플로럴" },

  // --- 입생로랑 ---
  { id:"ysl-libre", name:"리브르 EDP", brand:"입생로랑", gender:"여성", price:170000,
    top:["mandarin","blackcurrant","lavender"], middle:["lavender","jasmine","orangeblossom"], base:["vanilla","musk","cedar"],
    desc:"라벤더와 오렌지 블라썸의 대담한 여성향" },
  { id:"ysl-myslf", name:"마이 셀프", brand:"입생로랑", gender:"남성", price:175000,
    top:["bergamot"], middle:["orangeblossom"], base:["sandalwood","ambergris","vetiver"],
    desc:"오렌지 블라썸과 우디 머스크의 모던 남성향" },

  // --- 크리드 ---
  { id:"creed-aventus", name:"어벤투스", brand:"크리드", gender:"남성", price:480000,
    top:["pineapple","blackcurrant","bergamot"], middle:["rose","jasmine","pinkpepper"], base:["oakmoss","musk","vanilla"],
    desc:"파인애플의 상큼함과 스모키함, 자신감의 대명사" },
  { id:"creed-silver", name:"실버 마운틴 워터", brand:"크리드", gender:"유니섹스", price:420000,
    top:["bergamot","mandarin"], middle:["tea","blackcurrant"], base:["musk","sandalwood","galbanum"],
    desc:"알프스 계곡물 같은 청량하고 깨끗한 향" },

  // --- 펜할리곤스 ---
  { id:"pen-halfeti", name:"할페티", brand:"펜할리곤스", gender:"유니섹스", price:330000,
    top:["bergamot","grapefruit","saffron"], middle:["rose","jasmine","cardamom"], base:["oud","leather","amber"],
    desc:"사프란과 오우드의 럭셔리한 동양적 향" },

  // --- 산타 마리아 노벨라 / 기타 니치 ---
  { id:"acqua-profumo", name:"아쿠아 디 파르마 콜로니아", brand:"아쿠아 디 파르마", gender:"유니섹스", price:230000,
    top:["lemon","bergamot","orange"], middle:["lavender","rosemary"], base:["sandalwood","patchouli","oakmoss"],
    desc:"이탈리아 신사의 클래식한 시트러스 콜로뉴" },

  // --- 대중 인기 (가성비) ---
  { id:"versace-eros", name:"에로스", brand:"베르사체", gender:"남성", price:95000,
    top:["mint","apple","lemon"], middle:["geranium"], base:["vanilla","tonka","cedar"],
    desc:"화한 민트와 달콤한 바닐라, 클럽에서 강한 존재감" },
  { id:"ckone", name:"CK One", brand:"캘빈클라인", gender:"유니섹스", price:55000,
    top:["bergamot","lemon"], middle:["jasmine","violet"], base:["whitemusk","amber"],
    desc:"누구나 부담 없이 쓰는 깨끗한 시트러스 머스크" },
  { id:"narciso-poudree", name:"포 허 푸드레", brand:"나르시소 로드리게즈", gender:"여성", price:140000,
    top:["rose"], middle:["whitemusk","jasmine"], base:["musk","amber","vetiver"],
    desc:"파우더리한 머스크의 끝판왕, 살냄새 같은 포근함" },
  { id:"mfk-baccarat", name:"바카라 루즈 540", brand:"메종 프란시스 커정", gender:"유니섹스", price:430000,
    top:["saffron"], middle:["jasmine"], base:["amber","cedar","tonka"],
    desc:"솜사탕 같은 달콤함과 우디함, 멀리 퍼지는 시그니처" },
  { id:"glossier-you", name:"글로시에 유", brand:"글로시에", gender:"유니섹스", price:120000,
    top:["pinkpepper"], middle:["iris"], base:["musk","ambrette"],
    desc:"내 살냄새와 섞이는 듯한 친밀한 머스크" },
];

/* === 추가 노트 (확장 DB에서 참조) === */
Object.assign(NOTES, {
  nutmeg:   { name:"넛맥(육두구)", family:"spicy",  emoji:"🌰", analogy:"따뜻하고 알싸한 향신료, 베이킹에 쓰는 그 향" },
  bay:      { name:"베이(월계수)", family:"aromatic", emoji:"🌿", analogy:"향긋하고 쌉싸름한 월계수 잎" },
  magnolia: { name:"매그놀리아", family:"floral", emoji:"🌸", analogy:"레몬빛이 도는 화사하고 청초한 흰 목련꽃" },
  freesia:  { name:"프리지아", family:"floral", emoji:"🌷", analogy:"맑고 산뜻한 봄꽃, 비누처럼 깨끗한" },
  gardenia: { name:"가드니아(치자)", family:"floral", emoji:"💮", analogy:"크리미하고 진한 하얀 치자꽃" },
  lotus:    { name:"로터스(연꽃)", family:"floral", emoji:"🪷", analogy:"맑고 시원한, 물기 어린 연꽃" },
});

/* === 영문명 (RapidAPI 사진/검색 매칭용) === */
const EN_NAMES = {
  "jm-woodsage":"Jo Malone Wood Sage Sea Salt","jm-englishpear":"Jo Malone English Pear Freesia",
  "jm-limebasil":"Jo Malone Lime Basil Mandarin","ll-santal33":"Le Labo Santal 33",
  "ll-another13":"Le Labo Another 13","ll-rose31":"Le Labo Rose 31","dior-sauvage":"Dior Sauvage",
  "dior-homme":"Dior Homme Intense","dior-jadore":"Dior Jadore","dior-missdior":"Dior Miss Dior",
  "chanel-bleu":"Bleu de Chanel","chanel-coco":"Chanel Coco Mademoiselle","chanel-chance":"Chanel Chance Eau Tendre",
  "tf-oud":"Tom Ford Oud Wood","tf-lostcherry":"Tom Ford Lost Cherry","tf-tobacco":"Tom Ford Tobacco Vanille",
  "tf-neroli":"Tom Ford Neroli Portofino","mm-jazz":"Maison Margiela Replica Jazz Club",
  "mm-beach":"Maison Margiela Replica Beach Walk","mm-fireplace":"Maison Margiela Replica By the Fireplace",
  "byredo-gypsy":"Byredo Gypsy Water","byredo-mojave":"Byredo Mojave Ghost","byredo-blanche":"Byredo Blanche",
  "diptyque-philo":"Diptyque Philosykos","diptyque-tam":"Diptyque Tam Dao","diptyque-orpheon":"Diptyque Orpheon",
  "ysl-libre":"Yves Saint Laurent Libre","ysl-myslf":"Yves Saint Laurent MYSLF","creed-aventus":"Creed Aventus",
  "creed-silver":"Creed Silver Mountain Water","pen-halfeti":"Penhaligons Halfeti","acqua-profumo":"Acqua di Parma Colonia",
  "versace-eros":"Versace Eros","ckone":"Calvin Klein CK One","narciso-poudree":"Narciso Rodriguez For Her Poudree",
  "mfk-baccarat":"Baccarat Rouge 540","glossier-you":"Glossier You",
};

/* === 브랜드 영문명 (RapidAPI brand.name 필터용 → 브랜드별 향수 대량 로딩) === */
const BRAND_EN = {
  "조 말론":"Jo Malone London","르 라보":"Le Labo","디올":"Dior","샤넬":"Chanel","톰 포드":"Tom Ford",
  "메종 마르지엘라":"Maison Martin Margiela","바이레도":"Byredo","딥디크":"Diptyque","입생로랑":"Yves Saint Laurent",
  "크리드":"Creed","펜할리곤스":"Penhaligon's","아쿠아 디 파르마":"Acqua di Parma","베르사체":"Versace",
  "캘빈클라인":"Calvin Klein","나르시소 로드리게즈":"Narciso Rodriguez","메종 프란시스 커정":"Maison Francis Kurkdjian",
  "글로시에":"Glossier","킬리안":"By Kilian","구찌":"Gucci","프라다":"Prada","파코라반":"Paco Rabanne",
  "퍼퓸 드 말리":"Parfums de Marly","이니시오":"Initio Parfums Privés","제르조프":"Xerjoff","티에리 뮈글러":"Mugler",
  "랑콤":"Lancôme","캐롤리나 헤레라":"Carolina Herrera","빅터앤롤프":"Viktor&Rolf","지방시":"Givenchy",
  "에르메스":"Hermès","조르지오 아르마니":"Giorgio Armani","끌로에":"Chloé","마크 제이콥스":"Marc Jacobs",
  "휴고 보스":"Hugo Boss","몽블랑":"Montblanc","불가리":"Bvlgari","아무아쥬":"Amouage",
  "장 폴 고티에":"Jean Paul Gaultier","돌체앤가바나":"Dolce&Gabbana",
};

/* === 확장 향수 DB === */
PERFUMES.push(
  // 바이 킬리안
  { id:"kilian-gggb", brand:"킬리안", name:"굿 걸 곤 배드", en:"By Kilian Good Girl Gone Bad", gender:"여성", price:330000, top:["peach"], middle:["tuberose","jasmine","rose"], base:["cedar","musk"], desc:"관능적인 하얀 꽃들의 우아한 향" },
  { id:"kilian-angels", brand:"킬리안", name:"엔젤스 셰어", en:"By Kilian Angels Share", gender:"유니섹스", price:390000, top:["cinnamon"], middle:["rum","vanilla","tonka"], base:["sandalwood","oakmoss"], desc:"코냑과 바닐라의 따뜻하고 달콤한 향" },
  { id:"kilian-love", brand:"킬리안", name:"러브 돈 비 샤이", en:"By Kilian Love Dont Be Shy", gender:"여성", price:330000, top:["bergamot","orangeblossom"], middle:["honey"], base:["vanilla","caramel","musk"], desc:"마시멜로 같은 달콤하고 포근한 향" },
  { id:"kilian-blackphantom", brand:"킬리안", name:"블랙 팬텀", en:"By Kilian Black Phantom", gender:"유니섹스", price:390000, top:["coffee"], middle:["rum","almond"], base:["caramel","sandalwood"], desc:"커피·럼·카라멜의 해적 보물 같은 향" },
  { id:"kilian-rolling", brand:"킬리안", name:"롤링 인 러브", en:"By Kilian Rolling in Love", gender:"여성", price:330000, top:["almond"], middle:["tuberose","iris"], base:["musk","sandalwood"], desc:"보송한 아몬드와 파우더리한 흰 꽃" },

  // 크리드
  { id:"creed-git", brand:"크리드", name:"그린 아이리쉬 트위드", en:"Creed Green Irish Tweed", gender:"남성", price:420000, top:["lemon","violet"], middle:["iris","violet"], base:["sandalwood","ambergris"], desc:"클래식 그린·플로럴 남성향의 정석" },
  { id:"creed-viking", brand:"크리드", name:"바이킹", en:"Creed Viking", gender:"남성", price:440000, top:["bergamot","pepper"], middle:["rose","sandalwood"], base:["vetiver","patchouli"], desc:"강인하고 스파이시한 우디" },

  // 톰 포드
  { id:"tf-blackorchid", brand:"톰 포드", name:"블랙 오키드", en:"Tom Ford Black Orchid", gender:"유니섹스", price:230000, top:["blackcurrant"], middle:["ylang","jasmine"], base:["patchouli","vanilla","incense"], desc:"다크하고 관능적인 시그니처 오리엔탈" },
  { id:"tf-soleil", brand:"톰 포드", name:"솔레이 블랑", en:"Tom Ford Soleil Blanc", gender:"유니섹스", price:330000, top:["bergamot","cardamom"], middle:["tuberose","ylang"], base:["coconut","amber","tonka"], desc:"햇살 가득한 휴양지의 코코넛 플로럴" },
  { id:"tf-bitterpeach", brand:"톰 포드", name:"비터 피치", en:"Tom Ford Bitter Peach", gender:"유니섹스", price:430000, top:["peach","orange"], middle:["rum","cardamom"], base:["vanilla","sandalwood"], desc:"농익은 복숭아의 진하고 달콤한 향" },
  { id:"tf-fabulous", brand:"톰 포드", name:"퍼킹 패뷸러스", en:"Tom Ford Fucking Fabulous", gender:"유니섹스", price:480000, top:["lavender"], middle:["almond","leather"], base:["vanilla","tonka","leather"], desc:"가죽과 아몬드의 시크한 향" },

  // 디올
  { id:"dior-elixir", brand:"디올", name:"쏘바쥬 엘릭서", en:"Dior Sauvage Elixir", gender:"남성", price:230000, top:["cinnamon","cardamom"], middle:["lavender"], base:["sandalwood","patchouli","amber"], desc:"농축된 스파이시·우디, 강한 잔향" },
  { id:"dior-bloomingbouquet", brand:"디올", name:"미스 디올 블루밍 부케", en:"Dior Miss Dior Blooming Bouquet", gender:"여성", price:170000, top:["mandarin"], middle:["peony","rose","peach"], base:["whitemusk"], desc:"부드럽고 화사한 봄꽃 부케" },
  { id:"dior-hypnotic", brand:"디올", name:"힙노틱 푸아종", en:"Dior Hypnotic Poison", gender:"여성", price:160000, top:["almond","coconut"], middle:["jasmine"], base:["vanilla","musk"], desc:"치명적으로 달콤한 아몬드·바닐라" },
  { id:"dior-fahrenheit", brand:"디올", name:"파렌하이트", en:"Dior Fahrenheit", gender:"남성", price:150000, top:["mandarin"], middle:["violet","nutmeg"], base:["leather","vetiver"], desc:"제비꽃과 가죽의 독특한 시그니처" },

  // 샤넬
  { id:"chanel-no5", brand:"샤넬", name:"넘버 5 EDP", en:"Chanel No 5", gender:"여성", price:230000, top:["lemon","ylang"], middle:["rose","jasmine"], base:["sandalwood","vanilla","musk"], desc:"세상에서 가장 유명한 알데하이드 플로럴" },
  { id:"chanel-cocnoir", brand:"샤넬", name:"코코 누아", en:"Chanel Coco Noir", gender:"여성", price:215000, top:["grapefruit"], middle:["rose","jasmine"], base:["patchouli","sandalwood","vanilla"], desc:"신비롭고 우아한 다크 오리엔탈" },
  { id:"chanel-alluresport", brand:"샤넬", name:"알뤼르 옴므 스포츠", en:"Chanel Allure Homme Sport", gender:"남성", price:175000, top:["orange","marine"], middle:["pepper","cedar"], base:["tonka","vetiver"], desc:"청량하고 깔끔한 데일리 남성향" },
  { id:"chanel-gabrielle", brand:"샤넬", name:"가브리엘", en:"Chanel Gabrielle", gender:"여성", price:215000, top:["grapefruit"], middle:["orangeblossom","jasmine","tuberose"], base:["sandalwood","musk"], desc:"빛나는 하얀 꽃다발" },

  // 입생로랑
  { id:"ysl-blackopium", brand:"입생로랑", name:"블랙 오피움", en:"Yves Saint Laurent Black Opium", gender:"여성", price:170000, top:["pinkpepper"], middle:["coffee","jasmine"], base:["vanilla","patchouli"], desc:"커피와 바닐라의 중독적인 향" },
  { id:"ysl-monparis", brand:"입생로랑", name:"몬 파리", en:"Yves Saint Laurent Mon Paris", gender:"여성", price:170000, top:["raspberry"], middle:["peony","jasmine"], base:["patchouli","whitemusk"], desc:"달콤한 베리와 파출리의 사랑스러운 향" },
  { id:"ysl-y", brand:"입생로랑", name:"와이 EDP", en:"Yves Saint Laurent Y EDP", gender:"남성", price:170000, top:["apple","ginger"], middle:["sage","geranium"], base:["amber","tonka"], desc:"상쾌함과 우디함의 모던 남성향" },

  // 구찌
  { id:"gucci-bloom", brand:"구찌", name:"블룸", en:"Gucci Bloom", gender:"여성", price:160000, top:["greenleaves"], middle:["tuberose","jasmine"], base:["iris"], desc:"흐드러진 흰 꽃밭 같은 진한 플로럴" },
  { id:"gucci-guilty", brand:"구찌", name:"길티 뿌르 옴므", en:"Gucci Guilty Pour Homme", gender:"남성", price:150000, top:["lemon","pinkpepper"], middle:["lavender","orangeblossom"], base:["patchouli","cedar"], desc:"라벤더와 파출리의 관능적 남성향" },
  { id:"gucci-flora", brand:"구찌", name:"플로라 고저스 가드니아", en:"Gucci Flora Gorgeous Gardenia", gender:"여성", price:150000, top:["pear"], middle:["jasmine","peony"], base:["patchouli","musk"], desc:"달콤한 배와 가드니아의 사랑스러움" },

  // 프라다
  { id:"prada-carbon", brand:"프라다", name:"루나 로사 카본", en:"Prada Luna Rossa Carbon", gender:"남성", price:140000, top:["bergamot","pepper"], middle:["lavender"], base:["amber","patchouli"], desc:"메탈릭하고 깔끔한 인기 남성향" },
  { id:"prada-candy", brand:"프라다", name:"캔디", en:"Prada Candy", gender:"여성", price:140000, top:["caramel"], middle:["honey"], base:["vanilla","musk","benzoin"], desc:"카라멜처럼 달콤한 구르망" },
  { id:"prada-lhomme", brand:"프라다", name:"롬므", en:"Prada LHomme", gender:"남성", price:150000, top:["orangeblossom"], middle:["iris","pepper"], base:["amber","cedar","patchouli"], desc:"파우더리하고 깨끗한 세련된 남성향" },

  // 베르사체
  { id:"versace-dylanblue", brand:"베르사체", name:"딜런 블루", en:"Versace Dylan Blue", gender:"남성", price:110000, top:["bergamot","grapefruit"], middle:["fig","pepper"], base:["amber","patchouli"], desc:"청량하면서 묵직한 인기 남성향" },
  { id:"versace-brightcrystal", brand:"베르사체", name:"브라이트 크리스탈", en:"Versace Bright Crystal", gender:"여성", price:95000, top:["grapefruit","peach"], middle:["peony","magnolia"], base:["musk","amber"], desc:"상큼하고 화사한 데일리 여성향" },

  // 파코라반
  { id:"paco-1million", brand:"파코라반", name:"원 밀리언", en:"Paco Rabanne 1 Million", gender:"남성", price:120000, top:["grapefruit","mint"], middle:["cinnamon","rose"], base:["leather","amber"], desc:"금괴 보틀, 달콤스파이시한 향" },
  { id:"paco-invictus", brand:"파코라반", name:"인빅터스", en:"Paco Rabanne Invictus", gender:"남성", price:120000, top:["grapefruit","marine"], middle:["bay","jasmine"], base:["guaiac","ambergris"], desc:"상쾌한 아쿠아틱 우디" },
  { id:"paco-ladymillion", brand:"파코라반", name:"레이디 밀리언", en:"Paco Rabanne Lady Million", gender:"여성", price:120000, top:["orange","raspberry"], middle:["orangeblossom","jasmine"], base:["honey","patchouli"], desc:"화려하고 달콤한 여성향" },

  // 메종 마르지엘라 (레플리카)
  { id:"mm-lazy", brand:"메종 마르지엘라", name:"레플리카 레이지 선데이 모닝", en:"Maison Margiela Replica Lazy Sunday Morning", gender:"유니섹스", price:185000, top:["pear"], middle:["lily","rose"], base:["musk","iris"], desc:"갓 세탁한 시트와 나른한 아침" },
  { id:"mm-coffee", brand:"메종 마르지엘라", name:"레플리카 커피 브레이크", en:"Maison Margiela Replica Coffee Break", gender:"유니섹스", price:185000, top:["coffee","cardamom"], middle:["almond"], base:["vanilla","musk"], desc:"카페에서 마시는 따뜻한 라떼" },

  // 바이레도
  { id:"byredo-bal", brand:"바이레도", name:"발 다프리크", en:"Byredo Bal dAfrique", gender:"유니섹스", price:280000, top:["bergamot","lemon"], middle:["violet","jasmine"], base:["vetiver","cedar","musk"], desc:"자유로운 파리·아프리카의 무드" },
  { id:"byredo-rose", brand:"바이레도", name:"로즈 오브 노 맨스 랜드", en:"Byredo Rose of No Mans Land", gender:"유니섹스", price:280000, top:["pinkpepper","raspberry"], middle:["rose"], base:["amber","musk"], desc:"투명하고 섬세한 장미" },

  // 딥디크
  { id:"diptyque-doson", brand:"딥디크", name:"도손", en:"Diptyque Do Son", gender:"여성", price:215000, top:["orangeblossom"], middle:["tuberose"], base:["musk","benzoin"], desc:"바닷바람에 실린 튜베로즈" },
  { id:"diptyque-eaurose", brand:"딥디크", name:"오 로즈", en:"Diptyque Eau Rose", gender:"여성", price:215000, top:["lychee"], middle:["rose","peony"], base:["musk"], desc:"싱그럽고 발랄한 장미" },

  // 르 라보
  { id:"ll-bergamote22", brand:"르 라보", name:"베르가못 22", en:"Le Labo Bergamote 22", gender:"유니섹스", price:285000, top:["bergamot","grapefruit"], middle:["orangeblossom"], base:["amber","musk","vetiver"], desc:"상큼함을 머스크로 감싼 시트러스" },
  { id:"ll-thenoir29", brand:"르 라보", name:"더 누아 29", en:"Le Labo The Noir 29", gender:"유니섹스", price:285000, top:["tea","fig"], middle:["tobacco"], base:["vetiver","cedar"], desc:"홍차와 무화과의 쌉싸름한 우디" },

  // 조 말론
  { id:"jm-peony", brand:"조 말론", name:"피오니 앤 블러쉬 스웨이드", en:"Jo Malone Peony Blush Suede", gender:"여성", price:198000, top:["apple"], middle:["peony","rose","jasmine"], base:["leather"], desc:"풍성한 작약과 부드러운 스웨이드" },
  { id:"jm-bluebell", brand:"조 말론", name:"와일드 블루벨", en:"Jo Malone Wild Bluebell", gender:"여성", price:198000, top:["lychee"], middle:["lily","jasmine"], base:["musk"], desc:"청초하고 싱그러운 블루벨 꽃" },
  { id:"jm-blackberry", brand:"조 말론", name:"블랙베리 앤 베이", en:"Jo Malone Blackberry Bay", gender:"유니섹스", price:198000, top:["blackcurrant","grapefruit"], middle:["greenleaves"], base:["cedar","patchouli"], desc:"잘 익은 블랙베리와 월계수 잎" },

  // 메종 프란시스 커정
  { id:"mfk-grandsoir", brand:"메종 프란시스 커정", name:"그랑 수아", en:"Maison Francis Kurkdjian Grand Soir", gender:"유니섹스", price:380000, top:["orangeblossom"], middle:["benzoin","amber"], base:["vanilla","tonka","labdanum"], desc:"파리의 밤 같은 따뜻한 앰버 바닐라" },
  { id:"mfk-aqua", brand:"메종 프란시스 커정", name:"아쿠아 유니버살리스", en:"Maison Francis Kurkdjian Aqua Universalis", gender:"유니섹스", price:330000, top:["bergamot","lemon"], middle:["lily"], base:["musk"], desc:"갓 세탁한 듯 깨끗하고 맑은 향" },

  // 퍼퓸 드 말리
  { id:"pdm-layton", brand:"퍼퓸 드 말리", name:"레이튼", en:"Parfums de Marly Layton", gender:"유니섹스", price:330000, top:["apple","bergamot"], middle:["lavender","geranium","violet"], base:["vanilla","sandalwood"], desc:"사과와 바닐라의 우아한 만능향" },
  { id:"pdm-delina", brand:"퍼퓸 드 말리", name:"델리나", en:"Parfums de Marly Delina", gender:"여성", price:330000, top:["lychee"], middle:["rose","peony"], base:["vanilla","musk"], desc:"리치와 장미의 화사한 여성향" },
  { id:"pdm-herod", brand:"퍼퓸 드 말리", name:"헤로드", en:"Parfums de Marly Herod", gender:"남성", price:330000, top:["cinnamon","pepper"], middle:["tobacco"], base:["vanilla","vetiver"], desc:"바닐라와 담뱃잎의 따뜻한 남성향" },

  // 이니시오
  { id:"initio-oudgreat", brand:"이니시오", name:"우드 포 그레이트니스", en:"Initio Oud for Greatness", gender:"유니섹스", price:430000, top:["saffron"], middle:["oud"], base:["patchouli","musk"], desc:"사프란과 오우드의 강렬한 존재감" },
  { id:"initio-sideeffect", brand:"이니시오", name:"사이드 이펙트", en:"Initio Side Effect", gender:"유니섹스", price:430000, top:["cinnamon"], middle:["rum","tobacco"], base:["vanilla"], desc:"위스키 바 같은 달콤스파이시" },

  // 제르조프
  { id:"xerjoff-naxos", brand:"제르조프", name:"낙소스", en:"Xerjoff Naxos", gender:"유니섹스", price:430000, top:["bergamot","lavender"], middle:["honey","cinnamon"], base:["tobacco","vanilla","tonka"], desc:"꿀과 담뱃잎의 럭셔리 구르망" },
  { id:"xerjoff-erbapura", brand:"제르조프", name:"에르바 푸라", en:"Xerjoff Erba Pura", gender:"유니섹스", price:380000, top:["orange","lemon"], middle:["peach"], base:["amber","musk","vanilla"], desc:"상큼한 과일과 앰버의 만능향" },

  // 뮈글러
  { id:"mugler-angel", brand:"티에리 뮈글러", name:"엔젤", en:"Mugler Angel", gender:"여성", price:140000, top:["bergamot"], middle:["honey","peach"], base:["patchouli","vanilla","chocolate"], desc:"파출리와 초콜릿의 강렬한 구르망" },
  { id:"mugler-alien", brand:"티에리 뮈글러", name:"에이리언", en:"Mugler Alien", gender:"여성", price:140000, top:["jasmine"], middle:["jasmine"], base:["amber","cedar"], desc:"신비로운 자스민과 앰버" },

  // 랑콤
  { id:"lancome-lveb", brand:"랑콤", name:"라 비 에 벨", en:"Lancome La Vie Est Belle", gender:"여성", price:150000, top:["blackcurrant","pear"], middle:["iris","jasmine","orangeblossom"], base:["vanilla","patchouli","tonka"], desc:"아이리스와 프랄린의 달콤한 행복" },
  { id:"lancome-idole", brand:"랑콤", name:"이돌", en:"Lancome Idole", gender:"여성", price:140000, top:["pear"], middle:["rose","jasmine"], base:["musk","vanilla"], desc:"깨끗하고 모던한 장미 머스크" },

  // 캐롤리나 헤레라
  { id:"ch-goodgirl", brand:"캐롤리나 헤레라", name:"굿 걸", en:"Carolina Herrera Good Girl", gender:"여성", price:150000, top:["almond","coffee"], middle:["tuberose","jasmine"], base:["tonka","cacao","vanilla"], desc:"하이힐 보틀, 달콤하고 관능적인 향" },

  // 빅터앤롤프
  { id:"vr-flowerbomb", brand:"빅터앤롤프", name:"플라워밤", en:"Viktor Rolf Flowerbomb", gender:"여성", price:170000, top:["tea","bergamot"], middle:["jasmine","rose","orangeblossom"], base:["patchouli","vanilla","musk"], desc:"폭발하는 듯한 풍성한 꽃향" },
  { id:"vr-spicebomb", brand:"빅터앤롤프", name:"스파이스밤", en:"Viktor Rolf Spicebomb", gender:"남성", price:160000, top:["bergamot","pinkpepper"], middle:["cinnamon","saffron"], base:["tobacco","leather"], desc:"수류탄 보틀, 따뜻한 스파이스 폭발" },

  // 지방시
  { id:"givenchy-linterdit", brand:"지방시", name:"랑떼르디", en:"Givenchy LInterdit", gender:"여성", price:150000, top:["orangeblossom"], middle:["tuberose","jasmine"], base:["patchouli","vetiver","amber"], desc:"하얀 꽃과 다크한 베이스의 대비" },
  { id:"givenchy-gentleman", brand:"지방시", name:"젠틀맨 EDP", en:"Givenchy Gentleman", gender:"남성", price:150000, top:["pear","lavender"], middle:["iris"], base:["leather","patchouli"], desc:"아이리스와 가죽의 세련된 신사" },

  // 에르메스
  { id:"hermes-terre", brand:"에르메스", name:"테르 데르메스", en:"Hermes Terre dHermes", gender:"남성", price:160000, top:["orange","grapefruit","pepper"], middle:["geranium"], base:["vetiver","cedar","benzoin"], desc:"흙과 시트러스, 베티버의 대지향" },
  { id:"hermes-twilly", brand:"에르메스", name:"트윌리", en:"Hermes Twilly", gender:"여성", price:160000, top:["ginger"], middle:["tuberose","orangeblossom"], base:["sandalwood"], desc:"생강과 튜베로즈의 발랄한 향" },

  // 조르지오 아르마니
  { id:"armani-adgprofumo", brand:"조르지오 아르마니", name:"아쿠아 디 지오 프로푸모", en:"Giorgio Armani Acqua di Gio Profumo", gender:"남성", price:160000, top:["bergamot","marine"], middle:["sage","geranium"], base:["patchouli","incense"], desc:"바다와 인센스의 깊은 아쿠아틱" },
  { id:"armani-si", brand:"조르지오 아르마니", name:"시", en:"Giorgio Armani Si", gender:"여성", price:150000, top:["blackcurrant"], middle:["rose","freesia"], base:["vanilla","patchouli","musk"], desc:"블랙커런트와 머스크의 시크한 향" },
  { id:"armani-myway", brand:"조르지오 아르마니", name:"마이 웨이", en:"Giorgio Armani My Way", gender:"여성", price:150000, top:["bergamot","orangeblossom"], middle:["tuberose","jasmine"], base:["vanilla","musk","cedar"], desc:"오렌지 블라썸과 튜베로즈의 여정" },

  // 끌로에
  { id:"chloe-edp", brand:"끌로에", name:"끌로에 EDP", en:"Chloe Eau de Parfum", gender:"여성", price:140000, top:["lychee"], middle:["peony","rose","freesia"], base:["amber","cedar"], desc:"장미를 중심으로 한 우아한 여성향" },
  { id:"chloe-nomade", brand:"끌로에", name:"노마드", en:"Chloe Nomade", gender:"여성", price:140000, top:["peach"], middle:["freesia","jasmine"], base:["oakmoss","patchouli"], desc:"자두와 오크모스의 자유로운 향" },

  // 마크 제이콥스
  { id:"mj-daisy", brand:"마크 제이콥스", name:"데이지", en:"Marc Jacobs Daisy", gender:"여성", price:120000, top:["raspberry","violet"], middle:["jasmine","gardenia"], base:["musk","cedar"], desc:"상큼하고 청순한 데일리 플로럴" },

  // 캘빈클라인
  { id:"ck-eternity", brand:"캘빈클라인", name:"이터니티", en:"Calvin Klein Eternity", gender:"여성", price:80000, top:["mandarin","freesia"], middle:["lily","jasmine","rose"], base:["sandalwood","amber","musk"], desc:"클래식하고 깨끗한 플로럴" },

  // 휴고 보스
  { id:"boss-bottled", brand:"휴고 보스", name:"보스 보틀드", en:"Hugo Boss Bottled", gender:"남성", price:90000, top:["apple"], middle:["cinnamon","geranium"], base:["vanilla","sandalwood","cedar"], desc:"사과와 시나몬의 깔끔한 데일리 남성향" },

  // 몽블랑
  { id:"mont-explorer", brand:"몽블랑", name:"익스플로러", en:"Montblanc Explorer", gender:"남성", price:90000, top:["bergamot","pinkpepper"], middle:["vetiver"], base:["patchouli","leather","amber"], desc:"가성비 좋은 우디 가죽향" },
  { id:"mont-legend", brand:"몽블랑", name:"레전드", en:"Montblanc Legend", gender:"남성", price:85000, top:["lavender","pineapple","apple"], middle:["rose","geranium"], base:["oakmoss","sandalwood"], desc:"상쾌한 프루티 푸제르" },

  // 불가리
  { id:"bvlgari-maninblack", brand:"불가리", name:"맨 인 블랙", en:"Bvlgari Man in Black", gender:"남성", price:120000, top:["rum"], middle:["tuberose","leather"], base:["tonka","benzoin","amber"], desc:"럼과 가죽의 강렬한 남성향" },
  { id:"bvlgari-omnia", brand:"불가리", name:"옴니아 크리스탈린", en:"Bvlgari Omnia Crystalline", gender:"여성", price:110000, top:["tea"], middle:["lily","lotus"], base:["musk","sandalwood","cedar"], desc:"대나무와 연꽃의 맑고 투명한 향" },

  // 아무아쥬
  { id:"amouage-reflectionman", brand:"아무아쥬", name:"리플렉션 맨", en:"Amouage Reflection Man", gender:"남성", price:330000, top:["rosemary","pinkpepper"], middle:["jasmine","ylang"], base:["sandalwood","cedar","vetiver"], desc:"깨끗하고 우아한 화이트 플로럴 우디" },
  { id:"amouage-interludeman", brand:"아무아쥬", name:"인터루드 맨", en:"Amouage Interlude Man", gender:"남성", price:360000, top:["bergamot","pepper"], middle:["incense","amber"], base:["leather","oud","sandalwood"], desc:"스모키한 인센스와 가죽의 강렬한 카오스" },
  { id:"amouage-jubilation25", brand:"아무아쥬", name:"주빌레이션 25 우먼", en:"Amouage Jubilation 25 Woman", gender:"여성", price:360000, top:["orange","ylang"], middle:["rose","jasmine"], base:["patchouli","incense","myrrh"], desc:"풍성한 과일·꽃과 인센스의 화려한 향" },
  { id:"amouage-reflectionwoman", brand:"아무아쥬", name:"리플렉션 우먼", en:"Amouage Reflection Woman", gender:"여성", price:330000, top:["lychee"], middle:["jasmine","rose","tuberose"], base:["sandalwood","amber"], desc:"빛나는 화이트 플로럴" },
  { id:"amouage-honour", brand:"아무아쥬", name:"오너 우먼", en:"Amouage Honour Woman", gender:"여성", price:340000, top:["lily"], middle:["tuberose","jasmine"], base:["incense","musk","leather"], desc:"순백의 튜베로즈와 신비로운 인센스" },
);

/* === 추가 유명 향수 (누락 보완) === */
PERFUMES.push(
  // 아무아쥬 디아
  { id:"amouage-diaman", brand:"아무아쥬", name:"디아 맨", en:"Amouage Dia Man", gender:"남성", price:330000, top:["bergamot","sage"], middle:["iris","cardamom"], base:["incense","guaiac","cedar"], desc:"파우더리한 아이리스와 인센스의 우아한 클래식 우디" },
  { id:"amouage-diawoman", brand:"아무아쥬", name:"디아 우먼", en:"Amouage Dia Woman", gender:"여성", price:330000, top:["peach","rose"], middle:["iris","peony","ylang"], base:["incense","whitemusk","vetiver"], desc:"실크처럼 부드러운 파우더리 플로럴" },

  // 장 폴 고티에
  { id:"jpg-lemale", brand:"장 폴 고티에", name:"르 말", en:"Jean Paul Gaultier Le Male", gender:"남성", price:110000, top:["mint","bergamot"], middle:["lavender","cinnamon"], base:["vanilla","tonka"], desc:"민트와 바닐라의 달콤한 인기 남성향, 상반신 보틀" },
  { id:"jpg-scandal", brand:"장 폴 고티에", name:"스캔들 EDP", en:"Jean Paul Gaultier Scandal", gender:"여성", price:120000, top:["blackcurrant","orange"], middle:["honey","jasmine"], base:["caramel","patchouli"], desc:"꿀과 파출리의 중독적인 달콤함" },

  // 돌체앤가바나
  { id:"dg-lightblue", brand:"돌체앤가바나", name:"라이트 블루", en:"Dolce&Gabbana Light Blue", gender:"여성", price:95000, top:["lemon","apple"], middle:["jasmine","rose"], base:["cedar","amber","musk"], desc:"지중해 여름 같은 상큼한 시트러스 플로럴" },
  { id:"dg-theoneman", brand:"돌체앤가바나", name:"디 원 포 맨", en:"Dolce&Gabbana The One for Men", gender:"남성", price:110000, top:["grapefruit","basil"], middle:["cardamom","ginger"], base:["tobacco","amber","cedar"], desc:"따뜻한 담뱃잎과 스파이스의 세련된 남성향" },

  // 캐롤리나 헤레라
  { id:"ch-212men", brand:"캐롤리나 헤레라", name:"212 맨", en:"Carolina Herrera 212 Men", gender:"남성", price:110000, top:["bergamot","grapefruit","greenleaves"], middle:["sage","ginger"], base:["sandalwood","musk"], desc:"깔끔하고 도시적인 시트러스 우디" },

  // 톰 포드
  { id:"tf-ombreleather", brand:"톰 포드", name:"옴브레 레더", en:"Tom Ford Ombre Leather", gender:"유니섹스", price:230000, top:["cardamom"], middle:["leather","jasmine"], base:["amber","patchouli","oakmoss"], desc:"부드러운 가죽과 꽃, 사막 같은 우디 레더" },

  // 이니시오
  { id:"initio-rehab", brand:"이니시오", name:"리햅", en:"Initio Rehab", gender:"유니섹스", price:430000, top:["pepper"], middle:["incense"], base:["vanilla","benzoin","musk"], desc:"살냄새 같은 바닐라 머스크, 중독적인 스킨센트" },

  // 퍼퓸 드 말리
  { id:"pdm-pegasus", brand:"퍼퓸 드 말리", name:"페가수스", en:"Parfums de Marly Pegasus", gender:"남성", price:330000, top:["almond","bergamot"], middle:["jasmine"], base:["vanilla","sandalwood","amber"], desc:"고소한 아몬드와 바닐라의 우아한 향" },

  // 메종 마르지엘라
  { id:"mm-springtime", brand:"메종 마르지엘라", name:"레플리카 스프링타임 인 어 파크", en:"Maison Margiela Replica Springtime in a Park", gender:"유니섹스", price:185000, top:["pear","blackcurrant"], middle:["peony","lily"], base:["musk"], desc:"봄날 공원의 싱그러운 꽃과 풀내음" },

  // 샤넬
  { id:"chanel-allurehomme", brand:"샤넬", name:"알뤼르 옴므", en:"Chanel Allure Homme", gender:"남성", price:160000, top:["mandarin"], middle:["pepper","cedar"], base:["tonka","vanilla","vetiver"], desc:"따뜻하고 부드러운 우디, 클래식 데일리 남성향" },

  // 에르메스
  { id:"hermes-h24", brand:"에르메스", name:"아쉬 24", en:"Hermes H24", gender:"남성", price:170000, top:["sage"], middle:["greenleaves","rosemary"], base:["cedar"], desc:"메탈릭하고 그린한 모던 남성향" },

  // 입생로랑
  { id:"ysl-lhomme", brand:"입생로랑", name:"이 롬므", en:"Yves Saint Laurent L'Homme", gender:"남성", price:140000, top:["ginger","bergamot"], middle:["basil","pepper"], base:["cedar","vetiver","tonka"], desc:"진저와 우디의 깔끔하고 세련된 남성향" },

  // 크리드
  { id:"creed-aventusforher", brand:"크리드", name:"어벤투스 포 허", en:"Creed Aventus for Her", gender:"여성", price:480000, top:["apple","bergamot"], middle:["rose","violet"], base:["sandalwood","musk","amber"], desc:"어벤투스의 여성 버전, 상큼하고 당당한 향" },

  // 티에리 뮈글러
  { id:"mugler-aliengoddess", brand:"티에리 뮈글러", name:"에이리언 갓데스", en:"Mugler Alien Goddess", gender:"여성", price:150000, top:["bergamot"], middle:["jasmine"], base:["vanilla"], desc:"자스민과 바닐라의 화사하고 관능적인 향" },

  // 펜할리곤스
  { id:"pen-lordgeorge", brand:"펜할리곤스", name:"더 트래지디 오브 로드 조지", en:"Penhaligon's The Tragedy of Lord George", gender:"남성", price:330000, top:["rum"], middle:["tonka","cinnamon"], base:["amber","sandalwood","cedar"], desc:"브랜디와 통카의 따뜻하고 고급스러운 향" },
);
