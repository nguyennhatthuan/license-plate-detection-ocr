FROM node:11-alpine

ENV NODE_ENV production
WORKDIR /usr/src/app

RUN apk update \
    && apk add python \
    && apk add make \
    && apk add gcc g++ \
    && apk add git \
    && apk add cmake \
    && apk add linux-headers

COPY package*.json ./

RUN npm install --production
COPY . .

EXPOSE 8000
CMD [ "npm", "start" ]