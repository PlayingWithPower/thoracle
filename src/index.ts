import { Client, IntentsBitField } from 'discord.js';
import sourceMaps from 'source-map-support';
import { TOKEN } from './env';
import { connection } from './database';
import { logger } from './utils/logger';

sourceMaps.install();

// Initialize Discord API client
export const client = new Client({
    intents: [IntentsBitField.Flags.Guilds, IntentsBitField.Flags.GuildMembers],
});

// Register events
require('./events');

// Login to the bot account
client.login(TOKEN).catch((error) => {
    logger.error('Failed to login to Discord:', error);
    process.exit(1);
});

// Graceful shutdown handler
async function gracefulShutdown(signal: string) {
    logger.info(`${signal} received, shutting down gracefully...`);
    
    try {
        // Destroy the Discord client
        client.destroy();
        logger.info('Discord client destroyed');
        
        // Close database connection
        await connection.close();
        logger.info('Database connection closed');
        
        logger.info('Shutdown complete');
        process.exit(0);
    } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
    }
}

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    gracefulShutdown('UNCAUGHT_EXCEPTION');
});
