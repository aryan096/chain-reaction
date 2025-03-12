import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Make sure dist directory exists
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

// Clean and build
console.log('Cleaning previous build...');
execSync('npm run clean', { stdio: 'inherit' });

console.log('Compiling TypeScript...');
execSync('npm run build', { stdio: 'inherit' });

console.log('Build completed successfully!');
