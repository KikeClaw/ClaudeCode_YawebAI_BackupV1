#!/usr/bin/env node
// Pre-loads .env.local directly into process.env BEFORE dotenvx can filter anything
const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

const envFile = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envFile)) {
  const lines = fs.readFileSync(envFile, 'utf8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim()
    // Always set — override whatever dotenvx may have set
    if (key) process.env[key] = val
  }
}

spawnSync('next', ['dev'], {
  stdio: 'inherit',
  env: { ...process.env },
})
