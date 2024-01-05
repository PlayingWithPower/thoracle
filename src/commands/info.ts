import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { SUPPORT_SERVER } from '../env';
import { Command, newCommand } from '../types/Command';

const command = newCommand()
    .setName('info')
    .setDescription('Displays information about the bot.');

export = <Command>{
    data: command,

    async execute(interaction: ChatInputCommandInteraction) {
        const author = await interaction.client.users
            .fetch('239457433938821121')
            .catch(() => null);

        const embed = new EmbedBuilder()
            .setTitle('Thoracle Info')
            .setColor('Blue')
            .setDescription(
                [
                    'This bot allows you to easily log matches, manage seasons, ',
                    'and view a leaderboard and personal deck statistics for EDH gameplay leagues.',
                ].join('')
            )
            .addFields({
                name: 'Support',
                value: `Join the [support server](${SUPPORT_SERVER}) for help with using this bot or setting it up on your own servers.`,
            });

        embed.setFooter({
            text: `Made by Brandon Haggstrom - @${
                author?.username ?? 'Rigidity'
            }`,
            iconURL: author?.displayAvatarURL({ size: 32 }),
        });

        await interaction.reply({
            embeds: [embed],
            ephemeral: true,
        });
    },
};
