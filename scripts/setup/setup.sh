#!/bin/bash
set -e

# 1. Install Docker if missing
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

  echo ""
  echo "Docker installed successfully."
  echo "IMPORTANT: Open Docker Desktop and wait for it to show 'Running' before continuing."
  echo "Then re-run this script."
  exit 0
fi

# 2. Create .env if missing
if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example — edit it with your credentials."
else
  echo ".env already exists, skipping."
fi

# 3. Start Docker Desktop if not running
if ! docker ps &> /dev/null; then
  echo "Starting Docker Desktop..."
  if [[ "$OSTYPE" == "darwin"* ]]; then
    open -a Docker
  else
    docker desktop start 2>/dev/null || true
  fi

  echo "Waiting for Docker to be ready..."
  retries=0
  until docker ps &> /dev/null || [ $retries -ge 30 ]; do
    sleep 2
    retries=$((retries + 1))
    printf "."
  done
  echo ""

  if ! docker ps &> /dev/null; then
    echo "Docker did not start in time. Please start Docker Desktop manually and re-run this script."
    exit 1
  fi
fi
echo "Docker is running."

# 4. Start containers
echo "Starting database container..."
docker compose up -d

# 5. Wait for Postgres to accept connections
echo "Waiting for database to be ready..."
retries=0
until docker compose exec db pg_isready -U postgres &> /dev/null || [ $retries -ge 15 ]; do
  sleep 2
  retries=$((retries + 1))
  printf "."
done
echo ""

if [ $retries -ge 15 ]; then
  echo "Database did not become ready in time. Check logs with: docker compose logs db"
  exit 1
fi
echo "Database is ready."
