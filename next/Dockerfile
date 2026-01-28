FROM node:20

WORKDIR /app

# Installation des dépendances uniquement (le code est monté en volume)
COPY package*.json ./
RUN npm install


COPY prisma ./prisma
RUN npx prisma generate
      

EXPOSE 3000

CMD ["npm", "run", "dev"]
