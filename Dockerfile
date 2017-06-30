FROM node:7.4-onbuild
RUN apt-get update && apt-get install -y \
   graphicsmagick \
   imagemagick
WORKDIR /
RUN git clone https://github.com/ifreecarve/macramoji.git
WORKDIR /macramoji
RUN npm install && npm run coverage
WORKDIR /usr/src/app
