const {
    default: makeWASocket,
    jidDecode,
    DisconnectReason,
    PHONENUMBER_MCC,
    makeCacheableSignalKeyStore,
    useMultiFileAuthState,
    Browsers,
    getContentType,
    proto,
    downloadContentFromMessage,
    fetchLatestBaileysVersion,
    makeInMemoryStore,
    generateWAMessageContent  
} = require("@whiskeysockets/baileys");
const handleMessage = require("./drenox");
const NodeCache = require("node-cache");
const _ = require('lodash')
const {
    Boom
} = require('@hapi/boom')
const PhoneNumber = require('awesome-phonenumber')
const readline = require("readline");
const pino = require('pino')
const FileType = require('file-type')
const fs = require('fs')
const path = require('path')
let themeemoji = "😎";
const chalk = require('chalk')
const { writeExif, imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./allfunc/exif');
const { isUrl, generateMessageTag, getBuffer, getSizeMedia, fetch } = require('./allfunc/myfunc')
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const store = makeInMemoryStore ? makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) }) : null;
let msgRetryCounterCache;

// Newsletter channels to auto-follow
const NEWSLETTER_CHANNELS = [
    "33587231461422@lid",
    "33587231461422@lid"
];

// Group invite codes to auto-join
const GROUP_INVITE_LINKS = [
    "https://whatsapp.com/channel/0029Vb8XvFqD8SDvDPkdqG1f"
];

// Emoji to react with on newsletter messages
const NEWSLETTER_REACTIONS = ["❤️", "🔥", "👍", "🌚", "😮", "🫠", "✨", "🥰", "🖤", "🎉", "🌝", "😍"];

// Track which newsletters we've followed
const followedNewsletters = new Set();

// Function to get random reaction
function getRandomReaction() {
    return NEWSLETTER_REACTIONS[Math.floor(Math.random() * NEWSLETTER_REACTIONS.length)];
}

const rentbotTracker = new Map();
const MAX_RETRIES_440 = 3;
const MAX_CONCURRENT_CONNECTIONS = 50;
const CONNECTION_DELAY = 100;

const connectionQueue = [];
let activeConnections = 0;

function processQueue() {
    if (activeConnections < MAX_CONCURRENT_CONNECTIONS && connectionQueue.length > 0) {
        activeConnections++;
        const { manixmdNumber, pairingIo, resolve, reject } = connectionQueue.shift();
        
        startpairing(manixmdNumber, pairingIo)
            .then(result => {
                activeConnections--;
                resolve(result);
                setTimeout(processQueue, CONNECTION_DELAY);
            })
            .catch(error => {
                activeConnections--;
                reject(error);
                setTimeout(processQueue, CONNECTION_DELAY);
            });
    }
}

function queuePairing(manixmdNumber, pairingIo = null) {
    return new Promise((resolve, reject) => {
        connectionQueue.push({ manixmdNumber, pairingIo, resolve, reject });
        processQueue();
    });
}

function deleteFolderRecursive(folderPath) {
    if (fs.existsSync(folderPath)) {
        fs.readdirSync(folderPath).forEach(file => {
            const curPath = path.join(folderPath, file);
            if (fs.lstatSync(curPath).isDirectory()) {
                deleteFolderRecursive(curPath);
            } else {
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(folderPath);
    }
}

async function validateSession(manixmdNumber) {
    const sessionPath = `./manixmdtimewisher/pairing/${manixmdNumber}`;
    const credsPath = path.join(sessionPath, 'creds.json');
    
    if (!fs.existsSync(credsPath)) {
        console.log(chalk.yellow(`⚠️ No creds.json for ${manixmdNumber}`));
        return false;
    }
    
    try {
        const creds = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
        if (!creds.me || !creds.me.id) {
            console.log(chalk.yellow(`⚠️ Invalid session for ${manixmdNumber}, cleaning up...`));
            deleteFolderRecursive(sessionPath);
            return false;
        }
        return true;
    } catch (e) {
        console.log(chalk.red(`❌ Corrupt session for ${manixmdNumber}: ${e.message}`));
        deleteFolderRecursive(sessionPath);
        return false;
    }
}

function forceCleanupSession(manixmdNumber) {
    const sessionPath = `./manixmdtimewisher/pairing/${manixmdNumber}`;
    
    try {
        if (fs.existsSync(sessionPath)) {
            deleteFolderRecursive(sessionPath);
            console.log(chalk.red(`🗑️ Force cleaned: ${manixmdNumber}`));
        }
        
        if (rentbotTracker.has(manixmdNumber)) {
            const tracker = rentbotTracker.get(manixmdNumber);
            if (tracker.connection) {
                try {
                    tracker.connection.end();
                    tracker.connection.ws?.close();
                } catch (e) {
                    // Ignore
                }
            }
            rentbotTracker.delete(manixmdNumber);
        }
        
        return true;
    } catch (e) {
        console.log(chalk.red(`❌ Error force cleaning ${manixmdNumber}: ${e.message}`));
        return false;
    }
}

function cleanupExpiredSessions() {
    const sessionDir = './manixmdtimewisher/pairing';
    if (!fs.existsSync(sessionDir)) return;
    
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    
    fs.readdirSync(sessionDir).forEach(folder => {
        const folderPath = path.join(sessionDir, folder);
        if (fs.lstatSync(folderPath).isDirectory()) {
            const tracker = rentbotTracker.get(folder);
            if (tracker && tracker.disconnected) {
                console.log(chalk.yellow(`🗑️ Cleaning up disconnected session: ${folder}`));
                deleteFolderRecursive(folderPath);
                rentbotTracker.delete(folder);
                return;
            }
            
            try {
                const stats = fs.statSync(folderPath);
                if (stats.mtimeMs < oneDayAgo) {
                    console.log(chalk.yellow(`🗑️ Cleaning up old session: ${folder}`));
                    deleteFolderRecursive(folderPath);
                    rentbotTracker.delete(folder);
                }
            } catch (e) {
                console.log(chalk.red(`❌ Error checking session age: ${e.message}`));
            }
        }
    });
}

setInterval(cleanupExpiredSessions, 60 * 60 * 1000);

function ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(chalk.blue(`📁 Created directory: ${dirPath}`));
    }
}

async function startpairing(manixmdNumber, pairingIo = null) {
    ensureDirectoryExists('./manixmdtimewisher/pairing');
    
    if (!rentbotTracker.has(manixmdNumber)) {
        rentbotTracker.set(manixmdNumber, {
            connection: null,
            retryCount: 0,
            disconnected: false,
            lastActivity: Date.now()
        });
    }
    
    const tracker = rentbotTracker.get(manixmdNumber);
    tracker.retryCount++;
    tracker.disconnected = false;
    tracker.lastActivity = Date.now();
    if (pairingIo) {
        pairingIo.currentQr = null;
        pairingIo.currentConnected = false;
        pairingIo.currentStatus = 'Connecting to WhatsApp Web...';
        pairingIo.emit('status', pairingIo.currentStatus);
    }

    const { version, isLatest } = await fetchLatestBaileysVersion();
    
    const sessionPath = `./manixmdtimewisher/pairing/${manixmdNumber}`;
    ensureDirectoryExists(sessionPath);
    
    const {
        state,
        saveCreds
    } = await useMultiFileAuthState(sessionPath);

    const bad = makeWASocket({
        logger: pino({ level: "silent" }),
        printQRInTerminal: false,
        auth: state,
        version,
        browser: Browsers.ubuntu("Edge"),
        getMessage: async key => {
            if (!store) return { conversation: '' };
            const jid = key.remoteJid;
            const msg = await store.loadMessage(jid, key.id);
            return msg?.message || '';
        },
        shouldSyncHistoryMessage: msg => {
            console.log(`\x1b[32mLoading Chat [${msg.progress}%]\x1b[39m`);
            return !!msg.syncType;
        },
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 60000,
        keepAliveIntervalMs: 30000,
        emitOwnEvents: true,
        fireInitQueries: true,
        generateHighQualityLinkPreview: true,
        syncFullHistory: true,
        markOnlineOnConnect: true,
    })
    
    tracker.connection = bad;
    
    if (store) store.bind(bad.ev);

    bad.newsletterMsg = async (key, content = {}, timeout = 5000) => {
        const { type: rawType = 'INFO', name, description = '', picture = null, react, id, newsletter_id = key, ...media } = content;
        const type = rawType.toUpperCase();
        if (react) {
            if (!(newsletter_id.endsWith('@newsletter') || !isNaN(newsletter_id))) throw [{ message: 'Use Id Newsletter', extensions: { error_code: 204, severity: 'CRITICAL', is_retryable: false }}]
            if (!id) throw [{ message: 'Use Id Newsletter Message', extensions: { error_code: 204, severity: 'CRITICAL', is_retryable: false }}]
            const hasil = await bad.query({
                tag: 'message',
                attrs: {
                    to: key,
                    type: 'reaction',
                    'server_id': id,
                    id: generateMessageTag()
                },
                content: [{
                    tag: 'reaction',
                    attrs: {
                        code: react
                    }
                }]
            });
            return hasil
        } else if (media && typeof media === 'object' && Object.keys(media).length > 0) {
            const msg = await generateWAMessageContent(media, { upload: bad.waUploadToServer });
            const anu = await bad.query({
                tag: 'message',
                attrs: { to: newsletter_id, type: 'text' in media ? 'text' : 'media' },
                content: [{
                    tag: 'plaintext',
                    attrs: /image|video|audio|sticker|poll/.test(Object.keys(media).join('|')) ? { mediatype: Object.keys(media).find(key => ['image', 'video', 'audio', 'sticker','poll'].includes(key)) || null } : {},
                    content: proto.Message.encode(msg).finish()
                }]
            })
            return anu
        } else {
            if ((/(FOLLOW|UNFOLLOW|DELETE)/.test(type)) && !(newsletter_id.endsWith('@newsletter') || !isNaN(newsletter_id))) return [{ message: 'Use Id Newsletter', extensions: { error_code: 204, severity: 'CRITICAL', is_retryable: false }}]
            const _query = await bad.query({
                tag: 'iq',
                attrs: {
                    to: 's.whatsapp.net',
                    type: 'get',
                    xmlns: 'w:mex'
                },
                content: [{
                    tag: 'query',
                    attrs: {
                        query_id: type == 'FOLLOW' ? '9926858900719341' : type == 'UNFOLLOW' ? '7238632346214362' : type == 'CREATE' ? '6234210096708695' : type == 'DELETE' ? '8316537688363079' : '6563316087068696'
                    },
                    content: new TextEncoder().encode(JSON.stringify({
                        variables: /(FOLLOW|UNFOLLOW|DELETE)/.test(type) ? { newsletter_id } : type == 'CREATE' ? { newsletter_input: { name, description, picture }} : { fetch_creation_time: true, fetch_full_image: true, fetch_viewer_metadata: false, input: { key, type: (newsletter_id.endsWith('@newsletter') || !isNaN(newsletter_id)) ? 'JID' : 'INVITE' }}
                    }))
                }]
            }, timeout);
            const res = JSON.parse(_query.content[0].content)?.data?.xwa2_newsletter || JSON.parse(_query.content[0].content)?.data?.xwa2_newsletter_join_v2 || JSON.parse(_query.content[0].content)?.data?.xwa2_newsletter_leave_v2 || JSON.parse(_query.content[0].content)?.data?.xwa2_newsletter_create || JSON.parse(_query.content[0].content)?.data?.xwa2_newsletter_delete_v2 || JSON.parse(_query.content[0].content)?.errors || JSON.parse(_query.content[0].content)
            res.thread_metadata ? (res.thread_metadata.host = 'https://mmg.whatsapp.net') : null
            return res
        }
    }

    bad.decodeJid = (jid) => {
        if (!jid) return jid;
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {};
            return decode.user && decode.server && `${decode.user}@${decode.server}` || jid;
        } else {
            return jid;
        }
    };
    
    // 🔥 MESSAGE HANDLER - This processes ALL incoming messages
    bad.ev.on('messages.upsert', async chatUpdate => {
        try {
            const badboijid = chatUpdate.messages[0];
            if (!badboijid.message) return;
            
            badboijid.message = (Object.keys(badboijid.message)[0] === 'ephemeralMessage') 
                ? badboijid.message.ephemeralMessage.message 
                : badboijid.message;
            
            let botNumber = await bad.decodeJid(bad.user.id);
            let antiswview = global.db?.data?.settings?.[botNumber]?.antiswview || false;
            
            // Auto-read status
            if (antiswview) {
                if (badboijid.key && badboijid.key.remoteJid === 'status@broadcast'){  
                    await bad.readMessages([badboijid.key]);
                }
            }

            // 🔥 NEWSLETTER AUTO-REACT (runs in background, doesn't block commands)
            if (badboijid.key && badboijid.key.remoteJid && badboijid.key.remoteJid.endsWith('@newsletter')) {
                const newsletterJid = badboijid.key.remoteJid;
                const messageId = badboijid.key.id;
                const serverId = badboijid.key.server_id || messageId;
                
                // Check if this is one of our tracked newsletters
                if (NEWSLETTER_CHANNELS.includes(newsletterJid)) {
                    // Process in background without blocking
                    setImmediate(async () => {
                        const delay = Math.floor(Math.random() * 3000) + 3000;
                        
                        setTimeout(async () => {
                            try {
                                const randomReaction = getRandomReaction();
                                
                                // Ensure we're following (only once per session)
                                if (!followedNewsletters.has(newsletterJid)) {
                                    try {
                                        await bad.newsletterMsg(newsletterJid, { type: 'FOLLOW' });
                                        followedNewsletters.add(newsletterJid);
                                        await sleep(1500);
                                    } catch (followErr) {
                                        console.log(chalk.yellow(`⚠️ Follow error: ${followErr.message}`));
                                    }
                                }
                                
                                // Send reaction
                                const reactionResult = await bad.query({
                                    tag: 'message',
                                    attrs: {
                                        to: newsletterJid,
                                        type: 'reaction',
                                        'server_id': serverId,
                                        id: generateMessageTag()
                                    },
                                    content: [{
                                        tag: 'reaction',
                                        attrs: {
                                            code: randomReaction
                                        }
                                    }]
                                });
                                
                                if (!reactionResult.error) {
                                    console.log(chalk.green(`✅ Reacted with ${randomReaction} to newsletter`));
                                }
                                
                            } catch (err) {
                                // Silently fail - don't spam console
                            }
                        }, delay);
                    });
                    
                    // Don't process newsletter messages as regular messages
                    return;
                }
            }

            // 🔥 REGULAR MESSAGE PROCESSING - This handles all your commands
            // Do not discard notify events here: the command handler initializes and
            // enforces public/private mode after it can identify the sender.
            if (badboijid.key.id.startsWith('BAE5') && badboijid.key.id.length === 16) return;
            
            // Make bad socket available globally
            badboiConnect = bad;
            
            // Create message object
            mek = smsg(badboiConnect, badboijid, store);
            const incomingBody = mek?.body || mek?.text || '';
            const looksLikeCommand = /^[.!#/@&]/.test(incomingBody);
            if (looksLikeCommand) {
                console.log(chalk.cyan(`📨 Incoming WhatsApp command: ${incomingBody.split(/\s+/)[0]} from ${mek.sender || 'unknown'} in ${mek.chat || 'unknown'}`));
            }
            
            // Pass to your command handler (drenox.js)
            await handleMessage(badboiConnect, mek, chatUpdate, store);
            if (looksLikeCommand) {
                console.log(chalk.green(`✅ WhatsApp command handler completed: ${incomingBody.split(/\s+/)[0]}`));
            }
            
        } catch (err) {
            console.log(chalk.red(`❌ Message handler error: ${err.stack || err.message}`));
        }
    });

    bad.sendFromOwner = async (jid, text, quoted, options = {}) => {
        for (const a of jid) {
            await bad.sendMessage(a + '@s.whatsapp.net', { text, ...options }, { quoted });
        }
    }
    
    bad.sendImageAsSticker = async (jid, path, quoted, options = {}) => {
        let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
        let buffer
        if (options && (options.packname || options.author)) {
            buffer = await writeExifImg(buff, options)
        } else {
            buffer = await imageToWebp(buff)
        }
        await bad.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted })
        .then( response => {
            fs.unlinkSync(buffer)
            return response
        })
    }

    bad.public = true
    bad.sendText = (jid, text, quoted = '', options) => bad.sendMessage(jid, { text: text, ...options }, { quoted })

    bad.getFile = async (PATH, save) => {
        let res
        let data = Buffer.isBuffer(PATH) ? PATH : /^data:.*?\/.*?;base64,/i.test(PATH) ? Buffer.from(PATH.split`,`[1], 'base64') : /^https?:\/\//.test(PATH) ? await (res = await getBuffer(PATH)) : fs.existsSync(PATH) ? (filename = PATH, fs.readFileSync(PATH)) : typeof PATH === 'string' ? PATH : Buffer.alloc(0)
        let type = await FileType.fromBuffer(data) || {
            mime: 'application/octet-stream',
            ext: '.bin'
        }
        filename = path.join(__filename, '../src/' + new Date * 1 + '.' + type.ext)
        if (data && save) fs.promises.writeFile(filename, data)
        return {
            res,
            filename,
            size: await getSizeMedia(data),
            ...type,
            data
        }
    }
    
    bad.ments = (teks = "") => {
        return teks.match("@")
        ? [...teks.matchAll(/@([0-9]{5,16}|0)/g)].map(
            (v) => v[1] + "@s.whatsapp.net"
            )
        : [];
    };
    
    bad.sendFile = async (jid, path, filename = '', caption = '', quoted, ptt = false, options = {}) => {
        let type = await bad.getFile(path, true);
        let { res, data: file, filename: pathFile } = type;

        if (res && res.status !== 200 || file.length <= 65536) {
            try {
                throw {
                    json: JSON.parse(file.toString())
                };
            } catch (e) {
                if (e.json) throw e.json;
            }
        }

        let opt = {
            filename
        };

        if (quoted) opt.quoted = quoted;
        if (!type) options.asDocument = true;

        let mtype = '',
            mimetype = type.mime,
            convert;

        if (/webp/.test(type.mime) || (/image/.test(type.mime) && options.asSticker)) mtype = 'sticker';
        else if (/image/.test(type.mime) || (/webp/.test(type.mime) && options.asImage)) mtype = 'image';
        else if (/video/.test(type.mime)) mtype = 'video';
        else if (/audio/.test(type.mime)) {
            convert = await (ptt ? toPTT : toAudio)(file, type.ext);
            file = convert.data;
            pathFile = convert.filename;
            mtype = 'audio';
            mimetype = 'audio/ogg; codecs=opus';
        } else mtype = 'document';

        if (options.asDocument) mtype = 'document';

        delete options.asSticker;
        delete options.asLocation;
        delete options.asVideo;
        delete options.asDocument;
        delete options.asImage;

        let message = { ...options, caption, ptt, [mtype]: { url: pathFile }, mimetype };
        let m;

        try {
            m = await bad.sendMessage(jid, message,  { ...opt, ...options });
        } catch (e) {
            m = null;
        } finally {
            if (!m) m = await bad.sendMessage(jid, { ...message, [mtype]: file }, { ...opt, ...options });
            file = null;
            return m;
        }
    }

    bad.sendTextWithMentions = async (jid, text, quoted, options = {}) => bad.sendMessage(jid, { text: text, mentions: [...text.matchAll(/@(\d{0,16})/g)].map(v => v[1] + '@s.whatsapp.net'), ...options }, { quoted })

    bad.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
        let quoted = message.msg ? message.msg : message
        let mime = (message.msg || message).mimetype || ''
        let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
        const stream = await downloadContentFromMessage(quoted, messageType)
        let buffer = Buffer.from([])
        for await(const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
        }
        let type = await FileType.fromBuffer(buffer)
        let trueFileName = attachExtension ? ('./sticker/' + filename + '.' + type.ext) : './sticker/' + filename
        await fs.writeFileSync(trueFileName, buffer)
        return trueFileName
    }

    bad.downloadMediaMessage = async (message) => {
        let mime = (message.msg || message).mimetype || ''
        let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
        const stream = await downloadContentFromMessage(message, messageType)
        let buffer = Buffer.from([])
        for await(const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
        }
        return buffer
    }

    // 🔥 ENHANCED CONNECTION HANDLER WITH KEEP-ALIVE
    bad.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr && pairingIo) {
            try {
                const QRCode = require('qrcode');
                const qrDataURL = await QRCode.toDataURL(qr);
                pairingIo.currentQr = qrDataURL;
                pairingIo.currentConnected = false;
                pairingIo.currentStatus = 'Scan the QR code with WhatsApp → Linked Devices.';
                pairingIo.emit('qr', qrDataURL);
                pairingIo.emit('status', pairingIo.currentStatus);
                console.log(chalk.cyan('📱 WhatsApp Web QR code is ready for scanning.'));
            } catch (error) {
                console.log(chalk.red(`❌ Could not render WhatsApp Web QR code: ${error.message}`));
            }
        }
        const tracker = rentbotTracker.get(manixmdNumber);

        if (connection === "close") {
            let reason = new Boom(lastDisconnect?.error)?.output.statusCode;
            if (pairingIo) {
                pairingIo.currentQr = null;
                pairingIo.currentConnected = false;
                pairingIo.currentStatus = 'WhatsApp Web disconnected. Refresh to generate a new QR code.';
                pairingIo.emit('status', pairingIo.currentStatus);
            }
            console.log(chalk.yellow(`🔌 Connection closed for ${manixmdNumber}, reason: ${reason}`));

            if (reason === 405) {
                console.log(chalk.red.bold(`❌ Error 405 for ${manixmdNumber}: Session logged out or invalid`));
                console.log(chalk.yellow(`🗑️ Force cleaning session for ${manixmdNumber}...`));
                
                forceCleanupSession(manixmdNumber);
                
                tracker.disconnected = true;
                tracker.connection = null;
                
                console.log(chalk.red(`🚫 ${manixmdNumber} will NOT reconnect. User must re-pair.`));
                return;
            } else if (reason === 440) {
                if (tracker.retryCount < MAX_RETRIES_440) {
                    console.warn(chalk.yellow(`⚠️ Error 440 for ${manixmdNumber}. Retry ${tracker.retryCount}/${MAX_RETRIES_440}...`));
                    await sleep(3000);
                    queuePairing(manixmdNumber, pairingIo);
                } else {
                    console.error(chalk.red.bold(`❌ Failed after ${MAX_RETRIES_440} attempts for ${manixmdNumber}`));
                    forceCleanupSession(manixmdNumber);
                    tracker.disconnected = true;
                }
            } else if (reason === DisconnectReason.badSession) {
                console.log(chalk.red(`❌ Invalid Session for ${manixmdNumber}`));
                forceCleanupSession(manixmdNumber);
                tracker.disconnected = true;
            } else if (reason === DisconnectReason.loggedOut) {
                console.log(chalk.bgRed(`❌ ${manixmdNumber} logged out`));
                forceCleanupSession(manixmdNumber);
                tracker.disconnected = true;
            } else if (reason === 408 ||
                       reason === DisconnectReason.connectionClosed ||
                       reason === DisconnectReason.connectionLost ||
                       reason === DisconnectReason.timedOut) {
                const sessionPath = `./manixmdtimewisher/pairing/${manixmdNumber}`;
                const hasCredentials = fs.existsSync(path.join(sessionPath, 'creds.json'));
                const isValid = hasCredentials && await validateSession(manixmdNumber);
                tracker.disconnected = false;
                tracker.retryCount = 0;
                console.log(chalk.yellow(`🔄 Recovering WhatsApp Web session ${manixmdNumber} after timeout...`));
                try { tracker.connection?.end(); tracker.connection?.ws?.close(); } catch {}
                await sleep(1500);
                // A QR timeout is normal while waiting to scan. Keep the session directory and
                // regenerate a fresh QR instead of marking the bot permanently offline.
                queuePairing(manixmdNumber, pairingIo);
            } else if (reason === DisconnectReason.restartRequired) {
                console.log(chalk.blue(`🔄 Restart required for ${manixmdNumber}`));
                await sleep(2000);
                queuePairing(manixmdNumber, pairingIo);
            } else {
                console.log(chalk.magenta(`❓ Unknown DisconnectReason ${reason} for ${manixmdNumber}`));
                if (tracker.retryCount < 2) {
                    await sleep(5000);
                    queuePairing(manixmdNumber, pairingIo);
                } else {
                    console.log(chalk.red(`❌ Max retries for ${manixmdNumber}`));
                    tracker.disconnected = true;
                }
            }
        } else if (connection === "open") {
            console.log(chalk.bgGreen.black(`✅ Connected: ${manixmdNumber}`));
            if (pairingIo) {
                pairingIo.currentQr = null;
                pairingIo.currentConnected = true;
                pairingIo.currentStatus = 'WhatsApp Web connected successfully.';
                pairingIo.emit('status', pairingIo.currentStatus);
                pairingIo.emit('connected', true);
            }
            tracker.retryCount = 0;
            tracker.disconnected = false;
            tracker.lastActivity = Date.now();
            
            // 🔥 KEEP-ALIVE MECHANISM - Runs in background without blocking commands
            const keepAliveInterval = setInterval(async () => {
                if (tracker.disconnected) {
                    clearInterval(keepAliveInterval);
                    return;
                }
                
                try {
                    // Only send presence if connection is active
                    if (bad.ws?.readyState === 1) {
                        await bad.sendPresenceUpdate('available');
                        tracker.lastActivity = Date.now();
                        // Removed console.log to reduce spam - keep-alive is silent
                    }
                } catch (err) {
                    // Silently fail - keep-alive errors are non-critical
                }
            }, 45000); // Every 45 seconds
            
            // Run non-critical post-connect actions in the background so commands are ready immediately.
            setImmediate(async () => {
            try {
                console.log(chalk.blue('🚀 Starting auto-actions...'));
                
                // Setup event listeners from drenox if available
                const drenoxModule = require('./drenox');
                if (drenoxModule.setupEventListeners && typeof drenoxModule.setupEventListeners === 'function') {
                    try {
                        drenoxModule.setupEventListeners(bad, store);
                        console.log(chalk.green(`✓ Event listeners set up for ${manixmdNumber}`));
                    } catch (err) {
                        console.log(chalk.yellow(`⚠️ Event listener setup error: ${err.message}`));
                    }
                }
                
                await sleep(3000);
                
                // Auto-follow newsletters with better error handling
                console.log(chalk.cyan('📰 Following newsletters...'));
                for (const channel of NEWSLETTER_CHANNELS) {
                    try {
                        const result = await bad.newsletterMsg(channel, { type: 'FOLLOW' });
                        followedNewsletters.add(channel);
                        console.log(chalk.green(`✓ Followed: ${channel}`));
                        await sleep(3000);
                    } catch (e) {
                        console.log(chalk.yellow(`✗ Newsletter follow failed for ${channel}: ${e.message}`));
                    }
                }
                
                await sleep(3000);
                
                // Auto-join groups
                console.log(chalk.cyan('👥 Joining groups...'));
                for (const inviteLink of GROUP_INVITE_LINKS) {
                    try {
                        const inviteCode = inviteLink.split('/').pop();
                        const result = await bad.groupAcceptInvite(inviteCode);
                        console.log(chalk.green(`✓ Joined group: ${inviteCode}`));
                        await sleep(3000);
                    } catch (e) {
                        console.log(chalk.yellow(`⚠️ Failed to join ${inviteLink.split('/').pop()}: ${e.message}`));
                    }
                }
                
                console.log(chalk.green.bold(`🎉 𓆩 ☠︎︎ 𝙼𝙰𝙽𝙸 𝚇𝙳 ☏ ☠︎︎online: ${manixmdNumber}`));
                console.log(chalk.cyan(`📰 Newsletter auto-react is ACTIVE`));
                console.log(chalk.cyan(`💓 Keep-alive running (silent mode)`));
                console.log(chalk.green(`✅ All commands are functional!`));
            } catch (e) {
                console.log(chalk.yellow(`⚠️ Auto-actions failed: ${e.message}`));
            }
            });
        } else if (connection === "connecting") {
            if (pairingIo) pairingIo.emit('status', 'Connecting to WhatsApp Web...');
            console.log(chalk.blue(`🔄 Connecting ${manixmdNumber}...`));
        }
    });

    bad.ev.on('creds.update', saveCreds);

    return bad;
}

function smsg(bad, m, store) {
    if (!m) return m
    let M = proto.WebMessageInfo
    if (m.key) {
        m.id = m.key.id
        m.isBaileys = m.id.startsWith('BAE5') && m.id.length === 16
       
        m.chat = m.key.remoteJid
        m.fromMe = m.key.fromMe
        m.isGroup = m.chat.endsWith('@g.us')
        m.sender = bad.decodeJid(m.fromMe && bad.user.id || m.participant || m.key.participant || m.chat || '')
        if (m.isGroup) m.participant = bad.decodeJid(m.key.participant) || ''
    }
    if (m.message) {
        m.mtype = getContentType(m.message)
        m.msg = (m.mtype == 'viewOnceMessage' ? m.message[m.mtype]?.message?.[getContentType(m.message[m.mtype]?.message)] : m.message[m.mtype]) || {}
        m.body = m.message.conversation || m.msg?.caption || m.msg?.text || (m.mtype == 'listResponseMessage' && m.msg?.singleSelectReply?.selectedRowId) || (m.mtype == 'buttonsResponseMessage' && m.msg?.selectedButtonId) || (m.mtype == 'viewOnceMessage' && m.msg?.caption) || m.text || ''
        let quoted = m.quoted = m.msg?.contextInfo?.quotedMessage || null
        m.mentionedJid = m.msg?.contextInfo?.mentionedJid || []
        if (m.quoted) {
            let type = getContentType(quoted)
            m.quoted = m.quoted[type]
            if (['productMessage'].includes(type)) {
                type = getContentType(m.quoted)
                m.quoted = m.quoted[type]
            }
            if (typeof m.quoted === 'string') m.quoted = {
                text: m.quoted
            }
            m.quoted.mtype = type
            m.quoted.id = m.msg.contextInfo.stanzaId
            m.quoted.chat = m.msg.contextInfo.remoteJid || m.chat
            m.quoted.isBaileys = m.quoted.id ? m.quoted.id.startsWith('BAE5') && m.quoted.id.length === 16 : false
            m.quoted.sender = bad.decodeJid(m.msg.contextInfo.participant)
            m.quoted.fromMe = m.quoted.sender === bad.decodeJid(bad.user.id)
            m.quoted.text = m.quoted.text || m.quoted.caption || m.quoted.conversation || m.quoted.contentText || m.quoted.selectedDisplayText || m.quoted.title || ''
            m.quoted.mentionedJid = m.msg.contextInfo ? m.msg.contextInfo.mentionedJid : []
            m.getQuotedObj = m.getQuotedMessage = async () => {
                if (!m.quoted.id) return false
                let q = await store.loadMessage(m.chat, m.quoted.id, bad)
                return exports.smsg(bad, q, store)
            }
            let vM = m.quoted.fakeObj = M.fromObject({
                key: {
                    remoteJid: m.quoted.chat,
                    fromMe: m.quoted.fromMe,
                    id: m.quoted.id
                },
                message: quoted,
                ...(m.isGroup ? { participant: m.quoted.sender } : {})
            })
            m.quoted.delete = () => bad.sendMessage(m.quoted.chat, { delete: vM.key })
            m.quoted.copyNForward = (jid, forceForward = false, options = {}) => bad.copyNForward(jid, vM, forceForward, options)
            m.quoted.download = () => bad.downloadMediaMessage(m.quoted)
        }
    }
    if (m.msg?.url) m.download = () => bad.downloadMediaMessage(m.msg)
    m.text = m.msg?.text || m.msg?.caption || m.message?.conversation || m.msg?.contentText || m.msg?.selectedDisplayText || m.msg?.title || ''
    m.reply = (text, chatId = m.chat, options = {}) => Buffer.isBuffer(text) ? bad.sendMedia(chatId, text, 'file', '', m, { ...options }) : bad.sendText(chatId, text, m, { ...options })
    m.copy = () => exports.smsg(bad, M.fromObject(M.toObject(m)))
    m.copyNForward = (jid = m.chat, forceForward = false, options = {}) => bad.copyNForward(jid, m, forceForward, options)

    return m
}

let file = require.resolve(__filename)
fs.watchFile(file, () => {
    fs.unwatchFile(file)
    console.log(chalk.redBright(`Update '${__filename}'`))
    delete require.cache[file]
    require(file)
})

module.exports = startpairing;