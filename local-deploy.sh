#!/usr/bin/env bash
#
# deploy the files to the local source repo
#

set -o errexit
set -o pipefail
set -o nounset

echo "INFO: local deploy starting at $(date -u +%Y-%m-%dT%H:%M:%SZ)"

ORIG_DIR=./output
if [ ! -d "${ORIG_DIR}" ]; then
    echo "ERROR: output files not created in ${ORIG_DIR}"
	exit 1
fi

DEST_DIR=~/workspace/ff/www.fileformat.info/src/main/java/org/unicode
if [ ! -d "${ORIG_DIR}" ]; then
	echo "ERROR: destination directory not found ${DEST_DIR}"
	exit 2
fi


gzip \
	--stdout \
	"${ORIG_DIR}/ucd-lines.json" \
	> "${DEST_DIR}/ucd-lines.json.gz"

cp -p "${ORIG_DIR}/Unihan.txt.gz" "${DEST_DIR}/Unihan.txt.gz"

echo "INFO: local deploy complete at $(date -u +%Y-%m-%dT%H:%M:%SZ)"
