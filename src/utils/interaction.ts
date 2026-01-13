import { Interaction } from 'discord.js';
import { logger } from './logger';

export async function handleError(
    error: any,
    interaction: Interaction
): Promise<void> {
    logger.error('Error handling interaction:', error);

    if (!interaction.isRepliable()) return;

    if (interaction.replied || interaction.deferred) {
        await interaction
            .followUp({
                content:
                    'An error occurred while executing this command: ' + error,
                ephemeral: true,
            })
            .catch((err) => logger.error('Failed to send error message:', err));
    } else {
        await interaction
            .reply({
                content:
                    'An error occurred while executing this command: ' + error,
                ephemeral: true,
            })
            .catch((err) => logger.error('Failed to send error message:', err));
    }
}
