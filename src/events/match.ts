import { ButtonInteraction, channelMention, userMention } from 'discord.js';
import { client } from '..';
import { fetchConfig } from '../database/Config';
import { IMatch } from '../database/Match';

export async function handleConfirmMatch(
    interaction: ButtonInteraction,
    match: IMatch
) {
    const matchPlayer = match.players.find(
        (player) => player.userId === interaction.user.id
    );

    if (!matchPlayer) {
        return await interaction.reply({
            content: 'You are not part of this match.',
            ephemeral: true,
        });
    }

    if (matchPlayer.confirmed) {
        return await interaction.reply({
            content: 'You have already confirmed this match.',
            ephemeral: true,
        });
    }

    matchPlayer.confirmed = true;

    match.confirmedAt = new Date();

    await match.save();

    const confirmedPlayers = match.players.filter((player) => player.confirmed);

    if (confirmedPlayers.length === match.players.length) {
        await interaction.reply({
            content: `${match.players
                .map((player) => userMention(player.userId))
                .join(', ')},\nThe match has been confirmed.`,
        });
    } else {
        await interaction.reply({
            content: 'You have confirmed the match.',
            ephemeral: true,
        });
    }

    if (!match.channelId || !match.messageId) return;

    const channel = client.channels.cache.get(match.channelId);

    if (channel?.isTextBased()) {
        const message = await channel.messages
            .fetch(match.messageId)
            .catch(() => null);
        if (!message) return;

        const embed = message.embeds[0];
        const field = embed.fields[embed.fields.length - 1];

        field.value = `The following players have confirmed the match: ${confirmedPlayers
            .map((player) => userMention(player.userId))
            .join(', ')}.`;

        await message.edit({
            embeds: [embed],
            components:
                confirmedPlayers.length === match.players.length
                    ? []
                    : undefined,
        });
    }
}

export async function handleDisputeMatch(
    interaction: ButtonInteraction,
    match: IMatch
) {
    if (!interaction.guild) return;

    const config = await fetchConfig(interaction.guildId!);

    const matchPlayer = match.players.find(
        (player) => player.userId === interaction.user.id
    );

    if (!matchPlayer) {
        return await interaction.reply({
            content: 'You are not part of this match.',
            ephemeral: true,
        });
    }

    if (match.disputeThreadId) {
        return await interaction.reply({
            content: `This match has already been disputed in ${channelMention(
                match.disputeThreadId
            )}.`,
            ephemeral: true,
        });
    }

    if (!match.channelId) {
        return await interaction.reply({
            content: 'There is no channel for that match.',
            ephemeral: true,
        });
    }

    if (!match.messageId) {
        return await interaction.reply({
            content: 'There is no message for that match.',
            ephemeral: true,
        });
    }

    const channel = client.channels.cache.get(match.channelId);

    if (!channel) {
        return await interaction.reply({
            content: 'The match channel does not exist.',
            ephemeral: true,
        });
    }

    if (!channel.isTextBased()) {
        return await interaction.reply({
            content: 'The match channel is not text based.',
            ephemeral: true,
        });
    }

    const message = await channel.messages
        .fetch(match.messageId)
        .catch(() => null);

    if (!message) {
        return await interaction.reply({
            content: 'The message could not be found.',
            ephemeral: true,
        });
    }

    const thread = await message.startThread({ name: 'Match Dispute' });

    match.disputeThreadId = thread.id;

    await match.save();

    for (const player of match.players) {
        await thread.members.add(player.userId).catch(() => null);
    }

    if (config.disputeRoleId) {
        const role = await interaction.guild.roles
            .fetch(config.disputeRoleId)
            .catch(() => null);

        if (role) {
            for (const userId of role.members.keys()) {
                await thread.members.add(userId).catch(() => null);
            }
        }
    }

    await thread.send(
        `${userMention(
            interaction.user.id
        )} please explain your reasoning for disputing this match.`
    );

    await interaction.reply({
        content: 'The match dispute thread has been created.',
        ephemeral: true,
    });
}

export async function handleCancelMatch(
    interaction: ButtonInteraction,
    match: IMatch
) {
    if (interaction.user.id !== match.players[0]?.userId) {
        return await interaction.reply({
            content: 'You did not log this match.',
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
        content: 'The match has been cancelled.',
        ephemeral: true,
    });
}
