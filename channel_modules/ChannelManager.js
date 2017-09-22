const discord = require('discord.js');

const TEMP_JOIN_MS = 30000; // Time to join a channel before it closes; 30 sec 
const channelNameRegex = /(.*?)(\d*$)/;

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
        if (Date.now() - this.client.readyAt < 3000)
            this.init();

        /**
         * The ids of the temporary channels created with the bot
         * @type {Snowflake[]}
         */
        this.tempChannels = [];

        /**
         * The Map structure of the scaling channels
         * @type {Map<Snowflake,Snowflake[]>}
         */
        this.scaledChannels = new Map();
    }


    /**
     * This function loads the id arrays on bot startup
     */
    async init (){

        // Load databases
        this.tempChannels = await this.loadChannels('temp_channels');
        var vectorChannels = await this.loadChannels('vector_channels');
        var expansionChannels = [];
        vectorChannels.forEach((vector, index)=>{
            expansionChannels[index] = this.loadChannels('exp_'+vector);
        });
        // Wait for all channels to be loaded
        var loaded = await Promise.all(expansionChannels);

        loaded.forEach((set, index)=>{
            this.scaledChannels.set(vectorChannels[index], set);
        });

        // Check channel integrity
        await this.consolidateAll();

        // Setup event handlers
        this.client.on('channelDelete',(channel)=>{
            if (this.scaledHasChannel(channel.id)){
                this.consolidateScaling;
            }
            else if (this.tempChannels.includes(channel.id)){
                this.consolidateTemp;
            }
        });

        this.client.on('voiceStateUpdate',(oldMember, newMember)=>{
            var oldChannel = oldMember.voiceChannelID;
            var newChannel = newMember.voiceChannelID;

            if (this.tempChannels.includes(oldChannel)){
                this.consolidateTemp();
            }
            if (this.scaledHasChannel(oldChannel) || this.scaledHasChannel(newChannel)){
                this.consolidateScaling();
            }
        });

        console.log('finished initialization');
    }


    /**
     * Retruns true if the specified channel is a scaled channel
     * @param {ChannelResolvable} channel - The Id of the channel to find
     */
    scaledHasChannel(channel){
        if (!channel)
            return false;
        if (typeof channel !== 'string') 
            channel = channel.id;

        for(let [key,exp] of this.scaledChannels){
            if (key === channel || exp.includes(channel))
                return true;
        };
        return false;
    }


    /**
     * Loads channels from the database. This function will also delete any missing channel.
     * @param {String} key - The key of the database entry to read
     */
    async loadChannels (key){
        // query the database
        var chanList = await this.client.settings.get(key,[]);
        
        // returning the list of channels
        return chanList;
    }


    /**
     * This function verifies the channels in memory exist and are still used
     */
    async consolidateAll(){
        await Promise.all([
            this.consolidateTemp(),
            this.consolidateScaling()
        ]);
    }


    /**
     * This function all the temp channels are still in good shape
     * Any discrepency gets corrected and the database updated
     */
    async consolidateTemp(){
        var curChan = this.client.channels;
        var change = false;

        for(var i = this.tempChannels.length -1; i >= 0; --i){
            // Check if the room is still in discord
            if (!curChan.has(this.tempChannels[i])){
                this.tempChannels.splice(i,1);
                change = true;
                continue;
            }

            var channel = curChan.get(this.tempChannels[i]);

            // Checking if the room is a voice channel
            if (channel.type !== 'voice'){
                this.tempChannels.splice(i,1);
                change = true;
                continue;
            }

     
            // Checking if room is empty
            if (channel.members.size < 1){
                await this.terminateTemp(channel.id, false); // Close the discord channel
                change = true;
            }
        }

        if (change)
            await this.client.settings.set('temp_channels',this.tempChannels);
    }


    /**
     * This function consolidates scaling rooms
     * Any discrepency is corrected and the database updated
     */
    async consolidateScaling(){
        var promises = [];
        this.scaledChannels.forEach((expansion, key)=>{
            promises.push(this.consolidateVector(key));
        });
        
        var doneVectors = await Promise.all(promises);

        // update scaled rooms database entries if modified
        if (doneVectors.some((modified)=> {return modified;})){
            await this.saveScalingDB();
        }
    }


    /**
     * Saves the scaledChannels to the database
     */
    async saveScalingDB(){
        var vectorList = [];
        var promises = [];

        this.scaledChannels.forEach((exp,key)=>{
            vectorList.push(key);
            promises.push(this.client.settings.set('exp_'+key, exp));
        });

        promises.push(this.client.settings.set('vector_channels', vectorList));

        await Promise.all(promises);
    }


    /**
     * This function consolidates one scaling room
     * Any discrepency is corrected
     * @param {Snowflake} vector - The id of the base channel
     * @return {boolean} True is the vector was modified
     */
    async consolidateVector(vector){
        var curChan = this.client.channels;

        // Verify the base room still exists and is a voice channel
        if (!curChan.has(vector) 
            || curChan.get(vector).type !== 'voice')
        {
            await this.removeVector(vector);
            return true;
        }

        // Ensuring the number of channel is sufficient and the channel exist
        var expansions = this.scaledChannels.get(vector);
        var expChanged = false;
        var emptyRooms = 0;

        if (curChan.get(vector).members.size < 1)
            ++emptyRooms;

        var index = 0;

        while (index < expansions.length){
            // Check the channel exists
            if (!curChan.has(expansions[index])){
                expansions.splice(index,1);
                expChanged = true;
                continue;
            }

            var curExp = curChan.get(expansions[index]);
            // Check if the channel needs is empty
            if (curExp.members.size < 1){
                ++emptyRooms;

                // Check if the there are too many empty rooms
                if (emptyRooms > 1){
                    curExp.delete();
                    expansions.splice(index,1);
                    expChanged = true;
                    continue;
                }
            }

            ++index;
        }

        // Check if there is no free room
        if (emptyRooms === 0){
            await this.expandVector(vector);
            expChanged = true;
        }

        return expChanged;
    }


    /**
     * Will create a new room in the Scalable room
     * @param {Snowflake} vectorID - The channel to expand
     */
    async expandVector(vectorID){
        var expChannels = this.scaledChannels.get(vectorID);
        var lastChannelName;
        var lastPosition;
        let last;

        // Check if there is already expanions
        if (expChannels.length > 0)
            last = this.client.channels.get(expChannels[expChannels.length-1]);
        // Otherwise base name on vector
        else
            last = this.client.channels.get(vectorID);
        // Create new channel
        var nChan = await this.client.channels.get(vectorID).clone({
            name: ChannelManager.nextChannelName(last.name),
            withPermissions: true,
            reason:'Auto-expansion'
        });
        nChan.edit({
            userLimit: last.userLimit,
            parentID: last.parentID,
            lockPermissions: last.permissionsLocked
        }).then(c=>{
            c.setPosition(last.position +1);
            if (c.parentID)
                setTimeout(()=>c.setPosition(last.position +1),1000);
        });
        
        expChannels.push(nChan.id);

        this.scaledChannels.set(vectorID, expChannels);
    }


    /**
     * Creates a new name for a scalable channel
     * @param {string} baseName 
     */
    static nextChannelName(baseName){
        var parseResult  = baseName.trim().match(channelNameRegex);
        if (parseResult[2] === '')
            return parseResult[1]+ ' 2';
        return parseResult[1]+ (parseInt(parseResult[2])+1);
    }


    /**
     * This deletes one of the scaled rooms.
     * Changes are not applied to the database
     * @param {Snowflake} vectorId 
     */
    async removeVector(vectorId){
        var curChan = this.client.channels;
        // Verifying every expansion is deleted
        this.scaledChannels.get(vectorId).forEach((expanded)=>{
            if (curChan.has(expanded)){
                curChan.get(expanded).delete('Scaled channel deleted');
            }
        });
        // Removing the vector from memory
        this.scaledChannels.delete(vectorId);
    }


    /**
     * This function will remove a channel from the list of temporary channels
     * @param {Snowflake} channel - The channel to be deleted
     * @param {boolean} writeToDB - Set to high if the changes need to be synced to the database
     */
    async terminateTemp(channel, writeToDB){
        if (writeToDB === undefined) writeToDB = true;

        // Remove the channel from the list
        var index = this.tempChannels.indexOf(channel);
        this.tempChannels.splice(index, 1);

        // Destroy the channel through discord
        this.client.channels.get(channel).delete('Temporary channel has expired');

        // Optionaly write changes to the databse
        if (writeToDB)
            await this.client.settings.set('temp_channels',this.tempChannels);
    }


    /**
     * Adds a newly created channel to the temporary channels
     * @param {VoiceChannel} newChannel - The channel to add to the db
     */
    async newTempChannel(newChannel){

        // Checking the channel is not already in a database
        if (this.tempChannels.includes(newChannel.id))
            return Promise.reject(new Error('Channel is already a temporary channel'));
        if (this.scaledHasChannel(newChannel.id))
            return Promise.reject(new Error('Channel is a scaled channel'));

        // registring new channel
        this.tempChannels.push(newChannel.id);

        // saving changes to the database
        await this.client.settings.set('temp_channels',this.tempChannels);

        // Setting up auto deletion after time-out
        setTimeout(()=>{
            var chan = this.client.channels.get(newChannel.id);
            if (chan === undefined || chan === null)
                return;
            if (chan.members.size < 1){
                this.terminateTemp(newChannel.id, true);
            }
        }, await newChannel.guild.settings.get('temp_timeout', TEMP_JOIN_MS));

        return newChannel;
    }


    /**
     * Lists all the scaled channels in a discord guil
     * @param {Guild} guild - The guild in which to list the scaled channels
     */
    listScaledIn(guild){
        var list = [];
        guild.channels.forEach((value, key)=>{
            if (this.scaledChannels.has(key))
                list.push(value);
        });
        return list;
    }

    /**
     * Asserts a channel can be toggled and either enables or disables scaling
     * @param {VoiceChannel} channel - The channel onto which the state should be toggled
     */
    async toggleScaled(channel){
        
        // disable scaling if already active
        if (this.scaledChannels.has(channel.id))
        {
            this.removeVector(channel.id);
            await this.saveScalingDB();
            return channel.name + ' is no longer a scaling channel';
        }

        if (this.tempChannels.includes(channel.id))
            return Promise.reject(channel.name + ' is a temporary channel. Temporary channels cannot be scaled.');

        if (this.scaledHasChannel(channel.id))
            return Promise.reject(channel.name + ' is an extension channel. A scaled channel expansion cannot be scaled.');

        // enable scaling
        this.scaledChannels.set(channel.id, []);
        await this.saveScalingDB();
        await this.consolidateScaling();
        return channel.name + ' is now a scaled channel';
    }
}
module.exports = ChannelManager;