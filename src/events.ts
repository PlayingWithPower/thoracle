import { ButtonInteraction, ChatInputCommandInteraction } from 'discord.js';
import { commands } from './commands';
import { IMatch, Match } from './database/Match';
import {
    handleCancelMatch,
    handleConfirmMatch,
    handleDisputeMatch,
} from './events/match';
import { client } from './index';
import { handleError } from './utils/interaction';
import { logger } from './utils/logger';

client.once('ready', () => {
    logger.info(`${client.user!.tag} is now online.`);
});

client.on('interactionCreate', async (interaction) => {
    try {
        if (interaction.isChatInputCommand()) {
            await handleChatInputCommand(interaction);
        } else if (interaction.isButton()) {
            await handleButton(interaction);
        }
    } catch (error) {
        handleError(error, interaction);
    }
});

async function handleChatInputCommand(
    interaction: ChatInputCommandInteraction
) {
    if (!interaction.guildId) {
        return await interaction.reply({
            content: 'This command cannot be run in direct messages.',
            ephemeral: true,
        });
    }

    const command = commands.get(interaction.commandName);
    await command?.execute(interaction);
}

async function handleButton(interaction: ButtonInteraction) {
    if (!interaction.guildId) return;

    const match: IMatch | null = await Match.findOne({
        guildId: interaction.guildId,
        messageId: interaction.message.id,
    });

    if (!match) {
        return await interaction.reply({
            content: 'That match no longer exists.',
            ephemeral: true,
        });
    }

    switch (interaction.customId) {
        case 'confirm':
            await handleConfirmMatch(interaction, match);
            break;

        case 'dispute':
            await handleDisputeMatch(interaction, match);
            break;

        case 'cancel':
            await handleCancelMatch(interaction, match);
            break;
    }
}
