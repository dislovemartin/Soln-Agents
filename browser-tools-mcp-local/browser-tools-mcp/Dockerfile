FROM node:18-slim

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm install -g typescript
RUN tsc

EXPOSE 3027

CMD ["node", "./dist/mcp-server.js"]