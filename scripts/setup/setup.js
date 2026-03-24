import { execSync } from 'child_process';
import { platform } from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isWindows = platform() === 'win32';
const scriptName = isWindows ? 'setup.ps1' : 'setup.sh';
const scriptPath = path.join(__dirname, scriptName);

function run(command, errorMessage) {
    try {
        execSync(command, { stdio: 'inherit' });
    } catch (error) {
        console.error(`${errorMessage}:`, error.message);
        process.exit(1);
    }
}

// 1. Environment setup (Docker install, .env file)
console.log('\n--- Verifying environment ---');
if (isWindows) {
    run(`powershell -ExecutionPolicy Bypass -File "${scriptPath}"`, `Failed to run ${scriptName}`);
} else {
    run(`bash "${scriptPath}"`, `Failed to run ${scriptName}`);
}

// 2. Install dependencies
console.log('\n--- Installing dependencies ---');
run('npm install', 'Failed to install dependencies');

// 3. Start Docker Desktop
console.log('\n--- Starting Docker Desktop ---');
try {
    execSync('docker ps', { stdio: 'ignore' });
    console.log('Docker is already running.');
} catch {
    try {
        execSync('docker desktop start', { stdio: 'inherit' });
    } catch {
        console.error('Could not start Docker Desktop. Please start it manually and re-run setup.');
        process.exit(1);
    }
}

// 4. Start containers
console.log('\n--- Starting database container ---');
run('docker compose up -d', 'Failed to start docker containers');

// 5. Wait for Postgres to be ready
console.log('\n--- Waiting for database to be ready ---');
const maxRetries = 15;
let ready = false;
for (let i = 0; i < maxRetries; i++) {
    try {
        execSync('docker compose exec db pg_isready -U ${POSTGRES_USER:-postgres}', { stdio: 'ignore' });
        ready = true;
        break;
    } catch {
        process.stdout.write('.');
        execSync('sleep 2');
    }
}
if (!ready) {
    console.error('\nDatabase did not become ready in time. Check docker logs with: docker compose logs db');
    process.exit(1);
}
console.log('\nDatabase is ready.');

// 6. Push schema
console.log('\n--- Pushing database schema ---');
run('npx drizzle-kit push', 'Failed to push database schema');

// 7. Start dev server
console.log('\n--- Starting dev server ---');
console.log('Setup complete! Starting app...\n');
run('npm run dev', 'Failed to start dev server');
