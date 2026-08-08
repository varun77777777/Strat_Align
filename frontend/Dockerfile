# Stage 1: Build static bundle
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve static files with Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
# Copy custom nginx configuration if desired, or use default routing
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
