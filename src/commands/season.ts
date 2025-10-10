import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChatInputCommandInteraction,
    ComponentType,
    EmbedBuilder,
    TimestampStyles,
    time,
} from 'discord.js';
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

const reopenSeason = newSubcommand()
    .setName('reopen')
    .setDescription('Reopens a previously closed season.')
    .addStringOption((option) =>
        option
            .setName('name')
            .setDescription('Name of the season to reopen.')
            .setRequired(true)
    );

export = <Command>{
    data: command
        .addSubcommand(seasonInfo)
        .addSubcommand(startSeason)
        .addSubcommand(endSeason)
        .addSubcommand(reopenSeason),

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

            case 'reopen':
                await handleReopen(
                    interaction,
                    interaction.options.getString('name', true)
                );
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

    const matchesPlayed = await Match.count({ season: season._id });
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

async function handleReopen(
    interaction: ChatInputCommandInteraction,
    name: string
) {
    if (!interaction.memberPermissions?.has('ManageGuild')) {
        return await interaction.reply({
            content: 'You do not have permission to do this.',
            ephemeral: true,
        });
    }

    // Check if there's a current active season
    const activeSeason: ISeason | null = await Season.findOne({
        guildId: interaction.guildId!,
        endDate: { $exists: false },
    });

    if (activeSeason) {
        return await interaction.reply({
            content: 'There is already an active season. Please end the current season before reopening a previous one.',
            ephemeral: true,
        });
    }

    // Check if the season exists and is closed
    const seasonToReopen: ISeason | null = await Season.findOne({
        guildId: interaction.guildId!,
        name,
    });

    if (!seasonToReopen) {
        return await interaction.reply({
            content: 'There is no season with that name.',
            ephemeral: true,
        });
    }

    if (!seasonToReopen.endDate) {
        return await interaction.reply({
            content: 'That season is already active.',
            ephemeral: true,
        });
    }

    // Create confirmation buttons
    const confirmButton = new ButtonBuilder()
        .setCustomId('confirm')
        .setLabel('Yes, Reopen Season')
        .setStyle(ButtonStyle.Danger);

    const cancelButton = new ButtonBuilder()
        .setCustomId('cancel')
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        confirmButton,
        cancelButton
    );

    // Send confirmation message
    const response = await interaction.reply({
        content: `Are you sure you want to reopen the season "${name}"? This will make it the active season again.`,
        components: [row],
        ephemeral: true,
    });

    try {
        // Wait for button click with 30 second timeout
        const confirmation = await response.awaitMessageComponent({
            filter: (i: any) => i.user.id === interaction.user.id,
            componentType: ComponentType.Button,
            time: 30000,
        });

        if (confirmation.customId === 'confirm') {
            // Reopen the season by removing the endDate
            await Season.updateOne(
                { _id: seasonToReopen._id },
                { $unset: { endDate: '' } }
            );

            await confirmation.update({
                content: `The season "${name}" has been reopened and is now active.`,
                components: [],
            });
        } else {
            await confirmation.update({
                content: 'Season reopen cancelled.',
                components: [],
            });
        }
    } catch (error) {
        // Timeout - no button clicked
        await interaction.editReply({
            content: 'Confirmation timeout - season was not reopened.',
            components: [],
        });
    }
}
