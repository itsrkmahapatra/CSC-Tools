/** @type {import('next').NextConfig} */
import path from 'path';

const nextConfig = {
  output: 'export',
  basePath: '/Docuvate',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  transpilePackages: ['upscaler', '@tensorflow/tfjs', '@imgly/background-removal'],
  webpack: (config, { isServer }) => {
    config.resolve.alias['@'] = path.resolve(process.cwd(), 'src');
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

