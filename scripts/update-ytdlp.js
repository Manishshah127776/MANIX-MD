const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

const binary = path.join(__dirname, '..', 'node_modules', 'youtube-dl-exec', 'bin', 'yt-dlp')

if (!fs.existsSync(binary)) {
  console.warn('[yt-dlp] bundled executable not found; skipping stable update')
  process.exit(0)
}

if (String(process.env.YT_DLP_AUTO_UPDATE || 'true').toLowerCase() === 'false') {
  console.log('[yt-dlp] automatic stable update disabled by YT_DLP_AUTO_UPDATE=false')
  process.exit(0)
}

const result = spawnSync(binary, ['-U'], {
  stdio: 'inherit',
  timeout: 90000,
  windowsHide: true
})

if (result.error) {
  console.warn(`[yt-dlp] stable update skipped: ${result.error.message}`)
  process.exit(0)
}

if (result.status !== 0) {
  console.warn(`[yt-dlp] stable update returned exit code ${result.status}; continuing installation`)
}
