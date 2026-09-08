FROM node:20-alpine

WORKDIR /app/services/auth

COPY services/auth/package*.json ./
COPY shared/package*.json /app/shared/
RUN npm install && cd /app/shared && npm install

COPY services/auth/ ./
COPY shared/ /app/shared/

EXPOSE 8001

CMD [ "npm", "start" ]
