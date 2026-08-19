/**
   * Create By 𝙼𝙰𝙽𝙸 𝚇𝙼𝙳 ☏
   * Contact Me on 9779807044421
*/

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const express = require('express');
const { Server } = require('socket.io');
const readline = require('readline');
const chalk = require('chalk');
const figlet = require('figlet');

const AUTH_FILE = './auth.json';
const PAIRING_DIR = path.resolve(process.env.WHATSAPP_AUTH_DIR || path.join(__dirname, 'manixmdtimewisher', 'pairing'));
const SESSION_NAME = 'web-session';
const MULTI_DEVICE_ENABLED = true;
const MULTI_DEVICE_LINKING_METHODS = ['qr', 'phone-code'];
const startpairing = require('./pair');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const PORT = Number.parseInt(process.env.PORT || '10000', 10);

function logCommandAudit(drenoxModule) {
    const sourcePath = path.join(__dirname, 'drenox.js');
    let labels = [];
    let sourceError = null;
    try {
        const source = fs.readFileSync(sourcePath, 'utf8');
        labels = [...source.matchAll(/\bcase\s+(['\"])([^'\"]+)\1\s*:/g)].map(match => match[2]);
    } catch (error) {
        sourceError = error;
    }
    const duplicateLabels = [...new Set(labels.filter((label, index) => labels.indexOf(label) !== index))];
    const aliases = drenoxModule?.commandAliases || {};
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
    const dependencyNames = Object.keys(packageJson.dependencies || {});
    const missingDependencies = dependencyNames.filter(name => {
        try {
            require.resolve(name, { paths: [__dirname] });
            return false;
        } catch {
            return true;
        }
    });
    const failedModules = sourceError ? [{ file: 'drenox.js', error: sourceError.message }] : [];
    const brokenCommands = sourceError || duplicateLabels.length ? labels.length : 0;

    console.log('[COMMAND AUDIT]');
    console.log(`✓ Loaded commands: ${labels.length}`);
    console.log(`✓ Registered aliases: ${Object.keys(aliases).length}`);
    console.log(`${duplicateLabels.length ? '⚠' : '✓'} Duplicate commands: ${duplicateLabels.length}${duplicateLabels.length ? ` (${duplicateLabels.join(', ')})` : ''}`);
    console.log(`${failedModules.length ? '⚠' : '✓'} Failed command modules: ${failedModules.length}${failedModules.length ? ` (${failedModules.map(item => `${item.file}: ${item.error}`).join('; ')})` : ' (monolithic dispatcher loaded)'}`);
    console.log(`${missingDependencies.length ? '⚠' : '✓'} Missing dependencies: ${missingDependencies.length}${missingDependencies.length ? ` (${missingDependencies.join(', ')})` : ''}`);
    console.log(`${brokenCommands ? '✗' : '✓'} Broken commands: ${brokenCommands}`);
    return { labels, aliases, duplicateLabels, missingDependencies, failedModules, brokenCommands };
}

function startHealthServer() {
    const app = express();
    const server = http.createServer(app);
    const io = new Server(server);
    const sessionStates = new Map();
    const pairingCooldowns = new Map();

    const sessionIdForPhone = phoneNumber => `${phoneNumber}@s.whatsapp.net`;
    const sanitizeSessionId = value => {
        const cleaned = String(value || '').replace(/[^0-9A-Za-z_.@-]/g, '').slice(0, 80);
        return cleaned || SESSION_NAME;
    };
    const getSessionState = (sessionId = SESSION_NAME) => {
        const normalizedId = sanitizeSessionId(sessionId);
        if (!sessionStates.has(normalizedId)) {
            const state = {
                sessionId: normalizedId,
                currentQr: null,
                currentPairingCode: null,
                currentPairingCodeExpiresAt: 0,
                currentStatus: 'Checking WhatsApp session state...',
                currentConnected: false,
                startPromise: null,
                emit(event, value) {
                    if (event === 'qr') this.currentQr = value || null;
                    if (event === 'pairing-code') this.currentPairingCode = value || null;
                    if (event === 'status') this.currentStatus = String(value || '');
                    if (event === 'connected') this.currentConnected = Boolean(value);
                    io.emit('session-event', { sessionId: this.sessionId, event, value });
                    if (this.sessionId === SESSION_NAME) io.emit(event, value);
                    io.emit('session-list', [...sessionStates.values()].map(snapshot));
                }
            };
            sessionStates.set(normalizedId, state);
        }
        return sessionStates.get(normalizedId);
    };
    const snapshot = state => ({
        sessionId: state.sessionId,
        connected: Boolean(state.currentConnected),
        status: state.currentStatus,
        qrAvailable: Boolean(state.currentQr),
        pairingCodeAvailable: Boolean(state.currentPairingCode && state.currentPairingCodeExpiresAt > Date.now()),
        pairingCodeExpiresAt: state.currentPairingCodeExpiresAt || null,
        multiDevice: MULTI_DEVICE_ENABLED,
        linkingMethods: MULTI_DEVICE_LINKING_METHODS
    });
    const allSessions = () => {
        const merged = new Map([...sessionStates.values()].map(state => [state.sessionId, snapshot(state)]));
        const tracked = typeof startpairing.getTrackedSessionSummaries === 'function' ? startpairing.getTrackedSessionSummaries() : [];
        for (const item of tracked) {
            if (!merged.has(item.sessionId)) merged.set(item.sessionId, { ...item, qrAvailable: false, pairingCodeAvailable: false, pairingCodeExpiresAt: null });
        }
        return [...merged.values()];
    };
    const startSession = async (sessionId, state) => {
        if (state.startPromise) return state.startPromise;
        state.startPromise = startpairing(sessionId, state).finally(() => { state.startPromise = null; });
        return state.startPromise;
    };

    getSessionState(SESSION_NAME);
    app.use(express.json({ limit: '2kb' }));
    app.use(express.static(path.join(__dirname, 'public')));
    app.get('/healthz', (req, res) => res.status(200).send('ok'));
    app.get('/status', (req, res) => {
        const defaultState = getSessionState(SESSION_NAME);
        res.json({
            server: 'online',
            whatsappConnected: Boolean(defaultState.currentConnected),
            status: defaultState.currentStatus,
            qrAvailable: Boolean(defaultState.currentQr),
            pairingCodeAvailable: Boolean(defaultState.currentPairingCode && defaultState.currentPairingCodeExpiresAt > Date.now()),
            pairingCodeExpiresAt: defaultState.currentPairingCodeExpiresAt || null,
            multiDevice: MULTI_DEVICE_ENABLED,
            linkingMethods: MULTI_DEVICE_LINKING_METHODS,
            sessions: allSessions(),
            authDirectory: process.env.WHATSAPP_AUTH_DIR || 'local filesystem; configure a persistent mount for restart-safe pairing'
        });
    });
    app.get('/api/sessions', (req, res) => res.json({ ok: true, sessions: allSessions(), multiDevice: MULTI_DEVICE_ENABLED }));

    app.post('/api/session/start', async (req, res) => {
        res.set('Cache-Control', 'no-store');
        try {
            const phoneNumber = startpairing.normalizePairingPhoneNumber(req.body?.phoneNumber);
            const sessionId = sessionIdForPhone(phoneNumber);
            const state = getSessionState(sessionId);
            if (state.currentConnected) return res.status(409).json({ ok: false, sessionId, error: 'This WhatsApp number is already connected.' });
            state.currentStatus = 'Preparing a separate WhatsApp session...';
            state.emit('status', state.currentStatus);
            await startSession(sessionId, state);
            return res.json({ ok: true, sessionId, multiDevice: MULTI_DEVICE_ENABLED, status: state.currentStatus, instruction: 'Scan the QR with this specific WhatsApp number.' });
        } catch (error) {
            console.error(`Session start failed: ${error.message}`);
            const isInputError = /WhatsApp number with country code/i.test(error.message || '');
            return res.status(isInputError ? 400 : 503).json({ ok: false, error: error.message || 'WhatsApp session could not be started.' });
        }
    });

    app.post('/api/pair-code', async (req, res) => {
        res.set('Cache-Control', 'no-store');
        try {
            const phoneNumber = startpairing.normalizePairingPhoneNumber(req.body?.phoneNumber);
            const sessionId = sanitizeSessionId(req.body?.sessionId || sessionIdForPhone(phoneNumber));
            const state = getSessionState(sessionId);
            if (state.currentConnected) return res.status(409).json({ ok: false, sessionId, error: 'This WhatsApp number is already connected.' });
            const now = Date.now();
            const lastRequestAt = pairingCooldowns.get(sessionId) || 0;
            const cooldownMs = 30000;
            if (now - lastRequestAt < cooldownMs) {
                const retryAfter = Math.ceil((cooldownMs - (now - lastRequestAt)) / 1000);
                return res.status(429).json({ ok: false, sessionId, error: `Please wait ${retryAfter} seconds before requesting another pairing code.` });
            }
            pairingCooldowns.set(sessionId, now);
            state.currentPairingCode = null;
            state.currentPairingCodeExpiresAt = 0;
            state.currentStatus = 'Preparing WhatsApp pairing code...';
            state.emit('status', state.currentStatus);
            const code = await startpairing.requestPairingCode(sessionId, phoneNumber, state);
            return res.json({ ok: true, sessionId, code, expiresInSeconds: 120, multiDevice: MULTI_DEVICE_ENABLED, instruction: 'Open WhatsApp → Linked devices → Link with phone number and enter this code.' });
        } catch (error) {
            console.error(`Pairing-code request failed: ${error.message}`);
            const isInputError = /WhatsApp number with country code/i.test(error.message || '');
            return res.status(isInputError ? 400 : 503).json({ ok: false, error: error.message || 'WhatsApp pairing code is currently unavailable.' });
        }
    });

    io.on('connection', socket => {
        socket.emit('session-list', allSessions());
        for (const state of sessionStates.values()) {
            socket.emit('session-event', { sessionId: state.sessionId, event: 'status', value: state.currentStatus });
            socket.emit('session-event', { sessionId: state.sessionId, event: 'connected', value: Boolean(state.currentConnected) });
            if (state.currentQr) socket.emit('session-event', { sessionId: state.sessionId, event: 'qr', value: state.currentQr });
            if (state.currentPairingCode && state.currentPairingCodeExpiresAt > Date.now()) socket.emit('session-event', { sessionId: state.sessionId, event: 'pairing-code', value: state.currentPairingCode });
        }
    });

    server.listen(PORT, '0.0.0.0', () => {
        console.log(chalk.blue(`🌐 WhatsApp Multi-Device pairing dashboard listening on port ${PORT}`));
    });

    return { server, io, getSessionState, allSessions };
}

const autoLoadPairs = async () => {
    console.log(chalk.cyan('🔄 Auto-loading all paired users...'));
    
    if (!fs.existsSync(PAIRING_DIR)) {
        fs.mkdirSync(PAIRING_DIR, { recursive: true });
        console.log(chalk.yellow(`ℹ️ Auth directory did not exist; created ${PAIRING_DIR}.`));
        return;
    }

    const pairedUsers = fs.readdirSync(PAIRING_DIR, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)
        .filter(name => name.endsWith('@s.whatsapp.net'));

    if (pairedUsers.length === 0) {
        console.log(chalk.yellow('ℹ️  No paired users found.'));
        return;
    }

    console.log(chalk.green(`✅ Found ${pairedUsers.length} paired users. Starting connections...`));
    console.log(chalk.blue('⏳ Waiting 4 seconds before starting connections...'));
    await delay(4000);

    for (let i = 0; i < pairedUsers.length; i++) {
        const userNumber = pairedUsers[i];
        
        try {
            console.log(chalk.blue(`🔄 Connecting user ${i + 1}/${pairedUsers.length}: ${userNumber}`));
            await startpairing(userNumber);
            console.log(chalk.green(`✅ Connected successfully: ${userNumber}`));
            
            if (i < pairedUsers.length - 1) {
                console.log(chalk.blue('⏳ Waiting 4 seconds before next connection...'));
                await delay(4000);
            }
        } catch (error) {
            console.log(chalk.red(`❌ Failed for ${userNumber}: ${error.message}`));
            
            if (i < pairedUsers.length - 1) {
                console.log(chalk.blue('⏳ Waiting 4 seconds before retry...'));
                await delay(4000);
            }
        }
    }

    console.log(chalk.green('✅ All paired users processed.'));
    console.log(chalk.blue('⏳ Waiting 4 seconds before continuing...'));
    await delay(4000);
};

const initializeBot = async () => {
    console.clear();
    console.log(chalk.cyan(figlet.textSync('𝙼𝙰𝙽𝙸 𝚇𝙼𝙳 ☏', {
        font: 'Standard',
        horizontalLayout: 'default',
        verticalLayout: 'default'
    })));
    
    console.log(chalk.yellow('\n═══════════════════════════════════════════════'));
    console.log(chalk.green('   𝙼𝙰𝙽𝙸 𝚇𝙼𝙳 ☏ 𝐩𝐚𝐢𝐫𝐢𝐧𝐠 𝐬𝐲𝐬𝐭𝐞𝐦       '));
    console.log(chalk.yellow('═══════════════════════════════════════════════\n'));

    launchBot();

    try {
        console.log(chalk.blue('📱 Starting WhatsApp Web QR pairing...'));
        await startpairing(SESSION_NAME, webRuntime.getSessionState(SESSION_NAME));
        console.log(chalk.green('✅ WhatsApp Multi-Device pairing is ready at the public dashboard (QR + phone-code linking).'));
    } catch (error) {
        console.log(chalk.red(`❌ Failed to start WhatsApp Web pairing: ${error.message}`));
        if (webRuntime?.getSessionState) {
            const state = webRuntime.getSessionState(SESSION_NAME);
            state.currentConnected = false;
            state.currentStatus = `WhatsApp startup failed: ${error.message}`;
            state.emit('status', state.currentStatus);
            state.emit('connected', false);
        }
    }
};

function launchBot() {
    console.clear();
    console.log(chalk.green('🚀 Starting 𝙼𝙰𝙽𝙸 𝚇𝙼𝙳 ☏ system...\n'));

    let telegramLoaded = false;
    let whatsappLoaded = false;

    // Load Telegram bot (bot.js)
    const botPath = path.join(__dirname, 'bot.js');
    if (fs.existsSync(botPath)) {
        try {
            console.log(chalk.blue('📱 Loading Telegram pairing system...'));
            require('./bot');
            telegramLoaded = true;
            console.log(chalk.green('✅𝙼𝙰𝙽𝙸 𝚇𝙼𝙳 ☏ bot loaded successfully!'));
        } catch (error) {
            console.log(chalk.red('❌ Failed to load Telegram bot (bot.js):'));
            console.log(chalk.red('   Error:', error.message));
            
            if (error.stack) {
                console.log(chalk.gray('   Stack:', error.stack.split('\n')[1].trim()));
            }
            
            console.log(chalk.yellow('⚠️  Continuing without Telegram bot...\n'));
        }
    } else {
        console.log(chalk.yellow('⚠️  bot.js not found, skipping Telegram bot...\n'));
    }

    // Load WhatsApp commands (drenox.js)
    const drenoxPath = path.join(__dirname, 'drenox.js');
    if (fs.existsSync(drenoxPath)) {
        try {
            console.log(chalk.blue('💬 Loading WhatsApp commands system...'));
            const drenoxModule = require('./drenox');
            whatsappLoaded = true;
            logCommandAudit(drenoxModule);
            console.log(chalk.green('✅ WhatsApp commands loaded successfully!'));
            
        } catch (error) {
            console.log(chalk.red('❌ Failed to load WhatsApp commands (drenox.js):'));
            console.log(chalk.red('   Error:', error.message));
            
            if (error.stack) {
                console.log(chalk.gray('   Stack:', error.stack.split('\n')[1].trim()));
            }
            
            console.log(chalk.yellow('⚠️  Continuing without WhatsApp commands...\n'));
        }
    } else {
        console.log(chalk.yellow('⚠️  drenox.js not found, skipping WhatsApp commands...\n'));
    }

    // Summary
    console.log(chalk.cyan('\n═══════════════════════════════════════════════'));
    console.log(chalk.bold.white('𝙼𝙰𝙽𝙸 𝚇𝙼𝙳 ☏ BOT INITIALIZATION SUMMARY          '));
    console.log(chalk.cyan('═══════════════════════════════════════════════'));
    console.log(telegramLoaded ? chalk.green('✅𝙼𝙰𝙽𝙸 𝚇𝙼𝙳 ☏ тɛℓɛɢяαм вσт: Active') : chalk.red('❌𝙼𝙰𝙽𝙸 𝚇𝙼𝙳 ☏ тɛℓɛɢяαм вσт : Inactive'));
    console.log(whatsappLoaded ? chalk.green('✅ WhatsApp Commands: Active') : chalk.red('❌ WhatsApp Commands: Inactive'));
    console.log(chalk.cyan('═══════════════════════════════════════════════\n'));

    if (!telegramLoaded && !whatsappLoaded) {
        console.log(chalk.red('⚠️  Warning: No bot systems loaded! Check your files.\n'));
    } else {
        console.log(chalk.green('✅ 𝙼𝙰𝙽𝙸 𝚇𝙼𝙳 ☏ system is ready and running!\n'));
    }

    // Error handlers
    const ignoredErrors = [
        'Socket connection timeout',
        'EKEYTYPE',
        'item-not-found',
        'rate-overlimit',
        'Connection Closed',
        'Timed Out',
        'Value not found'
    ];

    process.on('unhandledRejection', (reason, promise) => {
        if (ignoredErrors.some(e => String(reason).includes(e))) return;
        
        console.log(chalk.red('\n⚠️  Unhandled Promise Rejection:'));
        console.log(chalk.yellow('Reason:'), reason);
    });

    process.on('uncaughtException', (error) => {
        if (ignoredErrors.some(e => String(error).includes(e))) return;
        
        console.log(chalk.red('\n❌ Uncaught Exception:'));
        console.log(chalk.yellow('Error:'), error.message);
        if (error.stack) {
            console.log(chalk.gray(error.stack));
        }
    });

    const originalConsoleError = console.error;
    console.error = function (message, ...optionalParams) {
        if (typeof message === 'string' && ignoredErrors.some(e => message.includes(e))) {
            return;
        }
        originalConsoleError.apply(console, [message, ...optionalParams]);
    };

    const originalStderrWrite = process.stderr.write;
    process.stderr.write = function (message, encoding, fd) {
        if (typeof message === 'string' && ignoredErrors.some(e => message.includes(e))) {
            return;
        }
        originalStderrWrite.apply(process.stderr, arguments);
    };

    console.log(chalk.blue('📊 Bot monitoring active...'));
    console.log(chalk.gray('Press Ctrl+C to stop the bot\n'));
}

// Render Web Services require an open HTTP port; the bot itself remains event-driven.
const webRuntime = startHealthServer();

// A lightweight self-ping reduces idle spin-down on Render Free while the process is awake.
// It cannot wake a sleeping instance; an external monitor or paid always-on plan is the
// reliable solution for strict 24/7 availability.
const keepAliveUrl = process.env.RENDER_EXTERNAL_URL || 'https://manix-md.onrender.com';
const keepAliveIntervalMs = 14 * 60 * 1000;

function pingKeepAlive() {
    try {
        const target = new URL('/healthz', keepAliveUrl);
        const client = target.protocol === 'https:' ? https : http;
        const request = client.get(target, {
            headers: { 'User-Agent': 'MANI-XD-Render-Keep-Alive' }
        }, (response) => {
            response.resume();
            console.log(chalk.gray(`⏱️ Keep-alive health ping: HTTP ${response.statusCode}`));
        });

        request.setTimeout(10000, () => request.destroy(new Error('keep-alive request timeout')));
        request.on('error', (error) => {
            console.log(chalk.gray(`⏱️ Keep-alive ping skipped: ${error.message}`));
        });
    } catch (error) {
        console.log(chalk.gray(`⏱️ Keep-alive ping skipped: ${error.message}`));
    }
}

setTimeout(pingKeepAlive, 60 * 1000);
setInterval(pingKeepAlive, keepAliveIntervalMs);

// Graceful shutdown
process.on('SIGINT', () => {
    console.log(chalk.yellow('\n\n⚠️  Shutting down gracefully...'));
    console.log(chalk.green('👋 Goodbye!'));
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log(chalk.yellow('\n\n⚠️  Received termination signal...'));
    process.exit(0);
});

initializeBot().catch((error) => {
    console.log(chalk.red('\n❌ Fatal error during initialization:'));
    console.log(chalk.yellow('Error:'), error.message);
    if (error.stack) {
        console.log(chalk.gray(error.stack));
    }
    process.exit(1);
});
