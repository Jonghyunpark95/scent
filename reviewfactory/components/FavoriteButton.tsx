"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { HeartIcon } from "./icons";
import { cn } from "@/lib/utils";

export default function FavoriteButton({
  campaignId,
  initialFavorited = false,
  className,
  variant = "icon",
}: {
  campaignId: string;
  initialFavorited?: boolean;
  className?: string;
  variant?: "icon" | "button";
}) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const supabase = createClient();
    if (!supabase) {
      alert("찜 기능은 Supabase 연결 후 사용할 수 있어요.");
      return;
    }
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login?redirect=/campaigns/" + campaignId);
      return;
    }
    const next = !favorited;
    setFavorited(next); // 낙관적 업데이트
    if (next) {
      await supabase.from("favorites").insert({ user_id: user.id, campaign_id: campaignId });
    } else {
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("campaign_id", campaignId);
    }
    setLoading(false);
    router.refresh();
  }

  if (variant === "button") {
    return (
      <button
        onClick={toggle}
        disabled={loading}
        className={cn(
          "btn w-full border",
          favorited
            ? "border-rose-200 bg-rose-50 text-rose-600"
            : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
          className
        )}
      >
        <HeartIcon filled={favorited} className="h-5 w-5" />
        {favorited ? "찜 완료" : "찜하기"}
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-label="찜하기"
      className={cn(
        "absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/90 shadow-card backdrop-blur transition hover:scale-105",
        favorited ? "text-rose-500" : "text-gray-400 hover:text-rose-500",
        className
      )}
    >
      <HeartIcon filled={favorited} className="h-5 w-5" />
    </button>
  );
}
