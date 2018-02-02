FROM r-base:3.4.1

# for web
EXPOSE 80

# for connection with TA2
EXPOSE 45042


RUN apt-get update
RUN apt-get install -y git curl sudo python2.7 python2.7-dev python-pip libcairo2-dev  gnupg1 
# (gnupg1 not supported on python:2 base, but needed on r-base)

# add the 'ps' command back
RUN apt-get -y install procps

# Install Node.js 6
# build from python 2 based required removal npm from install line with nodejs below
RUN curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash - \
  && sudo apt-get install -y nodejs npm \
  && sudo npm install -g npm \
  && ln -s /usr/bin/nodejs /usr/local/bin/node

RUN mkdir /d3m-ta3
COPY . /d3m-ta3

WORKDIR /d3m-ta3

# install for stop command in base interpreter
RUN pip install psutil

RUN pip install virtualenv
RUN npm install
RUN npm run pythonprep
RUN npm run protobuf
RUN npm run build

RUN useradd tangelo

ENTRYPOINT npm run serve 

# from NIST - ta3_search for non-interactive shells
RUN echo '#!/bin/bash' > /usr/bin/ta3_search 
RUN echo 'cd /d3m-ta3' >> /usr/bin/ta3_search
RUN echo '/usr/local/bin/npm run serve'  >> /usr/bin/ta3_search
RUN chmod +x /usr/bin/ta3_search

# quit command
RUN echo '#!/usr/bin/python /d3m-ta3/build/ta3_quit.py'  > /usr/bin/ta3_quit
RUN chmod +x /usr/bin/ta3_quit
