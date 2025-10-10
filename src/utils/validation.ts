export const validHosts = [
    'tappedout.net',
    'deckstats.net',
    'aetherhub.com',
    'moxfield.com',
    'tcgplayer.com',
    'archidekt.com',
    'scryfall.com',
];

export function validateDeckList(deckList: string): boolean {
    try {
        const hostname = new URL(deckList).hostname
            .replace(/^www\./, '')
            .toLowerCase();

        return validHosts.includes(hostname);
    } catch (error) {
        // Invalid URL format
        return false;
    }
}
