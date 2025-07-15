# ========================
# Build stage
# ========================
FROM node:18-alpine AS builder

LABEL stage=builder

# Install system dependencies
RUN apk add --no-cache \
	git \
	python3 \
	make \
	g++

# Create user for security
RUN addgroup -g 1001 -S nodejs \
	&& adduser -S nextjs -u 1001 -G nodejs

# Set working directory
WORKDIR /app

# Copy dependencies files
COPY package*.json ./

# Install dependencies with caching
RUN npm ci --only=production --no-audit --no-fund

# Copy source code
COPY --chown=nextjs:nodejs . .

# Build extension
ENV NODE_ENV=production
RUN npm run build

# Create ZIP archive for Chrome Web Store
RUN cd dist && zip -r ../promptab-extension.zip . && cd ..

# ========================
# Production stage (Nginx for static files)
# ========================
FROM nginx:alpine AS production

# Metadata
LABEL maintainer="promptab@example.com"
LABEL version="1.0.0" 
LABEL description="PrompTab Chrome Extension - Production build"

# Install additional packages
RUN apk add --no-cache \
	curl \
	ca-certificates \
	&& rm -rf /var/cache/apk/*

# Copy static files from build stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy ZIP archive
COPY --from=builder /app/promptab-extension.zip /usr/share/nginx/html/

# Copy custom Nginx configuration
COPY docker/nginx/nginx.conf /etc/nginx/nginx.conf

# Create user for Nginx
RUN addgroup -g 101 -S nginx \
	&& adduser -S -D -H -u 101 -h /var/cache/nginx -s /sbin/nologin -G nginx nginx \
	&& chown -R nginx:nginx /usr/share/nginx/html \
	&& chown -R nginx:nginx /var/cache/nginx \
	&& chown -R nginx:nginx /var/log/nginx

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
	CMD curl -f http://localhost:80/health || exit 1

# Switch to nginx user
USER nginx

# Open port
EXPOSE 80

# Start command
CMD ["nginx", "-g", "daemon off;"] 