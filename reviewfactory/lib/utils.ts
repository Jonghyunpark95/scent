import type { Campaign } from "./types";

// 신청 마감까지 남은 일수 (오늘 자정 기준)
export function daysLeft(endISO: string): number {
  const end = new Date(endISO);
  const now = new Date();
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.round((endDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

export function deadlineLabel(endISO: string): string {
  const d = daysLeft(endISO);
  if (d < 0) return "마감";
  if (d === 0) return "오늘마감";
  if (d === 1) return "내일마감";
  return `${d}일 남음`;
}

export function isClosingSoon(endISO: string): boolean {
  const d = daysLeft(endISO);
  return d >= 0 && d <= 2;
}

export function formatWon(n: number): string {
  return new Intl.NumberFormat("ko-KR").format(n) + "원";
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

// 경쟁률 텍스트 (신청 N / 모집 M)
export function competitionLabel(c: Campaign): string {
  const applied = c.applicant_count ?? 0;
  return `신청 ${applied} / ${c.recruit_count}`;
}

// 추천 매칭 점수 (리뷰노트에 없는 개선 기능):
// 마감 임박·낮은 경쟁률·프리미엄·신규 가중치로 0~100 점수 산출
export function matchScore(c: Campaign): number {
  const applied = c.applicant_count ?? 0;
  const ratio = applied / Math.max(1, c.recruit_count); // 낮을수록 당첨 유리
  const competition = Math.max(0, 1 - Math.min(ratio, 1)); // 0~1
  const d = daysLeft(c.apply_end);
  const urgency = d < 0 ? 0 : Math.max(0, 1 - d / 14); // 마감 가까울수록 ↑
  const premium = c.is_premium ? 1 : 0;
  const value = Math.min(1, c.offer_value / 300000);
  const score =
    competition * 40 + value * 25 + urgency * 20 + premium * 15;
  return Math.round(score);
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
