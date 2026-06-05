FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

ARG POKAYA_FRONTEND_BUILD_REV=20260605-generation-timeline
COPY . .
RUN echo "Pokaya frontend build revision: ${POKAYA_FRONTEND_BUILD_REV}"
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
COPY --from=build /app/server.mjs ./server.mjs

EXPOSE 4173
CMD ["node", "server.mjs"]
