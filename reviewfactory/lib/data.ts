import { createClient } from "./supabase/server";
import { SAMPLE_CAMPAIGNS, SAMPLE_POSTS } from "./sampleData";
import type { Campaign, CommunityPost } from "./types";
import { daysLeft, matchScore } from "./utils";

export type SortKey = "match" | "latest" | "deadline" | "popular";

export interface CampaignFilter {
  q?: string;
  type?: string;
  category?: string;
  channel?: string;
  region?: string;
  sort?: SortKey;
  includeClosed?: boolean;
}

// 샘플/DB 공통으로 적용하는 필터 + 정렬 (MVP 규모에선 메모리 처리로 충분)
function applyFilter(list: Campaign[], f: CampaignFilter): Campaign[] {
  let out = [...list];

  if (!f.includeClosed) {
    out = out.filter((c) => c.status === "open" && daysLeft(c.apply_end) >= 0);
  }
  if (f.q) {
    const q = f.q.toLowerCase();
    out = out.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.offer.toLowerCase().includes(q) ||
        c.keywords.some((k) => k.toLowerCase().includes(q))
    );
  }
  if (f.type) out = out.filter((c) => c.type === f.type);
  if (f.category) out = out.filter((c) => c.category === f.category);
  if (f.region && f.region !== "전국")
    out = out.filter((c) => c.region === f.region || c.region === "전국");
  if (f.channel)
    out = out.filter((c) => c.channels.includes(f.channel as Campaign["channels"][number]));

  switch (f.sort) {
    case "latest":
      out.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
      break;
    case "deadline":
      out.sort((a, b) => daysLeft(a.apply_end) - daysLeft(b.apply_end));
      break;
    case "popular":
      out.sort(
        (a, b) => (b.applicant_count ?? 0) - (a.applicant_count ?? 0)
      );
      break;
    case "match":
    default:
      out.sort((a, b) => matchScore(b) - matchScore(a));
      break;
  }
  return out;
}

export async function getCampaigns(
  filter: CampaignFilter = {}
): Promise<{ campaigns: Campaign[]; usingSample: boolean }> {
  const supabase = await createClient();
  if (!supabase) {
    return { campaigns: applyFilter(SAMPLE_CAMPAIGNS, filter), usingSample: true };
  }
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error || !data || data.length === 0) {
    return { campaigns: applyFilter(SAMPLE_CAMPAIGNS, filter), usingSample: true };
  }
  return { campaigns: applyFilter(data as Campaign[], filter), usingSample: false };
}

// 홈 섹션용 그룹
export async function getHomeSections() {
  const { campaigns, usingSample } = await getCampaigns({ sort: "latest" });
  const open = campaigns;
  return {
    usingSample,
    premium: open.filter((c) => c.is_premium).slice(0, 8),
    popular: [...open].sort((a, b) => (b.applicant_count ?? 0) - (a.applicant_count ?? 0)).slice(0, 8),
    closing: [...open].sort((a, b) => daysLeft(a.apply_end) - daysLeft(b.apply_end)).slice(0, 8),
    fresh: [...open].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)).slice(0, 8),
  };
}

export async function getCampaign(
  id: string
): Promise<{ campaign: Campaign | null; usingSample: boolean }> {
  const supabase = await createClient();
  if (!supabase) {
    return {
      campaign: SAMPLE_CAMPAIGNS.find((c) => c.id === id) ?? null,
      usingSample: true,
    };
  }
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return {
      campaign: SAMPLE_CAMPAIGNS.find((c) => c.id === id) ?? null,
      usingSample: true,
    };
  }
  return { campaign: data as Campaign, usingSample: false };
}

export async function getCommunityPosts(): Promise<{
  posts: CommunityPost[];
  usingSample: boolean;
}> {
  const supabase = await createClient();
  if (!supabase) return { posts: SAMPLE_POSTS, usingSample: true };

  const { data, error } = await supabase
    .from("community_posts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !data || data.length === 0)
    return { posts: SAMPLE_POSTS, usingSample: true };
  return { posts: data as CommunityPost[], usingSample: false };
}
