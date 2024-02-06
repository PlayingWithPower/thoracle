import {
    APIEmbedField,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChatInputCommandInteraction,
    EmbedBuilder,
    MessageActionRowComponentBuilder,
    channelLink,
    messageLink,
    userMention,
} from 'discord.js';
import { Types } from 'mongoose';
import { Deck, IDeck } from '../database/Deck';
import { IMatch, Match } from '../database/Match';
import { fetchProfile } from '../database/Profile';
import { ISeason, Season } from '../database/Season';

export async function logMatch(
    interaction: ChatInputCommandInteraction,
    playerIds: [string, string, string, string],
    isWin: boolean
) {
    const season: ISeason | null = await Season.findOne({
        guildId: interaction.guildId!,
        endDate: { $exists: false },
    });

    if (!season) {
        return await interaction.reply({
            content: 'There is no current season.',
            ephemeral: true,
        });
    }

    if (new Set(playerIds).size !== playerIds.length) {
        return await interaction.reply({
            content: 'All players in a match must be unique.',
            ephemeral: true,
        });
    }

    const profilePromises = playerIds.map((userId) =>
        fetchProfile(interaction.guildId!, userId)
    );
    const profiles = await Promise.all(profilePromises);

    const deckPromises = profiles.map((profile) =>
        profile.currentDeck
            ? Deck.findOne<IDeck>({ _id: profile.currentDeck })
            : null
    );
    const decks = await Promise.all(deckPromises);

    const matchId = new Types.ObjectId();

    const embed = new EmbedBuilder()
        .setTitle('Match Confirmation')
        .setDescription(
            [
                `The match will be recorded as a ${
                    isWin ? 'win for the player who logged it' : 'draw'
                }.`,
                'Click below to confirm whether or not the match details are correct.',
            ].join(' ')
        )
        .setFooter({
            text: `Match Id: (${matchId.toString()})`,
        })
        .setColor(isWin ? 'Green' : 'Blue');

    const playerText = profiles
        .map((profile) => userMention(profile.userId))
        .join('\n');

    const deckText = decks
        .map((deck) =>
            deck
                ? deck.deckList
                    ? `[${deck.name}](${deck.deckList})`
                    : deck.name
                : 'Not specified'
        )
        .join('\n');

    embed.addFields([
        { name: 'Player', value: playerText, inline: true },
        { name: 'Deck', value: deckText, inline: true },
        { name: 'Confirmed', value: 'Nobody has confirmed this match.' },
    ]);

    const actionRow = new ActionRowBuilder<MessageActionRowComponentBuilder>();

    const confirmButton = new ButtonBuilder()
        .setLabel('Confirm')
        .setCustomId('confirm')
        .setStyle(ButtonStyle.Success);

    const disputeButton = new ButtonBuilder()
        .setLabel('Dispute')
        .setCustomId('dispute')
        .setStyle(ButtonStyle.Danger);

    const cancelButton = new ButtonBuilder()
        .setLabel('Cancel')
        .setCustomId('cancel')
        .setStyle(ButtonStyle.Danger);

    actionRow.addComponents(confirmButton, disputeButton, cancelButton);

    await interaction.reply({
        content: playerIds.map((userId) => userMention(userId)).join(', '),
        embeds: [embed],
        components: [actionRow],
    });

    const message = await interaction.fetchReply();

    const match = new Match({
        guildId: interaction.guildId!,
        channelId: interaction.channelId,
        messageId: message.id,
        winnerUserId: isWin ? interaction.user.id : undefined,
        season: season._id,
        players: profiles.map((profile) => ({
            userId: profile.userId,
            deck: profile.currentDeck,
        })),
    });

    match._id = matchId;
    await match.save();
}

export async function matchListFields(
    matches: IMatch[]
): Promise<APIEmbedField[]> {
    return await Promise.all(
        matches.map(async (match) => {
            const name = `Match (${match._id})`;

            const loggedAtText =
                match.channelId && match.messageId
                    ? `Logged at ${messageLink(
                          match.channelId,
                          match.messageId
                      )}`
                    : 'Has been logged';

            const disputedAtText = match.disputeThreadId
                ? `\nDisputed at ${channelLink(match.disputeThreadId)}`
                : '';

            const players = await Promise.all(
                match.players.map(async (player) => {
                    const userText = userMention(player.userId);

                    let deckText = '';

                    if (player.deck) {
                        const deck: IDeck | null = await Deck.findOne({
                            _id: player.deck,
                        });

                        if (deck) {
                            deckText = ` (${
                                deck.deckList
                                    ? `[${deck.name}](${deck.deckList})`
                                    : deck.name
                            })`;
                        }
                    }

                    return `${userText}${deckText} - ${
                        player.confirmed ? 'Confirmed' : 'Not confirmed'
                    }`;
                })
            );

            const playersText = players.join('\n');

            const value = `${loggedAtText}${disputedAtText}\n${playersText}`;

            return { name, value };
        })
    );
}
