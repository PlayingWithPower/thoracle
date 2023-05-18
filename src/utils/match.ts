import {
    APIEmbedField,
    channelLink,
    messageLink,
    userMention,
} from 'discord.js';
import { Deck, IDeck, IMatch } from '../database';

export async function matchListFields(
    matches: IMatch[]
): Promise<APIEmbedField[]> {
    return await Promise.all(
        matches.map(async (match) => {
            const name = `Match (${match._id})`;

            const loggedAtText = `Logged at ${messageLink(
                match.channelId,
                match.messageId
            )}`;

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
                            deckText = ` ([${deck.name}](${deck.deckList}))`;
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
