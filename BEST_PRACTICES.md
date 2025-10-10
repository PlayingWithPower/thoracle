# Discord Bot Best Practices - Thoracle

## ✅ Applied Improvements

This document summarizes the Discord.js and TypeScript best practices applied to this project.

### 1. **Database Connection Management**
- ✅ Added MongoDB connection event listeners (`connected`, `error`, `disconnected`)
- ✅ Implemented graceful database shutdown on SIGINT
- ✅ Added error handling that exits the process on critical database errors

**Location:** `src/database.ts`

### 2. **Application Lifecycle Management**
- ✅ Implemented graceful shutdown handlers for SIGTERM and SIGINT
- ✅ Added proper cleanup for Discord client and database connections
- ✅ Configured uncaught exception and unhandled rejection handlers
- ✅ Added error handling for Discord login failures

**Location:** `src/index.ts`

### 3. **Error Handling**
- ✅ Fixed missing `await` keywords in async command executions (`log.ts`, `draw.ts`)
- ✅ Added try-catch block for URL validation to prevent crashes on invalid URLs
- ✅ Implemented comprehensive error logging throughout the application

**Locations:** `src/commands/log.ts`, `src/commands/draw.ts`, `src/utils/validation.ts`

### 4. **Logging Infrastructure**
- ✅ Created a centralized logging utility with timestamp formatting
- ✅ Replaced all `console.log`, `console.error`, and `console.warn` with logger
- ✅ Added log levels (ERROR, WARN, INFO, DEBUG)
- ✅ Environment-aware debug logging

**Location:** `src/utils/logger.ts`

### 5. **TypeScript Configuration**
- ✅ Enhanced `tsconfig.json` with additional compiler options:
  - `rootDir` and `exclude` for better project structure
  - `allowSyntheticDefaultImports` for better module imports
  - `resolveJsonModule` for JSON imports
  - `forceConsistentCasingInFileNames` to prevent cross-platform issues
  - `skipLibCheck` for faster compilation
- ✅ Maintained strict type checking without breaking existing code

**Location:** `tsconfig.json`

### 6. **Package Management**
- ✅ Fixed all 8 security vulnerabilities in dependencies
- ✅ Added `@types/node` for better TypeScript support
- ✅ Added metadata (keywords, engines)
- ✅ Added `clean` script for build artifacts

**Location:** `package.json`

### 7. **Version Control**
- ✅ Enhanced `.gitignore` with comprehensive patterns for:
  - IDE/editor files
  - Log files
  - OS-specific files
  - TypeScript cache
  - Coverage reports

**Location:** `.gitignore`

---

## 📋 Current Implementation Status

### What You're Doing Well ✅

1. **Discord.js v14** - Using the latest major version
2. **Slash Commands** - Properly implemented with builders
3. **Command Architecture** - Good separation with Collection-based storage
4. **Event Handling** - Proper interaction handling with type guards
5. **Database Models** - Well-structured Mongoose schemas
6. **Ephemeral Messages** - Using ephemeral flags for error messages
7. **Button Interactions** - Properly implemented with custom IDs
8. **TypeScript Strict Mode** - Enabled with good type safety
9. **Environment Variables** - Validated at startup with proper error messages
10. **Source Maps** - Enabled for better debugging

### Potential Future Improvements 🔄

#### 1. **Rate Limiting & API Error Handling**
Consider adding retry logic for Discord API failures:
```typescript
// Example implementation
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

async function retryDiscordAction<T>(
    action: () => Promise<T>,
    retries = MAX_RETRIES
): Promise<T> {
    try {
        return await action();
    } catch (error) {
        if (retries > 0 && isRetryableError(error)) {
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            return retryDiscordAction(action, retries - 1);
        }
        throw error;
    }
}
```

#### 2. **Command Cooldowns**
Add cooldown tracking to prevent command spam:
```typescript
const cooldowns = new Collection<string, Collection<string, number>>();
```

#### 3. **Permission Checks**
Add guild permission validation for admin commands:
```typescript
if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
    return await interaction.reply({
        content: 'You need Administrator permission to use this command.',
        ephemeral: true
    });
}
```

#### 4. **Database Indexing**
Add indexes to frequently queried fields for better performance:
```typescript
matchSchema.index({ guildId: 1, season: 1 });
matchSchema.index({ messageId: 1 });
configSchema.index({ guildId: 1 }, { unique: true });
```

#### 5. **Input Sanitization**
Add validation for user inputs (deck names, season names):
```typescript
function sanitizeInput(input: string): string {
    return input.trim().substring(0, 100); // Limit length
}
```

#### 6. **Pagination for Large Results**
Implement pagination for leaderboards and deck lists:
```typescript
// Use Discord's built-in pagination or custom implementation
```

#### 7. **Health Check Endpoint**
Add an HTTP health check for monitoring (optional):
```typescript
import http from 'http';

const server = http.createServer((req, res) => {
    if (req.url === '/health') {
        res.writeHead(200);
        res.end('OK');
    }
});
```

#### 8. **Structured Logging**
Consider upgrading to a professional logging library like `winston` or `pino`:
```bash
npm install winston
```

#### 9. **Environment-Specific Configuration**
Add NODE_ENV handling:
```typescript
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';
```

#### 10. **Command Usage Analytics**
Track command usage for monitoring:
```typescript
// Log command usage to database or external service
```

---

## 🚀 Deployment Best Practices

### Environment Variables
Ensure all required environment variables are set in production:
```env
TOKEN=your_bot_token
CLIENT_ID=your_application_id
GUILD_ID=your_server_id (for guild commands)
DATABASE_URI=mongodb://...
SUPPORT_SERVER=https://discord.gg/...
NODE_ENV=production
```

### Process Management
Use a process manager like PM2 for production:
```bash
npm install -g pm2
pm2 start dist/index.js --name thoracle
pm2 startup
pm2 save
```

Or use Docker:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
CMD ["node", "dist/index.js"]
```

### MongoDB Best Practices
1. Use connection pooling (Mongoose handles this by default)
2. Set up replica sets for high availability
3. Enable authentication
4. Use MongoDB Atlas for managed hosting
5. Set up backups

### Discord Bot Hosting
Recommended platforms:
- **Railway** - Easy deployment with MongoDB add-on
- **Heroku** - Free tier available (worker dyno)
- **DigitalOcean** - App Platform or Droplets
- **AWS/GCP/Azure** - For enterprise deployments
- **Dedicated VPS** - For full control

### Monitoring
Consider adding:
- Uptime monitoring (UptimeRobot, Pingdom)
- Error tracking (Sentry)
- Performance monitoring (New Relic, DataDog)
- Log aggregation (Papertrail, Loggly)

### Security Checklist
- ✅ Never commit `.env` file
- ✅ Use environment variables for all secrets
- ✅ Keep dependencies updated (`npm audit`)
- ✅ Use HTTPS for all external API calls
- ✅ Validate and sanitize all user inputs
- ✅ Implement rate limiting
- ✅ Use least-privilege principle for database users
- ✅ Regular security audits

---

## 📚 Additional Resources

### Discord.js Documentation
- [Official Guide](https://discordjs.guide/)
- [API Documentation](https://discord.js.org/)
- [Discord Developer Portal](https://discord.com/developers/docs)

### TypeScript Best Practices
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TypeScript Do's and Don'ts](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)

### MongoDB & Mongoose
- [Mongoose Documentation](https://mongoosejs.com/docs/guide.html)
- [MongoDB Best Practices](https://www.mongodb.com/docs/manual/administration/production-notes/)

### Node.js Best Practices
- [Node.js Best Practices Repository](https://github.com/goldbergyoni/nodebestpractices)

---

## 🔧 Maintenance

### Regular Tasks
1. **Weekly:** Check for dependency updates
   ```bash
   npm outdated
   npm update
   ```

2. **Monthly:** Security audit
   ```bash
   npm audit
   npm audit fix
   ```

3. **Before Major Releases:**
   - Full test of all commands
   - Database backup
   - Review error logs
   - Performance profiling

### Troubleshooting

#### Bot Not Responding
1. Check bot is online in Discord Developer Portal
2. Verify TOKEN is correct
3. Check database connection
4. Review logs for errors

#### Database Connection Issues
1. Verify DATABASE_URI is correct
2. Check MongoDB server is running
3. Verify network connectivity
4. Check database user permissions

#### Slash Commands Not Showing
1. Re-register commands: `npm run register-dev`
2. Wait up to 1 hour for global commands to propagate
3. Check bot has appropriate permissions in server

---

## 📝 Code Review Checklist

When adding new features:
- [ ] Add TypeScript types for all parameters and returns
- [ ] Handle all error cases with try-catch
- [ ] Use ephemeral messages for errors
- [ ] Add appropriate logging statements
- [ ] Validate user inputs
- [ ] Update this documentation if needed
- [ ] Test in development before production
- [ ] Use the logger utility instead of console methods

---

*Last Updated: October 10, 2025*
*Maintained by: Brandon Haggstrom (@Rigidity)*

