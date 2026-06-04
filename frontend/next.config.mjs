import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Acota la raíz de tracing a este proyecto (evita el aviso por múltiples lockfiles).
  outputFileTracingRoot: __dirname,
}

export default nextConfig
