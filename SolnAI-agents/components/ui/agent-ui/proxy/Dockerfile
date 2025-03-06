FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY autogen-proxy.js .
COPY .env .

EXPOSE 3001

CMD ["node", "autogen-proxy.js"]
