import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { client } from '..';
import { Deck, IDeck } from '../database/Deck';
import { IMatch, Match } from '../database/Match';
import { ISeason, Season } from '../database/Season';
import { Command, newCommand, newSubcommand } from '../types/Command';
import { matchListFields } from '../utils/match';
import { createShutdownWarningEmbed } from '../utils/warning';

const command = newCommand()
    .setName('match')
    .setDescription('Manages logged matches.');

const pendingMatches = newSubcommand()
    .setName('pending')
    .setDescription('Lists pending matches.');

const disputedMatches = newSubcommand()
    .setName('disputed')
    .setDescription('Lists disputed matches.');

const acceptMatch = newSubcommand()
    .setName('accept')
    .setDescription('Accepts a match.')
    .addStringOption((option) =>
        option
            .setName('match')
            .setDescription('Match to accept.')
            .setRequired(true)
    );

const deleteMatch = newSubcommand()
    .setName('delete')
    .setDescription('Deletes a match.')
    .addStringOption((option) =>
        option
            .setName('match')
            .setDescription('Match to delete.')
            .setRequired(true)
    );

const listMatches = newSubcommand()
    .setName('list')
    .setDescription('Displays your matches.')
    .addStringOption((option) =>
        option.setName('deck').setDescription('Filter by deck.')
    )
    .addStringOption((option) =>
        option.setName('season').setDescription('Filter by season.')
    );

export = <Command>{
    data: command
        .addSubcommand(pendingMatches)
        .addSubcommand(disputedMatches)
        .addSubcommand(acceptMatch)
        .addSubcommand(deleteMatch)
        .addSubcommand(listMatches),

    async execute(interaction: ChatInputCommandInteraction) {
        switch (interaction.options.getSubcommand()) {
            case 'pending':
                await handlePending(interaction);
                break;

            case 'disputed':
                await handleDisputed(interaction);
                break;

            case 'accept':
                await handleAccept(
                    interaction,
                    interaction.options.getString('match', true)
                );
                break;

            case 'delete':
                await handleDelete(
                    interaction,
                    interaction.options.getString('match', true)
                );
                break;

            case 'list':
                await handleList(
                    interaction,
                    interaction.options.getString('deck'),
                    interaction.options.getString('season-name')
                );
        }
    },
};

async function handlePending(interaction: ChatInputCommandInteraction) {
    if (!interaction.memberPermissions?.has('ManageGuild')) {
        return await interaction.reply({
            content: 'You do not have permission to do this.',
            ephemeral: true,
        });
    }

    const season = await Season.findOne({
        guildId: interaction.guildId!,
        endDate: { $exists: false },
    });

    if (!season) {
        return await interaction.reply({
            content: 'There is no current season.',
            ephemeral: true,
        });
    }

    const matches: IMatch[] = await Match.find({
        guildId: interaction.guildId!,
        season: season._id,
        'players.confirmed': false,
    }).sort({ _id: 1 });

    if (!matches.length) {
        return await interaction.reply({
            content: 'There are no pending matches.',
            ephemeral: true,
        });
    }

    const fields = await matchListFields(matches.slice(0, 4));

    const embed = new EmbedBuilder()
        .setTitle('Pending Matches - Page 1')
        .setDescription('These are matches that have not been confirmed yet.')
        .setColor('Blue')
        .addFields(fields);

    await interaction.reply({
        embeds: [createShutdownWarningEmbed(), embed],
        ephemeral: true,
    });
}

async function handleDisputed(interaction: ChatInputCommandInteraction) {
    if (!interaction.memberPermissions?.has('ManageGuild')) {
        return await interaction.reply({
            content: 'You do not have permission to do this.',
            ephemeral: true,
        });
    }

    const season = await Season.findOne({
        guildId: interaction.guildId!,
        endDate: { $exists: false },
    });

    if (!season) {
        return await interaction.reply({
            content: 'There is no current season.',
            ephemeral: true,
        });
    }

    const matches: IMatch[] = await Match.find({
        guildId: interaction.guildId!,
        season: season._id,
        'players.confirmed': false,
        disputeThreadId: { $exists: true },
    }).sort({ _id: 1 });

    if (!matches.length) {
        return await interaction.reply({
            content: 'There are no disputed matches.',
            ephemeral: true,
        });
    }

    const fields = await matchListFields(matches.slice(0, 4));

    const embed = new EmbedBuilder()
        .setTitle('Disputed Matches - Page 1')
        .setDescription(
            'These are disputed matches that have not been confirmed yet.'
        )
        .setColor('Blue')
        .addFields(fields);

    await interaction.reply({
        embeds: [createShutdownWarningEmbed(), embed],
        ephemeral: true,
    });
}

async function handleAccept(
    interaction: ChatInputCommandInteraction,
    id: string
) {
    if (!interaction.memberPermissions?.has('ManageGuild')) {
        return await interaction.reply({
            content: 'You do not have permission to do this.',
            ephemeral: true,
        });
    }

    const match: IMatch | null = await Match.findById(id);

    if (!match) {
        return await interaction.reply({
            content: 'There is no match with that id.',
            ephemeral: true,
        });
    }

    if (match.guildId !== interaction.guildId) {
        return await interaction.reply({
            content: 'That match is from another server.',
            ephemeral: true,
        });
    }

    let confirmed = true;

    for (const player of match.players) {
        confirmed &&= player.confirmed;

        player.confirmed = true;
    }

    if (confirmed) {
        return await interaction.reply({
            content: 'That match has already been confirmed by all players.',
            ephemeral: true,
        });
    }

    match.confirmedAt = new Date();

    await match.save();

    await interaction.reply({
        content: 'That match has been accepted.',
        ephemeral: true,
    });
}

async function handleDelete(
    interaction: ChatInputCommandInteraction,
    id: string
) {
    if (!interaction.memberPermissions?.has('ManageGuild')) {
        return await interaction.reply({
            content: 'You do not have permission to do this.',
            ephemeral: true,
        });
    }

    const match: IMatch | null = await Match.findById(id);

    if (!match) {
        return await interaction.reply({
            content: 'There is no match with that id.',
            ephemeral: true,
        });
    }

    if (match.guildId !== interaction.guildId) {
        return await interaction.reply({
            content: 'That match is from another server.',
            ephemeral: true,
        });
    }

    await match.deleteOne();

    const channel = match.channelId
        ? client.channels.cache.get(match.channelId)
        : undefined;

    if (channel?.isTextBased() && match.messageId) {
        channel.messages.delete(match.messageId).catch(() => null);
    }

    const disputeChannel = match.disputeThreadId
        ? client.channels.cache.get(match.disputeThreadId)
        : undefined;

    await disputeChannel?.delete().catch(() => null);

    await interaction.reply({
        content: 'That match has been deleted.',
        ephemeral: true,
    });
}

async function handleList(
    interaction: ChatInputCommandInteraction,
    deckName: string | null,
    seasonName: string | null
) {
    const deck: IDeck | null = deckName
        ? await Deck.findOne({
              guildId: interaction.guildId!,
              userId: interaction.user.id,
              name: deckName,
          })
        : null;

    if (deckName && !deck) {
        return await interaction.reply({
            content: 'You have no deck with that name.',
            ephemeral: true,
        });
    }

    const season: ISeason | null = seasonName
        ? await Season.findOne({
              guildId: interaction.guildId!,
              name: seasonName,
          })
        : null;

    if (seasonName && !season) {
        return await interaction.reply({
            content: 'There is no season with that name.',
            ephemeral: true,
        });
    }

    const matches: IMatch[] = await Match.find({
        guildId: interaction.guildId!,
        ...(season ? { season: season._id } : {}),
        players: {
            $elemMatch: {
                userId: interaction.user.id,
                ...(deck ? { deck: deck._id } : {}),
            },
        },
    }).sort({ _id: -1 });

    const constraintsText =
        deckName || seasonName ? ' with those constraints' : '';

    if (!matches.length) {
        return await interaction.reply({
            content: `You have not played any matches${constraintsText}.`,
            ephemeral: true,
        });
    }

    const fields = await matchListFields(matches.slice(0, 4));

    const embed = new EmbedBuilder()
        .setTitle('Your Matches - Page 1')
        .setDescription(
            `These are the matches that you have played in${constraintsText}.`
        )
        .setColor('Blue')
        .addFields(fields);

    await interaction.reply({
        embeds: [createShutdownWarningEmbed(), embed],
        ephemeral: true,
    });
}
