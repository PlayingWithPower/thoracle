import { ChatInputCommandInteraction } from 'discord.js';
import { Command, newCommand } from '../types/Command';
import { logMatch } from '../utils/match';
import { createShutdownWarningEmbed } from '../utils/warning';

const command = newCommand()
    .setName('log')
    .setDescription('Logs a match with you as the winner.')
    .addUserOption((option) =>
        option
            .setName('player-1')
            .setDescription('First player other than you.')
            .setRequired(true)
    )
    .addUserOption((option) =>
        option
            .setName('player-2')
            .setDescription('Second player other than you.')
            .setRequired(true)
    )
    .addUserOption((option) =>
        option
            .setName('player-3')
            .setDescription('Third player other than you.')
            .setRequired(true)
    );

export = <Command>{
    data: command,

    async execute(interaction: ChatInputCommandInteraction) {
        const warningEmbed = createShutdownWarningEmbed();
        await interaction.reply({
            embeds: [warningEmbed],
            ephemeral: true,
        });

        // TEMPORARILY DISABLED - UNCOMMENT TO RESTORE FUNCTIONALITY
        /*
        logMatch(
            interaction,
            [
                interaction.user.id,
                interaction.options.getUser('player-1', true).id,
                interaction.options.getUser('player-2', true).id,
                interaction.options.getUser('player-3', true).id,
            ],
            true
        );
        */
    },
};
