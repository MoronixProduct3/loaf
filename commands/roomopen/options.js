/**
 * This function returns an object containing all the options
 * It parses them one by one and set
 * @param {String[]} args - The arguments to parse
 */
function parse(args){
    var options = {};

    for (argument of args){

        // If the argument is a switch option
        if (argument.charAt(0) === '-'){
            if (argument.trim().match(/^--push2talk$/i))
                options.push2talk = true;
            else if (argument.trim().match(/^--closed$/i))
                options.closed = true;
            else if (argument.trim().match(/^-[pc]+$/i)){
                if (argument.match(/p/i))
                    options.push2talk = true;
                if (argument.match(/c/i))
                    options.closed = true;
            }
            else{
                options.error = 
                    'The switch option provided is invalid\n'+
                    '`'+argument+'` is not a valid option';
                break;
            }
        }

        // If the argument is the capacity
        else if (isNormalInteger(argument)){
            // Check if the capacity was already set
            if(options.capacity !== undefined){
                options.error = 
                    'An integer number sets the capacity of the room. Only one capacity is allowed.\n'+
                    'You entered `'+options.capacity+'` but also `'+argument+'`';
                break;
            }

            var cap = parseInt(argument);
            if (cap >= 100){
                options.error = 
                    'The maximum room capacity limit is 99.';
                break;
            }
            options.capacity = cap;
        }

        // Room name
        else if (options.name === undefined){
            options.name = argument;
        }

        // Could not resolve argument
        else{
            if (options.name){
                options.error =
                    'You have entered more than one name for the channel\n'+
                    'To set a name with more than one word use \'single quotes\'';
                break;
            }

            throw new Error('unexpected argument: "'+argument+'"');
            break;
        }
    }

    return options;
}

/**
 * Determines if an argument is an positive integer
 * @param {String} str - The string to identify
 */
function isNormalInteger(str) {
    var n = Math.floor(Number(str));
    return String(n) === str && n >= 0;
}

/**
 * This function loads options that are defined in the guild settings
 * @param {Guild} guild - The guild to load the options from
 */
async function load(guild){
    var options = {};

    options.position = await guild.settings.get('temp_position', 1);

    options.authorPerm = await guild.settings.get('author_permissions',null);
    if (options.authorPerm === null)
        options.authorPerm = {
            'CREATE_INSTANT_INVITE': true,
            'MANAGE_CHANNELS':true,
            'CONNECT':true,
            'SPEAK':true,
            'MUTE_MEMBERS':true,
            'MANAGE_ROLES_OR_PERMISSIONS':true,
            'MOVE_MEMBERS':true
        };

    return options;
}

/**
 * This returns the complete list of options after having read the database
 * and parsed all the input arguments
 * @param {Guild} guild - The guild to load the options from
 * @param {String[]} args - The arguments to parse
 */
module.exports.getAll = async function(guild, args){
    return Object.assign(parse(args), await load(guild));
}

/**
 * Applies a series of settings to a voice channel
 * @param {Object} options - The object containing the options of the channel
 * @param {VoiceChannel} channel - The channel to be modified
 */
module.exports.apply = async function(options, channel, author){
    var promises = [];

    // Permissions
    var everyone = channel.guild.roles.find(element => element.name === '@everyone');

    // Push to talk
    if (options.push2talk)
        promises.push(await channel.overwritePermissions(everyone,{USE_VAD: false}));

    // Closed channel
    if (options.closed)
        promises.push(await channel.overwritePermissions(everyone,{CONNECT: false}));

    // Applying the channel host permissions
    if (options.authorPerm)
        promises.push(await channel.overwritePermissions(author, options.authorPerm));

    // Capacity
    if (options.capacity !== undefined){
        promises.push(await channel.setUserLimit(options.capacity));
    }
    
    // Position
    if (options.position !== undefined)
        promises.push(await channel.setPosition(options.position));

    await Promise.all(promises);
}