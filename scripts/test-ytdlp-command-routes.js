const fs = require('fs')

const source = fs.readFileSync('drenox.js', 'utf8')
const requiredCases = [
  ['play', 'song'],
  ['ytvideo', 'ytmp4'],
  ['ytmp3', 'ytaudio'],
  ['ytmp4_alt2', 'ytvideo_alt2']
]

const failures = []
for (const labels of requiredCases) {
  const labelPattern = labels.map(label => label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')
  const caseStart = source.search(new RegExp(`case ['\"](?:${labelPattern})['\"]`))
  if (caseStart < 0) {
    failures.push(`${labels.join('/')} case not found`)
    continue
  }
  const lastLabel = labels[labels.length - 1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const lastCaseStart = source.search(new RegExp(`case ['\"]${lastLabel}['\"]`))
  const nextCase = source.indexOf("\ncase ", lastCaseStart + 1)
  const block = source.slice(caseStart, nextCase > 0 ? nextCase : source.length)
  if (!/youtube-dl-exec|\bytdlp\s*\(/.test(block)) failures.push(`${labels.join('/')} does not call yt-dlp`)
  if (/downloader\/ytmp4/.test(block)) failures.push(`${labels.join('/')} still calls NexOracle ytmp4`)
}

const result = {
  ok: failures.length === 0,
  requiredRoutes: requiredCases.map(labels => labels.join('/')),
  failures
}
console.log(JSON.stringify(result, null, 2))
if (failures.length) process.exitCode = 1
else process.exitCode = 0

// Keep this test process short-lived when required modules are added later.
setImmediate(() => {})
