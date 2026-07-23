FROM node:20

WORKDIR /app

RUN npm install -g pnpm

COPY package*.json pnpm-lock.yaml* ./
COPY pnpm-workspace.yaml* ./

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm --filter @workspace/subpay build

EXPOSE 3000

CMD ["pnpm", "--filter", "@workspace/subpay", "serve"]
