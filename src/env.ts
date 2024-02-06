import dotenv from 'dotenv';

// Read environment variables
dotenv.config();

export const TOKEN = process.env.TOKEN!;
if (!TOKEN) throw new Error('Missing `TOKEN` environment variable.');

export const CLIENT_ID = process.env.CLIENT_ID!;
if (!CLIENT_ID) throw new Error('Missing `CLIENT_ID` environment variable.');

export const GUILD_ID = process.env.GUILD_ID!;
if (!GUILD_ID) throw new Error('Missing `GUILD_ID` environment variable.');

export const DATABASE_URI = process.env.DATABASE_URI!;
if (!DATABASE_URI)
    throw new Error('Missing `DATABASE_URI` environment variable.');

export const SUPPORT_SERVER = process.env.SUPPORT_SERVER!;
if (!SUPPORT_SERVER)
    throw new Error('Missing `SUPPORT_SERVER` environment variable.');
