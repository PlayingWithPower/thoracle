import {
    ChatInputCommandInteraction,
    EmbedBuilder,
    TimestampStyles,
    time,
} from 'discord.js';
import { Types } from 'mongoose';
import { Match } from '../database/Match';
import { ISeason, Season } from '../database/Season';
import { Command, newCommand, newSubcommand } from '../types/Command';

const command = newCommand()
    .setName('season')
    .setDescription('Manages the current season.');

const seasonInfo = newSubcommand()
    .setName('info')
    .setDescription('Shows info about a season.')
    .addStringOption((option) =>
        option.setName('name').setDescription('Name of the season.')
    );

const startSeason = newSubcommand()
    .setName('start')
    .setDescription('Starts a new season.')
    .addStringOption((option) =>
        option
            .setName('name')
            .setDescription('Name of the season.')
            .setRequired(true)
    );

const endSeason = newSubcommand()
    .setName('end')
    .setDescription('Ends the current season.');

const listSeasons = newSubcommand()
    .setName('list')
    .setDescription('Lists all seasons for this server.');

export = <Command>{
    data: command
        .addSubcommand(seasonInfo)
        .addSubcommand(startSeason)
        .addSubcommand(endSeason)
        .addSubcommand(listSeasons),

    async execute(interaction: ChatInputCommandInteraction) {
        switch (interaction.options.getSubcommand()) {
            case 'info':
                await handleInfo(
                    interaction,
                    interaction.options.getString('name')
                );
                break;

            case 'start':
                await handleStart(
                    interaction,
                    interaction.options.getString('name', true)
                );
                break;

            case 'end':
                await handleEnd(interaction);
                break;

            case 'list':
                await handleList(interaction);
                break;
        }
    },
};

async function handleInfo(
    interaction: ChatInputCommandInteraction,
    name: string | null
) {
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

    const startDateText = time(season.startDate, TimestampStyles.LongDateTime);
    const endDateText = season.endDate
        ? time(season.endDate, TimestampStyles.LongDateTime)
        : 'The season has not ended yet.';

    const matchesPlayed = await Match.count({ 
        season: season._id as Types.ObjectId 
    });
    const matchesPlayedText = `${matchesPlayed} game${
        matchesPlayed === 1 ? '' : 's'
    } have been played.`;

    const embed = new EmbedBuilder()
        .setTitle(`Season Information - ${season.name}`)
        .setDescription(
            season.endDate
                ? 'This is information about a previous season, rather than the current season.'
                : 'This is information about the current season.'
        )
        .setColor('Blue')
        .addFields(
            { name: 'Start Date', value: startDateText },
            { name: 'End Date', value: endDateText },
            { name: 'Matches Played', value: matchesPlayedText }
        );

    await interaction.reply({
        embeds: [embed],
        ephemeral: true,
    });
}

async function handleStart(
    interaction: ChatInputCommandInteraction,
    name: string
) {
    if (!interaction.memberPermissions?.has('ManageGuild')) {
        return await interaction.reply({
            content: 'You do not have permission to do this.',
            ephemeral: true,
        });
    }

    const existingSeason: ISeason | null = await Season.findOne({
        $or: [
            { guildId: interaction.guildId!, endDate: { $exists: false } },
            { guildId: interaction.guildId!, name },
        ],
    });

    if (existingSeason) {
        if (existingSeason.endDate) {
            return await interaction.reply({
                content: 'There is already a season with that name.',
                ephemeral: true,
            });
        } else {
            return await interaction.reply({
                content: 'There is already an active season.',
                ephemeral: true,
            });
        }
    }

    await Season.create({ guildId: interaction.guildId!, name });

    await interaction.reply({
        content: 'The season has been started.',
        ephemeral: true,
    });
}

async function handleEnd(interaction: ChatInputCommandInteraction) {
    if (!interaction.memberPermissions?.has('ManageGuild')) {
        return await interaction.reply({
            content: 'You do not have permission to do this.',
            ephemeral: true,
        });
    }

    const existingSeason: ISeason | null = await Season.findOneAndUpdate(
        { guildId: interaction.guildId!, endDate: { $exists: false } },
        { endDate: Date.now() }
    );

    if (!existingSeason) {
        return await interaction.reply({
            content: 'There is no current season.',
            ephemeral: true,
        });
    }

    await interaction.reply({
        content: 'The current season is now over.',
        ephemeral: true,
    });
}

async function handleList(interaction: ChatInputCommandInteraction) {
    const seasons: ISeason[] = await Season.find({
        guildId: interaction.guildId!,
    }).sort({ startDate: -1 });

    if (seasons.length === 0) {
        return await interaction.reply({
            content: 'There are no seasons for this server.',
            ephemeral: true,
        });
    }

    const embed = new EmbedBuilder()
        .setTitle(`Seasons - ${interaction.guild?.name}`)
        .setDescription('All seasons for this server:')
        .setColor('Blue');

    for (const season of seasons) {
        const startDateText = time(season.startDate, TimestampStyles.ShortDate);
        const endDateText = season.endDate
            ? time(season.endDate, TimestampStyles.ShortDate)
            : 'Active';

        const matchesPlayed = await Match.count({ 
        season: season._id as Types.ObjectId 
    });
        const matchesPlayedText = `${matchesPlayed} game${
            matchesPlayed === 1 ? '' : 's'
        }`;

        const status = season.endDate ? '🔴' : '🟢';

        embed.addFields({
            name: `${status} ${season.name}`,
            value: `**Dates:** ${startDateText} - ${endDateText}\n**Games Played:** ${matchesPlayedText}`,
            inline: false,
        });
    }

    await interaction.reply({
        embeds: [embed],
        ephemeral: true,
    });
}
