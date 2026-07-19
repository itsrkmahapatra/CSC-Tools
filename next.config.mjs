/** @type {import('next').NextConfig} */
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const nextConfig = {
  output: 'export',
  basePath: '/Docuvate',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  transpilePackages: ['upscaler', '@tensorflow/tfjs', '@imgly/background-removal'],
  turbopack: {
    resolveAlias: {
      '@': './src',
    },
  },
  webpack: (config, { isServer }) => {
    config.resolve.alias['@'] = resolve(__dirname, 'src');
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
