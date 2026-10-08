import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api-inference.huggingface.co',
      },
    ],
  },
};

export default nextConfig;
