const commando = require('discord.js-commando');

class Scale extends commando.Command{
    constructor(client){
        super(client,{
            name: 'scale',
            aliases: ['expand','scalechannel'],
            group: 'roomscale',
            memberName: 'scale',
            description: 'Automatically manage creation of identical voice channels',
            guildOnly: true,
            format: '[channel name | channel Id]',
            details:    'This function will automatically create new rooms. '+
                        'The channels get cloned making sure there is always atleast one empty channel.\n'+
                        'If no argument is provided, this command will list all the scaled channels\n'+
                        'If the channel is already a scaled channel, scaling will be disabled\n'+
                        'This command can only be used in a server\n',
            examples:['[prefix]scale 123456789012345678', '[prefix]expand Raid Room #1'],
            argsType:'single'
        });
    }

    async run(message, args){
        
        // No arguments provided -> print list of scaled channels
        if (args === '' || args === undefined){

            var list = this.client.channelManager.listScaledIn(message.guild);

            if (list.length < 1)
                message.reply('There are currently no scaled channels in this server');
            else{
                var response = 'Here is the list of all the scaled channels in this server:```';
                list.forEach((channel)=>{
                    response = response.concat('\n  - '+channel.name); 
                });
                message.reply(response+'```');
            }
        }

        // changing settings requires admin privileges
        else if (message.member.hasPermission('ADMINISTRATOR') || this.client.isOwner(message.author)){

            var voiceChannel = undefined;
                
            for(let [key, channel] of message.guild.channels){
                if (channel.name.toLowerCase().includes(args.trim().toLowerCase())
                    || channel.id === args.trim())
                {
                    if (channel.type !== 'voice')
                        continue;
                    
                    if (voiceChannel !== undefined){
                        message.reply('There are multiple channels matching with:\n```'+args+'```');
                        return;
                    }

                    voiceChannel = channel;
                }
            }

            if (voiceChannel === undefined){
                message.reply('No channel in this server matches your paramater');
                return;
            }

            try {
                message.reply(await this.client.channelManager.toggleScaled(voiceChannel));
            } catch (error) {
                message.reply(error);
            }
        }

        else
            message.reply('Applying modifications to the scaled channels requires admin privileges.');
    }
}
module.exports = Scale;