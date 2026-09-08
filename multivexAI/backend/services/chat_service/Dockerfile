FROM node:20-alpine

WORKDIR /app/services/chat_service

COPY services/chat_service/package*.json ./
RUN npm install

COPY services/chat_service/ ./

EXPOSE 8002

CMD [ "npm", "start" ]
