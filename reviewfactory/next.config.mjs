/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // Supabase Storage 공개 버킷 이미지
      { protocol: "https", hostname: "*.supabase.co" },
      // 데모/샘플용 외부 이미지 (운영 시 제거 가능)
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "picsum.photos" },
    ],
  },
};

export default nextConfig;
