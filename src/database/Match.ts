import { Document, Schema, Types } from 'mongoose';
import { connection } from '../database';

export interface IMatch extends Document {
    guildId: string;
    channelId?: string;
    messageId?: string;
    winnerUserId?: string;
    disputeThreadId?: string;
    season: Types.ObjectId;
    players: IMatchPlayer[];
    confirmedAt?: Date;
}

export interface IMatchPlayer {
    userId: string;
    deck?: Types.ObjectId;
    confirmed: boolean;
}

const matchSchema = new Schema({
    guildId: { type: String, required: true },
    channelId: String,
    messageId: String,
    winnerUserId: String,
    disputeThreadId: String,
    season: { type: Schema.Types.ObjectId, ref: 'Season', required: true },
    players: [
        {
            userId: { type: String, required: true },
            deck: { type: Schema.Types.ObjectId, ref: 'Deck' },
            confirmed: { type: Boolean, default: false },
        },
    ],
    confirmedAt: Date,
});

export const Match = connection.model('Match', matchSchema);
