const ytdlp = require('youtube-dl-exec')

const url = process.argv[2]
if (!url) throw new Error('Usage: node scripts/test-youtube-extractors.js <youtube-url>')

const clients = [
  ['android_vr'],
  ['android'],
  ['ios'],
  ['web_safari'],
  ['tv'],
  ['web_creator'],
  ['web_embedded']
]

async function main() {
  for (const playerClient of clients) {
    try {
      const info = await ytdlp(url, {
        dumpSingleJson: true,
        skipDownload: true,
        noWarnings: true,
        noCheckCertificates: true,
        jsRuntime: 'node',
        remoteComponents: 'ejs:github',
        extractorArgs: {
          youtube: {
            player_client: playerClient
          }
        }
      })
      const formats = Array.isArray(info.formats) ? info.formats : []
      const audio = formats.filter(format => format.acodec && format.acodec !== 'none')
      console.log(JSON.stringify({
        playerClient: playerClient[0],
        title: info.title,
        formats: formats.length,
        audioFormats: audio.length,
        firstAudio: audio[0] ? { ext: audio[0].ext, mime: audio[0].mime, hasUrl: Boolean(audio[0].url) } : null
      }))
    } catch (error) {
      console.log(JSON.stringify({
        playerClient: playerClient[0],
        error: String(error.stderr || error.message || error).slice(0, 500)
      }))
    }
  }
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
