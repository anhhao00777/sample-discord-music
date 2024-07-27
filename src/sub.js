import Discord from "discord.js";
import * as Voice from "@discordjs/voice";
import fs from "fs";
class VoiceManager{
    /**
     * Create join voice and out, set audio for bot
     * @param {Voice} mng * from "@discordjs/voice"
     */
    constructor(mng, params = {}){
        this.Voice = mng;
        this.params = params;
        this.onended = function (){

        }
    }
    /**
     * 
     * @param {Discord.Message.user} user 
     */
    connect(user){
        if(this.isConnect) return false;
        let voice = user.voice.channel;
        this.connection = this.Voice.joinVoiceChannel({
            channelId: voice.id,
            guildId: voice.guild.id,
            adapterCreator: voice.guild.voiceAdapterCreator,
        });
        this.isConnect = true;
        return true;
    }
    disconnect(){
        if(!this.isConnect) return false;
        this.connection.destroy();
        this.isConnect = false;
    }
    /**
     * 
     * 
     */
    setAudio(stream){
        if (this.isplaying) return false;
        this.player = this.Voice.createAudioPlayer();
        let resource = this.Voice.createAudioResource(stream);
        this.player.play(resource);
        this.connection.subscribe(this.player);
        this.isplaying = true;
        this.player.on(Voice.AudioPlayerStatus.Idle, () => {
            this.onended();
        });
    }

}

class MessageLearner{
    constructor(client, params = {}){
        this.client = client;
        this.path = params.path;
        this.params = params;
        this.data = {};
        this.workMode = {};
        try {
            let g = fs.readFileSync(this.path);
            if(g){
                this.data = JSON.parse(g);
            }
        } catch (e) {
            this.data = {};
        }
    }
    set(msg){
        let userId = msg.author.id;
        if(!userId) return;
        this.workMode[userId] = {
            stat: true,
            key: ""
        };
        msg.reply({ content: this.params.config.learnMode, ephemeral: true });
    }
    /**
     * 
     * @param {Discord.Message} msg 
     */
    update(msg){
        if(this.getKey(msg.content)){
            msg.reply(this.data[msg.content]);
            return;
        }
        if(this.getUser(msg.author.id)){
            let text = msg.content;
            if(text === "-cancel"){
                this.workMode[msg.author.id].stat = false;
            }
            if(this.workMode[msg.author.id].key){
                this.data[this.workMode[msg.author.id].key] = text;
                this.workMode[msg.author.id].stat = false;
                msg.reply({ content: this.params.config.learnModeDone, ephemeral: true });
                this.saveData();
                return;
            }
            this.workMode[msg.author.id].key = text;
            msg.reply({ content: this.params.config.learnModeSec, ephemeral: true });

        }
    }
    getUser(id){
        for (const k in this.workMode) {
            if (k == id && this.workMode[k].stat) return true;
        }
        return false;
    }
    getKey(mess){
        for (const key in this.data) {
            if(mess === key){
                return true;
            }
        }
        return false;
    }
    saveData(){
        fs.writeFileSync(this.path, JSON.stringify(this.data));
    }
}


export {VoiceManager, MessageLearner};
// exports.VoiceManager = VoiceManager