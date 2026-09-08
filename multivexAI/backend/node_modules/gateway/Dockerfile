FROM node:20-alpine

WORKDIR /app/gateway

COPY gateway/package*.json ./
RUN npm install

COPY gateway/ ./
COPY shared /app/shared
RUN cd /app/shared && npm install

EXPOSE 8000

CMD [ "npm", "start" ]