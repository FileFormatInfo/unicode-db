#!/usr/bin/env bash
#
# download the latest unicode data files
#

set -o errexit
set -o pipefail
set -o nounset

echo "INFO: extract starting at $(date -u +%Y-%m-%dT%H:%M:%SZ)"

TMP_DIR=./tmp
if [ ! -d "${TMP_DIR}" ]; then
    echo "ERROR: temporary directory ${TMP_DIR} does not exist!"
    exit 1
fi

OUTPUT_DIR=./output
if [ -d "${OUTPUT_DIR}" ]; then
    echo "INFO: using output directory ${OUTPUT_DIR}"
else
    echo "INFO: creating output directory ${OUTPUT_DIR}"
    mkdir -p ${OUTPUT_DIR}
fi

FILES=( Blocks.txt DerivedAge.txt emoji/emoji-data.txt emoji/emoji-variation-sequences.txt EmojiSources.txt Index.txt NamesList.txt NormalizationTest.txt PropList.txt UnicodeData.txt )
for FILE in "${FILES[@]}"
do 
    if [ -f "${OUTPUT_DIR}/$(basename ${FILE})" ]; then
        echo "WARNING: ${FILE} has already been extracted"
    else
        echo "INFO: extracting ${FILE}"
        unzip \
            -b \
            -j \
            -q \
            ${TMP_DIR}/UCD.zip \
            ${FILE} \
            -d ${OUTPUT_DIR}
    fi
done

HAN_FILE=Unihan.txt.gz
if [ -f "${OUTPUT_DIR}/${HAN_FILE}" ]; then
    echo "WARNING: ${HAN_FILE} has already been created"
else
    echo "INFO: creating ${HAN_FILE}"
    unzip -p ${TMP_DIR}/Unihan.zip "Unihan_*" | gzip >${OUTPUT_DIR}/${HAN_FILE}
fi

EMOJI_FILES=( emoji-sequences.txt emoji-zwj-sequences.txt emoji-test.txt )
for EMOJI_FILE in "${EMOJI_FILES[@]}"
do 
    if [ -f "${OUTPUT_DIR}/${EMOJI_FILE}" ]; then
        echo "WARNING: ${FILE} has already been copied"
    else
        echo "INFO: copying ${EMOJI_FILE}"
        cp "${TMP_DIR}/${EMOJI_FILE}" "${OUTPUT_DIR}/${EMOJI_FILE}"
    fi
done

echo "INFO: extract complete at $(date -u +%Y-%m-%dT%H:%M:%SZ)"
