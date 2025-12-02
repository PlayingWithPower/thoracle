import { EmbedBuilder } from 'discord.js';

export function createShutdownWarningEmbed(): EmbedBuilder {
    return new EmbedBuilder()
        .setTitle('⚠️ WARNING! THIS BOT IS SHUTTING DOWN ON DECEMBER 31ST, 2025.')
        .setDescription(
            'This bot is retired and will be shut down by the end of the year.\n' +
            'A new version of the bot with a new owner will be released in January 2026.\n' +
            'please join [this server](https://discord.gg/drrVQNrzGa) for more info.'
        )
        .setColor('Red');
}
