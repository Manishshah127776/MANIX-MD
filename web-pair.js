const {
    default: makeWASocket,
    useMultiFileAuthState,
    Browsers,
    fetchLatestBaileysVersion
} = require("malvin-baileys");
const pino = require('pino');
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');

async function startWebPairing(io) {
    const { version } = await fetchLatestBaileysVersion();
    const sessionPath = path.join(__dirname, 'manixmdstorage', 'web-session');
    
    if (!fs.existsSync(sessionPath)) {
        fs.mkdirSync(sessionPath, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

    const sock = makeWASocket({
        logger: pino({ level: "silent" }),
        printQRInTerminal: false,
        auth: state,
        version,
        browser: Browsers.ubuntu("Chrome"),
    });

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('New QR Code generated');
            const qrDataURL = await QRCode.toDataURL(qr);
            io.emit('qr', qrDataURL);
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== 401;
            console.log('Connection closed. Reconnecting:', shouldReconnect);
            if (shouldReconnect) {
                startWebPairing(io);
            } else {
                io.emit('status', 'Logged out. Please refresh to pair again.');
            }
        } else if (connection === 'open') {
            console.log('Connection opened successfully');
            io.emit('status', 'Connected! Your bot is now active.');
            io.emit('connected', true);
        }
    });

    sock.ev.on('creds.update', saveCreds);

    return sock;
}

module.exports = { startWebPairing };
