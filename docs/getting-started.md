# Getting Started

A step-by-step guide to setting up the Animal Identifier project on your machine.

## Step 1: Clone the repository

```sh
git clone https://github.com/Animal-Nerds/animal-identifier.git
cd animal-identifier
```

## Step 2: Install Node.js

You need Node.js v18 or higher. Check if you have it:

```sh
node --version
```

If not installed, download it from [nodejs.org](https://nodejs.org/) or use a version manager:

**Mac (Homebrew):**

```sh
brew install node
```

**Windows (winget):**

```powershell
winget install OpenJS.NodeJS.LTS
```

## Step 3: Install project dependencies

```sh
npm install
```

This installs all the JavaScript/TypeScript packages the project needs.

## Step 4: Run the setup script

The setup script handles everything automatically:

**Mac / Linux:**

```sh
./scripts/setup/setup.sh
```

**Windows (PowerShell):**

```powershell
.\scripts\setup\setup.ps1
```

The script will:

1. **Install Docker Desktop** if you don't have it (via Homebrew on Mac, winget on Windows, apt on Linux)
2. Create `.env` from `.env.example` if it doesn't exist
3. Start a PostgreSQL 16 database container

If Docker was just installed, the script will ask you to **open Docker Desktop** and wait for it to show "Running", then re-run the script.

## Step 5: Customize your environment (optional)

After the script runs, you can edit `.env` to change the default credentials:

```
POSTGRES_USER=name
POSTGRES_PASSWORD=password
POSTGRES_DB=animal_identifier
DATABASE_URL=postgresql://name:password@localhost:5432/animal_identifier
```

- `POSTGRES_USER` — the database username
- `POSTGRES_PASSWORD` — the database password
- `POSTGRES_DB` — the database name
- `DATABASE_URL` — the full connection string your app uses (must match the values above)

If you change any values, restart the database with a fresh start so it picks up the new credentials:

```sh
docker compose down -v
docker compose up -d
```

## Step 6: Verify the database is running

```sh
docker ps
```

You should see a container named `animal-identifier-db` with status "Up":

```
CONTAINER ID   IMAGE         STATUS         PORTS                    NAMES
abc123...      postgres:16   Up 2 minutes   0.0.0.0:5432->5432/tcp   animal-identifier-db
```

## Step 7: Start the dev server

```sh
npm run dev
```

This automatically starts the database (if not already running) and then launches the SvelteKit dev server. Open the URL shown in your terminal (usually http://localhost:5173).

## Troubleshooting

### "Cannot connect to the Docker daemon"

Docker Desktop isn't running. Open Docker Desktop from your Applications folder (Mac) or Start menu (Windows) and wait for it to show "Running".

### "Port 5432 already in use"

Something else is using the Postgres port. Either stop the other service or change the port in `docker-compose.yml`:

```yaml
ports:
  - '5433:5432'  # use 5433 on your machine instead
```

Then update `DATABASE_URL` in your `.env` to match:

```
DATABASE_URL=postgresql://name:password@localhost:5433/animal_identifier
```

### "Permission denied" running setup.sh

Make the script executable:

```sh
chmod +x scripts/setup/setup.sh
```

### Starting fresh

If you need to wipe the database and start over:

```sh
docker compose down -v
docker compose up -d
```

The `-v` flag deletes the data volume so you get a clean database.

## Useful commands

| Command | Description |
|---|---|
| `npm run dev` | Start database + dev server |
| `docker compose up -d` | Start the database only |
| `docker compose down` | Stop the database (keeps data) |
| `docker compose down -v` | Stop and delete all data |
| `docker compose logs db` | View database logs |
| `docker ps` | Check running containers |
