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
