/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // better-sqlite3 是原生模块，必须作为外部依赖由 Node 运行时直接 require，
    // 不能交给 webpack 打包，否则构建/运行会失败。
    serverComponentsExternalPackages: ['better-sqlite3'],
  },
};

export default nextConfig;
