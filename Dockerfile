# 弈览 · 金铲铲 S18 攻略 — 常驻服务器部署镜像（路径 A：零改业务代码）
FROM node:22-slim

ENV NODE_ENV=production
WORKDIR /app

# 依赖先行，利用镜像层缓存
# npm 源走国内镜像（大陆服务器直连 registry.npmjs.org 会超时）
COPY package.json package-lock.json* ./
RUN npm config set registry https://registry.npmmirror.com \
  && npm install --ignore-scripts

# 缓存击穿：每次构建传入变化的 CACHEBUST，强制 COPY 源码 + npm run build 重新执行，
# 避免 Docker 层缓存复用旧代码导致“部署了但代码没更新”（npm install 层仍被复用，不拖慢）
ARG CACHEBUST
# 拷贝源码并生产构建（data/*.opgg.json 已随仓库，无需联网）
COPY . .
RUN npm run build

EXPOSE 3000

# 监听 $PORT（Render/Railway 注入；缺省 3000），便于海外托管零改业务代码
# 点赞/评论等运行时数据写在 /app/data，请用卷挂载保证跨重启持久：
#   docker run -v yilan-data:/app/data -p 3000:3000 yilan
CMD ["sh", "-c", "npx next start -H 0.0.0.0 -p ${PORT:-3000}"]
