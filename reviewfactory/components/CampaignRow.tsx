import Link from "next/link";
import type { Campaign } from "@/lib/types";
import CampaignCard from "./CampaignCard";

export default function CampaignRow({
  title,
  emoji,
  subtitle,
  href,
  campaigns,
}: {
  title: string;
  emoji?: string;
  subtitle?: string;
  href: string;
  campaigns: Campaign[];
}) {
  if (campaigns.length === 0) return null;
  return (
    <section className="container-rf py-8">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-extrabold text-gray-900 sm:text-2xl">
            {emoji && <span>{emoji}</span>}
            {title}
          </h2>
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
        </div>
        <Link href={href} className="shrink-0 text-sm font-semibold text-brand-600 hover:text-brand-700">
          전체보기 →
        </Link>
      </div>

      {/* 모바일: 가로 스크롤 / 데스크탑: 그리드 */}
      <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-4">
        {campaigns.map((c) => (
          <div key={c.id} className="w-[200px] shrink-0 sm:w-auto">
            <CampaignCard campaign={c} />
          </div>
        ))}
      </div>
    </section>
  );
}
