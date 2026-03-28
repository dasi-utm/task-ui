# Stage 1: Install all dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Stage 2: Build static assets
FROM deps AS builder
COPY . .
ARG VITE_API_URL
ARG VITE_SIGNALR_URL
RUN npm run build

# Stage 3: Production image (nginx)
FROM nginx:1.27-alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
