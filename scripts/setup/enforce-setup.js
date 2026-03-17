import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

function runCommand(command, errorMessage) {
    try {
        execSync(command, { stdio: 'inherit' });
        return true;
    } catch (error) {
        console.error(errorMessage + ':', error.message);
        return false;
    }
}


// run setup script to ensure environment is configured
console.log('\nVerifying environment status...');
let environmentReady = false;
try {
    execSync('docker --version', { stdio: 'inherit' });
    if (fs.existsSync('.env')) {
        environmentReady = true;
    } else {
        console.warn('.env file is missing. Environment may not be fully configured.');
    }
} catch (error) {
    console.error('Error occurred while checking environment status:', error.message);
}

if (!environmentReady) {
    console.error('Docker is not installed or not in PATH. Running setup script to configure environment...');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    if (!runCommand(`node "${path.join(__dirname, 'setup.js')}"`, 'Failed to run setup script')) {
        console.error('Failed to run setup script.');
        process.exit(1);
    }
}



console.log('\nChecking docker desktop...');
if (!runCommand('docker ps', 'Docker desktop is not running')) {
    console.log('Attempting to start docker desktop...');
    if (!runCommand('docker desktop start', 'Failed to start docker desktop')) {
        console.error('Please start docker desktop manually and re-run the setup script.');
        process.exit(1);
    }
}


console.log('\nChecking docker containers...');
if (!runCommand('docker compose ps', 'Docker containers are not running')) {
    console.log('Attempting to start docker containers...');
     if (!runCommand('docker compose up -d', 'Failed to start docker containers')) {
        console.error('Please start docker containers manually with "docker compose up -d" and re-run the setup script.');
        process.exit(1);
    }
}



console.log('\nChecking for dependencies...');
try {
    execSync('npm install', { stdio: 'inherit' });
} catch (error) {
    console.error('Failed to install dependencies:', error.message);
    process.exit(1);
}