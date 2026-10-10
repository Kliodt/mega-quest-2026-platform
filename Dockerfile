FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages/shared/package.json packages/shared/
COPY packages/api/package.json packages/api/
COPY packages/web/package.json packages/web/
RUN npm ci
COPY . .
RUN npm run build -w packages/web

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json* ./
COPY packages/shared/package.json packages/shared/
COPY packages/api/package.json packages/api/
COPY packages/web/package.json packages/web/
RUN npm ci --omit=dev
# Данные квеста лежат в `packages/api/src/setup`: загрузчики запускаются в этом же контейнере
COPY packages/shared ./packages/shared
COPY packages/api ./packages/api
COPY --from=build /app/packages/web/dist ./packages/web/dist
USER node
EXPOSE 3000
# node первым процессом: тогда SIGTERM от docker stop доходит до приложения и оно закрывается само
CMD ["node", "--import", "tsx", "packages/api/src/main.ts"]
