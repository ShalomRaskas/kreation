#!/bin/bash
# deploy-v2.sh — deploys updated agent-edit logic to the VPS
# Changes: Whisper-gap pause detection, MediaPipe face detection, Gemini removed
# Usage: bash deploy-v2.sh

set -e
SERVER="root@165.227.186.223"
SERVER_DIR="/root/kreation-video-server"

echo "==> Backing up server.js…"
ssh $SERVER "cp ${SERVER_DIR}/server.js ${SERVER_DIR}/server.js.bak.$(date +%Y%m%d%H%M%S)"

echo "==> Copying face_detect.py to server…"
scp face_detect.py ${SERVER}:${SERVER_DIR}/face_detect.py

echo "==> Installing Python deps (mediapipe + opencv-headless)…"
ssh $SERVER "pip3 install --quiet mediapipe opencv-python-headless 2>&1 | tail -5"

echo "==> Verifying MediaPipe install…"
ssh $SERVER "python3 -c 'import mediapipe, cv2; print(\"mediapipe\", mediapipe.__version__, \"cv2\", cv2.__version__)'"

echo "==> Patching server.js — replacing old agent-edit section…"
ssh $SERVER "cat > /tmp/patch_server.js << 'ENDPATCHER'
const fs   = require('fs')
const path = require('path')

const serverPath = '${SERVER_DIR}/server.js'
let code = fs.readFileSync(serverPath, 'utf8')

// Find the start of the old agent-edit block
const START_MARKER = '// \u2500\u2500\u2500 Agent Edit helpers'
const startIdx = code.indexOf(START_MARKER)
if (startIdx === -1) {
  console.error('ERROR: could not find agent-edit start marker in server.js')
  process.exit(1)
}

// Find app.listen (last occurrence) — new code goes just before it
const listenMatch = code.lastIndexOf('\napp.listen(')
if (listenMatch === -1) {
  console.error('ERROR: could not find app.listen in server.js')
  process.exit(1)
}

const before = code.slice(0, startIdx)
const after  = code.slice(listenMatch)
const newCode = fs.readFileSync('/tmp/agent_edit_v2.js', 'utf8')

fs.writeFileSync(serverPath, before + newCode + after)
console.log('server.js patched successfully')
ENDPATCHER
"

echo "==> Copying new agent-edit code to server…"
scp agent-edit-patch.js ${SERVER}:/tmp/agent_edit_v2.js

echo "==> Running patcher…"
ssh $SERVER "cd ${SERVER_DIR} && node /tmp/patch_server.js"

echo "==> Restarting server…"
ssh $SERVER "cd ${SERVER_DIR} && pm2 restart kreation-video"

echo "==> Waiting for startup…"
sleep 3

echo "==> Server status + last 20 log lines:"
ssh $SERVER "pm2 status && pm2 logs kreation-video --lines 20 --nostream"

echo ""
echo "Done. Test with a short video — face detection adds ~5-15s per minute of footage."
