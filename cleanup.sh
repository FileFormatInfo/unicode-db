#!/usr/bin/env bash
#
# cleanup all the thngs
#

set -o errexit
set -o pipefail
set -o nounset

echo "INFO: cleanup starting at $(date -u +%Y-%m-%dT%H:%M:%SZ)"

rm -rf tmp
rm -rf output

echo "INFO: cleanup complete at $(date -u +%Y-%m-%dT%H:%M:%SZ)"
