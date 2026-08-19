const fs = require('fs')
const path = require('path')
const os = require('os')
const axios = require('axios')
const ytdlp = require('youtube-dl-exec')

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140 Safari/537.36'
const MAX_FILE_BYTES = 100 * 1024 * 1024
const YOUTUBE_HOSTS = /(?:youtube\.com|youtu\.be|music\.youtube\.com)/i
const DIRECT_MEDIA_EXTENSIONS = /\.(mp4|m4v|webm|mov|mkv|avi|3gp|mp3|m4a|aac|wav|ogg|opus|jpg|jpeg|png|gif|webp)(?:[?#].*)?$/i

function detectPlatform(input) {
  const value = String(input || '')
  const patterns = {
    youtube: YOUTUBE_HOSTS,
    tiktok: /(?:tiktok\.com|vm\.tiktok\.com)/i,
    instagram: /(?:instagram\.com|instagr\.am)/i,
    facebook: /(?:facebook\.com|fb\.watch|fb\.com)/i,
    twitter: /(?:twitter\.com|x\.com)/i,
    threads: /threads\.net/i,
    pinterest: /pinterest\.(?:com|co\.uk)/i,
    likee: /likee\.video/i,
    capcut: /capcut\.com/i,
    soundcloud: /soundcloud\.com/i
  }
  for (const [platform, pattern] of Object.entries(patterns)) {
    if (pattern.test(value)) return platform
  }
  return 'unknown'
}

function normalizeOptions(retriesOrOptions) {
  if (typeof retriesOrOptions === 'number') return { retries: Math.max(1, retriesOrOptions), audioOnly: false }
  const options = retriesOrOptions && typeof retriesOrOptions === 'object' ? retriesOrOptions : {}
  return {
    retries: Math.max(1, Number(options.retries || 2)),
    audioOnly: Boolean(options.audioOnly),
    format: options.format || null,
    quality: options.quality || 'best'
  }
}

function cookieOptions(platform) {
  const configured = platform === 'instagram'
    ? (process.env.INSTAGRAM_COOKIES_PATH || process.env.YT_COOKIES_PATH)
    : process.env.YT_COOKIES_PATH
  const cookiePath = String(configured || '').trim()
  return cookiePath && fs.existsSync(path.resolve(cookiePath)) ? { cookies: path.resolve(cookiePath) } : {}
}

function commonYtdlpOptions(platform, tempDir, options) {
  const audioOnly = options.audioOnly || options.format === 'mp3' || options.format === 'm4a'
  const output = path.join(tempDir, 'media.%(ext)s')
  const base = {
    noWarnings: true,
    noCheckCertificates: true,
    noPlaylist: true,
    noPart: true,
    output,
    jsRuntime: 'node',
    remoteComponents: 'ejs:github',
    userAgent: USER_AGENT,
    restrictFilenames: true,
    ...(platform === 'youtube' ? { extractorArgs: 'youtube:player_client=android_vr,web_safari,tv' } : {}),
    ...cookieOptions(platform)
  }
  if (audioOnly) {
    return {
      ...base,
      format: 'bestaudio[ext=m4a]/bestaudio/best',
      extractAudio: true,
      audioFormat: options.format === 'm4a' ? 'm4a' : 'mp3',
      audioQuality: '0'
    }
  }
  return {
    ...base,
    format: options.quality === 'worst' ? 'worst[ext=mp4]/worst' : 'best[ext=mp4]/bestvideo[ext=mp4]+bestaudio/best',
    mergeOutputFormat: 'mp4'
  }
}

function titleFromInfo(info, platform) {
  return String(info?.title || info?.fulltitle || `${platform}-download`)
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_')
    .trim()
    .slice(0, 100) || `${platform}-download`
}

function mediaTypeFromFile(filePath, info, audioOnly) {
  const ext = path.extname(filePath).toLowerCase()
  if (audioOnly || /\.(mp3|m4a|aac|wav|ogg|opus)$/i.test(ext)) return 'audio'
  if (/\.(jpg|jpeg|png|gif|webp)$/i.test(ext)) return 'image'
  if (info?.ext && /^(jpg|jpeg|png|gif|webp)$/i.test(info.ext)) return 'image'
  return 'video'
}

async function listMediaFiles(tempDir) {
  return (await fs.promises.readdir(tempDir))
    .filter(file => DIRECT_MEDIA_EXTENSIONS.test(file))
    .map(file => path.join(tempDir, file))
}

async function downloadWithYtdlp(url, platform, options) {
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'manix-download-'))
  try {
    const ytdlpOptions = commonYtdlpOptions(platform, tempDir, options)
    const info = await ytdlp(url, { ...ytdlpOptions, dumpSingleJson: true, skipDownload: true })
    await ytdlp(url, ytdlpOptions)
    const files = await listMediaFiles(tempDir)
    if (!files.length) throw new Error('yt-dlp returned metadata but downloaded no media file')
    const sourcePath = files[0]
    const finalExt = path.extname(sourcePath)
    const fileName = `${titleFromInfo(info, platform)}_${Date.now()}${finalExt}`
    const finalPath = path.join(tempDir, fileName)
    await fs.promises.rename(sourcePath, finalPath)
    const stat = await fs.promises.stat(finalPath)
    if (!stat.size || stat.size > MAX_FILE_BYTES) throw new Error('Downloaded media is empty or exceeds the 100 MB limit')
    return {
      success: true,
      path: finalPath,
      fileName,
      size: stat.size,
      type: mediaTypeFromFile(finalPath, info, options.audioOnly),
      title: info?.title || `${platform} media`,
      platform,
      thumbnail: info?.thumbnail || null,
      uploader: info?.uploader || info?.channel || null,
      audioUrl: null,
      videoUrl: null,
      raw: info,
      cleanupDir: tempDir
    }
  } catch (error) {
    await fs.promises.rm(tempDir, { recursive: true, force: true }).catch(() => {})
    throw error
  }
}

async function downloadYoutubeAudioFallback(url, options) {
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'manix-download-ytaudio-'))
  try {
    const response = await axios.post(process.env.YTMP3GE_API_URL || 'https://ytmp3.ge/api/convert', new URLSearchParams({
      youtube_url: url,
      quality: options.quality === 'best' ? '320' : String(options.quality || '192')
    }).toString(), {
      timeout: 60000,
      headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'MANI-XMD/1.0' },
      validateStatus: status => status >= 200 && status < 500
    })
    const data = response.data || {}
    if (response.status >= 400 || !data.success || !data.downloadUrl) throw new Error(data.error || `YTMP3.GE returned HTTP ${response.status}`)
    const fileName = `${titleFromInfo({ title: data.title }, 'youtube-audio')}_${Date.now()}.mp3`
    const filePath = path.join(tempDir, fileName)
    const media = await axios.get(data.downloadUrl, {
      responseType: 'stream',
      timeout: 90000,
      maxContentLength: MAX_FILE_BYTES,
      maxBodyLength: MAX_FILE_BYTES,
      headers: { Accept: 'audio/mpeg,audio/*;q=0.9,*/*;q=0.8', 'User-Agent': 'MANI-XMD/1.0' },
      validateStatus: status => status >= 200 && status < 300
    })
    const writer = fs.createWriteStream(filePath)
    let received = 0
    media.data.on('data', chunk => {
      received += chunk.length
      if (received > MAX_FILE_BYTES) media.data.destroy(new Error('Audio exceeds the 100 MB limit'))
    })
    media.data.pipe(writer)
    await new Promise((resolve, reject) => {
      writer.once('finish', resolve)
      writer.once('error', reject)
      media.data.once('error', reject)
    })
    if (!received) throw new Error('YTMP3.GE returned an empty audio file')
    return {
      success: true,
      path: filePath,
      fileName,
      size: received,
      type: 'audio',
      title: data.title || 'YouTube Audio',
      platform: 'youtube',
      thumbnail: data.thumbnail || null,
      audioUrl: data.downloadUrl,
      videoUrl: null,
      cleanupDir: tempDir
    }
  } catch (error) {
    await fs.promises.rm(tempDir, { recursive: true, force: true }).catch(() => {})
    throw error
  }
}

async function downloadDirectMedia(url, platform, options) {
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'manix-download-direct-'))
  try {
    const response = await axios.get(url, {
      responseType: 'stream',
      timeout: 60000,
      maxContentLength: MAX_FILE_BYTES,
      maxBodyLength: MAX_FILE_BYTES,
      headers: { 'User-Agent': USER_AGENT, Accept: '*/*' },
      validateStatus: status => status >= 200 && status < 300
    })
    const contentType = String(response.headers?.['content-type'] || '').split(';')[0].toLowerCase()
    const extension = contentType.includes('audio') ? '.mp3' : contentType.includes('image') ? '.jpg' : (path.extname(new URL(url).pathname) || '.mp4')
    const fileName = `download_${Date.now()}${extension}`
    const filePath = path.join(tempDir, fileName)
    const writer = fs.createWriteStream(filePath)
    let received = 0
    response.data.on('data', chunk => {
      received += chunk.length
      if (received > MAX_FILE_BYTES) response.data.destroy(new Error('Download exceeds the 100 MB limit'))
    })
    response.data.pipe(writer)
    await new Promise((resolve, reject) => {
      writer.once('finish', resolve)
      writer.once('error', reject)
      response.data.once('error', reject)
    })
    if (!received) throw new Error('Direct media response was empty')
    return {
      success: true,
      path: filePath,
      fileName,
      size: received,
      type: contentType.includes('audio') ? 'audio' : contentType.includes('image') ? 'image' : 'video',
      title: 'Direct media download',
      platform,
      thumbnail: null,
      audioUrl: null,
      videoUrl: url,
      cleanupDir: tempDir
    }
  } catch (error) {
    await fs.promises.rm(tempDir, { recursive: true, force: true }).catch(() => {})
    throw error
  }
}

async function downloadFile(url, retriesOrOptions = 2) {
  const input = String(url || '').trim()
  const options = normalizeOptions(retriesOrOptions)
  if (!/^https?:\/\//i.test(input)) return { success: false, error: 'Please provide a valid http(s) media URL', platform: 'unknown' }
  const platform = detectPlatform(input)
  let lastError = null
  for (let attempt = 1; attempt <= options.retries; attempt += 1) {
    try {
      if (platform !== 'unknown' || !DIRECT_MEDIA_EXTENSIONS.test(input)) {
        try {
          return await downloadWithYtdlp(input, platform, options)
        } catch (error) {
          if (platform === 'youtube' && options.audioOnly) return await downloadYoutubeAudioFallback(input, options)
          throw error
        }
      }
      return await downloadDirectMedia(input, platform, options)
    } catch (error) {
      lastError = error
      if (attempt < options.retries) await new Promise(resolve => setTimeout(resolve, attempt * 1500))
    }
  }
  return { success: false, error: lastError?.stderr || lastError?.message || 'No media could be downloaded', platform }
}

async function cleanup(resultOrPath) {
  const filePath = typeof resultOrPath === 'string' ? resultOrPath : resultOrPath?.path
  const cleanupDir = typeof resultOrPath === 'object' ? resultOrPath.cleanupDir : null
  if (cleanupDir) return fs.promises.rm(cleanupDir, { recursive: true, force: true })
  if (filePath) return fs.promises.rm(filePath, { force: true })
}

async function handleDownloadCommand(sock, msg, args) {
  const url = String(Array.isArray(args) ? args[0] : args || '').trim()
  const chatId = msg?.key?.remoteJid || msg?.chat
  if (!url) return sock.sendMessage(chatId, { text: '❌ Please provide a media link.\n\nExample: .download https://www.tiktok.com/@user/video/...' })
  await sock.sendMessage(chatId, { text: '⏳ Downloading with yt-dlp. Please wait...' })
  const result = await downloadFile(url)
  if (!result.success) return sock.sendMessage(chatId, { text: `❌ Download failed\n\n${result.error}\n\nThe provider rejected this no-cookie request. Try another link and retry shortly.` })
  try {
    const caption = `📥 *MANI XMD DOWNLOAD COMPLETE*\n\n📁 ${result.fileName}\n📊 ${(result.size / 1024 / 1024).toFixed(2)} MB\n📱 ${result.platform}\n🎵 ${result.title}`
    if (result.type === 'audio') await sock.sendMessage(chatId, { audio: { url: result.path }, mimetype: 'audio/mpeg', fileName: result.fileName, caption })
    else if (result.type === 'image') await sock.sendMessage(chatId, { image: { url: result.path }, caption })
    else await sock.sendMessage(chatId, { video: { url: result.path }, caption })
  } finally {
    await cleanup(result).catch(() => {})
  }
}

module.exports = { downloadFile, handleDownloadCommand, cleanup, detectPlatform, downloadWithYtdlp, downloadYoutubeAudioFallback, downloadDirectMedia }
