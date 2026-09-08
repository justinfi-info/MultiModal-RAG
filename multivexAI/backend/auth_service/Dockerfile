FROM node:18-alpine

WORKDIR /app

COPY package.json .
COPY index.js .

RUN npm install express

EXPOSE 8001

CMD ["node", "index.js"]
