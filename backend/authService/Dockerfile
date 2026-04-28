FROM node:22-alpine
WORKDIR /app
COPY ./package*.json ./
RUN npm install
COPY . .
EXPOSE 1001
CMD ["npm","run","dev"]