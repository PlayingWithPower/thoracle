import { registerGlobalCommands } from '../commands';
import { logger } from '../utils/logger';

registerGlobalCommands()
    .then(() => {
        logger.info('Global slash commands have been registered.');
        process.exit(0);
    })
    .catch((error) => {
        logger.error('Failed to register global commands:', error);
        process.exit(1);
    });
