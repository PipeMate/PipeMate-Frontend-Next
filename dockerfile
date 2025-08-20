# syntax=docker/dockerfile:1

FROM node:20-alpine AS builder
WORKDIR /app

# 의존성 설치
COPY package*.json ./
RUN npm ci

# 소스 복사 및 빌드 환경 변수 주입
COPY . .
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
RUN npm run build

# 런타임 이미지
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# 런타임에 필요한 파일만 복사
COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["npm", "run", "start"]