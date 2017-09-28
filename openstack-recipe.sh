#!/bin/bash

# Recipe for building the TA3 demo on Ubuntu 16.04:

sudo apt-get -y update
sudo sh -c 'echo "deb http://cran.rstudio.com/bin/linux/ubuntu trusty/" >> /etc/apt/sources.list'
gpg --keyserver keyserver.ubuntu.com --recv-key E084DAB9
gpg -a --export E084DAB9 | sudo apt-key add -
sudo apt-get install -y python2.7
sudo apt-get install -y --allow-unauthenticated r-base
sudo apt-get install -y libssl-dev
sudo apt-get install -y openssl
sudo apt-get install -y libcurl4-openssl-dev

# install R packages
sudo R -e 'install.packages("devtools", repos = "https://cran.rstudio.com")'
sudo R -e 'devtools::install_github("d3m-purdue/d3mLm")'

sudo apt-get install -y virtualenv
sudo apt-get install -y python-pip

sudo apt-get install -y npm
# update the npm version
sudo npm install -g npm

# install nodejs
curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
sudo apt-get install -y nodejs

# install dependencies for the app
sudo apt-get install -y libcairo2-dev libjpeg-dev libgif-dev
sudo apt-get install -y virtualenv

git clone https://github.com/d3m-purdue/d3m-ta3-modeling.git
cd d3m-ta3-modeling
# git checkout tab-interface # this isn't there... has been merged to master

# add 'nobody' user and group so we can run on port 80
sudo addgroup nobody
sudo adduser nobody nobody

# Install the Node dependencies
npm i

# Prepare the Python environment
npm run pythonprep

# Prepare the R environment
# npm run rprep # skip this - packages have already been installed

# Generate the datasets
npm run data:small

# Build the application
npm run build

# Serve the application
npm run serve_d3m
