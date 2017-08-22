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

        this.tempChannels = this.loadChannels('temp_channels');
        console.log('temp channels loaded');
    }

    /**
     * Loads channels from the database. This function will also delete any missing channel.
     * @param {String} key - The key of the database entry to read
     */
    loadChannels (key){
        // query the database
        var chanList = this.client.settings.get(key,[]);

        // verify the loaded object is an array
        

        // verify every ids are linked to existing channels

        // commiting any changes to the database

        // returning the list of channels
        return chanList;
    }
}
module.exports = ChannelManager;