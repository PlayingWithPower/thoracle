import {
    APIRole,
    ChatInputCommandInteraction,
    PermissionsBitField,
    Role,
    roleMention,
} from 'discord.js';
import { IConfig, fetchConfig } from '../database/Config';
import { Command, newCommand, newSubcommand } from '../types/Command';
import { createShutdownWarningEmbed } from '../utils/warning';

const command = newCommand()
    .setName('config')
    .setDescription('Manages the config.');

const configMinimumGames = newSubcommand()
    .setName('minimum-games')
    .setDescription('Games required to be seen on the leaderboard.')
    .addIntegerOption((option) =>
        option.setName('amount').setDescription('Number of games.')
    );

const configPointsGained = newSubcommand()
    .setName('points-gained')
    .setDescription('Points gained after winning a match.')
    .addIntegerOption((option) =>
        option.setName('amount').setDescription('Number of points gained.')
    );

const configPointsLost = newSubcommand()
    .setName('points-lost')
    .setDescription('Points lost after losing a match.')
    .addIntegerOption((option) =>
        option.setName('amount').setDescription('Number of points lost.')
    );

const configPointsPerDraw = newSubcommand()
    .setName('points-per-draw')
    .setDescription('Points gained after drawing a match.')
    .addIntegerOption((option) =>
        option.setName('amount').setDescription('Number of points gained.')
    );

const configEnableDraws = newSubcommand()
    .setName('enable-draws')
    .setDescription(
        'Whether or not players are allowed to log a match as a draw.'
    )
    .addBooleanOption((option) =>
        option
            .setName('enabled')
            .setDescription('Whether or not draws are enabled.')
    );

const configBasePoints = newSubcommand()
    .setName('base-points')
    .setDescription('Points added to values when displayed.')
    .addIntegerOption((option) =>
        option.setName('amount').setDescription('Number of points added.')
    );

const configDeckLimit = newSubcommand()
    .setName('deck-limit')
    .setDescription('Maximum decks a player can have.')
    .addIntegerOption((option) =>
        option.setName('amount').setDescription('Number of decks.')
    );

const configDisputeRole = newSubcommand()
    .setName('dispute-role')
    .setDescription('Role added to dispute threads.')
    .addRoleOption((option) =>
        option.setName('role').setDescription('Dispute role.')
    )
    .addBooleanOption((option) =>
        option.setName('unset').setDescription('Removes the dispute role.')
    );

export = <Command>{
    data: command
        .addSubcommand(configMinimumGames)
        .addSubcommand(configPointsGained)
        .addSubcommand(configPointsLost)
        .addSubcommand(configBasePoints)
        .addSubcommand(configPointsPerDraw)
        .addSubcommand(configEnableDraws)
        .addSubcommand(configDeckLimit)
        .addSubcommand(configDisputeRole)
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild),

    async execute(interaction: ChatInputCommandInteraction) {
        switch (interaction.options.getSubcommand()) {
            case 'minimum-games':
                await handleMinimumGames(
                    interaction,
                    interaction.options.getInteger('amount')
                );
                break;

            case 'points-gained':
                await handlePointsGained(
                    interaction,
                    interaction.options.getInteger('amount')
                );
                break;

            case 'points-lost':
                await handlePointsLost(
                    interaction,
                    interaction.options.getInteger('amount')
                );
                break;

            case 'points-per-draw':
                await handlePointsPerDraw(
                    interaction,
                    interaction.options.getInteger('amount')
                );
                break;

            case 'enable-draws':
                await handleEnableDraws(
                    interaction,
                    interaction.options.getBoolean('enabled')
                );
                break;

            case 'base-points':
                await handleBasePoints(
                    interaction,
                    interaction.options.getInteger('amount')
                );
                break;

            case 'deck-limit':
                await handleDeckLimit(
                    interaction,
                    interaction.options.getInteger('amount')
                );
                break;

            case 'dispute-role':
                await handleDisputeRole(
                    interaction,
                    interaction.options.getRole('role'),
                    interaction.options.getBoolean('unset')
                );
                break;
        }
    },
};

async function handleMinimumGames(
    interaction: ChatInputCommandInteraction,
    amount: number | null
) {
    const config = await fetchConfig(interaction.guildId!, {
        $set: {
            minimumGamesPerPlayer: amount ?? undefined,
        },
    });

    const embed = new EmbedBuilder()
        .setDescription(`The minimum games per player is ${
            amount === null ? 'currently' : 'now'
        } ${config.minimumGamesPerPlayer}.`)
        .setColor('Blue');

    await interaction.reply({
        embeds: [createShutdownWarningEmbed(), embed],
        ephemeral: true,
    });
}

async function handlePointsGained(
    interaction: ChatInputCommandInteraction,
    amount: number | null
) {
    const config = await fetchConfig(interaction.guildId!, {
        $set: {
            pointsGained: amount ?? undefined,
        },
    });

    const embed = new EmbedBuilder()
        .setDescription(`The points gained per match win is ${
            amount === null ? 'currently' : 'now'
        } ${config.pointsGained}.`)
        .setColor('Blue');

    await interaction.reply({
        embeds: [createShutdownWarningEmbed(), embed],
        ephemeral: true,
    });
}

async function handlePointsLost(
    interaction: ChatInputCommandInteraction,
    amount: number | null
) {
    const config = await fetchConfig(interaction.guildId!, {
        $set: {
            pointsLost: amount ?? undefined,
        },
    });

    const embed = new EmbedBuilder()
        .setDescription(`The points lost per match loss is ${
            amount === null ? 'currently' : 'now'
        } ${config.pointsLost}.`)
        .setColor('Blue');

    await interaction.reply({
        embeds: [createShutdownWarningEmbed(), embed],
        ephemeral: true,
    });
}

async function handlePointsPerDraw(
    interaction: ChatInputCommandInteraction,
    amount: number | null
) {
    const config = await fetchConfig(interaction.guildId!, {
        $set: {
            pointsPerDraw: amount ?? undefined,
        },
    });

    const embed = new EmbedBuilder()
        .setDescription(`The points gained per match logged as a draw is ${
            amount === null ? 'currently' : 'now'
        } ${config.pointsPerDraw}.`)
        .setColor('Blue');

    await interaction.reply({
        embeds: [createShutdownWarningEmbed(), embed],
        ephemeral: true,
    });
}

async function handleEnableDraws(
    interaction: ChatInputCommandInteraction,
    enabled: boolean | null
) {
    const config = await fetchConfig(interaction.guildId!, {
        $set: {
            enableDraws: enabled ?? undefined,
        },
    });

    const embed = new EmbedBuilder()
        .setDescription(`Draws are ${enabled === null ? 'currently' : 'now'} ${
            config.enableDraws ? 'enabled' : 'disabled'
        }.`)
        .setColor('Blue');

    await interaction.reply({
        embeds: [createShutdownWarningEmbed(), embed],
        ephemeral: true,
    });
}

async function handleBasePoints(
    interaction: ChatInputCommandInteraction,
    amount: number | null
) {
    const config = await fetchConfig(interaction.guildId!, {
        $set: {
            basePoints: amount ?? undefined,
        },
    });

    const embed = new EmbedBuilder()
        .setDescription(`The points added to values when displayed is ${
            amount === null ? 'currently' : 'now'
        } ${config.basePoints}.`)
        .setColor('Blue');

    await interaction.reply({
        embeds: [createShutdownWarningEmbed(), embed],
        ephemeral: true,
    });
}

async function handleDeckLimit(
    interaction: ChatInputCommandInteraction,
    amount: number | null
) {
    const config = await fetchConfig(interaction.guildId!, {
        $set: {
            deckLimit: amount ?? undefined,
        },
    });

    const embed = new EmbedBuilder()
        .setDescription(`The maximum decks a player can have is ${
            amount === null ? 'currently' : 'now'
        } ${config.deckLimit}.`)
        .setColor('Blue');

    await interaction.reply({
        embeds: [createShutdownWarningEmbed(), embed],
        ephemeral: true,
    });
}

async function handleDisputeRole(
    interaction: ChatInputCommandInteraction,
    role: Role | APIRole | null,
    unset: boolean | null
) {
    let config: IConfig;

    if (unset) {
        config = await fetchConfig(interaction.guildId!, {
            $unset: {
                disputeRoleId: '',
            },
        });
    } else {
        config = await fetchConfig(interaction.guildId!, {
            $set: {
                disputeRoleId: role?.id ?? undefined,
            },
        });
    }

    const embed = new EmbedBuilder()
        .setDescription(`The dispute role is ${
            role === null && !unset ? 'currently' : 'now'
        } ${
            config.disputeRoleId ? roleMention(config.disputeRoleId) : 'unset'
        }.`)
        .setColor('Blue');

    await interaction.reply({
        embeds: [createShutdownWarningEmbed(), embed],
        ephemeral: true,
    });
}
