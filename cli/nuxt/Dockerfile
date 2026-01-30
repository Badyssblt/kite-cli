FROM node:20

WORKDIR /app

# Installation des dépendances uniquement (le code est monté en volume)
COPY package*.json ./
RUN npm install




EXPOSE 3000

ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=3000

CMD ["npm", "run", "dev"]
