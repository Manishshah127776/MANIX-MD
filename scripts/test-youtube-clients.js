const ytdl = require('@distube/ytdl-core')
const url = process.argv[2]
if (!url) throw new Error('Usage: node scripts/test-youtube-clients.js <youtube-url>')

async function main() {
  const clients = [
    ['ANDROID', 'TV', 'WEB_EMBEDDED'],
    ['IOS', 'TV', 'WEB_EMBEDDED'],
    ['TV', 'WEB_EMBEDDED']
  ]
  for (const playerClients of clients) {
    try {
      const info = await ytdl.getInfo(url, { playerClients })
      const formats = info.formats.filter(format => format.hasAudio && !format.hasVideo)
      console.log(JSON.stringify({ playerClients, title: info.videoDetails?.title, audioFormats: formats.length, first: formats[0] && { mimeType: formats[0].mimeType, bitrate: formats[0].audioBitrate, url: Boolean(formats[0].url) } }))
      if (formats.length) return
    } catch (error) {
      console.log(JSON.stringify({ playerClients, error: error.message }))
    }
  }
  process.exitCode = 1
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
