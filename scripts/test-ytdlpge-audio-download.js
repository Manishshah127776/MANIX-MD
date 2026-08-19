const { downloadYoutubeAudioFallback, cleanup } = require('../download')

const url = process.argv[2] || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'

downloadYoutubeAudioFallback(url, { quality: '192' })
  .then(async result => {
    console.log(JSON.stringify({ ok: result.success, type: result.type, size: result.size, title: result.title, fileName: result.fileName }, null, 2))
    await cleanup(result)
    if (!result.success || !result.size) process.exitCode = 1
  })
  .catch(error => {
    console.log(JSON.stringify({ ok: false, message: error.message }, null, 2))
    process.exitCode = 1
  })
