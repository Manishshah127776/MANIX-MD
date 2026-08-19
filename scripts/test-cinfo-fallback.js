const fs = require('fs')
const path = require('path')

const source = fs.readFileSync(path.join(__dirname, '..', 'drenox.js'), 'utf8')
for (const required of ['fetchPublicWhatsAppChannelInfo', 'Native WhatsApp channel metadata unavailable', 'public WhatsApp channel page']) {
  if (!source.includes(required)) throw new Error(`Missing cinfo fallback marker: ${required}`)
}

const handleMessage = require('../drenox.js')
const helper = handleMessage.mediaHelpers?.fetchPublicWhatsAppChannelInfo
if (typeof helper !== 'function') throw new Error('cinfo fallback helper is not exported')

helper('https://whatsapp.com/channel/0029Vb8XvFqD8SDvDPkdqG1f')
  .then(info => {
    if (!/MANIX MD/i.test(info.name)) throw new Error(`Unexpected channel name: ${info.name}`)
    if (!info.followers || info.followers === 'Unknown') throw new Error('Follower count was not parsed')
    console.log(JSON.stringify({ ok: true, name: info.name, followers: info.followers, id: info.id, source: info.source }, null, 2))
    process.exit(0)
  })
  .catch(error => {
    console.error(error.stack || error.message)
    process.exit(1)
  })

setTimeout(() => {
  console.error('cinfo fallback test timed out')
  process.exit(1)
}, 40000)
