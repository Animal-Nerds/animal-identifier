#!/bin/bash
set -e

if ! command -v docker &> /dev/null; then
  echo "Docker is not installed. Attempting to install..."

  if [[ "$OSTYPE" == "darwin"* ]]; then
    if command -v brew &> /dev/null; then
      brew install --cask docker
    else
      echo "Homebrew is not installed. Install it from https://brew.sh then re-run this script."
      exit 1
    fi
  elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    if command -v apt-get &> /dev/null; then
      sudo apt-get update && sudo apt-get install -y docker.io docker-compose-plugin
      sudo systemctl start docker
      sudo usermod -aG docker "$USER"
      echo "You may need to log out and back in for Docker permissions to take effect."
    else
      echo "Could not auto-install Docker. Install it from https://docs.docker.com/get-docker/"
      exit 1
    fi
  else
    echo "Could not auto-install Docker. Install it from https://docs.docker.com/get-docker/"
    exit 1
  fi

  echo "Docker installed successfully."
  echo ""
  echo "IMPORTANT: Open Docker Desktop and wait for it to show 'Running' before continuing."
  echo "Then re-run this script."
  exit 0
fi

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example — edit it with your credentials."
else
  echo ".env already exists, skipping."
fi

docker compose up -d
echo "Database is running! Use 'docker ps' to verify."
