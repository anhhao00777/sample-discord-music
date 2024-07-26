import * as Voice from "@discordjs/voice";
import Discord from "discord.js";

class VoiceManager{
    /**
     * 
     * @param {Discord.Client} client 
     */
    constructor(client){
        this.join = Voice.joinVoiceChannel;
        this.client = client;
    }
    /**
     * 
     * @param {Discord.TextChannel} channel 
     * @param {Discord.User} user 
     */
    connect(user){
        if(this.isConnect) return false;
        let voice = user.voice.channel;
        this.connection = this.join({
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
        // if(this.isplaying) return false;
        this.player = Voice.createAudioPlayer();
        let resource = Voice.createAudioResource(stream);
        this.player.play(resource);
        this.connection.subscribe(this.player);
        // this.isplaying = true;
    }
}
export {VoiceManager};
// exports.VoiceManager = VoiceManager