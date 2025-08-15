# ------------ Build stage (Node) ------------
FROM node:20-alpine AS build
WORKDIR /app

# Build-time flags (to keep CRA from failing and quiet npm)
ARG CI=false
ARG DISABLE_ESLINT_PLUGIN=false
ARG NPM_CONFIG_AUDIT=false
ARG NPM_CONFIG_FUND=false
ARG VITE_API_BASE
ARG VITE_BASE
ARG SENTRY_DSN

ENV CI=$CI \
    DISABLE_ESLINT_PLUGIN=$DISABLE_ESLINT_PLUGIN \
    NPM_CONFIG_AUDIT=$NPM_CONFIG_AUDIT \
    NPM_CONFIG_FUND=$NPM_CONFIG_FUND \
    VITE_API_BASE=$VITE_API_BASE \
    VITE_BASE=$VITE_BASE \
    SENTRY_DSN=$SENTRY_DSN

COPY package*.json ./
RUN npm ci --no-audit --fund=false

COPY . .
# Build your SPA (CRA or Vite).
# If CRA: "react-scripts build" is under npm run build
# If Vite: package.json should have "build": "vite build"
RUN npm run build

# ------------ Runtime stage (nginx) ------------
FROM nginx:1.27-alpine

# Minimal SPA config (no external file needed)
# Serves /assets with long cache, falls back to /index.html for SPA routing
RUN rm -f /etc/nginx/conf.d/default.conf && \
    printf 'server {\n\
      listen 80;\n\
      server_name _;\n\
      root /usr/share/nginx/html;\n\
      index index.html;\n\
      location /assets/ {\n\
        expires 1y;\n\
        add_header Cache-Control "public, max-age=31536000, immutable";\n\
        try_files $uri =404;\n\
      }\n\
      location / {\n\
        try_files $uri $uri/ /index.html;\n\
      }\n\
    }\n' > /etc/nginx/conf.d/app.conf

# Copy the static build output
# Vite outputs to /dist ; CRA outputs to /build — pick the right one.
# If you use CRA, change /app/dist to /app/build.
# COPY --from=build /app/dist /usr/share/nginx/html

# If CRA, use this instead of the line above:
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]