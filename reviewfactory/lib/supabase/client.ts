"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./config";

// 브라우저(클라이언트 컴포넌트)용 Supabase 클라이언트.
// 미설정 시 null 반환 → UI 가 샘플/안내 모드로 동작.
export function createClient() {
  if (!isSupabaseConfigured) return null;
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
