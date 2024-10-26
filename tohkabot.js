require('./configuração');
const { default: makeWASocket, makeInMemoryStore, Browsers, proto, useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore, isJidBroadcast, fetchLatestBaileysVersion, generateForwardMessageContent, prepareWAMessageMedia, generateWAMessageFromContent, generateMessageID, downloadContentFromMessage, getContentType, MessageRetryMap, BufferJSON, delay, areJidsSameUser, generateWAMessage } = require("./versaomod_baileys_by_sayo")
const fetch = require('node-fetch')
const axios = require('axios')
const NodeCache = require("node-cache")
const moment = require('moment-timezone')
const gtts = require('gtts');
 
const { usuario, Utils } = require('./backend/modelagem')

const { TelegraPh } = require("./func.backend/uploader");

const mimetype = require('mime-types')

 const util = require('util')

 const {
imageToWebp,
videoToWebp,
writeExifImg,
writeExifVid
 } = require('./func.backend/exif')
 
const { getBuffer, getRandom } = require("./func.backend/buff");
 
 const fs = require('fs')
 
const {
exec
 } = require('child_process')
 
 global.api = (name, path = '/', query = {}, apikeyqueryname) => (name in global.APIs ? global.APIs[name] : name) + path + (query || apikeyqueryname ? '?' + new URLSearchParams(Object.entries({ ...query, ...(apikeyqueryname ? { [apikeyqueryname]: apikey } : {}) })) : '')
 
 const MAIN_LOGGER = require('@whiskeysockets/baileys/lib/Utils/logger').default;
const logger = MAIN_LOGGER.child({});
logger.level = 'silent';
const msgRetryCounterCache = new NodeCache();

const smsg = (conn, m, store) => {
    if (!m) return m
    let M = proto.WebMessageInfo
    if (m.key) {
        m.id = m.key.id
        m.isBaileys = m.id.startsWith('BAE5') && m.id.length === 16
        m.aqui = m.key.remoteJid
        m.eu = m.key.fromMe
        m.eGrupo = m.aqui.endsWith('@g.us')
    }
    if (m.message) {
        m.mtype = getContentType(m.message)
        m.msg = (m.mtype == 'viewOnceMessage' ? m.message[m.mtype].message[getContentType(m.message[m.mtype].message)] : m.message[m.mtype])
        m.body = m.message.conversation || m.msg.caption || m.msg.text || (m.mtype == 'listResponseMessage') && m.msg.singleSelectReply.selectedRowId || (m.mtype == 'buttonsResponseMessage') && m.msg.selectedButtonId || (m.mtype == 'viewOnceMessage') && m.msg.caption || m.text
        let quoted = m.quoted = m.msg.contextInfo ? m.msg.contextInfo.quotedMessage : null
        m.mentionedJid = m.msg.contextInfo ? m.msg.contextInfo.mentionedJid : []
        if (m.quoted) {
            let type = Object.keys(m.quoted)[0]
			m.quoted = m.quoted[type]
            if (['productMessage'].includes(type)) {
				type = Object.keys(m.quoted)[0]
				m.quoted = m.quoted[type]
			}
            if (typeof m.quoted === 'string') m.quoted = {
				text: m.quoted
			}
            m.quoted.mtype = type
            m.quoted.id = m.msg.contextInfo.stanzaId
			m.quoted.aqui = m.msg.contextInfo.remoteJid || m.aqui
            m.quoted.isBaileys = m.quoted.id ? m.quoted.id.startsWith('BAE5') && m.quoted.id.length === 16 : false
            m.quoted.text = m.quoted.text || m.quoted.caption || m.quoted.conversation || m.quoted.contentText || m.quoted.selectedDisplayText || m.quoted.title || ''
			m.quoted.mentionedJid = m.msg.contextInfo ? m.msg.contextInfo.mentionedJid : []
            m.getQuotedObj = m.getQuotedMessage = async () => {
			if (!m.quoted.id) return false
			let q = await store.loadMessage(m.aqui, m.quoted.id, conn)
 			return exports.smsg(conn, q, store)
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

            /**
             * 
             * @returns 
             */
            m.quoted.delete = () => conn.sendMessage(m.quoted.chat, { delete: vM.key })

	   /**
		* 
		* @param {*} jid 
		* @param {*} forceForward 
		* @param {*} options 
		* @returns 
	   */
            m.quoted.copyNForward = (jid, forceForward = false, options = {}) => conn.copyNForward(jid, vM, forceForward, options)

            /**
              *
              * @returns
            */
            m.quoted.download = () => conn.downloadMediaMessage(m.quoted)
        }
    }
    if (m.msg.url) m.download = () => conn.downloadMediaMessage(m.msg)
    m.text = m.msg.text || m.msg.caption || m.message.conversation || m.msg.contentText || m.msg.selectedDisplayText || m.msg.title || ''
    /**
	* Reply to this message
	* @param {String|Object} text 
	* @param {String|false} chatId 
	* @param {Object} options 
	*/
    m.reply = (text, chatId = m.aqui, options = {}) => Buffer.isBuffer(text) ? conn.sendMedia(chatId, text, 'file', '', m, { ...options }) : conn.sendText(chatId, text, m, { ...options })
    /**
	* Copy this message
	*/
	m.copy = () => exports.smsg(conn, M.fromObject(M.toObject(m)))

	/**
	 * 
	 * @param {*} jid 
	 * @param {*} forceForward 
	 * @param {*} options 
	 * @returns 
	 */
	m.copyNForward = (jid = m.aqui, forceForward = false, options = {}) => conn.copyNForward(jid, m, forceForward, options)

conn.appenTextMessage = async(text, chatUpdate) => {
let messages = await generateWAMessage(m.aqui, { text: text, mentions: m.mentionedJid }, {
userJid: conn.user.id,
quoted: m.quoted && m.quoted.fakeObj
})
messages.key.fromMe = areJidsSameUser(m.sender, conn.user.id)
messages.key.id = m.key.id
messages.pushName = m.pushName
if (m.isGroup) messages.participant = m.sender
let msg = {
    ...chatUpdate,
    messages: [proto.WebMessageInfo.fromObject(messages)],
    type: 'append'
}
conn.ev.emit('messages.upsert', msg)
}

    return m
}

 const store = makeInMemoryStore({ logger })
async function startA() {
  
  const { version, isLatest } = await fetchLatestBaileysVersion()
  const { state, saveCreds } = await useMultiFileAuthState('ayu_key')


  const ayu = makeWASocket({
        version,
        logger,
        printQRInTerminal: true,
        browser: Browsers.appropriate("Desktop"),
        auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, logger) },
        defaultQueryTimeoutMs: undefined,
        generateHighQualityLinkPreview: false,
        msgRetryCounterCache,

  })
 ayu.ev.on('connection.update', (update) => {
 const {
connection, lastDisconnect
 } = update
 if (connection === 'close') {
if (lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut) {
 startA()
}
 } else if (connection === 'open') {
 console.log('conectado')
ayu.sendMessage('5562936180708@s.whatsapp.net', { text: 'site online mb' }, { quoted: null}).then((res) => console.log(res)).catch((err) => console.log(err))
//ayu.sendMessage('553175416530@s.whatsapp.net', { text: 'site online mb' }, { quoted: null}).then((res) => console.log(res)).catch((err) => console.log(err))
 }
})

ayu.ev.on('group-participants.update', async (num) => {
const mdata = await ayu.groupMetadata(num.id)
const time = moment.tz('America/Sao_Paulo').format('DD/MM HH:mm:ss')
const pushname = num.id
try {
 try {
ppimg = await ayu.profilePictureUrl(num.participants[0], "image")
 } catch {
ppimg = 'https://tohka.tech/img/tohka.jpg'
 }
 try {
ppgp = await ayu.profilePictureUrl(mdata.id, "image")
 } catch {
ppgp = 'https://tohka.tech/img/tohka.jpg'
 }
 if (num.action === 'add') {
linktyni = await axios.get(`https://tinyurl.com/api-create.php?url=${ppimg}`);
bemvd = await getBuffer(api('tohka', '/api/canvas/' + 'bemvindod', {
texto3: "@"+num.participants[0].split('@')[0],
texto2: "seja muito bem vindo",
texto: "BEM VINDO",
membros: 0,
numero: 0,
cor1: "ab0404",
cor2: "ff0000",
cor3: "000",
img: linktyni.data,
img2: "https://telegra.ph/file/da540b6294fa26d776594.jpg"
 }, 'apikey'))
ayu.sendMessage(mdata.id, {
 image: bemvd, mentions: num.participants, caption: `@${num.participants[0].split('@')[0]} bem vindo(a)`
})
 } else if (num.action === 'remove') {
linktyni = await axios.get(`https://tinyurl.com/api-create.php?url=${ppimg}`);
adeus = await getBuffer(api('tohka', '/api/canvas/' + 'bemvindod', {
texto3: "@"+num.participants[0].split('@')[0],
texto2: "volte sempre",
texto: "DEUS",
membros: 0,
numero: 0,
cor1: "ab0404",
cor2: "ff0000",
cor3: "000",
img: linktyni.data,
img2: "https://telegra.ph/file/da540b6294fa26d776594.jpg"
}, 'apikey'))
ayu.sendMessage(mdata.id, {
 image: adeus, mentions: num.participants, caption: `@${num.participants[0].split('@')[0]} saiu`
})
 }
} catch (e) {
 console.log(e);
}
 })


ayu.ev.on('messages.upsert',
 async chatUpdate => {
try {
 const mek = chatUpdate.messages[0]
  if (mek.key.fromMe) return
  await ayu.readMessages([mek.key]);
 m = smsg(ayu, mek, store)
 if (!mek.key.participant) mek.key.participant = mek.key.remoteJid
 mek.key.participant = mek.key.participant.replace(/:[0-9]+/gi, "")
 if (!mek.message) return
 const fromMe = mek.key.fromMe
 const content = JSON.stringify(mek.message)
 const from = mek.key.remoteJid
 const type = Object.keys(mek.message).find((key) => !["senderKeyDistributionMessage", "messageContextInfo"].includes(key))
 const body = (getContentType(mek.message) === 'conversation') ? mek.message.conversation : (getContentType(mek.message) == 'imageMessage') ? mek.message.imageMessage.caption : (getContentType(mek.message) == 'videoMessage') ? mek.message.videoMessage.caption : (getContentType(mek.message) == 'extendedTextMessage') ? mek.message.extendedTextMessage.text : (getContentType(mek.message) == 'templateButtonReplyMessage') ? mek.message.templateButtonReplyMessage.selectedId : (getContentType(mek.message) == 'interactiveResponseMessage') ? (JSON.parse(mek.message.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson)).id : ""
 const budy = (type === "conversation") ?
 mek.message.conversation: (type === "extendedTextMessage") ?
 mek.message.extendedTextMessage.text: ""
 const bady = mek.message.conversation ? mek.message.conversation: mek.message.imageMessage ? mek.message.imageMessage.caption: mek.message.videoMessage ? mek.message.videoMessage.caption: mek.message.extendedTextMessage ? mek.message.extendedTextMessage.text: (mek.message.listResponseMessage && mek.message.listResponseMessage.singleSelectReply.selectedRowId) ? mek.message.listResponseMessage.singleSelectReply.selectedRowId: ''
 const bidy = bady.toLowerCase()
 const selectedButton = (type == 'buttonsResponseMessage') ? mek.message.buttonsResponseMessage.selectedButtonId: ''
 const argsButton = selectedButton.trim().split(/ +/)
 const isCmd = body.startsWith(prefix)
 const command = isCmd ? body.slice(prefix.length).trim().split(' ').shift().toLowerCase(): ''
  const isMedia = (type === 'imageMessage' || type === 'videoMessage')
 const isQuotedImage = type === 'extendedTextMessage' && content.includes('imageMessage')
 const isQuotedVideo = type === 'extendedTextMessage' && content.includes('videoMessage')
 const isQuotedSticker = type === 'extendedTextMessage' && content.includes('stickerMessage')
 const isQuotedAudio = type === 'extendedTextMessage' && content.includes('audioMessage')
 const args = body.trim().split(/ +/).slice(1)
 const q = args.join(' ')
 const isGroup = from.endsWith('@g.us')
 const sender = mek.key.fromMe ? (ayu.user.id.split(':')[0]+'@s.whatsapp.net' || ayu.user.id): (mek.key.participant || mek.key.remoteJid)
 const senderNumber = sender.split('@')[0]
 const botNumber = ayu.user.id.split(':')[0]
 const pushname = mek.pushName || 'sem nome'
 const groupMetadata = isGroup ? await ayu.groupMetadata(from).catch(e => {}): ''
 const groupName = isGroup ? groupMetadata.subject: ''
 const participants = isGroup ? await groupMetadata.participants: ''
 const groupAdmins = isGroup ? await participants.filter(v => v.admin !== null).map(v => v.id): ''
 const groupOwner = isGroup ? groupMetadata.owner: ''
 const isBotAdmins = isGroup ? groupAdmins.includes(botNumber): false
 const isAdmins = isGroup ? groupAdmins.includes(sender): false
 const groupMembers = isGroup ? groupMetadata.participants: ''
 const isOwner = coderNumero.includes(senderNumber)
function setar_dia_noite() {
  const time = moment.tz('America/Sao_Paulo').format('HH')
  let res = "👋 *TOHKA | OFC* 👋"
  if (time >= 4) {
    res = `🌇 *Bom Dia | ${pushname}* ⛅`
  }
  if (time >= 11) {
    res = `🏙️ *Boa Tarde | ${pushname}* 🌤️`
  }
  if (time >= 15) {
    res = `🌆 *Boa Tarde | ${pushname}* 🌥️`
  }
  if (time >= 17) {
    res = `🌃 *Boa Noite | ${pushname}* 💫`
  }
  return res
}

async function fetchJson(url, options) {
	try {
		options ? options: {}
		const res = await axios({
			method: 'GET',
			url: url,
			headers: {
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36'
			},
			...options
		})
		return res.data
	} catch (err) {
		return err
	}
}

 async function upBailyesimg(link) {
imgupservidor = await prepareWAMessageMedia({ image: { url: link } }, { upload: ayu.waUploadToServer })
return imgupservidor.imageMessage
}
async function upBailyesvideo(link) {
const vdupservidor = await prepareWAMessageMedia({ video: { url: link } }, { upload: ayu.waUploadToServer })
return vdupservidor.videoMessage
}

function abreviar(num) {
     if (num >= 1000000000000000000000000000000000) {
        return (num / 1000000000000000000000000000000000).toFixed(1).replace(/\.0$/, '') + ' d';
     }
     if (num >= 1000000000000000000000000000000) {
        return (num / 1000000000000000000000000000000).toFixed(1).replace(/\.0$/, '') + ' n';
     }
     if (num >= 1000000000000000000000000000) {
        return (num / 1000000000000000000000000000).toFixed(1).replace(/\.0$/, '') + ' o';
     }     
     if (num >= 1000000000000000000000000) {
        return (num / 1000000000000000000000000).toFixed(1).replace(/\.0$/, '') + ' sep';
     }     
     
     if (num >= 1000000000000000000000) {
        return (num / 1000000000000000000000).toFixed(1).replace(/\.0$/, '') + ' sex';
     }
     if (num >= 1000000000000000000) {
        return (num / 1000000000000000000).toFixed(1).replace(/\.0$/, '') + ' qui';
     }
     if (num >= 1000000000000000) {
        return (num / 1000000000000000).toFixed(1).replace(/\.0$/, '') + ' qua';
     }     
     if (num >= 1000000000000) {
        return (num / 1000000000000).toFixed(1).replace(/\.0$/, '') + ' tri';
     }          
                
     if (num >= 1000000000) {
        return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + ' bi';
     }
     if (num >= 1000000) {
        return (num / 1000000).toFixed(1).replace(/\.0$/, '') + ' mi';
     }
     if (num >= 1000) {
        return (num / 1000).toFixed(1).replace(/\.0$/, '') + ' mil';
     }
     return num;
}
const reply = async(msg) => { 
await ayu.sendMessage(m.aqui, {text: msg}, {quoted: mek, ephemeralExpiration: 24*60*100, disappearingMessagesInChat: 24*60*100})
 }



async function eumdenos(numero) {
        let users = await usuario.findOne({numero_zap: numero});
        if(users !== null) {
            return users.numero_zap;
        } else {
            return false;
        }
    }
    
async function infodb(numero) {
let users = await usuario.findOne({numero_zap: numero});
if(users !== null) {
return users;
} else {
return false;
}
}

const rg = await infodb(sender.split("@")[0])
const reqXp  = Math.floor(600 + (rg.nivel * 400));

const enviarfiguimg = async (jid, path, quoted, options = {}) => {
let buff = Buffer.isBuffer(path) ? path: /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64'): /^https?:\/\//.test(path) ? await (await getBuffer(path)): fs.existsSync(path) ? fs.readFileSync(path): Buffer.alloc(0)
let buffer
if (options && (options.packname || options.author)) {
 buffer = await writeExifImg(buff, options)
} else {
 buffer = await imageToWebp(buff)
}
await ayu.sendMessage(jid, {
 sticker: {
url: buffer
 }, ...options
}, {
 quoted
})
return buffer
 }


 const enviarfiguvid = async (jid, path, quoted, options = {}) => {
let buff = Buffer.isBuffer(path) ? path: /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64'): /^https?:\/\//.test(path) ? await (await getBuffer(path)): fs.existsSync(path) ? fs.readFileSync(path): Buffer.alloc(0)
let buffer
if (options && (options.packname || options.author)) {
 buffer = await writeExifVid(buff, options)
} else {
 buffer = await videoToWebp(buff)
}

await ayu.sendMessage(jid, {
 sticker: {
url: buffer
 }, ...options
}, {
 quoted
})
return buffer
 }    
 
 const getExtension = async (type) => {
return await mimetype.extension(type)
 }

 const getFileBuffer = async (mediakey, MediaType) => {
const stream = await downloadContentFromMessage(mediakey, MediaType)
let buffer = Buffer.from([])
for await(const chunk of stream) {
 buffer = Buffer.concat([buffer, chunk])
}
return buffer
 } 
 
 try {
ppimg = await ayu.profilePictureUrl(sender, "image")
 } catch {
ppimg = 'https://tohka.tech/img/ayu.jpg'
 }
const userppbuff = await getBuffer(ppimg) 


    
 

if (budy.startsWith('>')) {
if (!isOwner) return
try {
 let evaled = await eval(budy.slice(2))
 if (typeof evaled !== 'string') evaled = require('util').inspect(evaled)
 await reply(evaled)
} catch (err) {
 await reply(String(err))
}
 }

 if (budy.startsWith('$')) {
 if (!isOwner) return
exec(budy.slice(2), (err, stdout) => {
 if (err) return reply(err)
 if (stdout) return reply(stdout)
})
 }


/*if (budy && isGroup) {
var jid = '120363045171866602@g.us' //id :)
//var timert = moment.tz('America/Sao_Paulo').format('DD/MM HH:mm:ss')
// toda mensagem enviada sera apagada.
// coloque a key da mensagem... ^-^

await ayu.sendMessage(jid, { delete: mek.key })
// titulo & participante
/*
var gpcriado = await ayu.groupCreate(`${pushname} ` + timert, [sender])
ayu.sendMessage(gpcriado.id, { text: budy }) // manda mensagem no grupo
await ayu.groupSettingUpdate(gpcriado.id, 'locked')
*/
//}


/*let checking = await eumdenos(sender.split("@")[0]);
if (isCmd && !checking){ 
ayu.sendMessage(from, {video: fs.readFileSync('./public/video/ayu.mp4'), gifPlayback: false, caption: `Olá @${sender.split('@')[0]}, para poder usar meus comandos faça um registro no site https://tohka.tech\nTenha um bom dia!` , mentions: [sender]}, {quoted: mek}) 
return
}*/

async function x() {
const fileContent = fs.readFileSync("tohkabot.js").toString();
const caseNames = fileContent.match(/case\s+'(.+?)'/g);
return caseNames.map((caseName, index) => `${index + 1} >  ${prefix+caseName.match(/'(.+?)'/)[1]}`).join('\n');
}

async function xx(aa) {
const index = fs.readFileSync("tohkabot.js").toString();
const etapa1 = "case '"+aa+index.split("case '"+aa)[1]
const etapa2 = etapa1.split("break")[0] + "break"
return  etapa2
}
/*
if (budy && !isCmd && !isGroup) {
  simSimi = await fetchJson(encodeURI(`https://tohka.tech/api/outros/gemini?pergunta=${budy}&apikey=ddos`))
  console.log(simSimi)
  reply(simSimi[0])
}
*/

switch (command) {

case 'menu':
 await ayu.sendPresenceUpdate('available', from) 
 await ayu.sendPresenceUpdate('composing', from)
reply(await x())
break

case 'sticker': {
if ((isMedia && !mek.message.videoMessage || isQuotedImage)) {
 reply('criando figurinha')
 console.log('criando figurinha image')
 const encmedia = isQuotedImage ? mek.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage: mek.message.imageMessage
 rane = getRandom('.'+ await getExtension(encmedia.mimetype))
 imgbuff = await getFileBuffer(encmedia, 'image')
 fs.writeFileSync(rane, imgbuff)
 const media = rane
 ran = getRandom('.'+media.split('.')[1])
 const upload = await TelegraPh(media)
 await enviarfiguimg(from, util.format(upload), mek, {
packname: pacote, author: auutor
 })
 await fs.unlinkSync(media)
} else if ((isMedia && mek.message.videoMessage.seconds < 11 || isQuotedVideo && mek.message.extendedTextMessage.contextInfo.quotedMessage.videoMessage.seconds < 11)) {
 enviar_reply('criando figurinha')
 console.log('criando figurinha vídeo')
 const encmedia = isQuotedVideo ? mek.message.extendedTextMessage.contextInfo.quotedMessage.videoMessage: mek.message.videoMessage
 rane = getRandom('.'+ await getExtension(encmedia.mimetype))
 imgbuff = await getFileBuffer(encmedia, 'video')
 fs.writeFileSync(rane, imgbuff)
 const media = rane
 ran = getRandom('.'+media.split('.')[1])
 const upload = await TelegraPh(media)
 await enviarfiguvid(from, util.format(upload), mek, {
packname: pacote, author: auutor
 })
 await fs.unlinkSync(media)
} else return reply(`Marque a imagem com o comando ${prefix}sticker ou coloque na legenda, o video ou gif so pode ter 10 segundos de duração`)
 }
break

case 'igdl':
  if (!q) return reply(`Exemplo: ${prefix + command} https://www.instagram.com/stories/billieeilish/`);
 await ayu.sendPresenceUpdate('available', from) 
 await ayu.sendPresenceUpdate('composing', from)
  try {
     igdl = await fetchJson(`https://tohka.tech/api/dl/igdl?link=${q}&apikey=`+apikey)
    if (igdl.resultado.link.length > 0) {
      for (const media of igdl.resultado.link) {
        if (media.download_link.endsWith('&dl=1') || media.download_link.endsWith('.png')) {
          // Enviar imagem
          await ayu.sendMessage(from, { image: { url: media.download_link } }, { quoted: m });
        } else {
          // Enviar vídeo
          await ayu.sendMessage(from, { video: { url: media.download_link } }, { quoted: m });
        }
      }
    } else {
      reply('Nenhum conteúdo encontrado');
    }
  } catch (err) {
    console.log(err);
    reply('Erro ao baixar conteúdo');
  }
  break
  
case 'hentaimp4':
try {
await ayu.sendPresenceUpdate('available', from) 
 await ayu.sendPresenceUpdate('composing', from)
apimp4 = await fetchJson("https://tohka.tech/api/hentai/mp4?apikey=ddos")
randomIndex = Math.floor(Math.random() * apimp4.resultado.length);
randomResultado = apimp4.resultado[randomIndex];
console.log(randomResultado)
hentaitxt = 
`
🍑 titulo: ${randomResultado.titulo}
🍑 categoria: ${randomResultado.categoria}
🍑 compartilhamentos: ${randomResultado.compartilhamentos}
🍑 visualizacoes: ${randomResultado.visualizacoes}
`
interactiveMessage = {
body: {  },
footer: { },
header: { title: "", subtitle: "", videoMessage: await upBailyesvideo(randomResultado.video_1) , hasMediaAttachment: true },
nativeFlowMessage: { buttons: [{ 
name: "quick_reply",
buttonParamsJson:
JSON.stringify({
display_text: "proxima",
id: prefix + command
})
}]
}}
message = { messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 }, interactiveMessage }
await ayu.relayMessage(from, { viewOnceMessage: { message } }, {})
}catch(err){
reply("ocorreu um erro: "+err)
console.log(err)
}
break

case 'pornhub':
if (!q) return reply("preciso de algum nome")
try {
await ayu.sendPresenceUpdate('available', from) 
 await ayu.sendPresenceUpdate('composing', from)
apimp4 = await fetchJson(`https://tohka.tech/api/pesquisa/pornhubsrc?nome=${q}&apikey=ddos`)
randomIndex = Math.floor(Math.random() * apimp4.length);
randomResultado = apimp4[randomIndex];
console.log(randomResultado)

await ayu.sendMessage(from, { video: { url: randomResultado.video_preloader }, mimetype: 'video/mp4' }, { quoted: m });
}catch(err){
reply("ocorreu um erro: "+err)
console.log(err)
}
break

case 'spotify':
  if (!q) return reply(`Exemplo: ${prefix + command} 202`);
  reply("buscando")
apiz = await fetchJson(`https://tohka.tech/api/pesquisa/spotify?nome=${q}&apikey=ddos`)
 apidl = await fetchJson(`https://tohka.tech/api/dl/spotify?link=${apiz[0].link}&apikey=ddos`)
 await ayu.sendMessage(m.aqui, { audio: await getBuffer(apidl.resultado.download), mimetype: 'audio/mpeg', ptt: false,  contextInfo:{  
    "externalAdReply": {  
    "showAdAttribution": true,  
    "containsAutoReply": true,
    "renderLargerThumbnail": true,  
    "title": apidl.resultado.titulo, 
    "mediaType": 1,  
    "thumbnail": await getBuffer(apidl.resultado.capa),  
    "mediaUrl": apiz[0].link,  
    "sourceUrl": apiz[0].link
    }}}, { quoted: null }) 
break


case 'ass':
case 'hentai':
case 'milf':
case 'oral':
case 'paizuri':
case 'ecchi':
case 'ero':
try {
await ayu.sendPresenceUpdate('available', from) 
 await ayu.sendPresenceUpdate('composing', from)
hentaitxt = 
`
${command} em ultra hd 🍑
`
interactiveMessage = {
body: {  },
footer: { text: null },
header: { title: "", subtitle: "", imageMessage: await upBailyesimg(`https://tohka.tech/api/hentai/${command}?apikey=ddos`), hasMediaAttachment: true },
nativeFlowMessage: { buttons: [{ 
name: "quick_reply",
buttonParamsJson:
JSON.stringify({
display_text: "proxima",
id: prefix + command
})
}]
}}
message = { messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 }, interactiveMessage }
await ayu.relayMessage(from, { viewOnceMessage: { message } }, {})
}catch(err){
reply("ocorreu um erro: "+err)
console.log(err)
}
break

 }
 } catch (e) {
const isError = String(e)
console.log(isError)
}
})
}

startA()
 
 
 
