/**
 * This function returns an object containing all the options
 * It parses them one by one and set
 * @param {String[]} args - The arguments to parse
 */
module.exports.parse = function(args){
    var options = {};

    for (argument of args){

        // If the argument is a switch option
        if (argument.charAt(0) === '-'){
            if (argument.match(/^--push2talk$/i))
                options.push2talk = true;
            else if (argument.match(/^--closed$/i))
                options.closed = true;
            else if (argument.match(/^-[pc]+$/i)){
                if (argument.match(/p/i))
                    options.push2talk = true;
                if (argument.match(/c/i))
                    options.closed = true;
            }
        }

        // If the argument is the capacity
        else if (this.isNormalInteger(argument)){
            // Check if the capacity was already set
            if(options.capacity !== undefined){
                options.error = 
                    'An integer number sets the capacity of the room. Only one capacity is allowed.\n'
                    'You entered `${options.capacity}` but also `${argument}`';
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
            name = argument;
        }

        // Could not resolve argument
        else{
            if (options.name){
                options.error =
                    'You have entered more than one name for the channel\n'
                    'To set a name with more than one word use \'single quotes\'';
                break;
            }

            throw new Error('unexpected argument: "@{argument}"');
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