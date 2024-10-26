require('./configuração');
const express = require('express');
const app = express();
const session = require('express-session'); 
const cookieParser = require('cookie-parser');
const expressLayout = require('express-ejs-layouts');
const rateLimit = require("express-rate-limit");
const passport = require('passport');
const flash = require('connect-flash');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
const axios = require('axios')
const MemoryStore = require('memorystore')(session);
const compression = require('compression');
const ms = require('ms');
const fs = require('fs')
const favicon = require('serve-favicon');
const multer = require('multer');
const schedule = require('node-schedule');
const responseTime = require('response-time')
const path = require('path');
const moment = require('moment-timezone')
const time = moment().format('DD/MM HH:mm:ss')
const ipfilter = require('express-ipfilter').IpFilter
const mercadopago = require('mercadopago')
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const { usuario, Utils, ig, mensagemSchema, blockedIPs } = require('./backend/modelagem')
const {
TelegraPh
 } = require('./func.backend/uploader')
const { verificaNome, verificaNome2, verificaAdmin, checkVerify, verificaDinheiro2, dinheiroadd, dinheiroretirar, niveladd, nivelretirar, verificanivel, verificanivel2, verificaVerif, expadd, expretirar, verificaexp, verificaexp2, uplvl, addUtil, addRequest,  getTotalReq, getTodayReq, getidveri, verificaAll, verificaZap, tempo_ban, banir, verificar_dias_ban, resetarAllLimit, resetTodayReq, salvardd, verificaNomeig, verificaCodiguin, addcodiguin, enviar_email, enviar_email_foto } = require('./backend/db');
const { isAuthenticated } = require('./func.backend/auth');
const { connectMongoDb } = require('./backend/connect');
const { getTotalUser, setperfil, verificar_dias_expirados, verificar_img, tempo_expirado, adicionar_premium, deletar_premium, checkPremium } = require('./backend/premium');
const { getHashedPassword, randomText } = require('./func.backend/function');
//const {  } = require('./tohkabot');
const { getBuffer , getRandom} = require("./func.backend/buff");
const apiRouters = require('./servidor.backend/api');
const userRouters = require('./servidor.backend/users');
const premiumRouters = require('./servidor.backend/premium');
const verifyRouters = require('./servidor.backend/verify');

var achou = false;
var countNumber = -1;
var countChat = -1;

connectMongoDb();

app.set('trust proxy', 1);
app.use(compression())





app.use(favicon('./views/icone.ico'));

app.set('view engine', 'ejs');
app.use(expressLayout);
app.use(express.static('public'));

const accessToken = "APP_USR-528293201703438-061622-434cd46a0ff1b8552cd48cdca0f20085-1340842331" // Token do Mercado Pago    
mercadopago.configure({
access_token: accessToken
});



app.use(session({
secret: 'secret',
resave: true,
saveUninitialized: true,
cookie: { maxAge: 86400000 },
store: new MemoryStore({
checkPeriod: 86400000
}),
}));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

app.use(passport.initialize());
app.use(passport.session());
require('./func.backend/passaporte_configu')(passport);

app.use(flash());


app.use(function(req, res, next) {
res.locals.success_msg = req.flash('success_msg');
res.locals.error_msg = req.flash('error_msg');
res.locals.pagamento = req.flash('pagamento');
res.locals.error = req.flash('error');
res.locals.user = req.user || null;
next();
})


app.use('/api', apiRouters);
app.use('/i', userRouters);
app.use('/admin', premiumRouters);
app.use('/verificar', verifyRouters);

if (!fs.existsSync('./public/file')) fs.mkdirSync('./public/file')

function makeid(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() *
            charactersLength));
    }
    return result;
}

function abreviark(valor) {
    var abreviado = new Intl.NumberFormat( 'pt-BR', { maximumFractionDigits: 1,notation: "compact" , compactDisplay: "short" }).format(valor)
    return abreviado;
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

function naodormeporra() {
  axios.get('https://tohka.tech')
   .then(response => {
      console.log("acordando");
    })
   .catch(error => {
      console.error(error);
    });
}

app.use(function(req, res, next) {
  addRequest();
  next();
})

const storage = multer.diskStorage({
    destination: 'public/file',
    filename: (req, file, cb) => {
        cb(null, makeid(5))
    }
});



const upload = multer({
    storage,
    limits: {
        fileSize: 100000000 // 100 MB
    }
})

app.get('/upload', async (req, res) => { 
let userjid = await getTotalUser()
res.render('uploadakame', {
layout: 'uploadakame'
});
});

app.get('/bemvindo', (req, res) => {
  res.render('welcome', {
    layout: 'welcome'
  });
});

app.get('/phlogo', (req, res) => {
  res.render('ph', {
    layout: 'ph'
  });
});

app.get('/biancateamo', (req, res) => {
  res.render('bianca', {
    layout: 'bianca'
  });
});


app.use((req, res, next) => {
  console.log(`Request from:`);
  console.log(`  IP: ${req.ip}`);
  console.log(`  URL: ${req.originalUrl}`);
  console.log(`  Method: ${req.method}`);
  console.log(`  Headers: ${JSON.stringify(req.headers)}`);
  console.log(`  Query: ${JSON.stringify(req.query)}`);
  console.log(`  Body: ${JSON.stringify(req.body)}`);
  if (req.accepts('json')) {
    console.log(`  Accepts JSON: true`);
  }
  next();
});


app.post('/puxada/numero', async (req, res) => {
let { tel } = req.body;
if (isNaN(tel)) {
req.flash('error_msg', 'use apenas números, nada de inserir letras.');
return res.redirect('/painel');
} else if (tel.length >= 12) {
req.flash('error_msg', 'este número e muito grande para ser um número br!!\n\n❗MODO DE INSERIR O NÚMERO❗\n\n✅ : 62981386093\n❎ : +55 62 98138-6093');
return res.redirect('/painel');
} else if (tel.length <= 9) {
req.flash('error_msg', 'este número e muito pequeno para ser um número br!!\n\n❗MODO DE INSERIR O NÚMERO❗\n\n✅ : 62981386093\n❎ : +55 62 98138-6093');
return res.redirect('/painel');
} else if (tel.length == 10) {
var resultado3 = tel.replace(/(\d{2})/, "$19")
req.flash('error_msg', `Identifiquei que esse número tem um 9 a menos tente colocar mais ou menos assim:\n\n❌ - ERRADO: ${tel}\n✅ - CERTO (ou não): ${resultado3}\n\n Caso eu tenha configurado errado, ajuste manualmente.`);
return res.redirect('/painel');
} else {
try {
api_tel = await fetchJson(`http://node-01.starhosting.com.br:22573/consultas/24f7f3c88b81b7a25ac8cad39f29a1c6/cpf/telefone/${tel}`)
console.log(api_tel)
req.flash('error_msg', `${api_tel.resultado}`);
return res.redirect('/painel');
} catch(err) {
req.flash('error_msg', `não encontrado`);
return res.redirect('/painel');
}
}
})

app.post('/puxada/cpf', async (req, res) => {
let { cpf } = req.body;
if (isNaN(cpf)) {
req.flash('error_msg', 'use apenas números, nada de inserir letras.');
return res.redirect('/painel');
} else {
try {
api_tel = await fetchJson (`http://node-01.starhosting.com.br:22573/consultas/24f7f3c88b81b7a25ac8cad39f29a1c6/cpf/${cpf}`)
console.log(api_tel.resultado)
req.flash('error_msg', `${api_tel.resultado}`);
return res.redirect('/painel');
} catch(err) {
req.flash('error_msg', `não encontrado`);
return res.redirect('/painel');
}
}
})

app.post('/puxada/nome', async (req, res) => {
let { nome } = req.body;
try {
api_tel = await fetchJson (`http://node-01.starhosting.com.br:22573/consultas/24f7f3c88b81b7a25ac8cad39f29a1c6/cpf/nome/${nome}`)
console.log(api_tel)
buffer = Buffer.from(api_tel.base64, 'base64');
puxy = buffer.toString('utf8');
req.flash('error_msg', `${puxy}`);
return res.redirect('/painel');
} catch(err) {
req.flash('error_msg', `não encontrado`);
return res.redirect('/painel');
}
})



//**Upload de Arquivo e Integração com a API do GitHub**
//=====================================================

//### Configurações da API do GitHub

const githubToken = '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';
const repoOwner = 'sayo-apiz';
const repoName = 'tohka-perfils';

//### Upload de Arquivo

app.post('/arquivo', isAuthenticated, upload.single('file'), async (req, res) => {
  try {
    // Verifica se o arquivo foi carregado
    if (!req.file || !req.file.path) {
      req.flash('error_msg', 'Nenhum arquivo foi carregado');
      return res.redirect('/arquivo'); // redirect back to the same page
    }

    // Verifica se o arquivo é uma imagem
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      req.flash('error_msg', 'Somente imagens são permitidas');
      return res.redirect('/arquivo'); // redirect back to the same page
    }

    // Obtem as informações do usuário
    let { nome_usuario, numero_zap, email } = req.user;

    // Configura o endpoint da API do GitHub
    const fileName = req.file.filename;
    const apiEndpoint = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${fileName}`;

    // Lê o arquivo para upload
    const fileBuffer = await getBuffer(`https://${req.hostname}/file/${req.file.filename}`);

    // Configura o cabeçalho da requisição
    const headers = {
      'Authorization': `Bearer ${githubToken}`,
      'Content-Type': 'application/json'
    };

    // Configura o corpo da requisição
    const data = {
      'message': `Upload do arquivo ${fileName}`,
      'content': fileBuffer.toString('base64')
    };

    // Faz a requisição para upload do arquivo
    axios.put(apiEndpoint, data, { headers })
      .then(response => {
        const fileUrl = response.data.content.download_url;
        console.log(fileUrl);
        setperfil(nome_usuario, fileUrl);
        req.flash('success_msg', `Sua foto de perfil foi customizada!`);
        res.redirect('/perfil');
      })
      .catch(error => {
        console.error(error);
        req.flash('error_msg', 'Erro interno do servidor');
        res.redirect('/perfil'); // redirect back to the same page
      });
  } catch (error) {
    console.error(error);
    req.flash('error_msg', 'Erro interno do servidor');
    res.redirect('/perfil'); // redirect back to the same page
  }
});

app.post('/multi-upload', upload.array('files', 10), (req, res) => {
    if (!req.files) return res.status(400).json({
        status: false,
        mensagem: "Nenhum arquivo foi carregado"
    })
    const resultado = []
    req.files.forEach(v => {
        resultado.push({
            nomeoriginal: v.originalname,
            encoding: v.encoding,
            tipo: v.mimetype,
            tamanho: v.size,
            link: "https://" + req.hostname + "/file/" + v.filename
        })
    });
    res.status(200).json({
        status: true,
        criador: "@breno",
        resultado: resultado
    })
})

app.get('/resgatar', isAuthenticated, async (req, res) => { 
let userjid = await getTotalUser()
let {
		apikey, nome_usuario, limit, premium, totalreq, numero_zap, admin, perfil, dinheiro, nivel, exp, banido, motivo_ban
	} = req.user
	let reqXp  = 5000 * (Math.pow(2, nivel) - 1);
let cekeban = ms(banido - Date.now())
let expiredban = '0 d'
let exp_abreviado = new Intl.NumberFormat( 'pt-BR', { maximumFractionDigits: 1,notation: "compact" , compactDisplay: "short" }).format(exp)
let dinheiro_abreviado = new Intl.NumberFormat( 'pt-BR', { maximumFractionDigits: 1,notation: "compact" , compactDisplay: "short" }).format(dinheiro)
let req_abreviado = new Intl.NumberFormat( 'pt-BR', { maximumFractionDigits: 1,notation: "compact" , compactDisplay: "short" }).format(totalreq)
let limit_abreviado = new Intl.NumberFormat( 'pt-BR', { maximumFractionDigits: 1,notation: "compact" , compactDisplay: "short" }).format(limit)
	if (cekeban !== null) {
		expiredban = cekeban
	}
		if (banido !== null) {
		res.render('banido', {
		expiredban,
		motivo_ban,
			layout: 'banido'
		});
} else {
res.render('resgatar', {
		nome_usuario,
		apikey,
		limit,
		premium,
		totalreq,
		dinheiro,
		nivel,
		exp,
		admin,
		reqXp,
		abreviar,
layout: 'resgatar'
});
}
});

app.get('/docs/especial', isAuthenticated, async (req, res) => { 
let userjid = await getTotalUser()
let {
		apikey, nome_usuario, limit, premium, totalreq, numero_zap, admin, perfil, dinheiro, nivel, exp, banido, motivo_ban
	} = req.user
	let reqXp  = 5000 * (Math.pow(2, nivel) - 1);
let cekeban = ms(banido - Date.now())
let expiredban = '0 d'
let exp_abreviado = new Intl.NumberFormat( 'pt-BR', { maximumFractionDigits: 1,notation: "compact" , compactDisplay: "short" }).format(exp)
let dinheiro_abreviado = new Intl.NumberFormat( 'pt-BR', { maximumFractionDigits: 1,notation: "compact" , compactDisplay: "short" }).format(dinheiro)
let req_abreviado = new Intl.NumberFormat( 'pt-BR', { maximumFractionDigits: 1,notation: "compact" , compactDisplay: "short" }).format(totalreq)
let limit_abreviado = new Intl.NumberFormat( 'pt-BR', { maximumFractionDigits: 1,notation: "compact" , compactDisplay: "short" }).format(limit)
	if (cekeban !== null) {
		expiredban = cekeban
	}
		if (banido !== null) {
		res.render('banido', {
		expiredban,
		motivo_ban,
			layout: 'banido'
		});
} else {
res.render('especial', {
		nome_usuario,
		apikey,
		limit,
		premium,
		totalreq,
		dinheiro,
		nivel,
		exp,
		admin,
		reqXp,
		abreviar,
layout: 'especial'
});
}
});

app.get('/docs/ferramentas', isAuthenticated, async (req, res) => { 
let userjid = await getTotalUser()
let {
		apikey, nome_usuario, limit, premium, totalreq, numero_zap, admin, perfil, dinheiro, nivel, exp, banido, motivo_ban
	} = req.user
	let reqXp  = 5000 * (Math.pow(2, nivel) - 1);
let cekeban = ms(banido - Date.now())
let expiredban = '0 d'
	if (cekeban !== null) {
		expiredban = cekeban
	}
		if (banido !== null) {
		res.render('banido', {
		expiredban,
		motivo_ban,
			layout: 'banido'
		});
} else {
res.render('ferramentas', {
		nome_usuario,
		apikey,
		limit,
		premium,
		totalreq,
		dinheiro,
		nivel,
		exp,
		admin,
		reqXp,
		abreviar,
layout: 'ferramentas'
});
}
});

app.get('/docs/download', isAuthenticated, async (req, res) => { 
let userjid = await getTotalUser()
let {
		apikey, nome_usuario, limit, premium, totalreq, numero_zap, admin, perfil, dinheiro, nivel, exp, banido, motivo_ban
	} = req.user
	let reqXp  = 5000 * (Math.pow(2, nivel) - 1);
let cekeban = ms(banido - Date.now())
let expiredban = '0 d'
	if (cekeban !== null) {
		expiredban = cekeban
	}
		if (banido !== null) {
		res.render('banido', {
		expiredban,
		motivo_ban,
			layout: 'banido'
		});
} else {
res.render('download', {
		nome_usuario,
		apikey,
		limit,
		premium,
		totalreq,
		dinheiro,
		nivel,
		exp,
		admin,
		reqXp,
		abreviar,
layout: 'download'
});
}
});

app.get('/docs/textpro', isAuthenticated, async (req, res) => { 
let userjid = await getTotalUser()
let {
		apikey, nome_usuario, limit, premium, totalreq, numero_zap, admin, perfil, dinheiro, nivel, exp, banido, motivo_ban
	} = req.user
	let reqXp  = 5000 * (Math.pow(2, nivel) - 1);
let cekeban = ms(banido - Date.now())
let expiredban = '0 d'
	if (cekeban !== null) {
		expiredban = cekeban
	}
		if (banido !== null) {
		res.render('banido', {
		expiredban,
		motivo_ban,
			layout: 'banido'
		});
} else {
res.render('textpro', {
		nome_usuario,
		apikey,
		limit,
		premium,
		totalreq,
		dinheiro,
		nivel,
		exp,
		admin,
		reqXp,
		abreviar,
layout: 'textpro'
});
}
});

app.get('/docs/pesquisa', isAuthenticated, async (req, res) => { 
let userjid = await getTotalUser()
let {
		apikey, nome_usuario, limit, premium, totalreq, numero_zap, admin, perfil, dinheiro, nivel, exp, banido, motivo_ban
	} = req.user
	let reqXp  = 5000 * (Math.pow(2, nivel) - 1);
let cekeban = ms(banido - Date.now())
let expiredban = '0 d'
	if (cekeban !== null) {
		expiredban = cekeban
	}
		if (banido !== null) {
		res.render('banido', {
		expiredban,
		motivo_ban,
			layout: 'banido'
		});
} else {
res.render('pesquisa', {
		nome_usuario,
		apikey,
		limit,
		premium,
		totalreq,
		dinheiro,
		nivel,
		exp,
		admin,
		reqXp,
		abreviar,
layout: 'pesquisa'
});
}
});

app.get('/docs/canvas', isAuthenticated, async (req, res) => { 
let userjid = await getTotalUser()
let {
		apikey, nome_usuario, limit, premium, totalreq, numero_zap, admin, perfil, dinheiro, nivel, exp, banido, motivo_ban
	} = req.user
	let reqXp  = 5000 * (Math.pow(2, nivel) - 1);
let cekeban = ms(banido - Date.now())
let expiredban = '0 d'
	if (cekeban !== null) {
		expiredban = cekeban
	}
		if (banido !== null) {
		res.render('banido', {
		expiredban,
		motivo_ban,
			layout: 'banido'
		});
} else {
res.render('canvas', {
		nome_usuario,
		apikey,
		limit,
		premium,
		totalreq,
		dinheiro,
		nivel,
		exp,
		admin,
		reqXp,
		abreviar,
layout: 'canvas'
});
}
});

app.get('/docs/porno', isAuthenticated, async (req, res) => { 
let userjid = await getTotalUser()
let {
		apikey, nome_usuario, limit, premium, totalreq, numero_zap, admin, perfil, dinheiro, nivel, exp, banido, motivo_ban
	} = req.user
	let reqXp  = 5000 * (Math.pow(2, nivel) - 1);
let cekeban = ms(banido - Date.now())
let expiredban = '0 d'
	if (cekeban !== null) {
		expiredban = cekeban
	}
		if (banido !== null) {
		res.render('banido', {
		expiredban,
		motivo_ban,
			layout: 'banido'
		});
} else {
res.render('porno', {
		nome_usuario,
		apikey,
		limit,
		premium,
		totalreq,
		dinheiro,
		nivel,
		exp,
		admin,
		reqXp,
		abreviar,
layout: 'porno'
});
}
});

app.get('/docs/anime', isAuthenticated, async (req, res) => { 
let userjid = await getTotalUser()
let {
		apikey, nome_usuario, limit, premium, totalreq, numero_zap, admin, perfil, dinheiro, nivel, exp, banido, motivo_ban
	} = req.user
	let reqXp  = 5000 * (Math.pow(2, nivel) - 1);
let cekeban = ms(banido - Date.now())
let expiredban = '0 d'
	if (cekeban !== null) {
		expiredban = cekeban
	}
		if (banido !== null) {
		res.render('banido', {
		expiredban,
		motivo_ban,
			layout: 'banido'
		});
} else {
res.render('anime', {
		nome_usuario,
		apikey,
		limit,
		premium,
		totalreq,
		dinheiro,
		nivel,
		exp,
		admin,
		reqXp,
		abreviar,
layout: 'anime'
});
}
});

app.get('/docs/outros', isAuthenticated, async (req, res) => { 
let userjid = await getTotalUser()
let {
		apikey, nome_usuario, limit, premium, totalreq, numero_zap, admin, perfil, dinheiro, nivel, exp, banido, motivo_ban
	} = req.user
	let reqXp  = 5000 * (Math.pow(2, nivel) - 1);
let cekeban = ms(banido - Date.now())
let expiredban = '0 d'
	if (cekeban !== null) {
		expiredban = cekeban
	}
		if (banido !== null) {
		res.render('banido', {
		expiredban,
		motivo_ban,
			layout: 'banido'
		});
} else {
res.render('outros', {
		nome_usuario,
		apikey,
		limit,
		premium,
		totalreq,
		dinheiro,
		nivel,
		exp,
		admin,
		reqXp,
		abreviar,
layout: 'outros'
});
}
});

app.get('/', (req, res) => {
let coress = ['red.css','yellow.css','blue.css','purple.css']
const indiceAleatorio = Math.floor(Math.random() * coress.length);
const cores = coress[indiceAleatorio];
res.render('inicial', {
cores,
layout: 'inicial'
});
//req.flash('error_msg', 'opa, limit abaixou para: 10, caso queira limit infinito crie sua conta e mande mensagem para mim adicionar o premium, relxa que e 100% gratuito!');
});

app.get('/assistente', isAuthenticated, async (req, res) => { 
let userjid = await getTotalUser()
let total = await getTotalReq()
let today = await getTodayReq()
let {
		apikey, nome_usuario, limit, premium, totalreq, numero_zap, admin, perfil, dinheiro, nivel, exp, banido, motivo_ban, musica
	} = req.user
	let cekexp = ms(await verificar_dias_expirados(nome_usuario) - Date.now())
	let expired = '0 d'
	let ppcheck = await verificar_img(nome_usuario)
	let Lista = await usuario.find({})
	let reqXp  = 5000 * (Math.pow(2, nivel) - 1);
	if (cekexp !== null) {
		expired = cekexp
	}
	let imgpadrao = 'https://telegra.ph/file/60b4caf561c9585eb8dd0.jpg'
        let mscpadrao = 'https://ayu-api.cf/audio/musica.mp3'
	let cekeban = ms(banido - Date.now())
let expiredban = '0 d'
	if (cekeban !== null) {
		expiredban = cekeban
	}
		if (banido !== null) {
		res.render('banido', {
		expiredban,
		motivo_ban,
			layout: 'banido'
		});
} else {
res.render('assistente', {
		nome_usuario,
		apikey,
		limit,
		premium,
		totalreq,
		totalrg: userjid,
		numero_zap,
		expired,
		admin,
		imgpadrao,
		perfil,
                musica,
                mscpadrao,
		expired,
		Lista,
		dinheiro,
		nivel,
		exp,
		reqXp,
		total,
		today,
		abreviar,
		porta,
layout: 'assistente'
});
}
});

const MODEL_NAME = "gemini-pro";
const API_KEY = "AIzaSyCLVJdE0YEg 4s-eRzBjS3g2G1bboep-ONU";

// Set up Google Generative AI model
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: MODEL_NAME });

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SPAM,
    threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_INFECTION,
    threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
  },
  // ... other safety settings
];

// Define chat history
const chatHistory = [
  {
    role: "user",
    parts: [{ text: "Olá, Tohka! Quem é o seu desenvolvedor?" }],
  },
  {
    role: "model",
    parts: [{ text: "Olá, 😊 Meu desenvolvedor é o incrível Sayoz! 🙌" }],
  },
  {
    role: "user",
    parts: [{ text: "Você é uma assistente chamada tohka amigável que trabalha para o sayoz.  não se esqueça de ser fofa e um pouco sarcástica" }],
  },
  {
    role: "user",
    parts: [{ text: "Uau, que legal! O que você pode fazer?" }],
  },
  {
    role: "model",
    parts: [{ text: "Posso ajudar com tudo! 🤔 Desde responder perguntas até criar histórias. O que você precisa?" }],
  },
  {
    role: "user",
    parts: [{ text: "Eu preciso de ajuda com uma pergunta de matemática." }],
  },
  {
    role: "model",
    parts: [{ text: "Claro! Qual é a pergunta de matemática que você precisa de ajuda?" }],
  },
  // ... more chat history
];

async function runChat(userInput) {
  const generationConfig = {
    temperature: 0.7,
    topK: 40,
    topP: 0.9,
    maxOutputTokens: 2000,
  };

  const chat = model.startChat({
    generationConfig,
    history: chatHistory,
  });

  let response;
  let attempts = 0;
  const maxAttempts = 100; // adjust this value according to your needs

  while (attempts < maxAttempts) {
    try {
      const result = await chat.sendMessage(userInput);
      response = result.response;
      if (response.text() === undefined || response.text() === '') {
        throw new Error('Response is empty or undefined');
      }
      break;
    } catch (error) {
      console.error(`Error on attempt ${attempts + 1}:`, error);
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 2000)); // wait 2 seconds before retrying
    }
  }

  if (!response) {
    console.error('Failed to generate response after', maxAttempts, 'attempts');
    response = 'Desculpe, não consegui entender sua pergunta. Por favor, tente novamente.';
  }

  return response.text() ? response.text() : 'Desculpe, não consegui entender sua pergunta. Por favor, tente novamente.';
}




app.post('/chat', async (req, res) => {
  try {
    const userInput = req.body?.userInput;
    console.log('incoming /chat req', userInput)
    if (!userInput) {
      return res.status(400).json({ error: 'ops' });
    }

    const response = await runChat(userInput);
    res.json({ response });
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({ error: 'error' });
  }
});



app.get('/docs', isAuthenticated, async (req, res) => { 
let userjid = await getTotalUser()
let total = await getTotalReq()
let today = await getTodayReq()
let {
		apikey, nome_usuario, limit, premium, totalreq, numero_zap, admin, perfil, dinheiro, nivel, exp, banido, motivo_ban, musica
	} = req.user
	let cekexp = ms(await verificar_dias_expirados(nome_usuario) - Date.now())
	let expired = '0 d'
	let ppcheck = await verificar_img(nome_usuario)
	let Lista = await usuario.find({})
	let reqXp  = 5000 * (Math.pow(2, nivel) - 1);
	if (cekexp !== null) {
		expired = cekexp
	}
	let imgpadrao = 'https://telegra.ph/file/60b4caf561c9585eb8dd0.jpg'
        let mscpadrao = 'https://ayu-api.cf/audio/musica.mp3'
	let cekeban = ms(banido - Date.now())
let expiredban = '0 d'
	if (cekeban !== null) {
		expiredban = cekeban
	}
		if (banido !== null) {
		res.render('banido', {
		expiredban,
		motivo_ban,
			layout: 'banido'
		});
} else {
res.render('docs', {
		nome_usuario,
		apikey,
		limit,
		premium,
		totalreq,
		totalrg: userjid,
		numero_zap,
		expired,
		admin,
		imgpadrao,
		perfil,
                musica,
                mscpadrao,
		expired,
		Lista,
		dinheiro,
		nivel,
		exp,
		reqXp,
		total,
		today,
		abreviar,
		porta,
layout: 'docs'
});
}
});

app.get('/perfil', isAuthenticated, async (req, res) => {
	let {
		apikey, nome_usuario, limit, premium, totalreq, numero_zap, admin, perfil, dinheiro, nivel, exp, banido, motivo_ban, bronze, prata, ouro, diamante, musica, email, instagram
	} = req.user
	let cekexp = ms(await verificar_dias_expirados(nome_usuario) - Date.now())
	let expired = '0 d'
	let ppcheck = await verificar_img(nome_usuario)
	let Lista = await usuario.find({})
	let reqXp  = 5000 * (Math.pow(2, nivel) - 1);
	if (cekexp !== null) {
		expired = cekexp
	}
let imgpadrao = 'https://telegra.ph/file/60b4caf561c9585eb8dd0.jpg'
let mscpadrao = 'https://ayu-api.cf/audio/musica.mp3'
let cekeban = ms(banido - Date.now())
let expiredban = '0 d'
	if (cekeban !== null) {
		expiredban = cekeban
	}
		if (banido !== null) {
		res.render('banido', {
		expiredban,
		motivo_ban,
			layout: 'banido'
		});
} else {
	res.render('perfil', {
		nome_usuario,
		apikey,
		limit,
		premium,
		totalreq,
		expired,
		numero_zap,
		expired,
		admin,
		imgpadrao,
        mscpadrao,
		perfil,
        musica,
        email,
        instagram,
		expired,
		Lista,
		dinheiro,
		nivel,
		exp,
		reqXp,
		banido,
		abreviar,
		bronze,
		prata,
		ouro,
		diamante,
		layout: 'perfil'
	});
	}
});

app.get('/jogo/matematica', isAuthenticated, async (req, res) => {
	let {
		apikey, nome_usuario, limit, premium, totalreq, numero_zap, admin, perfil, dinheiro, nivel, exp, banido, motivo_ban
	} = req.user
	let cekexp = ms(await verificar_dias_expirados(nome_usuario) - Date.now())
	let expired = '0 d'
	let ppcheck = await verificar_img(nome_usuario)
	let Lista = await usuario.find({})
	let reqXp  = 5000 * (Math.pow(2, nivel) - 1);
	if (cekexp !== null) {
		expired = cekexp
	}
	let imgpadrao = 'https://telegra.ph/file/60b4caf561c9585eb8dd0.jpg'
let cekeban = ms(banido - Date.now())
let expiredban = '0 d'
	if (cekeban !== null) {
		expiredban = cekeban
	}
		if (banido !== null) {
		res.render('banido', {
		expiredban,
		motivo_ban,
			layout: 'banido'
		});
} else {
	res.render('matematica', {
		nome_usuario,
		apikey,
		limit,
		premium,
		totalreq,
		expired,
		numero_zap,
		expired,
		admin,
		imgpadrao,
		perfil,
		expired,
		Lista,
		dinheiro,
		nivel,
		exp,
		reqXp,
		banido,
		abreviar,
		dinheiroadd,
		layout: 'matematica'
	});
	}
});

app.get('/painel', isAuthenticated, async (req, res) => { 
let userjid = await getTotalUser()
let {
		apikey, nome_usuario, limit, premium, totalreq, numero_zap, admin, perfil, dinheiro, nivel, exp, banido, motivo_ban
	} = req.user
	let reqXp  = 5000 * (Math.pow(2, nivel) - 1);
if (admin == null) return req.flash('error_msg', 'somente o admin supremo pode entrar nessa rota!') && res.redirect('/docs');
let cekeban = ms(banido - Date.now())
let expiredban = '0 d'
	if (cekeban !== null) {
		expiredban = cekeban
	}
		if (banido !== null) {
		res.render('banido', {
		expiredban,
		motivo_ban,
			layout: 'banido'
		});
} else {
res.render('painel', {
		nome_usuario,
		apikey,
		limit,
		premium,
		totalreq,
		dinheiro,
		nivel,
		exp,
		admin,
		reqXp,
		abreviar,
layout: 'painel'
});
}
});

app.get("/perfil/:usuario", async (req, res) => {
let userpp = req.params.usuario || '';
let checking = await verificaNome(userpp);
//console.log(userpp)
if (!checking) return req.flash('error_msg', 'Este usuário não tem perfil!') && res.redirect('/perfil/nao/foi/encontrado');
	let cekexp = ms(await verificar_dias_expirados(userpp) - Date.now())
	let expired = '0 d'
	let allperfil = await verificaAll(userpp)
//console.log(allperfil.perfil)		
/*	console.log(verificaexpkk)	
	console.log(nivelkkuser)
	console.log(ppcheck)
	console.log(verificadinheirokk)*/
	let reqXp  = 5000 * (Math.pow(2, allperfil.nivel) - 1);
	if (cekexp !== null) {
		expired = cekexp
	}
	let imgpadrao = 'https://telegra.ph/file/60b4caf561c9585eb8dd0.jpg'
        let mscpadrao = 'https://ayu-api.cf/audio/musica.mp3'
	res.render('perfiluser', {
		nome_usuario: allperfil.nome_usuario,
		apikey: allperfil.apikey,
		limit: allperfil.limit,
		premium: allperfil.premium,
		totalreq: allperfil.totalreq,
		expired,
		numero_zap: allperfil.numero_zap,
		admin: allperfil.admin,
		imgpadrao,
                mscpadrao,
                musica: allperfil.musica,
		perfil: allperfil.perfil,
		dinheiro: allperfil.dinheiro,
		nivel: allperfil.nivel,
		exp: allperfil.exp,
		reqXp,
		banido: allperfil.banido,
		abreviar,
		layout: 'perfiluser'
	});
});

app.get('/msgbot', isAuthenticated, async(req, res) => {
	let {
		apikey, nome_usuario, limit, premium, totalreq, numero_zap, admin, perfil, dinheiro, nivel, exp, banido, motivo_ban
	} = req.user
	let cekexp = ms(await verificar_dias_expirados(nome_usuario) - Date.now())
	let expired = '0 d'
	let ppcheck = await verificar_img(nome_usuario)
	let Lista = await usuario.find({})
	let reqXp  = 5000 * (Math.pow(2, nivel) - 1);
	if (cekexp !== null) {
		expired = cekexp
	}
	if (admin == null) return req.flash('error_msg', 'somente o admin supremo pode entrar nessa rota!') && res.redirect('/docs');
	let imgpadrao = 'https://telegra.ph/file/60b4caf561c9585eb8dd0.jpg'
res.render('msgbot', {
		nome_usuario,
		apikey,
		limit,
		premium,
		totalreq,
		expired,
		numero_zap,
		expired,
		admin,
		imgpadrao,
		perfil,
		expired,
		Lista,
		dinheiro,
		nivel,
		exp,
		reqXp,
		abreviar,
 layout: 'msgbot'
})
})

app.get('/valores', isAuthenticated, async (req, res) => {
	let {
		apikey, nome_usuario, limit, premium, totalreq, numero_zap, admin, perfil, dinheiro, nivel, exp, banido, motivo_ban, bronze, prata, ouro, diamante, musica, email, instagram
	} = req.user
	let cekexp = ms(await verificar_dias_expirados(nome_usuario) - Date.now())
	let expired = '0 d'
	let ppcheck = await verificar_img(nome_usuario)
	let Lista = await usuario.find({})
	let reqXp  = 5000 * (Math.pow(2, nivel) - 1);
	if (cekexp !== null) {
		expired = cekexp
	}
let imgpadrao = 'https://telegra.ph/file/60b4caf561c9585eb8dd0.jpg'
let mscpadrao = 'https://ayu-api.cf/audio/musica.mp3'
let cekeban = ms(banido - Date.now())
let expiredban = '0 d'
	if (cekeban !== null) {
		expiredban = cekeban
	}
		if (banido !== null) {
		res.render('banido', {
		expiredban,
		motivo_ban,
			layout: 'banido'
		});
} else {
	res.render('valores', {
		nome_usuario,
		apikey,
		limit,
		premium,
		totalreq,
		expired,
		numero_zap,
		expired,
		admin,
		imgpadrao,
        mscpadrao,
		perfil,
        musica,
        email,
        instagram,
		expired,
		Lista,
		dinheiro,
		nivel,
		exp,
		reqXp,
		banido,
		abreviar,
		bronze,
		prata,
		ouro,
		diamante,
		layout: 'valores'
	});
	}
});

app.get('/verifica', (req, res) => {
  res.render('verifica', {
    layout: 'verifica'
  });
});

app.get('/info', (req, res) => {
  res.render('info', {
    layout: 'info'
  });
});

app.get('/dinheiro', isAuthenticated, async (req, res) => { 
	let {
		apikey, nome_usuario, limit, premium, totalreq, numero_zap, admin, perfil, dinheiro, nivel, exp, banido, motivo_ban
	} = req.user
	let cekexp = ms(await verificar_dias_expirados(nome_usuario) - Date.now())
	let expired = '0 d'
	let ppcheck = await verificar_img(nome_usuario)
	let Lista = await usuario.find({})
	let reqXp  = 5000 * (Math.pow(2, nivel) - 1);
	if (cekexp !== null) {
		expired = cekexp
	}
	let imgpadrao = 'https://telegra.ph/file/60b4caf561c9585eb8dd0.jpg'
let cekeban = ms(banido - Date.now())
let expiredban = '0 d'
	if (cekeban !== null) {
		expiredban = cekeban
	}
		if (banido !== null) {
		res.render('banido', {
		expiredban,
		motivo_ban,
			layout: 'banido'
		});
} else {
res.render('dinheirop', {
		nome_usuario,
		apikey,
		limit,
		premium,
		totalreq,
		expired,
		numero_zap,
		expired,
		admin,
		imgpadrao,
		perfil,
		expired,
		Lista,
		dinheiro,
		nivel,
		exp,
		reqXp,
		abreviar,
layout: 'dinheirop'
});
}
});



app.post('/comprar', isAuthenticated, async (req, res) => {
let { apikey, nome_usuario } = req.user
const email = 'focograal@gmail.com';
const payment_data = {
transaction_amount: 15.99,
description: 'Premium tohka.tech',
payment_method_id: 'pix',
payer: {
email,
first_name: `tohka premium`,
}
};
const data = await mercadopago.payment.create(payment_data);
const base64_img = data.body.point_of_interaction.transaction_data.qr_code_base64
const buf = Buffer.from(base64_img, 'base64');
const dateStr = data.body.date_of_expiration;
const date = new Date(dateStr);
const randomnumber = Math.floor(Math.random() * 999) 
const unixTimestamp = Math.floor(date.getTime() / 1000);
fs.writeFileSync(`./public/img/qr_code_${randomnumber}.png`, buf);  
pixx = data.body.point_of_interaction.transaction_data.qr_code
linkqr = `https://tohka.tech/img/qr_code_${randomnumber}.png`
q = pixx + 'CODIGOMORCEKK' + linkqr
console.log(q)
console.log(linkqr)
console.log(pixx)
req.flash('pagamento', q);
res.redirect('/valores')
let tentativas = 0;
tentativas++;
const resr = await mercadopago.payment.get(data.body.id);
const pagamentoStatus = resr.body.status;
if (tentativas >= 10 || pagamentoStatus === 'approved') {
clearInterval(interval);
if (pagamentoStatus === 'approved') {
console.clear()
await adicionar_premium(nome_usuario, apikey, '15d')
req.flash('sucess_msg', `Pagamento: ${data.body.id} foi aprovado com sucesso!\n\n seu premium foi adicionado!`);
res.redirect('/perfil')
console.log()
gerarUsuario(randomnome, hashedPassword, null, null, null, null, '30d');
} 
else if (pagamentoStatus !== 'approved') {
console.clear()    
req.flash('error_msg', '❗ Desculpe você demorou mais de 10 Minuto para realizar o pagamento');
res.redirect('/valores')
fs.unlinkSync(`./public/img/qr_code_${randomnumber}.png`) 
}
}
})

app.post('/verficarconta', async (req, res) => {
let { username } = req.body;
let checking = await verificaNome(username);
let checking2 = await verificaVerif(username);
if (!checking) {
req.flash('error_msg', 'O nome de usuário não está registrado');
return res.redirect('/verifica');
} else if (checking2 === 'verificado') {
req.flash('error_msg', 'você ja verificou sua conta!');
return res.redirect('/i/entrar');
} else {
let iduserkk = await getidveri(username);
console.log(req.hostname + 'verificar/conta?id=' + iduserkk)
return res.redirect('/verificar/conta?id=' + iduserkk)
}
})

app.post('/codiguin', isAuthenticated, async(req, res) => {
let { numero_zap, nome_usuario, resgatar, valoresgatar, apikey } = req.user
let { codigo } = req.body;
let checking = await verificaCodiguin(nome_usuario);
if (resgatar === codigo) {
req.flash('error_msg', 'parabèns, você reivindicou ' + valoresgatar + ' de dinheiro');
dinheiroadd(apikey, valoresgatar)
addcodiguin(nome_usuario, null, null)
return res.redirect('/resgatar');
} else {
req.flash('error_msg', 'Código inválido');
return res.redirect('/resgatar');
}
})


app.post('/perfil', isAuthenticated, async(req, res) => {
let { numero_zap, nome_usuario, email } = req.user
let { username } = req.body
let checkUser = await verificaNome(username);
if (checkUser) {
 req.flash('error_msg', 'Este nome ja existe.');
 res.redirect('/perfil');
} else {
if (username !== null) usuario.updateOne({numero_zap: numero_zap}, {nome_usuario: username}, function (err, res) { if (err) throw err;})
 req.flash('success_msg', 'Seu Nome foi modificado com sucesso :)');
enviar_email(`❗ _NOME_ ❗\n\n Olá ${nome_usuario} você acabou de alterar seu nome para : ${username}\n\n\npor ventura não foi você que mudou, contate algum administrador do site`, email)
 res.redirect('/perfil')
}
})

app.post('/setnmr', isAuthenticated, async(req, res) => {
let { numero_zap, nome_usuario, email } = req.user
let { numero } = req.body
let checkUser = await verificaZap(numero);
if (checkUser) {
 req.flash('error_msg', 'Este número ja existe.');
 res.redirect('/perfil');
} else {
if (verificaZap !== null) usuario.updateOne({nome_usuario: nome_usuario}, {numero_zap: numero}, function (err, res) { if (err) throw err;})
 req.flash('success_msg', 'Seu Número foi modificado com sucesso :)');
enviar_email(`❗ _NÚMERO_ ❗\n\n Olá ${nome_usuario} você acabou de alterar seu número para : ${numero}\n\n\npor ventura não foi você que mudou, contate algum administrador do site`, email)
 res.redirect('/perfil')
}
})

app.post('/msgbot', isAuthenticated, async(req, res) => {
let { numero_zap, nome_usuario } = req.user
let { numero, mensagem } = req.body
 req.flash('success_msg', 'Email enviado com sucesso');
enviar_email(mensagem, numero)
 res.redirect('/msgbot')
})


app.post('/msgbot/tm', isAuthenticated, async(req, res) => {
let { numero_zap, nome_usuario } = req.user
let { mensagem } = req.body
let lista_user = await usuario.find({})
for (var i = 0; i < lista_user.length; i++) {
if(lista_user[i].status === 'verificado') {
enviar_email(mensagem, lista_user[i].email)
}
}
 req.flash('success_msg', 'E-mail enviado com sucesso');
 res.redirect('/msgbot')
})

app.post('/msgbot/tm/foto', isAuthenticated, async(req, res) => {
let { numero_zap, nome_usuario } = req.user
let { mensagem, img } = req.body
let lista_user = await usuario.find({})
for (var i = 0; i < lista_user.length; i++) {
if(lista_user[i].status === 'verificado') {
enviar_email_foto(mensagem,img, lista_user[i].email)
}
}
 req.flash('success_msg', 'Email enviado com sucesso');
 res.redirect('/msgbot')
})

app.post('/dinheiro', isAuthenticated, async (req, res) => {
let { apikey, nome_usuario } = req.user
let { username, quantia} = req.body;
let checking = await verificaNome(username);
let veriley = await verificaNome2(username)
let dindin = await verificaDinheiro2(nome_usuario)
//console.log(dindin)
//console.log(veriley)
if (!checking && !veriley) {
req.flash('error_msg', 'O nome de usuário não está registrado');
return res.redirect('/dinheiro');
} else if (username === nome_usuario) {
req.flash('error_msg', 'você e doido?, tentando transferir para você msm XD');
return res.redirect('/dinheiro');
} else if (isNaN(quantia)) {
req.flash('error_msg', 'A quantidade de dinheiro precisa ser um número!');
return res.redirect('/dinheiro');
} else if (quantia < 100 ) {
req.flash('error_msg', 'você precisa ter no minimo 100 de dinheiro!');
return res.redirect('/dinheiro');
} else if (dindin < quantia) {
req.flash('error_msg', 'você não pode fazer uma transferência maior que seu dinheiro!');
return res.redirect('/dinheiro');
} else {
imp = 0.010 *  quantia //IMPOSTO CADA 1 DE DINHERO, ALMENTA E CAI NA SUA CONTA, TODA VEZ QUÊ ALGHEM FASER TRANSFERENCIA
osto = quantia - imp
dinheiroadd(veriley, osto)
dinheiroretirar(apikey, quantia)
req.flash('success_msg', `você acabou de doar ${quantia} de dinheiro para ${username}`);
return res.redirect('/dinheiro');
}
})

app.post('/dinheiromenos', isAuthenticated, async (req, res) => {
let { apikey, nome_usuario } = req.user
let { username, quantia } = req.body;
let checking = await verificaNome(username);
let veriley = await verificaNome2(username)
let dindin = await verificaDinheiro2(nome_usuario)
//console.log(dindin)
//console.log(veriley)
if (!checking && !veriley) {
req.flash('error_msg', 'O nome de usuário não está registrado');
return res.redirect('/dinheiro');
} else if (username === nome_usuario) {
req.flash('error_msg', 'você e doido?, tentando transferir para você msm XD');
return res.redirect('/dinheiro');
} else if (isNaN(quantia)) {
req.flash('error_msg', 'A quantidade de dinheiro precisa ser um número!');
return res.redirect('/dinheiro');
} else if (quantia < 100 ) {
req.flash('error_msg', 'você precisa ter no minimo 100 de dinheiro!');
return res.redirect('/dinheiro');
} else if (dindin < quantia) {
req.flash('error_msg', 'você não pode fazer uma transferência maior que seu dinheiro!');
return res.redirect('/dinheiro');
} else {
imp = 0.010 *  quantia //IMPOSTO CADA 1 DE DINHERO, ALMENTA E CAI NA SUA CONTA, TODA VEZ QUÊ ALGHEM FASER TRANSFERENCIA
osto = quantia - imp
dinheiroadd(apikey, osto)
dinheiroretirar(veriley, quantia)
req.flash('success_msg', `você acabou de retirar ${quantia} de dinheiro do ${username}`);
return res.redirect('/dinheiro');
}
})

app.post('/dinheiro/buyprem', isAuthenticated, async (req, res) => {
let { apikey, nome_usuario } = req.user
let { prembuy } = req.body;
let dindin = await verificaDinheiro2(nome_usuario)
let checkPrem = await checkPremium(nome_usuario)
if (checkPrem) {
req.flash('error_msg', 'Você ja tem premium amigo, quer perder seu dinheiro atôa?');
return res.redirect('/dinheiro');
} else if (isNaN(prembuy)) {
req.flash('error_msg', 'A quantidade de dinheiro precisa ser um número!');
return res.redirect('/dinheiro');
} else if (prembuy < 15000) {
req.flash('error_msg', 'o valor do premium esta custando 15000!');
return res.redirect('/dinheiro');
} else if (dindin < 15000) {
req.flash('error_msg', 'você não tem dinheiro suficiente para efetuar esta compra!');
return res.redirect('/dinheiro');
} else {
await dinheiroretirar(apikey, prembuy)
await adicionar_premium(nome_usuario, apikey, '30d')
req.flash('success_msg', `parabéns você adquiriu o recurso premium por 1 mês :)`);
return res.redirect('/dinheiro') //&& res.redirect('https://chat.whatsapp.com/F64TO6f5MOz4UCrny2HwHZ');
}
})

app.set('json spaces', 4);

app.get('/admin', isAuthenticated, async(req, res) => {
	let {
		apikey, nome_usuario, limit, premium, totalreq, numero_zap, admin, perfil, dinheiro, nivel, exp
	} = req.user
	let cekexp = ms(await verificar_dias_expirados(nome_usuario) - Date.now())
	let expired = '0 d'
	let ppcheck = await verificar_img(nome_usuario)
	let Lista = await usuario.find({})
	let reqXp  = 5000 * (Math.pow(2, nivel) - 1);
	if (cekexp !== null) {
		expired = cekexp
	}
if (admin == null) return req.flash('error_msg', 'somente o admin supremo pode entrar nessa rota!') && res.redirect('/docs');
res.render('admin/admin', {
		nome_usuario,
		apikey,
		limit,
		premium,
		totalreq,
		dinheiro,
		nivel,
		exp,
		admin,
		reqXp,
 layout: 'admin/admin'
})
})


app.use(function (req, res, next) {
	if (res.statusCode == '200') {
		res.render('404', {
			layout: '404'
		});
	}
});

app.use(function (req, res, next) {
	if (res.statusCode == '200') {
		res.render('404', {
			layout: '404'
		});
	}
});


schedule.scheduleJob('0 0 * * *', async () => {
  await resetarAllLimit();
  await resetTodayReq();
});

io.on('connection', (socket) => {
  //console.log('um usuário conectou');

  socket.on('disconnect', () => {
    // console.log('usuário desconectou');
  });

  // Load chat messages from database when a user connects
  mensagemSchema.find().then((mensagens) => {
    mensagens.forEach((mensagem) => {
      socket.emit('chat message', mensagem.texto);
    });
  });

  socket.on('chat message', async (msg) => {
    const msgbot = msg.split(": ")[1]
    console.log(msgbot)
    if (msgbot.startsWith('/')) {
      const command = msgbot.substring(1); // remove the prefix '/'
      const args = command.split(' '); // split the command into arguments
      const commandName = args.shift(); // get the command name
      const q = args.join(' ');
      let botMessage;
      
      const reply = async(msgsa) => {
        botMessage = `<img src="https://tohka.tech/img/tohka.jpg" alt="bot" height="60" width="60" style="border-radius: 50%;"> <span class="animated-text"><strong>BOT</strong></span>: 
<br>${msgsa}

<style>
  .animated-text {
    animation: rgb-animation 2s infinite;
  }

  @keyframes rgb-animation {
    0% {
      color: rgb(255, 0, 0); /* red */
    }
    33% {
      color: rgb(0, 0, 255); /* blue */
    }
    66% {
      color: rgb(0, 255, 0); /* lime */
    }
    100% {
      color: rgb(255, 0, 0); /* red */
    }
  }
</style>`;
      }

     try {
  switch (commandName) {
    case 'menu':
     reply(`
  <h2>Comandos Disponíveis</h2>
  <ul>
    <li><b>/bot</b> - Responde a perguntas</li>
    <li><b>/instagram (url)</b> - Baixa vídeos do Instagram</li>
    <li><b>/tiktok (url)</b> - Baixa vídeos e áudios do TikTok</li>
    <li><b>/xvideos (url)</b> - Baixa vídeos do Xvideos</li>
    <li><b>/xnxx (url)</b> - Baixa vídeos do Xnxx</li>
  </ul>
`)
      break;
    case 'bot':
      if (q) {
        api = await axios.get(`https://tohka.tech/api/outros/gemini?pergunta=${q}&apikey=ddos`)
        reply(api.data[0])
      } else {
        reply("coloque sua dúvida")
      } 
      break;

 case 'instagram':
  if (q) {
    api = await axios.get(`https://tohka.tech/api/dl/igdl?link=${q}&apikey=ddos`)
    if (api.data.status === 'operando') {
      const videoUrl = api.data.resultado.link.url;
      reply(`
        <a class="btn btn-primary mb-2" 
         href="${videoUrl}">
        <i class="fas fa-user"></i>
        <em class="ml-2"></em>BAIXAR
        </a>
      `)
    } else {
      reply("Ocorreu um erro ao processar o link do Instagram.")
    }
  } else {
    reply("preciso de um link do instagram")
  } 
  break;

case 'xvideos':
  if (q) {
    api = await axios.get(`https://tohka.tech/api/dl/xvideos?link=${q}&apikey=ddos`)
    if (api.data.status === 'operando') {
      const videoUrl = api.data.resultado[0].download;
      reply(`
        <a class="btn btn-primary mb-2" 
         href="${videoUrl}">
        <i class="fas fa-user"></i>
        <em class="ml-2"></em>BAIXAR VIDEO
        </a>
      `)
    } else {
      reply("Ocorreu um erro ao processar o link do Xvideos.")
    }
  } else {
    reply("preciso de um link do xvideos")
  } 
  break;

case 'xnxx':
  if (q) {
    api = await axios.get(`https://tohka.tech/api/dl/xnxx?link=${q}&apikey=ddos`)
    if (api.data.status === 'operando') {
      const videoUrl = api.data.resultado[0].urlDoVideo;
      reply(`
        <a class="btn btn-primary mb-2" 
         href="${videoUrl}">
        <i class="fas fa-user"></i>
        <em class="ml-2"></em>BAIXAR VIDEO
        </a>
      `)
    } else {
      reply("Ocorreu um erro ao processar o link do Xnxx.")
    }
  } else {
    reply("preciso de um link do xnxx")
  } 
  break;

case 'tiktok':
  if (q) {
    api = await axios.get(`https://tohka.tech/api/dl/tiktok?link=${q}&apikey=ddos`)
    if (api.data.status === 'operando') {
      const videoUrl = api.data.resultado.data.play;
      const audioUrl = api.data.resultado.data.music_info.play;
      reply(`
        <a class="btn btn-primary mb-2" 
         href="${videoUrl}">
        <i class="fas fa-user"></i>
        <em class="ml-2"></em>BAIXAR VÍDEO SEM MARCA D'ÁGUA
        </a>
        <a class="btn btn-primary mb-2" 
         href="${audioUrl}">
        <i class="fas fa-user"></i>
        <em class="ml-2"></em>BAIXAR ÁUDIO
        </a>
      `)
    } else {
      reply("Ocorreu um erro ao processar o link do TikTok.")
    }
  } else {
    reply("preciso de um link do TikTok")
  } 
  break;

    default:
      reply(`comando: ${commandName}, não existe`)
  }
} catch (error) {
  console.error(error)
  reply("Ocorreu um problema interno. Tente novamente mais tarde.")
}

      // Create a new message document for the bot's message
      const botMensagem = new mensagemSchema({
        texto: botMessage,
        criadoEm: new Date(),
        isBot: true // add a flag to indicate that this is a bot message
      });

      // Save the bot's message to the database
      botMensagem.save((err) => {
        if (err) {
          console.error(err);
        } else {
          // Emit the bot's message to all connected clients
          io.emit('chat message', botMessage);
        }
      });
    } else {
      // Create a new message document for the user's message
      const mensagem = new mensagemSchema({
        texto: msg,
        criadoEm: new Date()
      });

      // Save the user's message to the database
      mensagem.save((err) => {
        if (err) {
          console.error(err);
        } else {
          // Check if the number of messages exceeds the limit
          mensagemSchema.countDocuments().then((count) => {
            if (count > 10) {
              // Delete the oldest message
              mensagemSchema.findOneAndRemove({}, { sort: { criadoEm: 1 } }).then(() => {
                console.log('Oldest message deleted');
              });
            }
          });

          // Emit the user's message to all connected clients
          io.emit('chat message', msg);
        }
      });
    }
  });
});

http.listen(porta, () => {
  console.log(`Aplicativo radando em: http://localhost:${porta}`);
  schedule.scheduleJob('* * * * *', () => { 

    tempo_expirado()
    tempo_ban()
    uplvl()
    Utils.findOne({util: 'util'}).then(async (util) => {
    if (!util) {
    addUtil()
    console.log(util)
   }
   })
  });
setInterval(naodormeporra, 13 * 60 * 1000);
});
