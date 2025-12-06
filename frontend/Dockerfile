FROM node:20-alpine
WORKDIR /app

# Dependencias
COPY package*.json ./
RUN npm ci

# Codigo e configuracoes
COPY tsconfig.json ./
COPY next.config.ts ./
COPY eslint.config.mjs ./
COPY next-env.d.ts ./
COPY public ./public
COPY app ./app
COPY types ./types

# Permite injetar URL da API em tempo de build e runtime
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV PORT=3000

RUN npm run build \
  && npm prune --production

EXPOSE 3000
CMD ["npm", "run", "start"]
