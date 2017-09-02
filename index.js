const commando = require('discord.js-commando');
const sqlite = require('sqlite');
const fs = require('fs');
const ChannelManager = require('./channel_modules/ChannelManager');

// Loading config file
var config = JSON.parse(fs.readFileSync('config.json','utf8'));

// Creating bot instance
var client = new commando.Client({
    owner: config.ownerID
});

// Setting up the database
client.setProvider(
	sqlite.open(__dirname + '/settings.sqlite3').then(db => new commando.SQLiteProvider(db))
).catch(console.error);

// Registring bot commands
client.registry.registerDefaults();
client.registry.registerGroup('roomopen','Custom');
//client.registry.registerGroup('roomscale','RoomScale');
client.registry.registerCommandsIn(__dirname + "/commands");

// Creating a Channel Manager
client.channelManager = new ChannelManager(client);


client.login(config.botToken);