FROM node:7.4-onbuild
RUN apt-get update && apt-get install -y \
   graphicsmagick \
   imagemagick
