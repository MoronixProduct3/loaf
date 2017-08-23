const commando = require('discord.js-commando');

/** The object managing the voice channels requested */
class ChannelManager{

    /**
     * Create the ChannelManager and load previous channels from the database
     * @param {CommandoClient} settings - The commando client providing the service
     */
    constructor (client){

        // Checking arguments errors
        if (!client) throw new Error('The client argument must be specified');

        /**
         * Client associated with this manager
         * @type {CommandoClient}
         */
        this.client = client;
        
        // The initializing method to execute once the client is settled
        this.client.on('ready', ()=> this.init());

        /**
         * The ids of the temporary channels created with the bot
         * @type {Snowflake[]}
         */
        this.tempChannels = [];

        /**
         * The Map structure of the scaling channels
         * @type {Map}
         */
        this.scaledChannels = new Map();
    }

    /**
     * This function loads the id arrays on bot startup
     */
    async init (){
        this.tempChannels = this.loadChannels('temp_channels');
        console.log('end');
    }

    /**
     * Loads channels from the database. This function will also delete any missing channel.
     * @param {String} key - The key of the database entry to read
     */
    async loadChannels (key){
        // query the database
        var chanList = this.client.settings.get(key,[]);
        var verifiedChannels = [];

        // verify the loaded object is an array
        if (!Array.isArray(chanList)) chanList = [];

        // verify every ids are linked to existing channels
        chanList.forEach((id, index) =>{
            if (this.client.channels.has(id))
                verifiedChannels.push(id);
        });

        // commiting any changes to the database
        if (verifiedChannels.length !== chanList.length)
            this.client.settings.set(key, verifiedChannels);

        // returning the list of channels
        console.log('loadedChannels');
        return verifiedChannels;
    }
}
module.exports = ChannelManager;