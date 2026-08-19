const path = require('path')
const { mediaHelpers } = require(path.join(__dirname, '..', 'drenox.js'))
const url = process.argv[2]
if (!url) throw new Error('Usage: node scripts/test-piped-fallback.js <youtube-url>')

mediaHelpers.fetchPipedAudio(url)
  .then(result => {
    console.log(JSON.stringify({ ok: true, title: result.title, uploader: result.uploader, mimetype: result.mimetype, bytes: result.buffer.length, fileName: result.fileName }, null, 2))
    process.exitCode = 0
  })
  .catch(error => {
    console.error(JSON.stringify({ ok: false, error: error.message }, null, 2))
    process.exitCode = 1
  })
  .finally(() => setTimeout(() => process.exit(), 100))
