/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
  async redirects() {
    return [
      {
        source: '/user-dashboard',
        destination: '/my-bookings',
        permanent: false,
      },
      {
        source: '/user-dashboard/bookings',
        destination: '/my-bookings',
        permanent: false,
      },
      {
        source: '/user-dashboard/profile',
        destination: '/profile',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
