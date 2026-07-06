#!/bin/bash
set -e

APP_DIR="/opt/popviewers"
RELEASE_DIR="$APP_DIR/releases"
CURRENT_DIR="$APP_DIR/current"
VENV_DIR="$APP_DIR/venv"

ARTIFACT_BUCKET="popviewers-prod-deployments-003107248390"
ARTIFACT_KEY="backend/latest/backend.tar.gz"

sudo mkdir -p "$APP_DIR" "$RELEASE_DIR"

TIMESTAMP=$(date +%Y%m%d%H%M%S)
NEW_RELEASE="$RELEASE_DIR/$TIMESTAMP"

sudo mkdir -p "$NEW_RELEASE"

echo "Downloading backend artifact..."
aws s3 cp "s3://$ARTIFACT_BUCKET/$ARTIFACT_KEY" "/tmp/backend.tar.gz" --region us-east-1

echo "Extracting backend artifact..."
sudo tar -xzf /tmp/backend.tar.gz -C "$NEW_RELEASE"

echo "Preparing virtual environment..."
if [ ! -d "$VENV_DIR" ]; then
  sudo python3 -m venv "$VENV_DIR"
fi

sudo "$VENV_DIR/bin/pip" install --upgrade pip
sudo "$VENV_DIR/bin/pip" install -r "$NEW_RELEASE/backend/requirements.txt"

echo "Pointing current release to latest..."
sudo ln -sfn "$NEW_RELEASE/backend" "$CURRENT_DIR"

echo "Restarting backend service..."
sudo systemctl restart popviewers-backend

echo "Restarting nginx..."
sudo systemctl restart nginx

echo "Backend deployed successfully: $TIMESTAMP"