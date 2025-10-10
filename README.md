# Thoracle

The Playing With Power patreon Discord server's bot for managing EDH (Elder Dragon Highlander) gameplay leagues.

Join the Discord server for help and info: https://discord.gg/drrVQNrzGa

## Features

- **Match Logging**: Log 4-player EDH matches with winner tracking
- **Deck Management**: Create, manage, and track multiple decks per player
- **Season Management**: Organize gameplay into seasons with leaderboards
- **Statistics Tracking**: View personal and deck-specific win rates and statistics
- **Leaderboards**: Track player standings with configurable point systems
- **Match Disputes**: Handle match disputes with dedicated threads

## Installation

### Prerequisites

- Node.js (v16 or higher)
- MongoDB database
- Discord Bot Token
- Discord Application with bot permissions

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/thoracle.git
   cd thoracle
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp example.env .env
   ```
   
   Edit `.env` and fill in the required values:
   ```env
   TOKEN=your_discord_bot_token
   CLIENT_ID=your_discord_application_id
   GUILD_ID=your_discord_server_id
   DATABASE_URI=your_mongodb_connection_string
   SUPPORT_SERVER=https://discord.gg/drrVQNrzGa
   ```

4. **Build the project**
   ```bash
   npm run build
   ```

5. **Register slash commands**
   
   For development (guild-specific commands):
   ```bash
   npm run register-dev
   ```
   
   For production (global commands):
   ```bash
   npm run register
   ```

6. **Start the bot**
   ```bash
   npm start
   ```

   For development with auto-restart:
   ```bash
   npm run dev
   ```

### Bot Permissions

The bot requires the following Discord permissions:
- Send Messages
- Use Slash Commands
- Manage Threads (for dispute handling)
- Read Message History
- View Channels

## Usage

### Player Commands

#### `/deck` - Deck Management
- **`/deck create <name> [deck-list]`** - Create a new deck with optional deck list URL
- **`/deck list`** - View all your decks
- **`/deck use <name>`** - Set a deck as your current deck
- **`/deck delete <name>`** - Delete a deck
- **`/deck rename <name> <new-name>`** - Rename a deck
- **`/deck set-list <name> <new-deck-list>`** - Update deck list URL
- **`/deck stats [name]`** - View statistics for a specific deck or current deck

#### `/log` - Log a Win
Log a match where you won against 3 other players.
- **`/log <player-1> <player-2> <player-3>`** - Log a match with you as the winner

#### `/draw` - Log a Draw
Log a match that ended in a draw between all 4 players.
- **`/draw <player-1> <player-2> <player-3>`** - Log a match as a draw

#### `/profile` - View Your Profile
Display your overall statistics including:
- Current deck
- Total matches played
- Win/loss/draw record
- Win rate
- Season points (if in an active season)

#### `/leaderboard [season]` - View Leaderboard
Display the current season leaderboard or a specific season's leaderboard.

#### `/match list [deck] [season]` - View Your Matches
View your match history with optional filtering by deck or season.

#### `/season info [name]` - Season Information
View information about the current season or a specific season.

#### `/season list` - List All Seasons
View all seasons for the server, including their dates and total games played.

#### `/info` - Bot Information
Display information about the bot and support resources.

### Administrator Commands

#### `/config` - Server Configuration
Configure various server settings (requires Manage Server permission):

- **`/config minimum-games [amount]`** - Set minimum games required for leaderboard
- **`/config points-gained [amount]`** - Set points gained per win
- **`/config points-lost [amount]`** - Set points lost per loss
- **`/config points-per-draw [amount]`** - Set points gained per draw
- **`/config enable-draws [enabled]`** - Enable/disable draw logging
- **`/config base-points [amount]`** - Set base points added to displayed values
- **`/config deck-limit [amount]`** - Set maximum decks per player
- **`/config dispute-role [role] [unset]`** - Set role for dispute threads

#### `/season` - Season Management
- **`/season start <name>`** - Start a new season
- **`/season end`** - End the current season

#### `/match` - Match Management
- **`/match pending`** - View pending (unconfirmed) matches
- **`/match disputed`** - View disputed matches
- **`/match accept <match-id>`** - Accept/confirm a match
- **`/match delete <match-id>`** - Delete a match

## Match Flow

1. **Logging**: A player logs a match using `/log` or `/draw`
2. **Confirmation**: Other players in the match receive notifications to confirm
3. **Disputes**: If there's a dispute, a thread is created for resolution
4. **Finalization**: Once all players confirm, the match is finalized and points are awarded

## Deck List Support

The bot supports deck lists from the following platforms:
- Moxfield
- Archidekt
- TappedOut
- Deckstats
- MTGGoldfish

## Development

### Project Structure
```
src/
├── commands/          # Slash command implementations
├── database/          # MongoDB models and schemas
├── events/            # Discord event handlers
├── scripts/           # Command registration scripts
├── types/             # TypeScript type definitions
└── utils/             # Utility functions
```

### Available Scripts
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start the production bot
- `npm run dev` - Start the bot in development mode with auto-restart
- `npm run register` - Register commands globally
- `npm run register-dev` - Register commands for development guild

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Join the Discord server: https://discord.gg/drrVQNrzGa
- Create an issue on GitHub
