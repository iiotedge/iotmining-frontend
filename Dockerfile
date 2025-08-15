# ------------ Build stage ------------
FROM node:20-alpine AS build
WORKDIR /app

# Accept CI/build-time flags (from workflow)
ARG CI=false
ARG DISABLE_ESLINT_PLUGIN=false
ARG NPM_CONFIG_AUDIT=false
ARG NPM_CONFIG_FUND=false

# Optional: forward Vite build-time args (if you use them)
ARG VITE_API_BASE
ARG VITE_BASE
ARG SENTRY_DSN

# Expose as env so scripts can read them
ENV CI=$CI \
    DISABLE_ESLINT_PLUGIN=$DISABLE_ESLINT_PLUGIN \
    NPM_CONFIG_AUDIT=$NPM_CONFIG_AUDIT \
    NPM_CONFIG_FUND=$NPM_CONFIG_FUND \
    VITE_API_BASE=$VITE_API_BASE \
    VITE_BASE=$VITE_BASE \
    SENTRY_DSN=$SENTRY_DSN

COPY package*.json ./
# Speed up CI & avoid audit/fund noise
RUN npm ci --no-audit --fund=false

COPY . .
# CRA: this will skip ESLint in CI when env above are set
RUN npm run build

# # ------------ Build stage ------------
# FROM node:20-alpine AS build
# WORKDIR /app
# COPY package*.json ./
# RUN npm ci
# COPY . .
# # Vite: set mode=production; CRA: npm run build is fine
# RUN npm run build

# # ------------ Runtime stage (nginx) ------------
# FROM nginx:1.27-alpine

# # Security best practices
# RUN addgroup -S web && adduser -S web -G web

# # Nginx conf
# COPY infra/nginx.conf /etc/nginx/nginx.conf

# # Copy static build (Vite=>/dist, CRA=>/build)
# COPY --from=build /app/dist /usr/share/nginx/html

# # Permissions
# RUN chown -R web:web /usr/share/nginx/html

# USER web
# EXPOSE 80
# CMD ["nginx", "-g", "daemon off;"]
