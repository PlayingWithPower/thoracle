import { EmbedBuilder } from 'discord.js';

export function createShutdownWarningEmbed(): EmbedBuilder {
    return new EmbedBuilder()
        .setTitle('⚠️ BOT MAINTENANCE')
        .setDescription(
            'This bot is temporarily down for maintenance and will return on January 14th.\n' +
            'Thank you for your patience!'
        )
        .setColor('Orange');
}
