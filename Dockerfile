# WY 个人网站 · 云托管部署镜像
# 两阶段：先构建前端 dist，再装 server 生产依赖运行
# 密钥（.env）通过云托管控制台的服务环境变量注入，绝不打进镜像

# ---------- 阶段一：构建前端（需要 devDependencies 里的 vite） ----------
FROM node:20-alpine AS webbuild
WORKDIR /build
COPY web/package.json web/package-lock.json ./
RUN npm install
COPY web/ ./
RUN npm run build

# ---------- 阶段二：运行 ----------
FROM node:20-alpine
WORKDIR /app
COPY server/package.json server/package-lock.json ./
RUN npm install --omit=dev
COPY server/ ./
# 前端产物放到 server 代码的相对路径能找到的位置：
# server/src/index.js 解析 ../../web/dist → /app/web/dist
COPY --from=webbuild /build/dist ./web/dist

ENV PORT=3001
ENV NODE_ENV=production
# COPY server/ ./ 平铺后 __dirname=/app/src，相对路径 ../../web/dist 会解析到 /web/dist（错误）
# DIST_DIR 显式指向产物实际位置
ENV DIST_DIR=/app/web/dist
EXPOSE 3001
CMD ["node", "src/index.js"]
