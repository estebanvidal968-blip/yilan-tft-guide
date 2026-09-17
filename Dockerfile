# 弈览 · 金铲铲 S18 攻略 — 常驻服务器部署镜像（路径 A：零改业务代码）
FROM node:22-slim

ENV NODE_ENV=production
WORKDIR /app

# 依赖先行，利用镜像层缓存
# npm 源走国内镜像（大陆服务器直连 registry.npmjs.org 会超时）
COPY package.json package-lock.json* ./
RUN npm config set registry https://registry.npmmirror.com \
  && npm install --ignore-scripts

# 缓存击穿：每次构建传入变化的 CACHEBUST。
# 注意：COPY 层本身按“被拷贝文件的内容校验和”命中缓存（文件真变了就会失效，无需 ARG 干预）；
# 但 CACHEBUST 变化会让下方 build RUN 层强制失效、重新执行 npm run build，
# 双重保险，杜绝“COPY 被误命中 / 构建没重跑 → 部署了但代码没更新”。
ARG CACHEBUST

# 百度统计站点 ID —— 必须在【构建期】注入
# 弈览全站为静态预渲染（Static/SSG），process.env 在 next build 阶段即被内联，
# 因此运行时 docker run -e 传值无效；必须经 build-arg → ENV → next build 这条链路。
# 未设置时 layout.js 自动跳过统计脚本渲染，不影响站点。
ARG NEXT_PUBLIC_BAIDU_TONGJI_ID=""
ENV NEXT_PUBLIC_BAIDU_TONGJI_ID=$NEXT_PUBLIC_BAIDU_TONGJI_ID

# 拷贝源码并生产构建（data/*.opgg.json 已随仓库，无需联网）
COPY . .
RUN echo "CACHEBUST=$CACHEBUST" && npm run build

EXPOSE 3000

# 监听 $PORT（Render/Railway 注入；缺省 3000），便于海外托管零改业务代码
# 点赞/评论等运行时数据写在 /app/data，请用卷挂载保证跨重启持久：
#   docker run -v yilan-data:/app/data -p 3000:3000 yilan
CMD ["sh", "-c", "npx next start -H 0.0.0.0 -p ${PORT:-3000}"]
