library(devtools)
library(withr)

options(unzip="internal")
withr::with_libpaths(new="./rlib", code=devtools::install_github('d3m-purdue/d3mLm'))
