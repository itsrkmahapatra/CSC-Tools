/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/OmniFiles',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
