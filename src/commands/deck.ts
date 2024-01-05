import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

import { fetchConfig } from '../database/Config';
import { Deck, IDeck } from '../database/Deck';
import { IMatch, Match } from '../database/Match';
import { fetchProfile } from '../database/Profile';
import { ISeason, Season } from '../database/Season';
import { Command, newCommand, newSubcommand } from '../types/Command';
import { validHosts, validateDeckList } from '../utils/validation';

const command = newCommand()
    .setName('deck')
    .setDescription('Manages your decks.');

const createDeck = newSubcommand()
    .setName('create')
    .setDescription('Creates a new deck.')
    .addStringOption((option) =>
        option
            .setName('name')
            .setDescription('Name of the deck.')
            .setMaxLength(64)
            .setRequired(true)
    )
    .addStringOption((option) =>
        option
            .setName('deck-list')
            .setDescription('URL for the decklist.')
            .setMaxLength(256)
    );

const listDecks = newSubcommand()
    .setName('list')
    .setDescription('Shows a list of your decks.');

const useDeck = newSubcommand()
    .setName('use')
    .setDescription('Sets a deck as current.')
    .addStringOption((option) =>
        option
            .setName('name')
            .setDescription('Name of the deck.')
            .setRequired(true)
    );

const deleteDeck = newSubcommand()
    .setName('delete')
    .setDescription('Deletes a deck.')
    .addStringOption((option) =>
        option
            .setName('name')
            .setDescription('Name of the deck.')
            .setRequired(true)
    );

const renameDeck = newSubcommand()
    .setName('rename')
    .setDescription('Renames a deck.')
    .addStringOption((option) =>
        option
            .setName('name')
            .setDescription('Name of the deck.')
            .setRequired(true)
    )
    .addStringOption((option) =>
        option
            .setName('new-name')
            .setDescription('New name of the deck.')
            .setMaxLength(64)
            .setRequired(true)
    );

const setDeckList = newSubcommand()
    .setName('set-list')
    .setDescription('Sets the deck list URL.')
    .addStringOption((option) =>
        option
            .setName('name')
            .setDescription('Name of the deck.')
            .setRequired(true)
    )
    .addStringOption((option) =>
        option
            .setName('new-deck-list')
            .setDescription('New URL of the deck list.')
            .setMaxLength(256)
            .setRequired(true)
    );

const deckStats = newSubcommand()
    .setName('stats')
    .setDescription('Shows your deck statistics.')
    .addStringOption((option) =>
        option.setName('name').setDescription('Name of the deck.')
    );

export = <Command>{
    data: command
        .addSubcommand(createDeck)
        .addSubcommand(listDecks)
        .addSubcommand(useDeck)
        .addSubcommand(deleteDeck)
        .addSubcommand(renameDeck)
        .addSubcommand(setDeckList)
        .addSubcommand(deckStats),

    async execute(interaction: ChatInputCommandInteraction) {
        switch (interaction.options.getSubcommand()) {
            case 'create':
                await handleCreate(
                    interaction,
                    interaction.options.getString('name', true),
                    interaction.options.getString('deck-list')
                );
                break;

            case 'list':
                await handleList(interaction);
                break;

            case 'use':
                await handleUse(
                    interaction,
                    interaction.options.getString('name', true)
                );
                break;

            case 'delete':
                await handleDelete(
                    interaction,
                    interaction.options.getString('name', true)
                );
                break;

            case 'rename':
                await handleRename(
                    interaction,
                    interaction.options.getString('name', true),
                    interaction.options.getString('new-name', true)
                );
                break;

            case 'set-list':
                await handleSetList(
                    interaction,
                    interaction.options.getString('name', true),
                    interaction.options.getString('new-deck-list', true)
                );
                break;

            case 'stats':
                await handleStats(
                    interaction,
                    interaction.options.getString('name')
                );
                break;
        }
    },
};

async function handleCreate(
    interaction: ChatInputCommandInteraction,
    name: string,
    deckList: string | null
) {
    const config = await fetchConfig(interaction.guildId!);

    const deckCount = await Deck.count({
        guildId: interaction.guildId!,
        userId: interaction.user.id,
    });

    if (deckCount >= config.deckLimit) {
        return await interaction.reply({
            content: 'You have reached the deck limit.',
            ephemeral: true,
        });
    }

    const existingDeck: IDeck | null = await Deck.findOne({
        guildId: interaction.guildId!,
        userId: interaction.user.id,
        name,
    });

    if (existingDeck) {
        return await interaction.reply({
            content: 'You already have a deck with that name.',
            ephemeral: true,
        });
    }

    if (deckList) {
        if (!validateDeckList(deckList)) {
            const hostText = validHosts
                .map((host) => '`' + host + '`')
                .join(', ');

            return await interaction.reply({
                content: `The deck list must be from one of the following websites: ${hostText}.`,
                ephemeral: true,
            });
        }
    }

    const deck: IDeck = await Deck.create({
        guildId: interaction.guildId!,
        userId: interaction.user.id,
        name,
        ...(deckList ? { deckList } : {}),
    });

    await fetchProfile(interaction.guildId!, interaction.user.id, {
        $set: { currentDeck: deck._id },
    });

    await interaction.reply({
        content: 'The deck has been created and set as current.',
        ephemeral: true,
    });
}

async function handleList(interaction: ChatInputCommandInteraction) {
    const decks: IDeck[] = await Deck.find({
        guildId: interaction.guildId!,
        userId: interaction.user.id,
    }).sort({ _id: -1 });

    if (!decks.length) {
        return await interaction.reply({
            content: 'You have not created any decks.',
            ephemeral: true,
        });
    }

    const text = decks
        .map((deck) =>
            deck.deckList ? `[${deck.name}](${deck.deckList})` : deck.name
        )
        .join('\n');

    const embed = new EmbedBuilder()
        .setTitle('Deck List')
        .setThumbnail(interaction.user.displayAvatarURL())
        .setDescription(text)
        .setColor('Blue');

    await interaction.reply({
        embeds: [embed],
        ephemeral: true,
    });
}

async function handleUse(
    interaction: ChatInputCommandInteraction,
    name: string
) {
    const deck: IDeck | null = await Deck.findOne({
        guildId: interaction.guildId!,
        userId: interaction.user.id,
        name,
    });

    if (!deck) {
        return await interaction.reply({
            content: 'You do not have a deck with that name.',
            ephemeral: true,
        });
    }

    await fetchProfile(interaction.guildId!, interaction.user.id, {
        $set: { currentDeck: deck._id },
    });

    await interaction.reply({
        content: 'The deck has been set as current.',
        ephemeral: true,
    });
}

async function handleDelete(
    interaction: ChatInputCommandInteraction,
    name: string
) {
    const deck: IDeck | null = await Deck.findOne({
        guildId: interaction.guildId!,
        userId: interaction.user.id,
        name,
    });

    if (!deck) {
        return await interaction.reply({
            content: 'You do not have a deck with that name.',
            ephemeral: true,
        });
    }

    await Match.updateMany(
        { 'players.deck': deck._id },
        { $unset: { 'players.$.deck': '' } }
    );

    const profile = await fetchProfile(
        interaction.guildId!,
        interaction.user.id
    );

    if (profile.currentDeck?.equals(deck._id)) {
        profile.currentDeck = undefined;
        await profile.save();
    }

    await deck.deleteOne();

    await interaction.reply({
        content: 'The deck has been deleted.',
        ephemeral: true,
    });
}

async function handleRename(
    interaction: ChatInputCommandInteraction,
    name: string,
    newName: string
) {
    const deck: IDeck | null = await Deck.findOne({
        guildId: interaction.guildId!,
        userId: interaction.user.id,
        name,
    });

    if (!deck) {
        return await interaction.reply({
            content: 'You do not have a deck with that name.',
            ephemeral: true,
        });
    }

    const existingDeck: IDeck | null = await Deck.findOne({
        guildId: interaction.guildId!,
        userId: interaction.user.id,
        name: newName,
    });

    if (existingDeck) {
        return await interaction.reply({
            content: 'You already have a deck with that name.',
            ephemeral: true,
        });
    }

    deck.name = newName;

    await deck.save();

    await interaction.reply({
        content: 'The deck has been renamed.',
        ephemeral: true,
    });
}

async function handleSetList(
    interaction: ChatInputCommandInteraction,
    name: string,
    newDeckList: string
) {
    const deck: IDeck | null = await Deck.findOne({
        guildId: interaction.guildId!,
        userId: interaction.user.id,
        name,
    });

    if (!deck) {
        return await interaction.reply({
            content: 'You do not have a deck with that name.',
            ephemeral: true,
        });
    }

    if (!validateDeckList(newDeckList)) {
        const hostText = validHosts.map((host) => '`' + host + '`').join(', ');

        return await interaction.reply({
            content: `The deck list must be from one of the following websites: ${hostText}.`,
            ephemeral: true,
        });
    }

    deck.deckList = newDeckList;

    await deck.save();

    await interaction.reply({
        content: 'The deck list has been set.',
        ephemeral: true,
    });
}

async function handleStats(
    interaction: ChatInputCommandInteraction,
    name: string | null
) {
    const profile = await fetchProfile(
        interaction.guildId!,
        interaction.user.id
    );

    const deck: IDeck | null =
        name === null
            ? profile.currentDeck
                ? await Deck.findOne({ _id: profile.currentDeck })
                : null
            : await Deck.findOne({
                  guildId: interaction.guildId!,
                  userId: interaction.user.id,
                  name,
              });

    if (!deck) {
        return await interaction.reply({
            content:
                name === null
                    ? 'No deck is currently selected.'
                    : 'There is no deck with that name.',
            ephemeral: true,
        });
    }

    const embed = new EmbedBuilder()
        .setTitle(`Deck Statistics - ${deck.name}`)
        .setThumbnail(interaction.user.displayAvatarURL())
        .setDescription(
            `This is the statistics for ${
                deck.deckList ? `[${deck.name}](${deck.deckList})` : deck.name
            }, both overall and for this season.`
        )
        .setColor('Blue');

    if (deck.deckList) embed.setURL(deck.deckList);

    const matches: IMatch[] = await Match.find({
        guildId: interaction.guildId!,
        players: {
            $elemMatch: { userId: interaction.user.id, deck: deck._id },
        },
        $nor: [{ 'players.confirmed': false }],
    });

    const wins = matches.filter(
        (match) => match.winnerUserId === interaction.user.id
    ).length;

    const draws = matches.filter((match) => !match.winnerUserId).length;

    const losses = matches.length - wins - draws;

    let matchesPlayedText = `You played this deck in ${matches.length} game${
        matches.length === 1 ? '' : 's'
    }`;

    let matchesWonText = `You won with this deck in ${wins} game${
        wins === 1 ? '' : 's'
    }`;

    let matchesDrawnText = `You had ${draws} draw${
        draws === 1 ? '' : 's'
    } with this deck`;

    let matchesLostText = `You lost with this deck in ${losses} game${
        losses === 1 ? '' : 's'
    }`;

    let winRateText = `You have a ${Math.floor(
        (wins / (matches.length || 1)) * 100
    )}% winrate with this deck`;

    const season: ISeason | null = await Season.findOne({
        guildId: interaction.guildId!,
        endDate: { $exists: false },
    });

    if (season) {
        const seasonMatches = matches.filter((match) =>
            match.season.equals(season._id)
        );

        const seasonWins = seasonMatches.filter(
            (match) => match.winnerUserId === interaction.user.id
        ).length;

        const seasonDraws = seasonMatches.filter(
            (match) => !match.winnerUserId
        ).length;

        const seasonLosses = seasonMatches.length - seasonWins - seasonDraws;

        matchesPlayedText += ` (${seasonMatches.length} this season)`;
        matchesWonText += ` (${seasonWins} this season)`;
        matchesDrawnText += ` (${seasonDraws} this season)`;
        matchesLostText += ` (${seasonLosses} this season)`;
        winRateText += ` (${Math.floor(
            (seasonWins / (seasonMatches.length || 1)) * 100
        )}% this season)`;
    }

    embed.addFields([
        { name: 'Matches', value: matchesPlayedText + '.' },
        { name: 'Wins', value: matchesWonText + '.' },
        { name: 'Draws', value: matchesDrawnText + '.' },
        { name: 'Losses', value: matchesLostText + '.' },
        { name: 'Win Rate', value: winRateText + '.' },
    ]);

    await interaction.reply({
        embeds: [embed],
        ephemeral: true,
    });
}
