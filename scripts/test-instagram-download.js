const path = require('path')
const { mediaHelpers } = require(path.join(__dirname, '..', 'drenox.js'))
const url = process.argv[2]
if (!url) throw new Error('Usage: node scripts/test-instagram-download.js <instagram-url>')

mediaHelpers.fetchInstagramWithYtdlp(url)
  .then(result => {
    console.log(JSON.stringify({ ok: true, title: result.title, uploader: result.uploader, items: result.items.map(item => ({ mimetype: item.mimetype, bytes: item.buffer.length })) }, null, 2))
    process.exitCode = 0
  })
  .catch(error => {
    console.error(JSON.stringify({ ok: false, error: error.message, stderr: error.stderr || '' }, null, 2))
    process.exitCode = 1
  })
  .finally(() => setTimeout(() => process.exit(), 100))
