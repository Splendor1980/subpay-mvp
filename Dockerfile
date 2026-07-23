FROM node:20

WORKDIR /app

# Устанавливаем pnpm
RUN npm install -g pnpm

# Копируем конфиги из frontend
COPY frontend/package.json frontend/pnpm-lock.yaml* ./

# Устанавливаем зависимости
RUN pnpm install --frozen-lockfile

# Копируем весь frontend
COPY frontend/ ./

# Билдим
RUN pnpm build

EXPOSE 3000

# Запуск
CMD ["pnpm", "serve"]