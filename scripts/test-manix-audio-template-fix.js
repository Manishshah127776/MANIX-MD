const fs = require('fs')
const { downloadFile, cleanup, downloadYoutubeAudioWithCompatibleYtdlp } = require('../download.js')

const workingUrl = process.argv[2] || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
const blockedUrl = process.argv[3] || 'https://www.youtube.com/watch?v=284Ov7ysmfA'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

;(async () => {
  const result = await downloadFile(workingUrl, { audioOnly: true, retries: 1 })
  assert(result.success, `working audio download failed: ${result.error || 'unknown error'}`)
  assert(result.type === 'audio', `expected audio type, received ${result.type}`)
  const bytes = fs.readFileSync(result.path)
  assert(bytes.length > 1024, 'working audio file was too small')
  assert(!bytes.subarray(0, 96).toString('utf8').trim().toLowerCase().startsWith('<'), 'working audio file is HTML')
  await cleanup(result)

  let blockedError = null
  try {
    await downloadYoutubeAudioWithCompatibleYtdlp(blockedUrl, { quality: 'best' })
  } catch (error) {
    blockedError = error
  }
  assert(blockedError, 'blocked video unexpectedly returned a result')
  console.log(JSON.stringify({ working: { success: result.success, type: result.type, bytes: bytes.length }, blocked: { safelyRejected: true, message: blockedError.message.split('\n')[0] } }, null, 2))
})().catch(error => {
  console.error(error.stack || error.message)
  process.exitCode = 1
})
