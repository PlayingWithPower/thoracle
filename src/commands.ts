import { Collection, REST, Routes } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { CLIENT_ID, GUILD_ID, TOKEN } from './env';
import { Command } from './types/Command';

export const commands = new Collection<string, Command>();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith('.js') || file.endsWith('.ts'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    commands.set(command.data.name, command);
}

const commandData = [...commands.values()].map((command) =>
    command.data.toJSON()
);

const rest = new REST({ version: '10' }).setToken(TOKEN);

export async function registerGuildCommands() {
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
        body: commandData,
    });
}

export async function registerGlobalCommands() {
    await rest.put(Routes.applicationCommands(CLIENT_ID), {
        body: commandData,
    });
}
