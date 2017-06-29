FROM node:7.4-onbuild
RUN apt-get update
RUN apt-get install -y \
  curl \
  screen \
  tar
# RUN apt-get install -y \
#   graphicsmagick \
#   imagemagick
RUN curl "https://cldup.com/RcAmsl9T2Q.gz" > "GraphicsMagick-1.3.20.tar.gz"
RUN tar xzvf "GraphicsMagick-1.3.20.tar.gz"
RUN pushd GraphicsMagick-1.3.20 && ./configure --prefix=$HOME --with-pic --enable-static --disable-shared && make install
RUN export LIBRARY_PATH="$HOME/lib"
RUN export PATH="`npm bin`:`npm bin -g`:$HOME/bin:$PATH"
RUN GraphicsMagick-config --version
RUN popd
RUN npm install -g ngrok
