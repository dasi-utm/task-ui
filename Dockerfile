FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM deps AS build
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
ARG VITE_SIGNALR_URL
ENV VITE_SIGNALR_URL=$VITE_SIGNALR_URL
RUN npm run build

FROM node:20-alpine AS gateway
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY server/ ./server/
EXPOSE 3004
CMD ["node_modules/.bin/tsx", "server/gateway.ts"]

FROM nginx:alpine AS production
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
