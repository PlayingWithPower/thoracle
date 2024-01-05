import {
    ChatInputCommandInteraction,
    EmbedBuilder,
    userMention,
} from 'discord.js';
import { fetchConfig } from '../database/Config';
import { Deck, IDeck } from '../database/Deck';
import { IMatch, Match } from '../database/Match';
import { IProfile, fetchProfile } from '../database/Profile';
import { ISeason, Season } from '../database/Season';
import { Command, newCommand } from '../types/Command';

const command = newCommand()
    .setName('profile')
    .setDescription('Displays your profile information.');

export = <Command>{
    data: command,

    async execute(interaction: ChatInputCommandInteraction) {
        const profile: IProfile = await fetchProfile(
            interaction.guildId!,
            interaction.user.id
        );

        const embed = new EmbedBuilder()
            .setTitle('Profile Information')
            .setThumbnail(interaction.user.displayAvatarURL())
            .setDescription(
                `This is the statistics for ${userMention(
                    interaction.user.id
                )}, both overall and for this season.`
            )
            .setColor('Blue');

        const deck: IDeck | null = profile.currentDeck
            ? await Deck.findOne({ _id: profile.currentDeck })
            : null;

        const deckText = deck
            ? deck.deckList
                ? `[${deck.name}](${deck.deckList})`
                : deck.name
            : 'No deck selected.';

        embed.addFields({ name: 'Current Deck', value: deckText });

        const matches: IMatch[] = await Match.find({
            guildId: interaction.guildId!,
            'players.userId': interaction.user.id,
            $nor: [{ 'players.confirmed': false }],
        });

        const wins = matches.filter(
            (match) => match.winnerUserId === interaction.user.id
        ).length;

        const draws = matches.filter((match) => !match.winnerUserId).length;

        const losses = matches.length - wins - draws;

        let matchesPlayedText = `You have played in ${matches.length} game${
            matches.length === 1 ? '' : 's'
        } total`;

        let matchesWonText = `You have won ${wins} game${
            wins === 1 ? '' : 's'
        } total`;

        let matchesDrawnText = `You have had ${draws} draw${
            draws === 1 ? '' : 's'
        } total`;

        let matchesLostText = `You have lost ${losses} game${
            losses === 1 ? '' : 's'
        } total`;

        let winRateText = `You have an overall ${Math.floor(
            (wins / (matches.length || 1)) * 100
        )}% winrate`;

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

            const seasonLosses =
                seasonMatches.length - seasonWins - seasonDraws;

            matchesPlayedText += ` (${seasonMatches.length} this season)`;
            matchesWonText += ` (${seasonWins} this season)`;
            matchesDrawnText += ` (${seasonDraws} this season)`;
            matchesLostText += ` (${seasonLosses} this season)`;
            winRateText += ` (${Math.floor(
                (seasonWins / (seasonMatches.length || 1)) * 100
            )}% this season)`;

            const config = await fetchConfig(interaction.guildId!);

            const points =
                seasonWins * config.pointsGained +
                seasonDraws * config.pointsPerDraw -
                seasonLosses * config.pointsLost;

            const pointsText = `You have ${config.basePoints + points} points.`;

            embed.addFields({ name: 'Points', value: pointsText });
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
    },
};
