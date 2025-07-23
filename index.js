const makeWASocket = require("baileys").default
const {
  default: ToxxicTechConnect,
  delay,
  PHONENUMBER_MCC,
  makeCacheableSignalKeyStore,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  generateForwardMessageContent,
  prepareWAMessageMedia,
  generateWAMessageFromContent,
  generateMessageID,
  downloadContentFromMessage,
  makeInMemoryStore,
  jidDecode,
  proto,
  Browsers,
} = require("baileys")
const NodeCache = require("node-cache")
const Pino = require("pino")
const readline = require("readline")
const { parsePhoneNumber } = require("libphonenumber-js")
const store = makeInMemoryStore({ logger: Pino({ level: "silent", stream: "store" }) })
const axios = require("axios")
const question = (text) => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => {
    rl.question(text, resolve)
  })
}
const config = require("../config") // Adjusted path to config.js

let ToxxicTech // Declare the ToxxicTech variable before using it

// DON'T EDIT THIS PART
async function connectBot() {
  const { state, saveCreds } = await useMultiFileAuthState("session")
  const { version } = await fetchLatestBaileysVersion()
  ToxxicTech = makeWASocket({
    logger: Pino({ level: "silent" }),
    printQRInTerminal: false,
    auth: state,
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 0,
    keepAliveIntervalMs: 10000,
    emitOwnEvents: true,
    fireInitQueries: true,
    generateHighQualityLinkPreview: true,
    syncFullHistory: true,
    markOnlineOnConnect: true,
    browser: ["Ubuntu", "Chrome", "20.0.04"],
  })
  if (!ToxxicTech.authState.creds.registered) {
    const phoneNumber = await question("Enter your phone number with country code 🚮 :\n")
    let code = await ToxxicTech.requestPairingCode(phoneNumber)
    code = code?.match(/.{1,4}/g)?.join("-") || code
    console.log(`This Code is Powered By Toxxic Boy:`, code)
  }

  store.bind(ToxxicTech.ev)
  ToxxicTech.ev.on("creds.update", saveCreds)
  ToxxicTech.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update

    if (connection === "open") {
      console.log(`
        ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
        ┃ ✅ BOT IS ONLINE!             ┃
        ┃ 🔥 POWERED BY TOXXIC TECH     ┃
        ┃ 🚀 SOURCE CODE BY TOXXIC BOY  ┃
        ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
        `)
    } else if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode
      console.log(`
        ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
        ┃ ⚠ BOT DISCONNECTED            ┃
        ┃ 🔄 ATTEMPTING RECONNECTION... ┃
        ┃ ⏳ RECONNECTING IN 5 SECONDS  ┃
        ┃ 🔥 POWERED BY TOXXIC TECH     ┃
        ┃ 🚀 SOURCE CODE BY TOXXIC BOY  ┃
        ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
        `)

      setTimeout(() => {
        connectBot()
      }, 5000)
    }
  })
  // If you wanna add Functions, Add them here

  ToxxicTech.ev.on("messages.upsert", async ({ messages }) => {
    const m = messages[0]
    if (!m.message) return

    const from = m.key.remoteJid
    const isOwner = m.key.fromMe
    const messageType = Object.keys(m.message)[0]
    const text = m.message.conversation || m.message[messageType]?.text || ""

    console.log(`Message from: ${from} | Type: ${messageType} | Content: ${text}`)

    if (!text.startsWith(config.prefix)) return
    const args = text.slice(1).trim().split(/ +/)
    const command = args.shift().toLowerCase()

    console.log(`Received command: ${command}`)

    switch (command) {
      case "menu": {
        const menuText = "✨ Menu ✨\n\n🚀 *Commands List* 🚀\nBABA ADD REAL COMMANDS HERE."
        const imageUrl = "https://files.catbox.moe/f4izt2.jpg"
        await ToxxicTech.sendMessage(from, { image: { url: imageUrl }, caption: menuText })
        break
      }
      case "ping": {
        const start = Date.now()
        const msg = await ToxxicTech.sendMessage(from, { text: "Pinging..." })
        const end = Date.now()
        const pingTime = end - start
        await ToxxicTech.sendMessage(from, { text: `SPEED 🏓\nResponse time: *${pingTime}ms*` }, { quoted: msg })
        break
      }
      case "echo":
        if (args.length < 1) {
          await ToxxicTech.sendMessage(from, { text: "Usage: !echo <message>" })
        } else {
          await ToxxicTech.sendMessage(from, { text: args.join(" ") })
        }
        break
      default:
        await ToxxicTech.sendMessage(from, { text: "Unknown command." })
    }
  })

  // --- IMPORTANT: Expose an API for the Express server to call ---
  // This is a placeholder. In a real setup, you would start a small HTTP server here
  // that listens for requests from your Express backend to perform onWhatsApp checks.
  // For example:
  
    const express = require('express');
    const baileysApiApp = express();
    const PORT = 3001; // Or any other port

    baileysApiApp.get('/check-whatsapp', async (req, res) => {
        const number = req.query.number;
        if (!number) {
            return res.status(400).json({ error: 'Phone number is required.' });
        }
        try {
            const [result] = await ToxxicTech.onWhatsApp(number);
            res.json({ onWhatsApp: result?.exists || false });
        } catch (e) {
            console.error('Error checking on WhatsApp:', e);
            res.status(500).json({ error: 'Failed to check number on WhatsApp.' });
        }
    });

    baileysApiApp.listen(PORT, () => {
        console.log(`Baileys internal API listening on port ${PORT}`);
    });
    
}

connectBot()
