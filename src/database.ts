import mongoose from 'mongoose';
import { DATABASE_URI } from './env';
import { logger } from './utils/logger';

export const connection = mongoose.createConnection(DATABASE_URI);

// Handle connection events
connection.on('connected', () => {
    logger.info('MongoDB connection established successfully');
});

connection.on('error', (error) => {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
});

connection.on('disconnected', () => {
    logger.warn('MongoDB connection disconnected');
});

// Handle process termination
process.on('SIGINT', async () => {
    await connection.close();
    logger.info('MongoDB connection closed due to application termination');
    process.exit(0);
});
