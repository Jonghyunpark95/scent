-- =========================================================================
-- Scentpedia 커뮤니티 스키마
-- Supabase 대시보드 → SQL Editor → 새 쿼리에 붙여넣고 [Run] 하세요. (한 번만)
-- =========================================================================

-- 1) 프로필 (닉네임)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text,
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
drop policy if exists "profiles_read" on public.profiles;
create policy "profiles_read"   on public.profiles for select using (true);
drop policy if exists "profiles_upsert" on public.profiles;
create policy "profiles_upsert" on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update" on public.profiles for update using (auth.uid() = id);

-- 가입 시 프로필 자동 생성 (닉네임 = 메타데이터 or 이메일 앞부분)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles(id, nickname)
  values (new.id, coalesce(new.raw_user_meta_data->>'nickname', split_part(new.email,'@',1)))
  on conflict (id) do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- 2) 구매평 · 별점
create table if not exists public.reviews (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  nickname text,
  perfume_key text not null,
  perfume_name text,
  brand text,
  rating int not null check (rating between 1 and 5),
  body text,
  created_at timestamptz default now()
);
alter table public.reviews enable row level security;
drop policy if exists "reviews_read" on public.reviews;
create policy "reviews_read"   on public.reviews for select using (true);
drop policy if exists "reviews_insert" on public.reviews;
create policy "reviews_insert" on public.reviews for insert with check (auth.uid() = user_id);
drop policy if exists "reviews_update" on public.reviews;
create policy "reviews_update" on public.reviews for update using (auth.uid() = user_id);
drop policy if exists "reviews_delete" on public.reviews;
create policy "reviews_delete" on public.reviews for delete using (auth.uid() = user_id);
create index if not exists reviews_perfume_idx on public.reviews(perfume_key);

-- 3) 게시판 (자유게시판 board='free' / 컬렉션 공유 board='collection')
create table if not exists public.posts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  nickname text,
  board text not null default 'free',
  title text not null,
  body text,
  created_at timestamptz default now()
);
alter table public.posts enable row level security;
drop policy if exists "posts_read" on public.posts;
create policy "posts_read"   on public.posts for select using (true);
drop policy if exists "posts_insert" on public.posts;
create policy "posts_insert" on public.posts for insert with check (auth.uid() = user_id);
drop policy if exists "posts_update" on public.posts;
create policy "posts_update" on public.posts for update using (auth.uid() = user_id);
drop policy if exists "posts_delete" on public.posts;
create policy "posts_delete" on public.posts for delete using (auth.uid() = user_id);

-- 4) 댓글
create table if not exists public.comments (
  id bigint generated always as identity primary key,
  post_id bigint not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  nickname text,
  body text not null,
  created_at timestamptz default now()
);
alter table public.comments enable row level security;
drop policy if exists "comments_read" on public.comments;
create policy "comments_read"   on public.comments for select using (true);
drop policy if exists "comments_insert" on public.comments;
create policy "comments_insert" on public.comments for insert with check (auth.uid() = user_id);
drop policy if exists "comments_delete" on public.comments;
create policy "comments_delete" on public.comments for delete using (auth.uid() = user_id);

-- 5) 향수 캘린더 (날짜별 사용 기록)
create table if not exists public.diary (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  nickname text,
  worn_on date not null,
  perfume_key text,
  perfume_name text,
  brand text,
  memo text,
  is_public boolean default true,
  created_at timestamptz default now()
);
alter table public.diary enable row level security;
drop policy if exists "diary_read" on public.diary;
create policy "diary_read"   on public.diary for select using (is_public or auth.uid() = user_id);
drop policy if exists "diary_insert" on public.diary;
create policy "diary_insert" on public.diary for insert with check (auth.uid() = user_id);
drop policy if exists "diary_update" on public.diary;
create policy "diary_update" on public.diary for update using (auth.uid() = user_id);
drop policy if exists "diary_delete" on public.diary;
create policy "diary_delete" on public.diary for delete using (auth.uid() = user_id);

-- 6) 가격 추이 (매일 크론이 service_role로 기록 → 읽기는 누구나)
create table if not exists public.price_history (
  id bigint generated always as identity primary key,
  perfume_key text not null,
  price int not null,
  collected_on date not null,
  created_at timestamptz default now(),
  unique (perfume_key, collected_on)
);
alter table public.price_history enable row level security;
drop policy if exists "price_read" on public.price_history;
create policy "price_read" on public.price_history for select using (true);
-- 쓰기는 service_role(크론)만 → RLS 우회하므로 insert 정책 불필요

-- 7) 가격 목표가 알림
create table if not exists public.price_alerts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  perfume_key text not null,
  perfume_name text,
  target_price int not null,
  created_at timestamptz default now(),
  unique (user_id, perfume_key)
);
alter table public.price_alerts enable row level security;
drop policy if exists "alerts_rw" on public.price_alerts;
create policy "alerts_rw" on public.price_alerts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 8) 사용자가 시세 추적을 요청한 향수 (매일 크론이 이 목록의 가격을 수집)
--    워치리스트에 추가하거나 상세에서 '시세 추적'을 누르면 여기에 등록됨 (비회원도 가능)
create table if not exists public.tracked_perfumes (
  perfume_key text primary key,
  perfume_name text,
  query text,
  added_at timestamptz default now()
);
alter table public.tracked_perfumes enable row level security;
drop policy if exists "tracked_read" on public.tracked_perfumes;
create policy "tracked_read"   on public.tracked_perfumes for select using (true);
drop policy if exists "tracked_insert" on public.tracked_perfumes;
create policy "tracked_insert" on public.tracked_perfumes for insert with check (true);
drop policy if exists "tracked_update" on public.tracked_perfumes;
create policy "tracked_update" on public.tracked_perfumes for update using (true);

-- 9) 시세 알림 이메일 발송 상태 / 수신 제어 컬럼
--    로그인 유저는 가입 이메일로 발송. 비회원/추가 수신용 email 컬럼도 둔다.
--    muted: 사용자가 끈 알림 / expires_on: 이 날짜 이후 더 이상 발송 안 함
--    last_notified_on: 이번 하락 구간에 발송했는지(재무장용) → 매일 폭탄 방지
alter table public.price_alerts add column if not exists email text;
alter table public.price_alerts add column if not exists last_notified_on date;
alter table public.price_alerts add column if not exists notified_price int;
alter table public.price_alerts add column if not exists muted boolean default false;
alter table public.price_alerts add column if not exists expires_on date;

-- 10) Editor's Pick (관리자가 직접 쓰는 추천 글 / 블로그)
--     읽기: 공개(published=true)만 누구나. 쓰기: 서버(api/editor)가 service_role로만.
create table if not exists public.editor_picks (
  id bigint generated always as identity primary key,
  slug text unique not null,
  title text not null,
  summary text,
  body text,
  image_url text,
  link_url text,
  published boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
-- 이미 테이블이 있던 경우를 위한 컬럼 추가 (외부 블로그 링크)
alter table public.editor_picks add column if not exists link_url text;
alter table public.editor_picks enable row level security;
drop policy if exists "picks_read" on public.editor_picks;
create policy "picks_read" on public.editor_picks for select using (published);
-- 쓰기는 service_role(api/editor)만 → RLS 우회하므로 insert/update 정책 불필요
create index if not exists editor_picks_pub_idx on public.editor_picks(published, created_at desc);

-- 11) Editor's Pick 이미지 저장용 공개 스토리지 버킷
insert into storage.buckets (id, name, public)
values ('editor', 'editor', true)
on conflict (id) do update set public = true;

-- 12) 나만의 향수장 (보유/위시리스트)
--     status: 'owned'(보유) | 'wish'(위시리스트)
create table if not exists public.collections (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  perfume_key text not null,
  perfume_name text,
  brand text,
  status text not null default 'owned',
  created_at timestamptz default now(),
  unique (user_id, perfume_key)
);
alter table public.collections enable row level security;
drop policy if exists "collections_rw" on public.collections;
create policy "collections_rw" on public.collections for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists collections_user_idx on public.collections(user_id, status);
