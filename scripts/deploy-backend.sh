#!/bin/bash
set -e

APP_DIR="/opt/popviewers"
RELEASE_DIR="/opt/popviewers/releases"
CURRENT_DIR="/opt/popviewers/current"
ARTIFACT_BUCKET="popviewers-prod-deployments-003107248390"
ARTIFACT_KEY="backend/latest/backend.tar.gz"

sudo mkdir -p "$APP_DIR" "$RELEASE_DIR"

TIMESTAMP=$(date +%Y%m%d%H%M%S)
NEW_RELEASE="$RELEASE_DIR/$TIMESTAMP"

sudo mkdir -p "$NEW_RELEASE"

aws s3 cp "s3://$ARTIFACT_BUCKET/$ARTIFACT_KEY" "/tmp/backend.tar.gz" --region us-east-1

sudo tar -xzf /tmp/backend.tar.gz -C "$NEW_RELEASE"

cd "$NEW_RELEASE/backend"

sudo python3 -m venv venv
sudo ./venv/bin/pip install --upgrade pip
sudo ./venv/bin/pip install -r requirements.txt

sudo ln -sfn "$NEW_RELEASE/backend" "$CURRENT_DIR"

sudo systemctl restart popviewers-backend
sudo systemctl restart nginx

echo "Backend deployed successfully: $TIMESTAMP"