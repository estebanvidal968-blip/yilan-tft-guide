# 弈览 · 金铲铲 S18 攻略 — 常驻服务器部署镜像（路径 A：零改业务代码）
FROM node:22-slim

ENV NODE_ENV=production
WORKDIR /app

# 依赖先行，利用镜像层缓存
COPY package.json package-lock.json* ./
RUN npm install

# 拷贝源码并生产构建（data/*.opgg.json 已随仓库，无需联网）
COPY . .
RUN npm run build

EXPOSE 3000

# 监听 $PORT（Render/Railway 注入；缺省 3000），便于海外托管零改业务代码
# 点赞/评论等运行时数据写在 /app/data，请用卷挂载保证跨重启持久：
#   docker run -v yilan-data:/app/data -p 3000:3000 yilan
CMD ["sh", "-c", "npx next start -H 0.0.0.0 -p ${PORT:-3000}"]
