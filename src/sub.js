import Discord from "discord.js";
import * as Voice from "@discordjs/voice";

class VoiceManager{
    /**
     * Create join voice and out, set audio for bot
     * @param {Voice} mng * from "@discordjs/voice"
     */
    constructor(mng){
        this.Voice = mng;
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
    }
}
export {VoiceManager};
// exports.VoiceManager = VoiceManager