/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@planmaker/shared'],
  images: {
    domains: ['localhost', 'via.placeholder.com'],
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: false,
        has: [
          {
            type: 'cookie',
            key: 'accessToken',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
