# Loaf
Discord bot to create and manage voice rooms

The two main functionnalities of this bot is:
- Creating temporary voice channels through a text commands
- Creating "Scaling" channels that grow in number when users join them

## Installation
1. Install node.js on your machine 
2. Clone this repository
3. run `npm install` in the repository to install dependencies
4. Create a `config.js` file with the following template:
```json
{
  "ownerID": "the discord user id of the bot owner",
  "botToken": "the authentication token of the bot"
}
```

## Commands

### channel
This function will create a room with the options specified
All the parameters are optional
Parameters are delimited by spaces
Channel name can be entered with 'single quotes' to include spaces
Capacity must be a positive integer number delimited by spaces
--push2talk or -p is used to disable voice activation in the room
--closed or -c is used to close the channel to invited members only
This command can only be used in a server

Aliases : **room**, **customchannel**

Syntax: `channel [Channel name] [capacity] [--push2talk] [--closed]` 

### temp_category
This command sets the category in wich the temporary channels are created.
There can only be one category. All the temp channels created using the `channel` command will be in the specified category.
This will not move any of the temp channels created before.
If no argument is provided, this command will print the current category.
If the argument provided is `_NONE`, no category will be assigned to the new temp channels.
This command can only be used in a server

Alias : **tcat**

Syntax: `temp_category [ Category_Name | Category_ID | "_NONE" ]` 

### scale
This function will automatically create new rooms. The channels get cloned making sure there is always atleast one empty channel.
If no argument is provided, this command will list all the scaled channels
If the channel is already a scaled channel, scaling will be disabled
This command can only be used in a server

Aliases : **expand**, **scalechannel**

Syntax: `scale [channel name | channel Id]`
