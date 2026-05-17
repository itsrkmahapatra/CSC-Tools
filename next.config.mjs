/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/CSC-Tools',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
