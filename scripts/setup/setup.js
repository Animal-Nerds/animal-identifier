import { execSync } from 'child_process';
import { platform } from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isWindows = platform() === 'win32';
const scriptName = isWindows ? 'setup.ps1' : 'setup.sh';
const scriptPath = path.join(__dirname, scriptName);


// run setup script to ensure environment is configured
console.log('\nVerifying environment status...');
try {
    if (isWindows) {
        execSync(`powershell -ExecutionPolicy Bypass -File "${scriptPath}"`, { stdio: 'inherit' });
    } else {
        execSync(`bash "${scriptPath}"`, { stdio: 'inherit' });
    }
} catch (error) {
    console.error(`Failed to run ${scriptName}:`, error.message);
    process.exit(1);
}


console.log('\nInstalling dependencies...');
try {
    execSync('npm install', { stdio: 'inherit' });
} catch (error) {
    console.error('Failed to install dependencies:', error.message);
    process.exit(1);
}


console.log('\nStarting docker desktop...');
try {
    execSync('docker desktop start', { stdio: 'inherit' });
} catch (error) {
    console.error('Failed to start docker desktop:', error.message);
    process.exit(1);
}


console.log('\nStarting docker containers...');
try {
    execSync('docker compose up -d', { stdio: 'inherit' });
} catch (error) {
    console.error('Failed to start docker containers:', error.message);
    process.exit(1);
}