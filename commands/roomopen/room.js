const commando = require('discord.js-commando');

class Room extends commando.Command{
    constructor(client){
        super(client,{
            name: 'channel',
            aliases: ['room','customchannel'],
            group: 'roomopen',
            memberName: 'room',
            description: 'Creates a custom voice channel',
            guildOnly: true,
            format: '[Channel name] [capacity] [--push2talk] [--closed]',
            details:    'This function will create a room with the options specified\n'+
                        'All the parameters are optional\n'+
                        'Parameters are delimited by spaces\n'+
                        "Channel name can be entered with 'single quotes' to include spaces\n"+
                        'Capacity must be a positive integer number delimited by spaces\n'+
                        '--push2talk or -p is used to disable voice activation in the room\n'+
                        '--closed or -c is used to close the channel to invited members only\n'+
                        'This command can only be used in a server\n'+

                        '\nThe example provided creates a voice channel named "squad"\n'+
                        'with capacity=4 only joinable by invited members\n',
            examples:['channel squad 4 -c'],
            argsType:'multiple',
            argsCount: 12
        });
    }

    async run(message, args){
        message.reply('check');
    }
}
module.exports = Room;