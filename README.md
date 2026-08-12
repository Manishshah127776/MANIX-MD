<div align="center">

# 👑 MANIX MD — WhatsApp Multi-Device Bot 👑

<p align="center">
  <b>A powerful, feature-rich, and advanced WhatsApp Multi-Device bot built with Node.js and Baileys.</b>
</p>

<p align="center">
  <img src="https://i.postimg.cc/D09w4jk0/download.jpg" alt="MANIX MD Logo" width="300" style="border-radius: 50%;">
</p>

<p align="center">
  <a href="#-features"><b>Features</b></a> •
  <a href="#-requirements"><b>Requirements</b></a> •
  <a href="#-installation"><b>Installation</b></a> •
  <a href="#-pairing-method"><b>Pairing</b></a> •
  <a href="#-deployment"><b>Deployment</b></a> •
  <a href="#-credits--author"><b>Credits</b></a>
</p>

</div>

---

## 🌟 Overview

**MANIX MD** is an advanced WhatsApp bot framework designed for multi-device environments. Equipped with robust automation, AI integrations, custom command handlers, group management tools, and media downloading capabilities, MANIX MD provides a seamless and reliable experience for bot owners and communities.

Developed and maintained by **MANI XTECH**.

---

## 🚀 Features

- **Multi-Device Support**: Fully compatible with the modern WhatsApp Multi-Device architecture via `@whiskeysockets/baileys`.
- **Pairing Code Support**: Easily pair your bot using a phone number pairing code without needing QR code scanning.
- **AI Integration**: Built-in support for advanced LLMs (Groq, GPT, Gemini, DeepSeek, Mistral) for smart conversational features.
- **Group Management & Security**: Comprehensive anti-link protection, welcome messages, administrative commands, and automated moderation.
- **Media & Downloader Tools**: Download YouTube videos, audio clips, social media content, and generate custom stickers.
- **Interactive Menu System**: Rich audio and visual multimedia responses with customizable themes and emojis.

---

## 📋 Requirements

Before setting up MANIX MD, ensure your environment meets the following requirements:
- **Node.js** (v18.0.0 or higher recommended)
- **Git**
- **FFmpeg** (required for media processing and sticker creation)
- **NPM** or **Yarn**

---

## ⚙️ Installation

Follow these steps to set up the project locally on your machine or server:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Manishshah127776/MANIX-MD.git
   cd MANIX-MD
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure your settings:**
   Open `setting/config.js` and update your owner number, developer details, prefix, and API keys as needed.

4. **Start the bot:**
   ```bash
   npm start
   ```

---

## 📱 Pairing Method

MANIX MD supports seamless phone number pairing:
1. Run the pairing script:
   ```bash
   node pair.js
   ```
2. Enter your bot WhatsApp number when prompted.
3. Input the generated 8-character pairing code into your WhatsApp linked devices menu.

---

## ☁️ Deployment

You can deploy MANIX MD easily on cloud hosting platforms such as **Railway**, **Render**, or **Heroku**:

- **Railway / Render / Heroku**: 
  - Connect your GitHub repository (`Manishshah127776/MANIX-MD`).
  - Set the start command to `npm start`.
  - Add your environment variables or configure `setting/config.js`.

---

## 👤 Credits & Author

- **Project Name**: MANIX MD
- **Creator / Brand**: **MANI XTECH**
- **Official Channel**: [WhatsApp Channel](https://whatsapp.com/channel/0029Vb8XvFqD8SDvDPkdqG1f)

---

## 📝 License

This project is open-source and available under the [MIT License](LICENSE).
