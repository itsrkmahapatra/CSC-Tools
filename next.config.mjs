/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/CSC-Tools',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  transpilePackages: ['upscaler', '@tensorflow/tfjs', '@imgly/background-removal'],
};

export default nextConfig;
