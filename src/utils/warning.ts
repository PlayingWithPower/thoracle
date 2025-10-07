import { EmbedBuilder } from 'discord.js';

export function createShutdownWarningEmbed(): EmbedBuilder {
    return new EmbedBuilder()
        .setTitle('⚠️ WARNING! THIS BOT IS SHUTTING DOWN ON DECEMBER 30TH, 2025.')
        .setDescription(
            'This bot is retired and will be shut down by the end of the year.\n' +
            'If you or someone you know wants to take over hosting the bot, please join [this server](https://discord.gg/drrVQNrzGa) for more info.'
        )
        .setColor('Red');
}
