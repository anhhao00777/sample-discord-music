import Discord from "discord.js";
import fs from "fs";
import path from 'path';
import ytdl from "@distube/ytdl-core";
import * as Voice from "@discordjs/voice";
import readline from "readline";
// custom module
import {VoiceManager, MessageLearner} from "./sub.js";
const COMMAND = "-";
const __dirname = path.resolve();
let option = JSON.parse(fs.readFileSync(`${__dirname}/saveFile/option.json`));
let _timeStart = Date.now();
let _totalTime = 0;
let list = [];
let current = {};

let config = JSON.parse(fs.readFileSync(`${__dirname}/text/${option.lang["0"]}.json`));
console.log(__dirname);
const readL = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// check is the token in .env
if(!process.env.TOKEN){
    throw new Error(config.noToken);
}
const client = new Discord.Client({
    intents: ["Guilds", "GuildMessages", "MessageContent", "GuildVoiceStates", "GuildMembers"]
});
client.login(process.env.TOKEN);

const voiceManager = new VoiceManager(Voice);
let msgLearn;
_totalTime = Date.now() - _timeStart;

client.on("ready", () => {
    msgLearn = new MessageLearner(client, {
        config: config,
        path: `${__dirname}/saveFile/data.json`
    });
    // client.user.setStatus("dnd");
    client.user.setActivity("Void", { Type: "PLAYING" });
    console.log(`${config.start}: ${_totalTime}ms`);
    console.log(config["console-message"]);
    createRead();

    //after audio end
    voiceManager.onended = () => {
        let i = isPlaying();
        console.log("next")
        if(i!== false && i+1 < list.length){
            list[i].isPlaying = false;
            if(voiceManager.isConnect){
                let url = list[i+1].url;
                list[i+1].isPlaying = true;
                let stream = getAudioStream(url);
                voiceManager.setAudio(stream);
                current = list[i+1];
                list.shift();
            }
        } else if(i!== false){
            list.shift();
        }
    }
});


function createRead(){
    readL.question(`${config.inputCommand}: `, (cmd) => {
        inputCmd(cmd);
        setTimeout(()=> createRead(),3000);
        
    });
}

function inputCmd(msg){
    if(msg === "-list"){
        console.log(JSON.stringify(list));
    } if(msg === "-disconnect"){
        voiceManager.disconnect();
    }
}

client.on("messageCreate", inputMessage);
async function inputMessage(message){
    if (message.author.bot) return;
    msgLearn.update(message);
    let {content} = message;
    if (content.startsWith(COMMAND)) {
        content = content.slice(1);
    } else{
        return;
    }

    if(content === "."){
        message.reply(`${config.test}: ${_totalTime}ms`);
        console.log(message)
    }
    if(content === "out"){
        voiceManager.disconnect();
    }
    if(content === "learn"){
        msgLearn.set(message);
    }
    if(content === "test"){
        let stream = `${__dirname}/ss.mp3`;
        voiceManager.connect(message.member);
        voiceManager.setAudio(fs.createReadStream(stream));
        message.reply(config.testAudio);    

    }

    if(content.indexOf("yt ") !== -1){
        let text = content.split("yt ")[1]
        if(content.indexOf(" https://") !== -1){
            let url = text;
            let info = await getInfo(url);
            voiceManager.connect(message.member);
            let stream = getAudioStream(url);
            if(isPlaying() === false){
                info.isPlaying = true;
            } else{
                message.reply(`${config.wait}: ${current.name}`); 
                return;
            }
            current = info;    
            voiceManager.setAudio(stream);
            message.reply(JSON.stringify(info));
        } else if(text.length == 11){
            let id = text;
            let info = await getInfo(id);
            let url = `https://www.youtube.com/watch?v=${id}`;
            voiceManager.connect(message.member);
            // let stream = `${__dirname}/ss.mp3`;
            let stream = getAudioStream(url);
            if(isPlaying() === false){
                info.isPlaying = true;
            } else{
                message.reply(`${config.wait}: ${current.name}`); 
                return;
            }
            current = info;
            voiceManager.setAudio(stream);
            message.reply(JSON.stringify(info));    
        }
    } else if (content === "yt"){
        message.reply(config.ytHelp);
    }

    if(content == "list"){
        if(list.length === 0){
            message.reply(config.noList);
            return;
        }
        let str = "";
        for (let i = 0; i < list.length; i++) {
            const e = list[i];
            let param = e.isPlaying ? ">" : "";
            str += `${param} [${i}] - [${secondsToTime(e.duration)}] ${e.name}\n`;
        }
        message.reply(str);
    }
    // vi or en default is en
    if(content.indexOf("lang ")!== -1){
        let lang = content.split("lang ")[1];
        if(lang === "vi"){
            config = JSON.parse(fs.readFileSync(`${__dirname}/text/vi.json`));
            option.lang["0"] = lang;
            message.reply(`${config.langChange}: ${config.name}`);

        } else{
            config = JSON.parse(fs.readFileSync(`${__dirname}/text/en.json`));
            option.lang["0"] = lang;
            message.reply(`${config.langChange}: ${config.name}`);

        }
        saveOption();
    }
}

function isPlaying(){
    for (let i = 0; i < list.length; i++) {
        const e = list[i];
        if(e.isPlaying === true){
            return i;
        }
    }
    return false;
}
function getInfo(yt) {
    return new Promise(async (resolve, reject) => {
        if (!yt) return;
        let info = await ytdl.getBasicInfo(yt);
        fs.writeFileSync(`${__dirname}/saveFile/tt.json`, JSON.stringify(info))
        if (!info) return;
        let data = {
            name: info.videoDetails.title,
            url: info.videoDetails.video_url,
            channelName: info.videoDetails.ownerChannelName,
            view: info.videoDetails.viewCount,
            duration: info.videoDetails.lengthSeconds,
            isPlaying: false,
        }
        list.push(data);
        resolve(data);
    });
    
    
}
function saveOption(){
    fs.writeFileSync(`${__dirname}/saveFile/option.json`, JSON.stringify(option));
}
function getAudioStream(url){
    let stream = ytdl(url, {
        filter: "audioonly",
        quality: 'highestaudio',
        highWaterMark: 1 << 27,
    })
    return stream;
}
// 130 -> 00:02:10
function secondsToTime(e = 0) {
    if(!e) e = 0;
    const h = Math.floor(e / 3600).toString().padStart(2, '0'),
        m = Math.floor(e % 3600 / 60).toString().padStart(2, '0'),
        s = Math.floor(e % 60).toString().padStart(2, '0');
    return (h + ':' + m + ':' + s);
}