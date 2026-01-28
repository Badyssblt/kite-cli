#!/bin/bash

# Create Dockerfile
cat > Dockerfile << 'EOF'
FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install

EXPOSE 3000

ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=3000

CMD ["npm", "run", "dev"]
EOF

# Create docker-compose.yml
cat > docker-compose.yml << 'EOF'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
      - /app/.nuxt
    environment:
      - NODE_ENV=development
    restart: unless-stopped
EOF

# Create .dockerignore
cat > .dockerignore << 'EOF'
node_modules
.nuxt
.output
.git
EOF

echo "✓ Docker installed"
echo "  Commands:"
echo "  - Start: docker compose up -d"
echo "  - Logs: docker compose logs -f"
echo "  - Stop: docker compose down"
