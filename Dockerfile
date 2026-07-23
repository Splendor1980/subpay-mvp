FROM node:20

WORKDIR /app

RUN npm install -g pnpm

COPY . .

RUN pnpm install --no-frozen-lockfile

RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "serve"]