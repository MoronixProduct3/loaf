const commando = require('discord.js-commando');

class TempCategory extends commando.Command{
    constructor(client){
        super(client,{
            name: 'temp_category',
            aliases: ['tcat'],
            group: 'roomopen',
            memberName: 'temp_category',
            description: 'Sets the category in which the temp channels are to be created in',
            guildOnly: true,
            format: '[channel name | channel Id]',
            details:    'There can only be one category\n'+
                        'All the temp channels created after, will be in the specified category\n'+
                        'This function will not move any previously created temp channel\n'+
                        'If no argument is provided, this command will print the current category\n'+
                        'If the argument provided is "_NONE", no category will be assigned to temp channels\n'+
                        'This command can only be used in a server\n',
            examples:['[prefix]tcat 123456789012345678', '[prefix]temp_cat Voice channels', '[prefix]tcat _NONE'],
            argsType:'single'
        });
    }

    async run(message, args){
        
        // No arguments provided -> print the current category
        if (args === '' || args === undefined){

            let cat = message.guild.settings.get('temp_channel_category', null);

            if (cat === null)
                message.reply('Temporary channels are not currently assigned to any category.');
            else {
                var response = 'Temporary channels will be created in this category:```';
                response += this.client.channels.get(cat).name;
                message.reply(response+'```');
            }

            return;
        }

        // changing settings requires admin privileges
        if (message.member.hasPermission('ADMINISTRATOR') || this.client.isOwner(message.author)){

            // Removing the category
            if (args.trim().match(/^_NONE$/i)){
                message.guild.settings.remove('temp_channel_category');
                message.reply('Temporary channels category removed');
                return;
            }

            var category = undefined;
                
            for(let [key, channel] of message.guild.channels){
                if (channel.name.trim().toLowerCase().includes(args.trim().toLowerCase())
                    || channel.id === args.trim())
                {
                    if (channel.type !== 'category')
                        continue;
                    
                    if (category !== undefined){
                        message.reply('There are multiple categories matching with:\n```'+args+'```');
                        return;
                    }

                    category = channel;
                }
            }

            if (category === undefined){
                message.reply('No category in this server matches your paramater');
                return;
            }

            message.guild.settings.set('temp_channel_category', category.id);
            message.reply('Temporary channels will now be created in:\n```'+category.name+'```');
        }

        else
            message.reply('Changing the temporary channels category requires admin privileges');
    }
}
module.exports = TempCategory;