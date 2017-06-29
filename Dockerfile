FROM node:7.4-onbuild
WORKDIR /
RUN curl "https://cldup.com/RcAmsl9T2Q.gz" > "GraphicsMagick-1.3.20.tar.gz"
RUN tar xzvf "GraphicsMagick-1.3.20.tar.gz"
WORKDIR /GraphicsMagick-1.3.20
RUN ./configure --prefix=/usr/local --with-pic --enable-static --disable-shared && make -j$(nproc) install
RUN gm -version
WORKDIR /usr/src/app
