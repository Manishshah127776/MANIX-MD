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
const pino = require('pino')
const FileType = require('file-type')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { promisify } = require('util')
const { execFile } = require('child_process')
const execFileAsync = promisify(execFile)

// WhatsApp has recently rejected several otherwise-valid Baileys handshakes with
// HTTP 405. Keep the currently reported working tuple configurable for recovery.
const BAILEYS_VERSION = (process.env.BAILEYS_VERSION || '2,3000,1034074495')
    .split(',')
    .map(value => Number.parseInt(value.trim(), 10))
const BAILEYS_BROWSER = (process.env.BAILEYS_BROWSER || 'MANI XMD,Chrome,145.0.0')
    .split(',')
    .map(value => value.trim())

// Use a configurable auth root so Render Persistent Disk (for example /var/data)
// can retain WhatsApp credentials across restarts and redeploys.
const AUTH_ROOT = path.resolve(process.env.WHATSAPP_AUTH_DIR || path.join(__dirname, 'manixmdtimewisher', 'pairing'));
const SESSION_TTL_DAYS = Math.max(7, Number.parseInt(process.env.WHATSAPP_SESSION_TTL_DAYS || '30', 10));
const sessionPathFor = (manixmdNumber) => path.join(AUTH_ROOT, manixmdNumber);

let themeemoji = "😎";
const chalk = require('chalk')
const { writeExif, imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./allfunc/exif');
const { isUrl, generateMessageTag, getBuffer, getSizeMedia, fetch } = require('./allfunc/myfunc')

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const MEDIA_TMP_DIR = path.join(__dirname, '.media-tmp')

async function convertAudioBuffer(data, inputExt = '.bin', voiceNote = false) {
    ensureDirectoryExists(MEDIA_TMP_DIR)
    const id = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`
    const inputPath = path.join(MEDIA_TMP_DIR, `${id}${inputExt.startsWith('.') ? inputExt : `.${inputExt}`}`)
    const outputPath = path.join(MEDIA_TMP_DIR, `${id}.ogg`)
    fs.writeFileSync(inputPath, data)
    try {
        const args = ['-y', '-i', inputPath, '-vn', '-c:a', 'libopus', '-b:a', voiceNote ? '64k' : '128k']
        if (voiceNote) args.push('-ar', '48000', '-ac', '1')
        args.push(outputPath)
        await execFileAsync('ffmpeg', args, { timeout: 120000 })
        return { data: fs.readFileSync(outputPath), filename: outputPath }
    } finally {
        for (const filePath of [inputPath, outputPath]) {
            try {
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
            } catch (cleanupError) {
                console.warn('Pairing media temp cleanup failed:', cleanupError.message)
            }
        }
    }
}

const store = makeInMemoryStore ? makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) }) : null;
let msgRetryCounterCache;

// Resolve the configured public channel invite to its native newsletter JID after login.
const NEWSLETTER_INVITE_LINKS = [
    process.env.WHATSAPP_CHANNEL_LINK || 'https://whatsapp.com/channel/0029Vb8XvFqD8SDvDPkdqG1f'
];
const NEWSLETTER_CHANNELS = process.env.WHATSAPP_CHANNEL_JID ? [process.env.WHATSAPP_CHANNEL_JID] : [];

// Only actual WhatsApp group invite URLs belong here. The configured channel is handled above.
const GROUP_INVITE_LINKS = [];

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

function normalizePairingPhoneNumber(value) {
    const normalized = String(value || '').replace(/[\s()+-]/g, '');
    if (!/^\d{7,15}$/.test(normalized) || normalized.startsWith('0')) {
        throw new Error('Enter a WhatsApp number with country code, using 7 to 15 digits.');
    }
    return normalized;
}

async function requestPairingCode(manixmdNumber, phoneNumber, pairingIo = null) {
    const normalizedPhoneNumber = normalizePairingPhoneNumber(phoneNumber);
    let tracker = rentbotTracker.get(manixmdNumber);
    let socket = tracker?.connection;

    if (!socket || tracker?.disconnected) {
        socket = await startpairing(manixmdNumber, pairingIo);
        tracker = rentbotTracker.get(manixmdNumber);
    }

    if (!socket || typeof socket.requestPairingCode !== 'function' || !tracker) {
        throw new Error('The WhatsApp pairing socket is not ready. Please try again.');
    }
    if (socket.authState?.creds?.registered) {
        throw new Error('This WhatsApp session is already registered. Use the connected session instead.');
    }

    const registrationReady = tracker.registrationReadyPromise;
    if (registrationReady) {
        await Promise.race([
            registrationReady,
            new Promise((_, reject) => setTimeout(() => reject(new Error('WhatsApp did not reach the pairing stage in time. Please try QR pairing or retry later.')), 20000))
        ]);
    } else if (typeof socket.waitForSocketOpen === 'function') {
        await Promise.race([
            socket.waitForSocketOpen(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('WhatsApp socket did not become ready in time.')), 20000))
        ]);
    }

    const code = await socket.requestPairingCode(normalizedPhoneNumber);
    if (!code) throw new Error('WhatsApp did not return a pairing code.');

    if (pairingIo) {
        pairingIo.currentPairingCode = String(code);
        pairingIo.currentPairingCodeExpiresAt = Date.now() + 120000;
        pairingIo.currentStatus = 'WhatsApp pairing code generated. Enter it in Linked devices.';
        pairingIo.emit('pairing-code', pairingIo.currentPairingCode);
        pairingIo.emit('status', pairingIo.currentStatus);
        setTimeout(() => {
            if (pairingIo.currentPairingCode === String(code)) {
                pairingIo.currentPairingCode = null;
                pairingIo.currentPairingCodeExpiresAt = 0;
                pairingIo.emit('pairing-code', null);
                pairingIo.emit('status', 'Pairing code expired. Request a new code if needed.');
            }
        }, 120000);
    }

    console.log(chalk.cyan(`🔐 WhatsApp pairing code generated for ${normalizedPhoneNumber.slice(0, 3)}***${normalizedPhoneNumber.slice(-2)}.`));
    return String(code);
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
    const sessionPath = sessionPathFor(manixmdNumber);
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
    const sessionPath = sessionPathFor(manixmdNumber);
    
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
    if (!fs.existsSync(AUTH_ROOT)) return;

    const cutoff = Date.now() - (SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
    for (const folder of fs.readdirSync(AUTH_ROOT)) {
        const folderPath = path.join(AUTH_ROOT, folder);
        try {
            if (!fs.lstatSync(folderPath).isDirectory()) continue;

            // Never remove a credentialed session automatically. A valid session
            // may be temporarily disconnected and must survive reconnects/redeploys.
            if (fs.existsSync(path.join(folderPath, 'creds.json'))) continue;

            const stats = fs.statSync(folderPath);
            if (stats.mtimeMs < cutoff) {
                console.log(chalk.yellow(`🗑️ Cleaning up unpaired session older than ${SESSION_TTL_DAYS} days: ${folder}`));
                deleteFolderRecursive(folderPath);
                rentbotTracker.delete(folder);
            }
        } catch (e) {
            console.log(chalk.red(`❌ Error checking session age for ${folder}: ${e.message}`));
        }
    }
}

setInterval(cleanupExpiredSessions, 60 * 60 * 1000);

function ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(chalk.blue(`📁 Created directory: ${dirPath}`));
    }
}

async function startpairing(manixmdNumber, pairingIo = null) {
    ensureDirectoryExists(AUTH_ROOT);
    console.log(chalk.blue(`🔐 WhatsApp auth root: ${AUTH_ROOT}`));
    
    if (!rentbotTracker.has(manixmdNumber)) {
        rentbotTracker.set(manixmdNumber, {
            connection: null,
            retryCount: 0,
            disconnected: false,
            lastActivity: Date.now(),
            connectedNoticeAt: 0,
            keepAliveInterval: null,
            eventListenersAttached: false
        });
    }
    
    const tracker = rentbotTracker.get(manixmdNumber);
    if (tracker.keepAliveInterval) {
        clearInterval(tracker.keepAliveInterval);
        tracker.keepAliveInterval = null;
    }
    tracker.retryCount++;
    tracker.disconnected = false;
    tracker.lastActivity = Date.now();
    let resolveRegistrationReady;
    let rejectRegistrationReady;
    tracker.registrationReadyPromise = new Promise((resolve, reject) => {
        resolveRegistrationReady = resolve;
        rejectRegistrationReady = reject;
    });
    // A rejected gate may be intentionally consumed by a dashboard request; attach a
    // no-op rejection handler so a failed reconnect does not create an unhandled rejection.
    tracker.registrationReadyPromise.catch(() => {});
    tracker.resolveRegistrationReady = resolveRegistrationReady;
    tracker.rejectRegistrationReady = rejectRegistrationReady;
    if (pairingIo) {
        pairingIo.currentQr = null;
        pairingIo.currentPairingCode = null;
        pairingIo.currentPairingCodeExpiresAt = 0;
        pairingIo.currentConnected = false;
        pairingIo.currentStatus = 'Connecting to WhatsApp Web...';
        pairingIo.emit('status', pairingIo.currentStatus);
        pairingIo.emit('connected', false);
    }

    const sessionPath = sessionPathFor(manixmdNumber);
    ensureDirectoryExists(sessionPath);
    
    const {
        state,
        saveCreds
    } = await useMultiFileAuthState(sessionPath);

    const bad = makeWASocket({
        logger: pino({ level: "silent" }),
        printQRInTerminal: false,
        auth: state,
        version: BAILEYS_VERSION,
        browser: BAILEYS_BROWSER,
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
    // Expose the auth state for the pairing-code guard without changing Baileys internals.
    bad.authState = state;
    
    tracker.connection = bad;
    tracker.eventListenersAttached = false;
    bad.newsletterJids = new Set(NEWSLETTER_CHANNELS);
    
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
        return await bad.sendMessage(jid, { sticker: buffer }, { quoted })
    }

    bad.sendVideoAsSticker = async (jid, input, quoted, options = {}) => {
        const buff = Buffer.isBuffer(input) ? input : /^data:.*?\/.*?;base64,/i.test(input) ? Buffer.from(input.split(',')[1], 'base64') : /^https?:\/\//i.test(input) ? await getBuffer(input) : fs.existsSync(input) ? fs.readFileSync(input) : Buffer.alloc(0)
        const sticker = options && (options.packname || options.author) ? await writeExifVid(buff, options) : await videoToWebp(buff)
        return await bad.sendMessage(jid, { sticker }, { quoted })
    }

    bad.public = true
    bad.sendText = (jid, text, quoted = '', options) => bad.sendMessage(jid, { text: text, ...options }, { quoted })

    bad.getFile = async (PATH, save) => {
        let res
        let sourcePath = null
        let data = Buffer.isBuffer(PATH) ? PATH : /^data:.*?\/.*?;base64,/i.test(PATH) ? Buffer.from(PATH.split`,`[1], 'base64') : /^https?:\/\//.test(PATH) ? await (res = await getBuffer(PATH)) : fs.existsSync(PATH) ? (sourcePath = PATH, fs.readFileSync(PATH)) : typeof PATH === 'string' ? Buffer.from(PATH) : Buffer.alloc(0)
        let type = await FileType.fromBuffer(data) || {
            mime: 'application/octet-stream',
            ext: 'bin'
        }
        const outputDir = path.join(__dirname, 'src')
        ensureDirectoryExists(outputDir)
        const filename = sourcePath && !save ? sourcePath : path.join(outputDir, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${String(type.ext).replace(/^\./, '')}`)
        if (data && save && filename !== sourcePath) await fs.promises.writeFile(filename, data)
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
            convert = await convertAudioBuffer(file, type.ext, ptt);
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

    // Compatibility helper used by smsg.reply(Buffer) and legacy command paths.
    bad.sendMedia = async (jid, data, type = 'file', filename = '', quoted, options = {}) => {
        const mediaOptions = { ...options }
        if (type === 'file' || type === 'document') mediaOptions.asDocument = true
        if (type === 'sticker') mediaOptions.asSticker = true
        if (type === 'image') mediaOptions.asImage = true
        if (type === 'video') mediaOptions.asVideo = true
        return bad.sendFile(jid, data, filename, mediaOptions.caption || '', quoted, Boolean(mediaOptions.ptt), mediaOptions)
    }

    bad.sendTextWithMentions = async (jid, text, quoted, options = {}) => bad.sendMessage(jid, { text: text, mentions: [...text.matchAll(/@(\d{0,16})/g)].map(v => v[1] + '@s.whatsapp.net'), ...options }, { quoted })

    bad.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
        let quoted = message.msg ? message.msg : message
        let mime = (message.msg || message).mimetype || ''
        let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
        const stream = await downloadContentFromMessage(quoted, messageType)
        ensureDirectoryExists(path.join(__dirname, 'sticker'))
        let buffer = Buffer.from([])
        for await(const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
        }
        let type = await FileType.fromBuffer(buffer)
        const safeBaseName = filename || `${Date.now()}`
        let trueFileName = attachExtension ? path.join(__dirname, 'sticker', safeBaseName + '.' + type.ext) : path.join(__dirname, 'sticker', safeBaseName)
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
        const tracker = rentbotTracker.get(manixmdNumber);
        if (!tracker) return;

        if (qr) {
            tracker.resolveRegistrationReady?.(true);
            tracker.resolveRegistrationReady = null;
            tracker.rejectRegistrationReady = null;
        }
        if (qr && pairingIo) {
            try {
                const QRCode = require('qrcode');
                const qrDataURL = await QRCode.toDataURL(qr);
                pairingIo.currentQr = qrDataURL;
                pairingIo.currentConnected = false;
                pairingIo.currentStatus = 'WhatsApp is waiting for a fresh QR scan.';
                pairingIo.emit('qr', qrDataURL);
                pairingIo.emit('connected', false);
                pairingIo.emit('status', pairingIo.currentStatus);
                console.log(chalk.cyan('📱 WhatsApp Web QR code is ready for scanning.'));
            } catch (error) {
                console.log(chalk.red(`❌ Could not render WhatsApp Web QR code: ${error.message}`));
            }
        }
        if (connection === "close") {
            if (tracker.keepAliveInterval) {
                clearInterval(tracker.keepAliveInterval);
                tracker.keepAliveInterval = null;
            }
            let reason = new Boom(lastDisconnect?.error)?.output.statusCode;
            if (pairingIo) {
                pairingIo.currentQr = null;
                pairingIo.currentPairingCode = null;
                pairingIo.currentPairingCodeExpiresAt = 0;
                pairingIo.currentConnected = false;
                pairingIo.currentStatus = `WhatsApp Web disconnected (code ${reason}). Reconnecting or waiting for a new QR.`;
                pairingIo.emit('status', pairingIo.currentStatus);
                pairingIo.emit('connected', false);
            }
            console.log(chalk.yellow(`🔌 Connection closed for ${manixmdNumber}, reason: ${reason}`));
            tracker.rejectRegistrationReady?.(new Error(`WhatsApp connection closed before pairing became ready (code ${reason}).`));
            tracker.resolveRegistrationReady = null;
            tracker.rejectRegistrationReady = null;

            if (reason === 405) {
                console.log(chalk.red.bold(`❌ Error 405 for ${manixmdNumber}: Session logged out or invalid`));
                console.log(chalk.yellow(`🗑️ Force cleaning session for ${manixmdNumber}...`));

                forceCleanupSession(manixmdNumber);
                tracker.disconnected = false;
                tracker.connection = null;
                tracker.eventListenersAttached = false;

                // Render may start with an empty or non-persistent auth directory. After
                // cleanup, keep the dashboard usable by generating a fresh QR automatically.
                console.log(chalk.cyan(`📱 Re-queueing ${manixmdNumber} for a fresh WhatsApp Web QR.`));
                await sleep(1500);
                queuePairing(manixmdNumber, pairingIo);
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
                const sessionPath = sessionPathFor(manixmdNumber);
                const hasCredentials = fs.existsSync(path.join(sessionPath, 'creds.json'));
                const isValid = hasCredentials && await validateSession(manixmdNumber);
                tracker.disconnected = false;
                tracker.retryCount = 0;
                console.log(chalk.yellow(`🔄 Recovering WhatsApp Web session ${manixmdNumber} after timeout...`));
                try {
                    tracker.connection?.end();
                    tracker.connection?.ws?.close();
                } catch (closeError) {
                    console.warn(`WhatsApp socket close cleanup failed for ${manixmdNumber}:`, closeError.message)
                }
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
                pairingIo.currentPairingCode = null;
                pairingIo.currentPairingCodeExpiresAt = 0;
                pairingIo.currentConnected = true;
                pairingIo.currentStatus = 'WhatsApp Web connected successfully.';
                pairingIo.emit('status', pairingIo.currentStatus);
                pairingIo.emit('connected', true);
            }
            tracker.retryCount = 0;
            tracker.disconnected = false;
            tracker.lastActivity = Date.now();
            
            // 🔥 KEEP-ALIVE MECHANISM - Runs in background without blocking commands
            if (tracker.keepAliveInterval) clearInterval(tracker.keepAliveInterval);
            const keepAliveInterval = setInterval(async () => {
                if (tracker.disconnected) {
                    clearInterval(keepAliveInterval);
                    if (tracker.keepAliveInterval === keepAliveInterval) tracker.keepAliveInterval = null;
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
            tracker.keepAliveInterval = keepAliveInterval;
            
            // Run non-critical post-connect actions in the background so commands are ready immediately.
            setImmediate(async () => {
            try {
                console.log(chalk.blue('🚀 Starting auto-actions...'));

                // Send one connected confirmation per connection cycle. The timestamp
                // prevents duplicate notices if Baileys emits `open` more than once.
                if (!tracker.connectedNoticeAt || Date.now() - tracker.connectedNoticeAt > 30000) {
                    tracker.connectedNoticeAt = Date.now();
                    try {
                        await bad.sendMessage(manixmdNumber, {
                            text: `╭━━〔 ✅ ᴡʜᴀᴛsᴀᴘᴘ ᴄᴏɴɴᴇᴄᴛᴇᴅ 〕━━╮\n┃\n┃ 🤖 ʙᴏᴛ: 𝙼𝙰𝙽𝙸 𝚇𝙼𝙳\n┃ 📡 sᴛᴀᴛᴜs: ᴏɴʟɪɴᴇ\n┃\n┃ 📢 Follow the MANIX MD 💐 channel:\n┃ https://whatsapp.com/channel/0029Vb8XvFqD8SDvDPkdqG1f\n┃\n┃ ☎ Contact: wa.me/9779807044421\n┃\n╰━━━━━━━━━━━━━━━━━━━━━━╯`
                        });
                        console.log(chalk.green(`✅ Connected message sent for ${manixmdNumber}`));
                    } catch (noticeError) {
                        console.log(chalk.yellow(`⚠️ Connected message failed: ${noticeError.message}`));
                    }
                }
                
                // Setup auxiliary listeners once per socket. Repeated `open` events must not
                // attach duplicate group/newsletter/status handlers.
                if (!tracker.eventListenersAttached) {
                    tracker.eventListenersAttached = true;
                    const drenoxModule = require('./drenox');
                    if (drenoxModule.setupEventListeners && typeof drenoxModule.setupEventListeners === 'function') {
                        try {
                            drenoxModule.setupEventListeners(bad, store);
                            console.log(chalk.green(`✓ Event listeners set up for ${manixmdNumber}`));
                        } catch (err) {
                            tracker.eventListenersAttached = false;
                            console.log(chalk.yellow(`⚠️ Event listener setup error: ${err.message}`));
                        }
                    }
                }
                
                await sleep(3000);
                
                // Resolve and follow the configured public channel using Baileys' native API.
                console.log(chalk.cyan('📰 Resolving configured newsletter channel...'));
                for (const inviteLink of NEWSLETTER_INVITE_LINKS) {
                    try {
                        const inviteKey = String(inviteLink).split('/').filter(Boolean).pop();
                        const metadata = typeof bad.newsletterMetadata === 'function'
                            ? await bad.newsletterMetadata('invite', inviteKey)
                            : null;
                        const channel = metadata?.id;
                        if (channel && !NEWSLETTER_CHANNELS.includes(channel)) NEWSLETTER_CHANNELS.push(channel);
                    } catch (e) {
                        console.log(chalk.yellow(`✗ Newsletter resolution skipped: ${e.message}`));
                    }
                }

                console.log(chalk.cyan('📰 Following newsletters...'));
                for (const channel of NEWSLETTER_CHANNELS) {
                    try {
                        if (typeof bad.newsletterFollow === 'function') await bad.newsletterFollow(channel);
                        else await bad.newsletterMsg(channel, { type: 'FOLLOW' });
                        followedNewsletters.add(channel);
                        console.log(chalk.green(`✓ Followed: ${channel}`));
                        await sleep(3000);
                    } catch (e) {
                        console.log(chalk.yellow(`✗ Newsletter follow failed for ${channel}: ${e.message}`));
                    }
                }
                bad.newsletterJids = new Set(NEWSLETTER_CHANNELS);
                
                await sleep(3000);
                
                // Auto-join configured WhatsApp groups only.
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
                
                console.log(chalk.green.bold(`🎉 𓆩 ☠︎︎ 𝙼𝙰𝙽𝙸 𝚇𝙼𝙳 ☏ ☠︎︎online: ${manixmdNumber}`));
                console.log(chalk.cyan(`📰 Newsletter auto-react is ACTIVE`));
                console.log(chalk.cyan(`💓 Keep-alive running (silent mode)`));
                console.log(chalk.green(`✅ All commands are functional!`));
            } catch (e) {
                console.log(chalk.yellow(`⚠️ Auto-actions failed: ${e.message}`));
            }
            });
        } else if (connection === "connecting") {
            if (pairingIo) {
                pairingIo.currentConnected = false;
                pairingIo.currentStatus = 'Connecting to WhatsApp Web...';
                pairingIo.emit('status', pairingIo.currentStatus);
                pairingIo.emit('connected', false);
            }
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
        m.isGroup = typeof m.chat === 'string' && m.chat.endsWith('@g.us')
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
                if (!store || typeof store.loadMessage !== 'function') return false
                let q = await store.loadMessage(m.chat, m.quoted.id, bad)
                return q ? exports.smsg(bad, q, store) : false
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
module.exports.requestPairingCode = requestPairingCode;
module.exports.normalizePairingPhoneNumber = normalizePairingPhoneNumber;