#!/usr/bin/env bash
#
# Builds the upload-ready bundle in deploy/.
#
# The site owner has no Node.js locally, so the built files are committed to git
# and downloaded from GitHub. Run this after ANY change to the site or the API,
# then commit the regenerated deploy/ folder.
#
#   ./scripts/build-deploy.sh
#
# Everything inside deploy/ is what gets uploaded into the Hostinger document
# root ("mabsite"). deploy/ is generated — never edit it by hand.

set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> Building the static site"
npm run build

echo "==> Refreshing deploy/"
rm -rf deploy
mkdir -p deploy

# 1) The exported static site (contents of out/, not the folder itself).
cp -r out/. deploy/

# 2) The PHP API. config.php is intentionally NOT copied: it holds the database
#    password and is created directly on the server from config.sample.php.
cp -r api deploy/api
rm -f deploy/api/config.php
rm -rf deploy/api/.data

# 3) The uploads folder, including its .htaccess execution guard.
mkdir -p deploy/uploads
cp uploads/.htaccess deploy/uploads/.htaccess
touch deploy/uploads/.gitkeep

# 4) A short note so the folder is self-explanatory after download.
cat > deploy/READ-ME-FIRST.txt <<'TXT'
MagicFrames — ready-to-upload website files
===========================================

Upload EVERYTHING inside this folder into your Hostinger document root
(your "mabsite" folder). Do not upload the "deploy" folder itself — only
its contents.

After uploading, two one-time steps are required:

  1. api/config.php   — copy api/config.sample.php to api/config.php and
                        fill in your MySQL database details.
  2. Import the database tables from api/schema.sql using phpMyAdmin.
  3. Create your admin login (see the README on GitHub).

Set the uploads/ folder permissions to 755 so photos can be saved.

IMPORTANT: make sure hidden files (names starting with a dot, like
.htaccess) are visible in your file manager and get uploaded too. They
contain security rules.

Full instructions: DEPLOY.md in the GitHub repository.
TXT

echo "==> Done. deploy/ contains $(find deploy -type f | wc -l | tr -d ' ') files."
