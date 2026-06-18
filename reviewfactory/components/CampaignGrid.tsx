import type { Campaign } from "@/lib/types";
import CampaignCard from "./CampaignCard";

export default function CampaignGrid({
  campaigns,
  favoritedIds,
}: {
  campaigns: Campaign[];
  favoritedIds?: Set<string>;
}) {
  if (campaigns.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 py-20 text-center text-gray-400">
        조건에 맞는 체험단이 없어요. 필터를 바꿔보세요.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {campaigns.map((c) => (
        <CampaignCard key={c.id} campaign={c} favorited={favoritedIds?.has(c.id)} />
      ))}
    </div>
  );
}
