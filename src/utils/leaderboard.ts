import { APIEmbedField, userMention } from 'discord.js';
import { IConfig } from '../database/Config';
import { IMatch, Match } from '../database/Match';
import { ISeason } from '../database/Season';

interface PlayerStanding {
    matches: number;
    wins: number;
    losses: number;
    draws: number;
    points: number;
}

export async function leaderboardFields(
    guildId: string,
    config: IConfig,
    season: ISeason
): Promise<APIEmbedField[]> {
    const matches: IMatch[] = await Match.find({
        guildId: guildId,
        season: season._id,
        $nor: [{ 'players.confirmed': false }],
    });

    const playerStandings: Record<string, PlayerStanding> = {};

    for (const match of matches) {
        for (const { userId } of match.players) {
            if (!(userId in playerStandings)) {
                playerStandings[userId] = {
                    matches: 0,
                    wins: 0,
                    losses: 0,
                    draws: 0,
                    points: 0,
                };
            }

            const standing = playerStandings[userId];

            standing.matches++;

            if (!match.winnerUserId) {
                standing.draws++;
                standing.points += config.pointsPerDraw;
            } else if (userId === match.winnerUserId) {
                standing.wins++;
                standing.points += config.pointsGained;
            } else {
                standing.losses++;
                standing.points -= config.pointsLost;
            }
        }
    }

    for (const [player, standing] of Object.entries(playerStandings)) {
        if (standing.matches < config.minimumGamesPerPlayer) {
            delete playerStandings[player];
        }
    }

    const firstPageEntries = Object.entries(playerStandings)
        .sort(
            (a, b) =>
                b[1].points - a[1].points ||
                b[1].wins / b[1].matches - a[1].wins / a[1].matches
        )
        .slice(0, 25);

    if (!firstPageEntries.length) return [];

    const playerText = firstPageEntries
        .map(([userId]) => userMention(userId))
        .join('\n');

    const gamesText = firstPageEntries
        .map(
            ([_, standing]) =>
                `${standing.matches} game${
                    standing.matches === 1 ? '' : 's'
                } (${Math.floor(
                    (standing.wins / (standing.matches || 1)) * 100
                )}% winrate)`
        )
        .join('\n');

    const pointsText = firstPageEntries
        .map(([_, standing]) =>
            (config.basePoints + standing.points).toString()
        )
        .join('\n');

    return [
        { name: 'Player', value: playerText, inline: true },
        { name: 'Games', value: gamesText, inline: true },
        { name: 'Points', value: pointsText, inline: true },
    ];
}
