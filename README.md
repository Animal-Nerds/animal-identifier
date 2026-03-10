# Animal Identifier

## Engineering Constitution

Project delivery follows `.specify/memory/constitution.md`. All feature work must satisfy:

- no broken links and no unhandled 500-path behavior in core flows
- explicit loading, empty, and error states for impacted journeys
- strict TypeScript with no `any` in application code
- modular and reusable frontend components
- WCAG 2.1 AA and Lighthouse accessibility/performance scores above 90
- CI/CD with passing unit tests and critical Playwright or Cypress E2E flows

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Docker Desktop](https://docs.docker.com/get-docker/)

### Installing Docker Desktop

**Mac (Homebrew):**

```sh
brew install --cask docker
```

**Windows (winget):**

```powershell
winget install Docker.DockerDesktop
```

After installing, open Docker Desktop and wait for it to show "Running" before continuing.

## Getting Started

> For a detailed step-by-step walkthrough, see [docs/getting-started.md](docs/getting-started.md).

### 1. Install dependencies

```sh
npm install
```

### 2. Set up the database

**Mac / Linux:**

```sh
./scripts/setup/setup.sh
```

**Windows (PowerShell):**

```powershell
.\scripts\setup\setup.ps1
```

This will:
- Check that Docker is installed
- Create a `.env` file from `.env.example` (edit it with your own credentials if needed)
- Start a PostgreSQL database in Docker

### 3. Start the dev server

```sh
npm run dev
```

### Useful database commands

| Command | Description |
|---|---|
| `docker compose up -d` | Start the database |
| `docker compose down` | Stop the database (keeps data) |
| `docker compose down -v` | Stop and delete all data (fresh start) |
| `docker compose logs db` | View database logs |

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.
