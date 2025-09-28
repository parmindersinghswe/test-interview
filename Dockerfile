# syntax=docker/dockerfile:1

FROM node:20-bookworm-slim AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build
COPY . .
RUN npm run build
RUN mkdir -p dist/server && cp -r dist/public dist/server/public
RUN mkdir -p dist/client && cp -r client/src dist/client/src

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NODE_OPTIONS=--import=tsx

COPY package.json package-lock.json ./
COPY tsconfig.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/client ./client
COPY --from=build /app/shared ./shared
COPY --from=build /app/public ./public
COPY --from=build /app/attached_assets ./attached_assets
RUN mkdir -p uploads

EXPOSE 5000
CMD ["npm", "run", "start"]
