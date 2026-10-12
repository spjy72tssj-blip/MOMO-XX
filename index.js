const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, delay, Browsers } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 8000;

app.get('/', async (req,res)=>{
 res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>APPLE-MD</title><style>body{background:#111;color:#fff;font-family:sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0}.box{background:#1e1e1e;padding:25px;border-radius:16px;width:85%;max-width:340px;text-align:center}input{width:90%;padding:12px;border-radius:8px;border:none;margin:12px 0}button{width:95%;padding:12px;background:#25d366;border:none;border-radius:8px;font-weight:bold}h2{color:#25d366}#code{font-size:26px;margin-top:15px;letter-spacing:2px}</style></head><body><div class="box"><h2>APPLE-MD PAIR</h2><input id="n" placeholder="22896352213" value="22896352213"><button onclick="go()">GET CODE</button><div id="code"></div><p id="m" style="font-size:12px;color:#aaa"></p></div><script>async function go(){let num=document.getElementById('n').value;document.getElementById('m').innerText='Wait 20s... DO NOT CLOSE';let r=await fetch('/code?number='+num);let d=await r.json();if(d.code){document.getElementById('code').innerText=d.code;document.getElementById('m').innerText='Enter this in WhatsApp > Linked Devices > Link with phone number - You have 30 sec'}else{document.getElementById('m').innerText=d.error}}</script></body></html>`);
});

app.get('/code', async (req,res)=>{
 let number = (req.query.number||'').replace(/[^0-9]/g,'');
 if(!number) return res.json({error:'Enter number'});
 let dir = './auth_'+Date.now();
 fs.mkdirSync(dir);
 try{
   let { version } = await fetchLatestBaileysVersion();
   let { state, saveCreds } = await useMultiFileAuthState(dir);
   let sock = makeWASocket({ version, auth: state, logger: pino({level:'silent'}), browser: Browsers.macOS('Desktop'), printQRInTerminal:false });
   sock.ev.on('creds.update', saveCreds);
   await delay(4000);
   let code = await sock.requestPairingCode(number);
   res.json({code: code.match(/.{1,4}/g).join('-')});
   // Garde la connexion ouverte 90s pour que tu aies le temps de taper
   setTimeout(()=>{ try{fs.rmSync(dir,{recursive:true,force:true})}catch{} }, 90000);
 }catch(e){ console.log(e); res.json({error:'Failed, retry after 5 min. '+e.message}) }
});

app.listen(PORT, ()=>console.log('ON '+PORT));
