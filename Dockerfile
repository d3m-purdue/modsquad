FROM r-base:3.4.1

EXPOSE 8080

RUN apt-get update
RUN apt-get install -y git curl sudo python2.7 python2.7-dev gnupg1 python-pip

# Install Node.js 6
RUN curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash - \
  && sudo apt-get install -y nodejs npm \
  && sudo npm install -g npm \
  && ln -s /usr/bin/nodejs /usr/local/bin/node

RUN mkdir /d3m-ta3
COPY . /d3m-ta3

WORKDIR /d3m-ta3

RUN pip install -r requirements.txt
RUN pip install virtualenv
RUN npm install
RUN npm run pythonprep
RUN npm run protobuf
RUN npm run build

ENTRYPOINT npm run serve -- -np --host=0.0.0.0
