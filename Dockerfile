FROM node:20

WORKDIR /app

RUN npm install -g pnpm

# Копируем из frontend
COPY frontend/package.json frontend/pnpm-lock.yaml* ./

RUN pnpm install --frozen-lockfile

COPY frontend/ ./

RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "serve"]