#!/usr/bin/env bash
#
# download the latest unicode data files
#

set -o errexit
set -o pipefail
set -o nounset

echo "INFO: download starting at $(date -u +%Y-%m-%dT%H:%M:%SZ)"

TMP_DIR=./tmp
if [ -d "${TMP_DIR}" ]; then
    echo "INFO: using temporary directory ${TMP_DIR}"
else
    echo "INFO: creating temporary directory ${TMP_DIR}"
    mkdir -p ${TMP_DIR}
fi


FILES=( UCD.zip Unihan.zip )

for FILE in "${FILES[@]}"
do 
    if [ -f "${TMP_DIR}/${FILE}" ]; then
        echo "WARNING: ${FILE} has already been downloaded"
    else
        echo "INFO: downloading ${FILE}"
        curl \
            --silent \
            https://unicode.org/Public/zipped/latest/UCD.zip \
            >${TMP_DIR}/${FILE}
    fi
done

echo "INFO: download complete at $(date -u +%Y-%m-%dT%H:%M:%SZ)"
