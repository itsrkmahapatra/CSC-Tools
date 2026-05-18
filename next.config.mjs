/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/CSC-Tools',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  transpilePackages: ['upscaler', '@tensorflow/tfjs', '@imgly/background-removal'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('onnxruntime-node');
    }
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: 'javascript/auto',
    });
    return config;
  },
};

export default nextConfig;
