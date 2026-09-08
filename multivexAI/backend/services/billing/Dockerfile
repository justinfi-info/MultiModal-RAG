FROM node:20-alpine

WORKDIR /app/services/billing

COPY services/billing/package*.json ./
RUN npm install

COPY services/billing/ ./

EXPOSE 8004

CMD [ "npm", "start" ]
