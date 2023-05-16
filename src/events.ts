import { ButtonInteraction } from 'discord.js';
import { IMatch, Match } from './database';
import {
    handleCancelMatch,
    handleConfirmMatch,
    handleDisputeMatch,
} from './events/match';
import { client } from './index';

client.once('ready', () => {
    console.log(`${client.user!.tag} is now online.`);
});

client.on('interactionCreate', async (interaction) => {
    try {
        if (interaction.isButton()) {
            await handleButton(interaction);
        }
    } catch (error) {
        console.error(error);

        if (interaction.isRepliable()) {
            if (interaction.replied || interaction.deferred) {
                await interaction
                    .followUp({
                        content:
                            'An error occurred while executing this command: ' +
                            error,
                        ephemeral: true,
                    })
                    .catch(() => {});
            } else {
                await interaction
                    .reply({
                        content:
                            'An error occurred while executing this command: ' +
                            error,
                        ephemeral: true,
                    })
                    .catch(() => {});
            }
        }
    }
});

async function handleButton(button: ButtonInteraction) {
    const match: IMatch | null = await Match.findOne({
        messageId: button.message.id,
    });

    if (!match) {
        return await button.reply({
            content: 'That match no longer exists.',
            ephemeral: true,
        });
    }

    switch (button.customId) {
        case 'confirm':
            await handleConfirmMatch(button, match);
            break;

        case 'dispute':
            await handleDisputeMatch(button, match);
            break;

        case 'cancel':
            await handleCancelMatch(button, match);
            break;
    }
}
