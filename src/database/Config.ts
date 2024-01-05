import { Document, Schema, UpdateQuery } from 'mongoose';
import { connection } from '../database';

export interface IConfig extends Document {
    guildId: string;
    minimumGamesPerPlayer: number;
    pointsGained: number;
    pointsLost: number;
    basePoints: number;
    pointsPerDraw: number;
    enableDraws: boolean;
    deckLimit: number;
    disputeRoleId?: string;
}

const configSchema = new Schema({
    guildId: { type: String, required: true },
    minimumGamesPerPlayer: { type: Number, default: 10 },
    pointsGained: { type: Number, default: 1 },
    pointsLost: { type: Number, default: 0 },
    pointsPerDraw: { type: Number, default: 0 },
    enableDraws: { type: Boolean, default: true },
    basePoints: { type: Number, default: 100 },
    deckLimit: { type: Number, default: 50 },
    disputeRoleId: String,
});

export const Config = connection.model('Config', configSchema);

export async function fetchConfig(
    guildId: string,
    query: UpdateQuery<IConfig> = {}
): Promise<IConfig> {
    return await Config.findOneAndUpdate({ guildId }, query, {
        new: true,
        upsert: true,
    });
}
