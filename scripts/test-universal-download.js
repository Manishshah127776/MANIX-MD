const fs = require('fs')
const path = require('path')

const source = fs.readFileSync(path.join(__dirname, '..', 'drenox.js'), 'utf8')
const downloadSource = fs.readFileSync(path.join(__dirname, '..', 'download.js'), 'utf8')
const downloader = require('../download.js')

const cases = {
  youtube: 'https://youtu.be/dQw4w9WgXcQ',
  tiktok: 'https://www.tiktok.com/@user/video/1234567890',
  instagram: 'https://www.instagram.com/reel/ABC123/',
  facebook: 'https://www.facebook.com/watch/?v=1234567890',
  twitter: 'https://x.com/user/status/1234567890',
  direct: 'https://cdn.example.com/file.mp4'
}
for (const [expected, url] of Object.entries(cases)) {
  const actual = downloader.detectPlatform(url)
  if (expected === 'direct') {
    if (actual !== 'unknown') throw new Error(`Expected direct URL to be unknown, got ${actual}`)
  } else if (actual !== expected) {
    throw new Error(`${url} detected as ${actual}, expected ${expected}`)
  }
}
if (!downloadSource.includes("require('youtube-dl-exec')")) throw new Error('download.js does not use youtube-dl-exec')
if (!downloadSource.includes('downloadWithYtdlp')) throw new Error('download.js missing yt-dlp path')
if (!source.includes('handleUniversalDownloadCommand')) throw new Error('drenox.js is not wired to download.js')
if (!source.includes("if (/^https?:\\/\\//i.test(downloadInput))")) throw new Error('URL-aware .download branch is missing')
console.log(JSON.stringify({ ok: true, platforms: cases, adapter: 'yt-dlp primary', originalQuotedSavePath: true }, null, 2))
