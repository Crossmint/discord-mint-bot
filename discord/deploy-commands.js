// == Imports == 
require('dotenv').config();
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fs = require('node:fs');

// == Find all commands ==
const commands = [];
const commandFiles = fs.readdirSync('discord/commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  console.log(`[discord] registering (${command.data.name}) as a (/) command`);
  commands.push(command.data.toJSON());
}

// == Register the commands ==
async function deployCommands(guilds) {
  const rest = new REST({ version: '9' }).setToken(process.env.botToken);
  for (let ii = 0; ii < guilds.length; ii++) {
    (async () => {
      try {
        console.log(`[discord] started refreshing application (/) commands on guild ${guilds[ii]}.`);

        await rest.put(
          Routes.applicationGuildCommands(process.env.botClientID, guilds[ii]),
          { body: commands },
        );

        console.log(`[discord] successfully reloaded application (/) commands. ${guilds[ii]}`);
      } catch (error) {
        console.log(error);
        console.log(`[discord] Failed to reload application (/) commands. ${guilds[ii]}`);
      }
    })();
  }
}

module.exports = { deployCommands };
// Use Routes.applicationCommands(clientId) to register global commands (NOTE: global commands take ONE HOUR to update)