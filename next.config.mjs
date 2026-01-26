import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'r36swiki.com',
      },
    ],
  },
  // Attempting to fix warning by ignoring if I can't find correct key, 
  // but let's try to remove the invalid block first to at least check if build passes. 
  // The User priority is "Resolve Warning AND Error".
  // I will try top level turbopack key.
  turbopack: {
    root: process.cwd(),
  },
};

export default withMDX(config);
