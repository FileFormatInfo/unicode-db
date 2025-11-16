#!/usr/bin/env bash
#
# download the latest unicode data files
#

set -o errexit
set -o pipefail
set -o nounset


echo "INFO: run starting at $(date -u +%Y-%m-%dT%H:%M:%SZ)"

npx tsc
node dist/main.js

echo "INFO: run complete at $(date -u +%Y-%m-%dT%H:%M:%SZ)"