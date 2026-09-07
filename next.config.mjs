/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // better-sqlite3 是原生模块，必须作为外部依赖由 Node 运行时直接 require，
    // 不能交给 webpack 打包，否则构建/运行会失败。
    serverComponentsExternalPackages: ['better-sqlite3'],
  },
  // 显式禁用边缘缓存：默认 SSG 页面带 s-maxage=31536000，部署工具的 CDN 边缘会长期
  // 复用旧副本且无法主动 purge，导致改版（新增攻略等）后页面长期停留在旧版本。
  // 这里对内容型路由追加 no-store；与 Next 默认 Cache-Control 合并后 no-store 优先生效。
  // 仅针对内容路由，/_next 静态资源不受影响（仍带长效缓存）。
  async headers() {
    const noStore = [
      {
        key: 'Cache-Control',
        value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    ];
    return [
      { source: '/', headers: noStore },
      { source: '/guides/:path*', headers: noStore },
      { source: '/augments', headers: noStore },
      { source: '/champions', headers: noStore },
      { source: '/items', headers: noStore },
      { source: '/tools', headers: noStore },
      { source: '/trait/:path*', headers: noStore },
      { source: '/comp/:path*', headers: noStore },
    ];
  },
};

export default nextConfig;
