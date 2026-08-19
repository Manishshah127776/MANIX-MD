const fs = require('fs')
const { downloadFile, cleanup } = require('../download.js')

const url = process.argv[2] || 'https://www.youtube.com/watch?v=284Ov7ysmfA'

;(async () => {
  const result = await downloadFile(url, { audioOnly: true, retries: 1 })
  if (!result.success) throw new Error(result.error || 'exact YouTube audio download failed')
  if (result.type !== 'audio') throw new Error(`expected audio result, received ${result.type}`)
  const buffer = fs.readFileSync(result.path)
  const prefix = buffer.subarray(0, 96).toString('utf8').trim().toLowerCase()
  if (buffer.length < 1024) throw new Error(`audio file too small: ${buffer.length} bytes`)
  if (prefix.startsWith('<') || prefix.startsWith('{')) throw new Error('provider returned HTML/JSON instead of audio')
  if (buffer.subarray(0, 3).toString('ascii') !== 'ID3' && !(buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0)) throw new Error('audio file has no MP3 frame header')
  console.log(JSON.stringify({ success: true, title: result.title, provider: result.audioUrl ? new URL(result.audioUrl).hostname : 'yt-dlp', bytes: buffer.length, fileName: result.fileName }, null, 2))
  await cleanup(result)
})().catch(error => {
  console.error(error.stack || error.message)
  process.exitCode = 1
})
