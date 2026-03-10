if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "Docker is not installed. Attempting to install..."

    if (Get-Command winget -ErrorAction SilentlyContinue) {
        winget install Docker.DockerDesktop --accept-package-agreements --accept-source-agreements
    } else {
        Write-Host "winget is not available. Install Docker Desktop from https://docs.docker.com/get-docker/"
        exit 1
    }

    Write-Host ""
    Write-Host "Docker installed successfully."
    Write-Host "IMPORTANT: Close your terminal and/or VSCode, then re-run this script."
    exit 0
}

if (-not (Test-Path .env)) {
    Copy-Item .env.example .env
    Write-Host "Created .env from .env.example - edit it with your credentials."
} else {
    Write-Host ".env already exists, skipping."
}

docker desktop start
docker compose up -d
Write-Host "Database is running! Use 'docker ps' to verify."