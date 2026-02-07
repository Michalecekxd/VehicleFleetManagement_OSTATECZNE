import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import * as fs from 'fs';
import * as path from 'path';
import * as child_process from 'child_process';
import { env } from 'process';

const baseFolder =
    env.APPDATA !== undefined && env.APPDATA !== ''
        ? `${env.APPDATA}/ASP.NET/https`
        : `${env.HOME}/.aspnet/https`;

const certificateName = "vehiclefleetmanagement.client";
const certFilePath = path.join(baseFolder, `${certificateName}.pem`);
const keyFilePath = path.join(baseFolder, `${certificateName}.key`);

if (!fs.existsSync(baseFolder)) {
    fs.mkdirSync(baseFolder, { recursive: true });
}

if (!fs.existsSync(certFilePath) || !fs.existsSync(keyFilePath)) {
    if (0 !== child_process.spawnSync('dotnet', [
        'dev-certs',
        'https',
        '--export-path',
        certFilePath,
        '--format',
        'Pem',
        '--no-password',
    ], { stdio: 'inherit', }).status) {
        throw new Error("Could not create certificate.");
    }
}

//const target = env.ASPNETCORE_HTTPS_PORT ? `https://localhost:${env.ASPNETCORE_HTTPS_PORT}` :
//    env.ASPNETCORE_URLS ? env.ASPNETCORE_URLS.split(';')[0] : 'https://localhost:7130';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },
    server: {
        proxy: {
            '^/api/auth': {
                target: 'https://localhost:7012',  // redirect queries to the backend ( we dont need write fetch('https://localhost:7012/api/auth/register'...)- instead of this we write fetch('/api/auth/register'...)
                secure: false           // ingore SSL 
            },
            '^/api/vehicle': {
                target: 'https://localhost:7012',
                secure: false
            },
             '^/api/driver': {
                target: 'https://localhost:7012',
                secure: false
            },
               '^/api/breakdown': {
                target: 'https://localhost:7012',
                secure: false
            },
            '^/api/delivery': {
                target: 'https://localhost:7012',
                secure: false
            },
            '^/api/config': {
                target: 'https://localhost:7012',
                secure: false
            },
            '^/api/order': {
                target: 'https://localhost:7012',
                secure: false
            },
            '^/api/osrmproxy': {
                target: 'https://localhost:7012',
                secure: false
            },

        },
        port: 57838,
        https: {
            key: fs.readFileSync(keyFilePath),
            cert: fs.readFileSync(certFilePath),
        }
    }
})
