import { setupDevPlatform } from '@cloudflare/next-on-pages/next-dev';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'x-custom-header',
            value: 'my custom header value',
          },
        ],
      },
    ];
  },
};

async function setup() {
  if (process.env.NODE_ENV === 'development') {
    await setupDevPlatform();
  }
}

setup();

export default nextConfig;
