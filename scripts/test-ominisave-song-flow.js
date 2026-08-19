const fs = require('fs');
const path = require('path');
const { mediaHelpers } = require('../drenox.js');

const url = process.argv[2] || 'https://youtube.com/watch?v=284Ov7ysmfA';

function isMp3(buffer) {
  return buffer.subarray(0, 3).toString('ascii') === 'ID3' || (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0);
}

(async () => {
  const result = await mediaHelpers.fetchOminiSaveAudio(url);
  if (!result || !Buffer.isBuffer(result.buffer)) throw new Error('OminiSave did not return a Buffer');
  if (result.buffer.length < 1024) throw new Error(`audio file too small: ${result.buffer.length} bytes`);
  if (!isMp3(result.buffer)) throw new Error('OminiSave returned data without an MP3 header');
  if (result.mimetype !== 'audio/mpeg') throw new Error(`unexpected mimetype: ${result.mimetype}`);
  if (result.sourceUrl !== url) throw new Error('source URL was not preserved');

  const source = fs.readFileSync(path.join(__dirname, '..', 'drenox.js'), 'utf8');
  for (const fragment of ['fetchOminiSaveAudio(video.url)', 'detailsCaption', 'previewThumbnail', 'ᴅᴏᴡɴʟᴏᴀᴅɪɴɢ ᴀᴜᴅɪᴏ']) {
    if (!source.includes(fragment)) throw new Error(`missing .song integration fragment: ${fragment}`);
  }
  console.log(JSON.stringify({ success: true, title: result.title, provider: 'ominisave.com', mimetype: result.mimetype, bytes: result.buffer.length }, null, 2));
})().catch(error => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
