import Discord from "discord.js";
import fs from "fs";
import path from 'path';
import ytdl from "@distube/ytdl-core";
import {VoiceManager} from "./sub.js";
const __dirname = path.resolve();
let option = JSON.parse(fs.readFileSync(`${__dirname}/saveFile/option.json`));
let _timeStart = Date.now();
let _totalTime = 0;
let list = [];
let config = JSON.parse(fs.readFileSync(`${__dirname}/text/${option.lang["0"]}.json`));
console.log(__dirname);

if(!process.env.TOKEN){
    throw new Error(config.noToken);
}
const client = new Discord.Client({
    intents: ["Guilds", "GuildMessages", "MessageContent", "GuildVoiceStates", "GuildMembers"]
});
client.login(process.env.TOKEN);
const voiceManager = new VoiceManager(client);

_totalTime = Date.now() - _timeStart;

client.on("ready", () => {
    // client.user.setStatus("dnd");
    // let check = client.channels.cache.get("943845514091319346");
    client.user.setActivity("AC", { Type: "PLAYING" });
    console.log(`${config.start}: ${_totalTime}ms`);
    // embed()
});

client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    let {content} = message;
    if(content === "."){
        message.reply(`${config.test}: ${_totalTime}ms`);
        console.log(message)
    }
    if(content === "-out"){
        voiceManager.disconnect();
    }
    if(content.indexOf("-yt ") !== -1){
        let text = content.split("-yt ")[1]
        if(content.indexOf(" https://") !== -1){
            let url = text;
            let info = await getInfo(url);
            voiceManager.connect(message.member);
            let stream = getAudioStream(url);
            voiceManager.setAudio(stream);
            message.reply(JSON.stringify(info));
        } else if(text.length == 11){
            let id = text;
            // let info = await getInfo(id);
            let url = `https://www.youtube.com/watch?v=${id}`;
            voiceManager.connect(message.member);
            let stream = `${__dirname}/ss.mp3`;
            // let stream = getAudioStream(url);
            voiceManager.setAudio(fs.createReadStream(stream));
            message.reply("ok");    
        }
    } else if (content === "-yt"){
        message.reply(config.ytHelp);
    }
    if(content.indexOf("-lang ")!== -1){
        let lang = content.split("-lang ")[1];
        if(lang === "vi"){
            config = JSON.parse(fs.readFileSync(`${__dirname}/text/vi.json`));
            option.lang["0"] = lang;
            message.reply(`${config.langChange}: ${lang}`);

        } else{
            config = JSON.parse(fs.readFileSync(`${__dirname}/text/en.json`));
            option.lang["0"] = lang;
            message.reply(`${config.langChange}: ${lang}`);

        }
        saveOption();
    }
});

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