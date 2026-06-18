import Image from "next/image";
import Link from "next/link";
import type { Campaign } from "@/lib/types";
import { CAMPAIGN_TYPE_LABEL } from "@/lib/types";
import {
  competitionLabel,
  daysLeft,
  deadlineLabel,
  formatWon,
  isClosingSoon,
  matchScore,
} from "@/lib/utils";
import { ChannelIcon, PinIcon, SparkIcon, UsersIcon } from "./icons";
import FavoriteButton from "./FavoriteButton";

const TYPE_STYLE: Record<string, string> = {
  visit: "bg-emerald-50 text-emerald-700",
  delivery: "bg-sky-50 text-sky-700",
  payback: "bg-amber-50 text-amber-700",
  press: "bg-violet-50 text-violet-700",
};

export default function CampaignCard({
  campaign,
  favorited = false,
}: {
  campaign: Campaign;
  favorited?: boolean;
}) {
  const closing = isClosingSoon(campaign.apply_end);
  const score = matchScore(campaign);
  const dleft = daysLeft(campaign.apply_end);

  return (
    <Link
      href={`/campaigns/${campaign.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-brand-100 to-brand-50">
        {campaign.thumbnail_url && (
          <Image
            src={campaign.thumbnail_url}
            alt={campaign.title}
            fill
            sizes="(max-width:768px) 50vw, 280px"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        )}
        <FavoriteButton campaignId={campaign.id} initialFavorited={favorited} />

        {/* 마감 배지 */}
        <span
          className={`badge absolute left-3 top-3 ${
            closing ? "bg-rose-600 text-white" : "bg-black/70 text-white"
          }`}
        >
          {deadlineLabel(campaign.apply_end)}
        </span>

        {campaign.is_premium && (
          <span className="badge absolute bottom-3 left-3 bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow">
            <SparkIcon className="h-3 w-3" /> 프리미엄
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center gap-1.5">
          <span className={`badge ${TYPE_STYLE[campaign.type]}`}>
            {CAMPAIGN_TYPE_LABEL[campaign.type]}
          </span>
          <span className="text-xs text-gray-400">{campaign.category}</span>
          <span className="ml-auto flex items-center gap-1 text-gray-400">
            {campaign.channels.slice(0, 3).map((ch) => (
              <ChannelIcon key={ch} channel={ch} className="h-3.5 w-3.5" />
            ))}
          </span>
        </div>

        <h3 className="line-clamp-2 text-[15px] font-bold leading-snug text-gray-900 group-hover:text-brand-700">
          {campaign.title}
        </h3>

        <p className="line-clamp-1 text-sm text-gray-500">{campaign.offer}</p>

        <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
          <PinIcon className="h-3.5 w-3.5" />
          {campaign.region}
          <span className="mx-1 text-gray-300">·</span>
          <UsersIcon className="h-3.5 w-3.5" />
          {competitionLabel(campaign)}
        </div>

        <div className="mt-auto flex items-end justify-between pt-2">
          <div>
            <div className="text-[11px] text-gray-400">제공 가치</div>
            <div className="text-base font-extrabold text-gray-900">
              {formatWon(campaign.offer_value)}
              {campaign.reward_point > 0 && (
                <span className="ml-1 text-xs font-semibold text-brand-600">
                  +{formatWon(campaign.reward_point)}P
                </span>
              )}
            </div>
          </div>
          {dleft >= 0 && (
            <div className="text-right">
              <div className="text-[11px] text-gray-400">매칭</div>
              <div className="text-sm font-bold text-brand-600">{score}점</div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
