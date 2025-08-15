# ------------ Build stage ------------
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Vite: set mode=production; CRA: npm run build is fine
RUN npm run build

# ------------ Runtime stage (nginx) ------------
FROM nginx:1.27-alpine

# Security best practices
RUN addgroup -S web && adduser -S web -G web

# Nginx conf
COPY infra/nginx.conf /etc/nginx/nginx.conf

# Copy static build (Vite=>/dist, CRA=>/build)
COPY --from=build /app/dist /usr/share/nginx/html

# Permissions
RUN chown -R web:web /usr/share/nginx/html

USER web
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
