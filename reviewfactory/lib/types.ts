// 리뷰팩토리 도메인 타입 정의 (Supabase 스키마와 1:1 대응)

export type CampaignType = "visit" | "delivery" | "payback" | "press";
export type Channel = "blog" | "instagram" | "youtube" | "reels" | "clip" | "tiktok";
export type CampaignStatus = "draft" | "open" | "closed" | "done";
export type ApplicationStatus = "applied" | "selected" | "rejected" | "completed";
export type UserRole = "reviewer" | "advertiser" | "admin";

export const CAMPAIGN_TYPE_LABEL: Record<CampaignType, string> = {
  visit: "방문형",
  delivery: "배송형",
  payback: "페이백",
  press: "기자단",
};

export const CHANNEL_LABEL: Record<Channel, string> = {
  blog: "블로그",
  instagram: "인스타그램",
  youtube: "유튜브",
  reels: "릴스",
  clip: "클립",
  tiktok: "틱톡",
};

export const CATEGORIES = [
  "맛집",
  "뷰티",
  "패션",
  "여행/숙박",
  "식품",
  "생활/리빙",
  "디지털/가전",
  "유아동",
  "반려동물",
  "문화/클래스",
  "스포츠/레저",
  "기타",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const REGIONS = [
  "전국",
  "서울",
  "경기",
  "인천",
  "부산",
  "대구",
  "대전",
  "광주",
  "울산",
  "세종",
  "강원",
  "충북",
  "충남",
  "전북",
  "전남",
  "경북",
  "경남",
  "제주",
] as const;
export type Region = (typeof REGIONS)[number];

export interface Profile {
  id: string;
  role: UserRole;
  nickname: string | null;
  avatar_url: string | null;
  phone: string | null;
  blog_url: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
  company_name: string | null; // 광고주 상호
  point: number;
  created_at: string;
}

export interface Campaign {
  id: string;
  advertiser_id: string | null;
  title: string;
  type: CampaignType;
  category: Category;
  channels: Channel[];
  region: Region;
  thumbnail_url: string | null;
  images: string[];
  // 제공 내역 (예: "10만원 상당 디너 코스 2인")
  offer: string;
  // 제공 포인트/페이백 금액 (원)
  reward_point: number;
  // 체험 가치(원) - 카드에 "100,000원 상당" 노출용
  offer_value: number;
  description: string;
  // 리뷰 미션 (글자수/사진수/키워드 등)
  mission: string;
  keywords: string[];
  recruit_count: number;
  apply_start: string; // ISO date
  apply_end: string; // ISO date - 신청 마감
  announce_at: string; // 발표일
  review_end: string; // 리뷰 마감
  address: string | null;
  status: CampaignStatus;
  is_premium: boolean;
  view_count: number;
  // 집계 필드(서버에서 채워짐)
  applicant_count?: number;
  favorite_count?: number;
  created_at: string;
}

export interface Application {
  id: string;
  campaign_id: string;
  reviewer_id: string;
  status: ApplicationStatus;
  message: string | null;
  review_url: string | null;
  created_at: string;
  campaign?: Campaign;
}

export interface Favorite {
  id: string;
  user_id: string;
  campaign_id: string;
  created_at: string;
}

export interface CommunityPost {
  id: string;
  author_id: string | null;
  author_nickname: string;
  category: string;
  title: string;
  content: string;
  view_count: number;
  comment_count: number;
  created_at: string;
}
