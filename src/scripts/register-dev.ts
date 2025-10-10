import { registerGuildCommands } from '../commands';
import { logger } from '../utils/logger';

registerGuildCommands()
    .then(() => {
        logger.info('Guild slash commands have been registered.');
        process.exit(0);
    })
    .catch((error) => {
        logger.error('Failed to register guild commands:', error);
        process.exit(1);
    });
