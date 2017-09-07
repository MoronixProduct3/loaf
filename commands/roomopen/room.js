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
        var name = message.author.username+"'s Channel";
        var capacity = 0;
        var nameSet = false;

        args.forEach((argument)=>{

            // If the argument is a switch option
            if (argument.charAt(0) == '-'){
            }
            // If the argument is the capacity
            else if (this.isNormalInteger(argument)){
                var cap = parseInt(argument);
                if (cap >= 100){
                    cap = 0;
                    message.reply('The maximum room capacity is 99. The room was set to unlimited.');
                }
                capacity = cap;
            }
            // Room name
            else if (!nameSet){
                name = argument;
                nameSet = true;
            }
            // Could not resolve argument
            else{
                message.reply('"'+arg+'" is not a valid argument');
                return;
            }
        });

        this.client.channelManager.newTempChannel(
            message.guild,
            name, 
            message.author, 
            capacity)
        .then((newChannel)=>{
            message.reply(newChannel.name+' was created');
        });
    }
}
module.exports = Room;