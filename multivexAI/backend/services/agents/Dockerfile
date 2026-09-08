FROM node:20-alpine

WORKDIR /app/services/agents

COPY services/agents/package*.json ./
COPY shared/package*.json /app/shared/
RUN npm install && cd /app/shared && npm install

COPY services/agents/ ./
COPY shared/ /app/shared/

EXPOSE 8003

CMD [ "npm", "start" ]
