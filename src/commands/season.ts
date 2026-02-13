import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChatInputCommandInteraction,
    ComponentType,
    EmbedBuilder,
    MessageActionRowComponentBuilder,
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

export = <Command>{
    data: command
        .addSubcommand(seasonInfo)
        .addSubcommand(startSeason)
        .addSubcommand(endSeason),

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

    const matchesPlayed = await Match.count({ season: season.id });
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

    const existingSeason: ISeason | null = await Season.findOne({
        guildId: interaction.guildId!,
        endDate: { $exists: false },
    });

    if (!existingSeason) {
        return await interaction.reply({
            content: 'There is no current season.',
            ephemeral: true,
        });
    }

    // Create confirmation buttons
    const confirmButton = new ButtonBuilder()
        .setCustomId('confirm_end_season')
        .setLabel('Confirm')
        .setStyle(ButtonStyle.Danger);

    const cancelButton = new ButtonBuilder()
        .setCustomId('cancel_end_season')
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Secondary);

    const actionRow = new ActionRowBuilder<MessageActionRowComponentBuilder>()
        .addComponents(confirmButton, cancelButton);

    // Send confirmation message
    const response = await interaction.reply({
        content: `You are about to end season ${existingSeason.name}. Are you sure?`,
        components: [actionRow],
        ephemeral: true,
    });

    // Wait for button interaction
    try {
        const confirmation = await response.awaitMessageComponent({
            filter: (i) => i.user.id === interaction.user.id,
            componentType: ComponentType.Button,
            time: 60_000, // 60 seconds
        });

        if (confirmation.customId === 'confirm_end_season') {
            // End the season
            await Season.findOneAndUpdate(
                { _id: existingSeason._id },
                { endDate: Date.now() }
            );

            await confirmation.update({
                content: 'The current season is now over.',
                components: [],
            });
        } else {
            // Cancel button pressed
            await confirmation.update({
                content: 'Request to end the season cancelled.',
                components: [],
            });
        }
    } catch (error) {
        // Timeout - no button was pressed
        await interaction.editReply({
            content: 'Confirmation timed out. Request to end the season cancelled.',
            components: [],
        });
    }
}
