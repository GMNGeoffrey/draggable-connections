#!/bin/bash
# Just a little script to concatenate the necessary parts. Copy-paste the output
# into https://chriszarate.github.io/bookmarkleter/ to get an encoded
# bookmarklet.

SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cat "${SCRIPT_DIR}/../draggable-connections.js" "${SCRIPT_DIR}/load-draggable.js" > "${SCRIPT_DIR}/draggable.bookmarklet.js"

if command -v npm 2&> /dev/null && npm list bookmarkleter 2&> /dev/null; then
    cat "${SCRIPT_DIR}/draggable.bookmarklet.js" | node "${SCRIPT_DIR}/bookmarkleter-cli.js" > "${SCRIPT_DIR}/draggable.bookmarklet.encoded.txt"
else
    echo "bookmarkleter not installed. You must generate encoded bookmarklet manually"
fi
