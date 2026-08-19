const fs = require('fs')
const path = require('path')

const source = fs.readFileSync(path.join(__dirname, '..', 'drenox.js'), 'utf8')
const dispatcher = require(path.join(__dirname, '..', 'drenox.js'))
const helpers = dispatcher.mediaHelpers

if (!helpers || typeof helpers.fetchTikTokEmbedVideo !== 'function') {
  throw new Error('TikTok media helpers were not exported')
}
if (!/case ['"]bugmenu['"]/.test(source)) {
  throw new Error('bugmenu case is missing')
}
const id = helpers.extractTikTokVideoId('https://www.tiktok.com/@_/video/7641065316574940438')
if (id !== '7641065316574940438') {
  throw new Error(`TikTok ID parse failed: ${id}`)
}

helpers.fetchTikTokVideo('https://www.tiktok.com/@_/video/7641065316574940438')
  .then(result => {
    if (!Buffer.isBuffer(result.buffer) || result.buffer.length < 100000) {
      throw new Error(`TikTok fallback returned an invalid buffer (${result.buffer?.length || 0} bytes)`)
    }
    console.log(JSON.stringify({
      ok: true,
      id,
      bytes: result.buffer.length,
      title: result.title,
      uploader: result.uploader,
      mimetype: result.mimetype
    }, null, 2))
    process.exit(0)
  })
  .catch(error => {
    console.error(error.message)
    process.exitCode = 1
    process.exit(1)
  })
