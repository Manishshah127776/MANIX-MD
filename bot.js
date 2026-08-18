require('dotenv').config();
require('./setting/config');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs').promises;
const fs2 = require("fs")
const path = require('path');
const chalk = require('chalk');
const { sleep } = require('./utils');
const { BOT_TOKEN } = require('./token');
const axios = require("axios")

const BRAND_NAME = '𝙼𝙰𝙽𝙸 𝚇𝙳 ☏';
const WHATSAPP_CHANNEL_URL = 'https://whatsapp.com/channel/0029Vb8XvFqD8SDvDPkdqG1f';
const OWNER_NUMBER = '9779807044421';
const OWNER_CONTACT_URL = `https://wa.me/${OWNER_NUMBER}`;
const PAIRING_DASHBOARD_URL = process.env.PAIRING_DASHBOARD_URL || 'https://manix-md.onrender.com';
const START_BANNER_PATH = path.join(__dirname, 'media', 'manix-md-banner.png');

const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const adminFilePath = path.join(__dirname, 'manixmdstorage', 'admin.json');
let adminIDs = [];

const exists = async (filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

const loadAdminIDs = async () => {
  const ownerID = '6895265731';
  const defaultAdmins = [ownerID];

  if (!(await exists(adminFilePath))) {
    await fs.writeFile(adminFilePath, JSON.stringify(defaultAdmins, null, 2));
    adminIDs = defaultAdmins;
    console.log('✅ Created admin.json with default owner ID');
  } else {
    try {
      const raw = await fs.readFile(adminFilePath, 'utf8');
      adminIDs = JSON.parse(raw);
    } catch (err) {
      console.error('Error loading admin.json:', err);
      adminIDs = defaultAdmins;
    }
  }
  console.log('📥 Loaded Admin IDs:', adminIDs);
};

let isShuttingDown = false;
let isAutoLoadRunning = true;

const runAutoLoad = async () => {
  if (isAutoLoadRunning || isShuttingDown) return;
  isAutoLoadRunning = true;

  try {
    console.log('⏱️ INITIATING AUTO-LOAD');
    await autoLoadPairs();
    console.log('✅ AUTO-LOAD COMPLETED');
  } catch (e) {
    console.error('❌ AUTO-LOAD FAILED:', e);
  } finally {
    isAutoLoadRunning = false;
  }
};

const startAutoLoadLoop = () => {
  runAutoLoad();
  setInterval(runAutoLoad, 60 * 60 * 1000);
};
startAutoLoadLoop();

const gracefulShutdown = (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  
  console.log(`🛑 Received ${signal}. Shutting down gracefully...`);
  bot.stopPolling();
  console.log('✅ Bot stopped successfully');
  process.exit(0);
};

// ========== CHECK CHANNELS FUNCTION ==========
const checkUserJoinedChannels = async (userId) => {
  const channels = ['@MEZUKAOTP'];
  let allJoined = true;

  for (const channel of channels) {
    try {
      const member = await bot.getChatMember(channel, userId);
      if (['left', 'kicked'].includes(member.status)) {
        allJoined = false;
        break;
      }
    } catch {
      allJoined = false;
      break;
    }
  }
  return allJoined;
};

// ========== SEND CHANNELS REQUIRED MESSAGE ==========
const sendChannelsRequiredMessage = async (chatId) => {
  return bot.sendMessage(chatId,
    `🚨 *You must join our official Telegram channel before pairing.*\n\n📢 WhatsApp channel: ${WHATSAPP_CHANNEL_URL}\n☎ Contact: wa.me/${OWNER_NUMBER}`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '📢 Join Telegram Channel', url: 'https://t.me/MEZUKAOTP' }],
          [{ text: '📲 𝙼𝙰𝙽𝙸 𝚇𝙳 ☏ WhatsApp Channel', url: WHATSAPP_CHANNEL_URL }],
          [{ text: '✅ I have joined', callback_data: 'check_join' }]
        ]
      }
    }
  );
};

// ========== SEND GROUP MESSAGE (STYLISH) ==========
const sendGroupMessage = async (chatId, replyToMessageId = null) => {
  const botInfo = await bot.getMe();
  const botUsername = botInfo.username;
  
  const message = `╭━━〔 ${BRAND_NAME} 〕━━╮
➤ Use in DM 👇
╰━━〔 🚀 𝙎𝙏𝘼𝙍𝙏 𝙉𝙊𝙒 〕━━╯\n\n📲 Channel: ${WHATSAPP_CHANNEL_URL}\n☎ Contact: wa.me/${OWNER_NUMBER}`;

  const options = {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '🚀 START NOW', url: `https://t.me/${botUsername}?start=pair` }]
      ]
    }
  };

  if (replyToMessageId) {
    options.reply_to_message_id = replyToMessageId;
  }

  return bot.sendMessage(chatId, message, options);
};

// ========== START COMMAND ==========
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup';

  if (isGroup) {
    return sendGroupMessage(chatId, msg.message_id);
  }

  // Private chat mein normal start message
  await bot.sendPhoto(
    chatId,
    START_BANNER_PATH,
    {
      caption: `🪀 *${BRAND_NAME}*\n\n╔════════════════════╗\n ⤷ /pair — open WhatsApp Web QR pairing\n ⤷ /unpair — clear the WhatsApp Web session\n╚════════════════════╝\n\n📲 Channel: ${WHATSAPP_CHANNEL_URL}\n☎ Contact: wa.me/${OWNER_NUMBER}`,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '📲 WhatsApp Channel', url: WHATSAPP_CHANNEL_URL }],
          [{ text: '☎ Contact Owner', url: OWNER_CONTACT_URL }]
        ]
      }
    }
  );
});

// ========== PAIR COMMAND ==========
bot.onText(/\/pair(?:\s+.*)?/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup';

  if (isGroup) {
    return sendGroupMessage(chatId, msg.message_id);
  }

  const allJoined = await checkUserJoinedChannels(userId);
  if (!allJoined) {
    return sendChannelsRequiredMessage(chatId);
  }

  return bot.sendMessage(
    chatId,
    `🔗 *WhatsApp Web Pairing*\n\nOpen the pairing dashboard, scan the QR code with WhatsApp, and keep this bot online.\n\n` +
      `1. Open WhatsApp\n` +
      `2. Go to Settings → Linked Devices\n` +
      `3. Tap “Link a Device” → “Link with QR code”\n` +
      `4. Scan the QR code shown on the dashboard\n\n` +
      `🌐 Dashboard: ${PAIRING_DASHBOARD_URL}\n\n` +
      `📲 Channel: ${WHATSAPP_CHANNEL_URL}\n` +
      `☎ Contact: wa.me/${OWNER_NUMBER}`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[{ text: '📲 Open WhatsApp Web Pairing', url: PAIRING_DASHBOARD_URL }]]
      }
    }
  );
});

// ========== CALLBACK QUERY HANDLER ==========
bot.on('callback_query', async (callbackQuery) => {
  const msg = callbackQuery.message;
  const data = callbackQuery.data;
  const userId = callbackQuery.from.id;
  const chatId = msg.chat.id;

  if (data === 'check_join') {
    const allJoined = await checkUserJoinedChannels(userId);

    if (allJoined) {
      await bot.answerCallbackQuery(callbackQuery.id, { 
        text: '✅ Thanks for joining! Now use /pair command.', 
        show_alert: true
      });
      await bot.sendMessage(chatId, `✅ *Thanks for joining our Telegram channel!*\n\n📲 WhatsApp channel: ${WHATSAPP_CHANNEL_URL}\n☎ Contact: wa.me/${OWNER_NUMBER}\n\nNow send /pair to start pairing.`, { parse_mode: 'Markdown' });
    } else {
      await bot.answerCallbackQuery(callbackQuery.id, { 
        text: '❌ Please join our channel first!', 
        show_alert: true
      });
    }
    return;
  }
});

// Number-entry pairing has been removed. Use /pair to open the WhatsApp Web QR dashboard.

// ========== UNPAIR COMMAND ==========
bot.onText(/\/unpair(?:\s+.*)?/, async (msg) => {
  const chatId = msg.chat.id;
  const isGroup = msg.chat.type === 'group' || msg.chat.type === 'supergroup';

  if (isGroup) {
    return bot.sendMessage(chatId, '❌ Please use /unpair in my private chat.', { parse_mode: 'Markdown' });
  }

  try {
    const sessionPath = path.join(__dirname, 'manixmdtimewisher', 'pairing', 'web-session');
    await fs.rm(sessionPath, { recursive: true, force: true });
    return bot.sendMessage(chatId, `✅ ${BRAND_NAME} WhatsApp Web session cleared. Open the pairing dashboard and scan a new QR code.\n\n📲 Channel: ${WHATSAPP_CHANNEL_URL}\n☎ Contact: wa.me/${OWNER_NUMBER}`, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[{ text: '📲 Open Pairing Dashboard', url: PAIRING_DASHBOARD_URL }]]
      }
    });
  } catch (err) {
    console.error('UNPAIR ERROR:', err);
    return bot.sendMessage(chatId, '❌ Failed to clear the WhatsApp Web session. Please try again.');
  }
});

// ========== POLLING ERROR HANDLER ==========
bot.on('polling_error', (error) => {
  if (error.message.includes('409 Conflict')) {
    console.log(chalk.red.bold('\n❌ TELEGRAM CONFLICT ERROR (409)'));
    console.log(chalk.yellow('⚠️  Multiple instances of this bot are running with the same token.'));
    console.log(chalk.cyan('👉 FIX: Go to @BotFather, use /revoke to get a NEW token, and update token.js.\n'));
  } else {
    console.error('Polling error:', error);
  }
});

// ========== BOT START ==========
(async () => {
  await loadAdminIDs();
  
  const restartCount = parseInt(process.env.RESTART_COUNT || 0);
  console.log(chalk.green(`🚀 Bot started! Restart count: ${restartCount}`));
})();
