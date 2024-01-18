import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { fetchConfig } from '../database/Config';
import { ISeason, Season } from '../database/Season';
import { Command, newCommand } from '../types/Command';
import { leaderboardFields } from '../utils/leaderboard';

const command = newCommand()
    .setName('leaderboard')
    .setDescription('Displays the season leaderboard.')
    .addStringOption((option) =>
        option.setName('season').setDescription('Name of the season.')
    );

export = <Command>{
    data: command,

    async execute(interaction: ChatInputCommandInteraction) {
        const name = interaction.options.getString('season');

        const season: ISeason | null = await Season.findOne(
            name === null
                ? { guildId: interaction.guildId!, endDate: { $exists: false } }
                : { guildId: interaction.guildId!, name }
        );

        if (!season) {
            return await interaction.reply({
                content:
                    name === null
                        ? 'There is no current season.'
                        : 'There is no season with that name.',
                ephemeral: true,
            });
        }

        const config = await fetchConfig(interaction.guildId!);

        const fields = await leaderboardFields(
            interaction.guildId!,
            config,
            season
        );

        const embed = new EmbedBuilder()
            .setTitle(`Season Leaderboard - ${season.name}`)
            .setDescription(
                fields.length
                    ? 'These are the standings for the season.'
                    : 'Not enough matches have been logged yet.'
            )
            .setColor('Purple')
            .addFields(fields);

        await interaction.reply({ embeds: [embed] });
    },
};
