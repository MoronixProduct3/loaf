const commando = require('discord.js-commando');
const sqlite = require('sqlite');
const fs = require('fs');

// Loading config file
var config = JSON.parse(fs.readFileSync('config.json','utf8'));

// Creating bot instance
const client = new commando.Client({
    owner: config.ownerID
});

// Setting up the database
client.setProvider(
	sqlite.open(__dirname + '/settings.sqlite3').then(db => new commando.SQLiteProvider(db))
).catch(console.error);

// Registring bot commands
client.registry.registerGroup('roomopen','RoomOpen');
client.registry.registerGroup('roomscale','RoomScale');
client.registry.registerDefaults();
client.registry.registerCommandsIn(__dirname + "/commands");

client.login(config.botToken);