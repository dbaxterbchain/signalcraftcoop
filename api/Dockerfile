FROM node:20-slim AS build

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
COPY prisma.config.ts tsconfig.json tsconfig.build.json ./
COPY src ./src

ENV DATABASE_URL=postgresql://user:password@localhost:5432/signalcraft?schema=public
RUN npm run prisma -- generate
RUN npm run build
RUN npm prune --omit=dev

FROM node:20-slim AS runtime

WORKDIR /app
RUN apt-get update -y \
  && apt-get install -y openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY --from=build /app/dist ./dist
COPY certs ./certs

RUN if [ -f /app/certs/rds-ca.pem ]; then \
    cp /app/certs/rds-ca.pem /usr/local/share/ca-certificates/rds-ca.crt && \
    update-ca-certificates; \
  fi

EXPOSE 3000

CMD ["node", "dist/src/main.js"]
