#!/bin/sh

here=$(dirname $(readlink -f "$0"))
csvdir="${here}/../data/csv"

python="${PYTHON}"
if [ -z "${python}" ]; then
  python=python
fi

mkdir -p "${csvdir}"

"${python}" ${here}/genData.py -s 0 -c 10 -r 100 > "${csvdir}/expert-banana.csv"
"${python}" ${here}/genData.py -s 0 -c 10 -r 100 -e 0,3,5 > "${csvdir}/placid-yarn.csv"
