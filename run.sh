#!/usr/bin/env bash
#
# download the latest unicode data files
#

set -o errexit
set -o pipefail
set -o nounset

echo "INFO: run starting at $(date -u +%Y-%m-%dT%H:%M:%SZ)"

if [ ! -d "./output" ]; then
	echo "INFO: creating output directory ./output"
	mkdir -p ./output
fi

if [ ! -d "./node_modules" ]; then
	echo "INFO: installing npm dependencies"
	npm install
fi


npx tsc
node dist/main.js

echo "INFO: run complete at $(date -u +%Y-%m-%dT%H:%M:%SZ)"
